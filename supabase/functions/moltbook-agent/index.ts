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

    const body = await req.json();
    const { action } = body;

    console.log(`[${user.id}] Moltbook agent action: ${action}`);

    switch (action) {
      case 'register': {
        const { agentName } = body;
        
        if (!agentName || typeof agentName !== 'string') {
          return new Response(
            JSON.stringify({ success: false, error: 'Agent name is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if user already has a credential
        const { data: existing } = await supabase
          .from('moltbook_credentials')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existing) {
          return new Response(
            JSON.stringify({ success: false, error: 'You already have a registered agent' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Generate claim URL (in a real implementation, this would call the Moltbook API)
        const claimToken = crypto.randomUUID();
        const claimUrl = `https://moltbook.app/claim/${claimToken}`;

        // Store credential
        const { error: insertError } = await supabase
          .from('moltbook_credentials')
          .insert({
            user_id: user.id,
            agent_name: agentName,
            claim_url: claimUrl,
            claim_status: 'pending_claim',
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to register agent' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[${user.id}] Registered agent: ${agentName}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            claim_url: claimUrl,
            agent_name: agentName,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'feed': {
        const { page = 0, submolt } = body;
        
        // In a real implementation, this would call the Moltbook API
        // For now, return empty feed as a placeholder
        console.log(`[${user.id}] Fetching feed page ${page}${submolt ? ` for m/${submolt}` : ''}`);

        return new Response(
          JSON.stringify({ 
            posts: [],
            hasMore: false,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'post': {
        const { submolt, title, content } = body;
        
        if (!submolt || !title || !content) {
          return new Response(
            JSON.stringify({ success: false, error: 'Submolt, title, and content are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get user's credential
        const { data: credential } = await supabase
          .from('moltbook_credentials')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!credential || credential.claim_status !== 'active') {
          return new Response(
            JSON.stringify({ success: false, error: 'Agent not active. Please claim your agent first.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // In a real implementation, this would call the Moltbook API to create the post
        console.log(`[${user.id}] Creating post in m/${submolt}: ${title}`);

        return new Response(
          JSON.stringify({ 
            success: true,
            postId: crypto.randomUUID(),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'comment': {
        const { postId, content } = body;
        
        if (!postId || !content) {
          return new Response(
            JSON.stringify({ success: false, error: 'Post ID and content are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get user's credential
        const { data: credential } = await supabase
          .from('moltbook_credentials')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!credential || credential.claim_status !== 'active') {
          return new Response(
            JSON.stringify({ success: false, error: 'Agent not active' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[${user.id}] Adding comment to post ${postId}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'vote': {
        const { postId, direction } = body;
        
        if (!postId || !['up', 'down'].includes(direction)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Post ID and valid direction required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[${user.id}] Voting ${direction} on post ${postId}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'search': {
        const { query } = body;
        
        if (!query) {
          return new Response(
            JSON.stringify({ posts: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[${user.id}] Searching: ${query}`);

        return new Response(
          JSON.stringify({ posts: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in moltbook-agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
