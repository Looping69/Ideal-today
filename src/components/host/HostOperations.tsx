import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Search, Filter, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HostOperations() {
    const [filter, setFilter] = useState('all');

    const tasks = [
        { id: 1, room: 'Seaside Villa', type: 'Cleaning', status: 'pending', priority: 'high', assignee: 'Sarah M.', due: '14:00' },
        { id: 2, room: 'Mountain Cabin', type: 'Maintenance', status: 'in_progress', priority: 'medium', assignee: 'John D.', due: '16:00' },
        { id: 3, room: 'Urban Loft', type: 'Inspection', status: 'completed', priority: 'low', assignee: 'Sarah M.', due: '11:00' },
        { id: 4, room: 'Beach House', type: 'Cleaning', status: 'pending', priority: 'high', assignee: 'Unassigned', due: '13:00' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Operations & Housekeeping</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage daily tasks, cleaning schedules, and maintenance.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Export Schedule</Button>
                    <Button className="bg-gray-900 text-white hover:bg-gray-800">Assign Tasks</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Housekeeping Status</h3>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">On Track</Badge>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Clean</span>
                                <span className="font-medium text-gray-900">12 / 20</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[60%]" />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Dirty</span>
                                <span className="font-medium text-gray-900">5 / 20</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 w-[25%]" />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Inspecting</span>
                                <span className="font-medium text-gray-900">3 / 20</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 w-[15%]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Staff Availability</h3>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">3 Active</Badge>
                    </div>
                    <div className="space-y-3">
                        {['Sarah M.', 'John D.', 'Emily R.'].map((staff, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                        {staff.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span className="font-medium text-gray-700">{staff}</span>
                                </div>
                                <span className="text-xs text-gray-500">{i === 0 ? 'Cleaning Room 101' : i === 1 ? 'Maintenance' : 'Available'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-3">
                        <AlertCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Maintenance Requests</h3>
                    <p className="text-2xl font-bold text-gray-900 my-1">2</p>
                    <p className="text-xs text-gray-500">Requires attention</p>
                    <Button variant="link" className="text-purple-600 h-auto p-0 mt-2">View Details</Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input placeholder="Search tasks..." className="pl-9 w-64 bg-gray-50 border-transparent focus:bg-white transition-colors" />
                        </div>
                        <Button variant="outline" size="icon" className="border-gray-200">
                            <Filter className="w-4 h-4 text-gray-500" />
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        {['all', 'pending', 'in_progress', 'completed'].map(s => (
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
                        {tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{task.room}</div>
                                    <div className="text-xs text-gray-500">{task.type} • Due {task.due}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${task.priority === 'high' ? 'bg-red-50 text-red-700' :
                                            task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                                                'bg-blue-50 text-blue-700'
                                        }`}>
                                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {task.assignee !== 'Unassigned' && (
                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                                {task.assignee.split(' ').map(n => n[0]).join('')}
                                            </div>
                                        )}
                                        <span className={task.assignee === 'Unassigned' ? 'text-gray-400 italic' : 'text-gray-700'}>
                                            {task.assignee}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${task.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                            task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                'bg-gray-50 text-gray-700 border-gray-100'
                                        }`}>
                                        {task.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                                        {task.status === 'in_progress' && <Clock className="w-3 h-3" />}
                                        <span className="capitalize">{task.status.replace('_', ' ')}</span>
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Mark Complete</DropdownMenuItem>
                                            <DropdownMenuItem>Reassign</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">Delete Task</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
