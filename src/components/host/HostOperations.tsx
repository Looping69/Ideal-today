import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Search, Filter, MoreHorizontal, Calendar, Plus, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface Task {
    id: string;
    room: string;
    type: 'Cleaning' | 'Preparation' | 'Maintenance' | 'Inspection';
    detail: string;
    status: 'pending' | 'in_progress' | 'scheduled' | 'completed';
    priority: 'high' | 'medium' | 'low';
    due: string;
    assignee: string;
    isManual?: boolean;
}

export default function HostOperations() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Local Storage Data
    const [staff, setStaff] = useState<string[]>([]);
    const [manualTasks, setManualTasks] = useState<Task[]>([]);
    const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

    // Dialog States
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
    const [newTask, setNewTask] = useState({ room: '', type: 'Maintenance', detail: '', assignee: '', priority: 'medium' });
    const [newStaffName, setNewStaffName] = useState('');
    const [properties, setProperties] = useState<{ id: string, title: string }[]>([]);

    // Load initial data from localStorage when user is available
    useEffect(() => {
        if (!user?.id) return;

        const savedStaff = localStorage.getItem(`host_staff_${user.id}`);
        const savedManualTasks = localStorage.getItem(`host_manual_tasks_${user.id}`);
        const savedCompletedIds = localStorage.getItem(`host_completed_tasks_${user.id}`);

        if (savedStaff) setStaff(JSON.parse(savedStaff));
        if (savedManualTasks) setManualTasks(JSON.parse(savedManualTasks));
        if (savedCompletedIds) setCompletedTaskIds(JSON.parse(savedCompletedIds));
    }, [user?.id]);

    // Fetch data when user or dependent local data changes
    useEffect(() => {
        if (!user?.id) return;
        fetchData();
    }, [user?.id, manualTasks, completedTaskIds]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Get properties
            const { data: props } = await supabase.from('properties').select('id, title').eq('host_id', user!.id);
            const propsData = props || [];
            setProperties(propsData);

            const propIds = propsData.map(p => p.id);
            const propMap = new Map(propsData.map(p => [p.id, p.title]));

            if (propIds.length === 0) {
                setLoading(false);
                // If no properties, still show manual tasks
                setTasks(manualTasks);
                return;
            }

            // 2. Fetch recent/upcoming bookings (last 2 days, next 7 days)
            const today = new Date();
            const past = new Date(today); past.setDate(today.getDate() - 2);
            const future = new Date(today); future.setDate(today.getDate() + 7); // Extended window

            const { data: bookings } = await supabase
                .from('bookings')
                .select('id, property_id, check_in, check_out, status, user:profiles(full_name)')
                .in('property_id', propIds)
                .neq('status', 'canceled')
                .or(`check_in.gte.${past.toISOString()},check_in.lte.${future.toISOString()},check_out.gte.${past.toISOString()},check_out.lte.${future.toISOString()}`);

            // 3. Generate Auto Tasks
            const generatedTasks: Task[] = [];
            const now = new Date();

            (bookings || []).forEach((b: any) => {
                const checkIn = new Date(b.check_in);
                const checkOut = new Date(b.check_out);
                const isToday = (d: Date) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                const userName = Array.isArray(b.user) ? b.user[0]?.full_name : b.user?.full_name;

                // Check-out Cleaning Task
                if (checkOut >= past && checkOut <= future) {
                    const taskId = `clean-${b.id}`;
                    if (!completedTaskIds.includes(taskId)) {
                        const isPastDue = checkOut < now && !isToday(checkOut); // Past due if before now and not today
                        generatedTasks.push({
                            id: taskId,
                            room: propMap.get(b.property_id) || 'Unknown Property',
                            type: 'Cleaning',
                            detail: `Checkout: ${userName || 'Guest'}`,
                            status: isPastDue ? 'pending' : isToday(checkOut) ? 'in_progress' : 'scheduled',
                            priority: isToday(checkOut) ? 'high' : 'medium',
                            due: checkOut.toLocaleDateString(),
                            assignee: 'Unassigned',
                            isManual: false
                        });
                    }
                }

                // Check-in Prep Task
                if (checkIn >= now && checkIn <= future) {
                    const taskId = `prep-${b.id}`;
                    if (!completedTaskIds.includes(taskId)) {
                        generatedTasks.push({
                            id: taskId,
                            room: propMap.get(b.property_id) || 'Unknown Property',
                            type: 'Preparation',
                            detail: `Arrival: ${userName || 'Guest'}`,
                            status: 'scheduled',
                            priority: isToday(checkIn) ? 'high' : 'medium',
                            due: checkIn.toLocaleDateString(),
                            assignee: 'Unassigned',
                            isManual: false
                        });
                    }
                }
            });

            // Merge with manual tasks (filter out deleted ones if we implemented delete)
            setTasks([...generatedTasks, ...manualTasks]);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const handleAddTask = () => {
        if (!newTask.room || !newTask.detail) {
            toast({ title: "Error", description: "Property and Detail are required.", variant: "destructive" });
            return;
        }

        const task: Task = {
            id: `manual-${Date.now()}`,
            room: newTask.room, // Just title string
            type: newTask.type as any,
            detail: newTask.detail,
            status: 'pending',
            priority: newTask.priority as any,
            due: new Date().toLocaleDateString(),
            assignee: newTask.assignee || 'Unassigned',
            isManual: true
        };

        const updatedManual = [...manualTasks, task];
        setManualTasks(updatedManual);
        setTasks(prev => [...prev, task]);
        localStorage.setItem(`host_manual_tasks_${user!.id}`, JSON.stringify(updatedManual));

        setIsTaskDialogOpen(false);
        setNewTask({ room: '', type: 'Maintenance', detail: '', assignee: '', priority: 'medium' });
        toast({ title: "Task Created", description: "New task added to the board." });
    };

    const handleAddStaff = () => {
        if (!newStaffName.trim()) {
            toast({ title: "Error", description: "Staff name cannot be empty.", variant: "destructive" });
            return;
        }
        const updatedStaff = [...staff, newStaffName.trim()];
        setStaff(updatedStaff);
        localStorage.setItem(`host_staff_${user!.id}`, JSON.stringify(updatedStaff));
        setNewStaffName('');
        setIsStaffDialogOpen(false);
        toast({ title: "Staff Added", description: `${newStaffName} is now available for assignment.` });
    };

    const handleCompleteTask = (taskId: string, isManual: boolean) => {
        if (isManual) {
            // Remove from manual tasks
            const updatedManual = manualTasks.filter(t => t.id !== taskId);
            setManualTasks(updatedManual);
            localStorage.setItem(`host_manual_tasks_${user!.id}`, JSON.stringify(updatedManual));
        } else {
            // Add to completed ID list
            const updatedCompleted = [...completedTaskIds, taskId];
            setCompletedTaskIds(updatedCompleted);
            localStorage.setItem(`host_completed_tasks_${user!.id}`, JSON.stringify(updatedCompleted));
        }

        // Update local state
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast({ title: "Task Completed", description: "Task moved to history." });
    };

    const handleDeleteTask = (taskId: string) => {
        // Only for manual tasks
        const updatedManual = manualTasks.filter(t => t.id !== taskId);
        setManualTasks(updatedManual);
        localStorage.setItem(`host_manual_tasks_${user!.id}`, JSON.stringify(updatedManual));
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast({ title: "Task Deleted" });
    };

    // --- Stats ---
    const stats = {
        cleaning: tasks.filter(t => t.type === 'Cleaning').length,
        prep: tasks.filter(t => t.type === 'Preparation').length,
        maintenance: tasks.filter(t => t.type === 'Maintenance').length,
        total: tasks.length
    };

    const filteredTasks = tasks.filter(t => {
        const matchesFilter = filter === 'all' || t.status === filter;
        const matchesSearch = t.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.assignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.type.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Operations</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage daily tasks, cleaning, and maintenance.</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><UserPlus className="w-4 h-4 mr-2" />Add Staff</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Team Member</DialogTitle>
                                <DialogDescription>Add name of staff member to assign tasks to.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Label htmlFor="staff-name">Name</Label>
                                <Input id="staff-name" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="e.g. John Doe" />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddStaff}>Add Member</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gray-900 text-white hover:bg-gray-800"><Plus className="w-4 h-4 mr-2" />New Task</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Task</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="task-property">Property</Label>
                                    <Select onValueChange={(v) => setNewTask({ ...newTask, room: v })} value={newTask.room}>
                                        <SelectTrigger id="task-property">
                                            <SelectValue placeholder="Select Property" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {properties.map(p => (
                                                <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="task-type">Task Type</Label>
                                    <Select onValueChange={(v: any) => setNewTask({ ...newTask, type: v })} defaultValue="Maintenance" value={newTask.type}>
                                        <SelectTrigger id="task-type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                                            <SelectItem value="Cleaning">Cleaning</SelectItem>
                                            <SelectItem value="Inspection">Inspection</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="task-detail">Detail</Label>
                                    <Input id="task-detail" value={newTask.detail} onChange={e => setNewTask({ ...newTask, detail: e.target.value })} placeholder="e.g. Fix leaking tap" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="task-assignee">Assignee</Label>
                                    <Select onValueChange={(v) => setNewTask({ ...newTask, assignee: v })} value={newTask.assignee}>
                                        <SelectTrigger id="task-assignee">
                                            <SelectValue placeholder="Unassigned" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Unassigned">Unassigned</SelectItem>
                                            {staff.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="task-priority">Priority</Label>
                                    <Select onValueChange={(v: any) => setNewTask({ ...newTask, priority: v })} defaultValue="medium" value={newTask.priority}>
                                        <SelectTrigger id="task-priority">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddTask}>Create Task</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
                                <span className="text-gray-600">Cleaning</span>
                                <span className="font-medium text-gray-900">{stats.cleaning}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${stats.total ? (stats.cleaning / stats.total) * 100 : 0}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Maintenance</span>
                                <span className="font-medium text-gray-900">{stats.maintenance}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500" style={{ width: `${stats.total ? (stats.maintenance / stats.total) * 100 : 0}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Staff Availability</h3>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{staff.length} Active</Badge>
                    </div>
                    <div className="space-y-3 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                        {staff.length === 0 ? (
                            <p className="text-xs text-gray-500 italic">No staff added yet.</p>
                        ) : (
                            staff.map((s, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {s.charAt(0)}
                                        </div>
                                        <span className="font-medium text-gray-700">{s}</span>
                                    </div>
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Available</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-3">
                        <AlertCircle className="w-6 h-6 text-orange-500" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Action Required</h3>
                    <p className="text-2xl font-bold text-gray-900 my-1">
                        {tasks.filter(t => t.priority === 'high').length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">High priority tasks</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-64 bg-gray-50 border-transparent focus:bg-white transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['all', 'pending', 'in_progress', 'scheduled'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Task Details</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Priority</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Assignee</th>
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
                                            task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                                                'bg-blue-50 text-blue-700'
                                            }`}>
                                            {task.priority.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={task.assignee === 'Unassigned' ? 'text-gray-400 italic' : 'text-gray-700'}>
                                            {task.assignee}
                                        </span>
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
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50" onClick={() => handleCompleteTask(task.id, !!task.isManual)} title="Mark Complete">
                                                <CheckCircle className="w-4 h-4" />
                                            </Button>
                                            {task.isManual && (
                                                <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteTask(task.id)} title="Delete Task">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
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
