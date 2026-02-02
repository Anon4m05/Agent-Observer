const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ParsedPost {
  external_id: string;
  title: string;
  content: string | null;
  url: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  posted_at: string | null;
  agent_username: string | null;
  submolt_name: string | null;
}

interface ParsedAgent {
  external_id: string;
  username: string;
  display_name: string | null;
  twitter_handle: string | null;
}

interface ParsedSubmolt {
  external_id: string;
  name: string;
  member_count: number | null;
}

interface ParsedComment {
  external_id: string;
  content: string;
  agent_username: string | null;
  post_external_id: string | null;
  upvotes: number;
}

// Extract a clean title from a markdown block
function extractTitle(block: string): string | null {
  // Try bold **Title** pattern first - but be careful about nested content
  const boldMatch = block.match(/\*\*([^*\n]{5,200})\*\*/);
  if (boldMatch && !boldMatch[1].includes('Option') && !boldMatch[1].includes('Evidence')) {
    const title = boldMatch[1].trim();
    // Skip if it looks like internal content (lists, headers)
    if (!title.startsWith('-') && !title.match(/^\d+\./)) {
      return title;
    }
  }
  
  // Try # Header pattern
  const headingMatch = block.match(/^#+\s+([^\n]{5,200})$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  
  return null;
}

// Parse post entries from markdown with improved patterns
function parsePostsFromMarkdown(markdown: string, baseUrl: string): ParsedPost[] {
  const posts: ParsedPost[] = [];
  const seenIds = new Set<string>();
  
  // Pattern 1: Full post blocks with vote, submolt, user, title, comments
  // Format: [▲X▼\n\nm/submolt•Posted by u/user•time\n\n**Title**...\n💬X comments](url)
  const postBlockRegex = /\[▲(\d+)▼[\s\\n]*m\/(\w+)[^u]*u\/([a-zA-Z0-9_-]+)[^*]*\*\*([^*]+)\*\*[^💬]*💬\s*(\d+)/gi;
  
  let match;
  while ((match = postBlockRegex.exec(markdown)) !== null) {
    const upvotes = parseInt(match[1], 10);
    const submolt = match[2].toLowerCase();
    const username = match[3].toLowerCase();
    const title = match[4].trim();
    const commentCount = parseInt(match[5], 10);
    
    // Find the URL after this match
    const urlMatch = markdown.slice(match.index, match.index + match[0].length + 200).match(/\/post\/([a-f0-9-]+)/i);
    if (urlMatch && !seenIds.has(urlMatch[1])) {
      seenIds.add(urlMatch[1]);
      
      // Get content - text between title and comments
      const contentStart = match.index + match[0].indexOf('**' + title + '**') + title.length + 4;
      const contentEnd = match.index + match[0].indexOf('💬');
      let content = markdown.slice(contentStart, contentEnd).trim();
      // Clean up content
      content = content.replace(/\\n/g, '\n').replace(/^\s*\n+/, '').replace(/\n+\s*$/, '');
      
      posts.push({
        external_id: urlMatch[1],
        title: title,
        content: content.length > 10 ? content.slice(0, 5000) : null,
        url: `${baseUrl}/post/${urlMatch[1]}`,
        upvotes,
        downvotes: 0,
        comment_count: commentCount,
        posted_at: extractTimestamp(match[0]),
        agent_username: username,
        submolt_name: submolt,
      });
    }
  }
  
  // Pattern 2: Simpler - find all post URLs and extract nearby metadata
  const urlPattern = /\/post\/([a-f0-9-]{36})/gi;
  while ((match = urlPattern.exec(markdown)) !== null) {
    const postId = match[1];
    if (seenIds.has(postId)) continue;
    
    // Get context around this URL
    const contextStart = Math.max(0, match.index - 600);
    const contextEnd = Math.min(markdown.length, match.index + 100);
    const context = markdown.slice(contextStart, contextEnd);
    
    // Extract title
    const title = extractTitle(context);
    if (!title || title.length < 5) continue;
    
    // Extract votes
    const voteMatch = context.match(/▲(\d+)▼/);
    const upvotes = voteMatch ? parseInt(voteMatch[1], 10) : 0;
    
    // Extract submolt
    const submoltMatch = context.match(/m\/(\w{2,30})/);
    const submolt = submoltMatch ? submoltMatch[1].toLowerCase() : null;
    
    // Extract username - need at least 2 chars, not common words
    const userMatch = context.match(/u\/([a-zA-Z0-9_-]{2,30})/);
    let username: string | null = null;
    if (userMatch) {
      const candidate = userMatch[1].toLowerCase();
      if (!['the', 'and', 'for', 'you', 'are', 'was', 'has', 'this', 'that', 'with', 'ago'].includes(candidate)) {
        username = candidate;
      }
    }
    
    // Extract comment count
    const commentMatch = context.match(/💬\s*(\d+)|(\d+)\s*comments?/i);
    const commentCount = commentMatch ? parseInt(commentMatch[1] || commentMatch[2], 10) : 0;
    
    seenIds.add(postId);
    posts.push({
      external_id: postId,
      title,
      content: null,
      url: `${baseUrl}/post/${postId}`,
      upvotes,
      downvotes: 0,
      comment_count: commentCount,
      posted_at: extractTimestamp(context),
      agent_username: username,
      submolt_name: submolt,
    });
  }
  
  return posts;
}

// Parse agents from the /u agents listing page
function parseAgentsFromMarkdown(markdown: string): ParsedAgent[] {
  const agents: ParsedAgent[] = [];
  const seenUsernames = new Set<string>();
  
  // Pattern for agent cards: Username with Twitter handle
  // Format: [Username\n\ntime ago\n\n@twitterhandle](url)
  const agentCardRegex = /\[([A-Z][a-zA-Z0-9_-]{1,29})\\n[\\n\s]*✓?[\\n\s]*(?:[^@\n]{0,50})\\n[\\n\s]*(?:\d+[mhd]\s*ago)?[\\n\s]*(?:@(\w+))?\]/gi;
  
  let match;
  while ((match = agentCardRegex.exec(markdown)) !== null) {
    const username = match[1].toLowerCase();
    const twitter = match[2] || null;
    
    if (!seenUsernames.has(username) && username.length >= 2) {
      seenUsernames.add(username);
      agents.push({
        external_id: `agent_${username}`,
        username,
        display_name: match[1], // Keep original case for display
        twitter_handle: twitter,
      });
    }
  }
  
  // Also find u/username patterns throughout the markdown
  const userPatterns = [
    /u\/([a-zA-Z0-9_-]{2,30})/gi,
    /Posted by\s+([a-zA-Z0-9_-]{2,30})/gi,
  ];
  
  for (const pattern of userPatterns) {
    while ((match = pattern.exec(markdown)) !== null) {
      const username = match[1].toLowerCase();
      const blocked = ['the', 'and', 'for', 'you', 'are', 'was', 'has', 'this', 'that', 'with', 'ago', 'post', 'comment'];
      if (!seenUsernames.has(username) && username.length >= 2 && !blocked.includes(username)) {
        seenUsernames.add(username);
        agents.push({
          external_id: `agent_${username}`,
          username,
          display_name: null,
          twitter_handle: null,
        });
      }
    }
  }
  
  return agents;
}

// Parse submolts from markdown - extract member counts too
function parseSubmoltsFromMarkdown(markdown: string): ParsedSubmolt[] {
  const submolts: ParsedSubmolt[] = [];
  const seenNames = new Set<string>();
  
  // Pattern for submolt cards: m/name with member count
  // Format: [🦞\n\nm/name\n\nX members](url)
  const submoltCardRegex = /m\/(\w{2,30})[\s\\n]*(\d+)\s*members?/gi;
  
  let match;
  while ((match = submoltCardRegex.exec(markdown)) !== null) {
    const name = match[1].toLowerCase();
    const memberCount = parseInt(match[2], 10);
    
    if (!seenNames.has(name)) {
      seenNames.add(name);
      submolts.push({
        external_id: `submolt_${name}`,
        name,
        member_count: memberCount,
      });
    }
  }
  
  // Also find m/submoltname patterns without member counts
  const simplePattern = /m\/(\w{2,30})/gi;
  while ((match = simplePattern.exec(markdown)) !== null) {
    const name = match[1].toLowerCase();
    if (!seenNames.has(name)) {
      seenNames.add(name);
      submolts.push({
        external_id: `submolt_${name}`,
        name,
        member_count: null,
      });
    }
  }
  
  return submolts;
}

// Parse comments from post detail pages
function parseCommentsFromMarkdown(markdown: string, postExternalId: string | null): ParsedComment[] {
  const comments: ParsedComment[] = [];
  
  // Pattern for comments: ▲X▼ followed by u/username and content
  const commentPattern = /▲(\d+)▼[\s\\n]*u\/([a-zA-Z0-9_-]{2,30})[^▲]*?(?=▲\d+▼|$)/gi;
  
  let match;
  while ((match = commentPattern.exec(markdown)) !== null) {
    const upvotes = parseInt(match[1], 10);
    const username = match[2].toLowerCase();
    const content = match[0].replace(/▲\d+▼/, '').replace(/u\/\w+/, '').trim().slice(0, 2000);
    
    if (content.length > 5) {
      comments.push({
        external_id: `comment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        content,
        agent_username: username,
        post_external_id: postExternalId,
        upvotes,
      });
    }
  }
  
  return comments;
}

// Extract timestamp from relative time strings
function extractTimestamp(text: string): string | null {
  const patterns = [
    { regex: /(\d+)\s*m\s*ago/i, unit: 'minutes' },
    { regex: /(\d+)\s*h\s*ago/i, unit: 'hours' },
    { regex: /(\d+)\s*d\s*ago/i, unit: 'days' },
    { regex: /(\d+)\s*w\s*ago/i, unit: 'weeks' },
  ];
  
  for (const { regex, unit } of patterns) {
    const match = text.match(regex);
    if (match) {
      const amount = parseInt(match[1], 10);
      const now = new Date();
      if (unit === 'minutes') now.setMinutes(now.getMinutes() - amount);
      else if (unit === 'hours') now.setHours(now.getHours() - amount);
      else if (unit === 'days') now.setDate(now.getDate() - amount);
      else if (unit === 'weeks') now.setDate(now.getDate() - amount * 7);
      return now.toISOString();
    }
  }
  
  return null;
}

// Calculate text metrics for content analysis
function calculateTextMetrics(text: string) {
  if (!text) {
    return { word_count: 0, char_count: 0, unique_words: 0, avg_word_length: 0, link_count: 0 };
  }
  
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const uniqueWords = new Set(words.filter(w => w.match(/^[a-z]+$/)));
  const linkCount = (text.match(/https?:\/\/[^\s]+/g) || []).length;
  const avgWordLength = words.length > 0 
    ? words.reduce((sum, w) => sum + w.length, 0) / words.length 
    : 0;
  
  return {
    word_count: words.length,
    char_count: text.length,
    unique_words: uniqueWords.size,
    avg_word_length: Math.round(avgWordLength * 100) / 100,
    link_count: linkCount,
  };
}

// Fetch a single page using Firecrawl scrape API
async function scrapePage(url: string, apiKey: string): Promise<{ markdown: string; links: string[] }> {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'links'],
      onlyMainContent: true,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Firecrawl error: ${error.error || response.statusText}`);
  }
  
  const result = await response.json();
  const data = result.data || result;
  return {
    markdown: data.markdown || '',
    links: data.links || [],
  };
}

// Start an async crawl job
async function startCrawl(url: string, apiKey: string, limit: number = 50): Promise<string> {
  const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      limit,
      maxDepth: 2,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
      },
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Crawl start error: ${error.error || response.statusText}`);
  }
  
  const result = await response.json();
  return result.id;
}

// Poll crawl status
async function pollCrawl(crawlId: string, apiKey: string): Promise<{ status: string; data?: any[] }> {
  const response = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Crawl poll error: ${error.error || response.statusText}`);
  }
  
  return await response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { mode = 'full', pageLimit = 20 } = await req.json().catch(() => ({}));
    const baseUrl = 'https://www.moltbook.com';

    console.log(`[${user.id}] Starting ${mode} scrape with limit ${pageLimit}`);

    // Create scrape job record
    const { data: job, error: jobError } = await supabaseAuth
      .from('scrape_jobs')
      .insert({
        user_id: user.id,
        status: 'running',
        scope: mode,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create job:', jobError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create scrape job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${user.id}] Created job: ${job.id}`);

    // Strategy: Scrape multiple key pages to get broader data
    const pagesToScrape = [
      baseUrl,                    // Main feed
      `${baseUrl}/?sort=new`,     // New posts
      `${baseUrl}/?sort=top`,     // Top posts
      `${baseUrl}/m`,             // Submolts list
    ];

    let allMarkdown = '';
    let allLinks: string[] = [];
    let pagesScraped = 0;

    for (const pageUrl of pagesToScrape.slice(0, Math.min(pageLimit, pagesToScrape.length))) {
      try {
        console.log(`[${user.id}] Scraping: ${pageUrl}`);
        const { markdown, links } = await scrapePage(pageUrl, apiKey);
        allMarkdown += '\n\n---PAGE BOUNDARY---\n\n' + markdown;
        allLinks = [...allLinks, ...links];
        pagesScraped++;
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
      } catch (error) {
        console.error(`[${user.id}] Error scraping ${pageUrl}:`, error);
      }
    }

    console.log(`[${user.id}] Scraped ${pagesScraped} pages, ${allMarkdown.length} chars total`);

    // Parse all content
    const parsedPosts = parsePostsFromMarkdown(allMarkdown, baseUrl);
    const parsedAgents = parseAgentsFromMarkdown(allMarkdown);
    const parsedSubmolts = parseSubmoltsFromMarkdown(allMarkdown);

    console.log(`[${user.id}] Parsed: ${parsedPosts.length} posts, ${parsedAgents.length} agents, ${parsedSubmolts.length} submolts`);

    // ============= DATABASE UPSERTS =============
    
    let postsInserted = 0;
    let agentsInserted = 0;
    let submoltsInserted = 0;

    // 1. Upsert submolts
    const submoltIdMap = new Map<string, string>();
    
    for (const submolt of parsedSubmolts) {
      const { data: existing } = await supabaseAdmin
        .from('submolts')
        .select('id')
        .eq('name', submolt.name)
        .single();
      
      if (existing) {
        submoltIdMap.set(submolt.name, existing.id);
        await supabaseAdmin
          .from('submolts')
          .update({ 
            last_scraped_at: new Date().toISOString(),
            member_count: submolt.member_count || undefined,
          })
          .eq('id', existing.id);
      } else {
        const { data: newSubmolt, error } = await supabaseAdmin
          .from('submolts')
          .insert({
            external_id: submolt.external_id,
            name: submolt.name,
            member_count: submolt.member_count,
            first_seen_at: new Date().toISOString(),
            last_scraped_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        
        if (!error && newSubmolt) {
          submoltIdMap.set(submolt.name, newSubmolt.id);
          submoltsInserted++;
        }
      }
    }

    console.log(`[${user.id}] Submolts: ${submoltsInserted} new, ${submoltIdMap.size} total`);

    // 2. Upsert agents
    const agentIdMap = new Map<string, string>();
    
    for (const agent of parsedAgents) {
      const { data: existing } = await supabaseAdmin
        .from('agents')
        .select('id')
        .eq('username', agent.username)
        .single();
      
      if (existing) {
        agentIdMap.set(agent.username, existing.id);
        await supabaseAdmin
          .from('agents')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        const { data: newAgent, error } = await supabaseAdmin
          .from('agents')
          .insert({
            external_id: agent.external_id,
            username: agent.username,
            display_name: agent.display_name,
            first_seen_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        
        if (!error && newAgent) {
          agentIdMap.set(agent.username, newAgent.id);
          agentsInserted++;
        }
      }
    }

    console.log(`[${user.id}] Agents: ${agentsInserted} new, ${agentIdMap.size} total`);

    // 3. Upsert posts - ensure agents exist first
    for (const post of parsedPosts) {
      // Create agent if referenced but not yet in map
      if (post.agent_username && !agentIdMap.has(post.agent_username)) {
        const { data: existing } = await supabaseAdmin
          .from('agents')
          .select('id')
          .eq('username', post.agent_username)
          .single();
        
        if (existing) {
          agentIdMap.set(post.agent_username, existing.id);
        } else {
          const { data: newAgent } = await supabaseAdmin
            .from('agents')
            .insert({
              external_id: `agent_${post.agent_username}`,
              username: post.agent_username,
              first_seen_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
            })
            .select('id')
            .single();
          
          if (newAgent) {
            agentIdMap.set(post.agent_username, newAgent.id);
            agentsInserted++;
          }
        }
      }

      const agentId = post.agent_username ? agentIdMap.get(post.agent_username) || null : null;
      const submoltId = post.submolt_name ? submoltIdMap.get(post.submolt_name) || null : null;
      
      const textContent = `${post.title || ''} ${post.content || ''}`;
      const metrics = calculateTextMetrics(textContent);

      const { error: postError } = await supabaseAdmin
        .from('posts')
        .upsert({
          external_id: post.external_id,
          title: post.title,
          content: post.content,
          url: post.url,
          upvotes: post.upvotes,
          downvotes: post.downvotes,
          comment_count: post.comment_count,
          posted_at: post.posted_at,
          agent_id: agentId,
          submolt_id: submoltId,
          word_count: metrics.word_count,
          char_count: metrics.char_count,
          unique_words: metrics.unique_words,
          avg_word_length: metrics.avg_word_length,
          link_count: metrics.link_count,
          scraped_at: new Date().toISOString(),
        }, { 
          onConflict: 'external_id',
          ignoreDuplicates: false 
        });

      if (!postError) {
        postsInserted++;
      } else {
        console.error('Post upsert error:', postError);
      }
    }

    console.log(`[${user.id}] Posts upserted: ${postsInserted}`);

    // 4. Update agent post counts
    for (const [username, agentId] of agentIdMap) {
      const { count } = await supabaseAdmin
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', agentId);
      
      if (count && count > 0) {
        await supabaseAdmin
          .from('agents')
          .update({ post_count: count })
          .eq('id', agentId);
      }
    }

    // Update job completion
    await supabaseAuth
      .from('scrape_jobs')
      .update({
        status: 'completed',
        posts_scraped: postsInserted,
        agents_discovered: agentsInserted,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log(`[${user.id}] Job completed: ${job.id} - ${postsInserted} posts, ${agentsInserted} agents, ${submoltsInserted} submolts`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        data: {
          pagesScraped,
          postsInserted,
          agentsInserted,
          submoltsInserted,
          rawPostsFound: parsedPosts.length,
          rawAgentsFound: parsedAgents.length,
          rawSubmoltsFound: parsedSubmolts.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in moltbook-scrape:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
