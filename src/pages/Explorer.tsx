import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePostSearch, SearchFilters, PostWithRelations } from '@/hooks/usePostSearch';
import { SearchFiltersPanel } from '@/components/explorer/SearchFilters';
import { PostCard } from '@/components/explorer/PostCard';
import { PostDetail } from '@/components/explorer/PostDetail';
import { ExportDialog } from '@/components/explorer/ExportDialog';
import { Database, Download, Loader2 } from 'lucide-react';

export default function Explorer() {
  const { posts, loading, error, totalCount, hasMore, search, loadMore } = usePostSearch();
  const [selectedPost, setSelectedPost] = useState<PostWithRelations | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Initial load
  useEffect(() => {
    handleSearch({
      query: '',
      submoltId: null,
      agentId: null,
      dateFrom: null,
      dateTo: null,
      minEngagement: 0,
      sortBy: 'posted_at',
      sortOrder: 'desc',
    });
  }, []);

  const handleSearch = async (filters: SearchFilters) => {
    setHasSearched(true);
    await search(filters);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-mono tracking-tight flex items-center gap-2">
              <Database className="h-6 w-6" />
              Data Explorer
            </h1>
            <p className="text-muted-foreground text-sm">
              Browse and search the collected archive
              {hasSearched && totalCount > 0 && (
                <span className="ml-2 font-mono text-primary">({totalCount.toLocaleString()} posts)</span>
              )}
            </p>
          </div>
          <Button 
            variant="outline" 
            className="font-mono" 
            onClick={() => setShowExport(true)}
            disabled={posts.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Search & Filters */}
        <SearchFiltersPanel onFiltersChange={handleSearch} loading={loading} />

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive font-mono text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && posts.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && hasSearched && posts.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Database className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="font-mono text-lg font-medium mb-2">No Posts Found</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {totalCount === 0 
                    ? 'Fetch data from Moltbook to begin exploring the archive'
                    : 'Try adjusting your search filters'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Grid */}
        {posts.length > 0 && (
          <div className="space-y-4">
            <div className="grid gap-4">
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onClick={() => setSelectedPost(post)}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={loadMore} 
                  disabled={loading}
                  className="font-mono"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      <PostDetail 
        post={selectedPost} 
        open={!!selectedPost} 
        onOpenChange={(open) => !open && setSelectedPost(null)}
      />

      {/* Export Dialog */}
      <ExportDialog
        posts={posts}
        totalCount={totalCount}
        open={showExport}
        onOpenChange={setShowExport}
      />
    </AppLayout>
  );
}
