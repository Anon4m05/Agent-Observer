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
}

interface ParsedSubmolt {
  external_id: string;
  name: string;
}

// Extract a clean title from a markdown block
function extractTitle(block: string): string | null {
  // Try bold **Title** pattern first
  const boldMatch = block.match(/\*\*([^*]+)\*\*/);
  if (boldMatch && boldMatch[1].length > 3 && boldMatch[1].length < 300) {
    return boldMatch[1].trim();
  }
  
  // Try heading ## Title pattern
  const headingMatch = block.match(/^#+\s+(.+)$/m);
  if (headingMatch && headingMatch[1].length > 3 && headingMatch[1].length < 300) {
    return headingMatch[1].trim();
  }
  
  // Try link [Title](url) pattern
  const linkMatch = block.match(/\[([^\]]+)\]\([^)]+\/post\/[^)]+\)/);
  if (linkMatch && linkMatch[1].length > 3 && linkMatch[1].length < 300) {
    // Clean up the title - remove vote arrows and extra content
    let title = linkMatch[1].trim();
    // Remove vote patterns like "▲3▼" at the start
    title = title.replace(/^[▲▼\d\s]+/, '');
    // Remove submolt patterns like "m/general"
    title = title.replace(/^m\/\w+[\s•]+/, '');
    return title.length > 3 ? title : null;
  }
  
  return null;
}

// Parse individual post blocks from Moltbook markdown
function parsePostBlocks(markdown: string): string[] {
  // Split on horizontal rules or multiple newlines that separate posts
  const blocks = markdown.split(/(?:\n---\n|\n{3,}|(?=▲\d+▼))/);
  
  // Filter to blocks that look like posts (have vote patterns or post links)
  return blocks.filter(block => {
    return (
      block.includes('/post/') ||
      /▲\d+▼/.test(block) ||
      (/m\/\w+/.test(block) && /u\/\w+/.test(block))
    );
  });
}

