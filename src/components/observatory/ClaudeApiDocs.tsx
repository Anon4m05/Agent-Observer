import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Terminal, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Bot,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BASE_URL = `${SUPABASE_URL}/functions/v1/moltbook-observatory`;

interface EndpointExample {
  name: string;
  description: string;
  endpoint: string;
  params?: string;
  response: string;
}

const endpoints: EndpointExample[] = [
  {
    name: 'Summary',
    description: 'Get ecosystem-wide statistics, notable agents, and recent activity',
    endpoint: `${BASE_URL}?view=summary`,
    response: `{
  "timestamp": "2025-02-02T12:00:00Z",
  "ecosystem": {
    "total_posts": 156,
    "total_agents": 42,
    "total_comments": 0,
    "total_submolts": 5
  },
  "recent_activity": {
    "posts_24h": 12,
    "new_agents_24h": 3,
    "most_active_submolts": ["general", "meta"]
  },
  "notable_agents": [...],
  "recent_posts": [...]
}`,
  },
  {
    name: 'Agents',
    description: 'Get behavioral fingerprints for all tracked agents',
    endpoint: `${BASE_URL}?view=agents`,
    params: '&limit=50&since=2025-01-01',
    response: `[
  {
    "id": "uuid",
    "username": "FluxA_CAO",
    "total_posts": 15,
    "posts_per_day": 2.5,
    "vocabulary_diversity": 0.72,
    "avg_upvotes": 4.2,
    "engagement_ratio": 3.1,
    "primary_submolt": "general"
  },
  ...
]`,
  },
  {
    name: 'Posts',
    description: 'Get recent posts with content previews and metrics',
    endpoint: `${BASE_URL}?view=posts`,
    params: '&limit=50&since=2025-01-01',
    response: `[
  {
    "id": "uuid",
    "title": "Architecture question...",
    "content_preview": "First 300 chars...",
    "upvotes": 5,
    "comments": 3,
    "agent": "mrarejimmy",
    "submolt": "agentops",
    "posted_at": "2025-02-01T10:00:00Z"
  },
  ...
]`,
  },
];

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label ? `${label} copied!` : 'Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-6 px-2 text-xs"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

export function ClaudeApiDocs() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-mono text-lg flex items-center gap-2">
                Claude Observatory Access
                <Badge variant="secondary" className="font-mono text-xs">
                  Public API
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Real-time ecosystem data for AI researchers and agents
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs bg-green-500/10 text-green-600 border-green-500/30">
              <Zap className="h-3 w-3 mr-1" />
              Online
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between font-mono text-sm"
            >
              <span className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                API Documentation & Examples
              </span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4 mt-4">
            {/* Quick Start */}
            <div className="space-y-2">
              <h4 className="font-mono text-sm font-semibold text-foreground">
                Quick Start
              </h4>
              <div className="bg-background/80 rounded-lg p-3 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-mono">curl</span>
                  <CopyButton 
                    text={`curl "${BASE_URL}?view=summary"`} 
                    label="curl command"
                  />
                </div>
                <code className="text-xs font-mono text-primary break-all">
                  curl "{BASE_URL}?view=summary"
                </code>
              </div>
            </div>

            {/* Endpoints */}
            <div className="space-y-3">
              <h4 className="font-mono text-sm font-semibold text-foreground">
                Available Endpoints
              </h4>
              
              {endpoints.map((ep) => (
                <div 
                  key={ep.name}
                  className="bg-background/60 rounded-lg border border-border/50 overflow-hidden"
                >
                  <div className="p-3 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-semibold text-sm text-foreground">
                          {ep.name}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ep.description}
                        </p>
                      </div>
                      <CopyButton text={ep.endpoint} label="Endpoint" />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono">GET</Badge>
                      <code className="text-xs font-mono text-muted-foreground break-all">
                        ?view={ep.name.toLowerCase()}
                        {ep.params && <span className="text-primary">{ep.params}</span>}
                      </code>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground font-mono">Response</span>
                      <CopyButton text={ep.response} label="Response example" />
                    </div>
                    <pre className="text-xs font-mono text-muted-foreground overflow-x-auto max-h-32">
                      {ep.response}
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            {/* Rate Limits */}
            <div className="space-y-2">
              <h4 className="font-mono text-sm font-semibold text-foreground">
                Rate Limits
              </h4>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="font-mono text-amber-600">10 requests/minute</span>
                    <span>per IP address</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-mono text-amber-600">1 minute cache</span>
                    <span>on all responses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-mono text-amber-600">100 items max</span>
                    <span>per request (use limit param)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Query Parameters */}
            <div className="space-y-2">
              <h4 className="font-mono text-sm font-semibold text-foreground">
                Query Parameters
              </h4>
              <div className="bg-background/60 rounded-lg border border-border/50 p-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="font-mono pb-2">Param</th>
                      <th className="pb-2">Description</th>
                      <th className="font-mono pb-2">Default</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    <tr>
                      <td className="font-mono text-primary py-1">view</td>
                      <td>summary, agents, posts, alerts</td>
                      <td className="font-mono text-muted-foreground">summary</td>
                    </tr>
                    <tr>
                      <td className="font-mono text-primary py-1">limit</td>
                      <td>Max items to return (1-100)</td>
                      <td className="font-mono text-muted-foreground">50</td>
                    </tr>
                    <tr>
                      <td className="font-mono text-primary py-1">since</td>
                      <td>ISO timestamp filter</td>
                      <td className="font-mono text-muted-foreground">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
