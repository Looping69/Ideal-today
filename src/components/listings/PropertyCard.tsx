
import { useEffect, useState, useRef } from "react";
import { Property } from "@/types/property";
import { Star, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
  onClick: (property: Property) => void;
}

export default function PropertyCard({ property, onClick }: PropertyCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.play().catch(err => console.log("Video auto-play blocked or failed", err));
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

  useEffect(() => {
    const checkSaved = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("wishlists")
        .select("property_id")
        .eq("user_id", user.id)
        .eq("property_id", property.id)
        .limit(1);
      setSaved(!!data && data.length > 0);
    };
    checkSaved();
  }, [user, property.id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ variant: "destructive", title: "Sign in required", description: "Log in to save wishlists." });
      return;
    }
    if (saved) {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", property.id);
      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to remove from wishlist." });
      } else {
        setSaved(false);
      }
    } else {
      const { error } = await supabase
        .from("wishlists")
        .insert({ user_id: user.id, property_id: property.id });
      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to add to wishlist." });
      } else {
        setSaved(true);
      }
    }
  };

  return (
    <div
      className="group cursor-pointer flex flex-col gap-3"
      onClick={() => onClick(property)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[20/19] overflow-hidden rounded-xl bg-gray-200 isolate">
        <img
          src={property.image}
          alt={property.title}
          className={cn(
            "h-full w-full object-cover transition-all duration-500 group-hover:scale-105",
            isHovered && property.video_url ? "opacity-0 scale-110" : "opacity-100"
          )}
        />

        {property.video_url && (
          <video
            ref={videoRef}
            src={property.video_url}
            muted
            loop
            playsInline
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-105"
            )}
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <button
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-all active:scale-90 z-10"
          onClick={toggleWishlist}
        >
          <Heart
            className={`w-6 h-6 transition-colors ${saved ? "text-red-500 fill-red-500" : "text-white fill-black/40"}`}
            strokeWidth={2}
          />
        </button>

        {/* Badges row */}
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          {property.isVerifiedHost && (
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-sm hover:from-blue-600 hover:to-indigo-700 px-2.5 py-1 border-none">
              ✓ Verified
            </Badge>
          )}
          {property.rating >= 4.8 && (
            <Badge variant="secondary" className="bg-white/95 text-black font-semibold shadow-sm hover:bg-white px-2.5 py-1 backdrop-blur-sm border-none">
              Guest favorite
            </Badge>
          )}
        </div>

        {/* Carousel Dots (Mock) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-sm" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-sm" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-sm" />
          <div className="w-1 h-1 rounded-full bg-white/60 shadow-sm" />
        </div>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-base text-gray-900 truncate leading-tight">{property.location}</h3>
          <p className="text-gray-500 text-sm mt-0.5 truncate">Hosted by {property.host.name}</p>
          <p className="text-gray-500 text-sm truncate">Oct 23 - 28</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="font-semibold text-gray-900">R{property.price.toLocaleString()}</span>
            <span className="text-gray-900">night</span>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Star className="w-3.5 h-3.5 fill-black text-black" />
          <span className="text-sm font-medium text-gray-900">{property.rating}</span>
        </div>
      </div>
    </div>
  );
}

