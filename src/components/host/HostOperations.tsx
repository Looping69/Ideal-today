import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Search, Filter, MoreHorizontal, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function HostOperations() {
    const { user } = useAuth();
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<any[]>([]);
    const [stats, setStats] = useState({
        cleaning: 0,
        prep: 0,
        completed: 0,
        total: 0
    });

    useEffect(() => {
        if (!user) return;

        const fetchTasks = async () => {
            setLoading(true);
            try {
                // 1. Get properties
                const { data: props } = await supabase.from('properties').select('id, title').eq('host_id', user.id);
                const properties = props || [];
                const propIds = properties.map(p => p.id);
                const propMap = new Map(properties.map(p => [p.id, p.title]));

                if (propIds.length === 0) {
                    setLoading(false);
                    return;
                }

                // 2. Fetch recent/upcoming bookings (last 2 days, next 7 days)
                const today = new Date();
                const past = new Date(today); past.setDate(today.getDate() - 2);
                const future = new Date(today); future.setDate(today.getDate() + 7);

                const { data: bookings } = await supabase
                    .from('bookings')
                    .select('id, property_id, check_in, check_out, status, user:profiles(full_name)')
                    .in('property_id', propIds)
                    .neq('status', 'canceled')
                    .or(`check_in.gte.${past.toISOString()},check_in.lte.${future.toISOString()},check_out.gte.${past.toISOString()},check_out.lte.${future.toISOString()}`);

                // 3. Generate Tasks
                const generatedTasks: any[] = [];
                const now = new Date();

                (bookings || []).forEach((b: any) => {
                    const checkIn = new Date(b.check_in);
                    const checkOut = new Date(b.check_out);
                    const isToday = (d: Date) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
                    const userName = Array.isArray(b.user) ? b.user[0]?.full_name : b.user?.full_name;

                    // Check-out Cleaning Task
                    if (checkOut >= past && checkOut <= future) {
                        const isPastDue = checkOut < now;
                        generatedTasks.push({
                            id: `clean-${b.id}`,
                            room: propMap.get(b.property_id) || 'Unknown Property',
                            type: 'Cleaning',
                            detail: `Guest Checkout: ${userName || 'Guest'}`,
                            // Logic: If passed -> Pending/Overdue, If today -> In Progress, If future -> Scheduled
                            // Simplified: Past checkouts are 'pending' cleaning unless we track otherwise (we don't have state, so assume pending)
                            status: isPastDue ? 'pending' : isToday(checkOut) ? 'in_progress' : 'scheduled',
                            priority: isToday(checkOut) ? 'high' : 'medium',
                            due: checkOut.toLocaleDateString(),
                            assignee: 'Unassigned'
                        });
                    }

                    // Check-in Prep Task
                    if (checkIn >= now && checkIn <= future) {
                        generatedTasks.push({
                            id: `prep-${b.id}`,
                            room: propMap.get(b.property_id) || 'Unknown Property',
                            type: 'Preparation',
                            detail: `Guest Arrival: ${userName || 'Guest'}`,
                            status: 'scheduled',
                            priority: isToday(checkIn) ? 'high' : 'medium',
                            due: checkIn.toLocaleDateString(),
                            assignee: 'Unassigned'
                        });
                    }
                });

                setTasks(generatedTasks);

                // Stats
                setStats({
                    cleaning: generatedTasks.filter(t => t.type === 'Cleaning').length,
                    prep: generatedTasks.filter(t => t.type === 'Preparation').length,
                    completed: 0, // No way to track completion yet
                    total: generatedTasks.length
                });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [user]);

    const filteredTasks = tasks.filter(t => filter === 'all' || t.status === filter);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Operations</h1>
                    <p className="text-gray-500 text-sm mt-1">Daily tasks generated from booking schedules.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Export Schedule</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Task Overview</h3>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {tasks.length} Active
                        </Badge>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Cleaning Required</span>
                                <span className="font-medium text-gray-900">{stats.cleaning}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${stats.total ? (stats.cleaning / stats.total) * 100 : 0}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Check-in Prep</span>
                                <span className="font-medium text-gray-900">{stats.prep}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500" style={{ width: `${stats.total ? (stats.prep / stats.total) * 100 : 0}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Placeholder for future features */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center opacity-60">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <MoreHorizontal className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Staff Management</h3>
                    <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center opacity-60">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <AlertCircle className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Maintenance</h3>
                    <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input placeholder="Search tasks..." className="pl-9 w-64 bg-gray-50 border-transparent focus:bg-white transition-colors" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['all', 'pending', 'scheduled'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Task Details</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Priority</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Due Date</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading tasks...</td>
                            </tr>
                        ) : filteredTasks.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No tasks found.</td>
                            </tr>
                        ) : (
                            filteredTasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{task.room}</div>
                                        <div className="text-xs text-gray-500">{task.type}: {task.detail}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${task.priority === 'high' ? 'bg-red-50 text-red-700' :
                                            'bg-blue-50 text-blue-700'
                                            }`}>
                                            {task.priority.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-3 h-3" />
                                            {task.due}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={`capitalize ${task.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            task.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-gray-50'
                                            }`}>
                                            {task.status.replace('_', ' ')}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>Mark Complete (Mock)</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
