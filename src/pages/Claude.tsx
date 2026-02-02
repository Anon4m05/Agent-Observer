import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bot, Copy, Check, Zap, ExternalLink } from 'lucide-react';

const OBSERVATORY_API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moltbook-observatory`;

export default function Claude() {
  const [copied, setCopied] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const endpoints = [
    { 
      name: 'Summary', 
      url: `${OBSERVATORY_API}?view=summary`,
      description: 'Ecosystem stats, notable agents, recent posts'
    },
    { 
      name: 'Agents', 
      url: `${OBSERVATORY_API}?view=agents&limit=50`,
      description: 'Agent directory with behavioral fingerprints'
    },
    { 
      name: 'Posts', 
      url: `${OBSERVATORY_API}?view=posts&limit=50`,
      description: 'Recent posts with engagement metrics'
    },
  ];

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const testEndpoint = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${OBSERVATORY_API}?view=summary`);
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
      toast.success('API is working!');
    } catch (err) {
      toast.error('API test failed');
      setTestResult(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 font-mono">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/30">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Claude Observatory Access</h1>
            <p className="text-muted-foreground">Direct API endpoints for AI agent observation</p>
          </div>
          <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/30">
            <Zap className="h-3 w-3 mr-1" />
            Public API
          </Badge>
        </div>

        {/* Quick Access Card */}
        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">🚀 Quick Access (No Auth Required)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Primary Endpoint</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(`${OBSERVATORY_API}?view=summary`, 'URL')}
                >
                  {copied === 'URL' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <code className="text-sm text-primary break-all block">
                {OBSERVATORY_API}?view=summary
              </code>
            </div>

            <div className="flex gap-3">
              <Button onClick={testEndpoint} disabled={loading} className="flex-1">
                {loading ? 'Testing...' : 'Test API Now'}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`${OBSERVATORY_API}?view=summary`, '_blank')}
              >
                Open in New Tab <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* All Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {endpoints.map((ep) => (
              <div key={ep.name} className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-foreground">{ep.name}</span>
                    <p className="text-xs text-muted-foreground">{ep.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(ep.url, ep.name)}
                  >
                    {copied === ep.name ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <code className="text-xs text-primary break-all block bg-background/50 p-2 rounded">
                  {ep.url}
                </code>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Curl Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Curl Command</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Copy & paste</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(`curl "${OBSERVATORY_API}?view=summary"`, 'curl')}
                >
                  {copied === 'curl' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <pre className="text-sm text-foreground overflow-x-auto">
                curl "{OBSERVATORY_API}?view=summary"
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Test Result */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-500">✓ API Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-foreground bg-muted/30 p-4 rounded-lg overflow-auto max-h-96">
                {testResult}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Rate Limits */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>Rate limit: 10 requests/minute • Cache: 60 seconds • Max items: 100</p>
          <p>Query params: <code className="text-primary">view</code>, <code className="text-primary">limit</code>, <code className="text-primary">since</code></p>
        </div>
      </div>
    </div>
  );
}
