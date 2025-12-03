import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

type Row = { id: string; property_id: string; user_id: string; status: string; check_in: string; check_out: string };

export default function AdminBookings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<'past' | 'current' | 'future'>('current');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('bookings').select('id,property_id,user_id,status,check_in,check_out').order('created_at', { ascending: false }).limit(20);
      setRows((data as any[]) || []);
    };
    load();
  }, []);

  const now = new Date();
  const filtered = useMemo(() => {
    return rows.filter(r => {
      const ci = new Date(r.check_in);
      const co = new Date(r.check_out);
      if (tab === 'past') return co <= now;
      if (tab === 'current') return ci <= now && co > now;
      return ci > now; // future
    });
  }, [rows, tab, now]);

  const counts = useMemo(() => {
    let past = 0, current = 0, future = 0;
    rows.forEach(r => {
      const ci = new Date(r.check_in);
      const co = new Date(r.check_out);
      if (co <= now) past++;
      else if (ci <= now && co > now) current++;
      else future++;
    });
    return { past, current, future };
  }, [rows, now]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="sticky top-20 z-10 bg-white h-12 border-b">
        <div className="-4 h-full px-1 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Bookings</h1>
          <div className="flex gap-2">
            <Button variant={tab==='past'?'default':'outline'} size="sm" onClick={() => setTab('past')}>Past <span className="ml-2 text-xs text-gray-500">{counts.past}</span></Button>
            <Button variant={tab==='current'?'default':'outline'} size="sm" onClick={() => setTab('current')}>Happening <span className="ml-2 text-xs text-gray-500">{counts.current}</span></Button>
            <Button variant={tab==='future'?'default':'outline'} size="sm" onClick={() => setTab('future')}>Upcoming <span className="ml-2 text-xs text-gray-500">{counts.future}</span></Button>
          </div>
        </div>
      </div>
      <div className="mt-16 overflow-auto border rounded-xl bg-white relative z-0">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Property</th>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Dates</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">No bookings in this tab.</td>
              </tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.property_id.slice(0,8)}…</td>
                <td className="px-3 py-2">{r.user_id.slice(0,8)}…</td>
                <td className="px-3 py-2 capitalize">{r.status}</td>
                <td className="px-3 py-2">{new Date(r.check_in).toLocaleDateString()} → {new Date(r.check_out).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
