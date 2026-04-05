import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Property } from "@/types/property";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import PropertyView from "./PropertyView";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";

export default function PropertyPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProperty = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('properties')
                .select(`
          *,
          host:profiles!properties_host_id_fkey(full_name, avatar_url, created_at)
        `)
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            if (!data) throw new Error("Property not found");

            // Map Supabase data to Property type
            const mapped: Property = {
                id: data.id,
                title: data.title,
                description: data.description,
                location: data.location,
                price: data.price,
                rating: data.rating,
                reviews: data.reviews,
                image: data.image,
                images: data.images || [],
                video_url: data.video_url,
                type: data.type,
                guests: data.guests,
                adults: data.adults,
                children: data.children,
                bedrooms: data.bedrooms,
                bathrooms: data.bathrooms,
                amenities: data.amenities || [],
                facilities: data.facilities || [],
                other_facility: data.other_facility,
                is_self_catering: data.is_self_catering,
                has_restaurant: data.has_restaurant,
                restaurant_offers: data.restaurant_offers || [],
                host: {
                    name: data.host?.full_name || 'Host',
                    image: data.host?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Host',
                    joined: data.host?.created_at ? new Date(data.host.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '2024',
                },
                coordinates: {
                    lat: data.latitude || -33.9249,
                    lng: data.longitude || 18.4241,
                },
                cleaning_fee: data.cleaning_fee,
                service_fee: data.service_fee,
                discount: data.discount,
                area: data.area,
                is_wishlisted: false,
            };

            setProperty(mapped);
        } catch (e: unknown) {
            const message = getErrorMessage(e);
            console.error("Error fetching property:", message);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchProperty();
        }
    }, [id, fetchProperty]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-2/3" />
                        <Skeleton className="h-[400px] w-full rounded-xl" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-4">
                                <Skeleton className="h-40 w-full" />
                                <Skeleton className="h-40 w-full" />
                            </div>
                            <div className="md:col-span-1">
                                <Skeleton className="h-[500px] w-full rounded-xl" />
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-2">Property Not Found</h1>
                        <p className="text-gray-600 mb-6">{error || "The property you are looking for does not exist."}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto bg-white shadow-sm my-4 rounded-xl overflow-hidden max-w-6xl">
                <PropertyView property={property} />
            </main>
            <Footer />
        </div>
    );
}
