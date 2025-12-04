
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ui/image-upload";
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
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { geocodeAddress } from "@/lib/geocoding";

const CATEGORIES = [
  { id: "apartment", label: "Apartment", icon: Building2 },
  { id: "house", label: "House", icon: Home },
  { id: "guesthouse", label: "Guesthouse", icon: Warehouse },
  { id: "beach", label: "Beachfront", icon: Waves },
  { id: "safari", label: "Safari", icon: Trees },
  { id: "winelands", label: "Winelands", emoji: "🍇" },
  { id: "city", label: "City", icon: Building2 },
  { id: "mountain", label: "Mountain", icon: Mountain },
  { id: "pool", label: "Amazing Pool", emoji: "🏊" },
  { id: "unique", label: "Unique", icon: Tent },
] as const;

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
  const [formData, setFormData] = useState({
    category: "",
    location: "",
    province: "",
    guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [] as string[],
    title: "",
    description: "",
    price: "",
    images: [] as string[]
  });

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
        host_id: user.id,
        latitude,
        longitude,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your listing has been published.",
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
                <h2 className="text-2xl font-bold mb-2">Which of these best describes your place?</h2>
                <p className="text-gray-500">Select a category that matches your property type.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateData("category", cat.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all hover:border-primary/50 hover:bg-gray-50",
                      formData.category === cat.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 text-gray-600"
                    )}
                  >
                    {"icon" in cat && cat.icon ? (
                      <cat.icon className="w-8 h-8 mb-3" />
                    ) : (
                      <span className="text-3xl mb-3">{(cat as any).emoji}</span>
                    )}
                    <span className="font-semibold">{cat.label}</span>
                  </button>
                ))}
              </div>
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
