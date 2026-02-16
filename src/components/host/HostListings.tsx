import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Video
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/types/property";
import { getErrorMessage } from "@/lib/errors";

export default function HostListings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchListings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("host_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings((data as unknown as Property[]) || []);
    } catch (error: unknown) {
      console.error("Error fetching listings:", getErrorMessage(error));
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your listings.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user, fetchListings]);

  const deleteListing = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return;

    try {
      // ... (no changes to inner logic)
      const today = new Date().toISOString();
      const { data: activeBookings, error: checkError } = await supabase
        .from("bookings")
        .select("id")
        .eq("property_id", id)
        .gte("check_out", today)
        .neq("status", "canceled");

      if (checkError) throw checkError;

      if (activeBookings && activeBookings.length > 0) {
        toast({
          variant: "destructive",
          title: "Cannot delete listing",
          description: "This property has active or upcoming bookings. Please cancel them first.",
        });
        return;
      }

      // 2. Delete dependencies (client-side cascade)
      // Delete reviews
      const { error: reviewsError } = await supabase
        .from("reviews")
        .delete()
        .eq("property_id", id);

      if (reviewsError) throw reviewsError;

      // Fetch booking IDs to delete related messages
      const { data: bookingIds } = await supabase
        .from("bookings")
        .select("id")
        .eq("property_id", id);

      if (bookingIds && bookingIds.length > 0) {
        const ids = bookingIds.map(b => b.id);
        // Delete messages for these bookings
        const { error: messagesError } = await supabase
          .from("messages")
          .delete()
          .in("booking_id", ids);

        if (messagesError) throw messagesError;
      }

      // Delete past/canceled bookings
      const { error: bookingsError } = await supabase
        .from("bookings")
        .delete()
        .eq("property_id", id);

      if (bookingsError) throw bookingsError;

      // 3. Delete property
      const { data, error } = await supabase
        .from("properties")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Could not delete listing. It may have already been deleted or you do not have permission.");
      }

      setListings(prev => prev.filter(l => l.id !== id));
      toast({
        title: "Listing deleted",
        description: "Your listing has been removed successfully.",
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error("Error deleting listing:", message);
      toast({
        variant: "destructive",
        title: "Error",
        description: message || "Failed to delete listing.",
      });
    }
  }, [toast]);

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Listings</h1>
          <p className="text-gray-500 mt-2">Manage your properties and availability.</p>
        </div>
        <Button onClick={() => navigate("/host/create")} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Create Listing
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search listings..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">Property</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredListings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  {searchQuery ? "No listings found matching your search." : "You haven't created any listings yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredListings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={listing.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60"}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">{listing.title}</div>
                          {listing.video_url && (
                            <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0 border-blue-200 text-blue-700 bg-blue-50/50 flex items-center gap-1">
                              <Video className="w-2.5 h-2.5" />
                              Tour
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{listing.location}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {listing.approval_status === 'approved' ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                    ) : listing.approval_status === 'rejected' ? (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>R{listing.price} <span className="text-gray-500 text-xs">/ night</span></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{listing.rating || "New"}</span>
                      {listing.rating && <span className="text-gray-400 text-xs">({listing.reviews_count})</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(listing.created_at || new Date()).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/properties/${listing.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/host/edit/${listing.id}`)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => deleteListing(listing.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
