import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent } from "../components/ui/dialog";
import { useMatches } from '../hooks/useQueries';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Card } from '../components/ui/card';
import { Heart, MapPin, MessageCircle, ChevronRight, Search, Crown } from 'lucide-react';
import { cn } from '../lib/utils';

interface Match {
  id: number;
  isPremium: boolean; // Viewer's premium status
  otherUser: {
    id: number;
    displayName: string;
    bio: string;
    city: string;
    whatsapp: string | null;
    instagram: string | null;
    photos: { url: string; public_id: string }[];
    premiumTier: string;
  };
}

export default function Matches() {
  const { data: matchesData, isLoading: loading } = useMatches();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const navigate = useNavigate();

  const matches = matchesData || [];

  const openWhatsApp = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const openInstagram = (username: string) => {
    const cleanUsername = username.replace('@', '');
    window.open(`https://instagram.com/${cleanUsername}`, '_blank');
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="min-h-screen bg-void px-6 py-24 pb-32">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-12 animate-fade-up flex items-center gap-3">
          <Heart size={28} strokeWidth={1.5} className={cn("text-lustre-purple", matches.length > 0 && "fill-lustre-purple/15")} />
          <h1 className="font-headline text-4xl text-lustre-text font-bold">Your Matches</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-24 animate-pulse rounded-xl bg-card shadow-sm border-transparent" />
            ))}
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-6 animate-fade-up max-w-3xl">
            {matches.map((match: Match) => {
              const isOtherPremium = match.otherUser.premiumTier !== 'free';
              return (
                <div key={match.id} className="bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 p-6 md:p-8 rounded-xl flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="relative">
                      <Avatar className={cn(
                        "w-16 h-16 md:w-20 md:h-20 transition-all",
                        isOtherPremium ? "ring-2 ring-lustre-gold/40" : "ring-1 ring-border-subtle group-hover:ring-lustre-purple/50"
                      )}>
                        <AvatarImage src={match.otherUser.photos?.[0]?.url} className="object-cover animate-fade-in" />
                        <AvatarFallback className="text-2xl font-garamond italic bg-elevated">
                          {getInitial(match.otherUser.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      {isOtherPremium && (
                        <div className="absolute -top-1 -right-1 bg-lustre-gold text-black p-1 rounded-full flex items-center justify-center border border-void">
                          <Crown size={10} className="fill-black" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <h3 className="font-headline text-base font-semibold text-lustre-text">{match.otherUser.displayName}</h3>
                         {isOtherPremium && (
                            <span className="px-2 py-0.5 bg-lustre-rose-dim/40 text-lustre-rose text-[9px] uppercase font-bold tracking-widest rounded">Premium</span>
                         )}
                      </div>
                      <div className="flex items-center gap-1.5 text-lustre-muted">
                         <MapPin size={12} strokeWidth={1.5} className="text-lustre-purple shrink-0" />
                         <span className="font-headline text-[10px] uppercase tracking-widest">{match.otherUser.city || 'Discovery'}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                     variant="outline" 
                     className="border border-border-subtle text-lustre-purple px-5 h-10 md:px-8 md:h-12 rounded-full font-headline text-[10px] uppercase tracking-widest font-bold hover:bg-lustre-purple/10 transition-all active:scale-95 bg-transparent"
                     onClick={() => setSelectedMatch(match)}
                  >
                    Connect
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
            <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-8 border border-outline-variant/35 shadow-md">
              <Search size={32} strokeWidth={1.5} className="text-lustre-purple/20" />
            </div>
            <div className="space-y-2 mb-10">
              <h2 className="font-headline text-2xl text-white font-bold">No matches yet</h2>
              <p className="font-sans text-sm text-lustre-muted max-w-xs mx-auto">Keep exploring beautiful profiles in Discovery to find your perfect connection.</p>
            </div>
            <Button className="px-10 h-14 bg-gradient-brand text-white rounded-full font-headline text-[10px] uppercase tracking-widest font-bold shadow-lg hover:scale-105 active:scale-95 transition-all" onClick={() => navigate('/discovery')}>
               Explore Discovery
            </Button>
          </div>
        )}
      </div>

      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="max-w-md mx-auto p-8 bg-card/95 backdrop-blur-xl border border-border-subtle rounded-3xl flex flex-col items-center">
          {selectedMatch && (
            <div className="flex flex-col items-center w-full relative">
              <div className="w-20 h-20 bg-lustre-purple/15 rounded-full flex items-center justify-center mb-6 border border-lustre-purple/25">
                <span className="font-headline text-lustre-purple text-2xl">🔗</span>
              </div>

              <div className="text-center mb-8">
                <h2 className="font-headline text-xl text-lustre-text mb-2 uppercase tracking-widest font-bold">
                  Connect With {selectedMatch.otherUser.displayName.split(' ')[0]}
                </h2>
                <p className="font-sans text-xs text-lustre-muted leading-relaxed max-w-[280px] mx-auto">
                  Only verified connections can see each other's direct social links.
                </p>
              </div>

              <div className="w-full space-y-4">
                {selectedMatch.otherUser.whatsapp && (
                  <button 
                    className="w-full flex items-center justify-between p-4 bg-base rounded-2xl border border-border-subtle hover:bg-hover transition-colors cursor-pointer group"
                    onClick={() => openWhatsApp(selectedMatch.otherUser.whatsapp!)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#25D366]/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path></svg>
                      </div>
                      <div className="text-left">
                        <p className="font-headline text-[8px] uppercase tracking-[0.2em] text-lustre-faint font-bold">WhatsApp Message</p>
                        <p className="font-sans text-xs text-lustre-text mt-0.5">{selectedMatch.otherUser.whatsapp}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} strokeWidth={1.5} className="text-lustre-purple opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                  </button>
                )}

                {selectedMatch.otherUser.instagram && (
                  <button 
                    className="w-full flex items-center justify-between p-4 bg-base rounded-2xl border border-border-subtle hover:bg-hover transition-colors cursor-pointer group"
                    onClick={() => openInstagram(selectedMatch.otherUser.instagram!)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#E1306C]/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 fill-[#E1306C]" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.2 4.353 2.612 6.766 6.965 6.966 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c4.351-.2 6.765-2.612 6.966-6.966.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.2-4.353-2.612-6.766-6.966-6.966C15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"></path></svg>
                      </div>
                      <div className="text-left">
                        <p className="font-headline text-[8px] uppercase tracking-[0.2em] text-lustre-faint font-bold">Instagram Profile</p>
                        <p className="font-sans text-xs text-lustre-text mt-0.5">@{selectedMatch.otherUser.instagram.replace('@', '')}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} strokeWidth={1.5} className="text-lustre-purple opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                  </button>
                )}

                {!selectedMatch.otherUser.whatsapp && !selectedMatch.otherUser.instagram && (
                  <div className="text-center py-12 bg-base/30 rounded-2xl border border-dashed border-border-subtle">
                    <MessageCircle size={32} strokeWidth={1.5} className="text-lustre-muted/20 mx-auto mb-4" />
                    <p className="font-sans text-xs text-lustre-muted italic px-6 leading-relaxed">
                      This connection has not provided contact details yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
