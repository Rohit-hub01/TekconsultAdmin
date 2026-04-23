import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProfileCompletionWidgetProps {
    percentage: number;
    role: 'user' | 'consultant';
    onCompleteClick?: () => void;
}

const ProfileCompletionWidget: React.FC<ProfileCompletionWidgetProps> = ({ percentage, role, onCompleteClick }) => {
    const navigate = useNavigate();

    const getMessage = () => {
        if (percentage >= 100) return "You're all set! Your profile is 100% complete.";
        if (percentage >= 70) return "Almost there! Complete the remaining details for faster approval.";
        if (percentage >= 40) return "Good start! Add more details to build trust with clients.";
        return "Your profile is just getting started. Complete it to unlock all features.";
    };

    const handleClick = () => {
        if (onCompleteClick) {
            onCompleteClick();
        } else {
            navigate(role === 'consultant' ? '/consultant/profile' : '/user/profile');
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        percentage === 100 ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                    )}>
                        {percentage === 100 ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6 animate-pulse" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-[#2d3436]">Profile Completion</h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{percentage}% Complete</p>
                    </div>
                </div>
                {percentage < 100 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClick}
                        className="text-indigo-600 font-bold hover:bg-indigo-50 gap-1"
                    >
                        Complete Now
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <Progress value={percentage} className="h-2 mb-4 bg-muted" />

            <p className="text-sm text-[#636e72] leading-relaxed">
                {getMessage()}
            </p>

            {role === 'consultant' && percentage < 100 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-[11px] text-amber-800 font-medium">
                        <span className="font-bold">Note:</span> Admin will approve your profile once it reaches at least 80% completion.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProfileCompletionWidget;
