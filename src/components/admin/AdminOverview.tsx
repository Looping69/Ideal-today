import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type KPI = { users: number; listings: number; bookings: number; reviews: number; pendingReviews: number };
type TopListing = { id: string; title: string; location: string; rating: number };
type RecentBooking = { id: string; status: string; check_in: string; check_out: string; property?: { title: string } };

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
          .select('id,title,location,rating')
          .order('rating', { ascending: false })
          .limit(5);
        setTopListings((tops as any[]) || []);

        const { data: rb } = await supabase
          .from('bookings')
          .select(`id,status,check_in,check_out,property:properties(title)`) as any;
        setRecentBookings((rb as any[])?.slice(0, 5) || []);
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

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Stat label="Users" value={kpi?.users ?? 0} loading={loading} />
        <Stat label="Listings" value={kpi?.listings ?? 0} loading={loading} />
        <Stat label="Bookings" value={kpi?.bookings ?? 0} loading={loading} />
        <Stat label="Reviews" value={kpi?.reviews ?? 0} loading={loading} />
        <Stat label="Pending Reviews" value={kpi?.pendingReviews ?? 0} loading={loading} />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6 bg-white">
          <h2 className="font-semibold mb-2">Bookings (last 6 months)</h2>
          <div className="flex items-end gap-2 h-32">
            {chart.map((c) => (
              <div key={c.label} className="flex-1">
                <div className="bg-blue-500/70 rounded-t" style={{ height: `${(c.value || 0) * 12}px` }} />
                <div className="text-[10px] text-gray-500 mt-1 text-center">{c.label.split('-')[1]}</div>
              </div>
            ))}
            {chart.length === 0 && <div className="text-sm text-gray-500">No data</div>}
          </div>
        </div>

        <div className="border rounded-xl p-6 bg-white">
          <h2 className="font-semibold mb-2">Top Listings</h2>
          <ul className="divide-y">
            {topListings.map(t => (
              <li key={t.id} className="py-2 flex justify-between">
                <span className="text-sm text-gray-800">{t.title} <span className="text-gray-500">— {t.location}</span></span>
                <span className="text-sm font-medium">{t.rating?.toFixed?.(1) ?? t.rating}</span>
              </li>
            ))}
            {topListings.length === 0 && <li className="py-2 text-sm text-gray-500">No data</li>}
          </ul>
        </div>

        <div className="border rounded-xl p-6 bg-white lg:col-span-2">
          <h2 className="font-semibold mb-2">Recent Bookings</h2>
          <ul className="divide-y">
            {recentBookings.map(b => (
              <li key={b.id} className="py-2 text-sm flex justify-between">
                <span className="text-gray-800">{b.property?.title || b.id.slice(0,8)}</span>
                <span className="text-gray-500">{new Date(b.check_in).toLocaleDateString()} → {new Date(b.check_out).toLocaleDateString()}</span>
                <span className="capitalize">{b.status}</span>
              </li>
            ))}
            {recentBookings.length === 0 && <li className="py-2 text-sm text-gray-500">No data</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, loading }: { label: string; value: number; loading?: boolean }) {
  return (
    <div className="border rounded-xl p-6 bg-white">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{loading ? '—' : value}</div>
    </div>
  );
}
