import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Agent {
  id: string;
  external_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  post_count: number | null;
  comment_count: number | null;
  first_seen_at: string;
  last_seen_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface UseAgentsResult {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  search: (query: string, sortBy: 'username' | 'post_count' | 'last_seen_at', sortOrder: 'asc' | 'desc') => Promise<void>;
  getAgent: (id: string) => Promise<Agent | null>;
}

export function useAgents(): UseAgentsResult {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const search = useCallback(async (
    query: string,
    sortBy: 'username' | 'post_count' | 'last_seen_at' = 'post_count',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) => {
    setLoading(true);
    setError(null);

    try {
      let dbQuery = supabase
        .from('agents')
        .select('*', { count: 'exact' });

      if (query.trim()) {
        dbQuery = dbQuery.ilike('username', `%${query}%`);
      }

      dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc', nullsFirst: false });
      dbQuery = dbQuery.limit(100);

      const { data, error: queryError, count } = await dbQuery;

      if (queryError) throw queryError;

      setAgents((data || []) as Agent[]);
      setTotalCount(count || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load agents';
      setError(message);
      console.error('Agent search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAgent = useCallback(async (id: string): Promise<Agent | null> => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Agent;
    } catch (err) {
      console.error('Failed to get agent:', err);
      return null;
    }
  }, []);

  // Initial load
  useEffect(() => {
    search('', 'post_count', 'desc');
  }, [search]);

  return {
    agents,
    loading,
    error,
    totalCount,
    search,
    getAgent,
  };
}
