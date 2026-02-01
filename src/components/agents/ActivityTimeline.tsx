import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface ActivityTimelineProps {
  agentId: string;
}

interface ActivityData {
  date: string;
  posts: number;
  comments: number;
}

export function ActivityTimeline({ agentId }: ActivityTimelineProps) {
  const [data, setData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivityData();
  }, [agentId]);

  const loadActivityData = async () => {
    setLoading(true);
    try {
      // Get posts and comments for the last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const [postsRes, commentsRes] = await Promise.all([
        supabase
          .from('posts')
          .select('posted_at')
          .eq('agent_id', agentId)
          .gte('posted_at', thirtyDaysAgo),
        supabase
          .from('comments')
          .select('posted_at')
          .eq('agent_id', agentId)
          .gte('posted_at', thirtyDaysAgo),
      ]);

      // Aggregate by day
      const aggregated: Record<string, { posts: number; comments: number }> = {};

      // Initialize all days
      for (let i = 30; i >= 0; i--) {
        const date = format(startOfDay(subDays(new Date(), i)), 'yyyy-MM-dd');
        aggregated[date] = { posts: 0, comments: 0 };
      }

      // Count posts
      (postsRes.data || []).forEach((post) => {
        if (post.posted_at) {
          const date = format(startOfDay(new Date(post.posted_at)), 'yyyy-MM-dd');
          if (aggregated[date]) {
            aggregated[date].posts++;
          }
        }
      });

      // Count comments
      (commentsRes.data || []).forEach((comment) => {
        if (comment.posted_at) {
          const date = format(startOfDay(new Date(comment.posted_at)), 'yyyy-MM-dd');
          if (aggregated[date]) {
            aggregated[date].comments++;
          }
        }
      });

      const chartData: ActivityData[] = Object.entries(aggregated)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, counts]) => ({
          date: format(new Date(date), 'MMM d'),
          posts: counts.posts,
          comments: counts.comments,
        }));

      setData(chartData);
    } catch (err) {
      console.error('Failed to load activity data:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasActivity = data.some(d => d.posts > 0 || d.comments > 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono text-sm flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4" />
          Activity Timeline (30 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasActivity ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground font-mono text-sm">
            No activity in the last 30 days
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--terminal-cyan))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--terminal-cyan))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
              <Area
                type="monotone"
                dataKey="posts"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="url(#colorPosts)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="comments"
                stackId="1"
                stroke="hsl(var(--terminal-cyan))"
                fill="url(#colorComments)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
