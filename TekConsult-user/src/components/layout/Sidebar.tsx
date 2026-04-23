import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, History, Wallet, User, LogOut, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface SidebarProps {
    variant: 'user' | 'consultant';
}

const Sidebar = ({ variant }: SidebarProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const userNavItems = [
        { icon: Home, label: 'Home', path: '/user/home' },
        { icon: History, label: 'History', path: '/user/sessions' },
        { icon: Wallet, label: 'Wallets', path: '/user/wallet' },
        { icon: User, label: 'Profile', path: '/user/profile' },
    ];

    const consultantNavItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/consultant/dashboard' },
        { icon: History, label: 'Sessions', path: '/consultant/sessions' },
        { icon: Wallet, label: 'Earnings', path: '/consultant/earnings' },
        { icon: User, label: 'Profile', path: '/consultant/profile' },
    ];

    const navItems = variant === 'user' ? userNavItems : consultantNavItems;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
            {/* Logo */}
            <div className="p-6">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-purple">
                        T
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-xl tracking-tight leading-none">TekConsult</h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-semibold">{variant}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
                {navItems.map(({ icon: Icon, label, path }) => {
                    const isActive = location.pathname === path;
                    return (
                        <NavLink
                            key={path}
                            to={path}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative',
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-purple translate-x-1'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                        >
                            <Icon className={cn('w-5 h-5 transition-transform group-hover:scale-110', isActive ? 'text-primary-foreground' : 'text-primary')} />
                            <span className="font-medium">{label}</span>
                            {isActive && (
                                <div className="absolute right-0 w-1 y-8 bg-primary-foreground/30 rounded-l-full" />
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 mt-auto border-t border-border/50">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-200 group font-bold"
                >
                    <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
