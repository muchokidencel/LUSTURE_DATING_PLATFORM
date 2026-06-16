import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Bell, Crown, Sun, Moon, Heart, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '../../hooks/useQueries';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();

  const { data: notificationsList, isLoading: isNotificationsLoading } = useNotifications(isAuthenticated);
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  const unreadCount = notificationsList ? notificationsList.filter((n: any) => !n.isRead).length : 0;

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match':
        return <Heart size={14} className="text-lustre-rose fill-lustre-rose/20" />;
      case 'super_like':
        return <Crown size={14} className="text-lustre-gold fill-lustre-gold/20" />;
      case 'like':
        return <Heart size={14} className="text-lustre-purple fill-lustre-purple/20" />;
      default:
        return <Bell size={14} className="text-lustre-muted" />;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-dim/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm flex items-center justify-between px-margin-desktop py-4 max-w-container-max mx-auto">
      <div className="flex items-center gap-12">
        <Link to="/" className="font-garamond italic text-3xl text-lustre-purple tracking-tighter">
          Lustre
        </Link>
        
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-8">
            <NavLink 
              to="/discovery"
              id="nav-discovery"
              className={({ isActive }) => cn(
                "font-headline text-[10px] uppercase tracking-[0.2em] transition-all duration-300 pb-1 border-b-2",
                isActive 
                  ? "text-lustre-purple font-bold border-lustre-purple" 
                  : "text-lustre-muted hover:text-lustre-purple border-transparent"
              )}
            >
              Discovery
            </NavLink>
            <NavLink 
              to="/matches"
              id="nav-matches"
              className={({ isActive }) => cn(
                "font-headline text-[10px] uppercase tracking-[0.2em] transition-all duration-300 pb-1 border-b-2",
                isActive 
                  ? "text-lustre-purple font-bold border-lustre-purple" 
                  : "text-lustre-muted hover:text-lustre-purple border-transparent"
              )}
            >
              Matches
            </NavLink>
            <NavLink 
              to="/referrals"
              id="nav-referrals"
              className={({ isActive }) => cn(
                "font-headline text-[10px] uppercase tracking-[0.2em] transition-all duration-300 pb-1 border-b-2",
                isActive 
                  ? "text-lustre-purple font-bold border-lustre-purple" 
                  : "text-lustre-muted hover:text-lustre-purple border-transparent"
              )}
            >
              Referrals
            </NavLink>
            <NavLink 
              to="/premium"
              id="nav-premium"
              className={({ isActive }) => cn(
                "font-headline text-[10px] uppercase tracking-[0.2em] transition-all duration-300 pb-1 border-b-2 flex items-center gap-1.5",
                isActive 
                  ? "text-lustre-gold font-bold border-lustre-gold" 
                  : "text-lustre-gold/70 hover:text-lustre-gold border-transparent"
              )}
            >
              <Crown size={12} strokeWidth={1.5} className="fill-lustre-gold/10" />
              Premium
            </NavLink>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-lustre-muted hover:text-lustre-purple transition-colors rounded-full w-9 h-9 shrink-0 animate-fade-in"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
        </Button>

        {isAuthenticated ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button id="notifications-bell" aria-label="Notifications" variant="ghost" size="icon" className="relative text-lustre-muted hover:text-lustre-purple transition-colors w-9 h-9 rounded-full shrink-0 flex items-center justify-center">
                  <Bell size={20} strokeWidth={1.5} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-lustre-rose text-[8px] font-bold text-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-80 bg-surface-container border border-outline-variant/10 rounded-xl p-2 shadow-2xl max-h-[400px] overflow-y-auto"
              >
                <div className="flex items-center justify-between p-2 pb-3 border-b border-outline-variant/10">
                  <span className="font-garamond italic text-lg text-lustre-text font-bold">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => markAllRead()}
                      className="font-headline text-[9px] uppercase tracking-wider text-lustre-purple font-bold hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="py-1">
                  {isNotificationsLoading ? (
                    <div className="py-8 text-center text-lustre-muted flex flex-col items-center justify-center gap-2">
                      <Loader2 size={16} strokeWidth={1.5} className="animate-spin text-lustre-purple" />
                      <span className="text-[10px] uppercase tracking-wider font-bold">Synchronizing...</span>
                    </div>
                  ) : notificationsList && notificationsList.length > 0 ? (
                    notificationsList.map((n: any) => (
                      <DropdownMenuItem 
                        key={n.id} 
                        className={cn(
                          "flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer outline-none mb-1 text-left select-none",
                          n.isRead 
                            ? "opacity-75 hover:bg-surface-variant/5 bg-transparent" 
                            : "bg-lustre-purple-dim/5 hover:bg-lustre-purple-dim/10 border-l-2 border-lustre-purple font-medium"
                        )}
                        onClick={() => {
                          if (!n.isRead) {
                            markRead(n.id);
                          }
                        }}
                      >
                        <div className="mt-0.5 shrink-0">
                          {getNotificationIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs leading-relaxed text-lustre-text", !n.isRead && "font-bold")}>
                            {n.content}
                          </p>
                          <span className="text-[10px] text-lustre-muted mt-1 block">
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="py-8 text-center text-lustre-muted">
                      <p className="text-xs">No notifications yet</p>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="sm" className="hidden sm:flex bg-lustre-purple-dim/10 border border-lustre-purple/20 text-lustre-purple rounded-full px-6 h-9 font-headline text-[10px] font-bold uppercase tracking-widest hover:bg-lustre-purple/10 transition-all active:scale-95" asChild>
              <Link to="/premium">Upgrade</Link>
            </Button>

            <Link to="/profile" id="nav-profile">
              <Avatar className={cn(
                "w-9 h-9 cursor-pointer transition-all border",
                user?.role === 'admin' ? "ring-2 ring-lustre-purple" : "border-outline-variant hover:border-lustre-purple/50"
              )}>
                <AvatarImage src={user?.photos?.[0]?.url} className="object-cover" />
                <AvatarFallback className="bg-elevated text-lustre-text">
                  {user?.profile?.full_name ? getInitial(user.profile.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-lustre-muted hover:text-lustre-text font-headline text-[10px] uppercase tracking-widest font-bold" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button className="bg-gradient-brand text-white border-0 rounded-full px-6 h-9 font-headline text-[10px] uppercase tracking-widest font-bold hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_12px_rgba(210,188,255,0.2)]" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}

