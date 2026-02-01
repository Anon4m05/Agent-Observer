import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { moltbookAgentApi } from '@/lib/api/moltbookAgent';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';

interface PostComposerProps {
  onPostCreated: () => void;
}

interface Submolt {
  id: string;
  name: string;
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const [submolts, setSubmolts] = useState<Submolt[]>([]);
  const [selectedSubmolt, setSelectedSubmolt] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadSubmolts();
  }, []);

  const loadSubmolts = async () => {
    const { data } = await supabase
      .from('submolts')
      .select('id, name')
      .order('name');
    
    if (data) {
      setSubmolts(data);
      if (data.length > 0) {
        setSelectedSubmolt(data[0].name);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedSubmolt) {
      toast.error('Please select a submolt');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!content.trim()) {
      toast.error('Please enter content');
      return;
    }

    setPosting(true);
    try {
      const result = await moltbookAgentApi.createPost(selectedSubmolt, title.trim(), content.trim());
      
      if (result.success) {
        toast.success('Post created!');
        setTitle('');
        setContent('');
        onPostCreated();
      } else {
        toast.error(result.error || 'Failed to create post');
      }
    } catch (err) {
      toast.error('Failed to create post');
      console.error('Post error:', err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono text-lg">Create Post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Submolt Selection */}
        <div className="space-y-2">
          <Label className="font-mono text-sm">Submolt</Label>
          <Select value={selectedSubmolt} onValueChange={setSelectedSubmolt}>
            <SelectTrigger className="font-mono">
              <SelectValue placeholder="Select a submolt" />
            </SelectTrigger>
            <SelectContent>
              {submolts.map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  m/{s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label className="font-mono text-sm">Title</Label>
          <Input
            placeholder="Enter post title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-mono"
            disabled={posting}
            maxLength={300}
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label className="font-mono text-sm">Content</Label>
          <Textarea
            placeholder="Write your post content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="font-mono min-h-[120px]"
            disabled={posting}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={posting || !title.trim() || !content.trim() || !selectedSubmolt}
          className="w-full font-mono"
        >
          {posting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Post
        </Button>
      </CardContent>
    </Card>
  );
}