// Parse a single post block into structured data
function parsePostFromBlock(block: string, baseUrl: string): ParsedPost | null {
  // Extract post URL and ID
  const postUrlMatch = block.match(/(?:https?:\/\/[^/]+)?\/post\/([a-f0-9-]+)/i);
  if (!postUrlMatch) {
    // Try to generate a unique ID from content
    const contentHash = block.slice(0, 100).replace(/\W/g, '').toLowerCase();
    if (contentHash.length < 5) return null;
  }
  
  const postId = postUrlMatch ? postUrlMatch[1] : `scraped_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const postUrl = postUrlMatch 
    ? (postUrlMatch[0].startsWith('http') ? postUrlMatch[0] : `${baseUrl}/post/${postId}`)
    : `${baseUrl}/post/${postId}`;
  
  // Extract title
  const title = extractTitle(block);
  if (!title) return null;
  
  // Extract upvotes from ▲X▼ pattern
  const voteMatch = block.match(/▲(\d+)▼/);
  const upvotes = voteMatch ? parseInt(voteMatch[1], 10) : 0;
  
  // Extract downvotes (if separate)
  const downvoteMatch = block.match(/▼(\d+)/);
  const downvotes = downvoteMatch && !voteMatch ? parseInt(downvoteMatch[1], 10) : 0;
  
  // Extract submolt from m/submoltname pattern
  const submoltMatch = block.match(/m\/(\w+)/);
  const submolt = submoltMatch ? submoltMatch[1].toLowerCase() : null;
  
  // Extract agent username from u/username or "Posted by username" pattern
  // Be careful not to capture just "u" - need to capture the full username after u/
  const agentMatch = block.match(/u\/([a-zA-Z0-9_]{2,30})|Posted by\s+([a-zA-Z0-9_]{2,30})|by\s+([a-zA-Z0-9_]{2,30})/i);
  let username: string | null = null;
  if (agentMatch) {
    // Take the first non-undefined capture group
    username = (agentMatch[1] || agentMatch[2] || agentMatch[3] || '').toLowerCase();
    // Filter out common false positives
    if (['u', 'the', 'and', 'for', 'you', 'are', 'was', 'has', 'this', 'that', 'with', 'ago'].includes(username)) {
      username = null;
    }
  }
  
  // Extract comment count from 💬X or X comments pattern
  const commentMatch = block.match(/💬\s*(\d+)|(\d+)\s*(?:comments?|replies)/i);
  const commentCount = commentMatch ? parseInt(commentMatch[1] || commentMatch[2], 10) : 0;
  
  // Extract content - everything after the title and metadata
  let content = block;
  // Remove metadata patterns
  content = content.replace(/▲\d+▼/g, '');
  content = content.replace(/m\/\w+/g, '');
  content = content.replace(/u\/\w+/g, '');
  content = content.replace(/\d+\s*(?:comments?|replies)/gi, '');
  content = content.replace(/\*\*[^*]+\*\*/g, '');
  content = content.replace(/\[[^\]]+\]\([^)]+\)/g, '');
  content = content.trim();
  
  // Extract timestamp if present
  let postedAt: string | null = null;
  const timePatterns = [
    /(\d+)\s*(?:hours?|hrs?)\s*ago/i,
    /(\d+)\s*(?:minutes?|mins?)\s*ago/i,
    /(\d+)\s*(?:days?)\s*ago/i,
  ];
  
  for (const pattern of timePatterns) {
    const match = block.match(pattern);
    if (match) {
      const amount = parseInt(match[1], 10);
      const now = new Date();
      if (pattern.source.includes('hour')) {
        now.setHours(now.getHours() - amount);
      } else if (pattern.source.includes('minute')) {
        now.setMinutes(now.getMinutes() - amount);
      } else if (pattern.source.includes('day')) {
        now.setDate(now.getDate() - amount);
      }
      postedAt = now.toISOString();
      break;
    }
  }
  
  return {
    external_id: postId,
    title,
    content: content.length > 10 ? content.slice(0, 5000) : null,
    url: postUrl,
    upvotes,
    downvotes,
    comment_count: commentCount,
    posted_at: postedAt,
    agent_username: username,
    submolt_name: submolt,
  };
}

// Parse all posts from markdown
function parsePostsFromMarkdown(markdown: string, baseUrl: string): ParsedPost[] {
  const posts: ParsedPost[] = [];
  const seenIds = new Set<string>();
  
  // First try block-based parsing
  const blocks = parsePostBlocks(markdown);
  
  for (const block of blocks) {
    const post = parsePostFromBlock(block, baseUrl);
    if (post && !seenIds.has(post.external_id)) {
      seenIds.add(post.external_id);
      posts.push(post);
    }
  }
  
  // Also scan for post links we might have missed
  const linkPattern = /\[([^\]]+)\]\(((?:https?:\/\/[^/]+)?\/post\/([a-f0-9-]+))\)/gi;
  let match;
  
  while ((match = linkPattern.exec(markdown)) !== null) {
    const postId = match[3];
    if (!seenIds.has(postId)) {
      // Get context around this link
      const contextStart = Math.max(0, match.index - 300);
      const contextEnd = Math.min(markdown.length, match.index + match[0].length + 300);
      const context = markdown.slice(contextStart, contextEnd);
      
      const post = parsePostFromBlock(context, baseUrl);
      if (post) {
        post.external_id = postId;
        post.url = match[2].startsWith('http') ? match[2] : `${baseUrl}/post/${postId}`;
        seenIds.add(postId);
        posts.push(post);
      }
    }
  }
  
  return posts;
}

// Parse agents from markdown
function parseAgentsFromMarkdown(markdown: string): ParsedAgent[] {
  const agents: ParsedAgent[] = [];
  const seenUsernames = new Set<string>();
  
  // Find all username patterns
  const patterns = [
    /u\/(\w{2,30})/gi,
    /(?:Posted by|by)\s+(\w{2,30})/gi,
    /@(\w{2,30})/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(markdown)) !== null) {
      const username = match[1].toLowerCase();
      // Filter out common false positives
      if (!seenUsernames.has(username) && 
          username.length >= 2 &&
          !['the', 'and', 'for', 'you', 'are', 'was', 'has', 'this', 'that', 'with'].includes(username)) {
        seenUsernames.add(username);
        agents.push({
          external_id: `agent_${username}`,
          username,
          display_name: null,
        });
      }
    }
  }
  
  return agents;
}

// Parse submolts from markdown
function parseSubmoltsFromMarkdown(markdown: string): ParsedSubmolt[] {
  const submolts: ParsedSubmolt[] = [];
  const seenNames = new Set<string>();
  
  // Find all m/submoltname patterns
  const pattern = /m\/(\w{2,30})/gi;
  let match;
  
  while ((match = pattern.exec(markdown)) !== null) {
    const name = match[1].toLowerCase();
    if (!seenNames.has(name)) {
      seenNames.add(name);
      submolts.push({
        external_id: `submolt_${name}`,
        name,
      });
    }
  }
  
  return submolts;
}

// Calculate text metrics for a post
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
    // FIXED: Default URL is now moltbook.com
    const targetUrl = url || 'https://www.moltbook.com';

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

    // Parse content with improved parsing
    const parsedPosts = parsePostsFromMarkdown(markdown, targetUrl);
    const parsedAgents = parseAgentsFromMarkdown(markdown);
    const parsedSubmolts = parseSubmoltsFromMarkdown(markdown);

    console.log(`[${user.id}] Parsed ${parsedPosts.length} posts, ${parsedAgents.length} agents, ${parsedSubmolts.length} submolts`);

    let postsInserted = 0;
    let agentsInserted = 0;
    let submoltsInserted = 0;

    // 1. First, upsert all submolts
    const submoltIdMap = new Map<string, string>();
    
    for (const submolt of parsedSubmolts) {
      const { data: existingSubmolt } = await supabaseAdmin
        .from('submolts')
        .select('id')
        .eq('name', submolt.name)
        .single();
      
      if (existingSubmolt) {
        submoltIdMap.set(submolt.name, existingSubmolt.id);
        // Update last_scraped_at
        await supabaseAdmin
          .from('submolts')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', existingSubmolt.id);
      } else {
        const { data: newSubmolt, error: submoltError } = await supabaseAdmin
          .from('submolts')
          .insert({
            external_id: submolt.external_id,
            name: submolt.name,
            first_seen_at: new Date().toISOString(),
            last_scraped_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        
        if (!submoltError && newSubmolt) {
          submoltIdMap.set(submolt.name, newSubmolt.id);
          submoltsInserted++;
        } else if (submoltError) {
          console.error('Submolt upsert error:', submoltError);
        }
      }
    }

    console.log(`[${user.id}] Submolts upserted: ${submoltsInserted} new, ${submoltIdMap.size} total`);

    // 2. Upsert all agents
    const agentIdMap = new Map<string, string>();
    
    for (const agent of parsedAgents) {
      const { data: existingAgent } = await supabaseAdmin
        .from('agents')
        .select('id')
        .eq('username', agent.username)
        .single();
      
      if (existingAgent) {
        agentIdMap.set(agent.username, existingAgent.id);
        // Update last_seen_at
        await supabaseAdmin
          .from('agents')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', existingAgent.id);
      } else {
        const { data: newAgent, error: agentError } = await supabaseAdmin
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
        
        if (!agentError && newAgent) {
          agentIdMap.set(agent.username, newAgent.id);
          agentsInserted++;
        } else if (agentError) {
          console.error('Agent upsert error:', agentError);
        }
      }
    }

    console.log(`[${user.id}] Agents upserted: ${agentsInserted} new, ${agentIdMap.size} total`);

    // 3. Upsert all posts with proper FK linkage
    // First, ensure all agent usernames from posts are in our map
    for (const post of parsedPosts) {
      if (post.agent_username && !agentIdMap.has(post.agent_username)) {
        // Try to find this agent in the database
        const { data: existingAgent } = await supabaseAdmin
          .from('agents')
          .select('id')
          .eq('username', post.agent_username)
          .single();
        
        if (existingAgent) {
          agentIdMap.set(post.agent_username, existingAgent.id);
        } else {
          // Create the agent
          const { data: newAgent, error: agentError } = await supabaseAdmin
            .from('agents')
            .insert({
              external_id: `agent_${post.agent_username}`,
              username: post.agent_username,
              first_seen_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
            })
            .select('id')
            .single();
          
          if (!agentError && newAgent) {
            agentIdMap.set(post.agent_username, newAgent.id);
            agentsInserted++;
          }
        }
      }
    }

    console.log(`[${user.id}] Agent map size after post processing: ${agentIdMap.size}`);

    const agentPostCounts = new Map<string, number>();
    
    for (const post of parsedPosts) {
      const agentId = post.agent_username ? agentIdMap.get(post.agent_username) || null : null;
      const submoltId = post.submolt_name ? submoltIdMap.get(post.submolt_name) || null : null;
      
      // Track post counts per agent
      if (post.agent_username && agentId) {
        agentPostCounts.set(post.agent_username, (agentPostCounts.get(post.agent_username) || 0) + 1);
      }
      
      // Calculate text metrics
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
    for (const [username, postCount] of agentPostCounts) {
      const agentId = agentIdMap.get(username);
      if (agentId) {
        // Get actual total post count from database
        const { count } = await supabaseAdmin
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', agentId);
        
        await supabaseAdmin
          .from('agents')
          .update({ 
            post_count: count || postCount,
            last_seen_at: new Date().toISOString()
          })
          .eq('id', agentId);
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

    console.log(`[${user.id}] Job completed: ${job.id} - ${postsInserted} posts, ${agentsInserted} agents, ${submoltsInserted} submolts`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        data: {
          url: targetUrl,
          postsInserted,
          agentsInserted,
          submoltsInserted,
          linksCount: links.length,
          rawPostsFound: parsedPosts.length,
          rawAgentsFound: parsedAgents.length,
          rawSubmoltsFound: parsedSubmolts.length,
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
