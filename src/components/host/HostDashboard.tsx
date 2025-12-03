
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Users, Star, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function HostDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [hostReferralCode, setHostReferralCode] = useState<string | null>(null);
  const [hostRefs, setHostRefs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    revenue: 0,
    bookings: 0,
    rating: 0,
    views: 0
  });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch properties
        const { data: propsData, error: propsError } = await supabase
          .from("properties")
          .select("*")
          .eq("host_id", user.id);

        if (propsError) throw propsError;
        setProperties(propsData || []);

        // Fetch bookings for these properties
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("total_price, status")
          .in("property_id", (propsData || []).map(p => p.id));

        if (bookingsError) throw bookingsError;

        // Calculate stats
        const totalRevenue = (bookingsData || [])
          .filter(b => b.status !== 'canceled')
          .reduce((sum, b) => sum + (b.total_price || 0), 0);
        
        const activeBookings = (bookingsData || []).filter(b => b.status === 'pending' || b.status === 'confirmed').length;

        // Calculate average rating
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("rating")
          .in("property_id", (propsData || []).map(p => p.id));
        
        const avgRating = reviewsData?.length 
          ? (reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length).toFixed(1)
          : "0.0";

        setStats({
          revenue: totalRevenue,
          bookings: activeBookings,
          rating: Number(avgRating),
          views: 124 // Mock data for views as we don't track them yet
        });

        // Host referral code and invited hosts
        const { data: profile } = await supabase
          .from('profiles')
          .select('host_referral_code')
          .eq('id', user.id)
          .single();
        setHostReferralCode(profile?.host_referral_code || null);

        const { data: refs } = await supabase
          .from('host_referrals')
          .select('referee_id, status, created_at, rewarded_at')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false });
        setHostRefs(refs || []);

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

  const statCards = [
    {
      title: "Total Revenue",
      value: `R${stats.revenue.toLocaleString()}`,
      change: "+20.1% from last month",
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Active Bookings",
      value: stats.bookings.toString(),
      change: "+4 new this week",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Overall Rating",
      value: stats.rating.toString(),
      change: "Based on reviews",
      icon: Star,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      title: "Views",
      value: stats.views.toLocaleString(),
      change: "+15% from last month",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome back! Here's what's happening with your listings.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Your Listings</h2>
            <button className="text-sm text-primary font-medium hover:underline">View All</button>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-2">Property</div>
              <div>Status</div>
              <div className="text-right">Price</div>
            </div>
            <div className="divide-y divide-gray-100">
              {properties.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No listings yet. Create your first listing to get started!
                </div>
              ) : (
                properties.slice(0, 5).map((property) => (
                  <div key={property.id} className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                    <div className="col-span-2 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img src={property.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60"} alt={property.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 truncate">{property.title}</h3>
                        <p className="text-xs text-gray-500 truncate">{property.location}</p>
                      </div>
                    </div>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    <div className="text-right font-medium text-sm">
                      R{property.price}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold">Recent Activity</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Guest</span> booked <span className="font-medium">your property</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold">Host Referrals</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            {hostReferralCode ? (
              <>
                <div className="flex items-center gap-2">
                  <Input readOnly value={`${window.location.origin}?host_ref=${hostReferralCode}`} />
                  <Button onClick={() => navigator.clipboard.writeText(`${window.location.origin}?host_ref=${hostReferralCode}`)}>Copy</Button>
                </div>
                {hostRefs.length === 0 ? (
                  <p className="text-sm text-gray-500">No host referrals yet.</p>
                ) : (
                  <div className="space-y-2">
                    {hostRefs.map((r) => (
                      <div key={r.referee_id} className="flex justify-between text-sm border rounded-md px-3 py-2">
                        <span>{r.referee_id.slice(0,8)}…</span>
                        <span className="capitalize">{r.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Your host referral code will be generated on signup.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
