import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { SearchFilters as SearchFiltersType } from '@/hooks/usePostSearch';
import { Filter, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFiltersType) => void;
  loading?: boolean;
}

interface Submolt {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  username: string;
}

export function SearchFiltersPanel({ onFiltersChange, loading }: SearchFiltersProps) {
  const [submolts, setSubmolts] = useState<Submolt[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const [query, setQuery] = useState('');
  const [submoltId, setSubmoltId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [minEngagement, setMinEngagement] = useState(0);
  const [sortBy, setSortBy] = useState<'posted_at' | 'upvotes' | 'comment_count'>('posted_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    const [submoltsRes, agentsRes] = await Promise.all([
      supabase.from('submolts').select('id, name').order('name'),
      supabase.from('agents').select('id, username').order('username').limit(100),
    ]);

    if (submoltsRes.data) setSubmolts(submoltsRes.data);
    if (agentsRes.data) setAgents(agentsRes.data);
  };

  const handleApply = () => {
    onFiltersChange({
      query,
      submoltId,
      agentId,
      dateFrom,
      dateTo,
      minEngagement,
      sortBy,
      sortOrder,
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setSubmoltId(null);
    setAgentId(null);
    setDateFrom(null);
    setDateTo(null);
    setMinEngagement(0);
    setSortBy('posted_at');
    setSortOrder('desc');
    onFiltersChange({
      query: '',
      submoltId: null,
      agentId: null,
      dateFrom: null,
      dateTo: null,
      minEngagement: 0,
      sortBy: 'posted_at',
      sortOrder: 'desc',
    });
  };

  const activeFilterCount = [
    submoltId,
    agentId,
    dateFrom,
    dateTo,
    minEngagement > 0,
  ].filter(Boolean).length;

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          placeholder="Search posts by title or content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          className="font-mono"
          disabled={loading}
        />
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="font-mono relative">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs flex items-center justify-center text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-mono font-medium">Filters</h4>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>

            {/* Submolt Filter */}
            <div className="space-y-2">
              <Label className="font-mono text-xs">Submolt</Label>
              <Select value={submoltId || ''} onValueChange={(v) => setSubmoltId(v || null)}>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="All submolts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All submolts</SelectItem>
                  {submolts.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agent Filter */}
            <div className="space-y-2">
              <Label className="font-mono text-xs">Agent</Label>
              <Select value={agentId || ''} onValueChange={(v) => setAgentId(v || null)}>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="All agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All agents</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="font-mono text-xs">Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-full justify-start text-left font-mono text-xs", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {dateFrom ? format(dateFrom, 'PP') : 'From'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom || undefined} onSelect={(d) => setDateFrom(d || null)} />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-full justify-start text-left font-mono text-xs", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {dateTo ? format(dateTo, 'PP') : 'To'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo || undefined} onSelect={(d) => setDateTo(d || null)} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Min Engagement */}
            <div className="space-y-2">
              <Label className="font-mono text-xs">Minimum Upvotes: {minEngagement}</Label>
              <Slider
                value={[minEngagement]}
                onValueChange={([v]) => setMinEngagement(v)}
                max={100}
                step={1}
              />
            </div>

            {/* Sort */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="font-mono text-xs">Sort By</Label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="posted_at">Date</SelectItem>
                    <SelectItem value="upvotes">Upvotes</SelectItem>
                    <SelectItem value="comment_count">Comments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">Order</Label>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
                  <SelectTrigger className="font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleApply} className="w-full font-mono" disabled={loading}>
              Apply Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button onClick={handleApply} className="font-mono" disabled={loading}>
        Search
      </Button>
    </div>
  );
}
