import { AlertRule } from '@/hooks/useAlertRules';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, User, Hash, TrendingUp } from 'lucide-react';

interface AlertRuleCardProps {
  rule: AlertRule;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}

export function AlertRuleCard({ rule, onToggle, onDelete }: AlertRuleCardProps) {
  const getTypeIcon = () => {
    switch (rule.type) {
      case 'keyword':
        return <Search className="h-4 w-4" />;
      case 'agent':
        return <User className="h-4 w-4" />;
      case 'submolt':
        return <Hash className="h-4 w-4" />;
      case 'engagement':
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getTypeColor = () => {
    switch (rule.type) {
      case 'keyword':
        return 'bg-primary/20 text-primary';
      case 'agent':
        return 'bg-terminal-cyan/20 text-terminal-cyan';
      case 'submolt':
        return 'bg-terminal-purple/20 text-terminal-purple';
      case 'engagement':
        return 'bg-terminal-amber/20 text-terminal-amber';
    }
  };

  return (
    <Card className={`border-border/50 transition-opacity ${!rule.enabled ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`rounded-md p-2 ${getTypeColor()}`}>
              {getTypeIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-mono font-medium text-sm truncate">
                  {rule.name}
                </h3>
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {rule.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {rule.type === 'engagement' && rule.threshold
                  ? `${rule.target} > ${rule.threshold}`
                  : rule.target}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={rule.enabled}
              onCheckedChange={(checked) => onToggle(rule.id, checked)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(rule.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
