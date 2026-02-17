
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Loader2, MapPin, Calendar, CreditCard, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  property: {
    title: string;
    location: string;
    image: string;
  };
}

export default function TripsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "canceled">("upcoming");

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            *,
            property:properties(title, location, image)
          `)
          .eq("user_id", user.id)
          .order("check_in", { ascending: true });

        if (error) throw error;

        if (data) {
          setBookings(data as unknown as Booking[]);
        }
      } catch (error: unknown) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const filteredBookings = bookings.filter((booking) => {
    const isCanceled = booking.status === "canceled";
    const isPast = new Date(booking.check_out) < new Date() && !isCanceled;
    const isUpcoming = new Date(booking.check_out) >= new Date() && !isCanceled;

    if (activeTab === "canceled") return isCanceled;
    if (activeTab === "past") return isPast;
    return isUpcoming;
  });

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Trips</h1>
      <div className="border-b border-gray-200 mb-8">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`pb-4 border-b-2 font-semibold transition-colors ${activeTab === "upcoming" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`pb-4 border-b-2 font-semibold transition-colors ${activeTab === "past" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
          >
            Past
          </button>
          <button
            onClick={() => setActiveTab("canceled")}
            className={`pb-4 border-b-2 font-semibold transition-colors ${activeTab === "canceled" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
          >
            Canceled
          </button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ✈️
          </div>
          <h3 className="text-xl font-semibold mb-2">No {activeTab} trips</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {activeTab === "upcoming"
              ? "Time to dust off your bags and start planning your next adventure."
              : "You haven't completed any trips yet."}
          </p>
          <Button onClick={() => navigate("/")} className="bg-primary hover:bg-primary/90">
            Start searching
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white">
              <div className="h-48 relative">
                <img
                  src={booking.property.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60"}
                  alt={booking.property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <Badge className={booking.status === "confirmed" ? "bg-green-500" : "bg-gray-500"}>
                    {booking.status}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 truncate">{booking.property.title}</h3>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  {booking.property.location}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{format(new Date(booking.check_in), "MMM d")} - {format(new Date(booking.check_out), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center text-gray-600">
                      <CreditCard className="w-4 h-4 mr-2" />
                      <span>Total</span>
                    </div>
                    <span className="font-semibold">R{booking.total_price}</span>
                  </div>

                  {booking.status === "confirmed" && (
                    <Button
                      variant="outline"
                      className="w-full mt-4 gap-2"
                      onClick={() => navigate(`/inbox/${booking.id}`)}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message Host
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
