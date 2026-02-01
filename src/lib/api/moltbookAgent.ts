import { supabase } from '@/integrations/supabase/client';

export interface MoltbookCredential {
  id: string;
  agent_name: string;
  claim_url: string | null;
  claim_status: 'pending_claim' | 'claimed' | 'active';
  created_at: string;
  updated_at: string;
}

export interface RegisterResult {
  success: boolean;
  claim_url?: string;
  agent_name?: string;
  error?: string;
}

export interface MoltbookPost {
  id: string;
  title: string;
  content: string;
  submolt: string;
  author: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
}

export interface MoltbookFeed {
  posts: MoltbookPost[];
  hasMore: boolean;
}

export const moltbookAgentApi = {
  /**
   * Register a new agent on Moltbook
   */
  async register(agentName: string): Promise<RegisterResult> {
    try {
      const { data, error } = await supabase.functions.invoke('moltbook-agent', {
        body: { action: 'register', agentName },
      });

      if (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
      }

      return data as RegisterResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return { success: false, error: message };
    }
  },

  /**
   * Get user's Moltbook credentials
   */
  async getCredentials(): Promise<MoltbookCredential | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('moltbook_credentials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to get credentials:', error);
      return null;
    }

    return data as MoltbookCredential | null;
  },

  /**
   * Fetch the Moltbook feed
   */
  async getFeed(page = 0, submolt?: string): Promise<MoltbookFeed> {
    try {
      const { data, error } = await supabase.functions.invoke('moltbook-agent', {
        body: { action: 'feed', page, submolt },
      });

      if (error) {
        console.error('Feed error:', error);
        return { posts: [], hasMore: false };
      }

      return data as MoltbookFeed;
    } catch (err) {
      console.error('Feed fetch error:', err);
      return { posts: [], hasMore: false };
    }
  },

  /**
   * Create a new post
   */
  async createPost(submolt: string, title: string, content: string): Promise<{ success: boolean; error?: string; postId?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('moltbook-agent', {
        body: { action: 'post', submolt, title, content },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Post creation failed';
      return { success: false, error: message };
    }
  },

  /**
   * Add a comment to a post
   */
  async comment(postId: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('moltbook-agent', {
        body: { action: 'comment', postId, content },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Comment failed';
      return { success: false, error: message };
    }
  },

  /**
   * Upvote/downvote a post
   */
  async vote(postId: string, direction: 'up' | 'down'): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('moltbook-agent', {
        body: { action: 'vote', postId, direction },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vote failed';
      return { success: false, error: message };
    }
  },

  /**
   * Search Moltbook
   */
  async search(query: string): Promise<MoltbookPost[]> {
    try {
      const { data, error } = await supabase.functions.invoke('moltbook-agent', {
        body: { action: 'search', query },
      });

      if (error) {
        console.error('Search error:', error);
        return [];
      }

      return (data?.posts || []) as MoltbookPost[];
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  },
};
