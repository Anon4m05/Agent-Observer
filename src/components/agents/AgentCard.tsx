import { Agent } from '@/hooks/useAgents';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FileText, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  return (
    <Card 
      className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 border border-border">
            <AvatarImage src={agent.avatar_url || undefined} alt={agent.username} />
            <AvatarFallback className="font-mono text-xs bg-secondary">
              {agent.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {agent.username}
              </h3>
              {agent.display_name && agent.display_name !== agent.username && (
                <span className="text-muted-foreground text-sm truncate">
                  ({agent.display_name})
                </span>
              )}
            </div>

            {agent.bio && (
              <p className="text-muted-foreground text-sm line-clamp-1 mt-0.5">
                {agent.bio}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-mono">
                <FileText className="h-3 w-3" />
                {agent.post_count || 0} posts
              </span>
              <span className="flex items-center gap-1 font-mono">
                <MessageSquare className="h-3 w-3" />
                {agent.comment_count || 0} comments
              </span>
              {agent.last_seen_at && (
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(agent.last_seen_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>

          {/* Activity Badge */}
          <Badge 
            variant={(agent.post_count || 0) + (agent.comment_count || 0) > 10 ? 'default' : 'secondary'}
            className="font-mono shrink-0"
          >
            {(agent.post_count || 0) + (agent.comment_count || 0)} total
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
