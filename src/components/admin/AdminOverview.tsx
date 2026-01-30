import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Home, Calendar, Star, MessageSquare, TrendingUp, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type KPI = { users: number; listings: number; bookings: number; reviews: number; pendingReviews: number };
type TopListing = { id: string; title: string; location: string; rating: number; image?: string; price?: number };
type RecentBooking = { id: string; status: string; check_in: string; check_out: string; property?: { title: string; image?: string }; user?: { full_name: string; email: string } };

export default function AdminOverview() {
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [chart, setChart] = useState<{ label: string; value: number }[]>([]);
  const [topListings, setTopListings] = useState<TopListing[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const users = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        const listings = await supabase.from('properties').select('count', { count: 'exact', head: true });
        const bookings = await supabase.from('bookings').select('count', { count: 'exact', head: true });
        const reviews = await supabase.from('reviews').select('count', { count: 'exact', head: true });
        const pending = await supabase.from('reviews').select('count', { count: 'exact', head: true }).eq('status', 'pending');
        setKpi({
          users: (users.count as number) || 0,
          listings: (listings.count as number) || 0,
          bookings: (bookings.count as number) || 0,
          reviews: (reviews.count as number) || 0,
          pendingReviews: (pending.count as number) || 0,
        });

        const since = new Date();
        since.setMonth(since.getMonth() - 6);
        const { data: recent } = await supabase
          .from('bookings')
          .select('id,status,check_in,check_out,created_at')
          .gte('created_at', since.toISOString());
        const buckets: Record<string, number> = {};
        (recent || []).forEach((b: any) => {
          const d = new Date(b.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          buckets[key] = (buckets[key] || 0) + 1;
        });
        const labels = [...Array(6)].map((_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        });
        setChart(labels.map(l => ({ label: l, value: buckets[l] || 0 })));

        const { data: tops } = await supabase
          .from('properties')
          .select('id,title,location,rating,image,price')
          .order('rating', { ascending: false })
          .limit(5);
        setTopListings((tops as any[]) || []);

        const { data: rb } = await supabase
          .from('bookings')
          .select(`id,status,check_in,check_out,property:properties(title,image),user:profiles(full_name,email)`)
          .order('created_at', { ascending: false })
          .limit(5) as any;
        setRecentBookings((rb as any[]) || []);
      } catch {
        setKpi({ users: 0, listings: 0, bookings: 0, reviews: 0, pendingReviews: 0 });
        setChart([]);
        setTopListings([]);
        setRecentBookings([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    { label: "Total Users", value: kpi?.users ?? 0, icon: Users, change: "+12%", trend: "up", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Listings", value: kpi?.listings ?? 0, icon: Home, change: "+5%", trend: "up", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Bookings", value: kpi?.bookings ?? 0, icon: Calendar, change: "+18%", trend: "up", color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending Reviews", value: kpi?.pendingReviews ?? 0, icon: MessageSquare, change: "-2%", trend: "down", color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500 mt-2 text-lg">Platform performance and key metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-gray-900 transition-colors">
                {stat.label}
              </CardTitle>
              <div className={`p-2.5 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 tracking-tight">{loading ? "..." : stat.value}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${stat.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
                <span className="text-xs text-gray-400">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Booking Trends</h2>
            <Button variant="outline" size="sm" className="rounded-lg">View Report</Button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="h-64 flex items-end gap-4">
              {chart.map((c, i) => (
                <div key={c.label} className="flex-1 flex flex-col justify-end group cursor-pointer">
                  <div
                    className="bg-gray-900 rounded-t-lg transition-all duration-300 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/20 relative"
                    style={{ height: `${Math.max((c.value || 0) * 15, 4)}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {c.value} bookings
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-3 text-center font-medium">{c.label.split('-')[1]}</div>
                </div>
              ))}
              {chart.length === 0 && <div className="w-full h-full flex items-center justify-center text-gray-400">No data available</div>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">View All</Button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <div className="min-w-[600px]">
                  <div className="grid grid-cols-4 gap-4 p-5 border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-2">Property & Guest</div>
                    <div>Dates</div>
                    <div className="text-right">Status</div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-gray-50/50 transition-colors">
                        <div className="col-span-2 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            <img src={booking.property?.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60"} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{booking.property?.title}</p>
                            <p className="text-xs text-gray-500 truncate">{booking.user?.full_name || booking.user?.email || 'Guest'}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          {new Date(booking.check_in).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(booking.check_out).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {recentBookings.length === 0 && <div className="p-8 text-center text-gray-500">No recent bookings</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Top Listings</h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            {topListings.map((listing, i) => (
              <div key={listing.id} className="flex items-center gap-4 group cursor-pointer">
                <div className="text-lg font-bold text-gray-300 w-4">{i + 1}</div>
                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-all">
                  <img src={listing.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60"} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">{listing.title}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-medium text-gray-700">{listing.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">• {listing.location}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {topListings.length === 0 && <div className="text-center text-gray-500 py-4">No listings found</div>}
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg shadow-gray-900/20">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="font-bold text-lg">System Health</h3>
                <p className="text-gray-400 text-sm">All systems operational</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 text-gray-400">
                  <span>Database Load</span>
                  <span>24%</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[24%] rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5 text-gray-400">
                  <span>Storage Usage</span>
                  <span>68%</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[68%] rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5 text-gray-400">
                  <span>API Latency</span>
                  <span>45ms</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[15%] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
