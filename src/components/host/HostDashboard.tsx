import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Users, Star, TrendingUp, Loader2, Calendar, LogIn, LogOut, BedDouble, Plus, Search, MoreHorizontal, Bell, Trophy, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from "react-router-dom";

export default function HostDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
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

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Fetch properties
        const { data: propsData } = await supabase.from("properties").select("id").eq("host_id", user.id);
        const propIds = (propsData || []).map(p => p.id);
        const totalProperties = propIds.length;

        if (totalProperties === 0) {
          setLoading(false);
          return;
        }

        // 2. Fetch bookings (all active ones)
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("id, total_price, status, check_in, check_out, created_at, user:profiles(full_name)")
          .in("property_id", propIds)
          .neq('status', 'canceled');

        const allBookings = bookingsData || [];

        // 3. Fetch reviews
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("rating, created_at, content, user:profiles(full_name)")
          .in("property_id", propIds)
          .order("created_at", { ascending: false })
          .limit(5);

        // --- Calculate Stats ---
        const totalRevenue = allBookings
          .filter(b => b.status === 'confirmed' || b.status === 'completed')
          .reduce((sum, b) => sum + (b.total_price || 0), 0);

        const activeBookingsCount = allBookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;

        const { data: ratingsData } = await supabase.from("reviews").select("rating").in("property_id", propIds);
        const totalRating = (ratingsData || []).reduce((sum, r) => sum + r.rating, 0);
        const avgRating = ratingsData?.length ? (totalRating / ratingsData.length).toFixed(1) : 0;

        // --- Today's Activity ---
        let arrivals = 0;
        let departures = 0;
        let inHouse = 0;

        const isSameDate = (d1: Date, d2: Date) =>
          d1.getDate() === d2.getDate() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getFullYear() === d2.getFullYear();

        allBookings.forEach(b => {
          if (b.status !== 'confirmed' && b.status !== 'completed') return;
          const checkIn = new Date(b.check_in);
          const checkOut = new Date(b.check_out);

          if (isSameDate(checkIn, today)) arrivals++;
          if (isSameDate(checkOut, today)) departures++;
          if (checkIn < today && checkOut > today) inHouse++;
        });

        const available = totalProperties - (inHouse + arrivals);

        setTodaysActivity({
          arrivals,
          departures,
          inHouse,
          available: Math.max(0, available)
        });

        // --- Occupancy Graph ---
        const next7Days = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const occupiedCount = allBookings.filter(b => {
            const start = new Date(b.check_in);
            const end = new Date(b.check_out);
            return (b.status === 'confirmed' || b.status === 'completed' || b.status === 'blocked') &&
              d >= start && d < end;
          }).length;
          const occupancyPct = totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : 0;
          next7Days.push({ name: dayNames[d.getDay()], occupancy: occupancyPct });
        }

        // --- Activity Feed ---
        const feedItems = [];
        allBookings
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .forEach((b: any) => {
            const userName = Array.isArray(b.user) ? b.user[0]?.full_name : b.user?.full_name;
            feedItems.push({
              type: 'booking',
              title: b.status === 'pending' ? 'New Request' : 'New Booking',
              desc: `${userName || 'Guest'} - ${new Date(b.check_in).toLocaleDateString()}`,
              time: new Date(b.created_at),
              icon: Calendar,
              color: 'text-blue-600',
              bg: 'bg-blue-50'
            });
          });

        (reviewsData || []).forEach((r: any) => {
          const userName = Array.isArray(r.user) ? r.user[0]?.full_name : r.user?.full_name;
          feedItems.push({
            type: 'review',
            title: 'New Review',
            desc: `${r.rating} stars from ${userName || 'Guest'}`,
            time: new Date(r.created_at),
            icon: Star,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50'
          });
        });

        feedItems.sort((a, b) => b.time.getTime() - a.time.getTime());
        setActivityFeed(feedItems.slice(0, 5));

        const avgOccupancy = Math.round(next7Days.reduce((acc, curr) => acc + curr.occupancy, 0) / 7);

        setOccupancyData(next7Days);
        setStats({
          revenue: totalRevenue,
          bookings: activeBookingsCount,
          rating: Number(avgRating),
          occupancy: avgOccupancy
        });

      } catch (error) {
        console.error("Error fetching host data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const [occupancyData, setOccupancyData] = useState<any[]>([]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Refer-a-Host Promo */}
      <Card className="border-none bg-gradient-to-r from-indigo-600 to-blue-700 text-white overflow-hidden relative shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy className="w-32 h-32" />
        </div>
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-bold">Earn 1,000 Points with Refer-a-Host</h2>
            <p className="text-indigo-100 max-w-lg">Invite other hosts to IdealStay. When they publish their first listing, you'll receive 1,000 reward points!</p>
          </div>
          <Button
            onClick={() => navigate('/host/referrals')}
            className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-8 h-12 rounded-xl transition-transform hover:scale-105"
          >
            Get My Link <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-gray-900">Occupancy Forecast</CardTitle>
              <select className="text-sm border-none bg-gray-50 rounded-lg px-2 py-1 font-medium text-gray-600 focus:ring-0">
                <option>Next 7 Days</option>
              </select>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {occupancyData.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No data available in forecast
                  </div>
                )}
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
                <p className="text-sm text-gray-500 mt-1">Based on reviews</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-gray-200 shadow-sm h-full max-h-[600px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">Activity Feed</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Bell className="w-4 h-4 text-gray-500" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 overflow-y-auto pr-2">
              {activityFeed.length === 0 ? (
                <div className="text-center text-gray-500 py-4">No recent activity</div>
              ) : (
                activityFeed.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {Math.floor((new Date().getTime() - item.time.getTime()) / (1000 * 60 * 60)) < 24
                          ? `${Math.floor((new Date().getTime() - item.time.getTime()) / (1000 * 60 * 60))}h ago`
                          : item.time.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/host/bookings')}>View All Bookings</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
