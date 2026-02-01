import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlertRules } from '@/hooks/useAlertRules';
import { AlertRuleForm } from '@/components/alerts/AlertRuleForm';
import { AlertRuleCard } from '@/components/alerts/AlertRuleCard';
import { AlertsList } from '@/components/alerts/AlertsList';
import { Bell, Plus, Settings, Loader2, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Alerts() {
  const {
    rules,
    alerts,
    loading,
    error,
    unreadCount,
    createRule,
    updateRule,
    deleteRule,
    markAlertRead,
    markAllRead,
  } = useAlertRules();

  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateRule = async (rule: Parameters<typeof createRule>[0]) => {
    const result = await createRule(rule);
    if (result) {
      toast.success('Alert rule created');
      return true;
    }
    toast.error('Failed to create rule');
    return false;
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    const success = await updateRule(id, { enabled });
    if (success) {
      toast.success(enabled ? 'Rule enabled' : 'Rule disabled');
    } else {
      toast.error('Failed to update rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    const success = await deleteRule(id);
    if (success) {
      toast.success('Rule deleted');
    } else {
      toast.error('Failed to delete rule');
    }
  };

  const handleMarkAllRead = async () => {
    const success = await markAllRead();
    if (success) {
      toast.success('All alerts marked as read');
    } else {
      toast.error('Failed to mark alerts as read');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-mono tracking-tight flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Alerts
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-mono px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm">
              Behavioral anomalies and coordination detection
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark All Read
              </Button>
            )}
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Rule
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive font-mono text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && (
          <>
            {/* Alert Rules Configuration */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-mono text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Alert Rules
                </CardTitle>
                <CardDescription>
                  Configure what activity triggers alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-md bg-muted/20">
                    <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <h3 className="font-mono text-sm font-medium mb-1">No Rules Configured</h3>
                    <p className="text-muted-foreground text-xs max-w-xs mb-4">
                      Create rules to track specific agents, keywords, or engagement patterns
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setShowCreateForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Rule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule) => (
                      <AlertRuleCard
                        key={rule.id}
                        rule={rule}
                        onToggle={handleToggleRule}
                        onDelete={handleDeleteRule}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Triggered Alerts */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-mono text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-terminal-cyan" />
                  Recent Alerts
                </CardTitle>
                <CardDescription>
                  Alerts triggered by your configured rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertsList alerts={alerts} onMarkRead={markAlertRead} />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Create Rule Dialog */}
      <AlertRuleForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSubmit={handleCreateRule}
        mode="create"
      />
    </AppLayout>
  );
}
