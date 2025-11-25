import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Calendar as CalendarIcon, User, MapPin, Ban, CheckCircle2, Clock, XCircle, ChevronRight, Filter } from "lucide-react";
import { format, isSameDay, parseISO, addDays, isWithinInterval, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface Property {
  id: string;
  title: string;
  image: string;
}

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: 'confirmed' | 'pending' | 'canceled' | 'blocked';
  user: {
    full_name: string;
    avatar_url: string;
    email?: string;
  };
  property_id: string;
  property?: Property;
}

export default function HostCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockRange, setBlockRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(),
    to: addDays(new Date(), 1)
  });

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch properties
      const { data: propsData, error: propsError } = await supabase
        .from("properties")
        .select("id, title, image")
        .eq("host_id", user?.id);

      if (propsError) throw propsError;
      setProperties(propsData || []);

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .in("property_id", (propsData || []).map(p => p.id))
        .neq("status", "canceled"); // Don't show canceled bookings on calendar

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load calendar data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockDates = async () => {
    if (!blockRange.from || !blockRange.to || !user) return;
    
    if (selectedPropertyId === "all") {
      toast({
        variant: "destructive",
        title: "Select Property",
        description: "Please select a specific property to block dates.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .insert({
          property_id: selectedPropertyId,
          user_id: user.id,
          check_in: blockRange.from.toISOString(),
          check_out: blockRange.to.toISOString(),
          total_price: 0,
          status: 'blocked'
        });

      if (error) throw error;

      toast({
        title: "Dates Blocked",
        description: "The selected dates have been blocked.",
      });
      setIsBlockDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error blocking dates:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to block dates.",
      });
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Booking marked as ${newStatus}.`,
      });
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update booking status.",
      });
    }
  };

  const filteredBookings = selectedPropertyId === "all" 
    ? bookings 
    : bookings.filter(b => b.property_id === selectedPropertyId);

  // Get dates for modifiers
  const confirmedDates = filteredBookings
    .filter(b => b.status === 'confirmed')
    .flatMap(booking => {
      const dates = [];
      let curr = parseISO(booking.check_in);
      const end = parseISO(booking.check_out);
      while (curr < end) {
        dates.push(new Date(curr));
        curr = addDays(curr, 1);
      }
      return dates;
    });

  const pendingDates = filteredBookings
    .filter(b => b.status === 'pending')
    .flatMap(booking => {
      const dates = [];
      let curr = parseISO(booking.check_in);
      const end = parseISO(booking.check_out);
      while (curr < end) {
        dates.push(new Date(curr));
        curr = addDays(curr, 1);
      }
      return dates;
    });

  const blockedDates = filteredBookings
    .filter(b => b.status === 'blocked')
    .flatMap(booking => {
      const dates = [];
      let curr = parseISO(booking.check_in);
      const end = parseISO(booking.check_out);
      while (curr < end) {
        dates.push(new Date(curr));
        curr = addDays(curr, 1);
      }
      return dates;
    });

  // Find bookings for the selected date
  const selectedDateBookings = date 
    ? filteredBookings.filter(booking => {
        const checkIn = startOfDay(parseISO(booking.check_in));
        const checkOut = startOfDay(parseISO(booking.check_out));
        const selected = startOfDay(date);
        return selected >= checkIn && selected < checkOut;
      })
    : [];

  const upcomingBookings = filteredBookings
    .filter(b => new Date(b.check_in) >= new Date() && b.status !== 'blocked')
    .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar & Bookings</h1>
          <p className="text-gray-500 mt-1">Manage your property availability and reservations.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map(property => (
                <SelectItem key={property.id} value={property.id}>
                  {property.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Ban className="w-4 h-4" />
                Block Dates
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Block Dates</DialogTitle>
                <DialogDescription>
                  Select a date range to mark as unavailable.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {selectedPropertyId === "all" && (
                  <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                    Please select a specific property from the dropdown above to block dates.
                  </div>
                )}
                <div className="flex justify-center">
                  <Calendar
                    mode="range"
                    selected={blockRange}
                    onSelect={(range: any) => setBlockRange(range)}
                    numberOfMonths={1}
                    disabled={(date) => date < new Date()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleBlockDates} disabled={selectedPropertyId === "all" || !blockRange.from || !blockRange.to}>
                  Confirm Block
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calendar */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Availability View</CardTitle>
              <div className="flex gap-4 text-sm mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-100 border border-green-500" />
                  <span>Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-500" />
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-500" />
                  <span>Blocked</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 md:p-6 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border w-full max-w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4 w-full",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full",
                  row: "flex w-full mt-2",
                  cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 w-full",
                  day: cn(
                    "h-14 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md transition-colors"
                  ),
                  day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                modifiers={{
                  confirmed: confirmedDates,
                  pending: pendingDates,
                  blocked: blockedDates
                }}
                modifiersStyles={{
                  confirmed: { backgroundColor: "#dcfce7", color: "#166534", fontWeight: "bold" },
                  pending: { backgroundColor: "#fef9c3", color: "#854d0e", fontWeight: "bold" },
                  blocked: { backgroundColor: "#f3f4f6", color: "#6b7280", textDecoration: "line-through" }
                }}
              />
            </CardContent>
          </Card>

          {/* All Bookings List */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Recent & Upcoming Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming">
                <TabsList className="mb-4">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="pending">Pending Approval</TabsTrigger>
                  <TabsTrigger value="all">All History</TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {filteredBookings.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        No bookings found.
                      </div>
                    ) : (
                      filteredBookings
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map(booking => {
                          const property = properties.find(p => p.id === booking.property_id);
                          return (
                            <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <Avatar>
                                  <AvatarImage src={booking.user?.avatar_url} />
                                  <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{booking.user?.full_name || (booking.status === 'blocked' ? 'Blocked Date' : 'Guest')}</span>
                                    <Badge variant="outline" className={cn(
                                      "text-xs capitalize",
                                      booking.status === 'confirmed' && "bg-green-100 text-green-800 border-green-200",
                                      booking.status === 'pending' && "bg-yellow-100 text-yellow-800 border-yellow-200",
                                      booking.status === 'blocked' && "bg-gray-100 text-gray-800 border-gray-200",
                                      booking.status === 'canceled' && "bg-red-100 text-red-800 border-red-200",
                                    )}>
                                      {booking.status}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                    <span>{property?.title}</span>
                                    <span>•</span>
                                    <span>{format(parseISO(booking.check_in), "MMM d")} - {format(parseISO(booking.check_out), "MMM d")}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">R{booking.total_price}</div>
                                <div className="text-xs text-gray-500">{format(new Date(booking.created_at), "MMM d, yyyy")}</div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Selected Date & Actions */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-slate-50 border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {date ? format(date, "MMMM d, yyyy") : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedDateBookings.length > 0 ? (
                  selectedDateBookings.map(booking => {
                    const property = properties.find(p => p.id === booking.property_id);
                    return (
                      <div key={booking.id} className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                          <Badge className={cn(
                            "capitalize",
                            booking.status === 'confirmed' && "bg-green-500",
                            booking.status === 'pending' && "bg-yellow-500",
                            booking.status === 'blocked' && "bg-gray-500",
                          )}>
                            {booking.status}
                          </Badge>
                          {booking.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleUpdateStatus(booking.id, 'confirmed')}>
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleUpdateStatus(booking.id, 'canceled')}>
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={booking.user?.avatar_url} />
                            <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{booking.user?.full_name || "Host Block"}</p>
                            <p className="text-xs text-gray-500">
                              {format(parseISO(booking.check_in), "MMM d")} - {format(parseISO(booking.check_out), "MMM d")}
                            </p>
                          </div>
                        </div>

                        {property && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{property.title}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t flex justify-between items-center text-sm">
                          <span className="text-gray-500">Payout</span>
                          <span className="font-bold">R{booking.total_price}</span>
                        </div>
                        
                        {booking.status === 'blocked' && (
                           <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleUpdateStatus(booking.id, 'canceled')}>
                             Unblock Dates
                           </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No bookings for this date.</p>
                    <Button variant="link" className="mt-2" onClick={() => setIsBlockDialogOpen(true)}>
                      Block these dates?
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg text-green-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Confirmed</span>
                </div>
                <span className="font-bold">{filteredBookings.filter(b => b.status === 'confirmed').length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg text-yellow-900">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <span className="font-bold">{filteredBookings.filter(b => b.status === 'pending').length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-gray-900">
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  <span className="text-sm font-medium">Blocked</span>
                </div>
                <span className="font-bold">{filteredBookings.filter(b => b.status === 'blocked').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
