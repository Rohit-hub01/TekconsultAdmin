import { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { sessionAPI, API_BASE_URL } from '@/services/api';

interface Review {
  reviewId: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userProfilePhotoUrl?: string | null;
}

const ConsultantReviews = () => {
  const { consultant } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const storedUserId = localStorage.getItem('userId');
      const consultantId = storedUserId || consultant?.id;

      if (!consultantId) {
        console.warn('No consultant ID found in context or localStorage');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await sessionAPI.getConsultantReviews(consultantId);
        // The API returns { reviews: [...] } inside data
        setReviews(data?.reviews || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [consultant?.id]);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length
  }));

  const maxCount = Math.max(...ratingCounts.map(r => r.count), 1);

  const getInitials = (userName: string) => {
    return (userName || 'Client').charAt(0).toUpperCase();
  };

  const getInitialsBgColor = (index: number) => {
    const colors = [
      'bg-purple-500',
      'bg-blue-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-green-500',
      'bg-indigo-500',
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">Loading your reviews...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 pt-6 pb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Reviews & Ratings</h1>
      </div>

      {/* Overall Rating Section */}
      <div className="px-6 pb-8">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-8">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Overall Rating</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold text-foreground">{averageRating}</h2>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-5 h-5',
                        i < Math.round(Number(averageRating))
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{reviews.length} total reviews</p>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-4">
            {ratingCounts.map((breakdown) => (
              <div key={breakdown.stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{breakdown.stars}</span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-black h-full rounded-full transition-all"
                    style={{
                      width: `${(breakdown.count / maxCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground w-10 text-right">
                  {breakdown.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="px-6 pb-8">
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No reviews yet</p>
            </div>
          ) : (
            reviews.map((review, index) => (
              <div key={review.reviewId} className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-3">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg overflow-hidden',
                      !review.userProfilePhotoUrl && getInitialsBgColor(index)
                    )}
                  >
                    {review.userProfilePhotoUrl ? (
                      <img
                        src={review.userProfilePhotoUrl.startsWith('http') ? review.userProfilePhotoUrl : `${API_BASE_URL}${review.userProfilePhotoUrl}`}
                        alt={review.userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(review.userName)
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{review.userName || 'Client'}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-4 h-4',
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      {review.comment || 'No comment provided'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultantReviews;
