import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Wallet, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const userNavItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/user/home' },
  { icon: Search, label: 'Explore', path: '/user/explore' },
  { icon: Wallet, label: 'Wallet', path: '/user/wallet' },
  { icon: MessageCircle, label: 'Sessions', path: '/user/sessions' },
  { icon: User, label: 'Profile', path: '/user/profile' },
];

const consultantNavItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', path: '/consultant/dashboard' },
  { icon: MessageCircle, label: 'Sessions', path: '/consultant/sessions' },
  { icon: Wallet, label: 'Earnings', path: '/consultant/earnings' },
  { icon: User, label: 'Profile', path: '/consultant/profile' },
];

interface BottomNavProps {
  variant: 'user' | 'consultant';
}

const BottomNav = ({ variant }: BottomNavProps) => {
  const location = useLocation();
  const navItems = variant === 'user' ? userNavItems : consultantNavItems;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-card/80 backdrop-blur-lg border-t border-border z-50 transition-all duration-300">
      <div className="flex items-center justify-around py-2 px-2 sm:px-4">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className={cn(
                'relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', isActive && 'fill-primary/20 scale-110')} />
              <span className={cn(
                'text-[10px] sm:text-xs font-medium transition-all',
                isActive ? 'font-bold' : ''
              )}>
                {label}
              </span>
              {isActive && (
                <div className="absolute -bottom-2 h-1 w-6 bg-primary rounded-t-full shadow-[0_-2px_6px_rgba(152,16,250,0.3)] animate-in fade-in slide-in-from-bottom-1" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
