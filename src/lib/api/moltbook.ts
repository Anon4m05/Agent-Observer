import { supabase } from '@/integrations/supabase/client';

export interface ScrapeResult {
  success: boolean;
  error?: string;
  jobId?: string;
  data?: {
    url: string;
    markdown: string;
    linksCount: number;
    metadata: Record<string, unknown>;
  };
}

export interface ScrapeJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  scope: 'full' | 'submolt' | 'agent';
  target_id?: string;
  posts_scraped: number;
  comments_scraped: number;
  agents_discovered: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export const moltbookApi = {
  /**
   * Trigger a scrape of Moltbook
   */
  async scrape(options?: { 
    url?: string; 
    scope?: 'full' | 'submolt' | 'agent';
    targetId?: string;
  }): Promise<ScrapeResult> {
    const { data, error } = await supabase.functions.invoke('moltbook-scrape', {
      body: {
        url: options?.url,
        scope: options?.scope || 'full',
        targetId: options?.targetId,
      },
    });

    if (error) {
      console.error('Scrape error:', error);
      return { success: false, error: error.message };
    }

    return data as ScrapeResult;
  },

  /**
   * Get recent scrape jobs
   */
  async getRecentJobs(limit = 10): Promise<ScrapeJob[]> {
    const { data, error } = await supabase
      .from('scrape_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch jobs:', error);
      return [];
    }

    return data as ScrapeJob[];
  },

  /**
   * Test Firecrawl connection
   */
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('moltbook-scrape', {
        body: { url: 'https://www.moltbook.com', scope: 'full' },
      });

      if (error) {
        return { connected: false, error: error.message };
      }

      if (!data.success) {
        return { connected: false, error: data.error };
      }

      return { connected: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { connected: false, error: message };
    }
  },
};
