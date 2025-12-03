
import { useEffect, useState } from "react";
import { Property } from "@/data/mockData";
import { Star, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface PropertyCardProps {
  property: Property;
  onClick: (property: Property) => void;
}

export default function PropertyCard({ property, onClick }: PropertyCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);

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
      className="group cursor-pointer flex flex-col gap-2"
      onClick={() => onClick(property)}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-200">
        <img
          src={property.image}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <button className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors" onClick={toggleWishlist}>
          <Heart className={`w-6 h-6 ${saved ? "text-red-500 fill-red-500" : "text-white fill-black/50"}`} />
        </button>
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-black font-medium hover:bg-white">
            Guest favorite
          </Badge>
        </div>
      </div>
      
      <div className="flex justify-between items-start mt-1">
        <h3 className="font-semibold text-base truncate pr-2">{property.location}</h3>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-black text-black" />
          <span className="text-sm font-light">{property.rating}</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-0.5 text-gray-500 text-sm">
        <p className="truncate text-gray-500">Hosted by {property.host.name}</p>
        <p className="truncate text-gray-500">Oct 23 - 28</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="font-semibold text-black text-base">R{property.price}</span>
          <span className="text-black">night</span>
        </div>
      </div>
    </div>
  );
}
