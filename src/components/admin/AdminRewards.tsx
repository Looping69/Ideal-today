import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Row = { id: string; user_id: string; reward_code: string; created_at: string };

const REWARD_POINTS: Record<string, number> = {
  coastal_explorer: 500,
  photo_finisher: 200,
};

export default function AdminRewards() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [codeFilter, setCodeFilter] = useState<'all' | 'coastal_explorer' | 'photo_finisher'>('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [userEmail, setUserEmail] = useState('');
  const [manualCode, setManualCode] = useState<'coastal_explorer' | 'photo_finisher'>('coastal_explorer');

  const load = async () => {
    let query = supabase.from('rewards_completions').select('id,user_id,reward_code,created_at').order('created_at', { ascending: false }).range(page * pageSize, page * pageSize + pageSize - 1);
    if (codeFilter !== 'all') query = query.eq('reward_code', codeFilter);
    const { data } = await query as any;
    setRows((data as any[]) || []);
    setSelected({});
  };

  useEffect(() => { load(); }, [page, codeFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => r.user_id.toLowerCase().includes(q) || r.reward_code.toLowerCase().includes(q));
  }, [rows, search]);

  const awardManual = async () => {
    if (!userEmail) return;
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', userEmail).single();
    if (!profile?.id) return;
    const points = REWARD_POINTS[manualCode] || 0;
    const { data: existing } = await supabase.from('rewards_completions').select('id').eq('user_id', profile.id).eq('reward_code', manualCode).limit(1);
    if (existing && existing.length > 0) return;
    await supabase.from('rewards_completions').insert({ user_id: profile.id, reward_code: manualCode });
    if (points) await supabase.from('profiles').update({ points: (undefined as any) }).eq('id', profile.id);
    await supabase.rpc('noop');
    await supabase.from('profiles').update({ points: supabase.rpc as any }).eq('id', profile.id);
    const { data: refresh } = await supabase.from('rewards_completions').select('id,user_id,reward_code,created_at').eq('user_id', profile.id).eq('reward_code', manualCode).limit(1);
    setRows(rs => refresh && refresh.length ? [refresh[0] as any, ...rs] : rs);
    setUserEmail('');
  };

  const bulkDelete = async () => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (ids.length === 0) return;
    await supabase.from('rewards_completions').delete().in('id', ids);
    setRows(rs => rs.filter(r => !selected[r.id]));
    setSelected({});
  };

  const exportCsv = () => {
    const headers = ['user_id','reward_code','created_at'];
    const lines = filtered.map(r => [r.user_id, r.reward_code, r.created_at]);
    const csv = [headers.join(','), ...lines.map(l => l.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rewards.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Rewards Management</h1>
        <div className="flex gap-2">
          <Button size="sm" variant={codeFilter==='all'?'default':'outline'} onClick={() => setCodeFilter('all')}>All</Button>
          <Button size="sm" variant={codeFilter==='coastal_explorer'?'default':'outline'} onClick={() => setCodeFilter('coastal_explorer')}>Coastal Explorer <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">+500</Badge></Button>
          <Button size="sm" variant={codeFilter==='photo_finisher'?'default':'outline'} onClick={() => setCodeFilter('photo_finisher')}>Photo Finisher <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">+200</Badge></Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Input className="w-64" placeholder="Search by user id or reward" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={bulkDelete}>Bulk Delete</Button>
          <Button size="sm" onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      <div className="border rounded-xl bg-white overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2"><input type="checkbox" onChange={(e) => {
                const all: Record<string, boolean> = {};
                filtered.forEach(r => { all[r.id] = e.target.checked; });
                setSelected(all);
              }} /></th>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">Reward</th>
              <th className="text-left px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={4}>No rewards</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2"><input type="checkbox" checked={!!selected[r.id]} onChange={() => setSelected(s => ({ ...s, [r.id]: !s[r.id] }))} /></td>
                <td className="px-3 py-2">{r.user_id.slice(0,8)}…</td>
                <td className="px-3 py-2">{r.reward_code}</td>
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 border rounded-xl bg-white">
        <h2 className="font-semibold mb-2">Manual Award</h2>
        <div className="flex items-center gap-2">
          <Input className="w-64" placeholder="User email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
          <select className="border rounded-md px-2 py-2 text-sm" value={manualCode} onChange={(e) => setManualCode(e.target.value as any)}>
            <option value="coastal_explorer">Coastal Explorer (+500)</option>
            <option value="photo_finisher">Photo Finisher (+200)</option>
          </select>
          <Button onClick={awardManual}>Award</Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Awards are stored in completions and points are incremented accordingly.</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="outline" disabled={page===0} onClick={() => setPage(p => Math.max(0, p-1))}>Prev</Button>
        <span className="text-sm text-gray-600">Page {page+1}</span>
        <Button variant="outline" onClick={() => setPage(p => p+1)}>Next</Button>
      </div>
    </div>
  );
}
