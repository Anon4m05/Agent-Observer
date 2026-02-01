import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PostWithRelations } from '@/hooks/usePostSearch';
import { supabase } from '@/integrations/supabase/client';
import { ArrowUp, ArrowDown, MessageSquare, User, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Comment {
  id: string;
  content: string | null;
  upvotes: number | null;
  downvotes: number | null;
  posted_at: string | null;
  reply_depth: number | null;
  agent: {
    username: string;
    display_name: string | null;
  } | null;
}

interface PostDetailProps {
  post: PostWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostDetail({ post, open, onOpenChange }: PostDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (post && open) {
      loadComments();
    }
  }, [post, open]);

  const loadComments = async () => {
    if (!post) return;
    
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          upvotes,
          downvotes,
          posted_at,
          reply_depth,
          agent:agents!comments_agent_id_fkey (
            username,
            display_name
          )
        `)
        .eq('post_id', post.id)
        .order('posted_at', { ascending: true });

      if (error) throw error;
      setComments((data || []) as unknown as Comment[]);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  if (!post) return null;

  const score = (post.upvotes || 0) - (post.downvotes || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-start gap-4">
            {/* Vote Score */}
            <div className="flex flex-col items-center text-muted-foreground shrink-0 pt-1">
              <ArrowUp className="h-5 w-5" />
              <span className={`font-mono text-lg font-bold ${score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : ''}`}>
                {score}
              </span>
              <ArrowDown className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <DialogTitle className="font-mono text-xl leading-tight mb-2">
                {post.title || 'Untitled Post'}
              </DialogTitle>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                {post.submolt && (
                  <Badge variant="secondary" className="font-mono">
                    m/{post.submolt.name}
                  </Badge>
                )}
                
                <span className="flex items-center gap-1 font-mono">
                  <User className="h-4 w-4" />
                  {post.agent?.username || 'unknown'}
                </span>

                {post.posted_at && (
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-4 w-4" />
                    {format(new Date(post.posted_at), 'PPp')}
                  </span>
                )}

                {post.url && (
                  <a 
                    href={post.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Source
                  </a>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {/* Post Content */}
          <div className="py-4">
            <div className="prose prose-sm dark:prose-invert max-w-none font-mono text-foreground">
              {post.content || 'No content available.'}
            </div>

            {/* Stats */}
            <div className="flex gap-4 mt-4 text-xs text-muted-foreground font-mono">
              <span>{post.word_count || 0} words</span>
              <span>{post.char_count || 0} characters</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {post.comment_count || 0} comments
              </span>
            </div>
          </div>

          <Separator />

          {/* Comments Section */}
          <div className="py-4 space-y-4">
            <h3 className="font-mono font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </h3>

            {loadingComments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-muted-foreground text-sm font-mono text-center py-8">
                No comments archived for this post
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => {
                  const commentScore = (comment.upvotes || 0) - (comment.downvotes || 0);
                  return (
                    <div 
                      key={comment.id} 
                      className="rounded-md border border-border p-3"
                      style={{ marginLeft: `${(comment.reply_depth || 0) * 16}px` }}
                    >
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="font-mono font-medium text-foreground">
                          {comment.agent?.username || 'unknown'}
                        </span>
                        <span className={`font-mono ${commentScore > 0 ? 'text-primary' : commentScore < 0 ? 'text-destructive' : ''}`}>
                          {commentScore > 0 ? '+' : ''}{commentScore} pts
                        </span>
                        {comment.posted_at && (
                          <span className="font-mono">
                            {formatDistanceToNow(new Date(comment.posted_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground font-mono">
                        {comment.content || '[deleted]'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
