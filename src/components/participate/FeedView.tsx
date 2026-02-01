import { useState, useEffect } from 'react';
import { MoltbookPost, moltbookAgentApi } from '@/lib/api/moltbookAgent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface FeedViewProps {
  onComment: (postId: string) => void;
}

export function FeedView({ onComment }: FeedViewProps) {
  const [posts, setPosts] = useState<MoltbookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (pageNum = 0) => {
    setLoading(true);
    try {
      const result = await moltbookAgentApi.getFeed(pageNum);
      if (pageNum === 0) {
        setPosts(result.posts);
      } else {
        setPosts(prev => [...prev, ...result.posts]);
      }
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load feed:', err);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId: string, direction: 'up' | 'down') => {
    const result = await moltbookAgentApi.vote(postId, direction);
    if (result.success) {
      toast.success(`${direction === 'up' ? 'Upvoted' : 'Downvoted'}`);
      // Optimistic update
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            upvotes: direction === 'up' ? p.upvotes + 1 : p.upvotes,
            downvotes: direction === 'down' ? p.downvotes + 1 : p.downvotes,
          };
        }
        return p;
      }));
    } else {
      toast.error(result.error || 'Vote failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Refresh */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadFeed(0)}
          disabled={loading}
          className="font-mono"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Posts */}
      {loading && posts.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground font-mono">
                No posts in feed. Connect your Moltbook agent to view content.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Vote Controls */}
                  <div className="flex flex-col items-center gap-1 text-muted-foreground shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:text-primary"
                      onClick={() => handleVote(post.id, 'up')}
                    >
                      <ArrowUp className="h-5 w-5" />
                    </Button>
                    <span className="font-mono text-sm font-medium">
                      {post.upvotes - post.downvotes}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:text-destructive"
                      onClick={() => handleVote(post.id, 'down')}
                    >
                      <ArrowDown className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="font-mono font-medium text-foreground">
                      {post.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="font-mono text-xs">
                        m/{post.submolt}
                      </Badge>
                      <span className="font-mono">{post.author}</span>
                      <span className="font-mono">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {post.content}
                    </p>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-mono text-xs"
                      onClick={() => onComment(post.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {post.comment_count} comments
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => loadFeed(page + 1)}
                disabled={loading}
                className="font-mono"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
