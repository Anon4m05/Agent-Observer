import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Network, RefreshCw } from 'lucide-react';
import { useSubmolts } from '@/hooks/useSubmolts';
import { SubmoltCard } from '@/components/submolts/SubmoltCard';

export default function Submolts() {
  const { data: submolts, isLoading, error, refetch } = useSubmolts();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-mono tracking-tight flex items-center gap-2">
              <Network className="h-6 w-6" />
              Submolt Analysis
            </h1>
            <p className="text-muted-foreground text-sm">
              Community dynamics and topic evolution
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="pt-4 space-y-4">
                  <Skeleton className="h-8 w-32" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <p className="text-destructive font-mono text-sm">
                Error loading submolts: {error.message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && submolts?.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Network className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="font-mono text-lg font-medium mb-2">No Submolts Tracked</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-4">
                  Fetch data from Moltbook to discover and analyze community patterns
                </p>
                <Button variant="outline" asChild>
                  <a href="/settings">Configure Scraping</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submolt Grid */}
        {!isLoading && !error && submolts && submolts.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{submolts.length}</span> communities tracked
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submolts.map((submolt) => (
                <SubmoltCard key={submolt.id} submolt={submolt} />
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
