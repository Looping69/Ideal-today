import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Share2, Users, ArrowRight, Megaphone, Sparkles, Wallet, LineChart } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";
import { invokeEngagementAction, invokeReferralAction } from "@/lib/backend";

type HostRef = {
  referee_id: string;
  status: "pending" | "confirmed" | "rewarded";
  created_at: string;
  rewarded_at?: string | null;
};

type VisibilityCredit = {
  id: string;
  credit_type: "regional_feature" | "homepage_boost" | "holiday_spotlight" | "content_launch_pack";
  quantity: number;
  source: string;
  expires_at?: string | null;
  consumed_at?: string | null;
  created_at: string;
};

const CREDIT_LABELS: Record<VisibilityCredit["credit_type"], string> = {
  regional_feature: "Regional Feature",
  homepage_boost: "Homepage Boost",
  holiday_spotlight: "Holiday Spotlight",
  content_launch_pack: "Content Launch Pack",
};

function getStageLabel(status: HostRef["status"]) {
  if (status === "rewarded") return "Activated";
  if (status === "confirmed") return "Signed up";
  return "Clicked / captured";
}

function getStageTone(status: HostRef["status"]) {
  if (status === "rewarded") return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
  if (status === "confirmed") return "bg-blue-100 text-blue-700 hover:bg-blue-100";
  return "bg-slate-100 text-slate-600 hover:bg-slate-100";
}

