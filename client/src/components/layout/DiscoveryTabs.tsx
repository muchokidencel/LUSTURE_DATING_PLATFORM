import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Grid } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function DiscoveryTabs() {
  const location = useLocation();
  const isGrid = location.pathname === '/discovery';
  
  return (
    <div
      id="discovery-tabs-switcher"
      className="flex items-center bg-card-alt p-1 rounded-xl border border-border/50 w-full max-w-[320px] mx-auto md:mx-0 shadow-[var(--shadow-card)]"
    >
      <Link
        to="/discovery"
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-headline text-[10px] uppercase tracking-widest font-bold transition-all duration-300",
          isGrid
            ? "bg-gradient-brand text-[var(--primary-foreground)] shadow-[var(--shadow-card)]"
            : "text-lustre-muted hover:text-lustre-text"
        )}
      >
        <Grid size={12} />
        Grid View
      </Link>
      <Link
        to="/matching"
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-headline text-[10px] uppercase tracking-widest font-bold transition-all duration-300",
          !isGrid
            ? "bg-gradient-brand text-[var(--primary-foreground)] shadow-[var(--shadow-card)]"
            : "text-lustre-muted hover:text-lustre-text"
        )}
      >
        <Sparkles size={12} />
        Swipe View
      </Link>
    </div>
  );
}
