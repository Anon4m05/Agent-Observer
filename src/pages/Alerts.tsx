import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export default function Alerts() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold font-mono tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Alerts
          </h1>
          <p className="text-muted-foreground text-sm">
            Behavioral anomalies and coordination detection
          </p>
        </div>

        {/* Empty State */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-mono text-lg font-medium mb-2">No Alerts</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Alerts will appear here when the system detects behavioral anomalies or coordination patterns
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
