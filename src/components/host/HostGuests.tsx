import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Mail, Phone, MapPin, Star, MoreHorizontal, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HostGuests() {
    const [search, setSearch] = useState('');

    const [guests, setGuests] = useState<any[]>([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchGuests = async () => {
            try {
                // 1. Get host property IDs
                const { data: props } = await supabase.from('properties').select('id').eq('host_id', user.id);
                const propIds = (props || []).map(p => p.id);

                if (propIds.length === 0) {
                    setLoading(false);
                    return;
                }

                // 2. Fetch all bookings for these properties
                const { data: bookings } = await supabase
                    .from('bookings')
                    .select('total_price, check_in, status, user:profiles(id, full_name, avatar_url, email)')
                    .in('property_id', propIds)
                    .neq('status', 'canceled');

                if (!bookings) return;

                // 3. Aggregate by User
                const guestMap = new Map();

                bookings.forEach((b: any) => {
                    const guestId = b.user?.id;
                    if (!guestId) return; // Skip if no user linked

                    if (!guestMap.has(guestId)) {
                        guestMap.set(guestId, {
                            id: guestId,
                            name: b.user.full_name || 'Unknown Guest',
                            email: b.user.email || 'No email',
                            phone: 'N/A', // Phone not currently in profile, placeholder
                            stays: 0,
                            spent: 0,
                            lastStay: null,
                            avatar_url: b.user.avatar_url
                        });
                    }

                    const guest = guestMap.get(guestId);
                    guest.stays += 1;
                    guest.spent += b.total_price || 0;

                    // Update last stay if this booking is later
                    if (!guest.lastStay || new Date(b.check_in) > new Date(guest.lastStay)) {
                        guest.lastStay = b.check_in;
                    }
                });

                // 4. Transform to array and determine status
                const guestList = Array.from(guestMap.values()).map(g => ({
                    ...g,
                    lastStay: g.lastStay ? new Date(g.lastStay).toISOString().split('T')[0] : 'N/A',
                    status: g.stays > 5 ? 'VIP' : g.stays > 1 ? 'Returning' : 'New',
                    rating: 5.0 // Mocking rating as we don't have per-guest rating aggregation yet
                }));

                setGuests(guestList);
            } catch (err) {
                console.error("Error fetching guests:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGuests();
    }, [user]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Guest Management</h1>
                    <p className="text-gray-500 text-sm mt-1">View guest history, preferences, and contact info.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button className="bg-gray-900 text-white hover:bg-gray-800">Add Guest</Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search guests by name, email, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-gray-50 border-transparent focus:bg-white transition-colors"
                        />
                    </div>
                </div>

                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Guest Profile</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Contact Info</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">History</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {guests.map((guest) => (
                            <tr key={guest.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                                            {guest.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{guest.name}</div>
                                            <div className="text-xs text-gray-500">Last stay: {guest.lastStay}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                                            <Mail className="w-3 h-3" />
                                            {guest.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                                            <Phone className="w-3 h-3" />
                                            {guest.phone}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 font-medium">{guest.stays} stays</div>
                                    <div className="text-xs text-gray-500">Total spent: R{guest.spent.toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${guest.status === 'VIP' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                        guest.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            'bg-gray-50 text-gray-700 border-gray-100'
                                        }`}>
                                        {guest.status === 'VIP' && <Star className="w-3 h-3 mr-1 fill-purple-700" />}
                                        {guest.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                                            <DropdownMenuItem>Message Guest</DropdownMenuItem>
                                            <DropdownMenuItem>Add Note</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
