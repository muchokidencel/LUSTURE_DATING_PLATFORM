import { NavLink } from 'react-router-dom';
import { Sparkles, Heart, Crown, User, Gift } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function BottomNav() {
  const navItems = [
    { to: '/discovery', icon: Sparkles, label: 'Discovery' },
    { to: '/matches', icon: Heart, label: 'Matches' },
    { to: '/referrals', icon: Gift, label: 'Rewards' },
    { to: '/premium', icon: Crown, label: 'Premium' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-low/90 backdrop-blur-xl border-t border-outline-variant/10 flex items-center justify-around px-4 py-3 pb-safe md:hidden shadow-[0px_-4px_24px_rgba(0,0,0,0.4)] rounded-t-xl">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          id={`bottom-nav-${item.label.toLowerCase()}`}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 group transition-all duration-300",
            isActive ? "active scale-110" : ""
          )}
        >
          <item.icon 
            size={18} 
            strokeWidth={1.5} 
            className="text-lustre-faint group-[.active]:text-lustre-purple group-[.active]:fill-lustre-purple/10 transition-colors" 
          />
          <span className="font-headline text-[8px] uppercase tracking-widest text-lustre-faint group-[.active]:text-lustre-purple transition-colors font-bold mt-0.5">
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}

