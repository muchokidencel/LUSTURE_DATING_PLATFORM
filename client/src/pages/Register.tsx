import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Mail, Lock, Loader2, Ticket } from 'lucide-react';
import api from '../lib/api';

export default function Register() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const tokenClientRef = useRef<any>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const initClient = () => {
      if ((window as any).google) {
        tokenClientRef.current = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1013735072049-mockid.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          callback: async (response: any) => {
            if (response.access_token) {
              setLoading(true);
              setError('');
              try {
                await loginWithGoogle(response.access_token);
                navigate('/discovery');
              } catch (err: any) {
                setError(err.response?.data?.message || 'Google Sign-In failed');
              } finally {
                setLoading(false);
              }
            }
          },
        });
      }
    };

    if ((window as any).google) {
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

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      setStep(2);
      setResendTimer(30);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email });
      setResendTimer(30);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Verification code must be 6 characters');
      return;
    }
    setError('');
    setStep(3);
  };

  // Each box holds one digit; pasting (or a test filling one box directly)
  // delivers the full code in a single onChange, which we detect and
  // distribute across all six boxes.
  const handleOtpChange = (index: number, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '');
    if (digits.length > 1) {
      const merged = digits.slice(0, 6);
      setCode(merged);
      const lastIndex = Math.min(merged.length, 6) - 1;
      otpRefs.current[lastIndex]?.focus();
      return;
    }
    const chars = Array.from({ length: 6 }, (_, i) => code[i] || '');
    chars[index] = digits;
    setCode(chars.join(''));
    if (digits && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(email, password, referralCode, code);
      navigate('/discovery');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center px-6 py-12 md:py-24">
      <div className="w-full max-w-[420px] space-y-6 md:space-y-10 animate-fade-up">
        
        {/* Auth Tabs */}
        <div className="flex justify-center gap-16 border-b border-border/30">
          <Link to="/login" className="pb-4 font-sans text-xs font-bold uppercase tracking-[0.2em] border-b-2 border-transparent text-lustre-faint hover:text-lustre-muted transition-all">
            Sign In
          </Link>
          <Link to="/register" className="pb-4 font-sans text-xs font-bold uppercase tracking-[0.2em] border-b-2 border-lustre-purple text-lustre-text transition-all">
            Join
          </Link>
        </div>

        {/* Register Card */}
        <Card className="p-6 md:p-10 border-border bg-card shadow-[var(--shadow-card-hover)]">
          <div className="text-center mb-6 md:mb-8 space-y-2">
            <h1 className="font-garamond text-4xl text-lustre-text">Create Account</h1>
            <p className="font-sans text-xs text-lustre-muted">Initiate your journey into authentic connection.</p>
          </div>

          {/* Step progress timeline */}
          <div className="flex items-center justify-between mb-8 px-4">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-sans font-bold transition-all ${step >= 1 ? 'bg-lustre-purple text-[var(--primary-foreground)] shadow-lg shadow-lustre-purple/20' : 'bg-elevated border border-border/30 text-lustre-faint'}`}>1</div>
              <span className="font-sans text-[8px] uppercase tracking-wider text-lustre-faint mt-1 font-bold">Email</span>
            </div>
            <div className={`flex-1 h-[2px] mx-2 transition-all ${step >= 2 ? 'bg-lustre-purple' : 'bg-border/30'}`}></div>
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-sans font-bold transition-all ${step >= 2 ? 'bg-lustre-purple text-[var(--primary-foreground)] shadow-lg shadow-lustre-purple/20' : 'bg-elevated border border-border/30 text-lustre-faint'}`}>2</div>
              <span className="font-sans text-[8px] uppercase tracking-wider text-lustre-faint mt-1 font-bold">Verify</span>
            </div>
            <div className={`flex-1 h-[2px] mx-2 transition-all ${step >= 3 ? 'bg-lustre-purple' : 'bg-border/30'}`}></div>
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-sans font-bold transition-all ${step >= 3 ? 'bg-lustre-purple text-[var(--primary-foreground)] shadow-lg shadow-lustre-purple/20' : 'bg-elevated border border-border/30 text-lustre-faint'}`}>3</div>
              <span className="font-sans text-[8px] uppercase tracking-wider text-lustre-faint mt-1 font-bold">Security</span>
            </div>
          </div>

          {error && (
            <div className="p-3 mb-6 bg-lustre-rose/10 border border-lustre-rose/20 text-lustre-rose text-[10px] font-sans font-bold uppercase tracking-widest rounded-lg text-center">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
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
                <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">Invitation Code (Optional)</label>
                <div className="relative group">
                  <Input
                    type="text"
                    placeholder="LUSTRE-VIP"
                    className="pl-11 h-12 bg-elevated border-border rounded-xl font-bold tracking-widest"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                  />
                  <Ticket size={16} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-lustre-faint group-focus-within:text-lustre-purple transition-colors" />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-xl font-sans font-bold uppercase tracking-widest text-xs shadow-[var(--shadow-card-hover)] mt-4" 
                disabled={loading}
              >
                {loading ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" /> : "Send Verification Code"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="space-y-2">
                <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">Verification Code</label>
                <div className="flex justify-center gap-2" data-testid="otp-boxes">
                  {Array.from({ length: 6 }, (_, i) => code[i] || '').map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder={i === 0 ? "123456" : "0"}
                      aria-label={`Verification code digit ${i + 1}`}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      required={i === 0}
                      className="w-11 h-12 md:w-12 md:h-14 text-center text-lg font-bold bg-elevated border border-border rounded-xl text-lustre-text outline-none focus:border-lustre-purple focus:ring-1 focus:ring-lustre-purple/30 transition-all placeholder:text-sm"
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center px-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-sans text-[9px] uppercase tracking-widest text-lustre-faint hover:text-lustre-text transition-colors font-bold"
                >
                  ← Back to Email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  className={`font-sans text-[9px] uppercase tracking-widest font-bold transition-colors ${resendTimer > 0 ? 'text-lustre-faint' : 'text-lustre-purple/60 hover:text-lustre-purple'}`}
                >
                  {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : 'Resend Code'}
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-xl font-sans font-bold uppercase tracking-widest text-xs shadow-[var(--shadow-card-hover)] mt-4"
                disabled={loading}
              >
                Confirm Code
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 relative">
                <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">Password</label>
                <div className="relative group">
                  <Input
                    type="password"
                    placeholder="Min. 8 characters"
                    className="pl-11 h-12 bg-elevated border-border rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock size={16} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-lustre-faint group-focus-within:text-lustre-purple transition-colors" />
                </div>
              </div>

              <div className="flex items-center px-1">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="font-sans text-[9px] uppercase tracking-widest text-lustre-faint hover:text-lustre-text transition-colors font-bold"
                >
                  ← Back to Verify
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-xl font-sans font-bold uppercase tracking-widest text-xs shadow-[var(--shadow-card-hover)] mt-4" 
                disabled={loading}
              >
                {loading ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" /> : "Create Account"}
              </Button>
            </form>
          )}

          <div className="mt-10">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30"></div></div>
              <span className="relative bg-card px-4 font-sans text-[9px] text-lustre-faint uppercase tracking-[0.3em] font-bold">Institutional Access</span>
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
           Already a member? <Link to="/login" className="text-lustre-text hover:underline font-bold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

