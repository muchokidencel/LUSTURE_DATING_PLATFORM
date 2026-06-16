import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile, useStats } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Heart, LogOut, Zap, Eye, Crown, Share2, MessageCircle, Camera } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Profile() {
  const { logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: statsData, isLoading: statsLoading } = useStats();

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  if (profileLoading || statsLoading) return (
    <div className="min-h-screen bg-void px-6 py-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );

  const stats = [
    { label: 'Likes', count: statsData?.likes || 0, icon: Heart, color: 'text-lustre-rose' },
    { label: 'Matches', count: statsData?.matches || 0, icon: Zap, color: 'text-lustre-purple' },
    { label: 'Views', count: statsData?.views || 0, icon: Eye, color: 'text-lustre-gold' },
  ];

  const calculateCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.fullName,
      profile.bio,
      profile.gender,
      profile.location,
      profile.whatsapp,
      profile.instagram
    ];
    const filled = fields.filter(f => !!f).length;
    const photoCount = profile.photos?.length || 0;
    const photoScore = Math.min(photoCount, 3) / 3 * 40; // Max 40% for photos
    const fieldScore = (filled / fields.length) * 60; // Max 60% for fields
    return Math.round(photoScore + fieldScore);
  };

  const completionPct = calculateCompletion();
  const isPremium = profile?.premiumTier !== 'free';
  const interests = profile?.preferences?.interestedInGenders?.length > 0 ? profile.preferences.interestedInGenders : ['Art', 'Travel', 'Fine Dining'];

  return (
    <div className="min-h-screen bg-void pb-32">
      {/* Top Banner */}
      <div className="h-40 bg-gradient-to-b from-lustre-purple/15 via-lustre-rose/5 to-void border-b border-border/30" />
      
      <main className="max-w-4xl mx-auto px-6 -mt-20 relative z-10 animate-fade-up">
        {/* Profile Identity Section */}
        <div className="flex flex-col items-center text-center space-y-6 mb-12">
          <div className="relative">
            <Avatar className={cn(
              "w-36 h-36 border-4 border-void shadow-2xl transition-all",
              isPremium ? "ring-2 ring-lustre-gold" : "ring-1 ring-border"
            )}>
              <AvatarImage src={profile?.photos?.[0]?.url} className="object-cover" />
              <AvatarFallback className="text-5xl font-garamond italic">
                {getInitial(profile?.fullName || '')}
              </AvatarFallback>
            </Avatar>
            {isPremium && (
              <div className="absolute -bottom-1 -right-1 bg-gradient-gold p-1.5 rounded-full shadow-lg border-2 border-void">
                <Crown size={16} className="text-black"  strokeWidth={1.5} />
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <h1 className="font-garamond text-4xl md:text-5xl font-medium tracking-tight text-gradient-brand">
              {profile?.fullName || 'Anonymous User'}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {isPremium && (
                <Badge variant="premium" className="px-4 py-1.5 rounded-full">
                  <Crown size={12} className="mr-2"  strokeWidth={1.5} />
                  {profile?.premiumTier === 'gold' ? 'Gold Member' : 'Elite Member'}
                </Badge>
              )}
              {profile?.ghostMode && (
                <Badge variant="outline" className="px-4 py-1.5 rounded-full border-lustre-purple/30 text-lustre-purple bg-lustre-purple/5">
                  <Eye size={12} className="mr-2" strokeWidth={1.5} />
                  Ghost Mode Active
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 mb-12">
          {stats.map((stat, i) => (
            <Card key={i} className="bg-card border-border p-6 text-center space-y-2 hover:border-lustre-purple/30 transition-all cursor-default">
              <span className={cn("font-garamond text-3xl font-semibold", stat.color)}>
                {stat.count}
              </span>
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-lustre-faint font-bold">
                {stat.label}
              </p>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-12">
          <Button className="flex-1 bg-gradient-brand text-white rounded-lg h-12 font-sans font-semibold" asChild>
            <Link to="/profile/edit" className="text-white">Edit Profile</Link>
          </Button>
          <Button variant="outline" size="icon" className="w-12 h-12 rounded-lg border-border-strong bg-elevated hover:bg-hover">
            <MessageCircle size={20} strokeWidth={1.5} className="text-lustre-muted" />
          </Button>
          <Button variant="outline" size="icon" className="w-12 h-12 rounded-lg border-border-strong bg-elevated hover:bg-hover">
            <Share2 size={20} strokeWidth={1.5} className="text-lustre-muted" />
          </Button>
        </div>

        {/* Profile Completion */}
        <Card className="p-8 mb-12 border-border bg-card">
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <h3 className="font-sans text-[10px] uppercase tracking-[0.2em] text-lustre-faint font-bold">Profile Completion</h3>
              <span className="font-sans text-sm text-lustre-text font-bold">
                {completionPct}%
              </span>
            </div>
            
            <div className="h-1.5 w-full bg-elevated rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-brand transition-all duration-1000 ease-out"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            
            <p className="font-sans text-xs text-lustre-muted italic text-center">
              Complete your profile to unlock the "Verified" badge and increase visibility.
            </p>
          </div>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="font-sans text-xs font-semibold text-lustre-purple uppercase tracking-[0.2em]">About</h3>
            <Card className="p-6 border-border bg-card min-h-[200px] flex flex-col justify-between">
              <p className="font-sans text-sm text-lustre-muted leading-relaxed">
                {profile?.bio || "Describe your lifestyle and what you're looking for..."}
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                {interests.map((tag: string, i: number) => (
                  <span key={i} className="bg-elevated rounded-lg px-3 py-1 text-xs text-lustre-muted border border-border capitalize">
                    {tag.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Gallery Preview */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-sans text-xs font-semibold text-lustre-purple uppercase tracking-[0.2em]">Gallery</h3>
              <span className="text-xs text-lustre-faint font-sans">
                {profile?.photos?.length || 0} / 6 Photos
              </span>
            </div>
            <Card className="p-4 border-border bg-card">
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const photo = profile?.photos?.[i];
                  return (
                    <div key={i} className="aspect-square bg-elevated rounded-lg overflow-hidden relative">
                      {photo ? (
                        <img src={photo.url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Camera size={16} className="text-lustre-muted/20" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>

        {/* Logout Section */}
        <div className="flex justify-center pt-8 border-t border-border/30">
          <Button 
            variant="ghost" 
            className="text-lustre-faint hover:text-lustre-rose transition-all font-sans text-[10px] uppercase tracking-[0.2em]" 
            onClick={logout}
          >
            <LogOut size={14} strokeWidth={1.5} className="mr-2" />
            Terminate Session
          </Button>
        </div>
      </main>
    </div>
  );
}
