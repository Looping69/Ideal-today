import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, MoreHorizontal, Filter, Star, StarOff, Pencil, Trash2, Video } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORIES } from '@/constants/categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Row = { id: string; title: string; location: string; price: number; type: string; image?: string; is_featured?: boolean; video_url?: string | null; approval_status: string };

export default function AdminListings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        console.log('Fetching properties for page:', page);
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false })
          .range(page * pageSize, page * pageSize + pageSize - 1);

        if (error) {
          console.error('Error fetching properties:', error);
          toast({
            variant: 'destructive',
            title: 'Fetch Failed',
            description: error.message
          });
          setLoading(false);
          return;
        }

        console.log('Properties data received:', data?.length || 0, 'rows');

        const list = ((data as any[]) || []).map(r => ({
          id: r.id,
          title: r.title || 'Untitled',
          location: r.location || 'Unknown Location',
          price: r.price || 0,
          type: r.type || '',
          image: r.image,
          is_featured: r.is_featured ?? false,
          video_url: r.video_url,
          approval_status: r.approval_status || 'approved'
        }));
        setRows(list);

        const todayIso = new Date().toISOString();
        const { data: bookings, error: bError } = await supabase
          .from('bookings')
          .select('property_id, check_in, check_out, status')
          .lte('check_in', todayIso)
          .gt('check_out', todayIso)
          .not('status', 'in', '("canceled","blocked")');

        if (bError) {
          console.error('Error fetching bookings status:', bError);
        }

        const ids = new Set<string>();
        (bookings || []).forEach((b: any) => {
          ids.add(b.property_id);
        });
        setBookedIds(ids);
      } catch (err: any) {
        console.error('Unexpected error in AdminListings load:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { data, error } = await supabase
      .from('properties')
      .update({ is_featured: newStatus })
      .eq('id', id)
      .select();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update featured status.',
      });
      return;
    }

    if (!data || data.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'No rows affected. Access denied by database policy.',
      });
      return;
    }

    setRows(prev => prev.map(r => r.id === id ? { ...r, is_featured: newStatus } : r));
    toast({
      title: newStatus ? 'Listing Featured' : 'Listing Unfeatured',
      description: newStatus ? 'This listing will now appear in the featured section.' : 'This listing has been removed from featured.',
    });
  };

  const [editingListing, setEditingListing] = useState<Row | null>(null);

  const handleUpdateListing = async () => {
    if (!editingListing) return;
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          title: editingListing.title,
          location: editingListing.location,
          price: editingListing.price,
          type: editingListing.type,
          video_url: editingListing.video_url
        })
        .eq('id', editingListing.id);

      if (error) throw error;

      setRows(prev => prev.map(r => r.id === editingListing.id ? editingListing : r));
      setEditingListing(null);
      toast({ title: "Listing Updated", description: "Changes saved successfully." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Are you sure? This will remove the listing permanently.")) return;
    try {
      const { data, error } = await supabase.from('properties').delete().eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Deletion failed: No rows affected. Access denied by database policy.");
      setRows(prev => prev.filter(r => r.id !== id));
      toast({ title: "Deleted", description: "Listing removed." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action Failed", description: e.message });
    }
  };

  const filtered = rows.filter(r =>
    (r.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.location || '').toLowerCase().includes(search.toLowerCase())
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-[800px] w-full text-sm text-left">
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
                            {r.video_url && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700" title="Has Video">
                                <Video className="w-3 h-3 mr-0.5" />
                                Video
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
                      <div className="flex flex-col gap-1.5">
                        {bookedIds.has(r.id) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                            Booked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                            Available
                          </span>
                        )}
                        <Badge variant="outline" className={cn(
                          "w-fit text-[10px] uppercase font-bold px-2 py-0",
                          r.approval_status === 'approved' ? "border-green-200 text-green-700 bg-green-50/50" :
                            r.approval_status === 'pending' ? "border-amber-200 text-amber-700 bg-amber-50/50" :
                              "border-red-200 text-red-700 bg-red-50/50"
                        )}>
                          {r.approval_status}
                        </Badge>
                      </div>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(`/listings/${r.id}`, '_blank')}>
                            View Listing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingListing(r)}>
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => deleteListing(r.id)}>
                            Delete Listing
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {rows.length > 0 ? page * pageSize + 1 : 0} to {page * pageSize + rows.length} listings
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="h-8 rounded-lg"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={rows.length < pageSize}
              onClick={() => setPage(p => p + 1)}
              className="h-8 rounded-lg"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!editingListing} onOpenChange={(o) => !o && setEditingListing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Listing Details</DialogTitle>
            <DialogDescription>Administrative override for property information.</DialogDescription>
          </DialogHeader>
          {editingListing && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Property Title</Label>
                <Input value={editingListing.title} onChange={(e) => setEditingListing({ ...editingListing, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={editingListing.location} onChange={(e) => setEditingListing({ ...editingListing, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Price per Night (R)</Label>
                <Input type="number" value={editingListing.price} onChange={(e) => setEditingListing({ ...editingListing, price: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select
                  value={editingListing.type}
                  onValueChange={(v) => setEditingListing({ ...editingListing, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <div key={cat.id}>
                        <div className="px-2 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                          {cat.label}
                        </div>
                        {cat.subcategories.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Video URL (Optional)</Label>
                <Input
                  value={editingListing.video_url || ''}
                  onChange={(e) => setEditingListing({ ...editingListing, video_url: e.target.value || null })}
                  placeholder="https://..."
                />
                {editingListing.video_url && (
                  <p className="text-[10px] text-gray-500">Note: Changing the URL here manually may break the player if the link is invalid.</p>
                )}
              </div>
              <Button onClick={handleUpdateListing} className="w-full">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

