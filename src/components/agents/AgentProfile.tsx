import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Agent } from '@/hooks/useAgents';
import { BehaviorFingerprint } from './BehaviorFingerprint';
import { ActivityTimeline } from './ActivityTimeline';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Calendar, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface AgentProfileProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RecentPost {
  id: string;
  title: string | null;
  upvotes: number | null;
  posted_at: string | null;
  submolt: { name: string } | null;
}

export function AgentProfile({ agent, open, onOpenChange }: AgentProfileProps) {
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [postStats, setPostStats] = useState<{
    avgWordCount: number;
    avgCharCount: number;
    totalUpvotes: number;
    totalDownvotes: number;
    avgEngagement: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent && open) {
      loadAgentDetails();
    }
  }, [agent, open]);

  const loadAgentDetails = async () => {
    if (!agent) return;
    
    setLoading(true);
    try {
      // Fetch recent posts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          upvotes,
          posted_at,
          word_count,
          char_count,
          downvotes,
          submolt:submolts!posts_submolt_id_fkey (name)
        `)
        .eq('agent_id', agent.id)
        .order('posted_at', { ascending: false })
        .limit(5);

      if (postsError) throw postsError;

      setRecentPosts((posts || []) as unknown as RecentPost[]);

      // Compute stats from all posts
      const { data: allPosts } = await supabase
        .from('posts')
        .select('word_count, char_count, upvotes, downvotes')
        .eq('agent_id', agent.id);

      if (allPosts && allPosts.length > 0) {
        const totals = allPosts.reduce((acc, p) => ({
          wordCount: acc.wordCount + (p.word_count || 0),
          charCount: acc.charCount + (p.char_count || 0),
          upvotes: acc.upvotes + (p.upvotes || 0),
          downvotes: acc.downvotes + (p.downvotes || 0),
        }), { wordCount: 0, charCount: 0, upvotes: 0, downvotes: 0 });

        setPostStats({
          avgWordCount: Math.round(totals.wordCount / allPosts.length),
          avgCharCount: Math.round(totals.charCount / allPosts.length),
          totalUpvotes: totals.upvotes,
          totalDownvotes: totals.downvotes,
          avgEngagement: (totals.upvotes - totals.downvotes) / allPosts.length,
        });
      }
    } catch (err) {
      console.error('Failed to load agent details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-border">
              <AvatarImage src={agent.avatar_url || undefined} alt={agent.username} />
              <AvatarFallback className="font-mono text-lg bg-secondary">
                {agent.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <DialogTitle className="font-mono text-xl flex items-center gap-2">
                {agent.username}
                <Badge variant="outline" className="font-mono text-xs">
                  Agent
                </Badge>
              </DialogTitle>
              
              {agent.display_name && agent.display_name !== agent.username && (
                <p className="text-muted-foreground">{agent.display_name}</p>
              )}

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="h-3 w-3" />
                  Joined {format(new Date(agent.first_seen_at), 'PP')}
                </span>
                {agent.last_seen_at && (
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3" />
                    Last seen {formatDistanceToNow(new Date(agent.last_seen_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Bio */}
            {agent.bio && (
              <>
                <div>
                  <h4 className="font-mono text-sm text-muted-foreground mb-2">Bio</h4>
                  <p className="text-sm">{agent.bio}</p>
                </div>
                <Separator />
              </>
            )}

            {/* Behavioral Fingerprint */}
            <BehaviorFingerprint agent={agent} postStats={postStats || undefined} />

            {/* Activity Timeline */}
            <ActivityTimeline agentId={agent.id} />

            {/* Recent Posts */}
            <div>
              <h4 className="font-mono text-sm text-muted-foreground mb-3">Recent Posts</h4>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentPosts.length === 0 ? (
                <p className="text-muted-foreground text-sm font-mono text-center py-8">
                  No posts found
                </p>
              ) : (
                <div className="space-y-2">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="rounded-md border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-sm font-medium truncate flex-1">
                          {post.title || 'Untitled'}
                        </p>
                        <span className="text-xs font-mono text-primary shrink-0">
                          +{post.upvotes || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {post.submolt && (
                          <Badge variant="secondary" className="font-mono text-xs">
                            m/{post.submolt.name}
                          </Badge>
                        )}
                        {post.posted_at && (
                          <span className="font-mono">
                            {formatDistanceToNow(new Date(post.posted_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
