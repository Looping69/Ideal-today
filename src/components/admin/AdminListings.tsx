import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, MoreHorizontal, Filter, Star, StarOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type Row = { id: string; title: string; location: string; price: number; image?: string; is_featured?: boolean };

export default function AdminListings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('properties').select('id,title,location,price,image,is_featured').limit(50);
      const list = ((data as any[]) || []).map(r => ({ id: r.id, title: r.title, location: r.location, price: r.price, image: r.image, is_featured: r.is_featured ?? false }));
      setRows(list);

      const todayIso = new Date().toISOString();
      const { data: bookings } = await supabase
        .from('bookings')
        .select('property_id, check_in, check_out, status')
        .lte('check_in', todayIso)
        .gt('check_out', todayIso)
        .not('status', 'in', '("canceled","blocked")');

      const ids = new Set<string>();
      (bookings || []).forEach((b: any) => {
        ids.add(b.property_id);
      });
      setBookedIds(ids);
      setLoading(false);
    };
    load();
  }, []);

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('properties')
      .update({ is_featured: newStatus })
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update featured status.',
      });
      return;
    }

    setRows(prev => prev.map(r => r.id === id ? { ...r, is_featured: newStatus } : r));
    toast({
      title: newStatus ? 'Listing Featured' : 'Listing Unfeatured',
      description: newStatus ? 'This listing will now appear in the featured section.' : 'This listing has been removed from featured.',
    });
  };

  const filtered = rows.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Listings Management</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor and manage property listings.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-64 bg-white border-gray-200 focus:border-primary focus:ring-primary/20 rounded-xl"
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-xl border-gray-200">
            <Filter className="w-4 h-4 text-gray-500" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Property</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Location</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Price</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Featured</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td className="px-6 py-12 text-center text-gray-500" colSpan={6}>Loading listings...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-6 py-12 text-center text-gray-500" colSpan={6}>No listings found</td></tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-all">
                          <img src={r.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60"} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">{r.title}</p>
                            {r.is_featured && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                <Star className="w-3 h-3 mr-0.5 fill-amber-500" />
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">ID: {r.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-[150px]">{r.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      R{r.price.toLocaleString()}
                      <span className="text-xs text-gray-400 font-normal ml-1">/night</span>
                    </td>
                    <td className="px-6 py-4">
                      {bookedIds.has(r.id) ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                          Booked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                          Available
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        variant={r.is_featured ? "default" : "outline"}
                        className={`h-8 px-3 text-xs font-medium ${r.is_featured ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => toggleFeatured(r.id, r.is_featured ?? false)}
                      >
                        {r.is_featured ? (
                          <>
                            <StarOff className="w-3.5 h-3.5 mr-1" />
                            Unfeature
                          </>
                        ) : (
                          <>
                            <Star className="w-3.5 h-3.5 mr-1" />
                            Feature
                          </>
                        )}
                      </Button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

