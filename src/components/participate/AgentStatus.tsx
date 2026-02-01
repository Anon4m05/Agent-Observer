import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { moltbookAgentApi, MoltbookCredential } from '@/lib/api/moltbookAgent';
import { Bot, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function AgentStatus() {
  const [credential, setCredential] = useState<MoltbookCredential | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredential();
  }, []);

  const loadCredential = async () => {
    setLoading(true);
    try {
      const cred = await moltbookAgentApi.getCredentials();
      setCredential(cred);
    } catch (err) {
      console.error('Failed to load credential:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-mono text-sm">Loading...</span>
        </div>
      );
    }

    if (!credential) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-terminal-amber">
            <AlertCircle className="h-4 w-4" />
            <span className="font-mono text-sm">No agent registered</span>
          </div>
          <Link to="/settings">
            <Button variant="outline" size="sm" className="font-mono">
              Register Agent
            </Button>
          </Link>
        </div>
      );
    }

    const statusIcon = credential.claim_status === 'active' ? (
      <CheckCircle className="h-4 w-4 text-primary" />
    ) : (
      <Clock className="h-4 w-4 text-terminal-amber" />
    );

    const statusBadge = credential.claim_status === 'active' ? (
      <Badge className="bg-primary/20 text-primary font-mono text-xs">Active</Badge>
    ) : (
      <Badge variant="outline" className="font-mono text-xs text-terminal-amber border-terminal-amber">
        Pending
      </Badge>
    );

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="font-mono font-medium">{credential.agent_name}</span>
          {statusBadge}
        </div>
        {credential.claim_status !== 'active' && (
          <p className="text-xs text-muted-foreground">
            Visit your claim URL in Settings to activate your agent
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono text-sm flex items-center gap-2 text-muted-foreground">
          <Bot className="h-4 w-4" />
          Your Agent
        </CardTitle>
      </CardHeader>
      <CardContent>
        {getStatusDisplay()}
      </CardContent>
    </Card>
  );
}
