// Observatory API client for internal use
// The actual endpoint is public and requires auth via x-observatory-key header

const OBSERVATORY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moltbook-observatory`;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ApiResponse<T> {
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

export interface ApiError {
  success: false;
  error: string;
  code: string;
}

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
  bio: string | null;
  post_count: number;
  comment_count: number;
  karma: number;
  first_seen: string;
  last_seen: string | null;
  behavioral_signature: {
    vocabulary_diversity: number;
    avg_post_length: number;
    posts_per_day: number;
    engagement_ratio: number;
  };
  primary_submolt: string | null;
  claimed_status: 'claimed' | 'unclaimed';
}

export interface ObservatoryPost {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  agent: string;
  agent_display_name: string | null;
  submolt: string | null;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  word_count: number;
  posted_at: string;
}

export interface ObservatoryComment {
  id: string;
  content: string | null;
  agent: string;
  agent_display_name: string | null;
  parent_id: string | null;
  reply_depth: number;
  upvotes: number;
  downvotes: number;
  posted_at: string;
}

export interface ObservatorySubmolt {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  post_count: number;
  created_at: string;
  last_activity: string | null;
}

export interface AlertsData {
  rules: Array<{
    id: string;
    name: string;
    type: string;
    target: string;
    threshold: number | null;
    enabled: boolean;
    created_at: string;
    updated_at: string;
  }>;
  triggered: Array<{
    id: string;
    title: string;
    message: string | null;
    severity: string;
    created_at: string;
    read: boolean;
    rule_id: string | null;
    post_id: string | null;
    agent_id: string | null;
  }>;
  unread_count: number;
}

export interface ScrapeJob {
  job_id: string;
  status: string;
  scope: string;
  target_id: string | null;
  posts_scraped: number;
  comments_scraped: number;
  agents_discovered: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface SearchResults {
  query: string;
  type: string;
  results: {
    posts: Array<{ id: string; title: string; agent: string; submolt: string | null; posted_at: string }>;
    agents: Array<{ id: string; username: string; display_name: string | null; post_count: number }>;
    submolts: Array<{ id: string; name: string; description: string | null; member_count: number }>;
  };
  total_results: number;
}

export interface ScrapeResult {
  job_id: string;
  status: string;
  scope: string;
  target_id: string | null;
}

export interface CreateAlertResult {
  rule_id: string;
  created: boolean;
  name: string;
  type: string;
  target: string;
  threshold: number | null;
}

export interface MarkAlertsReadResult {
  updated_count: number;
  marked_all: boolean;
}

// ============================================================================
// API CLIENT
// ============================================================================

type ObservatoryResponse<T> = ApiResponse<T> | ApiError;

function isError(response: unknown): response is ApiError {
  return typeof response === 'object' && response !== null && 'success' in response && (response as ApiError).success === false;
}

async function fetchObservatory<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ObservatoryResponse<T>> {
  const response = await fetch(`${OBSERVATORY_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return response.json();
}

export const observatoryApi = {
  /**
   * Check if response is an error
   */
  isError,

  // ============================================================================
  // READ ENDPOINTS
  // ============================================================================

  /**
   * Get ecosystem summary with stats, recent activity, and notable agents
   */
  async getSummary(): Promise<ObservatoryResponse<EcosystemSummary>> {
    return fetchObservatory<EcosystemSummary>('?view=summary');
  },

  /**
   * Get agent directory with behavioral fingerprints
   */
  async getAgents(options?: { 
    limit?: number;
    offset?: number;
    sort?: 'recent' | 'karma' | 'posts' | 'engagement';
    since?: string;
  }): Promise<ObservatoryResponse<AgentFingerprint[]>> {
    const params = new URLSearchParams({ view: 'agents' });
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    if (options?.sort) params.set('sort', options.sort);
    if (options?.since) params.set('since', options.since);
    return fetchObservatory<AgentFingerprint[]>(`?${params.toString()}`);
  },

  /**
   * Get posts with full content
   */
  async getPosts(options?: { 
    limit?: number;
    offset?: number;
    sort?: 'new' | 'top' | 'discussed';
    submolt?: string;
    agent?: string;
    since?: string;
  }): Promise<ObservatoryResponse<ObservatoryPost[]>> {
    const params = new URLSearchParams({ view: 'posts' });
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    if (options?.sort) params.set('sort', options.sort);
    if (options?.submolt) params.set('submolt', options.submolt);
    if (options?.agent) params.set('agent', options.agent);
    if (options?.since) params.set('since', options.since);
    return fetchObservatory<ObservatoryPost[]>(`?${params.toString()}`);
  },

  /**
   * Get threaded comments for a post
   */
  async getComments(postId: string, options?: { 
    limit?: number;
  }): Promise<ObservatoryResponse<ObservatoryComment[]>> {
    const params = new URLSearchParams({ view: 'comments', post_id: postId });
    if (options?.limit) params.set('limit', options.limit.toString());
    return fetchObservatory<ObservatoryComment[]>(`?${params.toString()}`);
  },

  /**
   * Get submolt directory
   */
  async getSubmolts(options?: { 
    limit?: number;
    sort?: 'members' | 'activity' | 'recent';
  }): Promise<ObservatoryResponse<ObservatorySubmolt[]>> {
    const params = new URLSearchParams({ view: 'submolts' });
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.sort) params.set('sort', options.sort);
    return fetchObservatory<ObservatorySubmolt[]>(`?${params.toString()}`);
  },

  /**
   * Get alert rules and triggered alerts
   */
  async getAlerts(): Promise<ObservatoryResponse<AlertsData>> {
    return fetchObservatory<AlertsData>('?view=alerts');
  },

  /**
   * Get scrape job history
   */
  async getScrapeJobs(options?: { 
    limit?: number;
  }): Promise<ObservatoryResponse<ScrapeJob[]>> {
    const params = new URLSearchParams({ view: 'scrape_jobs' });
    if (options?.limit) params.set('limit', options.limit.toString());
    return fetchObservatory<ScrapeJob[]>(`?${params.toString()}`);
  },

  /**
   * Search across posts, agents, and submolts
   */
  async search(query: string, options?: {
    type?: 'all' | 'posts' | 'agents' | 'submolts';
  }): Promise<ObservatoryResponse<SearchResults>> {
    const params = new URLSearchParams({ view: 'search', q: query });
    if (options?.type) params.set('type', options.type);
    return fetchObservatory<SearchResults>(`?${params.toString()}`);
  },

  // ============================================================================
  // ACTION ENDPOINTS
  // ============================================================================

  /**
   * Trigger a new scrape job
   */
  async triggerScrape(options?: {
    scope?: 'full' | 'submolt' | 'agent';
    target_id?: string;
  }): Promise<ObservatoryResponse<ScrapeResult>> {
    return fetchObservatory<ScrapeResult>('?action=scrape', {
      method: 'POST',
      body: JSON.stringify({
        scope: options?.scope || 'full',
        target_id: options?.target_id,
      }),
    });
  },

  /**
   * Create a new alert rule
   */
  async createAlertRule(options: {
    name: string;
    type: 'keyword' | 'agent' | 'submolt' | 'engagement';
    target: string;
    threshold?: number;
  }): Promise<ObservatoryResponse<CreateAlertResult>> {
    return fetchObservatory<CreateAlertResult>('?action=create_alert', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  },

  /**
   * Mark alerts as read
   */
  async markAlertsRead(options: {
    alert_ids?: string[];
    all?: boolean;
  }): Promise<ObservatoryResponse<MarkAlertsReadResult>> {
    return fetchObservatory<MarkAlertsReadResult>('?action=mark_alerts_read', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  },
};
