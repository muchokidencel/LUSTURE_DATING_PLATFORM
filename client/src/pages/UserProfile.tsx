import { useParams, useNavigate } from 'react-router-dom';
import { usePublicProfile, useLike, useProfile } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Heart, HeartHandshake, ArrowLeft, Loader2, Share2, MoreHorizontal, Sparkles, Crown, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = usePublicProfile(id!);
  const { data: loggedInProfile, isLoading: loggedInLoading } = useProfile();
  const likeMutation = useLike();
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [likedSent, setLikedSent] = useState(false);

  useEffect(() => {
    if (user?.isLikedByMe) {
      setLikedSent(true);
    }
  }, [user]);

  if (isLoading || loggedInLoading) return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <Loader2 size={48} strokeWidth={1.5} className="text-lustre-purple animate-spin" />
    </div>
  );

  const isPremium = loggedInProfile?.premiumTier !== 'free';

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-void px-6 py-24 flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-up">
          <div className="w-24 h-24 bg-gradient-gold/10 rounded-full flex items-center justify-center mx-auto border border-lustre-gold/20 shadow-lg">
            <Lock size={40} strokeWidth={1.5} className="text-lustre-gold" />
          </div>
          <div className="space-y-4">
            <h1 className="font-garamond text-4xl text-white italic">Profile is Locked</h1>
            <p className="font-sans text-lustre-muted leading-relaxed">
              Unlock the community grid and connect with high-intent individuals. Upgrade to Premium to explore profiles.
            </p>
          </div>
          <Button 
            className="w-full h-14 rounded-xl bg-gradient-gold text-black font-sans font-bold uppercase tracking-widest text-[10px]"
            onClick={() => navigate('/premium')}
          >
            Upgrade to Premium
          </Button>
          <Button 
            variant="link" 
            className="text-lustre-faint font-sans text-[10px] uppercase tracking-widest"
            onClick={() => navigate('/discovery')}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (isError || !user) return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center p-6 text-center">
      <h2 className="font-garamond text-5xl text-lustre-text mb-6">Profile not found</h2>
      <Button onClick={() => navigate('/discovery')}>Return to Discovery</Button>
    </div>
  );

  const handleLike = async () => {
    if (likedSent) return;
    try {
      console.log(`[INTEGRATION:LIKE] Sending like to user ${user.id}`);
      const result = await likeMutation.mutateAsync({ toUserId: user.id });
      setLikedSent(true);
      if (result.match) {
        setShowMatchModal(true);
      }
    } catch (error) {
      console.error('[INTEGRATION:LIKE] Failed to like:', error);
    }
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const mainPhoto = user.photos?.[0]?.url;
  const interests = user.interests && user.interests.length > 0 
    ? user.interests 
    : ['Art Curation', 'Fine Dining', 'Global Travel', 'Classical Music', 'Philosophy', 'Architecture'];

  return (
    <div className="min-h-screen bg-void pb-32">
      {/* Hero Photo Section */}
      <section className="relative w-full h-[70vh] md:h-[80vh]">
        <div 
          className="w-full h-full bg-elevated"
          style={{ 
            backgroundImage: mainPhoto ? `url(${mainPhoto})` : 'none', 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-85 z-10" />
        
        {/* Floating Profile Info Overlay */}
        <div className="absolute bottom-8 left-6 right-6 z-20 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-headline text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Online Now</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-white">
              {user.displayName}
            </h1>
            {user.premiumTier === 'gold' && (
              <div className="flex items-center gap-1.5">
                <Crown size={22} strokeWidth={1.5} className="text-lustre-gold fill-lustre-gold/10 shrink-0" />
                <CheckCircle2 size={20} strokeWidth={1.5} className="text-lustre-purple shrink-0" />
              </div>
            )}
          </div>
          <p className="font-sans text-sm text-lustre-muted mt-2">{user.city || 'Nearby'}</p>
        </div>
      </section>

      {/* Identity & Stats Bar */}
      <section className="px-6 py-8 border-b border-border-subtle max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex gap-6 md:gap-8">
            <div className="flex flex-col">
              <span className="font-headline text-[10px] uppercase tracking-widest text-lustre-faint font-bold mb-1">Age</span>
              <span className="font-headline text-lg font-bold text-lustre-text">{user.age || '—'}</span>
            </div>
            <div className="w-px h-10 bg-border-subtle" />
            <div className="flex flex-col">
              <span className="font-headline text-[10px] uppercase tracking-widest text-lustre-faint font-bold mb-1">Gender</span>
              <span className="font-headline text-lg font-bold text-lustre-text capitalize">{user.gender || '—'}</span>
            </div>
            <div className="w-px h-10 bg-border-subtle" />
            <div className="flex flex-col">
              <span className="font-headline text-[10px] uppercase tracking-widest text-lustre-faint font-bold mb-1">City</span>
              <span className="font-headline text-lg font-bold text-lustre-text">{user.city || '—'}</span>
            </div>
          </div>
          <div className="hidden md:flex gap-4">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-border-subtle hover:bg-hover">
              <Share2 size={16} strokeWidth={1.5} className="text-lustre-text" />
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-border-subtle hover:bg-hover">
              <MoreHorizontal size={16} strokeWidth={1.5} className="text-lustre-text" />
            </Button>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* About Card */}
        <div className="bg-card rounded-xl p-8 md:p-10 shadow-[var(--shadow-card)]">
          <h3 className="font-headline text-lg font-bold text-lustre-purple mb-4">About</h3>
          <p className="font-sans text-base text-lustre-muted leading-relaxed">
            {user.bio || "This user hasn't shared their story yet."}
          </p>
        </div>

        {/* Interests Bento */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {interests.map((interest: string, i: number) => (
            <div key={i} className="bg-card rounded-xl p-6 md:p-8 flex flex-col items-center justify-center text-center gap-3 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all group">
              <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center text-lustre-purple group-hover:bg-lustre-purple/10 transition-colors border border-border-subtle">
                <Sparkles size={18} strokeWidth={1.5} />
              </div>
              <span className="font-headline text-xs font-semibold text-lustre-muted group-hover:text-lustre-text transition-colors">
                {interest}
              </span>
            </div>
          ))}
        </div>

        {/* Ideal Sunday Quote Box */}
        <div className="bg-card border-l-4 border-l-lustre-purple rounded-xl p-8 md:p-10 shadow-[var(--shadow-card)]">
          <h3 className="font-headline text-[10px] uppercase tracking-[0.2em] text-lustre-faint font-bold mb-2">Ideal Sunday</h3>
          <p className="font-garamond italic text-2xl md:text-3xl text-lustre-text leading-tight">
            "{user.idealSunday || "A slow morning with espresso and the weekend papers, followed by an afternoon at a hidden gallery and a home-cooked dinner with a vintage Cabernet."}"
          </p>
        </div>
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-20 md:bottom-0 left-0 w-full z-50 md:z-[40] px-6 py-4 md:py-6 bg-card/95 backdrop-blur-xl border-t border-border-subtle flex justify-center items-center gap-4 shadow-md">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)} 
          className="flex-1 max-w-[160px] h-14 rounded-full border-border-subtle text-lustre-text font-headline text-[10px] uppercase tracking-widest font-bold hover:bg-hover transition-all active:scale-95 bg-transparent"
        >
          <ArrowLeft size={16} strokeWidth={1.5} className="mr-2" />
          Back
        </Button>
        <Button
          onClick={handleLike}
          disabled={likedSent || likeMutation.isPending}
          className={cn(
            "flex-1 max-w-[280px] h-14 rounded-full bg-gradient-brand text-white font-headline text-[10px] uppercase tracking-widest font-bold shadow-lg transition-all active:scale-95",
            likedSent && "opacity-50 cursor-default"
          )}
        >
          {likeMutation.isPending ? (
            <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
          ) : likedSent ? (
            <>
              <HeartHandshake size={16} strokeWidth={1.5} className="mr-2 animate-pulse" />
              <span>Liked</span>
            </>
          ) : (
            <>
              <Heart size={16} strokeWidth={1.5} className="mr-2" />
              <span>Like</span>
            </>
          )}
        </Button>
      </div>

      {/* Match Modal */}
      <Dialog open={showMatchModal} onOpenChange={setShowMatchModal}>
        <DialogContent className="max-w-sm mx-auto p-10 bg-card-alt border-outline-variant/40">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-brand blur-2xl rounded-full opacity-35" />
              <Avatar className="w-28 h-28 border-2 border-lustre-purple/30 shadow-2xl relative z-10">
                <AvatarImage src={mainPhoto} className="object-cover" />
                <AvatarFallback className="text-4xl bg-gradient-brand text-white italic">
                  {getInitial(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-gradient-brand p-2.5 rounded-full shadow-lg z-20">
                <Heart size={20} fill="white" className="text-white" strokeWidth={1.5} />
              </div>
            </div>

            <div className="space-y-3">
              <DialogTitle className="text-center font-headline font-bold text-2xl">It's a Match!</DialogTitle>
              <DialogDescription className="text-center text-base text-lustre-muted">
                You and {user.displayName} have shared a mutual interest.
              </DialogDescription>
            </div>

            <div className="w-full space-y-4 pt-2">
              <Button className="w-full h-14 rounded-full bg-gradient-brand font-headline text-[10px] uppercase tracking-widest font-bold hover:scale-105 active:scale-95 transition-transform" onClick={() => navigate('/matches')}>
                View Connections
              </Button>
              <Button variant="ghost" className="w-full h-12 rounded-full text-lustre-muted font-headline text-[10px] uppercase tracking-widest font-bold" onClick={() => setShowMatchModal(false)}>
                Continue Exploring
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
