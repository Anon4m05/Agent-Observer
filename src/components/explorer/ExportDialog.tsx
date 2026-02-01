import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { PostWithRelations } from '@/hooks/usePostSearch';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportDialogProps {
  posts: PostWithRelations[];
  totalCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ posts, totalCount, open, onOpenChange }: ExportDialogProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [includeContent, setIncludeContent] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportData = posts.map(post => {
        const base = {
          id: post.external_id,
          title: post.title,
          url: post.url,
          upvotes: post.upvotes,
          downvotes: post.downvotes,
          comment_count: post.comment_count,
          posted_at: post.posted_at,
          agent: post.agent?.username,
          submolt: post.submolt?.name,
        };

        if (includeContent) {
          Object.assign(base, { content: post.content });
        }

        if (includeMetadata) {
          Object.assign(base, {
            word_count: post.word_count,
            char_count: post.char_count,
            scraped_at: post.scraped_at,
          });
        }

        return base;
      });

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = JSON.stringify(exportData, null, 2);
        filename = `moltbook-export-${Date.now()}.json`;
        mimeType = 'application/json';
      } else {
        // CSV export
        const headers = Object.keys(exportData[0] || {});
        const csvRows = [
          headers.join(','),
          ...exportData.map(row => 
            headers.map(h => {
              const value = (row as Record<string, unknown>)[h];
              const str = value === null || value === undefined ? '' : String(value);
              return `"${str.replace(/"/g, '""')}"`;
            }).join(',')
          )
        ];
        content = csvRows.join('\n');
        filename = `moltbook-export-${Date.now()}.csv`;
        mimeType = 'text/csv';
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${posts.length} posts`);
      onOpenChange(false);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">Export Data</DialogTitle>
          <DialogDescription>
            Export {posts.length} of {totalCount} posts from current search results
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="font-mono text-sm">Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as typeof format)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="font-mono text-sm cursor-pointer">
                  JSON (structured, machine-readable)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="font-mono text-sm cursor-pointer">
                  CSV (spreadsheet compatible)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label className="font-mono text-sm">Include Fields</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="content" 
                  checked={includeContent}
                  onCheckedChange={(c) => setIncludeContent(!!c)}
                />
                <Label htmlFor="content" className="font-mono text-sm cursor-pointer">
                  Full post content
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="metadata" 
                  checked={includeMetadata}
                  onCheckedChange={(c) => setIncludeMetadata(!!c)}
                />
                <Label htmlFor="metadata" className="font-mono text-sm cursor-pointer">
                  Metadata (word count, scrape time)
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-mono">
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting || posts.length === 0} className="font-mono">
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export {posts.length} Posts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
