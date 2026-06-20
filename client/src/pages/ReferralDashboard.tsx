import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { useReferralStats, useReferralActivity, useWithdraw } from '../hooks/useQueries';
import { Badge } from '../components/ui/badge';
import { Sparkles, Copy, Share2, History, Loader2, User, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';

interface ActivityItem {
  displayName?: string;
  timeAgo: string;
  amount?: number;
  status: string;
}

// Activity events overload `status` with two vocabularies: affiliate-earning
// status ('pending' | 'available') for signup/conversion events, and
// withdrawal status ('requested' | 'completed' | 'rejected') for payouts.
function activityBadgeVariant(status: string) {
  switch (status) {
    case 'completed':
      return 'paid';
    case 'available':
    case 'requested':
      return 'processing';
    case 'rejected':
      return 'destructive';
    default:
      return 'pending';
  }
}

export default function ReferralDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useReferralStats();
  const { data: activityList } = useReferralActivity();
  const withdrawMutation = useWithdraw();
  
  const [copied, setCopied] = useState(false);

  const getReferralLink = () => {
    if (!user?.referralCode) return '';
    return `${window.location.origin}/register?ref=${user.referralCode}`;
  };

  const copyLink = () => {
    const link = getReferralLink();
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    try {
      console.log(`[INTEGRATION:WITHDRAW] Requesting withdrawal for user`);
      await withdrawMutation.mutateAsync();
    } catch (error) {
      console.error('[INTEGRATION:WITHDRAW] Failed to withdraw:', error);
    }
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <Loader2 size={48} strokeWidth={1.5} className="text-lustre-purple animate-spin" />
      </div>
    );
  }

  const referralStats = [
    { label: 'Total Earned', value: stats?.totalEarnings || 0, color: 'text-lustre-purple' },
    { label: 'Paid Out', value: stats?.withdrawnEarnings || 0, color: 'text-lustre-rose' },
    { label: 'Available', value: stats?.availableEarnings || 0, color: 'text-lustre-gold' },
  ];

  const availableEarnings = stats?.availableEarnings || 0;
  const pendingEarnings = stats?.pendingEarnings || 0;
  const withdrawThreshold = 500;
  const canWithdraw = availableEarnings >= withdrawThreshold;
  const amountToThreshold = Math.max(0, withdrawThreshold - availableEarnings);

  return (
    <div className="min-h-screen bg-void px-6 py-24 pb-32">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header Section */}
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-center gap-2 text-lustre-purple">
             <Sparkles size={16} strokeWidth={1.5} />
             <span className="font-sans text-xs uppercase tracking-[0.2em] font-bold">Lustre Rewards</span>
          </div>
          <h1 className="font-garamond text-4xl md:text-5xl text-lustre-text">Referrals</h1>
          <p className="font-sans text-lustre-muted max-w-2xl leading-relaxed">
            Invite your circle to experience the Lustre standard and earn rewards for every successful match curated through your referral conduit.
          </p>
        </div>

        {/* Wallet Hero */}
        <div className="bg-card border border-lustre-gold/40 rounded-2xl p-8 md:p-10 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 relative overflow-hidden animate-fade-up">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <p className="font-headline text-[10px] uppercase tracking-[0.2em] text-lustre-faint font-bold">Your Wallet</p>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-sm text-lustre-gold font-bold opacity-70">KES</span>
                <span className="font-garamond text-5xl font-semibold text-lustre-gold">{availableEarnings.toLocaleString()}</span>
              </div>
              <p className="font-sans text-xs text-lustre-muted">
                KES {pendingEarnings.toLocaleString()} pending · KES 50 earned per upgrade
              </p>
            </div>
            <div className="space-y-2 flex flex-col items-stretch md:items-end">
              <Button
                variant="gold"
                onClick={handleWithdraw}
                disabled={!canWithdraw || withdrawMutation.isPending}
                className="rounded-full px-8 h-12 font-sans font-bold uppercase tracking-widest text-[10px]"
              >
                {withdrawMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Wallet size={16} className="mr-2" />}
                Withdraw to M-Pesa
              </Button>
              {!canWithdraw && (
                <p className="font-sans text-[10px] text-lustre-faint">
                  {amountToThreshold > 0
                    ? `KES ${amountToThreshold.toLocaleString()} more to unlock withdrawal`
                    : `Minimum KES ${withdrawThreshold} to withdraw`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 animate-fade-up">
          {referralStats.map((stat, i) => (
            <div key={i} className="bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] p-8 rounded-xl transition-all duration-300 cursor-default">
               <p className="font-headline text-[10px] uppercase tracking-[0.2em] text-lustre-faint font-bold mb-4">{stat.label}</p>
               <div className="flex items-baseline gap-2">
                  <span className="font-headline text-xs text-lustre-muted font-bold opacity-50">KES</span>
                  <span className={cn("font-garamond text-3xl font-semibold", stat.color)}>
                    {stat.value.toLocaleString()}
                  </span>
               </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-up">
          {/* Invitation Console */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-card shadow-[var(--shadow-card)] p-8 rounded-xl space-y-8">
               <h3 className="font-headline text-xs font-semibold text-lustre-purple uppercase tracking-[0.2em]">Your Personal Invitation</h3>
               
               <div className="bg-base border border-border-subtle rounded-xl p-8 text-center relative overflow-hidden flex flex-col items-center justify-center gap-3">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-brand opacity-80" />
                  <span className="font-headline text-[10px] uppercase tracking-[0.2em] text-lustre-muted font-bold">Your Referral Link</span>
                  <a
                    href={getReferralLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="font-sans text-xs md:text-sm font-medium text-lustre-purple hover:underline break-all block px-4 select-all"
                  >
                    {getReferralLink() || 'Generating Link...'}
                  </a>
               </div>
               
               <div className="flex gap-3">
                  <Button className="flex-1 h-12 bg-elevated border border-border-subtle text-lustre-text rounded-xl gap-3 font-headline font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-hover" onClick={copyLink}>
                     <Copy size={16} strokeWidth={1.5} />
                     <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
                  </Button>
                  <Button variant="outline" className="h-12 bg-lustre-rose-dim/20 border-lustre-rose-dim/40 text-lustre-rose rounded-xl px-6 hover:bg-lustre-rose/10 transition-all">
                     <Share2 size={18} strokeWidth={1.5} />
                  </Button>
               </div>
            </div>

            {/* Protocol Card */}
            <div className="bg-card shadow-[var(--shadow-card)] p-8 rounded-xl space-y-8">
               <h3 className="font-headline text-xs font-semibold text-lustre-purple uppercase tracking-[0.2em]">How it works</h3>
               <div className="space-y-6">
                  {[
                    "Extend your unique code to individuals who value exclusivity.",
                    "Recipients receive access to our curated high-intent community.",
                    "You earn KES 50 for every referral who joins."
                  ].map((text, i) => (
                    <div key={i} className="flex gap-4 items-start">
                       <div className="w-8 h-8 rounded-full bg-elevated border border-border-subtle flex items-center justify-center flex-shrink-0 text-lustre-muted font-sans text-xs font-bold">{i+1}</div>
                       <p className="font-sans text-sm text-lustre-muted leading-relaxed pt-1">{text}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Earnings History */}
          <div className="lg:col-span-7">
            <div className="bg-card shadow-[var(--shadow-card)] rounded-xl overflow-hidden">
               <div className="p-8 border-b border-border-subtle flex items-center justify-between">
                  <h3 className="font-headline text-xs font-semibold text-lustre-purple uppercase tracking-[0.2em]">Earnings History</h3>
                  <button className="font-headline text-xs font-bold text-lustre-purple hover:underline transition-all">View All</button>
               </div>
               
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="text-lustre-faint font-headline text-[9px] uppercase tracking-[0.2em] border-b border-border-subtle">
                           <th className="px-8 py-6 font-bold">Referral</th>
                           <th className="px-8 py-6 font-bold">Amount</th>
                           <th className="px-8 py-6 font-bold text-right">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border-subtle">
                        {(!activityList || activityList.length === 0) ? (
                           <tr>
                              <td colSpan={3} className="px-8 py-24 text-center">
                                  <div className="flex flex-col items-center gap-4 opacity-30">
                                     <History size={48} strokeWidth={1.5} className="text-lustre-muted" />
                                     <p className="font-headline text-[10px] uppercase tracking-widest font-bold">No activity recorded yet</p>
                                  </div>
                              </td>
                           </tr>
                        ) : (
                           activityList.map((item: ActivityItem, i: number) => (
                              <tr key={i} className="hover:bg-hover/30 transition-all group">
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-full bg-elevated border border-border-subtle flex items-center justify-center text-lustre-muted">
                                          <User size={16} strokeWidth={1.5} />
                                       </div>
                                       <div>
                                          <div className="text-lustre-text font-sans text-sm font-semibold">{item.displayName || 'Anonymous Member'}</div>
                                          <div className="text-[10px] text-lustre-faint font-sans uppercase font-bold tracking-widest mt-1">{item.timeAgo}</div>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6">
                                    <span className="font-sans text-sm font-bold text-lustre-text">KES {item.amount || '50'}</span>
                                 </td>
                                 <td className="px-8 py-6 text-right">
                                    <Badge variant={activityBadgeVariant(item.status)}>
                                       {item.status || 'Pending'}
                                    </Badge>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
