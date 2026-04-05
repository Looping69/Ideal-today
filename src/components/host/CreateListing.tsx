
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ui/image-upload";
import VideoUpload from "@/components/ui/video-upload";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Loader2,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { geocodeAddress } from "@/lib/geocoding";
import { getErrorMessage } from "@/lib/errors";
import { invokePropertiesApi } from "@/lib/backend";

import { CATEGORIES } from "@/constants/categories";
import { CATEGORY_ICONS } from "@/components/icons/CategoryIcons";

const AMENITIES = [
  "Wifi", "Kitchen", "Private Swimming Pool", "Hot tub", "Air conditioning",
  "Heating", "Washer", "Dryer", "Parking", "Gym",
  "Workspace", "TV", "Fireplace", "BBQ grill"
];

const FACILITIES = [
  "Swimming Pool",
  "Heated Swimming Pool",
  "Jacuzzi",
  "Sauna",
  "Games Room",
  "Laundry",
  "Tennis Court",
  "Chess",
  "Trampoline",
  "Communal Braai area and Boma",
  "Hiking Trails",
  "Game View Points",
  "Game Drives",
  "Other"
];

const PROVINCES = [
  'Western Cape', 'Eastern Cape', 'Northern Cape', 'Gauteng', 'KwaZulu-Natal', 'Free State', 'North West', 'Mpumalanga', 'Limpopo'
] as const;

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { id } = useParams();
  const isEditMode = !!id;
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentCategory, setParentCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    location: "",
    area: "",
    province: "",
    title: "", // This is the Property/Lodge Name
    adults: 2,
    children: 0,
    bedrooms: 1,
    bathrooms: 1,
    is_self_catering: false,
    has_restaurant: false,
    restaurant_offers: [] as string[],
    amenities: [] as string[],
    facilities: [] as string[],
    other_facility: "",
    description: "",
    price: "",
    discount: "0",
    images: [] as string[],
    video_url: null as string | null,
    is_occupied: false
  });

  const [plan, setPlan] = useState<'free' | 'standard' | 'professional' | 'premium'>('free');
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [canCreate, setCanCreate] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'verified' | 'rejected' | null>(null);

  const checkLimits = useCallback(async () => {
    if (!user) return;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('host_plan, verification_status')
      .eq('id', user.id)
      .single();

    const currentPlan = (profileData?.host_plan as 'free' | 'standard' | 'professional' | 'premium') || 'free';
    setPlan(currentPlan);
    const startStatus = profileData?.verification_status || 'none';
    setVerificationStatus(startStatus);

    if (profileError) {
      console.error('Error fetching plan:', profileError);
    }

    // Skip limit check if editing
    if (!isEditMode) {
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', user.id);

      if (error) {
        console.error(error);
      } else {
        const listingCount = count || 0;
        if (currentPlan === 'free' && listingCount >= 1) {
          setCanCreate(false);
        }
      }
    }
    setCheckingLimit(false);
  }, [user, isEditMode]);

  useEffect(() => {
    checkLimits();
  }, [checkLimits]);

  const fetchListingData = useCallback(async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .eq("host_id", user.id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          category: data.type || "",
          location: data.location || "",
          area: data.area || "",
          province: data.province || "",
          title: data.title || "",
          adults: data.adults || 2,
          children: data.children || 0,
          bedrooms: data.bedrooms || 1,
          bathrooms: data.bathrooms || 1,
          is_self_catering: data.is_self_catering || false,
          has_restaurant: data.has_restaurant || false,
          restaurant_offers: data.restaurant_offers || [],
          amenities: data.amenities || [],
          facilities: data.facilities || [],
          other_facility: data.other_facility || "",
          description: data.description || "",
          price: data.price?.toString() || "",
          discount: data.discount?.toString() || "0",
          images: data.images || [],
          video_url: data.video_url || null,
          is_occupied: data.is_occupied || false
        });

        // Set parent category based on subcategory
        const parent = CATEGORIES.find(c =>
          c.subcategories.some(s => s.id === data.type)
        );
        if (parent) setParentCategory(parent.id);
      }
    } catch (error: unknown) {
      console.error("Error fetching listing:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load listing data.",
      });
      navigate("/host/listings");
    }
  }, [id, user, navigate, toast]);

  useEffect(() => {
    if (isEditMode) {
      fetchListingData();
    }
  }, [isEditMode, fetchListingData]);

  const handleNext = useCallback(() => setStep(step + 1), [step]);
  const handleBack = useCallback(() => setStep(step - 1), [step]);

  const updateData = useCallback((key: string, value: string | number | boolean | string[] | null) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleAmenity = useCallback((amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  }, []);

  const toggleFacility = useCallback((facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  }, []);

  const toggleRestaurantOffer = useCallback((offer: string) => {
    setFormData(prev => ({
      ...prev,
      restaurant_offers: prev.restaurant_offers.includes(offer)
        ? prev.restaurant_offers.filter(o => o !== offer)
        : [...prev.restaurant_offers, offer]
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
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
      let latitude = -33.9249;
      let longitude = 18.4241;

      if (formData.location) {
        const addressToGeocode = formData.location + (formData.province ? `, ${formData.province}` : "");
        const coords = await geocodeAddress(addressToGeocode);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
        }
      }

      const propertyPayload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        area: formData.area,
        province: formData.province || null,
        price: Number(formData.price),
        discount: Number(formData.discount),
        type: formData.category,
        amenities: formData.amenities,
        facilities: formData.facilities,
        other_facility: formData.other_facility,
        guests: formData.adults + formData.children,
        adults: formData.adults,
        children: formData.children,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        is_self_catering: formData.is_self_catering,
        has_restaurant: formData.has_restaurant,
        restaurant_offers: formData.restaurant_offers,
        image: formData.images[0] || null,
        images: formData.images,
        video_url: formData.video_url,
        is_occupied: formData.is_occupied,
        host_id: user.id,
        latitude,
        longitude,
        approval_status: 'pending' // Always require re-approval on edit/create
      };

      await invokePropertiesApi({
        action: 'save-host-listing',
        id: isEditMode ? id : undefined,
        ...propertyPayload,
      });

      toast({
        title: isEditMode ? "Listing Updated!" : "Listing Submitted!",
        description: isEditMode
          ? "Your changes have been saved successfully."
          : "Your listing is pending admin approval and will be live once reviewed.",
      });

      navigate("/host/listings");
    } catch (error: unknown) {
      console.error("Error creating listing:", getErrorMessage(error));
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, formData, isEditMode, id, navigate, toast]);

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
                      <Button onClick={() => navigate('/pricing?audience=host')} className="h-12 px-8 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
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

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}% Completed</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 min-h-[600px] flex flex-col">
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
                  Select a category that matches your property type.
                </p>
              </div>

              {!parentCategory ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                          <IconComponent className="w-10 h-10 mb-3 transition-transform group-hover:scale-110" />
                        ) : (
                          <span className="text-3xl mb-3">{cat.icon}</span>
                        )}
                        <span className="font-semibold text-center">{cat.label}</span>
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

          {/* Step 2: Location Details */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Location Information</h2>
                <p className="text-gray-500 mb-6">Where is your property situated?</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Province</Label>
                    <Select onValueChange={(v) => updateData('province', v)} value={formData.province}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Area</Label>
                    <Input
                      placeholder="e.g., Mossel Bay, Ballito"
                      className="h-12"
                      value={formData.area}
                      onChange={(e) => updateData("area", e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Property / Lodge / Guesthouse Name</Label>
                    <Input
                      placeholder="Enter the name of your place"
                      className="h-12"
                      value={formData.title}
                      onChange={(e) => updateData("title", e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Full Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <Input
                        placeholder="Enter full street address"
                        className="pl-10 h-12"
                        value={formData.location}
                        onChange={(e) => updateData("location", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Property Info & Catering */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Property Details</h2>
                <p className="text-gray-500 mb-6">Tell us about the capacity and catering.</p>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Guests Split */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700 font-medium">Adults</span>
                        <div className="flex items-center gap-4">
                          <Button variant="outline" size="icon" className="rounded-full w-8 h-8" onClick={() => updateData("adults", Math.max(1, formData.adults - 1))}>-</Button>
                          <span className="w-4 text-center">{formData.adults}</span>
                          <Button variant="outline" size="icon" className="rounded-full w-8 h-8" onClick={() => updateData("adults", formData.adults + 1)}>+</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700 font-medium">Children</span>
                        <div className="flex items-center gap-4">
                          <Button variant="outline" size="icon" className="rounded-full w-8 h-8" onClick={() => updateData("children", Math.max(0, formData.children - 1))}>-</Button>
                          <span className="w-4 text-center">{formData.children}</span>
                          <Button variant="outline" size="icon" className="rounded-full w-8 h-8" onClick={() => updateData("children", formData.children + 1)}>+</Button>
                        </div>
                      </div>
                    </div>

                    {/* Rooms */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700 font-medium">Bedrooms</span>
                        <div className="flex items-center gap-4">
                          <Button variant="outline" size="icon" className="rounded-full w-8 h-8" onClick={() => updateData("bedrooms", Math.max(1, formData.bedrooms - 1))}>-</Button>
                          <span className="w-4 text-center">{formData.bedrooms}</span>
                          <Button variant="outline" size="icon" className="rounded-full w-8 h-8" onClick={() => updateData("bedrooms", formData.bedrooms + 1)}>+</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700 font-medium">Bathrooms</span>
                        <div className="flex items-center gap-4">
                          <Button variant="outline" size="icon" className="rounded-full w-8 h-8" onClick={() => updateData("bathrooms", Math.max(1, formData.bathrooms - 0.5))}>-</Button>
                          <span className="w-4 text-center">{formData.bathrooms}</span>
                          <Button variant="outline" size="icon" className="rounded-full w-8 h-8" onClick={() => updateData("bathrooms", formData.bathrooms + 0.5)}>+</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Catering */}
                  <div className="pt-6 space-y-4">
                    <h3 className="font-semibold text-lg">Catering Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => updateData("is_self_catering", !formData.is_self_catering)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                          formData.is_self_catering ? "border-primary bg-primary/5" : "border-gray-200"
                        )}
                      >
                        <span className="font-medium">Self-Catering</span>
                        {formData.is_self_catering && <Check className="w-5 h-5 text-primary" />}
                      </button>
                      <button
                        onClick={() => updateData("has_restaurant", !formData.has_restaurant)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                          formData.has_restaurant ? "border-primary bg-primary/5" : "border-gray-200"
                        )}
                      >
                        <span className="font-medium">Onsite Restaurant</span>
                        {formData.has_restaurant && <Check className="w-5 h-5 text-primary" />}
                      </button>
                    </div>

                    {formData.has_restaurant && (
                      <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                        <p className="text-sm font-medium text-gray-600">Restaurant offers:</p>
                        <div className="flex flex-wrap gap-3">
                          {["Breakfast", "Lunch", "Dinner"].map(meal => (
                            <button
                              key={meal}
                              onClick={() => toggleRestaurantOffer(meal)}
                              className={cn(
                                "px-4 py-2 rounded-full border transition-all text-sm font-medium",
                                formData.restaurant_offers.includes(meal)
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-gray-600 border-gray-200"
                              )}
                            >
                              {meal}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-lg mb-4">Availability Status</h3>
                  <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-all bg-gray-50 uppercase leading-tight">
                    <div className="space-y-1">
                      <span className="font-medium block text-black">Occupancy Status</span>
                      <p className="text-xs text-gray-400 normal-case font-normal leading-normal">
                        {formData.is_occupied
                          ? "This property is currently marked as occupied and will NOT appear in the featured carousel."
                          : "This property is currently available and will appear in the listings."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateData("is_occupied", !formData.is_occupied)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        formData.is_occupied ? "bg-red-500" : "bg-green-500"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          formData.is_occupied ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Offerings & Facilities */}
          {step === 4 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">What does your place offer?</h2>
                <p className="text-gray-500 mb-6">Select amenities and onsite facilities.</p>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">General Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {AMENITIES.map((amenity) => (
                        <button
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border text-sm transition-all",
                            formData.amenities.includes(amenity) ? "border-black bg-gray-50" : "border-gray-200"
                          )}
                        >
                          <div className={cn("w-4 h-4 rounded border flex items-center justify-center", formData.amenities.includes(amenity) ? "bg-black border-black text-white" : "border-gray-300")}>
                            {formData.amenities.includes(amenity) && <Check className="w-3 h-3" />}
                          </div>
                          {amenity}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Onsite Facilities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {FACILITIES.map((facility) => (
                        <button
                          key={facility}
                          onClick={() => toggleFacility(facility)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border text-sm transition-all",
                            formData.facilities.includes(facility) ? "border-black bg-gray-50" : "border-gray-200"
                          )}
                        >
                          <div className={cn("w-4 h-4 rounded border flex items-center justify-center", formData.facilities.includes(facility) ? "bg-black border-black text-white" : "border-gray-300")}>
                            {formData.facilities.includes(facility) && <Check className="w-3 h-3" />}
                          </div>
                          {facility}
                        </button>
                      ))}
                    </div>
                    {formData.facilities.includes("Other") && (
                      <Input
                        placeholder="Please specify other facilities..."
                        value={formData.other_facility}
                        onChange={(e) => updateData("other_facility", e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Photos & Description */}
          {step === 5 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Let's describe your place</h2>
                <p className="text-gray-500 mb-6">Attract guests with photos and a great description.</p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Short Description / Catchy Title</Label>
                    <Input
                      placeholder="e.g., Luxury Bush Lodge with Private Pool"
                      value={formData.description.split('\n')[0]} // Just a helper placeholder
                      onChange={(e) => updateData("description", e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Long Description</Label>
                    <Textarea
                      placeholder="Describe the decor, layout, nearby attractions, etc..."
                      className="h-32 resize-none"
                      value={formData.description}
                      onChange={(e) => updateData("description", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Property Photos</Label>
                    <p className="text-sm text-gray-500 mb-2">Upload up to 5 high-quality photos.</p>
                    <ImageUpload
                      value={formData.images}
                      onChange={(urls) => updateData("images", urls)}
                      onRemove={(url) => updateData("images", formData.images.filter(i => i !== url))}
                      bucket="property-images"
                      maxFiles={5}
                    />
                  </div>

                  {plan !== 'free' && (
                    <div className="space-y-3 pt-6 border-t border-gray-100">
                      <Label className="text-base">Showcase Video</Label>
                      <VideoUpload
                        value={formData.video_url}
                        onChange={(url) => updateData("video_url", url)}
                        bucket="property-videos"
                        maxSizeMB={100}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Pricing */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center max-w-lg mx-auto">
                <h2 className="text-2xl font-bold mb-2">Set your price and discounts</h2>
                <p className="text-gray-500 mb-8">You can offer seasonal discounts here.</p>

                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg space-y-8">
                  <div className="space-y-4">
                    <Label className="text-lg">Price per Night</Label>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-bold text-gray-300">R</span>
                      <Input
                        type="number"
                        placeholder="0"
                        className="text-4xl font-bold border-none text-center w-48 h-16 p-0 focus-visible:ring-0 placeholder:text-gray-200"
                        value={formData.price}
                        onChange={(e) => updateData("price", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t">
                    <Label className="text-lg">Discount Percentage (%)</Label>
                    <p className="text-sm text-gray-500">Optional: offer a discount to attract more guests.</p>
                    <div className="flex items-center justify-center gap-4">
                      <Input
                        type="number"
                        placeholder="0"
                        className="text-2xl font-bold text-center w-24 h-12"
                        value={formData.discount}
                        onChange={(e) => updateData("discount", e.target.value)}
                      />
                      <span className="text-2xl font-bold text-gray-400">%</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Service Fee (3%)</span>
                      <span className="font-medium">R{Math.round(Number(formData.price) * 0.03)}</span>
                    </div>
                    {Number(formData.discount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Discount Applied</span>
                        <span className="font-medium text-red-500">-R{Math.round(Number(formData.price) * (Number(formData.discount) / 100))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 font-bold">You earn approx.</span>
                      <span className="font-bold text-green-600 text-lg">
                        R{Math.round(Number(formData.price) * (1 - (Number(formData.discount) / 100)) * 0.97)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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
            onClick={step === totalSteps ? handleSubmit : handleNext}
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
                {step === totalSteps ? "Publish Listing" : "Next"}
                {step !== totalSteps && <ChevronRight className="w-4 h-4 ml-2" />}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
