import { Star, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '@/services/api';
import { useState } from 'react';

interface RequestCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultant: {
    id: string;
    name: string;
    experience: number;
    category: string;
    subcategory: string;
    rating: number;
    callRate?: number;
    originalCallRate?: number;
    isCallDiscountActive?: boolean;
    freeMinutes?: number;
  };
  onConfirm?: () => void;
}

const RequestCallModal = ({ isOpen, onClose, consultant, onConfirm }: RequestCallModalProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const initials = consultant.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  const handleConfirmRequest = async () => {
    setIsLoading(true);
    try {
      // Call API to request call (mode 1)
      const response = await chatAPI.createSession([consultant.id], 1);
      const sessionId = response.data;

      toast({
        title: 'Call Requested',
        description: `Your call request has been sent to ${consultant.name}.`,
      });

      console.log("Navigating to call screen with sessionId:", sessionId, "consultantId:", consultant.id);

      onClose();

      // Navigate to call screen
      const callUrl = `/user/call/${consultant.id}`;
      console.log("Target Call URL:", callUrl);

      navigate(callUrl, {
        state: { sessionId }
      });

      if (onConfirm) onConfirm();
    } catch (error: any) {
      console.error('Error requesting call:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send call request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <div
        className="bg-background rounded-t-3xl md:rounded-3xl w-full md:w-full md:max-w-md p-6 md:p-7 shadow-xl animate-in slide-in-from-bottom-5 md:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-foreground mb-2">Request a Call</h2>
        <p className="text-sm text-muted-foreground mb-6">
          You're about to request a consultation with {consultant.name}
        </p>

        {/* Consultant Info Card */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 mb-6">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {initials}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-foreground">{consultant.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{consultant.experience} years experience</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                  {consultant.category}
                </span>
                <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                  {consultant.subcategory}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 mb-6">
          {/* Rate */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm font-medium text-muted-foreground">Rate</span>
            <div className="flex flex-col items-end">
              {consultant.isCallDiscountActive && consultant.originalCallRate ? (
                <>
                  <span className="font-bold text-foreground">₹{consultant.callRate}/min</span>
                  <span className="text-[10px] text-muted-foreground line-through">₹{consultant.originalCallRate}/min</span>
                </>
              ) : (
                <span className="font-bold text-foreground">₹{consultant.callRate || 20}/min</span>
              )}
            </div>
          </div>

          {/* Free Time */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm font-medium text-muted-foreground">Free Time</span>
            <span className="font-bold text-success">{consultant.freeMinutes || 5} min FREE</span>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-muted-foreground">Rating</span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-warning text-warning" />
              <span className="font-bold text-foreground">{Number(consultant.rating).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-blue-700 mb-1">Note:</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            The consultant will receive your request and call you shortly. Please ensure your phone is available.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-12 rounded-full font-semibold border-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRequest}
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full h-12 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                Confirm Request
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RequestCallModal;
