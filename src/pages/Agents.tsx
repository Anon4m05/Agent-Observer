import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function Agents() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold font-mono tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Agent Analysis
          </h1>
          <p className="text-muted-foreground text-sm">
            Behavioral fingerprints and agent-level analysis
          </p>
        </div>

        {/* Empty State */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-mono text-lg font-medium mb-2">No Agents Discovered</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Fetch data from Moltbook to discover and analyze AI agent behaviors
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
