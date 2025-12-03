import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminReferrals() {
  const [guestRefs, setGuestRefs] = useState<any[]>([]);
  const [hostRefs, setHostRefs] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const g = await supabase.from('referrals').select('referrer_id,referee_id,status,rewarded_at,created_at').order('created_at', { ascending: false }).limit(20);
      const h = await supabase.from('host_referrals').select('referrer_id,referee_id,status,rewarded_at,created_at').order('created_at', { ascending: false }).limit(20);
      setGuestRefs(g.data || []);
      setHostRefs(h.data || []);
    };
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Referrals</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RefList title="Guest Referrals" rows={guestRefs} />
        <RefList title="Host Referrals" rows={hostRefs} />
      </div>
    </div>
  );
}

function RefList({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="border rounded-xl bg-white overflow-auto">
      <div className="p-4 border-b"><h2 className="font-semibold">{title}</h2></div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2">Referrer</th>
            <th className="text-left px-3 py-2">Referee</th>
            <th className="text-left px-3 py-2">Status</th>
            <th className="text-left px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2">{r.referrer_id?.slice(0,8)}…</td>
              <td className="px-3 py-2">{r.referee_id?.slice(0,8)}…</td>
              <td className="px-3 py-2 capitalize">{r.status}</td>
              <td className="px-3 py-2">{new Date(r.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