export default function HostReferrals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hostReferralCode, setHostReferralCode] = useState<string | null>(null);
  const [hostRefs, setHostRefs] = useState<HostRef[]>([]);
  const [balance, setBalance] = useState(0);
  const [visibilityCredits, setVisibilityCredits] = useState<VisibilityCredit[]>([]);

  const fetchReferralData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [profileResult, refsResult, creditsResult] = await Promise.allSettled([
        supabase
          .from("profiles")
          .select("host_referral_code, balance")
          .eq("id", user.id)
          .single(),
        supabase
          .from("host_referrals")
          .select("referee_id, status, created_at, rewarded_at")
          .eq("referrer_id", user.id)
          .order("created_at", { ascending: false }),
        invokeReferralAction<{ credits: VisibilityCredit[] }>({
          action: "get-my-visibility-credits",
        }),
      ]);

      if (profileResult.status === "rejected") throw profileResult.reason;
      if (refsResult.status === "rejected") throw refsResult.reason;

      const { data: profile, error: profileError } = profileResult.value;
      const { data: refs, error: refsError } = refsResult.value;

      if (profileError) throw profileError;
      if (refsError) throw refsError;

      setHostReferralCode(profile?.host_referral_code || null);
      setBalance(profile?.balance || 0);
      setHostRefs((refs || []) as HostRef[]);

      if (creditsResult.status === "fulfilled") {
        setVisibilityCredits(creditsResult.value.credits || []);
      } else {
        setVisibilityCredits([]);
        console.warn("Visibility credits unavailable", getErrorMessage(creditsResult.reason));
      }
    } catch (error: unknown) {
      console.error("Error loading host referrals", getErrorMessage(error));
      toast({
        variant: "destructive",
        title: "Could not load referral data",
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    void fetchReferralData();
  }, [fetchReferralData]);

  const generateHostCode = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invokeEngagementAction<{ code: string }>({
        action: "generate-host-referral-code",
      });

      setHostReferralCode(result.code);
      toast({
        title: "Referral link ready",
        description: "You can now invite other hosts with a trackable link.",
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
  }, [toast]);

  const referralLink = hostReferralCode ? `${window.location.origin}?host_ref=${hostReferralCode}` : "";

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Your host referral link is in the clipboard.",
    });
  }, [toast]);

  const shareWhatsApp = useCallback((code: string) => {
    const url = `${window.location.origin}?host_ref=${code}`;
    const text =
      `Join Ideal Stay as a host. You will get a cleaner launch path, content support, and a better listing setup from day one: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, []);

  const activatedCount = useMemo(
    () => hostRefs.filter((ref) => ref.status === "rewarded").length,
    [hostRefs],
  );
  const signedUpCount = useMemo(
    () => hostRefs.filter((ref) => ref.status === "confirmed" || ref.status === "rewarded").length,
    [hostRefs],
  );
  const availableCredits = useMemo(
    () => visibilityCredits.filter((credit) => !credit.consumed_at).reduce((sum, credit) => sum + credit.quantity, 0),
    [visibilityCredits],
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Host Growth</h1>
          <p className="text-gray-500 mt-1">
            Invite good hosts, track qualified activation, and earn rewards that actually help your visibility.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-cyan-50 px-4 py-2 rounded-xl border border-cyan-100">
            <Megaphone className="w-5 h-5 text-cyan-700" />
            <span className="font-bold text-cyan-900">{availableCredits} Visibility Credits</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
            <Wallet className="w-5 h-5 text-green-600" />
            <span className="font-bold text-green-900">R{balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card className="border-cyan-100 bg-white shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles className="w-32 h-32 text-cyan-600" />
          </div>
          <CardHeader>
            <CardTitle className="text-xl">How this works now</CardTitle>
            <CardDescription>
              We are no longer treating host referral like a vague points game.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-sm">1</div>
                <p className="text-sm font-semibold">Share your link</p>
                <p className="text-xs text-gray-500">Invite hosts who are actually likely to list and activate.</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-sm">2</div>
                <p className="text-sm font-semibold">They sign up & launch</p>
                <p className="text-xs text-gray-500">We track them through signup, listing, and real activation.</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-sm">3</div>
                <p className="text-sm font-semibold">Earn useful rewards</p>
                <p className="text-xs text-gray-500">Visibility credits, content perks, and selective cash rewards beat empty points.</p>
              </div>
            </div>

            {hostReferralCode ? (
              <div className="bg-cyan-50/50 p-6 rounded-2xl border border-cyan-100 space-y-4">
                <Label className="text-cyan-900 text-sm font-bold">Your Host Referral Link</Label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Input
                      readOnly
                      value={referralLink}
                      className="h-12 pr-10 bg-white border-cyan-200 focus:ring-cyan-500 rounded-xl"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      className="flex-1 sm:flex-initial gap-2 bg-cyan-700 hover:bg-cyan-800 h-12 rounded-xl shadow-md"
                      onClick={() => copyToClipboard(referralLink)}
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
                <div className="rounded-xl border border-cyan-100 bg-white/80 p-4 text-sm leading-6 text-slate-600">
                  Use this when you are sending hosts who are not already coming through Ideal Stay’s owned media. The point is incremental supply, not double-claiming traffic we already own.
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-2xl border border-dashed border-gray-300 text-center space-y-4">
                <p className="text-gray-600">You have not generated your host referral link yet.</p>
                <Button onClick={generateHostCode} className="bg-cyan-700 hover:bg-cyan-800 h-12 px-8 rounded-xl">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Activate My Referral Link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Your Snapshot</CardTitle>
            <CardDescription>Qualified host growth matters more than raw clicks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                <div className="text-3xl font-bold text-slate-950">{hostRefs.length}</div>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">Tracked Hosts</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <div className="text-3xl font-bold text-emerald-700">{activatedCount}</div>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-700">Activated</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Signed up</span>
                <span className="font-bold">{signedUpCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Visibility credits ready</span>
                <span className="font-bold text-cyan-700">{availableCredits}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Legacy cash balance</span>
                <span className="font-bold text-green-700">R{balance.toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              The best rewards here should eventually be feature slots, launch packs, and visibility inventory. Cash should be selective, not the whole story.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-gray-400" />
              <CardTitle className="text-xl">Qualification Stages</CardTitle>
            </div>
            <CardDescription>We care about activation, not vanity metrics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-900">Clicked / captured</div>
              <p className="mt-1">The host came through your link and entered the pipeline.</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="font-semibold text-blue-900">Signed up</div>
              <p className="mt-1">The host created an account and attribution held.</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="font-semibold text-emerald-900">Activated</div>
              <p className="mt-1">The host published, upgraded, or otherwise qualified as real supply.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <CardTitle className="text-xl">Referral History</CardTitle>
            </div>
            <CardDescription>
              This table now reflects stage progression instead of pretending everyone is worth the same.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hostRefs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500">No tracked hosts yet. When good referrals move through the funnel, they will show up here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs uppercase text-gray-400 font-semibold border-b border-gray-100">
                      <th className="px-4 py-3">Host ID</th>
                      <th className="px-4 py-3">Captured</th>
                      <th className="px-4 py-3">Stage</th>
                      <th className="px-4 py-3 text-right">Reward Direction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {hostRefs.map((ref) => (
                      <tr key={ref.referee_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 font-mono text-xs text-gray-600">{ref.referee_id.slice(0, 12)}...</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{new Date(ref.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-4">
                          <Badge className={getStageTone(ref.status)}>
                            {getStageLabel(ref.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right text-sm">
                          <span className={ref.status === "rewarded" ? "font-bold text-cyan-700" : "text-slate-400"}>
                            {ref.status === "rewarded" ? "Eligible for visibility reward" : "Waiting for qualification"}
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

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Visibility Credits</CardTitle>
          <CardDescription>
            This is the reward currency that actually matches the business we are building.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visibilityCredits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
              No visibility credits have been issued yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibilityCredits.map((credit) => (
                <div key={credit.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-slate-900">{CREDIT_LABELS[credit.credit_type]}</div>
                    <Badge className={credit.consumed_at ? "bg-slate-100 text-slate-600 hover:bg-slate-100" : "bg-cyan-50 text-cyan-700 hover:bg-cyan-50"}>
                      {credit.consumed_at ? "Used" : `${credit.quantity} available`}
                    </Badge>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-600">
                    Source: <span className="font-medium text-slate-900">{credit.source}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Issued {new Date(credit.created_at).toLocaleDateString()}
                    {credit.expires_at ? ` · Expires ${new Date(credit.expires_at).toLocaleDateString()}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
