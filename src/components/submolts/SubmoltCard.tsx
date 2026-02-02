import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, FileText, Users, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SubmoltCardProps {
  submolt: {
    id: string;
    name: string;
    description: string | null;
    member_count: number;
    first_seen_at: string;
    last_scraped_at: string | null;
    post_count: number;
  };
}

export function SubmoltCard({ submolt }: SubmoltCardProps) {
  const firstSeenDate = new Date(submolt.first_seen_at);
  const lastScrapedDate = submolt.last_scraped_at ? new Date(submolt.last_scraped_at) : null;

  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors group">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Network className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-mono font-semibold text-foreground">
                m/{submolt.name}
              </h3>
              {submolt.description && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {submolt.description}
                </p>
              )}
            </div>
          </div>
          <Link
            to={`/explorer?submolt=${submolt.name}`}
            className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-mono font-semibold text-foreground">
                {submolt.post_count}
              </p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-mono font-semibold text-foreground">
                {submolt.member_count || '—'}
              </p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>First seen {formatDistanceToNow(firstSeenDate, { addSuffix: true })}</span>
          </div>
          {lastScrapedDate && (
            <Badge variant="outline" className="text-xs font-mono">
              Updated {formatDistanceToNow(lastScrapedDate, { addSuffix: true })}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
