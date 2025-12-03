import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Row = { id: string; email: string; full_name: string; is_admin: boolean; deactivated?: boolean; points?: number };

export default function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => (r.email || '').toLowerCase().includes(q) || (r.full_name || '').toLowerCase().includes(q));
  }, [rows, search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id,email,full_name,is_admin,deactivated,points')
        .order('created_at', { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);
      setRows(((data as any[]) || []).map(r => ({ id: r.id, email: r.email, full_name: r.full_name, is_admin: !!r.is_admin, deactivated: !!r.deactivated, points: r.points })));
      setLoading(false);
    };
    load();
  }, [page]);

  const toggleAdmin = async (id: string, next: boolean) => {
    await supabase.from('profiles').update({ is_admin: next }).eq('id', id);
    setRows(rs => rs.map(r => (r.id === id ? { ...r, is_admin: next } : r)));
  };

  const toggleDeactivate = async (id: string, next: boolean) => {
    await supabase.from('profiles').update({ deactivated: next }).eq('id', id);
    setRows(rs => rs.map(r => (r.id === id ? { ...r, deactivated: next } : r)));
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        </div>
      </div>

      <div className="overflow-auto border rounded-xl bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Name</th>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">Points</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-6" colSpan={6}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-3 py-6 text-gray-500" colSpan={6}>No users</td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.full_name || '—'}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{r.points ?? 0}</td>
                  <td className="px-3 py-2">{r.deactivated ? 'Deactivated' : 'Active'}</td>
                  <td className="px-3 py-2">{r.is_admin ? 'Admin' : 'User'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleAdmin(r.id, !r.is_admin)}>{r.is_admin ? 'Remove admin' : 'Make admin'}</Button>
                      <Button size="sm" variant="outline" onClick={() => toggleDeactivate(r.id, !r.deactivated)}>{r.deactivated ? 'Activate' : 'Deactivate'}</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</Button>
        <span className="text-sm text-gray-600">Page {page + 1}</span>
        <Button variant="outline" onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
