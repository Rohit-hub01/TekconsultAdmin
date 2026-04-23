import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
// Keep mock data types but use API for data
import { type Consultant } from '@/data/mockData';
import ConsultantCard from '@/components/consultant/ConsultantCard';
import { consultantAPI, categoryAPI, Category } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const UserExplore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  // selectedCategory is the ID from URL
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  );
  const [priceRange, setPriceRange] = useState([0, 100]); // Increased range for real data compatibility
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'reviews'>('rating');

  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryAPI.getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Consultants based on category or all
  useEffect(() => {
    const fetchConsultants = async () => {
      setIsLoading(true);
      try {
        let data: any[] = [];

        let categoryName: string | undefined;
        // Logic: if selectedCategory (ID) matches a category in the list, use its name.
        // If not found in list (list empty or invalid ID), maybe it is a Name itself?
        // Assumption: Users navigate via clicks which pass ID. If typed manually as name, it might fail if we expect ID.
        // But let's check if selectedCategory exists in categories list.
        const matchedCategory = categories.find(c => c.categoryId === selectedCategory);

        if (selectedCategory && matchedCategory) {
          categoryName = matchedCategory.name;
        } else if (selectedCategory && categories.length > 0) {
          // If categories loaded but ID not found, treat selectedCategory as name directly? 
          // Or maybe mapped from a previous navigation.
          // Let's assume if it is not a UUID it might be a name, but UUID check is complex.
          // For now, if we can't find ID, and categories are loaded, we might default to all or name.
          // Let's try passing it as name if it doesn't look like ID, or just pass it?
          // "Lawyers" vs "cf4a..."
          categoryName = selectedCategory;
        }

        if (categoryName) {
          console.log("Fetching by category:", categoryName);
          data = await consultantAPI.getConsultantsByCategory(categoryName);
        } else {
          // Retrieve all if no category selected OR categories not loaded yet (technically we should wait for categories to load if category is selected, but simplicity first)
          // Actually, if selectedCategory is set but categories not loaded, matchedCategory is undefined.
          // We should probably wait for categories if selectedCategory is present.
          if (selectedCategory && categories.length === 0) {
            // Return early and wait for categories to load
            return;
          }
          data = await consultantAPI.getAllConsultants();
        }

        // Map API response to Consultant type
        const mappedConsultants: Consultant[] = data.map((item: any) => ({
          id: item.userId,
          name: `${item.firstName} ${item.lastName || ''}`.trim(),
          phone: item.phoneNumber,
          email: item.email,
          avatar: item.profilePhotoUrl, // Fallback handled in Card if null
          category: item.consultantCategory,
          subcategory: item.roleName || '', // No subcategory in response example
          rating: item.averageRating || 0,
          totalReviews: item.totalSessionsCompleted || 0,
          chatRate: item.chatRatePerMinute,
          callRate: item.callRatePerMinute,
          discountedChatRate: item.discountedChatRate,
          isChatDiscountActive: item.isChatDiscountActive,
          discountedCallRate: item.discountedCallRate,
          isCallDiscountActive: item.isCallDiscountActive,
          discountStart: item.discountStart,
          discountEnd: item.discountEnd,
          freeMinutes: item.freeMinutesOffer || 0,
          isOnline: item.isOnline,
          isVerified: item.isConsultantVerified,
          experience: item.experienceYears || 0,
          languages: item.languages ? item.languages.split(',').map((l: string) => l.trim()) : ['English'],
          bio: item.bio || '',
          totalConsultations: item.totalSessionsCompleted || 0,
          earnings: 0,
          pendingWithdrawal: 0,
          expertise: item.expertiseNames || [],
        }));

        setConsultants(mappedConsultants);
      } catch (error) {
        console.error('Failed to fetch consultants:', error);
        toast({
          title: "Error",
          description: "Failed to load consultants. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultants();
  }, [selectedCategory, categories]); // Re-run when selectedCategory or categories change

  const filteredConsultants = useMemo(() => {
    let result = [...consultants];

    // Client-side filtering (Search, Price, Online, Sort)
    // Note: We already filtered by Category on server-side if selected.
    // If selectedCategory was used for API call, result contains only those.
    // But verify: existing logic filters by category name. If we fetched by category, this filter is redundant but harmless.
    // If we fetched ALL (no category selected), we shouldn't filter by category unless selectedCategory is set (which means we should have fetched by category).
    // So assume server API does the category filtering.

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.category && c.category.toLowerCase().includes(query)) ||
          (c.subcategory && c.subcategory.toLowerCase().includes(query)) ||
          (c.expertise && c.expertise.some((e) => e.toLowerCase().includes(query)))
      );
    }

    // Price filter
    result = result.filter(
      (c) => c.chatRate >= priceRange[0] && c.chatRate <= priceRange[1]
    );

    // Online filter
    if (onlineOnly) {
      result = result.filter((c) => c.isOnline);
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price':
        result.sort((a, b) => a.chatRate - b.chatRate);
        break;
      case 'reviews':
        result.sort((a, b) => b.totalReviews - a.totalReviews);
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, priceRange, onlineOnly, sortBy, consultants]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setPriceRange([0, 50]);
    setOnlineOnly(false);
    setSortBy('rating');
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategory || onlineOnly || priceRange[0] > 0 || priceRange[1] < 50;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-40 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search consultants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-2"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl border-2 relative"
              >
                <SlidersHorizontal className="w-5 h-5" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-card">
              <SheetHeader>
                <SheetTitle className="font-display">Filters</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                {/* Online Only */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Online Only</span>
                  <Switch checked={onlineOnly} onCheckedChange={setOnlineOnly} />
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Price Range</span>
                    <span className="text-sm text-muted-foreground">
                      ₹{priceRange[0]} - ₹{priceRange[1]}/min
                    </span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={50}
                    step={5}
                    className="py-2"
                  />
                </div>

                {/* Sort By */}
                <div className="space-y-3">
                  <span className="font-medium">Sort By</span>
                  <div className="flex gap-2">
                    {[
                      { value: 'rating', label: 'Rating' },
                      { value: 'price', label: 'Price' },
                      { value: 'reviews', label: 'Reviews' },
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={sortBy === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy(value as typeof sortBy)}
                        className="rounded-xl"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="w-full rounded-xl">
                    Clear All Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto py-3 -mx-6 px-6 scrollbar-hide">
          <Button
            variant={!selectedCategory ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="rounded-full flex-shrink-0"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.categoryId}
              variant={selectedCategory === category.categoryId ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.categoryId)}
              className="rounded-full flex-shrink-0"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredConsultants.length} consultants found
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-primary font-medium"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {filteredConsultants.map((consultant) => (
                <ConsultantCard key={consultant.id} consultant={consultant} />
              ))}

              {filteredConsultants.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="font-semibold text-foreground">No consultants found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your filters or search query
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserExplore;
