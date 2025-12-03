import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminRewards() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('rewards_completions').select('user_id,reward_code,created_at').order('created_at', { ascending: false }).limit(50);
      setRows(data || []);
    };
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Rewards</h1>
      <div className="overflow-auto border rounded-xl bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">Reward</th>
              <th className="text-left px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{r.user_id.slice(0,8)}…</td>
                <td className="px-3 py-2">{r.reward_code}</td>
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

