import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

type Row = { id: string; property_id: string; user_id: string; status: string; check_in: string; check_out: string; user?: { email?: string; full_name?: string }; property?: { title?: string } };

export default function AdminBookings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<'past' | 'current' | 'future'>('current');
  const [status, setStatus] = useState<'all'|'pending'|'confirmed'|'completed'|'canceled'>('all');
  const [search, setSearch] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [listingFilter, setListingFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      let query = supabase
        .from('bookings')
        .select('id,property_id,user_id,status,check_in,check_out,user:profiles!bookings_user_id_fkey(email,full_name),property:properties(title)')
        .order('created_at', { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);
      if (status !== 'all') query = query.eq('status', status);
      const { data } = await query as any;
      setRows((data as any[]) || []);
    };
    load();
  }, [status, page]);

  const now = new Date();
  const filtered = useMemo(() => {
    const base = rows.filter(r => {
      const ci = new Date(r.check_in);
      const co = new Date(r.check_out);
      if (tab === 'past') return co <= now;
      if (tab === 'current') return ci <= now && co > now;
      return ci > now; // future
    });
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    let list = base.filter(r => (
      (r.property_id || '').toLowerCase().includes(q) ||
      (r.user_id || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q) ||
      (r.user?.email || '').toLowerCase().includes(q) ||
      (r.user?.full_name || '').toLowerCase().includes(q) ||
      (r.property?.title || '').toLowerCase().includes(q)
    ));
    if (emailFilter.trim()) {
      const e = emailFilter.toLowerCase();
      list = list.filter(r => (r.user?.email || '').toLowerCase().includes(e));
    }
    if (nameFilter.trim()) {
      const n = nameFilter.toLowerCase();
      list = list.filter(r => (r.user?.full_name || '').toLowerCase().includes(n));
    }
    if (listingFilter.trim()) {
      const l = listingFilter.toLowerCase();
      list = list.filter(r => (r.property?.title || '').toLowerCase().includes(l));
    }
    return list;
  }, [rows, tab, now, search, emailFilter, nameFilter, listingFilter]);

  const counts = useMemo(() => {
    let past = 0, current = 0, future = 0;
    rows.forEach(r => {
      const ci = new Date(r.check_in);
      const co = new Date(r.check_out);
      if (co <= now) past++;
      else if (ci <= now && co > now) current++;
      else future++;
    });
    return { past, current, future };
  }, [rows, now]);


  const updateStatus = async (id: string, next: 'pending'|'confirmed'|'completed'|'canceled') => {
    const { error } = await supabase.from('bookings').update({ status: next }).eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else setRows(rs => rs.map(r => (r.id === id ? { ...r, status: next } : r)));
  };


  const shiftDates = async (id: string, days: number) => {
    const b = rows.find(r => r.id === id);
    if (!b) return;
    const ci = new Date(b.check_in);
    const co = new Date(b.check_out);
    ci.setDate(ci.getDate() + days);
    co.setDate(co.getDate() + days);
    const { error } = await supabase.from('bookings').update({ check_in: ci.toISOString(), check_out: co.toISOString() }).eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else setRows(rs => rs.map(r => (r.id === id ? { ...r, check_in: ci.toISOString(), check_out: co.toISOString() } : r)));
  };

  const reassignUser = async (id: string, email: string) => {
    const { data: profile, error: e } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (e || !profile?.id) { toast({ variant: 'destructive', title: 'Error', description: 'User not found' }); return; }
    const { error } = await supabase.from('bookings').update({ user_id: profile.id }).eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else setRows(rs => rs.map(r => (r.id === id ? { ...r, user_id: profile.id } : r)));
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="sticky top-20 z-10 bg-white h-16 border-b">
        <div className="h-full px-1 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Bookings</h1>
          <div className="flex gap-2">
            <Button variant={tab==='past'?'default':'outline'} size="sm" onClick={() => setTab('past')}>Past <span className="ml-2 text-xs text-gray-500">{counts.past}</span></Button>
            <Button variant={tab==='current'?'default':'outline'} size="sm" onClick={() => setTab('current')}>Happening <span className="ml-2 text-xs text-gray-500">{counts.current}</span></Button>
            <Button variant={tab==='future'?'default':'outline'} size="sm" onClick={() => setTab('future')}>Upcoming <span className="ml-2 text-xs text-gray-500">{counts.future}</span></Button>
          </div>
          <div className="flex gap-2 items-center ml-auto">
            <Input className="w-48" placeholder="Search all" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Input className="w-44" placeholder="Email" value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} />
            <Input className="w-44" placeholder="Name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
            <Input className="w-44" placeholder="Listing" value={listingFilter} onChange={(e) => setListingFilter(e.target.value)} />
            <Button variant={status==='all'?'default':'outline'} size="sm" onClick={() => setStatus('all')}>All</Button>
            <Button variant={status==='pending'?'default':'outline'} size="sm" onClick={() => setStatus('pending')}>Pending</Button>
            <Button variant={status==='confirmed'?'default':'outline'} size="sm" onClick={() => setStatus('confirmed')}>Confirmed</Button>
            <Button variant={status==='completed'?'default':'outline'} size="sm" onClick={() => setStatus('completed')}>Completed</Button>
            <Button variant={status==='canceled'?'default':'outline'} size="sm" onClick={() => setStatus('canceled')}>Canceled</Button>
          </div>
        </div>
      </div>
      <div className="mt-16 overflow-auto border rounded-xl bg-white relative z-0">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Property</th>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Dates</th>
              <th className="text-left px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">No bookings in this tab.</td>
              </tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.property?.title || r.property_id.slice(0,8)+'…'}</td>
                <td className="px-3 py-2">{r.user?.full_name || r.user?.email || r.user_id.slice(0,8)+'…'}</td>
                <td className="px-3 py-2 capitalize">{r.status}</td>
                <td className="px-3 py-2">{new Date(r.check_in).toLocaleDateString()} → {new Date(r.check_out).toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'confirmed')}>Confirm</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'completed')}>Complete</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'canceled')}>Cancel</Button>
                    <Button size="sm" variant="outline" onClick={() => shiftDates(r.id, 1)}>+1 day</Button>
                    <Button size="sm" variant="outline" onClick={() => shiftDates(r.id, -1)}>-1 day</Button>
                    <InlineReassign id={r.id} onSubmit={reassignUser} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InlineReassign({ id, onSubmit }: { id: string; onSubmit: (id: string, email: string) => void }) {
  const [email, setEmail] = useState('');
  return (
    <div className="flex gap-2 items-center">
      <Input className="w-40" placeholder="user email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button size="sm" variant="outline" onClick={() => onSubmit(id, email)} disabled={!email}>Reassign</Button>
    </div>
  );
}
