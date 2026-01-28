import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShieldCheck, User, Ban, MoreHorizontal, CheckCircle2, XCircle, FileText, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Row = {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  deactivated?: boolean;
  points?: number;
  verification_status?: 'none' | 'pending' | 'verified' | 'rejected';
  verification_docs?: any;
  host_plan?: 'free' | 'standard' | 'premium';
};

export default function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const pageSize = 20;
  const { sendNotification } = useNotifications();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    let res = rows;

    // 1. Apple View Filter
    if (filter === 'pending') {
      res = res.filter(r => r.verification_status === 'pending');
    }

    // 2. Apply Search
    if (!search.trim()) return res;
    const q = search.toLowerCase();
    return res.filter(r => (r.email || '').toLowerCase().includes(q) || (r.full_name || '').toLowerCase().includes(q));
  }, [rows, search, filter]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id,email,full_name,is_admin,deactivated,points,verification_status,verification_docs,host_plan')
        .order('created_at', { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);

      setRows(((data as any[]) || []).map(r => ({
        id: r.id,
        email: r.email,
        full_name: r.full_name,
        is_admin: !!r.is_admin,
        deactivated: !!r.deactivated,
        points: r.points,
        verification_status: r.verification_status || 'none',
        verification_docs: r.verification_docs,
        host_plan: r.host_plan || 'free'
      })));
      setLoading(false);
    };
    load();
  }, [page, filter]);

  const toggleAdmin = async (id: string, next: boolean) => {
    await supabase.from('profiles').update({ is_admin: next }).eq('id', id);
    setRows(rs => rs.map(r => (r.id === id ? { ...r, is_admin: next } : r)));
  };

  const toggleDeactivate = async (id: string, next: boolean) => {
    await supabase.from('profiles').update({ deactivated: next }).eq('id', id);
    setRows(rs => rs.map(r => (r.id === id ? { ...r, deactivated: next } : r)));
  };

  const updateVerification = async (id: string, status: 'verified' | 'rejected') => {
    try {
      // 1. Update Profile Status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ verification_status: status })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Notify the User
      const title = status === 'verified' ? 'Verification Approved' : 'Verification Rejected';
      const message = status === 'verified'
        ? 'Congratulations! Your host verification has been approved. You now have full access to host features.'
        : 'Your verification documents were rejected. Please review our guidelines and try again.';

      await supabase.from('notifications').insert({
        user_id: id,
        title,
        message,
        type: status === 'verified' ? 'success' : 'error',
        link: '/host/verification'
      });

      // 3. Update Local State
      setRows(rs => rs.map(r => (r.id === id ? { ...r, verification_status: status } : r)));

      toast({
        title: "Status Updated",
        description: `User ${status === 'verified' ? 'approved' : 'rejected'} and notified successfully.`,
      });

    } catch (error: any) {
      console.error('Update failed:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update verification status."
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage user access, roles, and verification.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-72 bg-white border-gray-200 focus:border-primary focus:ring-primary/20 rounded-xl"
            />
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-100">
          <button
            onClick={() => setFilter('all')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${filter === 'all' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
          >
            All Users
            {filter === 'all' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${filter === 'pending' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Pending Verification
            {filter === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            {rows.filter(r => r.verification_status === 'pending').length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full">
                {rows.filter(r => r.verification_status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">User</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Role</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Plan</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Verification</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td className="px-6 py-12 text-center text-gray-500" colSpan={5}>Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-6 py-12 text-center text-gray-500" colSpan={5}>No users found</td></tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0">
                          {r.full_name?.slice(0, 2).toUpperCase() || r.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{r.full_name || '—'}</p>
                          <p className="text-xs text-gray-500 truncate">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${r.is_admin ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                        {r.is_admin ? <ShieldCheck className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                        {r.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${r.host_plan === 'premium' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        r.host_plan === 'standard' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-gray-50 text-gray-600 border-gray-100'
                        }`}>
                        {r.host_plan === 'premium' ? '★ Premium' : r.host_plan === 'standard' ? '✓ Standard' : 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.verification_status === 'verified' ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Verified</Badge>
                      ) : r.verification_status === 'pending' ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                              Review Docs
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Verification Documents</DialogTitle>
                              <DialogDescription>Review documents submitted by {r.full_name}</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                              {r.verification_docs?.id_front && (
                                <div>
                                  <p className="text-sm font-medium mb-2">ID Front</p>
                                  <img src={r.verification_docs.id_front} className="rounded-lg border w-full" />
                                </div>
                              )}
                              {r.verification_docs?.id_back && (
                                <div>
                                  <p className="text-sm font-medium mb-2">ID Back</p>
                                  <img src={r.verification_docs.id_back} className="rounded-lg border w-full" />
                                </div>
                              )}
                              {r.verification_docs?.selfie && (
                                <div>
                                  <p className="text-sm font-medium mb-2">Selfie</p>
                                  <img src={r.verification_docs.selfie} className="rounded-lg border w-full" />
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="destructive" onClick={() => updateVerification(r.id, 'rejected')}>Reject</Button>
                              <Button className="bg-green-600 hover:bg-green-700" onClick={() => updateVerification(r.id, 'verified')}>Approve</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : r.verification_status === 'rejected' ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Rejected</Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">Not submitted</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${!r.deactivated ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${!r.deactivated ? 'bg-green-500' : 'bg-red-500'}`} />
                        {!r.deactivated ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                          title={r.is_admin ? "Remove Admin" : "Make Admin"}
                          onClick={() => toggleAdmin(r.id, !r.is_admin)}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-8 w-8 p-0 ${r.deactivated ? 'text-green-600 hover:bg-green-50' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}
                          title={r.deactivated ? "Activate" : "Deactivate"}
                          onClick={() => toggleDeactivate(r.id, !r.deactivated)}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                              title="Send Notification"
                            >
                              <Bell className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Send Notification to {r.full_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input id={`title-${r.id}`} placeholder="Notification Title" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Message</label>
                                <Textarea id={`message-${r.id}`} placeholder="Message content..." />
                              </div>
                              <Button onClick={() => {
                                const title = (document.getElementById(`title-${r.id}`) as HTMLInputElement).value;
                                const message = (document.getElementById(`message-${r.id}`) as HTMLTextAreaElement).value;
                                if (title && message) {
                                  sendNotification(r.id, { title, message, type: 'info' });
                                  toast({ title: "Sent", description: "Notification sent successfully" });
                                }
                              }} className="w-full">Send</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {filtered.length > 0 ? page * pageSize + 1 : 0} to {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length} users
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
    </div>
  );
}
