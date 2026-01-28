import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, XCircle, MapPin, Home, User, Eye, AlertCircle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PendingProperty {
    id: string;
    title: string;
    location: string;
    price: number;
    image: string;
    type: string;
    bedrooms: number;
    bathrooms: number;
    created_at: string;
    host_id: string;
    host?: {
        full_name: string;
        email: string;
        verification_status: string;
    };
}

export default function AdminPendingListings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [listings, setListings] = useState<PendingProperty[]>([]);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [processing, setProcessing] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingListings();
    }, []);

    async function fetchPendingListings() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('properties')
                .select(`
                    *,
                    host:profiles!properties_host_id_fkey(full_name, email, verification_status)
                `)
                .eq('approval_status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setListings(data || []);
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error fetching listings',
                description: 'Could not load pending listings.'
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(id: string) {
        try {
            setProcessing(true);
            const { error } = await supabase
                .from('properties')
                .update({ approval_status: 'approved' })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Listing Approved',
                description: 'The listing is now live on the site.',
            });

            // Remove from list
            setListings(prev => prev.filter(l => l.id !== id));
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message
            });
        } finally {
            setProcessing(false);
        }
    }

    async function handleReject() {
        if (!rejectId) return;
        try {
            setProcessing(true);
            const { error } = await supabase
                .from('properties')
                .update({
                    approval_status: 'rejected',
                    rejection_reason: rejectReason
                })
                .eq('id', rejectId);

            if (error) throw error;

            toast({
                title: 'Listing Rejected',
                description: 'The listing has been rejected.',
            });

            setListings(prev => prev.filter(l => l.id !== rejectId));
            setRejectId(null);
            setRejectReason("");
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message
            });
        } finally {
            setProcessing(false);
        }
    }

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
                    <p className="text-gray-500">Review and approve new property listings.</p>
                </div>
                <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {listings.length} Pending
                </div>
            </div>

            {listings.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                    <p className="text-gray-500">No pending listings to review.</p>
                </div>
            ) : (
                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>Host</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {listings.map((listing) => (
                                <TableRow key={listing.id}>
                                    <TableCell className="max-w-[300px]">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                <img
                                                    src={listing.image || '/placeholder.png'}
                                                    className="h-full w-full object-cover"
                                                    alt={listing.title}
                                                />
                                            </div>
                                            <div>
                                                <div className="font-medium truncate" title={listing.title}>{listing.title}</div>
                                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {listing.location}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{listing.host?.full_name || 'Unknown'}</span>
                                            <span className="text-xs text-gray-500">{listing.host?.email}</span>
                                            {listing.host?.verification_status === 'verified' && (
                                                <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                                    <CheckCircle className="w-3 h-3" /> Verified Host
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-3 text-sm text-gray-600">
                                            <span title="Bedrooms">{listing.bedrooms} Beds</span>
                                            <span title="Bathrooms">{listing.bathrooms} Baths</span>
                                            <span className='capitalize'>{listing.type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        R{listing.price}/night
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setDetailsOpen(listing.id)}
                                            >
                                                <Eye className="w-4 h-4 mr-1" /> View
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleApprove(listing.id)}
                                                disabled={processing}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => setRejectId(listing.id)}
                                                disabled={processing}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" /> Reject
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Rejection Dialog */}
            <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Listing</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this listing. The host will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Rejection Reason</Label>
                            <Input
                                placeholder="e.g. Inappropriate images, incomplete description..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectReason}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject Listing
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Dialog (Simplified view) */}
            <Dialog open={!!detailsOpen} onOpenChange={(open) => !open && setDetailsOpen(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {detailsOpen && (() => {
                        const l = listings.find(x => x.id === detailsOpen);
                        if (!l) return null;
                        return (
                            <>
                                <DialogHeader>
                                    <DialogTitle>{l.title}</DialogTitle>
                                    <DialogDescription>{l.location}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6">
                                    <div className="h-64 w-full rounded-lg overflow-hidden bg-gray-100">
                                        <img src={l.image} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <div className="font-bold text-xl">{l.bedrooms}</div>
                                            <div className="text-xs text-gray-500 uppercase">Bedrooms</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <div className="font-bold text-xl">{l.bathrooms}</div>
                                            <div className="text-xs text-gray-500 uppercase">Bathrooms</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <div className="font-bold text-xl">R{l.price}</div>
                                            <div className="text-xs text-gray-500 uppercase">Per Night</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Host Info</h4>
                                        <div className="flex items-center gap-4 p-4 border rounded-lg">
                                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                                <User className="w-6 h-6 text-gray-500" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{l.host?.full_name}</div>
                                                <div className="text-sm text-gray-500">{l.host?.email}</div>
                                                <div className="text-xs text-gray-400 mt-1">Verification: {l.host?.verification_status || 'None'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={() => setDetailsOpen(null)}>Close</Button>
                                    <Button className="bg-green-600" onClick={() => { handleApprove(l.id); setDetailsOpen(null); }}>Approve</Button>
                                </DialogFooter>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
