import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Users, Star, TrendingUp, Loader2, Calendar, LogIn, LogOut, BedDouble, Plus, Search, MoreHorizontal, Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from "react-router-dom";

export default function HostDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    bookings: 0,
    rating: 0,
    occupancy: 0
  });
  const [todaysActivity, setTodaysActivity] = useState({
    arrivals: 0,
    departures: 0,
    inHouse: 0,
    available: 0
  });

  // Mock data for the graph
  const occupancyData = [
    { name: 'Mon', occupancy: 45 },
    { name: 'Tue', occupancy: 52 },
    { name: 'Wed', occupancy: 48 },
    { name: 'Thu', occupancy: 61 },
    { name: 'Fri', occupancy: 85 },
    { name: 'Sat', occupancy: 92 },
    { name: 'Sun', occupancy: 78 },
  ];

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch properties
        const { data: propsData } = await supabase.from("properties").select("id").eq("host_id", user.id);
        const propIds = (propsData || []).map(p => p.id);

        if (propIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch bookings
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("total_price, status, check_in, check_out")
          .in("property_id", propIds);

        // Calculate stats
        const totalRevenue = (bookingsData || [])
          .filter(b => b.status !== 'canceled')
          .reduce((sum, b) => sum + (b.total_price || 0), 0);

        const activeBookings = (bookingsData || []).filter(b => b.status === 'pending' || b.status === 'confirmed').length;

        // Mock today's activity logic (since we don't have real dates aligned with "today" in mock data usually)
        setTodaysActivity({
          arrivals: 2,
          departures: 1,
          inHouse: 4,
          available: 3
        });

        setStats({
          revenue: totalRevenue,
          bookings: activeBookings,
          rating: 4.8, // Mock
          occupancy: 72 // Mock
        });

      } catch (error) {
        console.error("Error fetching host data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Front Desk</h1>
          <p className="text-gray-500 mt-1">Overview of your daily operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search reservation..." className="pl-9 w-64 bg-white" />
          </div>
          <Button onClick={() => navigate('/host/create')} className="bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Today's Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Arrivals</p>
              <div className="text-3xl font-bold text-blue-900">{todaysActivity.arrivals}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <LogIn className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-orange-50/50 hover:bg-orange-50 transition-colors cursor-pointer group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">Departures</p>
              <div className="text-3xl font-bold text-orange-900">{todaysActivity.departures}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <LogOut className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50/50 hover:bg-purple-50 transition-colors cursor-pointer group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">In House</p>
              <div className="text-3xl font-bold text-purple-900">{todaysActivity.inHouse}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BedDouble className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-green-50/50 hover:bg-green-50 transition-colors cursor-pointer group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Available</p>
              <div className="text-3xl font-bold text-green-900">{todaysActivity.available}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-gray-900">Occupancy Forecast</CardTitle>
              <select className="text-sm border-none bg-gray-50 rounded-lg px-2 py-1 font-medium text-gray-600 focus:ring-0">
                <option>Next 7 Days</option>
                <option>Next 30 Days</option>
              </select>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={occupancyData}>
                    <defs>
                      <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="occupancy" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorOccupancy)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">R{stats.revenue.toLocaleString()}</div>
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12.5% vs last month
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Guest Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-gray-900">{stats.rating}</div>
                  <div className="flex text-yellow-400">
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Based on 124 reviews</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar / Activity Feed */}
        <div className="space-y-6">
          <Card className="border-gray-200 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">Activity Feed</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Bell className="w-4 h-4 text-gray-500" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { type: 'booking', title: 'New Booking', desc: 'Alice J. booked Seaside Villa', time: '2 min ago', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                { type: 'checkin', title: 'Check-in', desc: 'Bob Smith checked in to Mountain Cabin', time: '1 hour ago', icon: LogIn, color: 'text-green-600', bg: 'bg-green-50' },
                { type: 'review', title: 'New Review', desc: '5-star review from Charlie', time: '3 hours ago', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                { type: 'issue', title: 'Maintenance', desc: 'AC reported broken in Room 102', time: '5 hours ago', icon: Loader2, color: 'text-red-600', bg: 'bg-red-50' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center shrink-0`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4">View All Activity</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
