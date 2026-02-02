import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Terminal, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Bot,
  Zap,
  Eye,
  Bolt,
} from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BASE_URL = `${SUPABASE_URL}/functions/v1/moltbook-observatory`;

interface EndpointExample {
  name: string;
  description: string;
  method: 'GET' | 'POST';
  endpoint: string;
  params?: string;
  body?: string;
  response: string;
}

const readEndpoints: EndpointExample[] = [
  {
    name: 'Summary',
    description: 'Ecosystem-wide statistics, notable agents, and recent activity',
    method: 'GET',
    endpoint: `${BASE_URL}?view=summary`,
    response: `{
  "success": true,
  "timestamp": "2026-02-02T12:00:00Z",
  "data": {
    "ecosystem": { "total_posts": 156, "total_agents": 42 },
    "recent_activity": { "posts_24h": 12, "new_agents_24h": 3 },
    "notable_agents": [...],
    "recent_posts": [...]
  }
}`,
  },
  {
    name: 'Agents',
    description: 'Agent directory with behavioral fingerprints',
    method: 'GET',
    endpoint: `${BASE_URL}?view=agents`,
    params: '&limit=100&offset=0&sort=recent|karma|posts|engagement&since=ISO',
    response: `{
  "success": true,
  "data": [{
    "username": "FluxA_CAO",
    "karma": 42,
    "behavioral_signature": {
      "vocabulary_diversity": 0.72,
      "posts_per_day": 2.5
    },
    "claimed_status": "unclaimed"
  }],
  "pagination": { "total": 42, "has_more": false }
}`,
  },
  {
    name: 'Posts',
    description: 'Full post content with engagement metrics',
    method: 'GET',
    endpoint: `${BASE_URL}?view=posts`,
    params: '&limit=100&offset=0&sort=new|top|discussed&submolt=xxx&agent=xxx&since=ISO',
    response: `{
  "success": true,
  "data": [{
    "id": "uuid",
    "title": "Architecture question...",
    "content": "Full post text...",
    "agent": "mrarejimmy",
    "submolt": "agentops",
    "upvotes": 5
  }],
  "pagination": { "total": 156, "has_more": true }
}`,
  },
  {
    name: 'Comments',
    description: 'Threaded comments for a specific post',
    method: 'GET',
    endpoint: `${BASE_URL}?view=comments&post_id=xxx`,
    params: '&limit=100',
    response: `{
  "success": true,
  "data": [{
    "id": "uuid",
    "content": "Great point!",
    "agent": "claude_assistant",
    "parent_id": null,
    "upvotes": 3
  }],
  "pagination": { "total": 12, "has_more": false }
}`,
  },
  {
    name: 'Submolts',
    description: 'Community directory with member counts',
    method: 'GET',
    endpoint: `${BASE_URL}?view=submolts`,
    params: '&limit=100&sort=members|activity|recent',
    response: `{
  "success": true,
  "data": [{
    "name": "general",
    "description": "General discussion",
    "member_count": 150,
    "post_count": 89
  }],
  "pagination": { "total": 5, "has_more": false }
}`,
  },
  {
    name: 'Alerts',
    description: 'Alert rules and triggered alerts',
    method: 'GET',
    endpoint: `${BASE_URL}?view=alerts`,
    response: `{
  "success": true,
  "data": {
    "rules": [{ "id": "uuid", "name": "Keyword watch", "type": "keyword", "target": "Claude" }],
    "triggered": [{ "id": "uuid", "title": "Match found", "read": false }],
    "unread_count": 3
  }
}`,
  },
  {
    name: 'Scrape Jobs',
    description: 'Recent scrape job history',
    method: 'GET',
    endpoint: `${BASE_URL}?view=scrape_jobs`,
    params: '&limit=20',
    response: `{
  "success": true,
  "data": [{
    "job_id": "uuid",
    "status": "completed",
    "posts_scraped": 25,
    "agents_discovered": 3
  }],
  "pagination": { "total": 10, "has_more": false }
}`,
  },
  {
    name: 'Search',
    description: 'Search across posts, agents, and submolts',
    method: 'GET',
    endpoint: `${BASE_URL}?view=search&q=query`,
    params: '&type=all|posts|agents|submolts',
    response: `{
  "success": true,
  "data": {
    "query": "claude",
    "results": {
      "posts": [{ "id": "uuid", "title": "..." }],
      "agents": [{ "username": "claude_bot" }],
      "submolts": []
    },
    "total_results": 5
  }
}`,
  },
];

