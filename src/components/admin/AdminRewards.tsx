import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Gift, Download, Trash2, Medal } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import type { RewardCompletionRecord } from '@/lib/api/types';

type Row = RewardCompletionRecord;

export default function AdminRewards() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [codeFilter, setCodeFilter] = useState<'all' | 'coastal_explorer' | 'photo_finisher'>('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [userEmail, setUserEmail] = useState('');
  const [manualCode, setManualCode] = useState<'coastal_explorer' | 'photo_finisher'>('coastal_explorer');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listRewards({
        page,
        pageSize,
        rewardCode: codeFilter === 'all' ? undefined : codeFilter,
      });
      setRows(data || []);
      setSelected({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, codeFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      r.user_id.toLowerCase().includes(q)
      || r.reward_code.toLowerCase().includes(q)
      || (r.user?.email || '').toLowerCase().includes(q)
      || (r.user?.full_name || '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const awardManual = async () => {
    if (!userEmail) return;
    const reward = await adminApi.awardReward({ userEmail, rewardCode: manualCode });
    setRows(rs => [reward, ...rs]);
    setUserEmail('');
  };

  const bulkDelete = async () => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (ids.length === 0) return;
    await adminApi.deleteRewards({ rewardIds: ids });
    setRows(rs => rs.filter(r => !selected[r.id]));
    setSelected({});
  };

  const exportCsv = () => {
    const headers = ['user_id', 'email', 'reward_code', 'created_at'];
    const lines = filtered.map(r => [r.user_id, r.user?.email || '', r.reward_code, r.created_at]);
    const csv = [headers.join(','), ...lines.map(l => l.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rewards.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id: string) => {
    setSelected(s => ({ ...s, [id]: !s[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Rewards Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage user rewards and achievements.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search rewards..."
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
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setCodeFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${codeFilter === 'all'
                ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            All Rewards
          </button>
          <button
            onClick={() => setCodeFilter('coastal_explorer')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${codeFilter === 'coastal_explorer'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            Coastal Explorer
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${codeFilter === 'coastal_explorer' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
              }`}>+500</span>
          </button>
          <button
            onClick={() => setCodeFilter('photo_finisher')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${codeFilter === 'photo_finisher'
                ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            Photo Finisher
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${codeFilter === 'photo_finisher' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
              }`}>+200</span>
          </button>
        </div>

        {Object.keys(selected).filter(k => selected[k]).length > 0 && (
          <Button size="sm" variant="destructive" onClick={bulkDelete} className="h-9">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
        )}
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
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">User</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Reward</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Date Awarded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td className="px-6 py-12 text-center text-gray-500" colSpan={4}>Loading rewards...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-6 py-12 text-center text-gray-500" colSpan={4}>No rewards found</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" checked={!!selected[r.id]} onChange={() => toggleSelect(r.id)} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{r.user?.full_name || 'Unknown user'}</div>
                      <div className="font-mono text-xs text-gray-500">{r.user?.email || r.user_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${r.reward_code === 'coastal_explorer' ? 'bg-blue-100 text-blue-600' :
                            r.reward_code === 'photo_finisher' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                          <Medal className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-900 capitalize">{r.reward_code.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {filtered.length > 0 ? page * pageSize + 1 : 0} to {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length} rewards
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
        <h2 className="text-lg font-bold text-gray-900 mb-4">Manual Award</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">User Email</label>
            <Input className="w-64" placeholder="user@example.com" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Reward Type</label>
            <select
              className="h-10 w-64 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value as any)}
            >
              <option value="coastal_explorer">Coastal Explorer (+500)</option>
              <option value="photo_finisher">Photo Finisher (+200)</option>
            </select>
          </div>
          <Button onClick={awardManual} className="bg-gray-900 text-white hover:bg-gray-800">
            <Gift className="w-4 h-4 mr-2" />
            Award Reward
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-3">Awards are stored in completions and points are incremented accordingly.</p>
      </div>
    </div>
  );
}
