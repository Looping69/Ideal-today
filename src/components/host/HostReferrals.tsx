
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Share2, Users, Trophy, ExternalLink, Gift, ArrowRight, Wallet, Crown } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";

type ReferralTier = 'founder' | 'pro' | 'standard';
type HostRef = { referee_id: string; status: 'pending' | 'confirmed' | 'rewarded'; created_at: string; rewarded_at?: string | null };

export default function HostReferrals() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [hostReferralCode, setHostReferralCode] = useState<string | null>(null);
    const [hostRefs, setHostRefs] = useState<HostRef[]>([]);
    const [referralTier, setReferralTier] = useState<ReferralTier>('standard');
    const [balance, setBalance] = useState(0);

    const fetchReferralData = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("profiles")
                .select("host_referral_code, referral_tier, balance")
                .eq("id", user?.id)
                .single();

            if (error) throw error;
            setHostReferralCode(data.host_referral_code || null);
            setReferralTier((data.referral_tier as ReferralTier) || 'standard');
            setBalance(data.balance || 0);

            const { data: refs } = await supabase
                .from('host_referrals')
                .select('referee_id, status, created_at, rewarded_at')
                .eq('referrer_id', user?.id)
                .order('created_at', { ascending: false });
            setHostRefs((refs || []) as HostRef[]);
        } catch (error: unknown) {
            console.error("Error loading referral data!", getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchReferralData();
        }
    }, [user, fetchReferralData]);

    const generateHostCode = useCallback(async () => {
        try {
            setLoading(true);
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            const { error } = await supabase
                .from('profiles')
                .update({ host_referral_code: code })
                .eq('id', user?.id)
                .select();

            if (error) throw error;
            setHostReferralCode(code);
            toast({
                title: "Referral code generated!",
                description: "You can now start inviting other hosts.",
            });
        } catch (error: unknown) {
            toast({
                variant: "destructive",
                title: "Error",
                description: getErrorMessage(error),
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied!",
            description: "Referral link copied to clipboard.",
        });
    };

    const shareWhatsApp = (code: string) => {
        const url = `${window.location.origin}?host_ref=${code}`;
        const text = `Hey! Join me as a host on IdealStay and earn more from your property. List your stay here: ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Refer & Earn</h1>
                        {referralTier === 'founder' && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1 px-3 py-1">
                                <Crown className="w-3 h-3 fill-amber-800" /> Founding Member
                            </Badge>
                        )}
                        {referralTier === 'pro' && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1 px-3 py-1">
                                <Trophy className="w-3 h-3 fill-blue-800" /> Pro Partner
                            </Badge>
                        )}
                    </div>
                    <p className="text-gray-500 mt-1">Invite fellow hosts and grow the IdealStay community.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                        <Trophy className="w-5 h-5 text-indigo-600" />
                        <span className="font-bold text-indigo-900">{hostRefs.filter(r => r.status === 'rewarded').length * 1000} Points</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                        <Wallet className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-green-900">R{balance.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-indigo-100 bg-white shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Gift className="w-32 h-32 text-indigo-600" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-xl">How it works</CardTitle>
                        <CardDescription>
                            {referralTier === 'founder'
                                ? "Exclusive Founding Member Rewards Active"
                                : referralTier === 'pro'
                                    ? "Pro Partner Benefits Active"
                                    : "Simple steps to earn rewards"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">1</div>
                                <p className="text-sm font-semibold">Share your link</p>
                                <p className="text-xs text-gray-500">Send your unique host referral link to friends.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">2</div>
                                <p className="text-sm font-semibold">They join & list</p>
                                <p className="text-xs text-gray-500">Wait for them to sign up and start hosting.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">3</div>
                                <p className="text-sm font-semibold">Earn Revenue Share</p>
                                <p className="text-xs text-gray-500">
                                    {referralTier === 'founder'
                                        ? "Earn 40% of platform fees for Year 1, then 20% forever."
                                        : referralTier === 'pro'
                                            ? "Earn 20% of platform fees for Year 1, then 10% forever."
                                            : "Earn 10% of platform fees for Year 1, then 5% forever."}
                                </p>
                            </div>
                        </div>

                        {hostReferralCode ? (
                            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                                <Label className="text-indigo-900 text-sm font-bold">Your Referral Link</Label>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <div className="relative flex-1 w-full">
                                        <Input
                                            readOnly
                                            value={`${window.location.origin}?host_ref=${hostReferralCode}`}
                                            className="h-12 pr-10 bg-white border-indigo-200 focus:ring-indigo-500 rounded-xl"
                                        />
                                        <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <Button
                                            className="flex-1 sm:flex-initial gap-2 bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl shadow-md"
                                            onClick={() => copyToClipboard(`${window.location.origin}?host_ref=${hostReferralCode}`)}
                                        >
                                            <Copy className="w-4 h-4" />
                                            Copy Link
                                        </Button>
                                        <Button
                                            className="flex-1 sm:flex-initial gap-2 bg-[#25D366] hover:bg-[#20bd5c] text-white border-none h-12 rounded-xl shadow-md"
                                            onClick={() => shareWhatsApp(hostReferralCode)}
                                        >
                                            <Share2 className="w-4 h-4" />
                                            WhatsApp
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-8 rounded-2xl border border-dashed border-gray-300 text-center space-y-4">
                                <p className="text-gray-600">You haven't generated your referral code yet.</p>
                                <Button onClick={generateHostCode} className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Activate My Referral Link
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-xl">Your Stats</CardTitle>
                        <CardDescription>Track your referral progress</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center space-y-8">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-gray-900">{hostRefs.length}</div>
                            <p className="text-sm text-gray-500">Total Invites</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Joined</span>
                                <span className="font-bold">{hostRefs.filter(r => r.status === 'pending' || r.status === 'confirmed').length}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${hostRefs.length > 0 ? (hostRefs.filter(r => r.status === 'rewarded').length / hostRefs.length) * 100 : 0}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Active Hosts</span>
                                <span className="font-bold text-green-600">{hostRefs.filter(r => r.status === 'rewarded').length}</span>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full mt-auto" onClick={() => window.location.href = '/rewards'}>
                            View My Rewards <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" />
                        <CardTitle className="text-xl">Referral History</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {hostRefs.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-500">No activity yet. Your invited hosts will appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-xs uppercase text-gray-400 font-semibold border-b border-gray-100">
                                        <th className="px-4 py-3">Host ID</th>
                                        <th className="px-4 py-3">Date Joined</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Commission Tier</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {hostRefs.map((r) => (
                                        <tr key={r.referee_id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-4 font-mono text-xs text-gray-600">{r.referee_id.slice(0, 12)}...</td>
                                            <td className="px-4 py-4 text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                                            <td className="px-4 py-4">
                                                <Badge variant={r.status === 'rewarded' ? 'default' : 'secondary'} className={r.status === 'rewarded' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-100'}>
                                                    {r.status === 'rewarded' ? 'Active Host' : 'Joined'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className={r.status === 'rewarded' ? 'text-indigo-600 font-bold' : 'text-gray-300 font-medium'}>
                                                    {r.status === 'rewarded'
                                                        ? (referralTier === 'founder' ? "40% / 20%" : referralTier === 'pro' ? "20% / 10%" : "10% / 5%")
                                                        : '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
