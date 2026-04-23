import { useNavigate } from 'react-router-dom';
import { User, Briefcase, ArrowRight } from 'lucide-react';

const Signup = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full flex flex-col items-center">
                {/* Main Logo/Icon */}
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6 shadow-purple">
                    <User className="text-primary-foreground w-10 h-10" />
                </div>

                <h1 className="font-display text-3xl font-bold text-foreground mb-2 text-center">Welcome!</h1>
                <p className="text-muted-foreground mb-12 text-center">Choose your account type to get started</p>

                <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl mb-12">
                    {/* User Card */}
                    <div className="bg-card rounded-[2rem] p-8 shadow-md hover:shadow-purple/20 transition-all duration-300 flex flex-col items-start group border border-border/50">
                        <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center mb-6">
                            <User className="text-primary w-6 h-6" />
                        </div>
                        <h2 className="font-display text-xl font-bold text-foreground mb-3">I'm a User</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">
                            Looking for expert consultants to help with your projects and get professional advice.
                        </p>
                        <button
                            onClick={() => navigate('/login', { state: { flow: 'signup', role: 'user' } })}
                            className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all"
                        >
                            Get Started <ArrowRight className="ml-1 w-4 h-4" />
                        </button>
                    </div>

                    {/* Consultant Card */}
                    <div className="bg-card rounded-[2rem] p-8 shadow-md hover:shadow-purple/20 transition-all duration-300 flex flex-col items-start group border border-border/50">
                        <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center mb-6">
                            <Briefcase className="text-primary w-6 h-6" />
                        </div>
                        <h2 className="font-display text-xl font-bold text-foreground mb-3">I'm a Consultant</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">
                            Ready to share your expertise, connect with clients, and grow your consulting business.
                        </p>
                        <button
                            onClick={() => navigate('/login', { state: { flow: 'signup', role: 'consultant' } })}
                            className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all"
                        >
                            Get Started <ArrowRight className="ml-1 w-4 h-4" />
                        </button>
                    </div>
                </div>

                <p className="text-muted-foreground">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="text-primary font-semibold hover:underline"
                    >
                        Sign In
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Signup;
