import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Terminal, Eye, EyeOff, Loader2 } from 'lucide-react';

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Check your email to confirm your account');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          navigate('/dashboard');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
          <Terminal className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl font-mono tracking-tight">
            {mode === 'signin' ? 'Access Terminal' : 'Initialize Account'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {mode === 'signin' 
              ? 'Enter credentials to access the analyzer' 
              : 'Create researcher account to begin observation'
            }
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="researcher@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-mono bg-background/50 border-border/50 focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="font-mono bg-background/50 border-border/50 focus:border-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full font-mono uppercase tracking-wider"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'signin' ? 'Authenticate' : 'Initialize'}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'signin' ? (
            <>
              No account?{' '}
              <a href="/signup" className="text-primary hover:underline font-mono">
                Initialize
              </a>
            </>
          ) : (
            <>
              Already initialized?{' '}
              <a href="/signin" className="text-primary hover:underline font-mono">
                Authenticate
              </a>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
