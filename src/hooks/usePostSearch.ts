import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PostWithRelations {
  id: string;
  external_id: string;
  title: string | null;
  content: string | null;
  url: string | null;
  upvotes: number | null;
  downvotes: number | null;
  comment_count: number | null;
  posted_at: string | null;
  scraped_at: string;
  word_count: number | null;
  char_count: number | null;
  agent: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  submolt: {
    id: string;
    name: string;
  } | null;
}

export interface SearchFilters {
  query: string;
  submoltId: string | null;
  agentId: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  minEngagement: number;
  sortBy: 'posted_at' | 'upvotes' | 'comment_count';
  sortOrder: 'asc' | 'desc';
}

export interface UsePostSearchResult {
  posts: PostWithRelations[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  search: (filters: SearchFilters, page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

const PAGE_SIZE = 20;

export function usePostSearch(): UsePostSearchResult {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters | null>(null);

  const search = useCallback(async (filters: SearchFilters, pageNum = 0) => {
    setLoading(true);
    setError(null);
    setCurrentFilters(filters);
    setPage(pageNum);

    try {
      let query = supabase
        .from('posts')
        .select(`
          id,
          external_id,
          title,
          content,
          url,
          upvotes,
          downvotes,
          comment_count,
          posted_at,
          scraped_at,
          word_count,
          char_count,
          agent:agents!posts_agent_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          ),
          submolt:submolts!posts_submolt_id_fkey (
            id,
            name
          )
        `, { count: 'exact' });

      // Apply text search
      if (filters.query.trim()) {
        query = query.or(`title.ilike.%${filters.query}%,content.ilike.%${filters.query}%`);
      }

      // Filter by submolt
      if (filters.submoltId) {
        query = query.eq('submolt_id', filters.submoltId);
      }

      // Filter by agent
      if (filters.agentId) {
        query = query.eq('agent_id', filters.agentId);
      }

      // Date range filters
      if (filters.dateFrom) {
        query = query.gte('posted_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('posted_at', filters.dateTo.toISOString());
      }

      // Minimum engagement filter
      if (filters.minEngagement > 0) {
        query = query.gte('upvotes', filters.minEngagement);
      }

      // Sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc', nullsFirst: false });

      // Pagination
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        throw queryError;
      }

      const typedData = (data || []) as unknown as PostWithRelations[];

      if (pageNum === 0) {
        setPosts(typedData);
      } else {
        setPosts(prev => [...prev, ...typedData]);
      }
      
      setTotalCount(count || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search posts';
      setError(message);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!currentFilters || loading) return;
    await search(currentFilters, page + 1);
  }, [currentFilters, loading, page, search]);

  const reset = useCallback(() => {
    setPosts([]);
    setTotalCount(0);
    setPage(0);
    setError(null);
    setCurrentFilters(null);
  }, []);

  return {
    posts,
    loading,
    error,
    totalCount,
    page,
    pageSize: PAGE_SIZE,
    hasMore: posts.length < totalCount,
    search,
    loadMore,
    reset,
  };
}
