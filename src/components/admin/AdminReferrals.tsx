import { useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Gift, CheckCircle, Clock, MoreHorizontal, Download, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useCallback } from 'react';
import { invokeEngagementAction } from '@/lib/backend';

type RefRow = { id: string; referrer_id: string; referee_id: string; status: 'pending' | 'confirmed' | 'rewarded'; created_at: string; rewarded_at?: string };

export default function AdminReferrals() {
  const [tab, setTab] = useState<'guest' | 'host'>('guest');
  const [status, setStatus] = useState<'all' | 'pending' | 'confirmed' | 'rewarded'>('all');
  const [rows, setRows] = useState<RefRow[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const [names, setNames] = useState<Record<string, { email?: string; full_name?: string }>>({});
  const [referrerEmail, setReferrerEmail] = useState('');
  const [refereeEmail, setRefereeEmail] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const table = tab === 'guest' ? 'referrals' : 'host_referrals';
    let query = supabase.from(table).select('id,referrer_id,referee_id,status,created_at,rewarded_at').order('created_at', { ascending: false }).range(page * pageSize, page * pageSize + pageSize - 1);
    if (status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) {
      console.error('Error loading referrals:', getErrorMessage(error));
    } else {
      setRows((data as unknown as RefRow[] || []));
      setSelected({});
      const ids = Array.from(new Set(((data as unknown as RefRow[] || []).flatMap(r => [r.referrer_id, r.referee_id]))));
      if (ids.length) {
        const { data: profiles } = await supabase.from('profiles').select('id,email,full_name').in('id', ids);
        const map: Record<string, { email?: string; full_name?: string }> = {};
        (profiles || []).forEach(p => { map[p.id] = { email: p.email, full_name: p.full_name }; });
        setNames(map);
      } else {
        setNames({});
      }
    }
    setLoading(false);
  }, [tab, status, page, pageSize]);

  useEffect(() => { load(); }, [tab, status, page, load]);

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

  const updateStatus = async (id: string, next: 'pending' | 'confirmed' | 'rewarded') => {
    const table = tab === 'guest' ? 'referrals' : 'host_referrals';
    await invokeEngagementAction({
      action: 'admin-update-referral-status',
      table,
      id,
      status: next,
    });
    setRows(rs => rs.map(r => (r.id === id ? { ...r, status: next, rewarded_at: next === 'rewarded' ? new Date().toISOString() : undefined } : r)));
  };

  const removeRow = async (id: string) => {
    const table = tab === 'guest' ? 'referrals' : 'host_referrals';
    await invokeEngagementAction({
      action: 'admin-delete-referral',
      table,
      id,
    });
    setRows(rs => rs.filter(r => r.id !== id));
  };

  const createManual = async () => {
    if (!referrerEmail || !refereeEmail) return;
    const table = tab === 'guest' ? 'referrals' : 'host_referrals';
    const result = await invokeEngagementAction<{ referral: RefRow }>({
      action: 'admin-create-referral',
      table,
      referrerEmail,
      refereeEmail,
    });
    setRows(rs => [result.referral, ...rs]);
    setReferrerEmail('');
    setRefereeEmail('');
    await load();
  };

  const toggleSelect = (id: string, value?: boolean) => {
    setSelected(s => ({ ...s, [id]: value ?? !s[id] }));
  };

  const bulkUpdate = async (next: 'pending' | 'confirmed' | 'rewarded') => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (ids.length === 0) return;
    const table = tab === 'guest' ? 'referrals' : 'host_referrals';
    await invokeEngagementAction({
      action: 'admin-bulk-update-referrals',
      table,
      ids,
      status: next,
    });
    setRows(rs => rs.map(r => (selected[r.id] ? { ...r, status: next, rewarded_at: next === 'rewarded' ? new Date().toISOString() : r.rewarded_at } : r)));
    setSelected({});
  };

  const bulkDelete = async () => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (ids.length === 0) return;
    const table = tab === 'guest' ? 'referrals' : 'host_referrals';
    await invokeEngagementAction({
      action: 'admin-bulk-delete-referrals',
      table,
      ids,
    });
    setRows(rs => rs.filter(r => !selected[r.id]));
    setSelected({});
  };

  const exportCsv = () => {
    const headers = ['type', 'referrer', 'referee', 'status', 'created_at'];
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Referral Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage user referrals.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search referrals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-64 bg-white border-gray-200 focus:border-primary focus:ring-primary/20 rounded-xl"
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-xl border-gray-200" onClick={exportCsv}>
            <Download className="w-4 h-4 text-gray-500" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-xl">
          <button
            onClick={() => setTab('guest')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'guest' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Guest Referrals
          </button>
          <button
            onClick={() => setTab('host')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'host' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Host Referrals
          </button>
        </div>

        <div className="flex gap-2">
          {Object.keys(selected).filter(k => selected[k]).length > 0 && (
            <>
              <Button size="sm" variant="outline" onClick={() => bulkUpdate('confirmed')} className="h-9">Confirm Selected</Button>
              <Button size="sm" variant="outline" onClick={() => bulkUpdate('rewarded')} className="h-9">Reward Selected</Button>
              <Button size="sm" variant="destructive" onClick={bulkDelete} className="h-9">Delete Selected</Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['all', 'pending', 'confirmed', 'rewarded'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s as 'all' | 'pending' | 'confirmed' | 'rewarded')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${status === s
              ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${status === s ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                {counts[s as keyof typeof counts]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" onChange={(e) => {
                    const all: Record<string, boolean> = {};
                    filtered.forEach(r => { all[r.id] = e.target.checked; });
                    setSelected(all);
                  }} />
                </th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Referrer</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Referee</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Date</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td className="px-6 py-12 text-center text-gray-500" colSpan={6}>Loading referrals...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-6 py-12 text-center text-gray-500" colSpan={6}>No referrals found</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" checked={!!selected[r.id]} onChange={() => toggleSelect(r.id)} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{names[r.referrer_id]?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">{names[r.referrer_id]?.email || r.referrer_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{names[r.referee_id]?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">{names[r.referee_id]?.email || r.referee_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${r.status === 'rewarded' ? 'bg-green-50 text-green-700 border-green-100' :
                        r.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-yellow-50 text-yellow-700 border-yellow-100'
                        }`}>
                        {r.status === 'rewarded' && <Gift className="w-3 h-3 mr-1.5" />}
                        {r.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1.5" />}
                        {r.status === 'pending' && <Clock className="w-3 h-3 mr-1.5" />}
                        <span className="capitalize">{r.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateStatus(r.id, 'confirmed')}>Mark Confirmed</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(r.id, 'rewarded')}>Mark Rewarded</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => removeRow(r.id)} className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {filtered.length > 0 ? page * pageSize + 1 : 0} to {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length} referrals
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className="h-8">
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} className="h-8">
              Next
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Create Manual Referral</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Referrer Email</label>
            <Input className="w-64" placeholder="referrer@example.com" value={referrerEmail} onChange={(e) => setReferrerEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Referee Email</label>
            <Input className="w-64" placeholder="referee@example.com" value={refereeEmail} onChange={(e) => setRefereeEmail(e.target.value)} />
          </div>
          <Button onClick={createManual} className="bg-gray-900 text-white hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            Create Referral
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-3">Both emails must exist in the system profiles.</p>
      </div>
    </div>
  );
}
