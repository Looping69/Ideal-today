
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle2, XCircle, Calendar as CalendarIcon, User, MapPin, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import { useCallback } from "react";
import { invokeBookingAction } from "@/lib/backend";

interface Enquiry {
    id: string;
    check_in: string;
    check_out: string;
    total_price: number;
    status: 'confirmed' | 'pending' | 'canceled' | 'blocked' | 'completed';
    user: {
        full_name: string;
        avatar_url: string;
        email?: string;
    };
    property: {
        id: string;
        title: string;
        image: string;
        location: string;
    };
    created_at: string;
}

export default function HostBookings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

    const fetchEnquiries = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Get host's properties
            const { data: properties } = await supabase
                .from('properties')
                .select('id')
                .eq('host_id', user?.id);

            if (!properties || properties.length === 0) {
                setLoading(false);
                return;
            }

            const propertyIds = properties.map(p => p.id);

            // 2. Get bookings for these properties
            const { data, error } = await supabase
                .from('bookings')
                .select(`
          *,
          user:profiles(full_name, avatar_url, email),
          property:properties(id, title, image, location)
        `)
                .in('property_id', propertyIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEnquiries(data || []);

        } catch (error) {
            console.error("Error fetching enquiries:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load enquiries.",
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if (user) {
            fetchEnquiries();
        }
    }, [user, fetchEnquiries]);

    const handleUpdateStatus = useCallback(async (enquiryId: string, newStatus: string) => {
        try {
            await invokeBookingAction({
                action: "host-update-booking-status",
                bookingId: enquiryId,
                status: newStatus,
            });

            toast({
                title: newStatus === 'confirmed' ? "Enquiry Accepted" : "Enquiry Updated",
                description: `Enquiry has been ${newStatus}.`,
            });

            // Update local state
            setEnquiries(prev => prev.map(e =>
                e.id === enquiryId ? { ...e, status: newStatus as Enquiry['status'] } : e
            ));

        } catch (error: unknown) {
            console.error("Error updating status:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: getErrorMessage(error),
            });
        }
    }, [toast]);

    const EnquiryCard = ({ enquiry }: { enquiry: Enquiry }) => (
        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Property Image */}
                <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0">
                    <img
                        src={enquiry.property.image}
                        alt={enquiry.property.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-lg">{enquiry.property.title}</h3>
                            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                <MapPin className="w-4 h-4" />
                                {enquiry.property.location}
                            </div>
                        </div>
                        <Badge className={cn(
                            "capitalize px-3 py-1",
                            enquiry.status === 'confirmed' && "bg-green-100 text-green-800 hover:bg-green-100",
                            enquiry.status === 'pending' && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                            enquiry.status === 'canceled' && "bg-red-100 text-red-800 hover:bg-red-100",
                            enquiry.status === 'completed' && "bg-gray-100 text-gray-800 hover:bg-gray-100",
                        )}>
                            {enquiry.status}
                        </Badge>
                    </div>

                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                                {format(parseISO(enquiry.check_in), "MMM d, yyyy")} - {format(parseISO(enquiry.check_out), "MMM d, yyyy")}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                    <AvatarImage src={enquiry.user?.avatar_url} />
                                    <AvatarFallback>{enquiry.user?.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span>{enquiry.user?.full_name || 'Guest'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Total:</span>
                            <span className="font-bold">R{enquiry.total_price}</span>
                        </div>
                    </div>

                    {/* Actions for Pending Enquiries */}
                    {enquiry.status === 'pending' && (
                        <div className="flex gap-3 pt-2 border-t mt-4">
                            <Button
                                onClick={() => handleUpdateStatus(enquiry.id, 'confirmed')}
                                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Accept Enquiry
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleUpdateStatus(enquiry.id, 'canceled')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 border-red-200"
                            >
                                <XCircle className="w-4 h-4" />
                                Decline
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const pendingEnquiries = enquiries.filter(e => e.status === 'pending');
    const upcomingEnquiries = enquiries.filter(e => e.status === 'confirmed' && new Date(e.check_in) >= new Date());
    const pastEnquiries = enquiries.filter(e => e.status === 'completed' || (e.status === 'confirmed' && new Date(e.check_in) < new Date()));
    const canceledEnquiries = enquiries.filter(e => e.status === 'canceled');

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Enquiries</h1>
                <p className="text-gray-500 mt-2">Manage your property enquiries and leads.</p>
            </div>

            <Tabs defaultValue="requests" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="requests" className="relative">
                        Requests
                        {pendingEnquiries.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                                {pendingEnquiries.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                    <TabsTrigger value="canceled">Canceled</TabsTrigger>
                </TabsList>

                <TabsContent value="requests" className="mt-6 space-y-4">
                    {pendingEnquiries.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="font-medium text-gray-900">No pending enquiries</h3>
                            <p className="text-gray-500 text-sm">You're all caught up!</p>
                        </div>
                    ) : (
                        pendingEnquiries.map(enquiry => (
                            <EnquiryCard key={enquiry.id} enquiry={enquiry} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="upcoming" className="mt-6 space-y-4">
                    {upcomingEnquiries.length === 0 ? (
                        <p className="text-center py-12 text-gray-500">No upcoming enquiries.</p>
                    ) : (
                        upcomingEnquiries.map(enquiry => (
                            <EnquiryCard key={enquiry.id} enquiry={enquiry} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="past" className="mt-6 space-y-4">
                    {pastEnquiries.length === 0 ? (
                        <p className="text-center py-12 text-gray-500">No past enquiries.</p>
                    ) : (
                        pastEnquiries.map(enquiry => (
                            <EnquiryCard key={enquiry.id} enquiry={enquiry} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="canceled" className="mt-6 space-y-4">
                    {canceledEnquiries.length === 0 ? (
                        <p className="text-center py-12 text-gray-500">No canceled enquiries.</p>
                    ) : (
                        canceledEnquiries.map(enquiry => (
                            <EnquiryCard key={enquiry.id} enquiry={enquiry} />
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
