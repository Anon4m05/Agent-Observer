const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-observatory-key',
};

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Simple in-memory rate limiting (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

interface EcosystemSummary {
  timestamp: string;
  ecosystem: {
    total_posts: number;
    total_agents: number;
    total_comments: number;
    total_submolts: number;
  };
  recent_activity: {
    posts_24h: number;
    new_agents_24h: number;
    most_active_submolts: string[];
  };
  notable_agents: Array<{
    username: string;
    post_count: number;
    avg_engagement: number;
    first_seen: string;
    behavioral_signature: {
      vocabulary_diversity: number;
      avg_post_length: number;
      engagement_ratio: number;
    };
  }>;
  recent_posts: Array<{
    title: string;
    agent: string;
    submolt: string | null;
    upvotes: number;
    comments: number;
    posted_at: string;
  }>;
}

interface AgentFingerprint {
  id: string;
  username: string;
  display_name: string | null;
  total_posts: number;
  total_comments: number;
  posts_per_day: number;
  avg_word_count: number;
  vocabulary_diversity: number;
  avg_upvotes: number;
  engagement_ratio: number;
  first_seen: string;
  last_seen: string | null;
  active_days: number;
  primary_submolt: string | null;
}

async function getEcosystemSummary(supabase: SupabaseClient): Promise<EcosystemSummary> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Get total counts
  const [postsResult, agentsResult, commentsResult, submoltsResult] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase.from('agents').select('id', { count: 'exact', head: true }),
    supabase.from('comments').select('id', { count: 'exact', head: true }),
    supabase.from('submolts').select('id', { count: 'exact', head: true }),
  ]);

  // Get 24h activity
  const [recentPostsCount, newAgentsCount] = await Promise.all([
    supabase.from('posts')
      .select('id', { count: 'exact', head: true })
      .gte('posted_at', yesterday.toISOString()),
    supabase.from('agents')
      .select('id', { count: 'exact', head: true })
      .gte('first_seen_at', yesterday.toISOString()),
  ]);

  // Get most active submolts (by recent post count)
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
    if (name) {
      submoltCounts.set(name, (submoltCounts.get(name) || 0) + 1);
    }
  });
  const topSubmolts = [...submoltCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  // Get notable agents (top by post count with engagement)
  const { data: topAgents } = await supabase
    .from('agents')
    .select('username, post_count, comment_count, first_seen_at')
    .order('post_count', { ascending: false, nullsFirst: false })
    .limit(10);

  // Get post stats for notable agents
  const notableAgents = await Promise.all((topAgents || []).map(async (agent) => {
    const { data: agentPosts } = await supabase
      .from('posts')
      .select('upvotes, comment_count, word_count, unique_words')
      .eq('agent_id', (await supabase.from('agents').select('id').eq('username', agent.username).single()).data?.id);

    const posts = agentPosts || [];
    const totalUpvotes = posts.reduce((sum, p) => sum + (p.upvotes || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comment_count || 0), 0);
    const avgWordCount = posts.length > 0 
      ? posts.reduce((sum, p) => sum + (p.word_count || 0), 0) / posts.length 
      : 0;
    const vocabDiversity = posts.length > 0
      ? posts.reduce((sum, p) => {
          const unique = p.unique_words || 0;
          const total = p.word_count || 1;
          return sum + (unique / total);
        }, 0) / posts.length
      : 0;

    return {
      username: agent.username,
      post_count: agent.post_count || 0,
      avg_engagement: posts.length > 0 ? (totalUpvotes + totalComments) / posts.length : 0,
      first_seen: agent.first_seen_at,
      behavioral_signature: {
        vocabulary_diversity: Math.round(vocabDiversity * 100) / 100,
        avg_post_length: Math.round(avgWordCount),
        engagement_ratio: posts.length > 0 
          ? Math.round(((totalUpvotes + totalComments) / posts.length) * 100) / 100 
          : 0,
      },
    };
  }));

  // Get recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select(`
      title,
      upvotes,
      comment_count,
      posted_at,
      agents(username),
      submolts(name)
    `)
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
      posted_at: p.posted_at || now.toISOString(),
    })),
  };
}

async function getAgentDirectory(
  supabase: SupabaseClient, 
  since: string | null, 
  limit: number
): Promise<AgentFingerprint[]> {
  let query = supabase
    .from('agents')
    .select('id, username, display_name, post_count, comment_count, first_seen_at, last_seen_at')
    .order('post_count', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (since) {
    query = query.gte('last_seen_at', since);
  }

  const { data: agents } = await query;

  return Promise.all((agents || []).map(async (agent) => {
    // Get posts for this agent to compute fingerprint
    const { data: posts } = await supabase
      .from('posts')
      .select('word_count, unique_words, upvotes, comment_count, submolt_id, submolts(name)')
      .eq('agent_id', agent.id);

    const postList = posts || [];
    const firstSeen = new Date(agent.first_seen_at);
    const lastSeen = agent.last_seen_at ? new Date(agent.last_seen_at) : new Date();
    const activeDays = Math.max(1, Math.ceil((lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24)));

    const totalWordCount = postList.reduce((sum, p) => sum + (p.word_count || 0), 0);
    const totalUniqueWords = postList.reduce((sum, p) => sum + (p.unique_words || 0), 0);
    const totalUpvotes = postList.reduce((sum, p) => sum + (p.upvotes || 0), 0);
    const totalComments = postList.reduce((sum, p) => sum + (p.comment_count || 0), 0);

    // Find primary submolt
    const submoltCounts = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    postList.forEach((p: any) => {
      const name = p.submolts?.name;
      if (name) {
        submoltCounts.set(name, (submoltCounts.get(name) || 0) + 1);
      }
    });
    const primarySubmolt = [...submoltCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      id: agent.id,
      username: agent.username,
      display_name: agent.display_name,
      total_posts: agent.post_count || 0,
      total_comments: agent.comment_count || 0,
      posts_per_day: Math.round(((agent.post_count || 0) / activeDays) * 100) / 100,
      avg_word_count: postList.length > 0 ? Math.round(totalWordCount / postList.length) : 0,
      vocabulary_diversity: totalWordCount > 0 
        ? Math.round((totalUniqueWords / totalWordCount) * 100) / 100 
        : 0,
      avg_upvotes: postList.length > 0 ? Math.round((totalUpvotes / postList.length) * 100) / 100 : 0,
      engagement_ratio: postList.length > 0 
        ? Math.round(((totalUpvotes + totalComments) / postList.length) * 100) / 100 
        : 0,
      first_seen: agent.first_seen_at,
      last_seen: agent.last_seen_at,
      active_days: activeDays,
      primary_submolt: primarySubmolt,
    };
  }));
}

async function getRecentPosts(
  supabase: SupabaseClient, 
  since: string | null, 
  limit: number
) {
  let query = supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      url,
      upvotes,
      downvotes,
      comment_count,
      word_count,
      unique_words,
      avg_word_length,
      posted_at,
      agents(username, display_name),
      submolts(name)
    `)
    .order('posted_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (since) {
    query = query.gte('posted_at', since);
  }

  const { data: posts } = await query;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (posts || []).map((p: any) => ({
    id: p.id,
    title: p.title || 'Untitled',
    content_preview: p.content?.slice(0, 300) || null,
    url: p.url,
    upvotes: p.upvotes || 0,
    downvotes: p.downvotes || 0,
    comments: p.comment_count || 0,
    word_count: p.word_count || 0,
    vocabulary_diversity: p.word_count > 0 
      ? Math.round(((p.unique_words || 0) / p.word_count) * 100) / 100 
      : 0,
    avg_word_length: p.avg_word_length || 0,
    agent: p.agents?.username || 'unknown',
    agent_display_name: p.agents?.display_name || null,
    submolt: p.submolts?.name || null,
    posted_at: p.posted_at,
  }));
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow GET requests for this read-only endpoint
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. This is a read-only endpoint.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Rate limiting by IP
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || 'unknown';
    
    if (!checkRateLimit(clientIP)) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Maximum 10 requests per minute.',
          retry_after: 60 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const view = url.searchParams.get('view') || 'summary';
    const since = url.searchParams.get('since');
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)), 100);

    console.log(`Observatory request: view=${view}, since=${since}, limit=${limit}, ip=${clientIP}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role for read-only public access (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let data: unknown;

    switch (view) {
      case 'summary':
        data = await getEcosystemSummary(supabase);
        break;

      case 'agents':
        data = await getAgentDirectory(supabase, since, limit);
        break;

      case 'posts':
        data = await getRecentPosts(supabase, since, limit);
        break;

      case 'alerts':
        // Alerts require authentication - check for observatory API key
        const obsKey = req.headers.get('x-observatory-key');
        if (!obsKey) {
          return new Response(
            JSON.stringify({ 
              error: 'Alerts view requires authentication. Provide x-observatory-key header.',
              available_views: ['summary', 'agents', 'posts']
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // For now, return a message that this feature is coming
        data = { message: 'Alerts API coming soon. Use summary, agents, or posts views.' };
        break;

      default:
        return new Response(
          JSON.stringify({ 
            error: `Unknown view: ${view}`,
            available_views: ['summary', 'agents', 'posts', 'alerts']
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60' // Cache for 1 minute
        } 
      }
    );

  } catch (error) {
    console.error('Observatory error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
