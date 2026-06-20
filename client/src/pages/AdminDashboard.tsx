import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { useAdminStats, useAdminWithdrawals, useUpdateWithdrawal } from '../hooks/useQueries';
import { Card } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Users, Crown, Wallet, RefreshCw, LogOut, Loader2, TableProperties, Download, Award, User, TrendingUp, CheckCircle2, CircleX } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';

interface Withdrawal {
  id: number;
  userId: number;
  amount: number;
  provider: string;
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading, isFetching: statsFetching, refetch: refetchStats } = useAdminStats();
  const { data: withdrawals, isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useAdminWithdrawals();
  const updateWithdrawalMutation = useUpdateWithdrawal();
  const { logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [actioningType, setActioningType] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats();
      refetchWithdrawals();
    }, 60000);
    return () => clearInterval(interval);
  }, [refetchStats, refetchWithdrawals]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchStats(), refetchWithdrawals()]);
    setIsRefreshing(false);
  };

  const handlePay = async (id: number) => {
    setActioningId(id);
    setActioningType('approve');
    try {
      console.log(`[INTEGRATION:ADMIN_PAY] Processing payout for withdrawal ${id}`);
      await updateWithdrawalMutation.mutateAsync({
        id,
        status: 'completed',
        reference: `PAY-${Date.now()}`
      });
    } catch (error) {
      console.error('[INTEGRATION:ADMIN_PAY] Failed to process payout:', error);
    }
  };

  const handleReject = async (id: number) => {
    setActioningId(id);
    setActioningType('reject');
    try {
      console.log(`[INTEGRATION:ADMIN_REJECT] Rejecting withdrawal ${id}`);
      await updateWithdrawalMutation.mutateAsync({ id, status: 'rejected' });
    } catch (error) {
      console.error('[INTEGRATION:ADMIN_REJECT] Failed to reject withdrawal:', error);
    }
  };

  /**
   * Downloads a CSV export from the admin API by creating a temporary anchor tag.
   */
  const handleExport = async (type: 'users' | 'commissions') => {
    try {
      console.log(`[ADMIN:EXPORT] Requesting ${type} CSV export`);
      const response = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log(`[ADMIN:EXPORT] ${type} CSV downloaded successfully`);
    } catch (error) {
      console.error(`[ADMIN:EXPORT] Failed to download ${type} CSV:`, error);
    }
  };

  if (statsLoading || withdrawalsLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <Loader2 size={48} strokeWidth={1.5} className="text-lustre-purple animate-spin" />
      </div>
    );
  }

  const userStats = stats?.users || { total: 0, premium: 0, free: 0, premiumPercentage: 0 };

  return (
    <div className="min-h-screen bg-void text-lustre-text">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-void/90 backdrop-blur-md border-b border-border-subtle flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <span className="font-garamond italic text-2xl text-lustre-purple">Lustre</span>
          <Badge variant="destructive" className="bg-lustre-rose-dim/30 text-lustre-rose rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-0">
             Admin Panel
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing || statsFetching} className="text-lustre-muted hover:text-lustre-text">
             <RefreshCw size={18} strokeWidth={1.5} className={cn(isRefreshing || statsFetching ? 'animate-spin' : '')} />
          </Button>
          <Button variant="ghost" className="text-lustre-muted hover:text-lustre-rose font-sans text-xs font-bold uppercase tracking-widest gap-2" onClick={logout}>
             <LogOut size={16} strokeWidth={1.5} />
             Exit
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32 animate-fade-up">
        
        {/* Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="p-8 md:p-10 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-lustre-faint font-bold">Total Users</p>
              <Users size={20} strokeWidth={1.5} className="text-lustre-purple" />
            </div>
            <p className="font-sans text-4xl font-bold text-lustre-text mb-4">
              {userStats.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 text-[var(--success)] font-sans text-[10px] font-bold uppercase tracking-widest">
              <TrendingUp size={12} strokeWidth={1.5} />
              <span>Growth trending positive</span>
            </div>
          </Card>

          <Card className="p-8 md:p-10 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-lustre-faint font-bold">Premium Members</p>
              <Award size={20} strokeWidth={1.5} className="text-lustre-gold" />
            </div>
            <p className="font-sans text-4xl font-bold text-lustre-text mb-4">
              {userStats.premium.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 text-lustre-gold font-sans text-[10px] font-bold uppercase tracking-widest">
              <Crown size={12}  strokeWidth={1.5} />
              <span>{userStats.premiumPercentage}% conversion rate</span>
            </div>
          </Card>

          <Card className="p-8 md:p-10 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-lustre-faint font-bold">Free Members</p>
              <User size={20} strokeWidth={1.5} className="text-lustre-muted" />
            </div>
            <p className="font-sans text-4xl font-bold text-lustre-text mb-4">
              {userStats.free.toLocaleString()}
            </p>
            <div className="font-sans text-[10px] text-lustre-faint font-bold uppercase tracking-widest">
              Active browsing sessions
            </div>
          </Card>
        </div>

        {/* Financial Overview Header */}
        <div className="flex items-center gap-3 mb-8 text-lustre-purple">
           <Wallet size={20} strokeWidth={1.5} />
           <h2 className="font-garamond text-2xl text-lustre-text">Financial Overview</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <Card className="p-8 md:p-10 border-l-4 border-l-lustre-purple flex items-center justify-between">
            <div className="space-y-3">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-lustre-faint font-bold">Pending Withdrawal Requests</p>
              <p className="font-garamond text-4xl font-bold text-lustre-text">
                {withdrawals?.length || 0}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-elevated border border-border-subtle">
              <Wallet size={24} strokeWidth={1.5} className="text-lustre-purple" />
            </div>
          </Card>
          
          <Card className="p-8 md:p-10 border-l-4 border-l-lustre-rose flex items-center justify-between">
            <div className="space-y-3">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-lustre-faint font-bold">Total Pending Value (KES)</p>
              <p className="font-garamond text-4xl font-bold text-lustre-text">
                {(withdrawals?.reduce((acc: number, curr: Withdrawal) => acc + curr.amount, 0) || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-lustre-rose/10 border border-lustre-rose/20">
              <Users size={24} strokeWidth={1.5} className="text-lustre-rose" />
            </div>
          </Card>
        </div>

        {/* Export Actions */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Button
            id="export-users-csv"
            variant="outline"
            size="sm"
            onClick={() => handleExport('users')}
            className="h-10 px-5 rounded-xl bg-card border-border-subtle text-xs font-sans font-bold uppercase tracking-widest text-lustre-muted hover:text-lustre-text gap-2"
          >
            <Download size={14} strokeWidth={1.5} />
            Export Users CSV
          </Button>
          <Button
            id="export-commissions-csv"
            variant="outline"
            size="sm"
            onClick={() => handleExport('commissions')}
            className="h-10 px-5 rounded-xl bg-card border-border-subtle text-xs font-sans font-bold uppercase tracking-widest text-lustre-muted hover:text-lustre-text gap-2"
          >
            <Download size={14} strokeWidth={1.5} />
            Export Commissions CSV
          </Button>
        </div>

        {/* Affiliate Payouts Table */}
        <Card className="overflow-hidden shadow-[var(--shadow-card)] border-transparent">
          <div className="p-8 border-b border-border-subtle flex flex-row items-center justify-between bg-card-alt/35">
             <div className="flex items-center gap-3">
               <TableProperties size={18} strokeWidth={1.5} className="text-lustre-purple" />
               <h3 className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-lustre-text">Actionable Withdrawals</h3>
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <ScrollArea className="w-full">
              <table className="w-full text-left">
                <thead>
                   <tr className="text-lustre-faint font-sans text-[10px] uppercase tracking-[0.2em] border-b border-border-subtle">
                      <th className="px-8 py-6 font-bold">Affiliate ID</th>
                      <th className="px-8 py-6 font-bold">Amount</th>
                      <th className="px-8 py-6 font-bold">Provider</th>
                      <th className="px-8 py-6 font-bold text-right">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                   {withdrawals && withdrawals.length > 0 ? (
                      withdrawals.map((withdrawal: Withdrawal) => (
                        <tr key={withdrawal.id} className="hover:bg-hover/10 transition-colors group">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-elevated border border-border-subtle flex items-center justify-center text-lustre-muted font-garamond italic font-bold">
                                  {withdrawal.userId}
                                </div>
                                <span className="font-sans text-sm font-semibold text-lustre-text">User #{withdrawal.userId}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className="font-sans text-sm font-bold text-lustre-text">
                                KES {withdrawal.amount.toLocaleString()}
                              </span>
                           </td>
                           <td className="px-8 py-6">
                              <Badge variant="outline" className="font-sans text-[10px] font-bold uppercase tracking-widest text-lustre-muted">
                                {withdrawal.provider}
                              </Badge>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleReject(withdrawal.id)}
                                  disabled={updateWithdrawalMutation.isPending}
                                  className="rounded-lg gap-2"
                                >
                                  {actioningId === withdrawal.id && actioningType === 'reject' && updateWithdrawalMutation.isPending ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <CircleX size={14} />
                                  )}
                                  Reject
                                </Button>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handlePay(withdrawal.id)}
                                  disabled={updateWithdrawalMutation.isPending}
                                  className="rounded-lg gap-2"
                                >
                                  {actioningId === withdrawal.id && actioningType === 'approve' && updateWithdrawalMutation.isPending ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 size={14} />
                                  )}
                                  Approve & Pay
                                </Button>
                              </div>
                           </td>
                        </tr>
                      ))
                   ) : (
                      <tr>
                         <td colSpan={4} className="px-8 py-24 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-20">
                               <TableProperties size={48} strokeWidth={1.5} />
                               <p className="font-sans text-xs font-bold uppercase tracking-widest">No pending withdrawals</p>
                            </div>
                         </td>
                      </tr>
                   )}
                </tbody>
              </table>
            </ScrollArea>
          </div>
          <div className="p-6 bg-card-alt/25 text-center border-t border-border-subtle">
             <button className="text-lustre-purple font-sans text-[10px] font-bold hover:underline tracking-widest uppercase">Manage All Withdrawals</button>
          </div>
        </Card>

      </main>
    </div>
  );
}
