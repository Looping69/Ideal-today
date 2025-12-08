import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, MessageSquare, CheckCircle, Clock, XCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Row = { id: string; property_id: string; user_id: string; rating: number; content: string; status: string; created_at: string };

export default function AdminReviews() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('reviews').select('id,property_id,user_id,rating,content,status,created_at').order('created_at', { ascending: false }).limit(20);
      setRows((data as any[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reviews Management</h1>
          <p className="text-gray-500 text-sm mt-1">Moderate and manage guest reviews.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Review Details</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Rating</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Content</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td className="px-6 py-12 text-center text-gray-500" colSpan={5}>Loading reviews...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="px-6 py-12 text-center text-gray-500" colSpan={5}>No reviews found</td></tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">Property: {r.property_id.slice(0, 8)}...</span>
                        <span className="text-xs text-gray-500">User: {r.user_id.slice(0, 8)}...</span>
                        <span className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 truncate max-w-xs" title={r.content}>
                        {r.content}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${r.status === 'published' ? 'bg-green-50 text-green-700 border-green-100' :
                          r.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                            'bg-gray-50 text-gray-700 border-gray-100'
                        }`}>
                        {r.status === 'published' && <CheckCircle className="w-3 h-3 mr-1.5" />}
                        {r.status === 'pending' && <Clock className="w-3 h-3 mr-1.5" />}
                        <span className="capitalize">{r.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

