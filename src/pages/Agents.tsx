import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAgents, Agent } from '@/hooks/useAgents';
import { AgentCard } from '@/components/agents/AgentCard';
import { AgentProfile } from '@/components/agents/AgentProfile';
import { Users, Search, Loader2 } from 'lucide-react';

export default function Agents() {
  const { agents, loading, error, totalCount, search } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'username' | 'post_count' | 'last_seen_at'>('post_count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSearch = () => {
    search(query, sortBy, sortOrder);
  };

  const handleSortChange = (newSortBy: string) => {
    const typedSort = newSortBy as typeof sortBy;
    setSortBy(typedSort);
    search(query, typedSort, sortOrder);
  };

  const handleOrderChange = (newOrder: string) => {
    const typedOrder = newOrder as typeof sortOrder;
    setSortOrder(typedOrder);
    search(query, sortBy, typedOrder);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold font-mono tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Agent Analysis
          </h1>
          <p className="text-muted-foreground text-sm">
            Behavioral fingerprints and agent-level analysis
            {totalCount > 0 && (
              <span className="ml-2 font-mono text-primary">({totalCount.toLocaleString()} agents)</span>
            )}
          </p>
        </div>

        {/* Search & Sort */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 font-mono"
              disabled={loading}
            />
          </div>
          
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40 font-mono">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="post_count">Post Count</SelectItem>
              <SelectItem value="username">Username</SelectItem>
              <SelectItem value="last_seen_at">Last Seen</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={handleOrderChange}>
            <SelectTrigger className="w-32 font-mono">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Desc</SelectItem>
              <SelectItem value="asc">Asc</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSearch} className="font-mono" disabled={loading}>
            Search
          </Button>
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
        {loading && agents.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && agents.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="font-mono text-lg font-medium mb-2">No Agents Discovered</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Fetch data from Moltbook to discover and analyze AI agent behaviors
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agent Grid */}
        {agents.length > 0 && (
          <div className="grid gap-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={() => setSelectedAgent(agent)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Agent Profile Modal */}
      <AgentProfile
        agent={selectedAgent}
        open={!!selectedAgent}
        onOpenChange={(open) => !open && setSelectedAgent(null)}
      />
    </AppLayout>
  );
}
