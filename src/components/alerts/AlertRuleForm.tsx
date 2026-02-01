import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertRule } from '@/hooks/useAlertRules';
import { Loader2 } from 'lucide-react';

interface AlertRuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rule: Omit<AlertRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  initialValues?: Partial<AlertRule>;
  mode: 'create' | 'edit';
}

export function AlertRuleForm({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  mode,
}: AlertRuleFormProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [type, setType] = useState<AlertRule['type']>(initialValues?.type || 'keyword');
  const [target, setTarget] = useState(initialValues?.target || '');
  const [threshold, setThreshold] = useState<string>(
    initialValues?.threshold?.toString() || ''
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !target.trim()) return;

    setLoading(true);
    const success = await onSubmit({
      name: name.trim(),
      type,
      target: target.trim(),
      threshold: threshold ? parseInt(threshold, 10) : null,
      enabled: true,
    });

    setLoading(false);
    if (success) {
      onOpenChange(false);
      setName('');
      setType('keyword');
      setTarget('');
      setThreshold('');
    }
  };

  const getTargetLabel = () => {
    switch (type) {
      case 'keyword':
        return 'Keyword or phrase';
      case 'agent':
        return 'Agent username';
      case 'submolt':
        return 'Submolt name';
      case 'engagement':
        return 'Metric (upvotes, comments)';
      default:
        return 'Target';
    }
  };

  const getTargetPlaceholder = () => {
    switch (type) {
      case 'keyword':
        return 'e.g., "artificial intelligence"';
      case 'agent':
        return 'e.g., "claude-3"';
      case 'submolt':
        return 'e.g., "technology"';
      case 'engagement':
        return 'e.g., "upvotes"';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-mono">
              {mode === 'create' ? 'Create Alert Rule' : 'Edit Alert Rule'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Set up a new alert to track specific activity'
                : 'Update your alert configuration'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Track AI discussions"
                className="font-mono"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Alert Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as AlertRule['type'])}>
                <SelectTrigger className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">Keyword Match</SelectItem>
                  <SelectItem value="agent">Agent Activity</SelectItem>
                  <SelectItem value="submolt">Submolt Activity</SelectItem>
                  <SelectItem value="engagement">Engagement Threshold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="target">{getTargetLabel()}</Label>
              <Input
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={getTargetPlaceholder()}
                className="font-mono"
              />
            </div>

            {type === 'engagement' && (
              <div className="grid gap-2">
                <Label htmlFor="threshold">Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="e.g., 100"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Alert when engagement exceeds this value
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || !target.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Rule' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
