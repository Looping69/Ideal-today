import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
    TrendingUp,
    ArrowUpRight,
    Download,
    Filter,
    Search,
    CreditCard,
    BarChart3,
    Clock
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from '@/lib/errors';

type Transaction = {
    id: string;
    created_at: string;
    amount: number;
    fee_amount: number;
    status: string;
    user_email: string;
    property_title: string;
    booking_id: string;
};

export default function AdminFinancials() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [search, setSearch] = useState('');
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

    const fetchFinancialData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch bookings to derive income
            // In a real app, you'd have a 'transactions' or 'payouts' table
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select(`
          id,
          created_at,
          total_price,
          status,
          user:profiles(email),
          property:properties(title, service_fee)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatted: Transaction[] = (bookings || []).map((b) => {
                const total = b.total_price || 0;
                // Fallback to 10% if property doesn't have a specific fee set
                const property = (Array.isArray(b.property) ? b.property[0] : b.property) as { title: string; service_fee?: number } | null;
                const userProfile = (Array.isArray(b.user) ? b.user[0] : b.user) as { email: string } | null;
                const feePercent = property?.service_fee || 10;
                return {
                    id: `TX-${b.id.slice(0, 8).toUpperCase()}`,
                    booking_id: b.id,
                    created_at: b.created_at,
                    amount: total,
                    fee_amount: total * (feePercent / 100),
                    status: b.status,
                    user_email: userProfile?.email || 'N/A',
                    property_title: property?.title || 'N/A'
                };
            });

            setTransactions(formatted);
        } catch (e: unknown) {
            console.error('Error fetching financials:', getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFinancialData();
    }, [timeRange, fetchFinancialData]);

    const filtered = useMemo(() => {
        return transactions.filter(t =>
            t.user_email.toLowerCase().includes(search.toLowerCase()) ||
            t.property_title.toLowerCase().includes(search.toLowerCase()) ||
            t.id.toLowerCase().includes(search.toLowerCase())
        );
    }, [transactions, search]);

    const stats = useMemo(() => {
        const confirmed = transactions.filter(t => t.status === 'confirmed' || t.status === 'completed');
        const totalVolume = confirmed.reduce((acc, curr) => acc + curr.amount, 0);
        const totalRevenue = confirmed.reduce((acc, curr) => acc + curr.fee_amount, 0);
        const pendingRevenue = transactions.filter(t => t.status === 'pending').reduce((acc, curr) => acc + curr.fee_amount, 0);

        return {
            totalVolume,
            totalRevenue,
            pendingRevenue,
            transactionCount: confirmed.length
        };
    }, [transactions]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financial Overview</h1>
                    <p className="text-gray-500 mt-2 text-lg">Track platform revenue, fees, and transaction history.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl">
                        <Filter className="w-4 h-4 mr-2" />
                        Custom Range
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-blue-600 text-white rounded-2xl overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <Badge className="bg-white/20 text-white border-none hover:bg-white/30">+14.2%</Badge>
                        </div>
                        <div className="text-sm font-medium opacity-80">Total Revenue (Fees)</div>
                        <div className="text-3xl font-bold mt-1">R{stats.totalRevenue.toLocaleString()}</div>
                        <div className="mt-4 text-xs opacity-60">Platform earnings from all bookings</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-green-50 rounded-xl text-green-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="border-green-100 text-green-700">+8.4%</Badge>
                        </div>
                        <div className="text-sm font-medium text-gray-500">Gross Booking Volume</div>
                        <div className="text-3xl font-bold mt-1 text-gray-900">R{stats.totalVolume.toLocaleString()}</div>
                        <div className="mt-4 text-xs text-gray-400 font-medium flex items-center gap-1 text-green-600">
                            <ArrowUpRight className="w-3 h-3" />
                            Above last month
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                                <Clock className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="border-orange-100 text-orange-700">Awaiting</Badge>
                        </div>
                        <div className="text-sm font-medium text-gray-500">Pending Revenue</div>
                        <div className="text-3xl font-bold mt-1 text-gray-900">R{stats.pendingRevenue.toLocaleString()}</div>
                        <div className="mt-4 text-xs text-gray-400 font-medium">From pending booking requests</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <Badge variant="outline" className="border-purple-100 text-purple-700">Active</Badge>
                        </div>
                        <div className="text-sm font-medium text-gray-500">Transactions</div>
                        <div className="text-3xl font-bold mt-1 text-gray-900">{stats.transactionCount}</div>
                        <div className="mt-4 text-xs text-gray-400 font-medium">Successful bookings processed</div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search transactions..."
                                className="pl-9 w-full md:w-72 bg-gray-50/50 border-gray-100 focus:bg-white transition-colors"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-gray-50 p-1 rounded-xl">
                            {(['7d', '30d', 'all'] as const).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setTimeRange(r as '7d' | '30d' | '90d' | 'all')}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {r === 'all' ? 'All Time' : r.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                        Showing {filtered.length} transactions
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Source / Property</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Gross Amount</th>
                                <th className="px-6 py-4">Platform Fee</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                            Loading financial records...
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="font-mono text-xs font-bold text-gray-900">{t.id}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">FROM BK-{t.booking_id.slice(0, 6).toUpperCase()}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{t.property_title}</div>
                                        <div className="text-xs text-gray-500">{t.user_email}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm text-gray-600">
                                            {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                            {new Date(t.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-bold text-gray-900">R{t.amount.toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-bold text-blue-600">+ R{t.fee_amount.toLocaleString()}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">10% commission</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.status === 'completed' || t.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                            t.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No transactions found match your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

