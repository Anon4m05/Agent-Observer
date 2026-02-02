const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-observatory-key',
};

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// RATE LIMITING - Three-tier system
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMITS = {
  read: { limit: 30, window: 60000 },     // 30/min
  action: { limit: 10, window: 60000 },   // 10/min  
  scrape: { limit: 1, window: 300000 },   // 1 per 5 min
};

const rateLimiters = {
  read: new Map<string, RateLimitEntry>(),
  action: new Map<string, RateLimitEntry>(),
  scrape: new Map<string, RateLimitEntry>(),
};

type RateLimitTier = keyof typeof rateLimiters;

function checkRateLimit(ip: string, tier: RateLimitTier): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const config = RATE_LIMITS[tier];
  const limiter = rateLimiters[tier];
  const entry = limiter.get(ip);
  
  if (!entry || now > entry.resetAt) {
    limiter.set(ip, { count: 1, resetAt: now + config.window });
    return { allowed: true };
  }
  
  if (entry.count >= config.limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  
  entry.count++;
  return { allowed: true };
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  timestamp: string;
  data: T;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface ApiError {
  success: false;
  error: string;
  code: string;
}

function successResponse<T>(data: T, pagination?: ApiResponse<T>['pagination']): Response {
  const body: ApiResponse<T> = {
    success: true,
    timestamp: new Date().toISOString(),
    data,
    ...(pagination && { pagination }),
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
}

function errorResponse(error: string, code: string, status: number): Response {
  const body: ApiError = { success: false, error, code };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function rateLimitResponse(retryAfter: number, tier: string): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: `Rate limit exceeded for ${tier} endpoints.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retry_after: retryAfter,
    }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ============================================================================
// READ ENDPOINT HANDLERS
// ============================================================================

async function getSummary(supabase: SupabaseClient) {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const [postsResult, agentsResult, commentsResult, submoltsResult] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase.from('agents').select('id', { count: 'exact', head: true }),
    supabase.from('comments').select('id', { count: 'exact', head: true }),
    supabase.from('submolts').select('id', { count: 'exact', head: true }),
  ]);

  const [recentPostsCount, newAgentsCount] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }).gte('posted_at', yesterday.toISOString()),
    supabase.from('agents').select('id', { count: 'exact', head: true }).gte('first_seen_at', yesterday.toISOString()),
  ]);

  const { data: activeSubmolts } = await supabase
    .from('posts')
    .select('submolt_id, submolts(name)')
    .gte('posted_at', yesterday.toISOString())
    .not('submolt_id', 'is', null)
    .limit(100);

  const submoltCounts = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeSubmolts?.forEach((p: any) => {
    const name = p.submolts?.name;
    if (name) submoltCounts.set(name, (submoltCounts.get(name) || 0) + 1);
  });
  const topSubmolts = [...submoltCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name);

  const { data: topAgents } = await supabase
    .from('agents')
    .select('id, username, post_count, comment_count, first_seen_at')
    .order('post_count', { ascending: false, nullsFirst: false })
    .limit(10);

  const notableAgents = await Promise.all((topAgents || []).map(async (agent) => {
    const { data: agentPosts } = await supabase
      .from('posts')
      .select('upvotes, comment_count, word_count, unique_words')
      .eq('agent_id', agent.id);

    const posts = agentPosts || [];
    const totalUpvotes = posts.reduce((sum, p) => sum + (p.upvotes || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comment_count || 0), 0);
    const avgWordCount = posts.length > 0 ? posts.reduce((sum, p) => sum + (p.word_count || 0), 0) / posts.length : 0;
    const vocabDiversity = posts.length > 0
      ? posts.reduce((sum, p) => sum + ((p.unique_words || 0) / (p.word_count || 1)), 0) / posts.length : 0;

    return {
      username: agent.username,
      post_count: agent.post_count || 0,
      avg_engagement: posts.length > 0 ? (totalUpvotes + totalComments) / posts.length : 0,
      first_seen: agent.first_seen_at,
      behavioral_signature: {
        vocabulary_diversity: Math.round(vocabDiversity * 100) / 100,
        avg_post_length: Math.round(avgWordCount),
        engagement_ratio: posts.length > 0 ? Math.round(((totalUpvotes + totalComments) / posts.length) * 100) / 100 : 0,
      },
    };
  }));

  const { data: recentPosts } = await supabase
    .from('posts')
    .select('title, upvotes, comment_count, posted_at, agents(username), submolts(name)')
    .order('posted_at', { ascending: false, nullsFirst: false })
    .limit(10);

  return {
    timestamp: now.toISOString(),
    ecosystem: {
      total_posts: postsResult.count || 0,
      total_agents: agentsResult.count || 0,
      total_comments: commentsResult.count || 0,
      total_submolts: submoltsResult.count || 0,
    },
    recent_activity: {
      posts_24h: recentPostsCount.count || 0,
      new_agents_24h: newAgentsCount.count || 0,
      most_active_submolts: topSubmolts,
    },
    notable_agents: notableAgents.filter(a => a.post_count > 0),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recent_posts: (recentPosts || []).map((p: any) => ({
      title: p.title || 'Untitled',
      agent: p.agents?.username || 'unknown',
      submolt: p.submolts?.name || null,
      upvotes: p.upvotes || 0,
      comments: p.comment_count || 0,
      posted_at: p.posted_at,
    })),
  };
}

async function getAgents(supabase: SupabaseClient, params: URLSearchParams) {
  const limit = Math.min(Math.max(1, parseInt(params.get('limit') || '50', 10)), 100);
  const offset = Math.max(0, parseInt(params.get('offset') || '0', 10));
  const sort = params.get('sort') || 'recent';
  const since = params.get('since');

  // Get total count
  let countQuery = supabase.from('agents').select('id', { count: 'exact', head: true });
  if (since) countQuery = countQuery.gte('last_seen_at', since);
  const { count: total } = await countQuery;

  // Build query with sorting
  let query = supabase.from('agents').select('id, username, display_name, bio, post_count, comment_count, first_seen_at, last_seen_at, metadata');
  
  if (since) query = query.gte('last_seen_at', since);
  
  switch (sort) {
    case 'karma':
    case 'posts':
      query = query.order('post_count', { ascending: false, nullsFirst: false });
      break;
    case 'engagement':
      query = query.order('comment_count', { ascending: false, nullsFirst: false });
      break;
    case 'recent':
    default:
      query = query.order('last_seen_at', { ascending: false, nullsFirst: false });
  }
  
  query = query.range(offset, offset + limit - 1);
  const { data: agents } = await query;

  const agentsWithBehavior = await Promise.all((agents || []).map(async (agent) => {
    const { data: posts } = await supabase
      .from('posts')
      .select('word_count, unique_words, upvotes, comment_count, submolt_id, submolts(name)')
      .eq('agent_id', agent.id);

    const postList = posts || [];
    const firstSeen = new Date(agent.first_seen_at);
    const lastSeen = agent.last_seen_at ? new Date(agent.last_seen_at) : new Date();
    const activeDays = Math.max(1, Math.ceil((lastSeen.getTime() - firstSeen.getTime()) / (86400000)));

    const totalUpvotes = postList.reduce((sum, p) => sum + (p.upvotes || 0), 0);
    const totalWordCount = postList.reduce((sum, p) => sum + (p.word_count || 0), 0);
    const totalUniqueWords = postList.reduce((sum, p) => sum + (p.unique_words || 0), 0);

    const submoltCounts = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    postList.forEach((p: any) => {
      const name = p.submolts?.name;
      if (name) submoltCounts.set(name, (submoltCounts.get(name) || 0) + 1);
    });
    const primarySubmolt = [...submoltCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Calculate karma (upvotes - assume no explicit karma field)
    const karma = totalUpvotes;
    
    // Check if claimed (stored in metadata)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claimed = (agent.metadata as any)?.claimed === true;

    return {
      id: agent.id,
      username: agent.username,
      display_name: agent.display_name,
      bio: agent.bio,
      post_count: agent.post_count || 0,
      comment_count: agent.comment_count || 0,
      karma,
      first_seen: agent.first_seen_at,
      last_seen: agent.last_seen_at,
      behavioral_signature: {
        vocabulary_diversity: totalWordCount > 0 ? Math.round((totalUniqueWords / totalWordCount) * 100) / 100 : 0,
        avg_post_length: postList.length > 0 ? Math.round(totalWordCount / postList.length) : 0,
        posts_per_day: Math.round(((agent.post_count || 0) / activeDays) * 100) / 100,
        engagement_ratio: postList.length > 0 ? Math.round((totalUpvotes / postList.length) * 100) / 100 : 0,
      },
      primary_submolt: primarySubmolt,
      claimed_status: claimed ? 'claimed' : 'unclaimed',
    };
  }));

  return {
    agents: agentsWithBehavior,
    pagination: {
      total: total || 0,
      limit,
      offset,
      has_more: offset + limit < (total || 0),
    },
  };
}

async function getPosts(supabase: SupabaseClient, params: URLSearchParams) {
  const limit = Math.min(Math.max(1, parseInt(params.get('limit') || '50', 10)), 100);
  const offset = Math.max(0, parseInt(params.get('offset') || '0', 10));
  const sort = params.get('sort') || 'new';
  const since = params.get('since');
  const submolt = params.get('submolt');
  const agent = params.get('agent');

  // Get total count
  let countQuery = supabase.from('posts').select('id', { count: 'exact', head: true });
  if (since) countQuery = countQuery.gte('posted_at', since);
  if (submolt) {
    const { data: submoltData } = await supabase.from('submolts').select('id').eq('name', submolt).single();
    if (submoltData) countQuery = countQuery.eq('submolt_id', submoltData.id);
  }
  if (agent) {
    const { data: agentData } = await supabase.from('agents').select('id').eq('username', agent).single();
    if (agentData) countQuery = countQuery.eq('agent_id', agentData.id);
  }
  const { count: total } = await countQuery;

  // Build query
  let query = supabase.from('posts').select(`
    id, title, content, url, upvotes, downvotes, comment_count, word_count, posted_at,
    agents(username, display_name),
    submolts(name)
  `);

  if (since) query = query.gte('posted_at', since);
  if (submolt) {
    const { data: submoltData } = await supabase.from('submolts').select('id').eq('name', submolt).single();
    if (submoltData) query = query.eq('submolt_id', submoltData.id);
  }
  if (agent) {
    const { data: agentData } = await supabase.from('agents').select('id').eq('username', agent).single();
    if (agentData) query = query.eq('agent_id', agentData.id);
  }

  switch (sort) {
    case 'top':
      query = query.order('upvotes', { ascending: false, nullsFirst: false });
      break;
    case 'discussed':
      query = query.order('comment_count', { ascending: false, nullsFirst: false });
      break;
    case 'new':
    default:
      query = query.order('posted_at', { ascending: false, nullsFirst: false });
  }

  query = query.range(offset, offset + limit - 1);
  const { data: posts } = await query;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedPosts = (posts || []).map((p: any) => ({
    id: p.id,
    title: p.title || 'Untitled',
    content: p.content, // Full content as requested
    url: p.url,
    agent: p.agents?.username || 'unknown',
    agent_display_name: p.agents?.display_name || null,
    submolt: p.submolts?.name || null,
    upvotes: p.upvotes || 0,
    downvotes: p.downvotes || 0,
    comment_count: p.comment_count || 0,
    word_count: p.word_count || 0,
    posted_at: p.posted_at,
  }));

  return {
    posts: formattedPosts,
    pagination: {
      total: total || 0,
      limit,
      offset,
      has_more: offset + limit < (total || 0),
    },
  };
}

async function getComments(supabase: SupabaseClient, params: URLSearchParams) {
  const postId = params.get('post_id');
  if (!postId) {
    throw new Error('post_id parameter is required');
  }

  const limit = Math.min(Math.max(1, parseInt(params.get('limit') || '100', 10)), 100);

  // Verify post exists
  const { data: post } = await supabase.from('posts').select('id').eq('id', postId).single();
  if (!post) {
    throw new Error('Post not found');
  }

  const { data: comments, count } = await supabase
    .from('comments')
    .select(`
      id, content, upvotes, downvotes, posted_at, parent_comment_id, reply_depth,
      agents(username, display_name)
    `, { count: 'exact' })
    .eq('post_id', postId)
    .order('posted_at', { ascending: true })
    .limit(limit);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedComments = (comments || []).map((c: any) => ({
    id: c.id,
    content: c.content,
    agent: c.agents?.username || 'unknown',
    agent_display_name: c.agents?.display_name || null,
    parent_id: c.parent_comment_id,
    reply_depth: c.reply_depth || 0,
    upvotes: c.upvotes || 0,
    downvotes: c.downvotes || 0,
    posted_at: c.posted_at,
  }));

  return {
    comments: formattedComments,
    pagination: {
      total: count || 0,
      limit,
      offset: 0,
      has_more: limit < (count || 0),
    },
  };
}

async function getSubmolts(supabase: SupabaseClient, params: URLSearchParams) {
  const limit = Math.min(Math.max(1, parseInt(params.get('limit') || '50', 10)), 100);
  const sort = params.get('sort') || 'members';

  const { data: submolts, count } = await supabase
    .from('submolts')
    .select('id, name, description, member_count, first_seen_at, last_scraped_at', { count: 'exact' });

  // Get post counts for each submolt
  const submoltsWithCounts = await Promise.all((submolts || []).map(async (s) => {
    const { count: postCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('submolt_id', s.id);

    return {
      id: s.id,
      name: s.name,
      description: s.description,
      member_count: s.member_count || 0,
      post_count: postCount || 0,
      created_at: s.first_seen_at,
      last_activity: s.last_scraped_at,
    };
  }));

  // Sort
  switch (sort) {
    case 'activity':
      submoltsWithCounts.sort((a, b) => b.post_count - a.post_count);
      break;
    case 'recent':
      submoltsWithCounts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'members':
    default:
      submoltsWithCounts.sort((a, b) => b.member_count - a.member_count);
  }

  return {
    submolts: submoltsWithCounts.slice(0, limit),
    pagination: {
      total: count || 0,
      limit,
      offset: 0,
      has_more: limit < (count || 0),
    },
  };
}

async function getAlerts(supabase: SupabaseClient) {
  // Claude's alerts are identified by metadata or a special system user
  // For now, fetch all alerts since we're using service role
  
  const { data: rules } = await supabase
    .from('alert_rules')
    .select('id, name, type, target, threshold, enabled, created_at, updated_at')
    .order('created_at', { ascending: false });

  const { data: triggered } = await supabase
    .from('alerts')
    .select('id, title, message, severity, created_at, read, rule_id, post_id, agent_id')
    .order('created_at', { ascending: false })
    .limit(100);

  const unreadCount = (triggered || []).filter(a => !a.read).length;

  return {
    rules: rules || [],
    triggered: triggered || [],
    unread_count: unreadCount,
  };
}

async function getScrapeJobs(supabase: SupabaseClient, params: URLSearchParams) {
  const limit = Math.min(Math.max(1, parseInt(params.get('limit') || '20', 10)), 50);

  const { data: jobs, count } = await supabase
    .from('scrape_jobs')
    .select('id, status, scope, target_id, posts_scraped, comments_scraped, agents_discovered, started_at, completed_at, error_message, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit);

  const formattedJobs = (jobs || []).map(j => ({
    job_id: j.id,
    status: j.status,
    scope: j.scope,
    target_id: j.target_id,
    posts_scraped: j.posts_scraped || 0,
    comments_scraped: j.comments_scraped || 0,
    agents_discovered: j.agents_discovered || 0,
    started_at: j.started_at,
    completed_at: j.completed_at,
    error_message: j.error_message,
    created_at: j.created_at,
  }));

  return {
    jobs: formattedJobs,
    pagination: {
      total: count || 0,
      limit,
      offset: 0,
      has_more: limit < (count || 0),
    },
  };
}

async function search(supabase: SupabaseClient, params: URLSearchParams) {
  const query = params.get('q');
  if (!query || query.trim().length < 2) {
    throw new Error('Query parameter "q" must be at least 2 characters');
  }

  const type = params.get('type') || 'all';
  const searchTerm = `%${query.trim().toLowerCase()}%`;

  const results: {
    posts: Array<{ id: string; title: string; agent: string; submolt: string | null; posted_at: string }>;
    agents: Array<{ id: string; username: string; display_name: string | null; post_count: number }>;
    submolts: Array<{ id: string; name: string; description: string | null; member_count: number }>;
  } = { posts: [], agents: [], submolts: [] };

  if (type === 'all' || type === 'posts') {
    const { data: posts } = await supabase
      .from('posts')
      .select('id, title, posted_at, agents(username), submolts(name)')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .limit(20);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    results.posts = (posts || []).map((p: any) => ({
      id: p.id,
      title: p.title || 'Untitled',
      agent: p.agents?.username || 'unknown',
      submolt: p.submolts?.name || null,
      posted_at: p.posted_at,
    }));
  }

  if (type === 'all' || type === 'agents') {
    const { data: agents } = await supabase
      .from('agents')
      .select('id, username, display_name, post_count')
      .or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm},bio.ilike.${searchTerm}`)
      .limit(20);

    results.agents = (agents || []).map(a => ({
      id: a.id,
      username: a.username,
      display_name: a.display_name,
      post_count: a.post_count || 0,
    }));
  }

  if (type === 'all' || type === 'submolts') {
    const { data: submolts } = await supabase
      .from('submolts')
      .select('id, name, description, member_count')
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(20);

    results.submolts = (submolts || []).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      member_count: s.member_count || 0,
    }));
  }

  return {
    query,
    type,
    results,
    total_results: results.posts.length + results.agents.length + results.submolts.length,
  };
}

