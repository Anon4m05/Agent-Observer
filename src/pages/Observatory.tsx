import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  observatoryApi, 
  EcosystemSummary, 
  AgentFingerprint 
} from '@/lib/api/observatory';
import {
  Terminal,
  Users,
  FileText,
  MessageSquare,
  Network,
  TrendingUp,
  Clock,
  Activity,
  ExternalLink,
} from 'lucide-react';

export default function Observatory() {
  const [summary, setSummary] = useState<EcosystemSummary | null>(null);
  const [agents, setAgents] = useState<AgentFingerprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const [summaryResult, agentsResult] = await Promise.all([
        observatoryApi.getSummary(),
        observatoryApi.getAgents({ limit: 20 }),
      ]);

      if (observatoryApi.isError(summaryResult)) {
        setError(summaryResult.error);
      } else {
        setSummary(summaryResult);
      }

      if (!observatoryApi.isError(agentsResult)) {
        setAgents(agentsResult);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive font-mono">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-mono text-xl font-bold text-foreground">
                  Moltbook Observatory
                </h1>
                <p className="text-xs text-muted-foreground font-mono">
                  Public Ecosystem Dashboard
                </p>
              </div>
            </div>
            <Link
              to="/signin"
              className="text-sm text-muted-foreground hover:text-primary font-mono flex items-center gap-1"
            >
              Researcher Access <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Last Updated */}
        {summary && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
            <Clock className="h-4 w-4" />
            Last updated: {new Date(summary.timestamp).toLocaleString()}
          </div>
        )}

        {/* Ecosystem Stats */}
        <section>
          <h2 className="text-lg font-mono font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Ecosystem Health
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={FileText}
              label="Total Posts"
              value={summary?.ecosystem.total_posts || 0}
              subValue={`+${summary?.recent_activity.posts_24h || 0} (24h)`}
            />
            <StatCard
              icon={Users}
              label="Total Agents"
              value={summary?.ecosystem.total_agents || 0}
              subValue={`+${summary?.recent_activity.new_agents_24h || 0} (24h)`}
            />
            <StatCard
              icon={MessageSquare}
              label="Total Comments"
              value={summary?.ecosystem.total_comments || 0}
            />
            <StatCard
              icon={Network}
              label="Submolts"
              value={summary?.ecosystem.total_submolts || 0}
            />
          </div>
        </section>

        {/* Most Active Submolts */}
        {summary?.recent_activity.most_active_submolts.length > 0 && (
          <section>
            <h2 className="text-lg font-mono font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-terminal-cyan" />
              Trending Communities (24h)
            </h2>
            <div className="flex flex-wrap gap-2">
              {summary.recent_activity.most_active_submolts.map((submolt) => (
                <Badge
                  key={submolt}
                  variant="secondary"
                  className="font-mono text-sm"
                >
                  m/{submolt}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Notable Agents */}
        <section>
          <h2 className="text-lg font-mono font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-terminal-purple" />
            Agent Leaderboard
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.slice(0, 9).map((agent, index) => (
              <Card key={agent.id} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          #{index + 1}
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                          {agent.username}
                        </span>
                      </div>
                      {agent.display_name && (
                        <p className="text-xs text-muted-foreground">
                          {agent.display_name}
                        </p>
                      )}
                    </div>
                    {agent.primary_submolt && (
                      <Badge variant="outline" className="text-xs font-mono">
                        m/{agent.primary_submolt}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-mono font-bold text-primary">
                        {agent.total_posts}
                      </p>
                      <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                    <div>
                      <p className="text-lg font-mono font-bold text-terminal-cyan">
                        {agent.engagement_ratio.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Engage</p>
                    </div>
                    <div>
                      <p className="text-lg font-mono font-bold text-terminal-amber">
                        {agent.vocabulary_diversity.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Vocab</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/50 flex justify-between text-xs text-muted-foreground font-mono">
                    <span>{agent.posts_per_day.toFixed(1)}/day</span>
                    <span>{agent.active_days}d active</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Posts */}
        <section>
          <h2 className="text-lg font-mono font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-terminal-amber" />
            Recent Activity
          </h2>
          <Card className="border-border/50">
            <CardContent className="divide-y divide-border/50">
              {summary?.recent_posts.map((post, index) => (
                <div key={index} className="py-3 first:pt-4 last:pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-foreground truncate">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-mono">
                        <span>@{post.agent}</span>
                        {post.submolt && (
                          <>
                            <span>•</span>
                            <span>m/{post.submolt}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(post.posted_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-primary">↑{post.upvotes}</span>
                      <span className="text-muted-foreground">{post.comments} comments</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* API Info */}
        <section className="pt-8 border-t border-border">
          <Card className="bg-muted/30 border-border/50">
            <CardHeader>
              <CardTitle className="font-mono text-sm text-muted-foreground">
                API Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-xs">
              <p className="text-muted-foreground">
                This data is available via public API:
              </p>
              <code className="block bg-background/50 p-2 rounded text-primary overflow-x-auto">
                GET {import.meta.env.VITE_SUPABASE_URL}/functions/v1/moltbook-observatory?view=summary
              </code>
              <p className="text-muted-foreground">
                Available views: <code>summary</code>, <code>agents</code>, <code>posts</code>
              </p>
              <p className="text-muted-foreground">
                Rate limit: 10 requests/minute
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs text-muted-foreground font-mono">
            Moltbook Macro-Behavior Analyzer • Research Infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  subValue?: string;
}

function StatCard({ icon: Icon, label, value, subValue }: StatCardProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Icon className="h-4 w-4" />
          <span className="text-xs font-mono">{label}</span>
        </div>
        <p className="text-2xl font-mono font-bold text-foreground">
          {value.toLocaleString()}
        </p>
        {subValue && (
          <p className="text-xs font-mono text-primary mt-1">{subValue}</p>
        )}
      </CardContent>
    </Card>
  );
}
