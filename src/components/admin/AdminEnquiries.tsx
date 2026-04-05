import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Search, Filter, Calendar, MoreHorizontal, CheckCircle, XCircle, Clock, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { invokeBookingAction } from '@/lib/backend';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Row = { id: string; property_id: string; user_id: string; status: string; check_in: string; check_out: string; user?: { email?: string; full_name?: string }; property?: { title?: string } };

export default function AdminBookings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'canceled'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('bookings')
      .select('id,property_id,user_id,status,check_in,check_out,user:profiles!bookings_user_id_fkey(email,full_name),property:properties(title)')
      .order('created_at', { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);

    if (tab !== 'all') query = query.eq('status', tab);

    const { data, error } = await query;
    if (error) {
      console.error('Error loading bookings:', getErrorMessage(error));
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load bookings' });
    } else {
      setRows((data as unknown as Row[]) || []);
    }
    setLoading(false);
  }, [tab, page, toast, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => (
      (r.user?.email || '').toLowerCase().includes(q) ||
      (r.user?.full_name || '').toLowerCase().includes(q) ||
      (r.property?.title || '').toLowerCase().includes(q) ||
      (r.id || '').toLowerCase().includes(q)
    ));
  }, [rows, search]);

  const updateStatus = useCallback(async (id: string, next: 'pending' | 'confirmed' | 'completed' | 'canceled') => {
    try {
      await invokeBookingAction({
        action: 'admin-update-booking-status',
        bookingId: id,
        status: next,
      });
      setRows(rs => rs.map(r => (r.id === id ? { ...r, status: next } : r)));
      toast({ title: 'Success', description: `Booking marked as ${next}` });
    } catch (error: unknown) {
      console.error('Error updating status:', getErrorMessage(error));
      toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
    }
  }, [toast]);

  const [editingBooking, setEditingBooking] = useState<Row | null>(null);

  const handleUpdateBooking = async () => {
    if (!editingBooking) return;
    try {
      await invokeBookingAction({
        action: 'admin-update-booking',
        bookingId: editingBooking.id,
        checkIn: editingBooking.check_in,
        checkOut: editingBooking.check_out,
        status: editingBooking.status,
      });

      setRows(prev => prev.map(r => r.id === editingBooking.id ? editingBooking : r));
      setEditingBooking(null);
      toast({ title: "Booking Updated", description: "Changes saved successfully." });
    } catch (e: unknown) {
      console.error('Error saving booking override:', getErrorMessage(e));
      toast({ variant: "destructive", title: "Update Failed", description: getErrorMessage(e) });
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Permanently delete this booking record? This cannot be undone.")) return;
    try {
      await invokeBookingAction({
        action: 'admin-delete-booking',
        bookingId: id,
      });
      setRows(prev => prev.filter(r => r.id !== id));
      toast({ title: "Deleted", description: "Booking record removed." });
    } catch (e: unknown) {
      console.error('Error deleting booking:', getErrorMessage(e));
      toast({ variant: "destructive", title: "Action Failed", description: getErrorMessage(e) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Enquiry Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage all property enquiries and leads.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search enquiries..."
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

      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {(['all', 'pending', 'confirmed', 'completed', 'canceled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${tab === s
              ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-[800px] w-full text-sm text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Property</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">User</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Requested Dates</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td className="px-6 py-12 text-center text-gray-500" colSpan={5}>Loading bookings...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-6 py-12 text-center text-gray-500" colSpan={5}>No bookings found</td></tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 truncate max-w-[200px]">{r.property?.title || 'Unknown Property'}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{r.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{r.user?.full_name || 'Guest'}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">{r.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium bg-gray-50 px-2.5 py-1 rounded-lg w-fit">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{new Date(r.check_in).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <ArrowRight className="w-3 h-3 text-gray-300" />
                        <span>{new Date(r.check_out).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${r.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100' :
                        r.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                          r.status === 'canceled' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-gray-50 text-gray-700 border-gray-100'
                        }`}>
                        {r.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1.5" />}
                        {r.status === 'pending' && <Clock className="w-3 h-3 mr-1.5" />}
                        {r.status === 'canceled' && <XCircle className="w-3 h-3 mr-1.5" />}
                        <span className="capitalize">{r.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateStatus(r.id, 'confirmed')}>Mark Confirmed</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(r.id, 'completed')}>Mark Completed</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingBooking(r)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" />
                            Edit Booking
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateStatus(r.id, 'canceled')} className="text-red-600">Cancel Booking</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteBooking(r.id)} className="text-red-600">
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete Record
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
            Showing {filtered.length > 0 ? page * pageSize + 1 : 0} to {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length} bookings
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className="h-8">
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} className="h-8">
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!editingBooking} onOpenChange={(o) => !o && setEditingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Administrative Enquiry Correction</DialogTitle>
            <DialogDescription>Override enquiry details if necessary.</DialogDescription>
          </DialogHeader>
          {editingBooking && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check-in</Label>
                  <Input type="date" value={editingBooking.check_in.split('T')[0]} onChange={(e) => setEditingBooking({ ...editingBooking, check_in: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Check-out</Label>
                  <Input type="date" value={editingBooking.check_out.split('T')[0]} onChange={(e) => setEditingBooking({ ...editingBooking, check_out: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Booking Status</Label>
                <select
                  className="w-full rounded-xl border border-gray-200 p-2 text-sm"
                  value={editingBooking.status}
                  onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <Button onClick={handleUpdateBooking} className="w-full">Save Override</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
