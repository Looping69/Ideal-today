import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';

type Row = { id: string; title: string; location: string; price: number };

export default function AdminListings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('properties').select('id,title,location,price').limit(50);
      const list = ((data as any[]) || []).map(r => ({ id: r.id, title: r.title, location: r.location, price: r.price }));
      setRows(list);

      const todayIso = new Date().toISOString();
      const { data: bookings } = await supabase
        .from('bookings')
        .select('property_id, check_in, check_out, status')
        .lte('check_in', todayIso)
        .gt('check_out', todayIso)
        .not('status', 'in', '("canceled","blocked")');

      const ids = new Set<string>();
      (bookings || []).forEach((b: any) => {
        ids.add(b.property_id);
      });
      setBookedIds(ids);
    };
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Listings</h1>
      <div className="overflow-auto border rounded-xl bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Title</th>
              <th className="text-left px-3 py-2">Location</th>
              <th className="text-left px-3 py-2">Price</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.title}</td>
                <td className="px-3 py-2">{r.location}</td>
                <td className="px-3 py-2">R{r.price}</td>
                <td className="px-3 py-2">
                  {bookedIds.has(r.id) ? (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Booked</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
