import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Bell,
    Lock,
    Eye,
    Moon,
    Globe,
    Trash2,
    ChevronRight,
    Shield,
    Smartphone,
    Mail,
    MessageSquare,
    Languages,
    Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';

const UserSettings = () => {
    const navigate = useNavigate();

    // Notification States
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [smsEnabled, setSmsEnabled] = useState(false);

    // Preference States
    const [darkMode, setDarkMode] = useState(false);
    const [marketingEnabled, setMarketingEnabled] = useState(false);

    useEffect(() => {
        const storedTheme = localStorage.getItem('tekconsult-theme');
        if (storedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            setDarkMode(true);
        }
    }, []);

    const handleDarkModeChange = (enabled: boolean) => {
        setDarkMode(enabled);
        if (enabled) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('tekconsult-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('tekconsult-theme', 'light');
        }
    };

    const handleUpdatePassword = () => {
        toast({
            title: "Password Reset",
            description: "A password reset link has been sent to your email.",
        });
    };

    const handleDeleteAccount = () => {
        toast({
            title: "Account Deleted",
            description: "Your account has been successfully deleted.",
            variant: "destructive"
        });
        // Add logout and redirect logic here
    };

    const SettingItem = ({
        icon: Icon,
        label,
        description,
        action,
        type = 'navigate'
    }: {
        icon: any,
        label: string,
        description?: string,
        action?: any,
        type?: 'navigate' | 'switch' | 'button'
    }) => (
        <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50 hover:border-primary/20 transition-all shadow-sm group">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-semibold text-foreground text-sm">{label}</h4>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
            </div>
            {type === 'navigate' && (
                <button onClick={action} className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
            )}
            {type === 'switch' && (
                <Switch checked={action.value} onCheckedChange={action.onChange} />
            )}
            {type === 'button' && (
                <Button variant="ghost" size="sm" onClick={action} className="text-primary hover:text-primary/80 font-semibold">
                    Update
                </Button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <ArrowLeft className="w-6 h-6 text-foreground" />
                </button>
                <h1 className="font-display text-lg font-bold text-foreground">Settings</h1>
            </div>

            <div className="px-6 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Notifications Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Bell className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Notifications</h2>
                    </div>
                    <div className="space-y-3">
                        <SettingItem
                            icon={Smartphone}
                            label="Push Notifications"
                            description="Get real-time updates for session requests"
                            type="switch"
                            action={{ value: pushEnabled, onChange: setPushEnabled }}
                        />
                        <SettingItem
                            icon={Mail}
                            label="Email Notifications"
                            description="Receive summaries and account alerts"
                            type="switch"
                            action={{ value: emailEnabled, onChange: setEmailEnabled }}
                        />
                        <SettingItem
                            icon={MessageSquare}
                            label="SMS Alerts"
                            description="Critical updates via text message"
                            type="switch"
                            action={{ value: smsEnabled, onChange: setSmsEnabled }}
                        />
                    </div>
                </section>

                {/* Security Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Shield className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Security</h2>
                    </div>
                    <div className="space-y-3">
                        {/* <SettingItem
                            icon={Lock}
                            label="Change Password"
                            description="Regularly update for better security"
                            type="button"
                            action={handleUpdatePassword}
                        /> */}
                        <SettingItem
                            icon={Eye}
                            label="Privacy Settings"
                            description="Manage who can see your profile details"
                            action={() => { }}
                        />
                    </div>
                </section>

                {/* Preferences Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Palette className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Preferences</h2>
                    </div>
                    <div className="space-y-3">
                        <SettingItem
                            icon={Moon}
                            label="Dark Mode"
                            description="Easy on the eyes in low light"
                            type="switch"
                            action={{ value: darkMode, onChange: handleDarkModeChange }}
                        />
                        <SettingItem
                            icon={Languages}
                            label="Language"
                            description="Select your preferred language"
                            type="button"
                            action={() => { }}
                        />
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 px-1">
                        <Trash2 className="w-4 h-4 text-destructive" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-destructive">Danger Zone</h2>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button className="w-full flex items-center justify-between p-4 bg-destructive/5 rounded-2xl border border-destructive/20 hover:bg-destructive/10 transition-all group group">
                                <div className="flex items-center gap-4 text-destructive">
                                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                                        <Trash2 className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-semibold text-sm">Delete Account</h4>
                                        <p className="text-xs opacity-80">Permenently remove your account data</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-destructive/40" />
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    account and remove your data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete Account
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </section>

                <div className="text-center pt-8">
                    <p className="text-xs text-muted-foreground">App Version 1.0.4 (Stable)</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">© 2026 TekConsult. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default UserSettings;
