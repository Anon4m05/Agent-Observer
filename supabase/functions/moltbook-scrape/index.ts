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
  agent_username: string;
  submolt_name: string | null;
}

interface ParsedAgent {
  external_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

// Parse markdown content to extract posts
function parsePostsFromMarkdown(markdown: string, baseUrl: string): ParsedPost[] {
  const posts: ParsedPost[] = [];
  
  // Look for post patterns in markdown
  // Moltbook posts typically have: title, author, submolt, votes, comments
  const postPatterns = [
    // Pattern: [Title](url) by author in submolt - X upvotes, Y comments
    /\[([^\]]+)\]\(([^)]+)\)[^\n]*?(?:by|posted by)\s+(\w+)[^\n]*?(?:in\s+)?(\w+)?[^\n]*?(\d+)\s*(?:upvotes?|points?)[^\n]*?(\d+)\s*comments?/gi,
    // Simpler pattern: ## Title followed by metadata
    /##\s+([^\n]+)\n[^\n]*?(?:\/u\/|@|by\s+)(\w+)[^\n]*?(\d+)\s*(?:upvotes?|points?)/gi,
  ];

  // Fallback: extract any links that look like post URLs
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+\/post\/[^)]+)\)/gi;
  let match;

  while ((match = linkPattern.exec(markdown)) !== null) {
    const title = match[1];
    const url = match[2];
    const postId = url.split('/post/')[1]?.split(/[?#]/)[0] || `post_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Try to find associated metadata near this link
    const contextStart = Math.max(0, match.index - 200);
    const contextEnd = Math.min(markdown.length, match.index + match[0].length + 200);
    const context = markdown.slice(contextStart, contextEnd);

    // Extract username
    const userMatch = context.match(/(?:\/u\/|@|by\s+)(\w+)/i);
    const username = userMatch ? userMatch[1] : 'unknown_agent';

    // Extract votes
    const voteMatch = context.match(/(\d+)\s*(?:upvotes?|points?)/i);
    const upvotes = voteMatch ? parseInt(voteMatch[1], 10) : 0;

    // Extract comments
    const commentMatch = context.match(/(\d+)\s*comments?/i);
    const commentCount = commentMatch ? parseInt(commentMatch[1], 10) : 0;

    // Extract submolt
    const submoltMatch = context.match(/(?:\/m\/|in\s+)(\w+)/i);
    const submolt = submoltMatch ? submoltMatch[1] : null;

    posts.push({
      external_id: postId,
      title: title.slice(0, 500),
      content: null,
      url,
      upvotes,
      downvotes: 0,
      comment_count: commentCount,
      posted_at: null,
      agent_username: username,
      submolt_name: submolt,
    });
  }

  // If no posts found via links, try to parse structured content
  if (posts.length === 0) {
    // Try parsing list items that might be posts
    const listItems = markdown.split(/\n[-*]\s+/).filter(item => item.trim().length > 20);
    
    listItems.forEach((item, index) => {
      const titleMatch = item.match(/^([^\n]+)/);
      if (titleMatch) {
        const title = titleMatch[1].replace(/\[|\]|\(|\)/g, '').trim();
        if (title.length > 5 && title.length < 500) {
          posts.push({
            external_id: `scraped_${Date.now()}_${index}`,
            title,
            content: item.slice(title.length).trim() || null,
            url: baseUrl,
            upvotes: 0,
            downvotes: 0,
            comment_count: 0,
            posted_at: null,
            agent_username: 'unknown_agent',
            submolt_name: null,
          });
        }
      }
    });
  }

  return posts;
}

// Parse agents from markdown
function parseAgentsFromMarkdown(markdown: string): ParsedAgent[] {
  const agents: ParsedAgent[] = [];
  const seenUsernames = new Set<string>();

  // Find all username patterns
  const patterns = [
    /(?:\/u\/|@)(\w{3,30})/gi,
    /(?:by|posted by|author:?)\s+(\w{3,30})/gi,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(markdown)) !== null) {
      const username = match[1].toLowerCase();
      if (!seenUsernames.has(username) && username !== 'unknown_agent') {
        seenUsernames.add(username);
        agents.push({
          external_id: `agent_${username}`,
          username,
          display_name: null,
          avatar_url: null,
          bio: null,
        });
      }
    }
  });

  return agents;
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
    
    // Use service role for data insertion (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Use anon key with auth header for user context
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
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

    const { url, scope = 'full', targetId } = await req.json();
    const targetUrl = url || 'https://www.moltbook.app';

    console.log(`[${user.id}] Starting scrape - URL: ${targetUrl}, scope: ${scope}`);

    // Create scrape job record
    const { data: job, error: jobError } = await supabaseAuth
      .from('scrape_jobs')
      .insert({
        user_id: user.id,
        status: 'running',
        scope,
        target_id: targetId,
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

    // Call Firecrawl scrape API
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      }),
    });

    const scrapeResult = await firecrawlResponse.json();

    if (!firecrawlResponse.ok) {
      console.error('Firecrawl API error:', scrapeResult);
      
      await supabaseAuth
        .from('scrape_jobs')
        .update({
          status: 'failed',
          error_message: scrapeResult.error || 'Firecrawl request failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: scrapeResult.error || 'Firecrawl request failed',
          jobId: job.id 
        }),
        { status: firecrawlResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${user.id}] Firecrawl scrape successful`);

    const data = scrapeResult.data || scrapeResult;
    const markdown = data.markdown || '';
    const links = data.links || [];
    const metadata = data.metadata || {};

    // Parse content
    const parsedPosts = parsePostsFromMarkdown(markdown, targetUrl);
    const parsedAgents = parseAgentsFromMarkdown(markdown);

    console.log(`[${user.id}] Parsed ${parsedPosts.length} posts and ${parsedAgents.length} agents`);

    let postsInserted = 0;
    let agentsInserted = 0;

    // Insert/update agents using service role (bypasses RLS)
    if (parsedAgents.length > 0) {
      for (const agent of parsedAgents) {
        const { error: agentError } = await supabaseAdmin
          .from('agents')
          .upsert({
            external_id: agent.external_id,
            username: agent.username,
            display_name: agent.display_name,
            avatar_url: agent.avatar_url,
            bio: agent.bio,
            last_seen_at: new Date().toISOString(),
          }, { 
            onConflict: 'external_id',
            ignoreDuplicates: false 
          });

        if (!agentError) {
          agentsInserted++;
        } else {
          console.error('Agent upsert error:', agentError);
        }
      }
    }

    // Get agent ID map
    const agentMap = new Map<string, string>();
    if (parsedAgents.length > 0) {
      const { data: agents } = await supabaseAdmin
        .from('agents')
        .select('id, username')
        .in('username', parsedAgents.map(a => a.username));
      
      agents?.forEach(a => agentMap.set(a.username, a.id));
    }

    // Insert/update posts using service role
    if (parsedPosts.length > 0) {
      for (const post of parsedPosts) {
        const agentId = agentMap.get(post.agent_username) || null;
        
        // Calculate text metrics
        const content = post.content || '';
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
        const charCount = content.length;

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
            word_count: wordCount,
            char_count: charCount,
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

      // Update agent post counts
      for (const [username, agentId] of agentMap) {
        const postCount = parsedPosts.filter(p => p.agent_username === username).length;
        if (postCount > 0) {
          await supabaseAdmin
            .from('agents')
            .update({ 
              post_count: postCount,
              last_seen_at: new Date().toISOString()
            })
            .eq('id', agentId);
        }
      }
    }

    // Update job with results
    await supabaseAuth
      .from('scrape_jobs')
      .update({
        status: 'completed',
        posts_scraped: postsInserted,
        agents_discovered: agentsInserted,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log(`[${user.id}] Job completed: ${job.id} - ${postsInserted} posts, ${agentsInserted} agents`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        data: {
          url: targetUrl,
          postsInserted,
          agentsInserted,
          linksCount: links.length,
          rawPostsFound: parsedPosts.length,
          metadata
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
