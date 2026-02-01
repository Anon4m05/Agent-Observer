const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url, scope = 'full', targetId } = await req.json();

    // Default URL if not provided (for full scrapes)
    const targetUrl = url || 'https://www.moltbook.app';

    console.log(`[${user.id}] Starting scrape - URL: ${targetUrl}, scope: ${scope}`);

    // Create scrape job record
    const { data: job, error: jobError } = await supabase
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
      
      // Update job as failed
      await supabase
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

    // Extract data from scrape result
    const data = scrapeResult.data || scrapeResult;
    const markdown = data.markdown || '';
    const links = data.links || [];
    const metadata = data.metadata || {};

    // Update job with results
    await supabase
      .from('scrape_jobs')
      .update({
        status: 'completed',
        posts_scraped: 1,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log(`[${user.id}] Job completed: ${job.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        data: {
          url: targetUrl,
          markdown: markdown.substring(0, 1000), // Preview
          linksCount: links.length,
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
