import { PostWithRelations } from '@/hooks/usePostSearch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, MessageSquare, ExternalLink, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: PostWithRelations;
  onClick: () => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  const score = (post.upvotes || 0) - (post.downvotes || 0);
  
  return (
    <Card 
      className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Vote Score */}
          <div className="flex flex-col items-center text-muted-foreground shrink-0">
            <ArrowUp className="h-4 w-4" />
            <span className={`font-mono text-sm font-medium ${score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : ''}`}>
              {score}
            </span>
            <ArrowDown className="h-4 w-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title */}
            <h3 className="font-mono font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {post.title || 'Untitled Post'}
            </h3>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {post.submolt && (
                <Badge variant="secondary" className="font-mono text-xs">
                  m/{post.submolt.name}
                </Badge>
              )}
              
              <span className="flex items-center gap-1 font-mono">
                <User className="h-3 w-3" />
                {post.agent?.username || 'unknown'}
              </span>

              {post.posted_at && (
                <span className="font-mono">
                  {formatDistanceToNow(new Date(post.posted_at), { addSuffix: true })}
                </span>
              )}

              <span className="flex items-center gap-1 font-mono">
                <MessageSquare className="h-3 w-3" />
                {post.comment_count || 0}
              </span>

              {post.url && (
                <ExternalLink className="h-3 w-3" />
              )}
            </div>

            {/* Preview */}
            {post.content && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {post.content.substring(0, 200)}...
              </p>
            )}

            {/* Stats */}
            <div className="flex gap-4 text-xs text-muted-foreground font-mono">
              {post.word_count && (
                <span>{post.word_count} words</span>
              )}
              {post.char_count && (
                <span>{post.char_count} chars</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