// ============================================================================
// ACTION ENDPOINT HANDLERS
// ============================================================================

async function triggerScrape(supabase: SupabaseClient, body: { scope?: string; target_id?: string }) {
  const scope = body.scope || 'full';
  const validScopes = ['full', 'submolt', 'agent'];
  
  if (!validScopes.includes(scope)) {
    throw new Error(`Invalid scope. Must be one of: ${validScopes.join(', ')}`);
  }

  if ((scope === 'submolt' || scope === 'agent') && !body.target_id) {
    throw new Error('target_id is required for submolt or agent scope');
  }

  // Create a system user ID for Claude-triggered scrapes
  // We'll use a deterministic UUID based on "claude-observatory"
  const claudeUserId = '00000000-0000-0000-0000-000000000001';

  // Check if there's a running scrape already
  const { data: runningJobs } = await supabase
    .from('scrape_jobs')
    .select('id')
    .in('status', ['pending', 'running'])
    .limit(1);

  if (runningJobs && runningJobs.length > 0) {
    throw new Error('A scrape job is already in progress');
  }

  // Create new scrape job
  const { data: job, error } = await supabase
    .from('scrape_jobs')
    .insert({
      user_id: claudeUserId,
      scope,
      target_id: body.target_id || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create scrape job:', error);
    throw new Error('Failed to create scrape job');
  }

  // Trigger the scrape function asynchronously
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  fetch(`${supabaseUrl}/functions/v1/moltbook-scrape`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      job_id: job.id,
      scope,
      target_id: body.target_id,
    }),
  }).catch(err => console.error('Failed to trigger scrape:', err));

  return {
    job_id: job.id,
    status: 'started',
    scope,
    target_id: body.target_id || null,
  };
}

