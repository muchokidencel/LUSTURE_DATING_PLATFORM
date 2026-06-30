import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage } from '../lib/errors';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const tokenClientRef = useRef<ReturnType<NonNullable<Window['google']>['accounts']['oauth2']['initTokenClient']> | null>(null);

  useEffect(() => {
    const initClient = () => {
      if (window.google) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1013735072049-mockid.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          callback: async (response) => {
            if (response.access_token) {
              setLoading(true);
              setError('');
              try {
                await loginWithGoogle(response.access_token);
                navigate('/discovery');
              } catch (err: unknown) {
                setError(getErrorMessage(err, 'Google Sign-In failed'));
              } finally {
                setLoading(false);
              }
            }
          },
        });
      }
    };

    if (window.google) {
      initClient();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initClient;
      document.body.appendChild(script);
    }
  }, [loginWithGoogle, navigate]);

  const handleGoogleClick = () => {
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken();
    } else {
      setError('Google Sign-In is initializing. Please try again in a moment.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/discovery');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center px-6 py-12 md:py-24">
      <div className="w-full max-w-[420px] space-y-6 md:space-y-10 animate-fade-up">
        
        {/* Auth Tabs */}
        <div className="flex justify-center gap-16 border-b border-border/30">
          <Link to="/login" className="pb-4 font-sans text-xs font-bold uppercase tracking-[0.2em] border-b-2 border-lustre-purple text-lustre-text transition-all">
            Sign In
          </Link>
          <Link to="/register" className="pb-4 font-sans text-xs font-bold uppercase tracking-[0.2em] border-b-2 border-transparent text-lustre-faint hover:text-lustre-muted transition-all">
            Join
          </Link>
        </div>

        {/* Login Card */}
        <Card className="p-6 md:p-10 border-border bg-card shadow-[var(--shadow-card-hover)]">
          <div className="text-center mb-6 md:mb-10 space-y-2">
            <img src="/lustre-mark.svg" alt="Lustre" className="h-10 w-auto mx-auto mb-4" />
            <h1 className="font-garamond text-4xl text-lustre-text">Welcome Back</h1>
            <p className="font-sans text-xs text-lustre-muted">Enter your credentials to access Lustre.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-lustre-rose/10 border border-lustre-rose/20 text-lustre-rose text-[10px] font-sans font-bold uppercase tracking-widest rounded-lg text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2 relative">
              <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">Email Address</label>
              <div className="relative group">
                <Input
                  type="email"
                  placeholder="alexander@lustre.com"
                  className="pl-11 h-12 bg-elevated border-border rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={16} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-lustre-faint group-focus-within:text-lustre-purple transition-colors" />
              </div>
            </div>

            <div className="space-y-2 relative">
              <div className="flex justify-between items-center px-1">
                <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold">Password</label>
                <a href="#" className="font-sans text-[9px] uppercase tracking-widest text-lustre-purple/60 hover:text-lustre-purple font-bold transition-colors">Forgot?</a>
              </div>
              <div className="relative group">
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-11 h-12 bg-elevated border-border rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-lustre-faint group-focus-within:text-lustre-purple transition-colors" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-xl font-sans font-bold uppercase tracking-widest text-xs shadow-[var(--shadow-card-hover)]"
              disabled={loading}
            >
              {loading ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="mt-12">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30"></div></div>
              <span className="relative bg-card px-4 font-sans text-[9px] text-lustre-faint uppercase tracking-[0.3em] font-bold">Alternative Access</span>
            </div>
            
             <div className="flex justify-center">
              <Button 
                type="button"
                onClick={handleGoogleClick}
                variant="outline" 
                className="w-full h-12 border-border-strong bg-elevated text-lustre-text rounded-xl text-[9px] font-bold uppercase tracking-widest gap-3 hover:bg-elevated/85 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          </div>
        </Card>

        <p className="text-center font-sans text-[10px] text-lustre-faint uppercase tracking-widest">
           By signing in, you agree to our <a href="#" className="text-lustre-text hover:underline">Terms</a> and <a href="#" className="text-lustre-text hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
