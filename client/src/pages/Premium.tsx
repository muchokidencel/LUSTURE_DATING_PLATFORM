import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { useSubscription } from '../hooks/useQueries';
import { Crown, Zap, ShieldCheck, Globe, History, Send, Smartphone, CreditCard, Loader2, CircleCheck } from 'lucide-react';

export default function Premium() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: subscription, isLoading: subLoading, refetch: refetchSub } = useSubscription();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'paystack' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [polling, setPolling] = useState(false);
  const verifiedRef = useRef<string | null>(null);

  useEffect(() => {
    const verifyPaystack = async (reference: string) => {
      setLoading(true);
      try {
        await api.get(`/payments/pay/paystack/verify/${reference}`);
        await refetchSub();
      } catch (error: any) {
        console.error('Verification error:', error);
      } finally {
        setLoading(false);
        navigate('/premium', { replace: true });
      }
    };

    const reference = searchParams.get('reference');
    if (reference && verifiedRef.current !== reference) {
      verifiedRef.current = reference;
      verifyPaystack(reference);
    }
  }, [searchParams, navigate, refetchSub]);

  // Polling for M-Pesa status
  useEffect(() => {
    let interval: any;
    if (polling) {
      interval = setInterval(async () => {
        const { data } = await refetchSub();
        if (data && new Date(data.endDate) > new Date()) {
          setPolling(false);
          setShowPaymentModal(false);
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [polling, refetchSub]);

  const isPremium = subscription && new Date(subscription.endDate) > new Date();

  const handleMpesaPay = async (amount: number) => {
    if (!phoneNumber) return;
    setLoading(true);
    try {
      await api.post('/payments/pay/mpesa', {
        amount,
        phoneNumber: phoneNumber.replace(/\D/g, ''),
      });
      setPolling(true);
    } catch (error: any) {
      setLoading(false);
    }
  };

  const handlePaystackPay = async (amount: number) => {
    setLoading(true);
    try {
      const { data } = await api.post('/payments/pay/paystack/initialize', {
        amount,
        email: user?.email,
        callbackUrl: `${window.location.origin}/premium`,
      });
      window.location.href = data.data.authorization_url;
    } catch (error: any) {
      setLoading(false);
    }
  };

  const monthlyFeatures = [
    'Unlimited Direct Connections',
    'Advanced Aesthetic Filters',
    'Identify Mutual Interest',
    'Ghost Mode Access'
  ];

  return (
    <div className="min-h-screen bg-void pb-32">
      <div className="max-w-6xl mx-auto px-6 pt-24">
        
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-24 animate-fade-up">
          <Badge variant="premium" className="mb-8 px-6 py-2 rounded-full border-lustre-gold/30 bg-elevated text-lustre-gold font-sans font-bold uppercase tracking-[0.2em] text-[10px]">
            <Crown size={12} className="mr-2"  strokeWidth={1.5} />
            Experience Excellence
          </Badge>

          <h1 className="font-garamond text-6xl md:text-8xl font-medium tracking-tight mb-8 bg-gradient-to-r from-lustre-text to-lustre-gold bg-clip-text text-transparent">
            Go Premium
          </h1>

          <p className="font-sans text-lg text-lustre-muted max-w-2xl mx-auto leading-relaxed">
            Elevate your connections with exclusive features designed for those who seek the extraordinary.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-md mx-auto mb-16 md:mb-32 animate-fade-up">
          
          {/* Monthly Plan */}
          <div className="p-8 md:p-12 bg-card border border-lustre-gold/50 flex flex-col shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] rounded-2xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />
            <div className="space-y-2 mb-6 md:mb-8 text-center">
              <h3 className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-lustre-gold">Monthly Plan</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-garamond text-5xl font-semibold text-lustre-text">
                  KES 500
                </span>
                <span className="font-sans text-lustre-muted text-sm font-medium">/ month</span>
              </div>
            </div>

            <div className="space-y-4 mb-6 md:mb-10 flex-1">
              {monthlyFeatures.map(f => (
                <div key={f} className="flex items-center gap-4">
                  <CircleCheck size={18} strokeWidth={1.5} className="text-lustre-purple shrink-0" />
                  <span className="font-sans text-sm text-lustre-muted">{f}</span>
                </div>
              ))}
            </div>

            <Button 
              variant="outline" 
              className="w-full h-14 rounded-xl border-border-subtle text-lustre-text font-headline text-[10px] uppercase tracking-widest font-bold hover:bg-hover active:scale-95 transition-all bg-transparent"
              onClick={() => !isPremium && setShowPaymentModal(true)}
              disabled={isPremium || subLoading}
            >
              {isPremium ? "Elite Active" : "Get Started"}
            </Button>
          </div>
        </div>

        {/* Advantage Grid */}
        <div className="space-y-20 animate-fade-up">
          <div className="text-center space-y-4">
            <h2 className="font-garamond text-4xl text-lustre-text">The Premium Advantage</h2>
            <p className="font-sans text-lustre-muted max-w-xl mx-auto">Sophisticated tools designed to refine your search for meaningful connection.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { icon: ShieldCheck, title: 'Ghost Mode', desc: "Traverse the community anonymously. Reveal your presence only when you find perfection." },
              { icon: Crown, title: 'Elite Status', desc: "Gain immediate trust with a Founder's gold verification badge that signifies deep intent." },
              { icon: Globe, title: 'Global Passport', desc: "Connect with members in any cultural capital worldwide. Perfect for the global citizen." },
              { icon: Zap, title: 'Priority Pulse', desc: "Receive 3x more visibility during peak community hours with automated pulse boosting." },
              { icon: History, title: 'Rewind Essence', desc: "Inadvertently passed on a profile? Use unlimited rewinds to re-examine the connection." },
              { icon: Send, title: 'Priority Conduits', desc: "Your outreach always commands attention, staying at the forefront of their experience." }
            ].map((item, i) => (
              <div key={i} className="bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] p-8 rounded-2xl flex flex-col items-center text-center space-y-6 group transition-all duration-300">
                 <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center border border-border-subtle group-hover:bg-lustre-purple/10 transition-all duration-300">
                    <item.icon size={28} strokeWidth={1.5} className="text-lustre-purple" />
                 </div>
                 <div className="space-y-3">
                   <h4 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-lustre-text">{item.title}</h4>
                   <p className="font-sans text-sm text-lustre-muted leading-relaxed px-2">{item.desc}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div className="mt-40 p-16 text-center space-y-10 bg-card rounded-2xl relative overflow-hidden animate-fade-up shadow-[var(--shadow-card)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-brand" />
          <div className="space-y-4">
            <h2 className="font-garamond text-5xl text-lustre-text italic">Secure Your Access</h2>
            <p className="font-sans text-lustre-muted max-w-lg mx-auto leading-relaxed">
              Join the most exclusive community of high-intent individuals and begin your journey toward a truly refined connection.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button className="w-full sm:w-auto px-12 h-14 rounded-full bg-gradient-brand text-white font-headline text-[10px] uppercase tracking-widest font-bold shadow-md hover:scale-105 active:scale-95 transition-all" onClick={() => setShowPaymentModal(true)}>
              Upgrade Now
            </Button>
            <Button variant="outline" className="w-full sm:w-auto px-12 h-14 rounded-full border-border-subtle text-lustre-muted font-headline text-[10px] uppercase tracking-widest font-bold hover:bg-hover transition-all bg-transparent">
              View FAQs
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md p-10 bg-card-alt">
          <DialogHeader className="text-center space-y-6 mb-10">
             <div className="w-20 h-20 bg-lustre-gold/10 rounded-full mx-auto flex items-center justify-center border border-lustre-gold/20">
                <Crown size={36} strokeWidth={1.5} className="text-lustre-gold" />
             </div>
             <div className="space-y-2">
               <DialogTitle className="text-3xl">Secure Settlement</DialogTitle>
               <DialogDescription className="text-sm">
                  Confirm your subscription to Lustre Elite and unlock your premium experience.
               </DialogDescription>
             </div>
          </DialogHeader>

          {!paymentMethod ? (
            <div className="space-y-4">
              <button 
                className="w-full flex items-center gap-4 p-6 bg-base rounded-xl border border-border-subtle hover:bg-hover transition-all text-left"
                onClick={() => setPaymentMethod('mpesa')}
              >
                <div className="p-3 rounded-full bg-green-500/10 text-green-500">
                  <Smartphone size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-lustre-text font-bold">M-PESA</p>
                  <p className="font-sans text-xs text-lustre-muted">Instant mobile reconciliation</p>
                </div>
              </button>

              <button 
                className="w-full flex items-center gap-4 p-6 bg-base rounded-xl border border-border-subtle hover:bg-hover transition-all text-left"
                onClick={() => handlePaystackPay(500)}
              >
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                  <CreditCard size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-sans text-xs uppercase tracking-widest text-lustre-text font-bold">Global Card</p>
                  <p className="font-sans text-xs text-lustre-muted">Secure international conduit</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-up">
              <div className="space-y-4">
                 <p className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">M-Pesa Number</p>
                 <Input 
                    placeholder="e.g. 0712345678" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-14 text-lg rounded-xl"
                 />
              </div>
              <div className="flex gap-4">
                 <Button variant="outline" className="flex-1 h-12 rounded-full font-sans font-bold text-[10px] uppercase tracking-widest" onClick={() => setPaymentMethod(null)}>
                    Return
                 </Button>
                 <Button className="flex-[2] h-12 rounded-full bg-gradient-brand text-white font-sans font-bold text-[10px] uppercase tracking-widest" onClick={() => handleMpesaPay(500)} disabled={loading}>
                    {loading ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" /> : "Dispatch Prompt"}
                 </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