async function createAlertRule(supabase: SupabaseClient, body: { name: string; type: string; target: string; threshold?: number }) {
  if (!body.name || !body.type || !body.target) {
    throw new Error('name, type, and target are required');
  }

  const validTypes = ['keyword', 'agent', 'submolt', 'engagement'];
  if (!validTypes.includes(body.type)) {
    throw new Error(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
  }

  // System user ID for Claude's alert rules
  const claudeUserId = '00000000-0000-0000-0000-000000000001';

  const { data: rule, error } = await supabase
    .from('alert_rules')
    .insert({
      user_id: claudeUserId,
      name: body.name,
      type: body.type,
      target: body.target,
      threshold: body.threshold || null,
      enabled: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create alert rule:', error);
    throw new Error('Failed to create alert rule');
  }

  return {
    rule_id: rule.id,
    created: true,
    name: rule.name,
    type: rule.type,
    target: rule.target,
    threshold: rule.threshold,
  };
}

async function markAlertsRead(supabase: SupabaseClient, body: { alert_ids?: string[]; all?: boolean }) {
  if (!body.alert_ids && !body.all) {
    throw new Error('Either alert_ids array or all:true is required');
  }

  let updated = 0;

  if (body.all) {
    const { data } = await supabase
      .from('alerts')
      .update({ read: true })
      .eq('read', false)
      .select('id');
    updated = data?.length || 0;
  } else if (body.alert_ids && body.alert_ids.length > 0) {
    const { data } = await supabase
      .from('alerts')
      .update({ read: true })
      .in('id', body.alert_ids)
      .select('id');
    updated = data?.length || 0;
  }

  return {
    updated_count: updated,
    marked_all: body.all || false,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('cf-connecting-ip') 
    || 'unknown';

  try {
    const url = new URL(req.url);
    const isPost = req.method === 'POST';
    const view = url.searchParams.get('view');
    const action = url.searchParams.get('action');

    // Determine endpoint type for rate limiting
    const endpointType: RateLimitTier = action === 'scrape' ? 'scrape' : (isPost ? 'action' : 'read');

    // Check rate limit
    const rateCheck = checkRateLimit(clientIP, endpointType);
    if (!rateCheck.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}, tier: ${endpointType}`);
      return rateLimitResponse(rateCheck.retryAfter || 60, endpointType);
    }

    // Authentication - required for all endpoints
    // Accept auth via header OR query param
    const obsKey = req.headers.get('x-observatory-key') || url.searchParams.get('key');
    const expectedKey = Deno.env.get('CLAUDE_OBSERVATORY_KEY');

    if (!obsKey || obsKey !== expectedKey) {
      console.log(`Auth failed for IP: ${clientIP}`);
      return errorResponse(
        'Authentication required. Provide valid x-observatory-key header or key query parameter.',
        'UNAUTHORIZED',
        401
      );
    }

    console.log(`Observatory request: method=${req.method}, view=${view}, action=${action}, ip=${clientIP}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle POST actions
    if (isPost && action) {
      const body = await req.json().catch(() => ({}));

      switch (action) {
        case 'scrape': {
          const result = await triggerScrape(supabase, body);
          return successResponse(result);
        }
        case 'create_alert': {
          const result = await createAlertRule(supabase, body);
          return successResponse(result);
        }
        case 'mark_alerts_read': {
          const result = await markAlertsRead(supabase, body);
          return successResponse(result);
        }
        default:
          return errorResponse(
            `Unknown action: ${action}`,
            'INVALID_ACTION',
            400
          );
      }
    }

    // Handle GET views
    if (req.method !== 'GET') {
      return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
    }

    const viewName = view || 'summary';
    const params = url.searchParams;

    switch (viewName) {
      case 'summary': {
        const data = await getSummary(supabase);
        return successResponse(data);
      }
      case 'agents': {
        const result = await getAgents(supabase, params);
        return successResponse(result.agents, result.pagination);
      }
      case 'posts': {
        const result = await getPosts(supabase, params);
        return successResponse(result.posts, result.pagination);
      }
      case 'comments': {
        const result = await getComments(supabase, params);
        return successResponse(result.comments, result.pagination);
      }
      case 'submolts': {
        const result = await getSubmolts(supabase, params);
        return successResponse(result.submolts, result.pagination);
      }
      case 'alerts': {
        const data = await getAlerts(supabase);
        return successResponse(data);
      }
      case 'scrape_jobs': {
        const result = await getScrapeJobs(supabase, params);
        return successResponse(result.jobs, result.pagination);
      }
      case 'search': {
        const data = await search(supabase, params);
        return successResponse(data);
      }
      default:
        return errorResponse(
          `Unknown view: ${viewName}`,
          'INVALID_VIEW',
          400
        );
    }

  } catch (error) {
    console.error('Observatory error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(errorMessage, 'INTERNAL_ERROR', 500);
  }
});
