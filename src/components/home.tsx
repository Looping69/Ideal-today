import { useState, useEffect } from "react";
import Header from "./layout/Header";
import Footer from "./layout/Footer";
import FilterBar from "./listings/FilterBar";
import PropertyGrid from "./listings/PropertyGrid";
import PropertyDetails from "./listings/PropertyDetails";
import SearchFilterBar from "./search/SearchFilterBar";
import AIChatPanel from "./ai/AIChatPanel";
import PropertyMap from "./listings/PropertyMap";
import { Property } from "@/data/mockData";
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

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            host:profiles!properties_host_id_fkey(full_name, avatar_url, created_at)
          `);
        
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
            rating: p.rating,
            reviews: p.reviews_count,
            image: p.image,
            images: p.images || [],
            type: p.type,
            amenities: p.amenities || [],
            guests: p.guests,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            description: p.description,
            host: {
              name: p.host?.full_name || 'Unknown Host',
              image: p.host?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown',
              joined: p.host?.created_at ? new Date(p.host.created_at).getFullYear().toString() : '2024'
            },
            coordinates: {
              lat: p.latitude || 0,
              lng: p.longitude || 0
            }
          }));
          setProperties(mappedProperties);
          setFilteredProperties(mappedProperties);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setIsDetailsOpen(true);
  };

  const handleFilterChange = (category: string) => {
    if (category === "all") {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(p => {
        const typeMatch = p.type.toLowerCase().includes(category.toLowerCase());
        const amenityMatch = p.amenities.some(a => a.toLowerCase().includes(category.toLowerCase()));
        const locationMatch = p.location.toLowerCase().includes(category.toLowerCase());
        const provinceMatch = p.province ? p.province.toLowerCase().includes(category.replace('-', ' ').toLowerCase()) : false;
        
        if (category === "beach") return p.location.toLowerCase().includes("camps bay") || p.location.toLowerCase().includes("umhlanga");
        if (category === "safari") return p.location.toLowerCase().includes("kruger");
        if (category === "winelands") return p.location.toLowerCase().includes("franschhoek");
        if (category === "city") return p.location.toLowerCase().includes("johannesburg") || p.location.toLowerCase().includes("cape town");
        if (["western-cape","eastern-cape","northern-cape","gauteng","kwazulu-natal","free-state","north-west","mpumalanga","limpopo"].includes(category)) return provinceMatch;
        
        return typeMatch || amenityMatch || locationMatch;
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
      } catch {}
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
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Search - Only visible on larger screens or when needed */}
          <div className={`hidden md:block ${chatActive ? 'pb-[300px] transition-all duration-500' : 'mt-4 mb-4'}`}>
            <SearchFilterBar onChange={handleSearchChange} onModeChange={handleModeChange} onSendMessage={handleSendMessage} />
          </div>

          <FilterBar onFilterChange={handleFilterChange} />
          
          <div className="mt-6">
            {loading ? (
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
                  apiKey="AIzaSyA3LjUTBfGCrwazlqatey_UsoJnl0lj-B4"
                />
              </div>
            ) : (
              <PropertyGrid 
                properties={filteredProperties} 
                onPropertyClick={handlePropertyClick} 
              />
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
