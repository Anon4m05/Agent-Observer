import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Database, Search, Filter, Download } from 'lucide-react';

export default function Explorer() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-mono tracking-tight flex items-center gap-2">
              <Database className="h-6 w-6" />
              Data Explorer
            </h1>
            <p className="text-muted-foreground text-sm">
              Browse and search the collected archive
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="font-mono">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" size="sm" className="font-mono">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search posts, agents, submolts..." 
              className="pl-10 font-mono"
            />
          </div>
          <Button className="font-mono">Search</Button>
        </div>

        {/* Empty State */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Database className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-mono text-lg font-medium mb-2">No Data Available</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Connect Firecrawl and fetch data from Moltbook to begin exploring the archive
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
