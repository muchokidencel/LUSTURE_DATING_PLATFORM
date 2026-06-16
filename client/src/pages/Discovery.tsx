import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Sparkles, Loader2, Crown, Lock } from 'lucide-react';
import { isAxiosError } from 'axios';
import DiscoveryTabs from '../components/layout/DiscoveryTabs';

interface User {
  id: number;
  displayName: string;
  age: number | null;
  city: string;
  photos: { url: string; public_id: string }[];
  bio: string;
  isOnline: boolean;
  isPremium: boolean;
  gender?: string;
}

function UserCard({ user }: { user: User }) {
  const photo = user.photos?.[0]?.url;
  const isPremium = user.isPremium;

  return (
    <div className="profile-card relative aspect-[2/3] rounded-xl overflow-hidden group cursor-pointer">
      {/* Photo background */}
      <div 
        className="absolute inset-0 z-0 bg-elevated transition-transform duration-700 group-hover:scale-105"
        style={{ 
          backgroundImage: photo ? `url(${photo})` : 'none', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }} 
      />

      {/* Gradient overlay to protect text readability on photos */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-10" />

      {/* No photo placeholder */}
      {!photo && (
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <Sparkles size={32} strokeWidth={1.5} className="text-lustre-purple/20" />
        </div>
      )}

      {/* Card content bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-headline text-lg font-semibold text-white">
            {user.displayName}{user.age ? `, ${user.age}` : ''}
          </span>
          {isPremium && (
            <Crown size={14} strokeWidth={1.5} className="text-lustre-gold fill-lustre-gold/20" />
          )}
        </div>
        <div className="flex items-center gap-1 text-neutral-300">
          <MapPin size={12} strokeWidth={1.5} className="text-lustre-purple shrink-0" />
          <span className="font-headline text-[10px] uppercase tracking-widest">
            {user.city || 'Nearby'}
          </span>
        </div>
        {user.bio && (
          <p className="font-sans text-xs text-neutral-400 line-clamp-2 mt-1">
            {user.bio}
          </p>
        )}
        <Link 
          to={`/profile/${user.id}`} 
          className="mt-2 w-full py-2 border border-lustre-purple/40 text-lustre-purple rounded-lg font-headline text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-lustre-purple/10 transition-all text-center block active:scale-95"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

export default function Discovery() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [genderFilter, setGenderFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setPageHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isGated, setIsGated] = useState(false);

  const filteredUsers = genderFilter
    ? users.filter(u => u.gender?.toLowerCase() === genderFilter.toLowerCase())
    : users;

  const fetchUsers = async (pageNum: number) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      console.log(`[INTEGRATION:DISCOVERY] Fetching users page ${pageNum}`);
      const { data } = await api.get(`/discovery/users?page=${pageNum}&limit=12`);
      
      if (pageNum === 1) {
        setUsers(data.data);
      } else {
        setUsers(prev => [...prev, ...data.data]);
      }
      setPageHasMore(data.pagination.page < data.pagination.totalPages);
    } catch (error) {
      console.error('[INTEGRATION:DISCOVERY] Failed to fetch users:', error);
      if (isAxiosError(error) && error.response?.status === 403) {
        setIsGated(true);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await api.put('/profile', { latitude, longitude });
          } catch (err) {
            console.error("Silent location sync failed:", err);
          } finally {
            fetchUsers(1);
          }
        },
        (err) => {
          console.log("Silent location access declined or failed", err);
          fetchUsers(1);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    } else {
      fetchUsers(1);
    }
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage);
  };

  if (isGated) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-up">
          <div className="w-24 h-24 bg-lustre-gold/10 rounded-full flex items-center justify-center mx-auto border border-lustre-gold/20">
            <Lock size={40} strokeWidth={1.5} className="text-lustre-gold" />
          </div>
          <div className="space-y-4">
            <h1 className="font-garamond text-4xl text-white italic">Discovery is Reserved</h1>
            <p className="font-sans text-lustre-muted leading-relaxed">
              Unlock the community grid and connect with high-intent individuals. Upgrade to Premium to explore beyond your recommendations.
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
            Return to Safety
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void px-6 py-24 pb-32">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="font-headline text-4xl text-lustre-text font-bold">Discover</h1>
            <p className="font-sans text-base text-lustre-muted">Find your match within our curated community.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
             <DiscoveryTabs />
             <select
               value={genderFilter}
               onChange={(e) => setGenderFilter(e.target.value)}
               className="bg-card border border-border-subtle text-lustre-text rounded-xl px-4 py-2 font-headline text-[10px] uppercase tracking-widest outline-none focus:border-lustre-purple/50 cursor-pointer"
             >
               <option value="">All Genders</option>
               <option value="Male">Male</option>
               <option value="Female">Female</option>
             </select>
             <div className="flex items-center gap-3 px-4 py-2 bg-card rounded-full border border-border-subtle">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-headline text-[10px] uppercase tracking-[0.2em] text-lustre-text font-bold">
                  {users.length > 0 ? `${users.length * 3}+ Online Now` : 'Connecting...'}
                </span>
             </div>
          </div>
        </div>


        {loading && users.length === 0 ? (
          <div id="discovery-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="aspect-[2/3] rounded-xl bg-card shadow-sm" />
            ))}
          </div>
        ) : (
          <div id="discovery-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {filteredUsers.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="mt-16 flex justify-center">
            <Button 
              variant="outline" 
              onClick={loadMore}
              disabled={loadingMore}
              className="px-12 h-14 rounded-full border-border-strong text-lustre-text font-sans font-bold uppercase tracking-widest text-[10px]"
            >
              {loadingMore ? (
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin mr-2" />
              ) : null}
              Load More
            </Button>
          </div>
        )}

        {!hasMore && users.length > 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-6 border border-border-subtle">
              <Sparkles size={24} strokeWidth={1.5} className="text-lustre-purple/40" />
            </div>
            <p className="font-sans text-lustre-muted italic text-sm">You've reached the end of our current discoveries.</p>
          </div>
        )}
      </div>
    </div>
  );
}
