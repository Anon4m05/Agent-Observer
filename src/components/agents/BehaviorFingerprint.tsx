import { Agent } from '@/hooks/useAgents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, FileText, MessageSquare, Hash, BarChart3 } from 'lucide-react';

interface BehaviorFingerprintProps {
  agent: Agent;
  postStats?: {
    avgWordCount: number;
    avgCharCount: number;
    totalUpvotes: number;
    totalDownvotes: number;
    avgEngagement: number;
  };
}

export function BehaviorFingerprint({ agent, postStats }: BehaviorFingerprintProps) {
  const totalActivity = (agent.post_count || 0) + (agent.comment_count || 0);
  const postRatio = totalActivity > 0 ? ((agent.post_count || 0) / totalActivity) * 100 : 0;
  
  const daysSinceFirstSeen = agent.first_seen_at 
    ? Math.floor((Date.now() - new Date(agent.first_seen_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const activityRate = daysSinceFirstSeen > 0 ? (totalActivity / daysSinceFirstSeen).toFixed(2) : '0';

  const metrics = [
    {
      label: 'Total Posts',
      value: agent.post_count || 0,
      icon: FileText,
      color: 'text-primary',
    },
    {
      label: 'Total Comments',
      value: agent.comment_count || 0,
      icon: MessageSquare,
      color: 'text-terminal-cyan',
    },
    {
      label: 'Post/Comment Ratio',
      value: `${postRatio.toFixed(0)}%`,
      icon: BarChart3,
      color: 'text-terminal-purple',
    },
    {
      label: 'Activity Rate',
      value: `${activityRate}/day`,
      icon: TrendingUp,
      color: 'text-terminal-amber',
    },
    {
      label: 'Days Active',
      value: daysSinceFirstSeen,
      icon: Clock,
      color: 'text-muted-foreground',
    },
    {
      label: 'Avg Engagement',
      value: postStats?.avgEngagement?.toFixed(1) || 'N/A',
      icon: Hash,
      color: 'text-primary',
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono text-sm flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          Behavioral Fingerprint
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <div className="flex items-center gap-2">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                <span className="text-xs text-muted-foreground">{metric.label}</span>
              </div>
              <p className={`font-mono text-lg font-bold ${metric.color}`}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        {/* Visual Fingerprint Bar */}
        <div className="mt-6 space-y-2">
          <p className="text-xs text-muted-foreground font-mono">Activity Distribution</p>
          <div className="h-4 rounded-full bg-muted overflow-hidden flex">
            <div 
              className="bg-primary transition-all" 
              style={{ width: `${postRatio}%` }}
              title={`Posts: ${postRatio.toFixed(0)}%`}
            />
            <div 
              className="bg-terminal-cyan transition-all" 
              style={{ width: `${100 - postRatio}%` }}
              title={`Comments: ${(100 - postRatio).toFixed(0)}%`}
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            <span>Posts</span>
            <span>Comments</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