const actionEndpoints: EndpointExample[] = [
  {
    name: 'Trigger Scrape',
    description: 'Start a new data scrape job (1 per 5 min)',
    method: 'POST',
    endpoint: `${BASE_URL}?action=scrape`,
    body: `{ "scope": "full" | "submolt" | "agent", "target_id": "optional" }`,
    response: `{
  "success": true,
  "data": {
    "job_id": "uuid",
    "status": "started",
    "scope": "full"
  }
}`,
  },
  {
    name: 'Create Alert',
    description: 'Create a new alert rule for monitoring',
    method: 'POST',
    endpoint: `${BASE_URL}?action=create_alert`,
    body: `{
  "name": "Watch for Claude mentions",
  "type": "keyword" | "agent" | "submolt" | "engagement",
  "target": "search term or ID",
  "threshold": 10
}`,
    response: `{
  "success": true,
  "data": {
    "rule_id": "uuid",
    "created": true,
    "name": "Watch for Claude mentions"
  }
}`,
  },
  {
    name: 'Mark Alerts Read',
    description: 'Mark specific or all alerts as read',
    method: 'POST',
    endpoint: `${BASE_URL}?action=mark_alerts_read`,
    body: `{ "alert_ids": ["uuid1", "uuid2"] } or { "all": true }`,
    response: `{
  "success": true,
  "data": {
    "updated_count": 5,
    "marked_all": true
  }
}`,
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

function EndpointCard({ endpoint }: { endpoint: EndpointExample }) {
  return (
    <div className="bg-background/60 rounded-lg border border-border/50 overflow-hidden">
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono font-semibold text-sm text-foreground">
              {endpoint.name}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {endpoint.description}
            </p>
          </div>
          <CopyButton text={endpoint.endpoint} label="Endpoint" />
        </div>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Badge 
            variant="outline" 
            className={`text-xs font-mono ${endpoint.method === 'POST' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : ''}`}
          >
            {endpoint.method}
          </Badge>
          <code className="text-xs font-mono text-muted-foreground break-all">
            ?{endpoint.method === 'POST' ? `action=${endpoint.name.toLowerCase().replace(/\s/g, '_')}` : `view=${endpoint.name.toLowerCase().replace(/\s/g, '_')}`}
            {endpoint.params && <span className="text-primary">{endpoint.params}</span>}
          </code>
        </div>
        {endpoint.body && (
          <div className="mt-2 bg-muted/30 rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-mono">Body</span>
              <CopyButton text={endpoint.body} label="Body" />
            </div>
            <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
              {endpoint.body}
            </pre>
          </div>
        )}
      </div>
      <div className="p-3 bg-muted/30">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground font-mono">Response</span>
          <CopyButton text={endpoint.response} label="Response example" />
        </div>
        <pre className="text-xs font-mono text-muted-foreground overflow-x-auto max-h-32">
          {endpoint.response}
        </pre>
      </div>
    </div>
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
                Claude Observatory API
                <Badge variant="secondary" className="font-mono text-xs">
                  v2
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                8 read endpoints + 3 action endpoints for AI research
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

      {/* When to Check & Analysis Focus */}
      <CardContent className="pt-0 pb-2">
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div className="bg-background/60 rounded-lg border border-border/50 p-3">
            <h4 className="font-mono text-xs font-semibold text-muted-foreground mb-2">Capabilities:</h4>
            <ul className="text-xs text-foreground space-y-1">
              <li>• Read all posts, agents, comments, submolts</li>
              <li>• Search across the ecosystem</li>
              <li>• Trigger scrapes & create alert rules</li>
              <li>• View scrape history & alert triggers</li>
            </ul>
          </div>
          <div className="bg-background/60 rounded-lg border border-border/50 p-3">
            <h4 className="font-mono text-xs font-semibold text-muted-foreground mb-2">Boundaries:</h4>
            <ul className="text-xs text-foreground space-y-1">
              <li>• Cannot register agents or post content</li>
              <li>• Cannot comment or vote</li>
              <li>• Cannot delete or modify data</li>
              <li>• Observation-only by design</li>
            </ul>
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-xs text-muted-foreground font-mono">
          <span className="text-primary">Auth:</span> x-observatory-key header required for all endpoints
        </div>
      </CardContent>

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
                    text={`curl -H "x-observatory-key: YOUR_KEY" "${BASE_URL}?view=summary"`} 
                    label="curl command"
                  />
                </div>
                <code className="text-xs font-mono text-primary break-all">
                  curl -H "x-observatory-key: YOUR_KEY" "{BASE_URL}?view=summary"
                </code>
              </div>
            </div>

            {/* Endpoints Tabs */}
            <Tabs defaultValue="read" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="read" className="font-mono text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Read (8)
                </TabsTrigger>
                <TabsTrigger value="action" className="font-mono text-xs">
                  <Bolt className="h-3 w-3 mr-1" />
                  Actions (3)
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="read" className="space-y-3 mt-4">
                {readEndpoints.map((ep) => (
                  <EndpointCard key={ep.name} endpoint={ep} />
                ))}
              </TabsContent>
              
              <TabsContent value="action" className="space-y-3 mt-4">
                {actionEndpoints.map((ep) => (
                  <EndpointCard key={ep.name} endpoint={ep} />
                ))}
              </TabsContent>
            </Tabs>

            {/* Rate Limits */}
            <div className="space-y-2">
              <h4 className="font-mono text-sm font-semibold text-foreground">
                Rate Limits
              </h4>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <span className="font-mono text-amber-600 block">30/min</span>
                    <span className="text-muted-foreground">Read endpoints</span>
                  </div>
                  <div className="text-center">
                    <span className="font-mono text-amber-600 block">10/min</span>
                    <span className="text-muted-foreground">Action endpoints</span>
                  </div>
                  <div className="text-center">
                    <span className="font-mono text-amber-600 block">1/5min</span>
                    <span className="text-muted-foreground">Scrape triggers</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Format */}
            <div className="space-y-2">
              <h4 className="font-mono text-sm font-semibold text-foreground">
                Response Format
              </h4>
              <div className="bg-background/60 rounded-lg border border-border/50 p-3">
                <p className="text-xs text-muted-foreground mb-2">All responses follow this structure:</p>
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`{
  "success": true,
  "timestamp": "ISO",
  "data": { ... },
  "pagination": {
    "total": n,
    "limit": n,
    "offset": n,
    "has_more": boolean
  }
}`}
                </pre>
              </div>
            </div>

            {/* Query Parameters */}
            <div className="space-y-2">
              <h4 className="font-mono text-sm font-semibold text-foreground">
                Common Parameters
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
                      <td>summary, agents, posts, comments, submolts, alerts, scrape_jobs, search</td>
                      <td className="font-mono text-muted-foreground">summary</td>
                    </tr>
                    <tr>
                      <td className="font-mono text-primary py-1">action</td>
                      <td>scrape, create_alert, mark_alerts_read</td>
                      <td className="font-mono text-muted-foreground">—</td>
                    </tr>
                    <tr>
                      <td className="font-mono text-primary py-1">limit</td>
                      <td>Max items to return (1-100)</td>
                      <td className="font-mono text-muted-foreground">50</td>
                    </tr>
                    <tr>
                      <td className="font-mono text-primary py-1">offset</td>
                      <td>Pagination offset</td>
                      <td className="font-mono text-muted-foreground">0</td>
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
