import { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { sessionAPI } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string;
    consultantName: string;
    onSuccess?: () => void;
}

const ReviewModal = ({ isOpen, onClose, sessionId, consultantName, onSuccess }: ReviewModalProps) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({
                title: "Rating required",
                description: "Please select a rating before submitting.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await sessionAPI.submitReview(sessionId, rating, comment);
            toast({
                title: "Review submitted",
                description: "Thank you for your feedback!",
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to submit review:', error);
            toast({
                title: "Error",
                description: "Failed to submit review. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center font-display text-xl">Rate your session</DialogTitle>
                    <DialogDescription className="text-center">
                        How was your session with <span className="font-semibold">{consultantName}</span>?
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-6">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform active:scale-90"
                            >
                                <Star
                                    className={`w-10 h-10 ${(hoverRating || rating) >= star
                                            ? 'fill-warning text-warning'
                                            : 'text-muted-foreground'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="w-full space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            Share your experience (optional)
                        </label>
                        <Textarea
                            placeholder="What did you like? What could be improved?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px] resize-none rounded-xl"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 rounded-xl h-12"
                    >
                        Skip
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        className="flex-1 rounded-xl h-12 gradient-primary"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Submit Review'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReviewModal;
