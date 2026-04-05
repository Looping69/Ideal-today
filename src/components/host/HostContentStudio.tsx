import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles, Loader2, Megaphone, ClipboardCheck, ArrowRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Property } from "@/types/property";
import { getErrorMessage } from "@/lib/errors";
import { auditListing, generateSocialPost, SocialPlatform, SocialPostResponse, ListingAuditResponse } from "@/lib/ai";

type PlanTier = "free" | "standard" | "professional" | "premium";

const PAID_PLANS = new Set<PlanTier>(["standard", "professional", "premium"]);
const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
};

export default function HostContentStudio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hostPlan, setHostPlan] = useState<PlanTier>("free");
  const [listings, setListings] = useState<Property[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string>("");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [socialPost, setSocialPost] = useState<SocialPostResponse | null>(null);
  const [audit, setAudit] = useState<ListingAuditResponse | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const [{ data: profile, error: profileError }, { data: properties, error: propertiesError }] = await Promise.all([
        supabase
          .from("profiles")
          .select("host_plan")
          .eq("id", user.id)
          .single(),
        supabase
          .from("properties")
          .select("*")
          .eq("host_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (profileError) throw profileError;
      if (propertiesError) throw propertiesError;

      const nextListings = (properties as unknown as Property[]) || [];
      setHostPlan((profile?.host_plan as PlanTier) || "free");
      setListings(nextListings);
      setSelectedListingId((current) => current || nextListings[0]?.id || "");
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Failed to load content studio",
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) || null,
    [listings, selectedListingId],
  );

  const hasAccess = PAID_PLANS.has(hostPlan);

  useEffect(() => {
    if (!loading && !hasAccess) {
      toast({
        title: "Upgrade required",
        description: "Content Studio is included with paid host plans.",
      });
      navigate("/pricing?audience=host");
    }
  }, [hasAccess, loading, navigate, toast]);

  const handleGenerateSocial = useCallback(async () => {
    if (!selectedListing) return;
    if (!hasAccess) {
      navigate("/pricing?audience=host");
      return;
    }

    try {
      setSocialLoading(true);
      const result = await generateSocialPost({
        propertyTitle: selectedListing.title,
        description: selectedListing.description,
        location: selectedListing.location,
        price: selectedListing.price,
        amenities: selectedListing.amenities || [],
        platform,
      });
      setSocialPost(result);
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Social content failed",
        description: getErrorMessage(error),
      });
    } finally {
      setSocialLoading(false);
    }
  }, [hasAccess, navigate, platform, selectedListing, toast]);

  const handleAuditListing = useCallback(async () => {
    if (!selectedListing) return;
    if (!hasAccess) {
      navigate("/pricing?audience=host");
      return;
    }

    try {
      setAuditLoading(true);
      const result = await auditListing({
        title: selectedListing.title,
        description: selectedListing.description,
        price: selectedListing.price,
        amenities: selectedListing.amenities || [],
        imagesCount: [selectedListing.image, ...(selectedListing.images || [])].filter(Boolean).length,
      });
      setAudit(result);
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Listing audit failed",
        description: getErrorMessage(error),
      });
    } finally {
      setAuditLoading(false);
    }
  }, [hasAccess, navigate, selectedListing, toast]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_30%),linear-gradient(135deg,#fffdf7_0%,#f8fbff_48%,#eef8f7_100%)] p-8 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-5">
            <Badge className="w-fit border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-50">
              Host Content Studio
            </Badge>
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-slate-950">Turn your listings into content you can actually post.</h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Pick one of your listings, generate styled social content for real networks, and audit how well the listing is positioned to convert.
              </p>
            </div>
          </div>

          <Card className="border-slate-200 bg-white/85 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-950">
                <Sparkles className="h-5 w-5 text-cyan-700" />
                Access Status
              </CardTitle>
              <CardDescription>
                This is a paid host-plan feature.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-600">Current plan</span>
                <Badge className={hasAccess ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-amber-50 text-amber-700 hover:bg-amber-50"}>
                  {hostPlan}
                </Badge>
              </div>
              {!hasAccess && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Free hosts can see the studio, but generation is locked until you move onto a paid plan.
                </div>
              )}
              <Button onClick={() => navigate("/pricing?audience=host")} variant={hasAccess ? "outline" : "default"} className="w-full rounded-xl">
                {hasAccess ? "Manage plan" : "Unlock content engine"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">Choose a Listing</CardTitle>
            <CardDescription>
              The engine works from your existing property details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Listing</label>
              <Select value={selectedListingId} onValueChange={setSelectedListingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a listing" />
                </SelectTrigger>
                <SelectContent>
                  {listings.map((listing) => (
                    <SelectItem key={listing.id} value={listing.id}>
                      {listing.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedListing ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={selectedListing.image}
                    alt={selectedListing.title}
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                  <div className="min-w-0 space-y-2">
                    <div>
                      <h3 className="truncate text-lg font-bold text-slate-950">{selectedListing.title}</h3>
                      <p className="text-sm text-slate-500">{selectedListing.location}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">R{selectedListing.price}/night</Badge>
                      <Badge variant="outline">{selectedListing.type}</Badge>
                      <Badge variant="outline">{(selectedListing.amenities || []).length} amenities</Badge>
                    </div>
                    <p className="line-clamp-4 text-sm leading-6 text-slate-600">{selectedListing.description}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                Create a listing first. No listing means no content source.
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="social" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100">
            <TabsTrigger value="social" className="rounded-lg">Social Content</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-lg">Listing Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="mt-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-950">
                  <Megaphone className="h-5 w-5 text-cyan-700" />
                  Social Post Generator
                </CardTitle>
                <CardDescription>
                  Create styled copy from a real listing for whichever network you are about to post on.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="w-full space-y-2 md:max-w-xs">
                    <label className="text-sm font-medium text-slate-700">Platform</label>
                    <Select value={platform} onValueChange={(value) => setPlatform(value as SocialPlatform)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleGenerateSocial} disabled={!selectedListing || socialLoading} className="rounded-xl">
                    {socialLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate social content
                  </Button>

                  {!hasAccess && (
                    <Badge className="flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-50">
                      <Lock className="h-3.5 w-3.5" />
                      Paid plans only
                    </Badge>
                  )}
                </div>

                {socialPost ? (
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div>
                      <div className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Hook</div>
                      <p className="text-base font-semibold text-slate-950">{socialPost.hook}</p>
                    </div>
                    <Separator />
                    <div>
                      <div className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Body</div>
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{socialPost.body}</p>
                    </div>
                    <Separator />
                    <div>
                      <div className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Call to Action</div>
                      <p className="text-sm font-medium text-slate-800">{socialPost.callToAction}</p>
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Hashtags</div>
                      <div className="flex flex-wrap gap-2">
                        {socialPost.hashtags.map((tag) => (
                          <Badge key={tag} variant="outline" className="bg-white">
                            {tag.startsWith("#") ? tag : `#${tag}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                    Generate a post and the styled output will appear here.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-950">
                  <ClipboardCheck className="h-5 w-5 text-emerald-700" />
                  Listing Audit
                </CardTitle>
                <CardDescription>
                  Get a blunt conversion-focused read on how your listing is currently positioned.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={handleAuditListing} disabled={!selectedListing || auditLoading} className="rounded-xl">
                    {auditLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                    Audit listing
                  </Button>
                  {!hasAccess && (
                    <Badge className="flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-50">
                      <Lock className="h-3.5 w-3.5" />
                      Paid plans only
                    </Badge>
                  )}
                </div>

                {audit ? (
                  <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                      <span className="text-sm font-medium text-slate-600">Listing score</span>
                      <span className="text-3xl font-black text-slate-950">{audit.score}/100</span>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="mb-2 text-sm font-bold text-emerald-800">Strengths</div>
                        <ul className="space-y-2 text-sm text-emerald-900">
                          {audit.strengths.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <div className="mb-2 text-sm font-bold text-amber-800">Weaknesses</div>
                        <ul className="space-y-2 text-sm text-amber-900">
                          {audit.weaknesses.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                        <div className="mb-2 text-sm font-bold text-sky-800">Actionable Advice</div>
                        <ul className="space-y-2 text-sm text-sky-900">
                          {audit.actionableAdvice.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                    Run an audit and the engine will score the listing and tell you what is helping or hurting conversion.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
