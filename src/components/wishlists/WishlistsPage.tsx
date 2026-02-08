
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import PropertyCard from "@/components/listings/PropertyCard";
import { Property } from "@/types/property";

export default function WishlistsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<Property[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('wishlists')
        .select(`property_id, properties(*)`)
        .eq('user_id', user.id);
      if (!error && data) {
        const mapped: Property[] = data.map((row: any) => ({
          id: row.properties.id,
          title: row.properties.title,
          location: row.properties.location,
          price: row.properties.price,
          rating: row.properties.rating,
          reviews: row.properties.reviews_count,
          image: row.properties.image,
          images: row.properties.images || [],
          video_url: row.properties.video_url,
          type: row.properties.type,
          amenities: row.properties.amenities || [],
          guests: row.properties.guests,
          bedrooms: row.properties.bedrooms,
          bathrooms: row.properties.bathrooms,
          description: row.properties.description,
          host: { name: '', image: '', joined: '' },
          coordinates: { lat: row.properties.latitude || 0, lng: row.properties.longitude || 0 }
        }));
        setItems(mapped);
      }
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen pt-20 pb-12 container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-8">Wishlists</h1>

      {(!items || items.length === 0) ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">No saved properties yet.</p>
          <Button onClick={() => navigate("/")}>Discover properties</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map(p => (
            <PropertyCard key={p.id} property={p} onClick={() => navigate("/")} />
          ))}
        </div>
      )}
    </div>
  );
}
