import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubmoltWithStats {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  first_seen_at: string;
  last_scraped_at: string | null;
  post_count: number;
}

export function useSubmolts() {
  return useQuery({
    queryKey: ['submolts'],
    queryFn: async (): Promise<SubmoltWithStats[]> => {
      // Get all submolts
      const { data: submolts, error: submoltsError } = await supabase
        .from('submolts')
        .select('id, name, description, member_count, first_seen_at, last_scraped_at')
        .order('member_count', { ascending: false });

      if (submoltsError) {
        console.error('Error fetching submolts:', submoltsError);
        throw submoltsError;
      }

      // Get post counts for each submolt
      const submoltsWithStats = await Promise.all(
        (submolts || []).map(async (submolt) => {
          const { count } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('submolt_id', submolt.id);

          return {
            ...submolt,
            post_count: count || 0,
          };
        })
      );

      // Sort by post count descending
      return submoltsWithStats.sort((a, b) => b.post_count - a.post_count);
    },
  });
}
