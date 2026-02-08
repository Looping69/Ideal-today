import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Mail, Phone, Star, MoreHorizontal, Download, MessageSquare, Plus, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function HostGuests() {
    const [search, setSearch] = useState('');
    const [guests, setGuests] = useState<any[]>([]);
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Dialog states
    const [selectedGuest, setSelectedGuest] = useState<any>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    const fetchGuests = async () => {
        if (!user) return;
        setLoading(true);
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
                .select('id, total_price, check_in, status, user:profiles(id, full_name, avatar_url, email, phone)')
                .in('property_id', propIds)
                .neq('status', 'canceled')
                .order('check_in', { ascending: false });

            // 3. Fetch host's notes for guests
            const { data: notes } = await supabase
                .from('guest_notes')
                .select('*')
                .eq('host_id', user.id);

            if (!bookings) return;

            // 4. Aggregate by User
            const guestMap = new Map();

            bookings.forEach((b: any) => {
                const guestId = b.user?.id;
                if (!guestId) return;

                if (!guestMap.has(guestId)) {
                    guestMap.set(guestId, {
                        id: guestId,
                        name: b.user.full_name || 'Unknown Guest',
                        email: b.user.email || 'No email',
                        phone: b.user.phone || 'N/A',
                        stays: 0,
                        spent: 0,
                        lastStay: null,
                        lastBookingId: b.id, // Since it's ordered by check_in desc, first one is latest
                        avatar_url: b.user.avatar_url,
                        notes: (notes || []).filter(n => n.guest_id === guestId)
                    });
                }

                const guest = guestMap.get(guestId);
                guest.stays += 1;
                guest.spent += b.total_price || 0;

                if (!guest.lastStay || new Date(b.check_in) > new Date(guest.lastStay)) {
                    guest.lastStay = b.check_in;
                    guest.lastBookingId = b.id;
                }
            });

            // 5. Transform and set
            const guestList = Array.from(guestMap.values()).map(g => ({
                ...g,
                lastStay: g.lastStay ? new Date(g.lastStay).toISOString().split('T')[0] : 'N/A',
                status: g.stays > 5 ? 'VIP' : g.stays > 1 ? 'Returning' : 'New',
                rating: 5.0
            }));

            setGuests(guestList);
        } catch (err) {
            console.error("Error fetching guests:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGuests();
    }, [user]);

    const handleMessageGuest = (bookingId: string) => {
        navigate(`/host/inbox/${bookingId}`);
    };

    const handleSaveNote = async () => {
        if (!user || !selectedGuest || !noteContent.trim()) return;

        setSavingNote(true);
        try {
            const { error } = await supabase.from('guest_notes').insert({
                host_id: user.id,
                guest_id: selectedGuest.id,
                content: noteContent.trim()
            });

            if (error) throw error;

            toast({ title: "Note saved", description: "Your note has been added to this guest's profile." });
            setNoteContent('');
            setIsNoteOpen(false);
            fetchGuests(); // Refresh to show new note in profile if open
        } catch (err: any) {
            toast({ title: "Error saving note", description: err.message, variant: "destructive" });
        } finally {
            setSavingNote(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            const { error } = await supabase.from('guest_notes').delete().eq('id', noteId);
            if (error) throw error;
            fetchGuests();
        } catch (err: any) {
            toast({ title: "Error deleting note", description: err.message, variant: "destructive" });
        }
    };

    const filteredGuests = guests.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase())
    );

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

                <div className="overflow-x-auto">
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
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading guests...</td></tr>
                            ) : filteredGuests.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No guests found.</td></tr>
                            ) : filteredGuests.map((guest) => (
                                <tr key={guest.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border border-gray-100">
                                                <AvatarImage src={guest.avatar_url} />
                                                <AvatarFallback className="bg-gray-100 text-gray-600 font-bold">
                                                    {guest.name.split(' ').map((n: string) => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium text-gray-900">{guest.name}</div>
                                                <div className="text-xs text-gray-500">Last stay: {guest.lastStay}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1 text-xs text-gray-600">
                                            <div className="flex items-center gap-2"><Mail className="w-3 h-3" />{guest.email}</div>
                                            <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{guest.phone}</div>
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
                                                <DropdownMenuItem onClick={() => { setSelectedGuest(guest); setIsProfileOpen(true); }}>
                                                    View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleMessageGuest(guest.lastBookingId)}>
                                                    Message Guest
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setSelectedGuest(guest); setIsNoteOpen(true); }}>
                                                    Add Note
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Profile Dialog */}
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Guest Profile</DialogTitle>
                    </DialogHeader>
                    {selectedGuest && (
                        <div className="space-y-6 py-4">
                            <div className="flex items-center gap-4 border-b pb-6">
                                <Avatar className="w-16 h-16 border-2 border-gray-50 shadow-sm">
                                    <AvatarImage src={selectedGuest.avatar_url} />
                                    <AvatarFallback className="text-xl">{selectedGuest.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedGuest.name}</h2>
                                    <p className="text-sm text-gray-500">{selectedGuest.email}</p>
                                    <Badge variant="outline" className="mt-2">{selectedGuest.status}</Badge>
                                </div>
                                <div className="ml-auto flex gap-2">
                                    <Button size="sm" onClick={() => handleMessageGuest(selectedGuest.lastBookingId)}>
                                        <MessageSquare className="w-4 h-4 mr-2" /> Message
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => { setIsProfileOpen(false); setIsNoteOpen(true); }}>
                                        <Plus className="w-4 h-4 mr-2" /> Add Note
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Stays</p>
                                    <p className="text-xl font-bold text-gray-900">{selectedGuest.stays}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Spent</p>
                                    <p className="text-xl font-bold text-gray-900">R{selectedGuest.spent.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Last Stay</p>
                                    <p className="text-xl font-bold text-gray-900">{selectedGuest.lastStay}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-gray-400" /> Host Notes
                                </h3>
                                <ScrollArea className="h-40 border rounded-xl p-4 bg-gray-50/30">
                                    {selectedGuest.notes.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic text-center py-8">No notes for this guest yet.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {selectedGuest.notes.map((note: any) => (
                                                <div key={note.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm relative group">
                                                    <p className="text-sm text-gray-700 leading-relaxed pr-8">{note.content}</p>
                                                    <p className="text-[10px] text-gray-400 mt-2">
                                                        {new Date(note.created_at).toLocaleDateString()}
                                                    </p>
                                                    <button
                                                        onClick={() => handleDeleteNote(note.id)}
                                                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Note Dialog */}
            <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Note for {selectedGuest?.name}</DialogTitle>
                        <DialogDescription>These notes are only visible to you and other hosts on your team.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="e.g. Guest preferred extra towels, very quiet and tidy..."
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="min-h-[120px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNoteOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveNote} disabled={savingNote || !noteContent.trim()}>
                            {savingNote ? "Saving..." : "Save Note"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
