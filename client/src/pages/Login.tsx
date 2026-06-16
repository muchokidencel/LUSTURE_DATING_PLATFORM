import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Mail, Lock, Loader2, Apple, Globe } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/discovery');
    } catch (err) {
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
          <Link to="/login" className="pb-4 font-sans text-xs font-bold uppercase tracking-[0.2em] border-b-2 border-lustre-purple text-white transition-all">
            Sign In
          </Link>
          <Link to="/register" className="pb-4 font-sans text-xs font-bold uppercase tracking-[0.2em] border-b-2 border-transparent text-lustre-faint hover:text-lustre-muted transition-all">
            Join
          </Link>
        </div>

        {/* Login Card */}
        <Card className="p-6 md:p-10 border-border bg-card shadow-2xl">
          <div className="text-center mb-6 md:mb-10 space-y-2">
            <h1 className="font-garamond text-4xl text-white">Welcome Back</h1>
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
              className="w-full h-14 rounded-xl bg-gradient-brand text-white font-sans font-bold uppercase tracking-widest text-xs shadow-lg" 
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
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-12 border-border-strong bg-elevated text-white rounded-xl text-[9px] font-bold uppercase tracking-widest gap-2">
                <Globe size={14} strokeWidth={1.5} />
                Google
              </Button>
              <Button variant="outline" className="h-12 border-border-strong bg-elevated text-white rounded-xl text-[9px] font-bold uppercase tracking-widest gap-2">
                <Apple size={14} strokeWidth={1.5} />
                Apple
              </Button>
            </div>
          </div>
        </Card>

        <p className="text-center font-sans text-[10px] text-lustre-faint uppercase tracking-widest">
           By signing in, you agree to our <a href="#" className="text-white hover:underline">Terms</a> and <a href="#" className="text-white hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
