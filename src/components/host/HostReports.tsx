import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, Download, TrendingUp, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function HostReports() {
    const { user } = useAuth();
    const [period, setPeriod] = useState('30d');
    interface ChartDataPoint {
        name: string;
        revenue: number;
        bookings: number;
        occupancy: number;
    }

    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [metrics, setMetrics] = useState({
        revenue: 0,
        occupancy: 0,
        revpar: 0,
        formattedRevenue: "R0.00"
    });

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // 1. Get properties
                const { data: props } = await supabase.from('properties').select('id, price').eq('host_id', user.id);
                const properties = props || [];
                const propIds = properties.map(p => p.id);

                if (propIds.length === 0) {
                    return;
                }

                // 2. Determine date range
                const now = new Date();
                let startDate = new Date();
                switch (period) {
                    case '7d': startDate.setDate(now.getDate() - 7); break;
                    case '30d': startDate.setDate(now.getDate() - 30); break;
                    case '90d': startDate.setDate(now.getDate() - 90); break;
                    case 'ytd': startDate = new Date(now.getFullYear(), 0, 1); break;
                    default: startDate.setDate(now.getDate() - 30);
                }

                // 3. Fetch bookings in range
                const { data: bookings } = await supabase
                    .from('bookings')
                    .select('total_price, check_in, check_out, status, property_id')
                    .in('property_id', propIds)
                    .neq('status', 'canceled')
                    .gte('check_in', startDate.toISOString());

                // 4. Process Data
                const dailyStats: Record<string, { revenue: number; occupied: number; total_rooms: number }> = {};

                // Initialize daily buckets
                const dayCount = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                for (let i = 0; i <= dayCount; i++) {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + i);
                    const dateStr = d.toISOString().split('T')[0];
                    dailyStats[dateStr] = { revenue: 0, occupied: 0, total_rooms: properties.length };
                }

                (bookings || []).forEach(b => {
                    // Simple revenue attribution: entire amount on check-in day (simplification)
                    // Or split by days (better). Let's do split by days for accuracy if possible, 
                    // otherwise simple check-in attribution for chart trends.
                    // For chart, let's just attribute revenue to check-in date for simplicity.
                    const d = b.check_in.split('T')[0];
                    if (dailyStats[d]) {
                        dailyStats[d].revenue += b.total_price;
                        dailyStats[d].occupied += 1; // Rough occupancy count (1 booking = 1 unit occupied)
                    }
                });

                const chart = Object.keys(dailyStats).sort().map(date => {
                    const stats = dailyStats[date];
                    return {
                        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        revenue: stats.revenue,
                        bookings: stats.occupied, // Using occupied count as proxy for bookings activity
                        occupancy: stats.total_rooms > 0 ? Math.round((stats.occupied / stats.total_rooms) * 100) : 0
                    };
                });

                // Summary Metrics
                const totalRev = (bookings || []).reduce((sum, b) => sum + b.total_price, 0);
                const totalOccupiedNights = (bookings || []).length; // Simplified
                const totalAvailableNights = properties.length * dayCount;
                const occRate = totalAvailableNights > 0 ? (totalOccupiedNights / totalAvailableNights) * 100 : 0;
                const revPar = totalAvailableNights > 0 ? totalRev / totalAvailableNights : 0;

                setChartData(chart);
                setMetrics({
                    revenue: totalRev,
                    occupancy: Math.min(100, Math.round(occRate)),
                    revpar: Math.round(revPar),
                    formattedRevenue: new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(totalRev)
                });

            } catch (err: unknown) {
                console.error("Error fetching report data:", err);
            }
        };

        fetchData();
    }, [user, period]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics & Reports</h1>
                    <p className="text-gray-500 text-sm mt-1">Deep dive into your property performance.</p>
                </div>
                <div className="flex gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[140px]">
                            <Calendar className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 3 months</SelectItem>
                            <SelectItem value="ytd">Year to Date</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-900">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{metrics.formattedRevenue}</div>
                        <p className="text-xs text-blue-600 mt-1">for selected period</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-green-50/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-900">Occupancy Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900">{metrics.occupancy}%</div>
                        <p className="text-xs text-green-600 mt-1">average for period</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-purple-50/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-900">RevPAR</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900">R{metrics.revpar}</div>
                        <p className="text-xs text-purple-600 mt-1">Revenue per available room</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm border-gray-200">
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R${value}`} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="revenue" fill="#0f172a" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">No data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-200">
                    <CardHeader>
                        <CardTitle>Occupancy vs Bookings</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Line yAxisId="left" type="monotone" dataKey="occupancy" stroke="#2563eb" strokeWidth={2} dot={false} />
                                        <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#16a34a" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">No data</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
