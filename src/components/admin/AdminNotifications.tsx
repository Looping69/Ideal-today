import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications } from "@/contexts/NotificationContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Send, Users } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";
import { invokeAdminUserAction } from "@/lib/backend";

export default function AdminNotifications() {
    const { sendNotification } = useNotifications();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<{ id: string; email: string; full_name: string | null }[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>("all");
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        type: "info" as "info" | "success" | "warning" | "error" | "system",
        link: ""
    });

    useEffect(() => {
        const fetchUsers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, email, full_name')
                .limit(50);
            setUsers((data || []) as { id: string; email: string; full_name: string | null }[]);
        };
        fetchUsers();
    }, []);

    const handleSend = async () => {
        if (!formData.title || !formData.message) {
            toast({
                variant: "destructive",
                title: "Missing fields",
                description: "Please provide a title and message.",
            });
            return;
        }

        try {
            setLoading(true);

            if (selectedUser === "all") {
                await invokeAdminUserAction({
                    action: 'broadcast',
                    title: formData.title,
                    message: formData.message,
                    type: formData.type,
                    link: formData.link,
                });
            } else {
                await sendNotification(selectedUser, {
                    title: formData.title,
                    message: formData.message,
                    type: formData.type,
                    link: formData.link
                });
            }

            toast({
                title: "Notification sent",
                description: `Successfully sent to ${selectedUser === 'all' ? 'all users' : 'selected user'}.`,
            });

            setFormData({
                title: "",
                message: "",
                type: "info",
                link: ""
            });
        } catch (error: unknown) {
            toast({
                variant: "destructive",
                title: "Error sending notification",
                description: getErrorMessage(error),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
                <p className="text-gray-500 mt-2">Send notifications to users or broadcast system-wide alerts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Compose Notification</CardTitle>
                        <CardDescription>Create a new notification message.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Recipient</label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select recipient" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2 font-medium">
                                            <Users className="w-4 h-4" />
                                            All Users (Broadcast)
                                        </div>
                                    </SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.full_name || u.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notification Type</label>
                            <div className="flex gap-2">
                                {['info', 'success', 'warning', 'error', 'system'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFormData({ ...formData, type: type as typeof formData.type })}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${formData.type === type
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                placeholder="e.g. System Maintenance"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message</label>
                            <Textarea
                                placeholder="Enter your message here..."
                                className="h-32"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Link (Optional)</label>
                            <Input
                                placeholder="e.g. /host/listings"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            />
                        </div>

                        <div className="pt-4">
                            <Button onClick={handleSend} disabled={loading} className="w-full">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                Send Notification
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-blue-50 border-blue-100">
                        <CardHeader>
                            <CardTitle className="text-blue-900 text-lg">Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-blue-800 space-y-2">
                            <p>• <strong>Broadcasts</strong> are sent to all registered users. Use sparingly.</p>
                            <p>• <strong>System</strong> type is best for maintenance alerts or platform updates.</p>
                            <p>• <strong>Links</strong> can be internal (e.g. <code>/trips</code>) or external.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
