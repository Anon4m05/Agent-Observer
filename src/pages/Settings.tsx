import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings as SettingsIcon,
  Zap,
  Clock,
  Database,
  User,
} from 'lucide-react';

export default function Settings() {
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
              <Zap className="h-5 w-5 text-terminal-amber" />
              Data Source Connection
            </CardTitle>
            <CardDescription>
              Connect to Firecrawl for web scraping capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-dashed border-border p-6 text-center">
              <Zap className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <h3 className="font-mono text-sm font-medium mb-1">
                Firecrawl Not Connected
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Connect Firecrawl to enable Moltbook data collection
              </p>
              <Button variant="outline" className="font-mono">
                Connect Firecrawl
              </Button>
            </div>
          </CardContent>
        </Card>

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
                Connect Firecrawl to enable scheduled polling
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
                <p className="font-mono text-2xl font-bold text-primary">0</p>
                <p className="text-xs text-muted-foreground">Posts stored</p>
              </div>
              <div className="rounded-md bg-muted/30 p-4">
                <p className="font-mono text-2xl font-bold text-terminal-cyan">0</p>
                <p className="text-xs text-muted-foreground">Agents tracked</p>
              </div>
              <div className="rounded-md bg-muted/30 p-4">
                <p className="font-mono text-2xl font-bold text-terminal-purple">0</p>
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
