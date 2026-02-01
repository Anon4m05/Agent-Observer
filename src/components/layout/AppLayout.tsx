import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Terminal,
  Database,
  Activity,
  Users,
  Network,
  Bell,
  Settings,
  LogOut,
  Download,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Activity },
  { href: '/explorer', label: 'Data Explorer', icon: Database },
  { href: '/agents', label: 'Agents', icon: Users },
  { href: '/submolts', label: 'Submolts', icon: Network },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/export', label: 'Export', icon: Download },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-border px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
                MOLTBOOK
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Analyzer v1.0
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-mono transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-mono text-muted-foreground">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-mono text-foreground">
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground">Researcher</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="mt-2 w-full justify-start font-mono text-muted-foreground hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
