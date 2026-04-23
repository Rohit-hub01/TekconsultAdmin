import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowRight, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { mockConsultants } from '@/data/mockData';
import ConsultantCard from '@/components/consultant/ConsultantCard';
import CategoryCard from '@/components/category/CategoryCard';
import { toast } from '@/hooks/use-toast';
import { categoryAPI, type Category, consultantAPI } from '@/services/api';
import { getParentCategories } from '@/lib/categoryUtils';

const UserHome = () => {
  const { user } = useAuth();
  const displayName = (`${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || user?.name || 'USER');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [topConsultants, setTopConsultants] = useState<any[]>([]);
  const [loadingConsultants, setLoadingConsultants] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await categoryAPI.getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Error',
          description: 'Failed to load categories. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        setLoadingConsultants(true);
        const data = await consultantAPI.getAllConsultants();

        // Transform API response to match ConsultantCard format
        const transformedConsultants = data
          .filter((consultant: any) => consultant.consultantProfileId && consultant.averageRating !== null)
          .map((consultant: any) => ({
            id: consultant.userId,
            name: `${consultant.firstName} ${consultant.lastName || ''}`.trim(),
            rating: consultant.averageRating || 0,
            experience: consultant.experienceYears || 0,
            category: consultant.consultantCategory || 'General',
            subcategory: consultant.consultantCategory || 'Consultation',
            isOnline: consultant.isOnline || false,
            isVerified: consultant.isConsultantVerified || false,
            languages: consultant.languages ? consultant.languages.split(',').map((l: string) => l.trim()) : ['English'],
            chatRate: consultant.chatRatePerMinute || 10,
            callRate: consultant.callRatePerMinute || 15,
            discountedChatRate: consultant.discountedChatRate,
            isChatDiscountActive: consultant.isChatDiscountActive,
            discountedCallRate: consultant.discountedCallRate,
            isCallDiscountActive: consultant.isCallDiscountActive,
            discountStart: consultant.discountStart,
            discountEnd: consultant.discountEnd,
            avatar: consultant.profilePhotoUrl,
            expertise: consultant.expertiseNames || [],
            freeMinutes: consultant.freeMinutesOffer || 0,
            bio: consultant.bio || '',
            totalConsultations: consultant.totalSessionsCompleted || 0,
            earnings: 0,
            pendingWithdrawal: 0,
          }))
          // Sort by rating in descending order
          .sort((a: any, b: any) => b.rating - a.rating)
          // Take only top 10
          .slice(0, 10);

        setTopConsultants(transformedConsultants);
      } catch (error) {
        console.error('Error fetching consultants:', error);
        // Fallback to mock data if API fails
        const mockTopConsultants = [...mockConsultants]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 10);
        setTopConsultants(mockTopConsultants);
      } finally {
        setLoadingConsultants(false);
      }
    };

    fetchConsultants();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <header>
        <h1 className="font-display text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
          Welcome, {displayName.toUpperCase()}!
        </h1>
        <p className="text-muted-foreground mt-2 text-lg font-medium">
          Find your perfect consultant
        </p>
      </header>

      {/* Search Bar */}
      {/* <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="w-6 h-6" />
        </div>
        <input
          type="text"
          placeholder="Search consultants, categories..."
          className="w-full h-16 pl-14 pr-16 rounded-[1.25rem] bg-muted/50 border-2 border-transparent focus:border-primary/20 focus:bg-background focus:outline-none text-lg transition-all shadow-sm focus:shadow-md"
        />
        <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm">
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div> */}

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl lg:text-2xl font-bold text-foreground">Browse Categories</h2>
        </div>
        {loadingCategories ? (
          <div className="flex items-center justify-center p-12">
            <Loader className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getParentCategories(categories).map((category) => (
              <CategoryCard key={category.categoryId} category={category} compact />
            ))}
            {/* Managed expandable taxonomy placeholder card as seen in image */}
            {/* <div className="flex items-center gap-4 bg-muted/20 rounded-2xl border border-dashed border-border p-4 hover:bg-muted/40 transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                📈
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground text-sm leading-snug">Admin-managed taxonomy</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">Expandable</p>
              </div>
            </div> */}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No categories available</p>
          </div>
        )}
      </section>

      {/* Top Consultants */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl lg:text-2xl font-bold text-foreground">Top Consultants</h2>
          <Link to="/user/explore" className="flex items-center gap-1 text-primary font-bold hover:gap-2 transition-all">
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loadingConsultants ? (
          <div className="flex items-center justify-center p-12">
            <Loader className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : topConsultants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
            {topConsultants.map((consultant) => (
              <ConsultantCard key={consultant.id} consultant={consultant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No consultants available</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default UserHome;
