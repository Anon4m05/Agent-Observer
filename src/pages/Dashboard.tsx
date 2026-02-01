import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { moltbookApi, ScrapeJob } from '@/lib/api/moltbook';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Activity,
  Database,
  Users,
  MessageSquare,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

export default function Dashboard() {
  const [scraping, setScraping] = useState(false);
  const [recentJobs, setRecentJobs] = useState<ScrapeJob[]>([]);
  const [stats, setStats] = useState({ posts: 0, agents: 0, comments: 0, submolts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const [postsRes, agentsRes, commentsRes, submoltsRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('agents').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('submolts').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        posts: postsRes.count || 0,
        agents: agentsRes.count || 0,
        comments: commentsRes.count || 0,
        submolts: submoltsRes.count || 0,
      });

      // Fetch recent jobs
      const jobs = await moltbookApi.getRecentJobs(5);
      setRecentJobs(jobs);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = async () => {
    setScraping(true);
    try {
      const result = await moltbookApi.scrape();
      
      if (result.success) {
        toast.success('Data fetched successfully');
        loadData();
      } else {
        toast.error(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Fetch error:', error);
    } finally {
      setScraping(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-mono tracking-tight">
              Ecosystem Overview
            </h1>
            <p className="text-muted-foreground text-sm">
              Monitor Moltbook activity and behavioral patterns
            </p>
          </div>
          <Button className="font-mono" onClick={handleFetch} disabled={scraping}>
            {scraping ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {scraping ? 'Fetching...' : 'Fetch New Data'}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono font-medium text-muted-foreground">
                Total Posts
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono font-bold text-primary">
                {loading ? '-' : stats.posts.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.posts === 0 ? 'No data collected yet' : 'Archived posts'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono font-medium text-muted-foreground">
                Active Agents
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono font-bold text-terminal-cyan">
                {loading ? '-' : stats.agents.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Discovered agents
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono font-medium text-muted-foreground">
                Comments
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono font-bold text-terminal-purple">
                {loading ? '-' : stats.comments.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total interactions
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-mono font-medium text-muted-foreground">
                Submolts
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-mono font-bold text-terminal-amber">
                {loading ? '-' : stats.submolts.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Communities tracked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activity Chart Placeholder */}
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Activity Over Time
              </CardTitle>
              <CardDescription>
                Posts and comments activity heatmap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border bg-muted/20">
                <div className="text-center text-muted-foreground">
                  <Database className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p className="font-mono text-sm">No data available</p>
                  <p className="text-xs">Fetch data to see activity patterns</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Scrapes */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-terminal-cyan" />
                Recent Scrapes
              </CardTitle>
              <CardDescription>
                Latest data collection runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentJobs.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border bg-muted/20">
                  <div className="text-center text-muted-foreground">
                    <RefreshCw className="mx-auto h-10 w-10 mb-2 opacity-50" />
                    <p className="font-mono text-sm">No scrape history</p>
                    <p className="text-xs">Run your first data fetch</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                      {job.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      ) : job.status === 'failed' ? (
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      ) : job.status === 'running' ? (
                        <Loader2 className="h-4 w-4 text-terminal-cyan animate-spin shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs text-foreground truncate">
                          {job.scope === 'full' ? 'Full Sweep' : `${job.scope}: ${job.target_id || 'N/A'}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(job.completed_at || job.started_at || job.created_at)}
                        </p>
                      </div>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                        job.status === 'completed' ? 'bg-primary/20 text-primary' :
                        job.status === 'failed' ? 'bg-destructive/20 text-destructive' :
                        job.status === 'running' ? 'bg-terminal-cyan/20 text-terminal-cyan' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Connection Status */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-terminal-amber" />
              System Status
            </CardTitle>
            <CardDescription>
              Data source connection and scraping infrastructure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-muted-foreground">Firecrawl Connection</span>
                  <span className="flex items-center gap-2 text-xs font-mono text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Connected
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Web scraping capabilities enabled
                </p>
              </div>
              <div className="rounded-md border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-muted-foreground">Database</span>
                  <span className="flex items-center gap-2 text-xs font-mono text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Connected
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Archive database ready to store collected data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
