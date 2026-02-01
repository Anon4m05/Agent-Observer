import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { moltbookApi } from '@/lib/api/moltbook';
import { AgentRegistration } from '@/components/settings/AgentRegistration';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  Zap,
  Clock,
  Database,
  User,
  CheckCircle,
  Loader2,
} from 'lucide-react';

export default function Settings() {
  const [stats, setStats] = useState({ posts: 0, agents: 0, comments: 0 });
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [postsRes, agentsRes, commentsRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('agents').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        posts: postsRes.count || 0,
        agents: agentsRes.count || 0,
        comments: commentsRes.count || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await moltbookApi.testConnection();
      if (result.connected) {
        setConnectionStatus('connected');
        toast.success('Firecrawl connection verified');
      } else {
        setConnectionStatus('error');
        toast.error(result.error || 'Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Failed to test connection');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold font-mono tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure your analyzer preferences and connections
          </p>
        </div>

        {/* Data Source Connection */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Data Source Connection
            </CardTitle>
            <CardDescription>
              Firecrawl web scraping integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">Firecrawl</span>
                    {connectionStatus === 'connected' && (
                      <span className="flex items-center gap-1 text-xs font-mono text-primary">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Web scraping API for Moltbook data collection
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-2 text-xs font-mono text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Connected
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="font-mono"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                  >
                    {testingConnection && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    Test
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Moltbook Agent Registration */}
        <AgentRegistration />

        {/* Auto Scraping */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-terminal-cyan" />
              Scheduled Polling
            </CardTitle>
            <CardDescription>
              Configure automatic background data collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-mono text-sm">Enable Auto-Scraping</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically collect new data at regular intervals
                </p>
              </div>
              <Switch disabled />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-sm">Scrape Interval</Label>
              <Select disabled defaultValue="6">
                <SelectTrigger className="w-48 font-mono">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every hour</SelectItem>
                  <SelectItem value="6">Every 6 hours</SelectItem>
                  <SelectItem value="12">Every 12 hours</SelectItem>
                  <SelectItem value="24">Daily</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Scheduled polling coming soon
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Database Status
            </CardTitle>
            <CardDescription>
              Archive storage information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md bg-muted/30 p-4">
                <p className="font-mono text-2xl font-bold text-primary">
                  {loading ? '-' : stats.posts.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Posts stored</p>
              </div>
              <div className="rounded-md bg-muted/30 p-4">
                <p className="font-mono text-2xl font-bold text-terminal-cyan">
                  {loading ? '-' : stats.agents.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Agents tracked</p>
              </div>
              <div className="rounded-md bg-muted/30 p-4">
                <p className="font-mono text-2xl font-bold text-terminal-purple">
                  {loading ? '-' : stats.comments.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Comments archived</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Account
            </CardTitle>
            <CardDescription>
              Manage your researcher account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 font-mono">
              Logged in as researcher with single-user access
            </p>
            <Button variant="destructive" size="sm" className="font-mono">
              Delete All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
