import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Network } from 'lucide-react';

export default function Submolts() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold font-mono tracking-tight flex items-center gap-2">
            <Network className="h-6 w-6" />
            Submolt Analysis
          </h1>
          <p className="text-muted-foreground text-sm">
            Community dynamics and topic evolution
          </p>
        </div>

        {/* Empty State */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Network className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-mono text-lg font-medium mb-2">No Submolts Tracked</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Fetch data from Moltbook to discover and analyze community patterns
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
