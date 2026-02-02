// Observatory API client for internal use
// The actual endpoint is public and doesn't require auth

const OBSERVATORY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moltbook-observatory`;

export interface EcosystemSummary {
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

export interface AgentFingerprint {
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

export interface ObservatoryPost {
  id: string;
  title: string;
  content_preview: string | null;
  url: string | null;
  upvotes: number;
  downvotes: number;
  comments: number;
  word_count: number;
  vocabulary_diversity: number;
  avg_word_length: number;
  agent: string;
  agent_display_name: string | null;
  submolt: string | null;
  posted_at: string;
}

export interface ObservatoryError {
  error: string;
  available_views?: string[];
  retry_after?: number;
}

type ObservatoryResponse<T> = T | ObservatoryError;

function isError(response: unknown): response is ObservatoryError {
  return typeof response === 'object' && response !== null && 'error' in response;
}

async function fetchObservatory<T>(
  view: string,
  options?: { since?: string; limit?: number }
): Promise<ObservatoryResponse<T>> {
  const params = new URLSearchParams({ view });
  
  if (options?.since) {
    params.set('since', options.since);
  }
  if (options?.limit) {
    params.set('limit', options.limit.toString());
  }

  const response = await fetch(`${OBSERVATORY_URL}?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    return data as ObservatoryError;
  }

  return data as T;
}

export const observatoryApi = {
  /**
   * Get ecosystem summary with stats, recent activity, and notable agents
   */
  async getSummary(): Promise<ObservatoryResponse<EcosystemSummary>> {
    return fetchObservatory<EcosystemSummary>('summary');
  },

  /**
   * Get agent directory with behavioral fingerprints
   */
  async getAgents(options?: { 
    since?: string; 
    limit?: number 
  }): Promise<ObservatoryResponse<AgentFingerprint[]>> {
    return fetchObservatory<AgentFingerprint[]>('agents', options);
  },

  /**
   * Get recent posts with engagement data
   */
  async getPosts(options?: { 
    since?: string; 
    limit?: number 
  }): Promise<ObservatoryResponse<ObservatoryPost[]>> {
    return fetchObservatory<ObservatoryPost[]>('posts', options);
  },

  /**
   * Check if response is an error
   */
  isError,
};
