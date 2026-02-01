import { Alert } from '@/hooks/useAlertRules';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';

interface AlertsListProps {
  alerts: Alert[];
  onMarkRead: (id: string) => void;
}

export function AlertsList({ alerts, onMarkRead }: AlertsListProps) {
  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive/20 text-destructive border-destructive/50';
      case 'warning':
        return 'bg-terminal-amber/20 text-terminal-amber border-terminal-amber/50';
      case 'info':
      default:
        return 'bg-primary/20 text-primary border-primary/50';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <h3 className="font-mono text-sm font-medium mb-1">All Caught Up</h3>
            <p className="text-muted-foreground text-xs max-w-xs">
              No alerts triggered yet. Configure rules above to start monitoring.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          className={`border-border/50 transition-all ${
            !alert.read ? 'bg-muted/30' : 'opacity-70'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`rounded-md p-2 ${getSeverityColor(alert.severity)}`}>
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-mono font-medium text-sm truncate">
                      {alert.title}
                    </h3>
                    {!alert.read && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  {alert.message && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                      {alert.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {!alert.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() => onMarkRead(alert.id)}
                >
                  Mark read
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
