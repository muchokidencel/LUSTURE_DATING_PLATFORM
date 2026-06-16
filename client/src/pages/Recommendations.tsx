import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import api from '../lib/api';
import { useRecommendations, useLike } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Heart, Star, MapPin, RefreshCw, Compass, ChevronRight, User, Crown, Lock, Zap } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { isAxiosError } from 'axios';
import { AgeSlider } from '../components/ui/AgeSlider';


export default function Recommendations() {
  const { data: recs, isLoading, isError, error, refetch } = useRecommendations();
  const likeMutation = useLike();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatch, setLastMatch] = useState<any>(null);
  const [isGated, setIsGated] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 50]);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentIndex(0);
  }, [ageRange]);

  useEffect(() => {
    (window as any).setAgeRange = (min: number, max: number) => {
      setAgeRange([min, max]);
    };
  }, []);

  useEffect(() => {
    if (isError && isAxiosError(error)) {
      if (error.response?.status === 403) {
        setIsGated(true);
      }
    }
  }, [isError, error]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await api.put('/profile', { latitude, longitude });
            refetch();
          } catch (err) {
            console.error("Silent location sync failed:", err);
          }
        },
        (err) => console.log("Silent location access declined or failed", err),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    }
  }, []);

  const users = (recs || []).filter((u: any) => {
    if (u.age == null) return true;
    return u.age >= ageRange[0] && u.age <= ageRange[1];
  });
  const currentUser = users[currentIndex];

  const handleAction = async (direction: 'left' | 'right' | 'super') => {
    if (!currentUser) return;

    if (direction === 'right' || direction === 'super') {
      try {
        console.log(`[INTEGRATION:MATCHING] Liking user ${currentUser.id}`);
        const result = await likeMutation.mutateAsync({ toUserId: currentUser.id, type: direction === 'super' ? 'super' : 'standard' });
        if (result.match) {
          setLastMatch(currentUser);
          setShowMatchModal(true);
        }
      } catch (error: any) {
        console.error('[INTEGRATION:MATCHING] Action failed:', error);
        if (isAxiosError(error) && error.response?.data?.message?.includes('limit')) {
          setShowLimitModal(true);
          return; // Stop and show modal, don't increment index yet
        }
      }
    } else if (direction === 'left') {
      try {
        console.log(`[INTEGRATION:MATCHING] Passing user ${currentUser.id}`);
        await api.post('/discovery/pass', { toUserId: currentUser.id });
      } catch (error) {
        console.error('[INTEGRATION:MATCHING] Pass failed:', error);
      }
    }

    setCurrentIndex(prev => prev + 1);
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  if (isGated) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-up">
          <div className="w-24 h-24 bg-lustre-gold/10 rounded-full flex items-center justify-center mx-auto border border-lustre-gold/20">
            <Lock size={40} strokeWidth={1.5} className="text-lustre-gold" />
          </div>
          <div className="space-y-4">
            <h1 className="font-garamond text-4xl text-white italic">Curated Recommendations</h1>
            <p className="font-sans text-lustre-muted leading-relaxed">
              Our proprietary scoring engine is reserved for Elite members. Upgrade to see your most compatible connections.
            </p>
          </div>
          <Button 
            className="w-full h-14 rounded-xl bg-gradient-gold text-black font-sans font-bold uppercase tracking-widest text-[10px]"
            onClick={() => navigate('/premium')}
          >
            Upgrade to Elite
          </Button>
          <Button 
            variant="link" 
            className="text-lustre-faint font-sans text-[10px] uppercase tracking-widest"
            onClick={() => navigate('/')}
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) return (
    <div className="min-h-screen bg-void flex items-center justify-center">
       <div className="relative">
          <div className="w-24 h-24 border border-lustre-purple/20 rounded-full animate-ping" />
          <div className="absolute inset-0 flex items-center justify-center">
             <Sparkles size={32} strokeWidth={1.5} className="text-lustre-purple animate-pulse" />
          </div>
       </div>
    </div>
  );

  if (isError || users.length === 0 || currentIndex >= users.length) return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center p-6 text-center animate-fade-up">
      <div className="w-32 h-32 bg-elevated rounded-full flex items-center justify-center relative shadow-2xl border border-border mb-12">
         <Compass size={48} strokeWidth={1.5} className="text-lustre-purple/40" />
      </div>
      <div className="space-y-4 mb-12">
        <h2 className="font-garamond text-5xl text-white leading-none">Seeking New Vistas</h2>
        <p className="font-sans text-lustre-muted max-w-sm mx-auto leading-relaxed">We are curating more exceptional connections for you. Check back soon.</p>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" className="px-10 h-12 rounded-full border-border-strong text-white" onClick={() => navigate('/discovery')}>
           Discovery
        </Button>
        <Button className="px-10 h-12 rounded-full bg-gradient-brand text-white gap-2" onClick={() => { setCurrentIndex(0); refetch(); }}>
           <RefreshCw size={16} strokeWidth={1.5} />
           Refresh
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center px-6 pt-20 pb-32 overflow-hidden">
      {/* Premium Age Range Filter Slider */}
      <div className="w-full max-w-md md:max-w-[380px] bg-card border border-border-subtle rounded-2xl p-6 mb-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <span className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold">Age Filter: {ageRange[0]} - {ageRange[1]} yrs</span>
        </div>
        <AgeSlider 
          value={ageRange} 
          onValueChange={setAgeRange} 
          min={18} 
          max={80} 
        />
      </div>

      <div className="w-full max-w-md md:max-w-[380px] relative z-10 aspect-[3/4.5] md:aspect-[2/3.2]">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentUser.id}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ x: 500, opacity: 0, rotate: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="absolute inset-0 w-full h-full"
          >
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl border border-border group bg-card">
              {currentUser.photos?.[0] ? (
                <img 
                  src={currentUser.photos[0].url} 
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-elevated flex items-center justify-center">
                  <User size={64} strokeWidth={1.5} className="text-lustre-purple/20" />
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              
              {/* Profile Narrative */}
              <div className="absolute bottom-0 left-0 w-full p-8 space-y-4 z-10">
                 <div className="space-y-1">
                    <div className="flex items-center gap-3">
                       <h2 className="font-garamond text-4xl md:text-5xl text-white font-medium">{currentUser.displayName}, {currentUser.age || '—'}</h2>
                       {currentUser.isPremium && (
                         <div className="bg-gradient-gold p-1 rounded-full">
                            <Crown size={12} className="text-black"  strokeWidth={1.5} />
                         </div>
                       )}
                    </div>
                    <div className="flex items-center gap-2">
                       <MapPin size={14} strokeWidth={1.5} className="text-lustre-purple" />
                       <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-lustre-faint">{currentUser.city || 'Nearby'}</span>
                    </div>
                 </div>
                 
                 <p className="font-sans text-sm text-lustre-muted line-clamp-2 leading-relaxed italic">
                   "{currentUser.bio || "Seeking meaningful moments and authentic connections in this curated space."}"
                 </p>

                 <Button 
                   variant="ghost"
                   className="h-auto p-0 font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-lustre-purple hover:text-white transition-colors group mt-2"
                   onClick={() => navigate(`/profile/${currentUser.id}`)}
                 >
                   View Profile
                   <ChevronRight size={14} strokeWidth={1.5} className="ml-1 group-hover:translate-x-1 transition-transform" />
                 </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Aesthetic Action Bar */}
      <div className="fixed bottom-20 md:bottom-auto md:relative md:mt-8 left-0 right-0 md:left-auto md:right-auto flex justify-center items-center gap-8 z-50 md:z-10 animate-fade-up">
        <Button 
          variant="outline"
          size="icon"
          onClick={() => handleAction('left')}
          className="w-16 h-16 rounded-full border-border-strong bg-card/80 backdrop-blur-md text-lustre-muted hover:text-white hover:bg-hover active:scale-90 transition-all shadow-xl"
        >
          <X size={28} strokeWidth={1.5} />
        </Button>
        
        <Button 
          variant="outline"
          size="icon"
          onClick={() => handleAction('super')}
          className="w-14 h-14 rounded-full border-lustre-gold/30 bg-lustre-gold/5 text-lustre-gold active:scale-90 transition-all shadow-glow-gold"
        >
          <Star size={24} strokeWidth={1.5} fill="currentColor" className="opacity-20" />
        </Button>

        <Button 
          size="icon"
          onClick={() => handleAction('right')}
          className="w-16 h-16 rounded-full bg-gradient-brand text-white active:scale-90 transition-all shadow-2xl"
        >
          <Heart size={28} strokeWidth={1.5} className="fill-current" />
        </Button>
      </div>

      {/* Potential Match Modal */}
      <Dialog open={showMatchModal} onOpenChange={setShowMatchModal}>
        <DialogContent className="max-w-sm mx-auto p-10 bg-card-alt">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-brand blur-3xl rounded-full opacity-30 animate-pulse" />
              <Avatar className="w-28 h-28 border-2 border-lustre-purple/30 relative z-10 shadow-2xl">
                <AvatarImage src={lastMatch?.photos?.[0]?.url} className="object-cover" />
                <AvatarFallback className="text-4xl font-garamond italic">
                  {getInitial(lastMatch?.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-gradient-brand p-2 rounded-full shadow-lg z-20">
                <Sparkles size={20} className="text-white"  strokeWidth={1.5} />
              </div>
            </div>

            <div className="space-y-3">
              <DialogTitle className="text-4xl font-garamond">Shared Spark</DialogTitle>
              <DialogDescription className="text-base">
                You and {lastMatch?.displayName} have recognized mutual potential.
              </DialogDescription>
            </div>

            <div className="w-full space-y-4 pt-2">
              <Button className="w-full h-14 rounded-full bg-gradient-brand text-white font-sans font-bold uppercase tracking-widest text-[10px]" onClick={() => navigate('/matches')}>
                View Connections
              </Button>
              <Button variant="ghost" className="w-full h-12 rounded-full text-lustre-muted font-sans font-bold uppercase tracking-widest text-[10px]" onClick={() => setShowMatchModal(false)}>
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Limit Modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="max-w-sm mx-auto p-10 bg-card border-lustre-gold/20">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="w-20 h-20 bg-lustre-gold/10 rounded-full flex items-center justify-center border border-lustre-gold/20">
              <Zap size={32} strokeWidth={1.5} className="text-lustre-gold" />
            </div>

            <div className="space-y-3">
              <DialogTitle className="text-3xl font-garamond text-white">Daily Limit Reached</DialogTitle>
              <DialogDescription className="text-sm text-lustre-muted">
                Free connections are limited to 20 per day. Upgrade to Elite for unlimited curation and extraordinary visibility.
              </DialogDescription>
            </div>

            <div className="w-full space-y-4 pt-2">
              <Button 
                className="w-full h-14 rounded-full bg-gradient-gold text-black font-sans font-bold uppercase tracking-widest text-[10px]" 
                onClick={() => navigate('/premium')}
              >
                Upgrade to Elite
              </Button>
              <Button 
                variant="ghost" 
                className="w-full h-12 rounded-full text-lustre-muted font-sans font-bold uppercase tracking-widest text-[10px]" 
                onClick={() => setShowLimitModal(false)}
              >
                Maybe Tomorrow
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
