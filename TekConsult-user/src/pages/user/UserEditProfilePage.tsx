import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI, API_BASE_URL } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const UserEditProfilePage = () => {
  const { user, updateProfileName } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    bio: '',
    phoneNumber: '',
    email: '',
    addressLine: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      setIsLoading(true);
      try {
        const data = await userAPI.getUserById(userId);

        if (data.profilePhotoUrl) {
          setProfilePhoto(data.profilePhotoUrl);
        }

        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || 'male',
          bio: data.bio || '',
          phoneNumber: data.phoneNumber || '',
          email: data.email || '',
          addressLine: data.address?.addressLine || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          zipcode: data.address?.zipcode || '',
          country: data.address?.country || '',
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const initials = `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase() || 'U';

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    const missingFields: string[] = [];

    if (!formData.firstName.trim()) {
      missingFields.push('First Name');
    }

    if (missingFields.length > 0) {
      toast({
        title: 'Validation Error',
        description: `Please fill required field(s): ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        let photoUrl = profilePhoto;
        if (photoFile) {
          try {
            const uploadedUrl = await userAPI.uploadProfilePhoto(photoFile);
            photoUrl = uploadedUrl;
          } catch (error) {
            console.error('Error uploading photo:', error);
            toast({
              title: 'Upload Failed',
              description: 'Failed to upload profile photo. Saving other changes...',
              variant: 'destructive',
            });
          }
        }

        await userAPI.updateProfile(userId, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          bio: formData.bio,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          profilePhotoUrl: photoUrl,
          addressLine: formData.addressLine,
          city: formData.city,
          state: formData.state,
          zipcode: formData.zipcode,
          country: formData.country,
        });

        updateProfileName(formData.firstName, formData.lastName);
        toast({
          title: 'Success',
          description: 'Profile updated successfully.',
        });
        navigate('/user/profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="font-display text-lg font-bold text-foreground">Edit Profile</h1>
        <button onClick={handleSave} disabled={isSaving} className="text-primary font-semibold hover:text-primary/80">
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Profile Photo Section */}
      <div className="px-6 py-8 text-center">
        <div className="relative inline-block group">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl mx-auto relative overflow-hidden">
            {profilePhoto ? (
              <img
                src={profilePhoto.startsWith('http') || profilePhoto.startsWith('data:')
                  ? profilePhoto
                  : `${API_BASE_URL}${profilePhoto}`}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover bg-muted"
              />
            ) : (
              initials
            )}
          </div>
          <label htmlFor="photo-upload" className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
            <Camera className="w-4 h-4" />
          </label>
          <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        </div>
        <p className="text-sm text-muted-foreground mt-3">Tap to change photo</p>
      </div>

      {/* Form Sections */}
      <div className="px-6 space-y-8">
        {/* Personal Information */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">👤</div>
            <h2 className="font-semibold text-foreground">Personal Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-foreground mb-2 block">
                First Name *
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
                className="w-full"
              />

              <Label htmlFor="lastName" className="text-sm font-medium text-foreground mb-2 block">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-foreground mb-3 block">Gender</Label>
              <RadioGroup value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                <div className="flex gap-6">
                  {['male', 'female', 'other'].map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option} className="font-normal cursor-pointer capitalize">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* <div>
              <Label htmlFor="bio" className="text-sm font-medium text-foreground mb-2 block">
                Bio (Optional)
              </Label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                rows={3}
              />
            </div> */}
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">📞</div>
            <h2 className="font-semibold text-foreground">Contact Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground mb-2 block">
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+91 98765 45111"
                className="w-full bg-muted cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@gmail.com"
                className="w-full bg-muted cursor-not-allowed"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">📍</div>
            <h2 className="font-semibold text-foreground">Address Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="addressLine" className="text-sm font-medium text-foreground mb-2 block">
                Address Line
              </Label>
              <Input
                id="addressLine"
                name="addressLine"
                value={formData.addressLine}
                onChange={handleInputChange}
                placeholder="123 Main Street"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-sm font-medium text-foreground mb-2 block">
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Mumbai"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="state" className="text-sm font-medium text-foreground mb-2 block">
                  State
                </Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Maharashtra"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipcode" className="text-sm font-medium text-foreground mb-2 block">
                  Zipcode
                </Label>
                <Input
                  id="zipcode"
                  name="zipcode"
                  value={formData.zipcode}
                  onChange={handleInputChange}
                  placeholder="400001"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="country" className="text-sm font-medium text-foreground mb-2 block">
                  Country
                </Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="India"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 mt-8 space-y-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-full h-12"
        >
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </Button>
        <Button
          onClick={() => navigate('/user/profile')}
          variant="outline"
          className="w-full rounded-full h-12 font-semibold"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default UserEditProfilePage;
