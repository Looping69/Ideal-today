import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Row = { id: string; property_id: string; user_id: string; rating: number; content: string; status: string };

export default function AdminReviews() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('reviews').select('id,property_id,user_id,rating,content,status').order('created_at', { ascending: false }).limit(20);
      setRows((data as any[]) || []);
    };
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Reviews</h1>
      <div className="overflow-auto border rounded-xl bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Property</th>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">Rating</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Content</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.property_id.slice(0,8)}…</td>
                <td className="px-3 py-2">{r.user_id.slice(0,8)}…</td>
                <td className="px-3 py-2">{r.rating}</td>
                <td className="px-3 py-2 capitalize">{r.status}</td>
                <td className="px-3 py-2 truncate max-w-xs">{r.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

