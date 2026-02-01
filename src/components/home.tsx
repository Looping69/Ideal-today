import { useState, useEffect } from "react";
import Header from "./layout/Header";
import Footer from "./layout/Footer";
import FilterBar from "./listings/FilterBar";
import PropertyGrid from "./listings/PropertyGrid";
import PropertyCard from "./listings/PropertyCard";
import PropertyDetails from "./listings/PropertyDetails";
import SearchFilterBar from "./search/SearchFilterBar";
import PropertyMap from "./listings/PropertyMap";
import { Property } from "@/types/property";
import { Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

function Home() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchState, setSearchState] = useState<{ query: string; guests: number; date?: any } | null>(null);
  const [chatActive, setChatActive] = useState(false);
  const [chatSeed, setChatSeed] = useState<string | undefined>(undefined);

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
        const mappedProperties: Property[] = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          location: p.location,
          province: p.province || undefined,
          price: p.price,
          rating: p.rating || 0,
          reviews: p.reviews_count || 0,
          image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-27b88e54e621?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          images: p.images || [],
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
          isFeatured: p.is_featured === true,
          isVerifiedHost: p.host?.host_plan && p.host.host_plan !== 'free'
        }));

        // Sort by host plan priority: premium > standard > free
        const planPriority = { premium: 0, standard: 1, free: 2 };
        const sortedProperties = mappedProperties.sort((a, b) => {
          const aPlan = (data.find((d: any) => d.id === a.id)?.host?.host_plan || 'free') as keyof typeof planPriority;
          const bPlan = (data.find((d: any) => d.id === b.id)?.host?.host_plan || 'free') as keyof typeof planPriority;
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

  const handleFilterChange = (category: string) => {
    if (category === "all") {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(p => {
        // 1. Direct category match (DB tags from 'categories' column)
        if (p.categories?.includes(category)) return true;

        // 2. Type match (e.g. 'apartment' matches 'Apartment')
        if (p.type.toLowerCase().includes(category.toLowerCase())) return true;

        // 3. Province match
        if (p.province && p.province.toLowerCase().includes(category.replace(/-/g, ' ').toLowerCase())) return true;

        // 4. Amenity match
        if (p.amenities.some(a => a.toLowerCase().includes(category.toLowerCase()))) return true;

        // 5. Fallback: Search in location string (generic)
        if (p.location.toLowerCase().includes(category.replace(/-/g, ' ').toLowerCase())) return true;

        return false;
      });
      setFilteredProperties(filtered);
    }
  };

  const handleSearchChange = async (state: { query: string; guests: number; date?: { from?: Date; to?: Date } }) => {
    setSearchState(state);
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
        (data || []).forEach((b: any) => {
          const bi = new Date(b.check_in);
          const bo = new Date(b.check_out);
          if (bo > from && bi < to) {
            unavailable.add(b.property_id);
          }
        });
        arr = arr.filter(p => !unavailable.has(p.id));
      } catch { }
    }
    setFilteredProperties(arr);
  };

  const handleModeChange = (mode: 'chat' | 'search') => {
    setChatActive(mode === 'chat');
  };

  const handleSendMessage = (msg: string) => {
    if (msg && msg.trim()) {
      setChatSeed(msg.trim());
      setChatActive(true);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 pt-32 pb-12">
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
                {/* Featured Listings Section */}
                {filteredProperties.filter(p => p.isFeatured).length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <span className="text-white text-lg">★</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Featured Listings</h2>
                        <p className="text-sm text-gray-500">Top-rated stays from verified hosts</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                        {filteredProperties
                          .filter(p => p.isFeatured)
                          .slice(0, 6)
                          .map((property) => (
                            <div key={property.id} className="min-w-[300px] max-w-[300px] snap-start">
                              <PropertyCard property={property} onClick={handlePropertyClick} />
                            </div>
                          ))}
                      </div>
                      {/* Gradient fade on edges */}
                      <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* All Listings Section */}
                <div>
                  {filteredProperties.filter(p => p.isFeatured).length > 0 && (
                    <h2 className="text-xl font-bold text-gray-900 mb-6">All Listings</h2>
                  )}
                  <PropertyGrid
                    properties={filteredProperties.filter(p => !p.isFeatured || filteredProperties.filter(fp => fp.isFeatured).length === 0 ? true : !p.isFeatured)}
                    onPropertyClick={handlePropertyClick}
                    compact={true}
                  />
                </div>

                {/* Load More Button */}
                {hasMore && !loading && (
                  <div className="mt-12 flex justify-center">
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      size="lg"
                      className="min-w-[200px]"
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
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
