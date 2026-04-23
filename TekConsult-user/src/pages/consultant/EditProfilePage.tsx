import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Loader2, User, BookOpen, Briefcase, Globe, Award, ChevronLeft, Save, Sparkles, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { consultantAPI, userAPI, categoryAPI, API_BASE_URL } from '@/services/api';

const EditProfilePage = () => {
  const { consultant, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  // Form states
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('https://via.placeholder.com/100');
  const [gender, setGender] = useState('');

  // Categories and Languages
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [newLanguage, setNewLanguage] = useState('');

  // Session Rates
  const [chatRate, setChatRate] = useState('');
  const [callRate, setCallRate] = useState('');
  const [discountedChatRate, setDiscountedChatRate] = useState('');
  const [isChatDiscountActive, setIsChatDiscountActive] = useState(false);
  const [discountedCallRate, setDiscountedCallRate] = useState('');
  const [isCallDiscountActive, setIsCallDiscountActive] = useState(false);
  const [discountStart, setDiscountStart] = useState('');
  const [discountEnd, setDiscountEnd] = useState('');
  const [freeMeetingMinutes, setFreeMeetingMinutes] = useState('');

  // Fetch consultant profile data on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsFetchingData(true);
        const userId = localStorage.getItem('userId');
        if (!userId) {
          toast({
            title: 'Error',
            description: 'User ID not found',
            variant: 'destructive',
          });
          return;
        }

        const data = await consultantAPI.getConsultantProfileById(userId);

        // Populate form fields with fetched data
        setFullName(`${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Consultant Name');
        setBio(data.bio || '');
        setExperience(data.experienceYears?.toString() || '0');
        setGender(data.gender || '');
        setProfilePhotoPreview(data.profilePhotoUrl || 'https://via.placeholder.com/100');

        // Legacy categories are now handled by mapping tables below

        // Parse languages
        if (data.languages) {
          const languagesArray = typeof data.languages === 'string'
            ? data.languages.split(',').map((l: string) => l.trim()).filter(Boolean)
            : Array.isArray(data.languages) ? data.languages : [];
          setLanguages(languagesArray);
        }

        // Set rates
        setChatRate(data.chatRatePerMinute?.toString() || '0');
        setCallRate(data.callRatePerMinute?.toString() || '0');
        setDiscountedChatRate(data.discountedChatRate?.toString() || '');
        setIsChatDiscountActive(data.isChatDiscountActive || false);
        setDiscountedCallRate(data.discountedCallRate?.toString() || '');
        setIsCallDiscountActive(data.isCallDiscountActive || false);
        setDiscountStart(data.discountStart ? new Date(data.discountStart).toISOString().split('T')[0] : '');
        setDiscountEnd(data.discountEnd ? new Date(data.discountEnd).toISOString().split('T')[0] : '');
        setFreeMeetingMinutes(data.freeMinutesOffer?.toString() || '0');

        // Fetch all categories (required for UI)
        try {
          const catsData = await categoryAPI.getCategoriesWithSubcategories();
          setAllCategories(catsData);
        } catch (catErr) {
          console.warn('Could not load categories:', catErr);
        }

        // Fetch existing expertise selection (optional - page still works without it)
        try {
          const expertiseData = await consultantAPI.getExpertiseSelection(userId);
          setSelectedCategoryIds(expertiseData.categoryIds || []);
          setSelectedSubCategoryIds(expertiseData.subCategoryIds || []);
        } catch (expErr) {
          console.warn('Could not load expertise selection (table may not exist yet):', expErr);
        }

      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchProfileData();
  }, []);

  // Handlers
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        // Remove category and its subcategories
        const newSelected = prev.filter(id => id !== categoryId);
        const category = allCategories.find(c => c.categoryId === categoryId);
        if (category?.subCategories) {
          const subIdsToRemove = category.subCategories.map((sc: any) => sc.categoryId);
          setSelectedSubCategoryIds(prevSub => prevSub.filter(id => !subIdsToRemove.includes(id)));
        }
        return newSelected;
      }
      return [...prev, categoryId];
    });
  };

  const handleToggleSubCategory = (subCategoryId: string) => {
    setSelectedSubCategoryIds(prev =>
      prev.includes(subCategoryId)
        ? prev.filter(id => id !== subCategoryId)
        : [...prev, subCategoryId]
    );
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim()) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found');
      }

      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      let photoUrl = profilePhotoPreview;
      if (profilePhoto) {
        try {
          const uploadedUrl = await userAPI.uploadProfilePhoto(profilePhoto);
          photoUrl = uploadedUrl;
        } catch (error) {
          console.error('Error uploading photo:', error);
        }
      }

      const profileData = {
        userId,
        firstName,
        lastName,
        bio,
        experienceYears: parseInt(experience) || 0,
        consultantCategory: '', // Deprecated in favor of mapping tables
        languages: languages.join(','),
        chatRatePerMinute: parseFloat(chatRate) || 0,
        callRatePerMinute: parseFloat(callRate) || 0,
        discountedChatRate: discountedChatRate ? parseFloat(discountedChatRate) : null,
        isChatDiscountActive,
        discountedCallRate: discountedCallRate ? parseFloat(discountedCallRate) : null,
        isCallDiscountActive,
        discountStart: discountStart || null,
        discountEnd: discountEnd || null,
        freeMinutesOffer: parseInt(freeMeetingMinutes) || 0,
        gender,
        profilePhotoUrl: photoUrl,
      };

      await Promise.all([
        consultantAPI.updateConsultantProfile(profileData),
        consultantAPI.updateExpertise(userId, {
          categoryIds: selectedCategoryIds,
          subCategoryIds: selectedSubCategoryIds
        })
      ]);

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully',
      });

      navigate('/consultant/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile changes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-display font-medium">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-100/50 via-background to-background pb-10 sm:pb-20">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] sm:w-[40%] h-[40%] bg-purple-200/30 blur-[80px] sm:blur-[120px] rounded-full animate-pulse-soft" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[50%] sm:w-[30%] h-[30%] bg-indigo-200/20 blur-[70px] sm:blur-[100px] rounded-full animate-pulse-soft" />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <button
              onClick={() => navigate('/consultant/profile')}
              className="p-1.5 sm:p-2 hover:bg-muted rounded-full transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
            </button>
            <div className="truncate">
              <h1 className="font-display text-lg sm:text-2xl font-bold text-foreground truncate">Edit Profile</h1>
              <p className="hidden xs:flex text-[10px] sm:text-xs text-muted-foreground font-medium items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-500" /> Identity
              </p>
            </div>
          </div>
          <Button
            onClick={handleSaveChanges}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl sm:rounded-2xl h-9 sm:h-11 px-4 sm:px-6 shadow-purple transition-all hover:scale-105 active:scale-95 text-xs sm:text-base flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mr-1 sm:mr-2" />
            ) : (
              <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            )}
            <span className="hidden xs:inline">Save Changes</span>
            <span className="xs:hidden">Save</span>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Photo & Identity */}
          <div className="space-y-6">
            <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-card overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-primary/5 rounded-full -mr-10 -mt-10" />

              <h2 className="text-[10px] sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 sm:mb-6 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Profile Photo
              </h2>

              <div className="flex flex-col items-center">
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative">
                    <img
                      src={profilePhotoPreview.startsWith('http') || profilePhotoPreview.startsWith('data:')
                        ? profilePhotoPreview
                        : `${API_BASE_URL}${profilePhotoPreview}`}
                      alt="Profile"
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover ring-2 ring-background border-4 border-card bg-muted shadow-xl"
                    />
                    <label className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-all shadow-lg hover:scale-110 active:scale-90 border-2 border-background">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div className="mt-4 sm:mt-6 text-center">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground max-w-[150px] mx-auto leading-relaxed">
                    Clear frontal photos are recommended for better client trust.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-card h-fit">
              <h2 className="text-[10px] sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 sm:mb-6 flex items-center gap-2">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Professional Focus
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground/80 mb-1.5 block px-1">GENDER</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-10 sm:h-11 px-3 sm:px-4 rounded-xl border border-border/50 bg-background/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer transition-all hover:border-primary/30"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground/80 mb-1.5 block px-1">EXPERIENCE</label>
                  <div className="relative">
                    <Input
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="10"
                      className="h-10 sm:h-11 rounded-xl border-border/50 bg-background/50 pl-9 sm:pl-10 text-xs sm:text-sm focus:ring-primary/20 transition-all"
                    />
                    <Briefcase className="absolute left-3 top-3 sm:left-3.5 sm:top-3.5 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    <span className="absolute right-3 top-3 sm:top-3.5 text-[10px] font-medium text-muted-foreground">Years</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle & Right Column - Bio & Rates */}
          <div className="md:col-span-2 space-y-6 sm:space-y-8">
            {/* Basic Info Section */}
            <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-card">
              <h2 className="text-[10px] sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 sm:mb-6 flex items-center gap-2">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Personal Narrative
              </h2>

              <div className="space-y-5 sm:space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground/80 px-1 uppercase">Full Professional Name</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="h-11 sm:h-12 rounded-xl border-border/50 bg-background/50 text-base sm:text-lg font-display font-medium focus:ring-primary/20 transition-all placeholder:text-muted/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-muted-foreground/80 px-1 uppercase">Phone Number</label>
                    <Input
                      value={consultant?.phone || ''}
                      disabled
                      className="h-11 sm:h-12 rounded-xl border-border/50 bg-muted cursor-not-allowed text-sm focus:ring-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-muted-foreground/80 px-1 uppercase">Email Address</label>
                    <Input
                      value={consultant?.email || ''}
                      disabled
                      className="h-11 sm:h-12 rounded-xl border-border/50 bg-muted cursor-not-allowed text-sm focus:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground/80 px-1 uppercase">About You (Bio)</label>
                  <div className="relative">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell potential clients what makes you unique..."
                      className="w-full min-h-[140px] sm:min-h-[160px] p-3 sm:p-4 border border-border/50 rounded-2xl bg-background/50 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-[9px] sm:text-[10px] font-bold text-muted-foreground/50">
                      Markdown Supported
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-card h-fit">
                <h2 className="text-[10px] sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" /> Select Your Expertise
                </h2>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {allCategories.map((category) => (
                    <div key={category.categoryId} className="space-y-2">
                      <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors group">
                        <input
                          type="checkbox"
                          id={category.categoryId}
                          checked={selectedCategoryIds.includes(category.categoryId)}
                          onChange={() => handleToggleCategory(category.categoryId)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                        />
                        <Label
                          htmlFor={category.categoryId}
                          className="text-sm font-bold cursor-pointer group-hover:text-primary transition-colors uppercase tracking-tight"
                        >
                          {category.name}
                        </Label>
                      </div>

                      {selectedCategoryIds.includes(category.categoryId) && category.subCategories && (
                        <div className="ml-6 grid grid-cols-1 gap-1 animate-in slide-in-from-top-1 duration-200">
                          {category.subCategories.map((sub: any) => (
                            <div key={sub.categoryId} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/30 transition-colors group">
                              <input
                                type="checkbox"
                                id={sub.categoryId}
                                checked={selectedSubCategoryIds.includes(sub.categoryId)}
                                onChange={() => handleToggleSubCategory(sub.categoryId)}
                                className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                              />
                              <Label
                                htmlFor={sub.categoryId}
                                className="text-xs font-medium cursor-pointer group-hover:text-foreground transition-colors"
                              >
                                {sub.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-card h-fit">
                <h2 className="text-[10px] sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Languages
                </h2>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 min-h-[30px] sm:min-h-[40px]">
                  {languages.map((language, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="rounded-lg bg-indigo-100 text-indigo-700 border-none hover:bg-indigo-200 px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2 group transition-all animate-fade-in text-[10px] sm:text-xs"
                    >
                      {language}
                      <X
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 cursor-pointer opacity-50 group-hover:opacity-100"
                        onClick={() => handleRemoveLanguage(index)}
                      />
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                    placeholder="E.g. English"
                    className="h-9 sm:h-10 rounded-xl border-border/50 bg-background/50 focus:ring-primary/20 text-[10px] sm:text-xs"
                  />
                  <Button
                    onClick={handleAddLanguage}
                    variant="ghost"
                    className="text-indigo-600 hover:bg-indigo-50 font-bold h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-[10px] sm:text-xs"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Rates Section */}
            <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-indigo-500/5 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16" />

              <h2 className="text-[10px] sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 sm:mb-8 flex items-center gap-2">
                <span className="p-0.5 px-1.5 sm:p-1 sm:px-2 bg-primary/10 text-primary rounded-md text-[9px] sm:text-[10px] font-bold">FEES</span> Pricing Configuration
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Chat Rate</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-primary font-bold text-sm">₹</span>
                      </div>
                      <Input
                        type="number"
                        value={chatRate}
                        onChange={(e) => setChatRate(e.target.value)}
                        className="h-11 pl-7 rounded-xl border-border/50 bg-background/50 font-bold text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-[9px] font-bold text-muted-foreground">/min</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-orange-500/80 uppercase px-1">Disc. Chat Rate</label>
                    <Input
                      type="number"
                      value={discountedChatRate}
                      onChange={(e) => setDiscountedChatRate(e.target.value)}
                      placeholder="Optional"
                      className="h-10 rounded-xl border-border/50 bg-background/50 text-xs"
                    />
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <Label className="text-[10px] font-semibold">Active</Label>
                      <Switch
                        checked={isChatDiscountActive}
                        onCheckedChange={setIsChatDiscountActive}
                        className="scale-75"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Call Rate</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-primary font-bold text-sm">₹</span>
                      </div>
                      <Input
                        type="number"
                        value={callRate}
                        onChange={(e) => setCallRate(e.target.value)}
                        className="h-11 pl-7 rounded-xl border-border/50 bg-background/50 font-bold text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-[9px] font-bold text-muted-foreground">/min</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-orange-500/80 uppercase px-1">Disc. Call Rate</label>
                    <Input
                      type="number"
                      value={discountedCallRate}
                      onChange={(e) => setDiscountedCallRate(e.target.value)}
                      placeholder="Optional"
                      className="h-10 rounded-xl border-border/50 bg-background/50 text-xs"
                    />
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <Label className="text-[10px] font-semibold">Active</Label>
                      <Switch
                        checked={isCallDiscountActive}
                        onCheckedChange={setIsCallDiscountActive}
                        className="scale-75"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Free Trial</label>
                    <div className="relative group">
                      <Input
                        type="number"
                        value={freeMeetingMinutes}
                        onChange={(e) => setFreeMeetingMinutes(e.target.value)}
                        className="h-11 px-3 rounded-xl border-border/50 bg-background/50 font-bold text-sm text-center"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-[9px] font-bold text-primary">min</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Start Date</label>
                    <Input
                      type="date"
                      value={discountStart}
                      onChange={(e) => setDiscountStart(e.target.value)}
                      className="h-10 rounded-xl border-border/50 bg-background/50 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">End Date</label>
                    <Input
                      type="date"
                      value={discountEnd}
                      onChange={(e) => setDiscountEnd(e.target.value)}
                      className="h-10 rounded-xl border-border/50 bg-background/50 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-muted/30 rounded-xl sm:rounded-2xl border border-border/40">
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-primary">Pro Tip:</span> Competitive rates help you get more bookings. Most top consultants start between ₹30-50 per minute.
                </p>
              </div>
            </div>

            {/* Bottom Action Buttons (Always Visible on Mobile Bottom) */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 md:pb-0 pb-10">
              <Button
                onClick={() => navigate('/consultant/profile')}
                variant="outline"
                className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl border-border/50 bg-background/50 font-semibold text-sm"
              >
                Discard Changes
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={isLoading}
                className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-purple text-sm"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Save className="mr-2 h-4 w-4" />}
                Save Profile
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProfilePage;
