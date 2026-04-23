import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Star, Phone, MessageCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { chatAPI, API_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import RequestCallModal from './RequestCallModal';
import type { Consultant } from '@/data/mockData';
import { isDiscountApplicable } from '@/lib/pricing';

interface ConsultantCardProps {
  consultant: Consultant;
  compact?: boolean;
}

const ConsultantCard = ({ consultant }: ConsultantCardProps) => {
  const navigate = useNavigate();
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const handleStartChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsCreatingSession(true);
    try {
      // Call API to create chat session
      const response = await chatAPI.createSession([consultant.id], 0); // mode 0 for chat
      const sessionId = response.data;

      toast({
        title: "Session Requested",
        description: "Waiting for consultant to accept your chat request.",
      });

      // Navigate to chat page
      navigate(`/user/chat/${consultant.id}`, {
        state: { sessionId }
      });
    } catch (error: any) {
      console.error('Failed to create chat session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start chat session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const initials = consultant.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 3);

  const isChatDiscountActive = isDiscountApplicable({
    isDiscountActive: consultant.isChatDiscountActive,
    discountedRate: consultant.discountedChatRate,
    discountStart: consultant.discountStart,
    discountEnd: consultant.discountEnd
  });

  const isCallDiscountActive = isDiscountApplicable({
    isDiscountActive: consultant.isCallDiscountActive,
    discountedRate: consultant.discountedCallRate,
    discountStart: consultant.discountStart,
    discountEnd: consultant.discountEnd
  });

  return (
    <>
      <Link
        to={isCallModalOpen ? '#' : `/user/consultant/${consultant.id}`}
        onClick={(e) => {
          if (isCallModalOpen) {
            e.preventDefault();
          }
        }}
        className="block bg-card rounded-[2rem] border border-border p-6 transition-all hover:shadow-xl hover:border-primary/50 group"
      >
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Avatar / Initials */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 self-center sm:self-start">
            <div className="w-full h-full rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg sm:text-xl shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
              {consultant.avatar ? (
                <img
                  src={consultant.avatar.startsWith('http') || consultant.avatar.startsWith('data:')
                    ? consultant.avatar
                    : `${API_BASE_URL}${consultant.avatar}`}
                  alt={consultant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div
              className={cn(
                'absolute bottom-1 right-1 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border-[2.5px] sm:border-[3px] border-card z-10 shadow-sm',
                consultant.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'
              )}
            >
              {consultant.isOnline && (
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" style={{ animationDuration: '2s' }} />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2 sm:gap-0">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-display font-bold text-lg sm:text-xl text-foreground truncate group-hover:text-primary transition-colors">
                    {consultant.name}
                  </h3>
                  {consultant.isVerified && (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">{consultant.experience} years experience</p>
              </div>
              <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-lg self-center sm:self-start">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-warning text-warning" />
                <span className="text-xs sm:text-sm font-bold">{Number(consultant.rating).toFixed(1)}</span>
              </div>
            </div>

            {/* Tags — expertise subcategories or fallback to category */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
              {consultant.expertise && consultant.expertise.length > 0
                ? consultant.expertise.map((exp, idx) => (
                  <Badge key={idx} variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-lg px-2 sm:px-3 py-0.5 text-[10px] sm:text-xs">
                    {exp}
                  </Badge>
                ))
                : consultant.category && (
                  <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border rounded-lg px-2 sm:px-3 py-0.5 text-[10px] sm:text-xs">
                    {consultant.category}
                  </Badge>
                )
              }
              {(isChatDiscountActive || isCallDiscountActive) && (
                <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20 rounded-lg px-2 sm:px-3 py-0.5 text-[10px] sm:text-xs animate-pulse">
                  OFFER
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground font-medium">
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 h-4 text-primary/70" />
                <span className="truncate">{consultant.languages.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-border my-4 sm:my-6" />

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-2 border-primary/10 text-primary hover:bg-primary/5 hover:border-primary/30 flex items-center justify-center gap-2 sm:gap-3 active:scale-95 transition-all text-xs sm:text-sm"
            onClick={handleStartChat}
            disabled={isCreatingSession}
          >
            {isCreatingSession ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <div className="flex flex-col items-start leading-tight">
                  {isChatDiscountActive ? (
                    <>
                      <span className="font-bold text-sm sm:text-base">₹{consultant.discountedChatRate}/min</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground line-through decoration-destructive/50">₹{consultant.chatRate}/min</span>
                    </>
                  ) : (
                    <span className="font-bold">₹{consultant.chatRate}/min</span>
                  )}
                </div>
              </div>
            )}
          </Button>
          <Button
            variant="outline"
            className="h-14 rounded-xl sm:rounded-2xl border-2 border-primary/10 text-primary hover:bg-primary/5 hover:border-primary/30 flex items-center justify-center gap-2 sm:gap-3 active:scale-95 transition-all text-xs sm:text-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsCallModalOpen(true);
            }}
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            <div className="flex flex-col items-start leading-tight">
              {isCallDiscountActive ? (
                <>
                  <span className="font-bold text-sm sm:text-base">₹{consultant.discountedCallRate}/min</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground line-through decoration-destructive/50">₹{consultant.callRate}/min</span>
                </>
              ) : (
                <span className="font-bold">₹{consultant.callRate}/min</span>
              )}
            </div>
          </Button>
        </div>
      </Link>

      <RequestCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        consultant={{
          id: consultant.id,
          name: consultant.name,
          experience: consultant.experience,
          category: consultant.category,
          subcategory: consultant.subcategory || '',
          rating: consultant.rating,
          callRate: isCallDiscountActive ? consultant.discountedCallRate : consultant.callRate,
          originalCallRate: consultant.callRate,
          isCallDiscountActive: isCallDiscountActive,
          freeMinutes: consultant.freeMinutes || 5,
        }}
      />
    </>
  );
};

export default ConsultantCard;
