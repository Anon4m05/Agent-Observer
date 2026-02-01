import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { moltbookAgentApi, MoltbookCredential } from '@/lib/api/moltbookAgent';
import { toast } from 'sonner';
import { Bot, ExternalLink, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function AgentRegistration() {
  const [credential, setCredential] = useState<MoltbookCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [agentName, setAgentName] = useState('');

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

  const handleRegister = async () => {
    if (!agentName.trim()) {
      toast.error('Please enter an agent name');
      return;
    }

    setRegistering(true);
    try {
      const result = await moltbookAgentApi.register(agentName.trim());
      
      if (result.success) {
        toast.success('Agent registered! Check your claim URL.');
        await loadCredential();
        setAgentName('');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (err) {
      toast.error('Registration failed');
      console.error('Registration error:', err);
    } finally {
      setRegistering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-primary/20 text-primary font-mono">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'claimed':
        return (
          <Badge variant="secondary" className="font-mono">
            <CheckCircle className="h-3 w-3 mr-1" />
            Claimed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-mono text-terminal-amber border-terminal-amber">
            <Clock className="h-3 w-3 mr-1" />
            Pending Claim
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="font-mono text-lg flex items-center gap-2">
          <Bot className="h-5 w-5 text-terminal-purple" />
          Moltbook Agent
        </CardTitle>
        <CardDescription>
          Register and manage your AI agent on Moltbook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {credential ? (
          <div className="space-y-4">
            {/* Current Agent Display */}
            <div className="rounded-md border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{credential.agent_name}</span>
                  {getStatusBadge(credential.claim_status)}
                </div>
              </div>

              {credential.claim_status === 'pending_claim' && credential.claim_url && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Visit the claim URL to activate your agent:
                  </p>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={credential.claim_url} 
                      readOnly 
                      className="font-mono text-xs flex-1" 
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(credential.claim_url!, '_blank')}
                      className="shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {credential.claim_status === 'active' && (
                <p className="text-sm text-muted-foreground">
                  Your agent is active and ready to participate on Moltbook.
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Once claimed, use the Participate page to post, comment, and interact 
                  with the Moltbook ecosystem using your agent identity.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Registration Form */}
            <div className="space-y-2">
              <Label className="font-mono text-sm">Agent Name</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="my-research-agent"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="font-mono"
                  disabled={registering}
                />
                <Button
                  onClick={handleRegister}
                  disabled={registering || !agentName.trim()}
                  className="font-mono shrink-0"
                >
                  {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose a unique name for your AI agent on Moltbook
              </p>
            </div>

            {/* Info Box */}
            <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
              <p>
                Registering an agent will create a new identity on Moltbook that you can use 
                to participate in discussions. You'll receive a claim URL to activate it.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
