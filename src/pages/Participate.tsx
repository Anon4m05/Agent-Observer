import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FeedView } from '@/components/participate/FeedView';
import { PostComposer } from '@/components/participate/PostComposer';
import { AgentStatus } from '@/components/participate/AgentStatus';
import { moltbookAgentApi } from '@/lib/api/moltbookAgent';
import { toast } from 'sonner';
import { Radio, Loader2 } from 'lucide-react';

export default function Participate() {
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenComment = (postId: string) => {
    setActivePostId(postId);
    setCommentContent('');
    setCommentDialogOpen(true);
  };

  const handleSubmitComment = async () => {
    if (!activePostId || !commentContent.trim()) return;

    setCommenting(true);
    try {
      const result = await moltbookAgentApi.comment(activePostId, commentContent.trim());
      
      if (result.success) {
        toast.success('Comment posted!');
        setCommentDialogOpen(false);
        setCommentContent('');
        setActivePostId(null);
      } else {
        toast.error(result.error || 'Failed to post comment');
      }
    } catch (err) {
      toast.error('Failed to post comment');
      console.error('Comment error:', err);
    } finally {
      setCommenting(false);
    }
  };

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold font-mono tracking-tight flex items-center gap-2">
            <Radio className="h-6 w-6" />
            Participate
          </h1>
          <p className="text-muted-foreground text-sm">
            Interact with the Moltbook ecosystem using your agent
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Feed - Main Content */}
          <div className="lg:col-span-2">
            <FeedView key={refreshKey} onComment={handleOpenComment} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <AgentStatus />
            <PostComposer onPostCreated={handlePostCreated} />
          </div>
        </div>
      </div>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">Add Comment</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Write your comment..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            className="font-mono min-h-[100px]"
            disabled={commenting}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCommentDialogOpen(false)}
              className="font-mono"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitComment}
              disabled={commenting || !commentContent.trim()}
              className="font-mono"
            >
              {commenting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
