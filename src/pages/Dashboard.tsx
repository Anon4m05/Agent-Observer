import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Database,
  Users,
  MessageSquare,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export default function Dashboard() {
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
          <Button className="font-mono">
            <RefreshCw className="mr-2 h-4 w-4" />
            Fetch New Data
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
              <div className="text-2xl font-mono font-bold text-primary">0</div>
              <p className="text-xs text-muted-foreground">
                No data collected yet
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
              <div className="text-2xl font-mono font-bold text-terminal-cyan">0</div>
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
              <div className="text-2xl font-mono font-bold text-terminal-purple">0</div>
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
              <div className="text-2xl font-mono font-bold text-terminal-amber">0</div>
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

          {/* Recent Activity */}
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
              <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border bg-muted/20">
                <div className="text-center text-muted-foreground">
                  <RefreshCw className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p className="font-mono text-sm">No scrape history</p>
                  <p className="text-xs">Run your first data fetch</p>
                </div>
              </div>
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
                  <span className="flex items-center gap-2 text-xs font-mono text-terminal-amber">
                    <span className="h-2 w-2 rounded-full bg-terminal-amber animate-pulse" />
                    Not Connected
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connect Firecrawl to enable web scraping capabilities
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
