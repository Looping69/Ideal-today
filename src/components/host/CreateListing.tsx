
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ui/image-upload";
import VideoUpload from "@/components/ui/video-upload";
import {
  Home,
  Building2,
  Warehouse,
  Tent,
  Mountain,
  Waves,
  Trees,
  Check,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Loader2,
  Lock,
  Video
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { geocodeAddress } from "@/lib/geocoding";

import { CATEGORIES } from "@/constants/categories";
import { CATEGORY_ICONS } from "@/components/icons/CategoryIcons";

const AMENITIES = [
  "Wifi", "Kitchen", "Pool", "Hot tub", "Air conditioning",
  "Heating", "Washer", "Dryer", "Parking", "Gym",
  "Workspace", "TV", "Fireplace", "BBQ grill"
];

const PROVINCES = [
  'Western Cape', 'Eastern Cape', 'Northern Cape', 'Gauteng', 'KwaZulu-Natal', 'Free State', 'North West', 'Mpumalanga', 'Limpopo'
] as const;

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentCategory, setParentCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "", // This will store the specific subcategory ID
    location: "",
    province: "",
    guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [] as string[],
    title: "",
    description: "",
    price: "",
    images: [] as string[],
    video_url: null as string | null
  });

  const [plan, setPlan] = useState<'free' | 'standard' | 'premium'>('free');
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [canCreate, setCanCreate] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'verified' | 'rejected' | null>(null);

  useEffect(() => {
    async function checkLimits() {
      if (!user) return;

      // 1. Get Plan and Verification from database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('host_plan, verification_status')
        .eq('id', user.id)
        .single();

      const currentPlan = (profileData?.host_plan as 'free' | 'standard' | 'premium') || 'free';
      setPlan(currentPlan);
      const startStatus = profileData?.verification_status || 'none';
      setVerificationStatus(startStatus);

      if (profileError) {
        console.error('Error fetching plan:', profileError);
      }

      // 2. Count Listings
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', user.id);

      if (error) {
        console.error(error);
      } else {
        const listingCount = count || 0;
        // Free plan limit: 1 listing
        if (currentPlan === 'free' && listingCount >= 1) {
          setCanCreate(false);
        }
      }
      setCheckingLimit(false);
    }
    checkLimits();
  }, [user]);

  if (checkingLimit) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  if (verificationStatus !== 'verified' && verificationStatus !== null) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Verification Required</h1>
        <p className="text-gray-600 text-lg max-w-md mx-auto">
          {verificationStatus === 'pending'
            ? "Your profile is currently under review. You'll be able to publish listings once approved."
            : "To ensure safety and trust on our platform, all hosts must complete identity verification before publishing listings."}
        </p>
        <div className="pt-6">
          <Button onClick={() => navigate('/host/verification')} className="h-12 px-8 text-base bg-amber-600 hover:bg-amber-700">
            {verificationStatus === 'pending' ? 'Check Status' : 'Start Verification'}
          </Button>
          <div className="mt-4">
            <Link to="/host" className="text-sm text-gray-500 hover:text-gray-900 font-medium">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Listing Limit Reached</h1>
        <p className="text-gray-600 text-lg max-w-md mx-auto">
          You are currently on the <strong>Free Plan</strong>, which allows only 1 property listing.
          To publish more listings and unlock video features, please upgrade.
        </p>
        <div className="pt-6">
          <Button onClick={() => navigate('/host/subscription')} className="h-12 px-8 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            Upgrade My Plan
          </Button>
          <div className="mt-4">
            <Link to="/host" className="text-sm text-gray-500 hover:text-gray-900 font-medium">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const updateData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a listing.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Geocode the address
      let latitude = -33.9249; // Default fallback (Cape Town)
      let longitude = 18.4241;

      if (formData.location) {
        const addressToGeocode = formData.location + (formData.province ? `, ${formData.province}` : "");
        const coords = await geocodeAddress(addressToGeocode);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
        }
      }

      const { error } = await supabase.from("properties").insert({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        province: formData.province || null,
        price: Number(formData.price),
        type: formData.category,
        amenities: formData.amenities,
        guests: formData.guests,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        image: formData.images[0] || null,
        images: formData.images,
        video_url: formData.video_url,
        host_id: user.id,
        latitude,
        longitude,
        approval_status: 'pending' // Listings require approval
      });

      if (error) throw error;

      toast({
        title: "Listing Submitted!",
        description: "Your listing is pending admin approval and will be live once reviewed.",
      });

      navigate("/host");
    } catch (error) {
      console.error("Error creating listing:", error);
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
          <span>Step {step} of 5</span>
          <span>{Math.round((step / 5) * 100)}% Completed</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 min-h-[500px] flex flex-col">
        <div className="flex-1">
          {/* Step 1: Category */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center max-w-lg mx-auto mb-10">
                <h2 className="text-2xl font-bold mb-2">
                  {!parentCategory
                    ? "Which of these best describes your place?"
                    : `Now, let's be more specific about your ${CATEGORIES.find(c => c.id === parentCategory)?.label}`}
                </h2>
                <p className="text-gray-500">
                  {!parentCategory
                    ? "Select a main category to see specific property types."
                    : "Choose the type that best fits your property."}
                </p>
              </div>

              {!parentCategory ? (
                <div className="grid grid-cols-2 gap-4">
                  {CATEGORIES.map((cat) => {
                    const IconComponent = CATEGORY_ICONS[cat.id];
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setParentCategory(cat.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all hover:border-primary/50 hover:bg-gray-50 group",
                          "border-gray-200 text-gray-600"
                        )}
                      >
                        {IconComponent ? (
                          <IconComponent className="w-12 h-12 mb-3 transition-transform group-hover:scale-110" />
                        ) : (
                          <span className="text-4xl mb-3">{cat.icon}</span>
                        )}
                        <span className="font-semibold">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {CATEGORIES.find(c => c.id === parentCategory)?.subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => updateData("category", sub.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all hover:border-primary/50 hover:bg-gray-50",
                          formData.category === sub.id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-200 text-gray-600"
                        )}
                      >
                        <span className="font-semibold text-center">{sub.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="ghost"
                      onClick={() => { setParentCategory(null); updateData("category", ""); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      Change main category
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Location & Basics */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Where is your place located?</h2>
                <p className="text-gray-500 mb-6">Help guests find you.</p>

                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Enter your address"
                    className="pl-10 h-12 text-lg"
                    value={formData.location}
                    onChange={(e) => updateData("location", e.target.value)}
                  />
                  <div className="mt-4">
                    <Label>Province</Label>
                    <Select onValueChange={(v) => updateData('province', v)} value={formData.province}>
                      <SelectTrigger className="h-12 mt-1">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Share some basics about your place</h3>

                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-gray-700">Guests</span>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline" size="icon" className="rounded-full w-8 h-8"
                      onClick={() => updateData("guests", Math.max(1, formData.guests - 1))}
                    >
                      -
                    </Button>
                    <span className="w-4 text-center font-medium">{formData.guests}</span>
                    <Button
                      variant="outline" size="icon" className="rounded-full w-8 h-8"
                      onClick={() => updateData("guests", formData.guests + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-gray-700">Bedrooms</span>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline" size="icon" className="rounded-full w-8 h-8"
                      onClick={() => updateData("bedrooms", Math.max(0, formData.bedrooms - 1))}
                    >
                      -
                    </Button>
                    <span className="w-4 text-center font-medium">{formData.bedrooms}</span>
                    <Button
                      variant="outline" size="icon" className="rounded-full w-8 h-8"
                      onClick={() => updateData("bedrooms", formData.bedrooms + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <span className="text-gray-700">Bathrooms</span>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline" size="icon" className="rounded-full w-8 h-8"
                      onClick={() => updateData("bathrooms", Math.max(0, formData.bathrooms - 0.5))}
                    >
                      -
                    </Button>
                    <span className="w-4 text-center font-medium">{formData.bathrooms}</span>
                    <Button
                      variant="outline" size="icon" className="rounded-full w-8 h-8"
                      onClick={() => updateData("bathrooms", formData.bathrooms + 0.5)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Amenities */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">What does your place offer?</h2>
                <p className="text-gray-500">Select all the amenities available to guests.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {AMENITIES.map((amenity) => (
                  <button
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border transition-all text-left hover:border-gray-300",
                      formData.amenities.includes(amenity)
                        ? "border-black bg-gray-50 ring-1 ring-black"
                        : "border-gray-200"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                      formData.amenities.includes(amenity)
                        ? "bg-black border-black text-white"
                        : "border-gray-300"
                    )}>
                      {formData.amenities.includes(amenity) && <Check className="w-3 h-3" />}
                    </div>
                    <span className="font-medium text-sm">{amenity}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Photos & Description */}
          {step === 4 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Let's describe your place</h2>
                <p className="text-gray-500 mb-6">Short titles work best. Have fun with it!</p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="e.g., Cozy Cottage in the Winelands"
                      value={formData.title}
                      onChange={(e) => updateData("title", e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe the decor, light, what's nearby, etc..."
                      className="h-32 resize-none"
                      value={formData.description}
                      onChange={(e) => updateData("description", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Property Photos</Label>
                    <p className="text-sm text-gray-500 mb-2">Upload up to 5 photos of your property.</p>
                    <ImageUpload
                      value={formData.images}
                      onChange={(urls) => updateData("images", urls)}
                      onRemove={(url) => updateData("images", formData.images.filter(i => i !== url))}
                      bucket="property-images"
                      maxFiles={5}
                    />
                  </div>

                  {/* Video Upload - Locked for Free Plan */}
                  <div className="space-y-3 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Showcase Video</Label>
                        <p className="text-sm text-gray-500 mt-0.5">Add a video tour to attract more guests</p>
                      </div>
                      {plan === 'free' && (
                        <div className="flex items-center text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-full border border-amber-200">
                          <Lock className="w-3 h-3 mr-1.5" />
                          Standard Plan
                        </div>
                      )}
                      {plan !== 'free' && formData.video_url && (
                        <div className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1.5 rounded-full border border-green-200">
                          <Video className="w-3 h-3 mr-1.5" />
                          Video Added
                        </div>
                      )}
                    </div>

                    {plan === 'free' ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 bg-gray-50/50">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                            <Video className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-500">Video upload is locked</p>
                          <p className="text-xs text-gray-400 mt-1 mb-4">Upgrade to Standard or Premium to add a video tour</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-primary border-primary hover:bg-primary/5"
                            onClick={() => navigate('/host/subscription')}
                          >
                            Upgrade Plan
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <VideoUpload
                        value={formData.video_url}
                        onChange={(url) => updateData("video_url", url)}
                        bucket="property-videos"
                        maxSizeMB={100}
                      />
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Step 5: Pricing */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center max-w-lg mx-auto">
                <h2 className="text-2xl font-bold mb-2">Now, set your price</h2>
                <p className="text-gray-500 mb-8">You can change it anytime.</p>

                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg inline-block w-full max-w-sm">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-4xl font-bold text-gray-300">R</span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="text-4xl font-bold border-none text-center w-40 h-16 p-0 focus-visible:ring-0 placeholder:text-gray-200"
                      value={formData.price}
                      onChange={(e) => updateData("price", e.target.value)}
                    />
                  </div>
                  <div className="text-center text-gray-500 font-medium">per night</div>

                  <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">IdealStay service fee</span>
                      <span className="font-medium">R{Math.round(Number(formData.price) * 0.03)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">You earn</span>
                      <span className="font-bold text-green-600">R{Math.round(Number(formData.price) * 0.97)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="pt-8 mt-8 border-t border-gray-100 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1 || isSubmitting}
            className="text-gray-500 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={step === 5 ? handleSubmit : handleNext}
            className="bg-black hover:bg-gray-800 text-white px-8 rounded-xl h-12 text-base"
            disabled={(step === 1 && !formData.category) || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                {step === 5 ? "Publish Listing" : "Next"}
                {step !== 5 && <ChevronRight className="w-4 h-4 ml-2" />}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
