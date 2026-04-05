import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, TrendingUp, Loader2, Calendar, LogIn, LogOut, BedDouble, Plus, Search, Trophy, ArrowRight, LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "@/lib/errors";

interface ActivityItem {
  type: 'enquiry' | 'review';
  title: string;
  desc: string;
  time: Date;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export default function HostDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({
    enquiries: 0,
    rating: 0,
    occupancy: 0
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
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

      // 2. Fetch enquiries (from bookings table)
      const { data: enquiriesData } = await supabase
        .from("bookings")
        .select("id, status, check_in, check_out, created_at, user:profiles(full_name)")
        .in("property_id", propIds)
        .neq('status', 'canceled');

      const allEnquiries = enquiriesData || [];

      // 3. Fetch reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("rating, created_at, content, user:profiles(full_name)")
        .in("property_id", propIds)
        .order("created_at", { ascending: false })
        .limit(5);

      // --- Calculate Stats ---
      const activeEnquiriesCount = allEnquiries.filter(b => b.status === 'pending' || b.status === 'confirmed').length;

      const { data: ratingsData } = await supabase.from("reviews").select("rating").in("property_id", propIds);
      const totalRating = (ratingsData || []).reduce((sum, r) => sum + r.rating, 0);
      const avgRating = ratingsData?.length ? (totalRating / ratingsData.length).toFixed(1) : 0;

      // --- Occupancy Graph ---
      const next7Days = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const occupiedCount = allEnquiries.filter(b => {
          const start = new Date(b.check_in);
          const end = new Date(b.check_out);
          return (b.status === 'confirmed' || b.status === 'completed' || b.status === 'blocked') &&
            d >= start && d < end;
        }).length;
        const occupancyPct = totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : 0;
        next7Days.push({ name: dayNames[d.getDay()], occupancy: occupancyPct });
      }

      // --- Activity Feed ---
      const feedItems: ActivityItem[] = [];
      allEnquiries
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .forEach((b) => {
          const userProfile = Array.isArray(b.user) ? b.user[0] : b.user;
          const userName = (userProfile as { full_name: string })?.full_name;
          feedItems.push({
            type: 'enquiry',
            title: b.status === 'pending' ? 'New Enquiry Request' : 'New Enquiry',
            desc: `${userName || 'User'} - ${new Date(b.check_in).toLocaleDateString()}`,
            time: new Date(b.created_at),
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
          });
        });

      (reviewsData || []).forEach((r) => {
        const userProfile = Array.isArray(r.user) ? r.user[0] : r.user;
        const userName = (userProfile as { full_name: string })?.full_name;
        feedItems.push({
          type: 'review',
          title: 'New Review',
          desc: `${r.rating} stars from ${userName || 'User'}`,
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
        enquiries: activeEnquiriesCount,
        rating: Number(avgRating),
        occupancy: avgOccupancy
      });

    } catch (error: unknown) {
      console.error("Error fetching host data:", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [occupancyData, setOccupancyData] = useState<{ name: string; occupancy: number }[]>([]);

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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Host Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your properties and visibility on Ideal Stay.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/host/create')} className="bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20">
            <Plus className="w-4 h-4 mr-2" />
            Create Listing
          </Button>
        </div>
      </div>


      {/* Host Growth Promo */}
      <Card className="border-none bg-gradient-to-r from-cyan-700 to-blue-800 text-white overflow-hidden relative shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy className="w-32 h-32" />
        </div>
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-bold">Grow Supply, Earn Visibility</h2>
            <p className="text-cyan-100 max-w-lg">
              Invite strong hosts, track qualified activation, and earn rewards that actually help your reach instead of just inflating a points counter.
            </p>
          </div>
          <Button
            onClick={() => navigate('/host/referrals')}
            className="bg-white text-cyan-700 hover:bg-cyan-50 font-bold px-8 h-12 rounded-xl transition-transform hover:scale-105"
          >
            Open Host Growth <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Active Enquiries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.enquiries}</div>
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12.5% lead conversion
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">User Feedback</CardTitle>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
