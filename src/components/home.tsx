import { useState, useEffect } from "react";
import Header from "./layout/Header";
import Footer from "./layout/Footer";
import FilterBar from "./listings/FilterBar";
import PropertyGrid from "./listings/PropertyGrid";
import PropertyDetails from "./listings/PropertyDetails";
import SearchFilterBar from "./search/SearchFilterBar";
import PropertyMap from "./listings/PropertyMap";
import { Property } from "@/types/property";
import { Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/constants/categories";
import FeaturedCarousel from "./listings/FeaturedCarousel";
import SEO from "./SEO";

function Home() {
  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": "IdealStay",
    "description": "Premium holiday accommodation and vacation rentals in South Africa.",
    "url": "https://idealstay.co.za",
    "logo": "https://idealstay.co.za/logo.png",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Cape Town",
      "addressRegion": "Western Cape",
      "addressCountry": "ZA"
    },
    "potentialAction": {
      "@type": "ReserveAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://idealstay.co.za",
        "actionPlatform": [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform"
        ]
      },
      "result": {
        "@type": "LodgingReservation",
        "name": "Holiday Stay Reservation"
      }
    }
  };
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatActive, setChatActive] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  const fetchProperties = async (pageNumber: number) => {
    try {
      const from = pageNumber * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
        host:profiles!properties_host_id_fkey(full_name, avatar_url, created_at, host_plan)
        `)
        .eq('approval_status', 'approved')
        .range(from, to);

      if (error) {
        console.error('Error fetching properties:', error);
        return;
      }

      if (data) {
        const mappedProperties: Property[] = data.map((p) => ({
          id: p.id,
          title: p.title,
          location: p.location,
          province: p.province || undefined,
          price: p.price,
          rating: p.rating || 0,
          reviews: p.reviews_count || 0,
          image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-27b88e54e621?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          images: p.images || [],
          video_url: p.video_url,
          type: p.type,
          amenities: p.amenities || [],
          guests: p.guests,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          description: p.description,
          host: {
            name: p.host?.full_name || p.host_name || 'Unknown Host',
            image: p.host?.avatar_url || p.host_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown',
            joined: p.host?.created_at ? new Date(p.host.created_at).getFullYear().toString() : (p.host_joined || '2024')
          },
          coordinates: {
            lat: p.latitude || 0,
            lng: p.longitude || 0
          },
          cleaning_fee: p.cleaning_fee || 0,
          service_fee: p.service_fee || 0,
          categories: p.categories || [],
          area: p.area,
          adults: p.adults,
          children: p.children,
          is_self_catering: p.is_self_catering,
          has_restaurant: p.has_restaurant,
          restaurant_offers: p.restaurant_offers || [],
          facilities: p.facilities || [],
          other_facility: p.other_facility,
          discount: p.discount || 0,
          isFeatured: p.is_featured === true,
          isVerifiedHost: p.host?.host_plan && p.host.host_plan !== 'free',
          is_occupied: p.is_occupied === true
        }));

        // Sort by host plan priority: premium > standard > free
        const planPriority = { premium: 0, standard: 1, free: 2 };
        const sortedProperties = mappedProperties.sort((a, b) => {
          const aPlan = (data.find((d) => d.id === a.id)?.host?.host_plan || 'free') as keyof typeof planPriority;
          const bPlan = (data.find((d) => d.id === b.id)?.host?.host_plan || 'free') as keyof typeof planPriority;
          return (planPriority[aPlan] ?? 2) - (planPriority[bPlan] ?? 2);
        });

        if (pageNumber === 0) {
          setProperties(sortedProperties);
          setFilteredProperties(sortedProperties);
        } else {
          setProperties(prev => [...prev, ...sortedProperties]);
          setFilteredProperties(prev => [...prev, ...sortedProperties]);
        }

        if (data.length < PAGE_SIZE) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(0);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProperties(nextPage);
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setIsDetailsOpen(true);
  };

  const handleFilterChange = (categoryId: string) => {
    if (categoryId === "all") {
      setFilteredProperties(properties);
    } else {
      // Find if it's a parent category
      const parentCategory = CATEGORIES.find(c => c.id === categoryId);
      const subCategoryIds = parentCategory ? parentCategory.subcategories.map(s => s.id) : [categoryId];

      const filtered = properties.filter(p => {
        // 1. Check if property has any of the target category IDs (parent or specific sub)
        const matchesCategory = p.categories?.some(cat =>
          subCategoryIds.includes(cat) || (parentCategory && cat === categoryId)
        );
        if (matchesCategory) return true;

        // 2. Type match (check against label or ID)
        const matchesType = subCategoryIds.some(id =>
          p.type.toLowerCase().includes(id.replace(/-/g, ' ').toLowerCase()) ||
          (parentCategory && p.type.toLowerCase().includes(parentCategory.label.toLowerCase()))
        );
        if (matchesType) return true;

        // 3. Label match from CATEGORIES (for more accurate filtering)
        const targetLabels = parentCategory
          ? [parentCategory.label, ...parentCategory.subcategories.map(s => s.label)]
          : [CATEGORIES.flatMap(c => c.subcategories).find(s => s.id === categoryId)?.label].filter(Boolean) as string[];

        const matchesLabel = targetLabels.some(label =>
          p.categories?.includes(label) ||
          p.type.toLowerCase().includes(label.toLowerCase()) ||
          p.description.toLowerCase().includes(label.toLowerCase())
        );
        if (matchesLabel) return true;

        // 4. Fallback search (existing logic preserved)
        if (p.province && p.province.toLowerCase().includes(categoryId.replace(/-/g, ' ').toLowerCase())) return true;
        if (p.amenities.some(a => a.toLowerCase().includes(categoryId.toLowerCase()))) return true;
        if (p.location.toLowerCase().includes(categoryId.replace(/-/g, ' ').toLowerCase())) return true;

        return false;
      });
      setFilteredProperties(filtered);
    }
  };

  const handleSearchChange = async (state: { query: string; guests: number; date?: { from?: Date; to?: Date } }) => {
    let arr = properties;
    if (state.query?.trim()) {
      const q = state.query.toLowerCase();
      arr = arr.filter(p => p.location.toLowerCase().includes(q) || p.title.toLowerCase().includes(q));
    }
    if (state.guests && state.guests > 0) {
      arr = arr.filter(p => (p.guests || 0) >= state.guests);
    }
    if (state.date?.from && state.date?.to) {
      const from = state.date.from;
      const to = state.date.to;
      try {
        const { data } = await supabase
          .from('bookings')
          .select('property_id, check_in, check_out, status')
          .neq('status', 'canceled');
        const unavailable = new Set<string>();
        (data || []).forEach((b) => {
          const bi = new Date(b.check_in);
          const bo = new Date(b.check_out);
          if (bo > from && bi < to) {
            unavailable.add(b.property_id);
          }
        });
        arr = arr.filter(p => !unavailable.has(p.id));
      } catch (err) {
        console.error('Error checking availability:', err);
      }
    }
    setFilteredProperties(arr);
  };

  const handleModeChange = (mode: 'chat' | 'search') => {
    setChatActive(mode === 'chat');
  };

  const handleSendMessage = (msg: string) => {
    if (msg && msg.trim()) {
      setChatActive(true);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <SEO
        title="Find Perfect Holiday Accommodation"
        description="Browse thousands of verified holiday rentals, self-catering apartments, and luxury villas across South Africa. Best price guaranteed on IdealStay."
        keywords="holiday accommodation, self catering, vacation rentals, stays south africa, cape town stays"
        schema={homeSchema}
      />
      <Header />

      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Search - Only visible on larger screens or when needed */}
          <div className={`hidden md:block ${chatActive ? 'pb-[300px] transition-all duration-500' : 'mt-4 mb-4'}`}>
            <SearchFilterBar onChange={handleSearchChange} onModeChange={handleModeChange} onSendMessage={handleSendMessage} />
          </div>

          <FilterBar onFilterChange={handleFilterChange} />

          <div className="mt-6">
            {loading && page === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 pb-20">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3">
                    <div className="h-[300px] w-full bg-gray-200 rounded-xl animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : showMap ? (
              <div className="h-[600px] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <PropertyMap
                  properties={filteredProperties}
                  onPropertyClick={handlePropertyClick}
                  apiKey={import.meta.env.GOOGLE_MAPS_KEY}
                />
              </div>
            ) : (
              <>
                {/* Featured Listings Section - Moved outside container for full width */}
              </>
            )}
          </div>
        </div>

        {!loading && !showMap && filteredProperties.filter(p => p.isFeatured && !p.is_occupied).length > 0 && (
          <FeaturedCarousel
            properties={filteredProperties.filter(p => p.isFeatured && !p.is_occupied).slice(0, 10)}
            onPropertyClick={handlePropertyClick}
          />
        )}

        <div className="container mx-auto px-4">
          {!loading && !showMap && (
            <>
              {/* All Listings Section */}
              <div className="mt-8">
                {filteredProperties.filter(p => p.isFeatured).length > 0 && (
                  <h2 className="text-xl font-bold text-gray-900 mb-6 font-primary tracking-tight">All Stays</h2>
                )}
                <PropertyGrid
                  properties={filteredProperties.filter(p => !p.isFeatured || filteredProperties.filter(fp => fp.isFeatured).length === 0 ? true : !p.isFeatured)}
                  onPropertyClick={handlePropertyClick}
                  compact={true}
                />
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-12 flex justify-center pb-20">
                  <Button
                    onClick={loadMore}
                    variant="outline"
                    size="lg"
                    className="min-w-[200px] rounded-xl hover:bg-gray-50 border-gray-200 font-semibold"
                  >
                    {loading ? 'Discovering more...' : 'Discover more stays'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Map/List Toggle Button */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30">
        <Button
          onClick={() => setShowMap(!showMap)}
          className="rounded-full bg-gradient-to-r from-primary to-blue-400 text-white hover:opacity-90 px-6 py-6 shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
        >
          {showMap ? (
            <>
              <span>Show list</span>
              <List className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Show map</span>
              <Map className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      <Footer />

      <PropertyDetails
        property={selectedProperty}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}

export default Home;
