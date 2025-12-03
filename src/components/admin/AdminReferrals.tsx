import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type RefRow = { id: string; referrer_id: string; referee_id: string; status: 'pending'|'confirmed'|'rewarded'; created_at: string; rewarded_at?: string };

export default function AdminReferrals() {
  const [tab, setTab] = useState<'guest' | 'host'>('guest');
  const [status, setStatus] = useState<'all'|'pending'|'confirmed'|'rewarded'>('all');
  const [rows, setRows] = useState<RefRow[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const [names, setNames] = useState<Record<string, { email?: string; full_name?: string }>>({});
  const [referrerEmail, setReferrerEmail] = useState('');
  const [refereeEmail, setRefereeEmail] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const load = async () => {
    const table = tab === 'guest' ? 'referrals' : 'host_referrals';
    let query = supabase.from(table).select('id,referrer_id,referee_id,status,created_at,rewarded_at').order('created_at', { ascending: false }).range(page * pageSize, page * pageSize + pageSize - 1);
    if (status !== 'all') query = query.eq('status', status);
    const { data } = await query as any;
    setRows((data as any[]) || []);
    setSelected({});
    const ids = Array.from(new Set(((data as any[]) || []).flatMap((r: any) => [r.referrer_id, r.referee_id])));
    if (ids.length) {
      const { data: profiles } = await supabase.from('profiles').select('id,email,full_name').in('id', ids);
      const map: Record<string, { email?: string; full_name?: string }> = {};
      (profiles || []).forEach((p: any) => { map[p.id] = { email: p.email, full_name: p.full_name }; });
      setNames(map);
    } else {
      setNames({});
    }
  };

  useEffect(() => { load(); }, [tab, status, page]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => {
      const a = names[r.referrer_id];
      const b = names[r.referee_id];
      return (a?.email || '').toLowerCase().includes(q) || (a?.full_name || '').toLowerCase().includes(q) || (b?.email || '').toLowerCase().includes(q) || (b?.full_name || '').toLowerCase().includes(q);
    });
  }, [rows, search, names]);

  const counts = useMemo(() => {
    let pending = 0, confirmed = 0, rewarded = 0;
    rows.forEach(r => {
      if (r.status === 'pending') pending++;
      else if (r.status === 'confirmed') confirmed++;
      else if (r.status === 'rewarded') rewarded++;
    });
    return { pending, confirmed, rewarded };
  }, [rows]);

  const updateStatus = async (id: string, next: 'pending'|'confirmed'|'rewarded') => {
    const table = tab === 'guest' ? 'referrals' : 'host_referrals';
    await supabase.from(table).update({ status: next, rewarded_at: next === 'rewarded' ? new Date().toISOString() : null }).eq('id', id);
    setRows(rs => rs.map(r => (r.id === id ? { ...r, status: next, rewarded_at: next === 'rewarded' ? new Date().toISOString() : undefined } : r)));
  };

  const removeRow = async (id: string) => {
    const table = tab === 'guest' ? 'referrals' : 'host_referrals';
    await supabase.from(table).delete().eq('id', id);
    setRows(rs => rs.filter(r => r.id !== id));
  };

  const createManual = async () => {
    if (!referrerEmail || !refereeEmail) return;
    const { data: referrer } = await supabase.from('profiles').select('id').eq('email', referrerEmail).single();
    const { data: referee } = await supabase.from('profiles').select('id').eq('email', refereeEmail).single();
    if (!referrer?.id || !referee?.id) return;
    const table = tab === 'guest' ? 'referrals' : 'host_referrals';
    const { data } = await supabase.from(table).insert({ referrer_id: referrer.id, referee_id: referee.id, status: 'pending' }).select('id,referrer_id,referee_id,status,created_at').single();
    setRows(rs => [data as any, ...rs]);
    setReferrerEmail('');
    setRefereeEmail('');
    await load();
  };

  const toggleSelect = (id: string, value?: boolean) => {
    setSelected(s => ({ ...s, [id]: value ?? !s[id] }));
  };

  const bulkUpdate = async (next: 'pending'|'confirmed'|'rewarded') => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (ids.length === 0) return;
    const table = tab === 'guest' ? 'referrals' : 'host_referrals';
    await supabase.from(table).update({ status: next, rewarded_at: next === 'rewarded' ? new Date().toISOString() : null }).in('id', ids);
    setRows(rs => rs.map(r => (selected[r.id] ? { ...r, status: next, rewarded_at: next === 'rewarded' ? new Date().toISOString() : r.rewarded_at } : r)));
    setSelected({});
  };

  const bulkDelete = async () => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (ids.length === 0) return;
    const table = tab === 'guest' ? 'referrals' : 'host_referrals';
    await supabase.from(table).delete().in('id', ids);
    setRows(rs => rs.filter(r => !selected[r.id]));
    setSelected({});
  };

  const exportCsv = () => {
    const headers = ['type','referrer','referee','status','created_at'];
    const lines = filtered.map(r => [tab, names[r.referrer_id]?.email || r.referrer_id, names[r.referee_id]?.email || r.referee_id, r.status, r.created_at]);
    const csv = [headers.join(','), ...lines.map(l => l.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals-${tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Referral Management</h1>
        <div className="flex gap-2">
          <Button variant={tab==='guest'?'default':'outline'} size="sm" onClick={() => setTab('guest')}>Guest</Button>
          <Button variant={tab==='host'?'default':'outline'} size="sm" onClick={() => setTab('host')}>Host</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Input className="w-64" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2">
          <Button size="sm" variant={status==='all'?'default':'outline'} onClick={() => setStatus('all')}>All</Button>
          <Button size="sm" variant={status==='pending'?'default':'outline'} onClick={() => setStatus('pending')}>Pending <Badge className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{counts.pending}</Badge></Button>
          <Button size="sm" variant={status==='confirmed'?'default':'outline'} onClick={() => setStatus('confirmed')}>Confirmed <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">{counts.confirmed}</Badge></Button>
          <Button size="sm" variant={status==='rewarded'?'default':'outline'} onClick={() => setStatus('rewarded')}>Rewarded <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">{counts.rewarded}</Badge></Button>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => bulkUpdate('confirmed')}>Bulk Confirm</Button>
          <Button size="sm" variant="outline" onClick={() => bulkUpdate('rewarded')}>Bulk Reward</Button>
          <Button size="sm" variant="outline" onClick={bulkDelete}>Bulk Delete</Button>
          <Button size="sm" onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      <div className="border rounded-xl bg-white overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2">
                <input type="checkbox" onChange={(e) => {
                  const all: Record<string, boolean> = {};
                  filtered.forEach(r => { all[r.id] = e.target.checked; });
                  setSelected(all);
                }} />
              </th>
              <th className="text-left px-3 py-2">Referrer</th>
              <th className="text-left px-3 py-2">Referee</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Created</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={5}>No referrals</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2"><input type="checkbox" checked={!!selected[r.id]} onChange={() => toggleSelect(r.id)} /></td>
                <td className="px-3 py-2">{names[r.referrer_id]?.full_name || names[r.referrer_id]?.email || r.referrer_id.slice(0,8)+'…'}</td>
                <td className="px-3 py-2">{names[r.referee_id]?.full_name || names[r.referee_id]?.email || r.referee_id.slice(0,8)+'…'}</td>
                <td className="px-3 py-2 capitalize">{r.status}</td>
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'pending')}>Pending</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'confirmed')}>Confirm</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'rewarded')}>Reward</Button>
                    <Button size="sm" variant="outline" onClick={() => removeRow(r.id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 border rounded-xl bg-white">
        <h2 className="font-semibold mb-2">Create Referral Manually ({tab})</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <Input className="w-64" placeholder="Referrer email" value={referrerEmail} onChange={(e) => setReferrerEmail(e.target.value)} />
          <Input className="w-64" placeholder="Referee email" value={refereeEmail} onChange={(e) => setRefereeEmail(e.target.value)} />
          <Button onClick={createManual}>Create</Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Emails must exist in profiles.</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="outline" disabled={page===0} onClick={() => setPage(p => Math.max(0, p-1))}>Prev</Button>
        <span className="text-sm text-gray-600">Page {page+1}</span>
        <Button variant="outline" onClick={() => setPage(p => p+1)}>Next</Button>
      </div>
    </div>
  );
}
