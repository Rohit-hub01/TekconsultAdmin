import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Phone,
  MessageCircle,
  CheckCircle,
  Clock,
  Globe,
  Award,
  Users,
  Loader2,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockReviews, type Consultant } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { consultantAPI, chatAPI, sessionAPI, API_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import RequestCallModal from '@/components/consultant/RequestCallModal';
import { isDiscountApplicable } from '@/lib/pricing';

const ConsultantProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [reviewSkip, setReviewSkip] = useState(0);
  const TAKE_COUNT = 5;

  const fetchReviews = async (skip = 0) => {
    if (!id) return;
    setIsReviewsLoading(true);
    try {
      const data = await sessionAPI.getConsultantReviews(id, skip, TAKE_COUNT);
      console.log("🔗 Fetched reviews data:", data);
      const reviewsList = data?.reviews || data?.Reviews || [];
      const total = data?.totalCount || data?.TotalCount || 0;

      if (skip === 0) {
        setReviews(reviewsList);
        setTotalReviews(total);
      } else {
        setReviews(prev => [...prev, ...reviewsList]);
      }
      setReviewSkip(skip + TAKE_COUNT);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const handleLoadMoreReviews = () => {
    fetchReviews(reviewSkip);
  };

  const handleStartChat = async () => {
    if (!consultant || !id) return;

    setIsCreatingSession(true);
    try {
      // Call API to create chat session
      const response = await chatAPI.createSession([id], 0); // mode 0 for chat
      const sessionId = response.data;

      toast({
        title: "Session Requested",
        description: "Waiting for consultant to accept your chat request.",
      });

      // Navigate to chat page
      // We pass the consultant id as per existing route structure
      navigate(`/user/chat/${id}`, { state: { sessionId } });
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

  useEffect(() => {
    const fetchConsultant = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const data = await consultantAPI.getConsultantById(id);

        const isChatDiscountActive = isDiscountApplicable({
          isDiscountActive: data.isChatDiscountActive,
          discountedRate: data.discountedChatRate,
          discountStart: data.discountStart,
          discountEnd: data.discountEnd
        });

        const isCallDiscountActive = isDiscountApplicable({
          isDiscountActive: data.isCallDiscountActive,
          discountedRate: data.discountedCallRate,
          discountStart: data.discountStart,
          discountEnd: data.discountEnd
        });

        // Map API response to Consultant type
        const mappedConsultant: Consultant = {
          id: data.userId,
          name: `${data.firstName} ${data.lastName || ''}`.trim(),
          phone: data.phoneNumber,
          email: data.email || '',
          avatar: data.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${data.firstName} ${data.lastName || ''}`)}`,
          category: data.consultantCategory || '',
          subcategory: data.roleName || '',
          rating: data.averageRating || 0,
          totalReviews: data.totalSessionsCompleted || 0,
          chatRate: isChatDiscountActive ? data.discountedChatRate : data.chatRatePerMinute || 0,
          callRate: isCallDiscountActive ? data.discountedCallRate : data.callRatePerMinute || 0,
          originalChatRate: data.chatRatePerMinute,
          isChatDiscountActive: isChatDiscountActive,
          originalCallRate: data.callRatePerMinute,
          isCallDiscountActive: isCallDiscountActive,
          freeMinutes: data.freeMinutesOffer || 0,
          isOnline: data.isOnline || false,
          isVerified: data.isConsultantVerified || false,
          experience: data.experienceYears || 0,
          languages: data.languages
            ? data.languages.split(',').map((l: string) => l.trim()).filter(Boolean)
            : [],
          gender: data.gender,
          bio: data.bio || 'No bio available',
          totalConsultations: data.totalSessionsCompleted || 0,
          earnings: 0,
          pendingWithdrawal: 0,
          expertise: data.expertiseNames || [],
        };

        setConsultant(mappedConsultant);
      } catch (error) {
        console.error('Failed to fetch consultant:', error);
        toast({
          title: "Error",
          description: "Failed to load consultant profile. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultant();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold">Consultant not found</h2>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary px-6 pt-6 pb-24 rounded-b-[2rem] relative">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-primary-foreground/80 hover:text-primary-foreground mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </button>
      </div>

      {/* Profile Card */}
      <div className="px-6 -mt-16 relative z-10">
        <div className="bg-card rounded-2xl shadow-elevated p-6 border border-border">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full border-4 border-card overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-2xl text-primary">
                {consultant.avatar ? (
                  <img
                    src={consultant.avatar.startsWith('http') || consultant.avatar.startsWith('data:')
                      ? consultant.avatar
                      : `${API_BASE_URL}${consultant.avatar}`}
                    alt={consultant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  consultant.name.charAt(0)
                )}
              </div>
              <div
                className={cn(
                  'absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-card',
                  consultant.isOnline ? 'bg-success' : 'bg-muted-foreground'
                )}
              >
                {consultant.isOnline && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white opacity-40 animate-ping" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <h1 className="font-display text-xl font-bold text-foreground">
                  {consultant.name}
                </h1>
                {consultant.isVerified && (
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {consultant.experience} years experience {consultant.gender && `| ${consultant.gender}`}
              </p>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-warning/10 text-warning px-1.5 py-0.5 rounded-lg text-sm font-bold">
                  <Star className="w-3.5 h-3.5 fill-warning" />
                  {Number(consultant.rating).toFixed(1)}
                </div>
                <span className="text-xs text-muted-foreground">
                  ({consultant.totalReviews} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Expertise Tags + Free minutes badge */}
          <div className="flex flex-wrap gap-2 mt-4">
            {consultant.expertise && consultant.expertise.length > 0 ? (
              consultant.expertise.map((tag, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-primary/8 text-primary border-primary/15 rounded-lg font-medium text-xs gap-1"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </Badge>
              ))
            ) : (
              consultant.category && (
                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 rounded-lg font-medium">
                  {consultant.category}
                </Badge>
              )
            )}
            {consultant.freeMinutes > 0 && (
              <Badge variant="secondary" className="bg-success/5 text-success border-success/10 rounded-lg font-medium">
                {consultant.freeMinutes} min FREE
              </Badge>
            )}
          </div>

          {/* Details Row */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-medium">{consultant.languages.join(', ')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">{consultant.experience} years</span>
            </div>
          </div>
        </div>
      </div>

      {/* Consultation Rates */}
      <div className="px-6 mt-6">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Consultation Rates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Chat</span>
              </div>
              <div className="flex flex-col">
                {consultant.isChatDiscountActive && (
                  <span className="text-xs text-muted-foreground line-through decoration-destructive/50">
                    ₹{consultant.originalChatRate}
                  </span>
                )}
                <p className="text-2xl font-bold text-foreground">₹{consultant.chatRate}<span className="text-sm font-normal text-muted-foreground">/min</span></p>
              </div>
            </div>
            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Call</span>
              </div>
              <div className="flex flex-col">
                {consultant.isCallDiscountActive && (
                  <span className="text-xs text-muted-foreground line-through decoration-destructive/50">
                    ₹{consultant.originalCallRate}
                  </span>
                )}
                <p className="text-2xl font-bold text-foreground">₹{consultant.callRate}<span className="text-sm font-normal text-muted-foreground">/min</span></p>
              </div>
            </div>
          </div>
          {consultant.freeMinutes > 0 && (
            <div className="mt-4 p-2.5 bg-success/5 rounded-xl border border-success/10 text-center">
              <p className="text-xs text-success font-medium">
                First {consultant.freeMinutes} minutes FREE for new users!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mt-6">
        <Tabs defaultValue="about" className="w-full" onValueChange={(value) => {
          if (value === 'reviews' && reviews.length === 0 && !isReviewsLoading) {
            fetchReviews();
          }
        }}>
          <TabsList className="w-full grid grid-cols-2 rounded-xl bg-muted h-12 p-1">
            <TabsTrigger value="about" className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              About
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4 space-y-4">
            {/* Bio */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-2">About Me</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{consultant.bio}</p>
            </div>

            {/* Expertise */}
            {consultant.expertise && consultant.expertise.length > 0 && (
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Areas of Expertise</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {consultant.expertise.map((tag, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-primary/5 text-primary border-primary/20 rounded-lg px-3 py-1 text-xs font-medium"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-3">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-xl text-center">
                  <MessageCircle className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="flex flex-col items-center">
                    {consultant.isChatDiscountActive && (
                      <span className="text-xs text-muted-foreground line-through mb-1">₹{consultant.originalChatRate}</span>
                    )}
                    <p className="text-2xl font-bold text-foreground">₹{consultant.chatRate}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">per minute</p>
                  <p className="text-xs text-primary font-medium mt-1">Chat</p>
                </div>
                <div className="p-4 bg-muted rounded-xl text-center">
                  <Phone className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="flex flex-col items-center">
                    {consultant.isCallDiscountActive && (
                      <span className="text-xs text-muted-foreground line-through mb-1">₹{consultant.originalCallRate}</span>
                    )}
                    <p className="text-2xl font-bold text-foreground">₹{consultant.callRate}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">per minute</p>
                  <p className="text-xs text-primary font-medium mt-1">Call</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4 space-y-3">
            {isReviewsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary/50" />
                <p className="text-sm">Loading reviews...</p>
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.reviewId || review.id} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-xs text-primary border border-border">
                      {review.userProfilePhotoUrl ? (
                        <img
                          src={review.userProfilePhotoUrl.startsWith('http') ? review.userProfilePhotoUrl : `${API_BASE_URL}${review.userProfilePhotoUrl}`}
                          alt={review.userName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (review.userName || 'A').charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="font-medium text-foreground flex-1">{review.userName || 'Anonymous'}</span>
                    <div className="flex items-center gap-0.5 text-warning scale-90">
                      {Array.from({ length: review.rating || 0 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-warning" />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">{review.comment || ''}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(review.createdAt || review.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-card rounded-xl p-8 border border-border border-dashed text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <h4 className="font-medium text-foreground">No reviews yet</h4>
                <p className="text-sm text-muted-foreground mt-1">This consultant hasn't received any reviews yet.</p>
              </div>
            )}

            {reviews.length > 0 && reviews.length < totalReviews && (
              <div className="pt-2 flex justify-center ">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 h-10 px-6 font-medium"
                  onClick={handleLoadMoreReviews}
                  disabled={isReviewsLoading}
                >
                  {isReviewsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Load More Reviews
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Actions */}
      <div className="px-6 mt-6 pb-6">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 sm:h-14 rounded-xl border-2 border-primary text-primary hover:bg-primary/5 active:bg-primary active:text-primary-foreground transition-all"
            onClick={handleStartChat}
            disabled={isCreatingSession}
          >
            {isCreatingSession ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Chat
              </>
            )}
          </Button>
          <Button
            className="flex-1 h-12 sm:h-14 rounded-xl gradient-primary shadow-purple hover:opacity-90 active:scale-[0.98] transition-all"
            onClick={() => setIsCallModalOpen(true)}
          >
            <Phone className="w-5 h-5 mr-2" />
            Voice Call
          </Button>
        </div>
      </div>

      {/* Request Call Modal */}
      <RequestCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        consultant={{
          id: consultant.id,
          name: consultant.name,
          experience: consultant.experience,
          category: consultant.category,
          subcategory: consultant.subcategory,
          rating: consultant.rating,
          callRate: consultant.callRate,
          originalCallRate: consultant.originalCallRate,
          isCallDiscountActive: consultant.isCallDiscountActive,
          freeMinutes: consultant.freeMinutes,
        }}
      />
    </div>
  );
};

export default ConsultantProfile;
