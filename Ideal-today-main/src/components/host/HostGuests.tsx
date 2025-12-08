import { useState } from 'react';
import { Search, Mail, Phone, MapPin, Star, MoreHorizontal, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HostGuests() {
    const [search, setSearch] = useState('');

    const guests = [
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com', phone: '+1 555-0123', stays: 4, spent: 3200, rating: 5.0, lastStay: '2023-11-15', status: 'VIP' },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com', phone: '+1 555-0124', stays: 1, spent: 450, rating: 4.0, lastStay: '2023-12-01', status: 'New' },
        { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', phone: '+1 555-0125', stays: 2, spent: 1200, rating: 4.5, lastStay: '2023-10-20', status: 'Returning' },
        { id: 4, name: 'Diana Prince', email: 'diana@example.com', phone: '+1 555-0126', stays: 8, spent: 8500, rating: 5.0, lastStay: '2023-12-03', status: 'VIP' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Guest Management</h1>
                    <p className="text-gray-500 text-sm mt-1">View guest history, preferences, and contact info.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button className="bg-gray-900 text-white hover:bg-gray-800">Add Guest</Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search guests by name, email, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-gray-50 border-transparent focus:bg-white transition-colors"
                        />
                    </div>
                </div>

                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Guest Profile</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Contact Info</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">History</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {guests.map((guest) => (
                            <tr key={guest.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                                            {guest.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{guest.name}</div>
                                            <div className="text-xs text-gray-500">Last stay: {guest.lastStay}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                                            <Mail className="w-3 h-3" />
                                            {guest.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                                            <Phone className="w-3 h-3" />
                                            {guest.phone}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 font-medium">{guest.stays} stays</div>
                                    <div className="text-xs text-gray-500">Total spent: R{guest.spent.toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${guest.status === 'VIP' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                            guest.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                'bg-gray-50 text-gray-700 border-gray-100'
                                        }`}>
                                        {guest.status === 'VIP' && <Star className="w-3 h-3 mr-1 fill-purple-700" />}
                                        {guest.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                                            <DropdownMenuItem>Message Guest</DropdownMenuItem>
                                            <DropdownMenuItem>Add Note</DropdownMenuItem>
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
