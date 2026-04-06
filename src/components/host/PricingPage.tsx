import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  LineChart,
  Loader2,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { billingApi } from "@/lib/api/billing";
import { hostApi } from "@/lib/api/host";
import type { HostPlan } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type BillingInterval = "monthly" | "annual";
type PaidPlanId = Exclude<HostPlan, "free">;

interface PlanFeature {
  text: string;
}

interface Plan {
  id: "standard" | "premium" | "elite";
  checkoutPlanId?: PaidPlanId;
  name: string;
  eyebrow: string;
  monthlyPrice?: number;
  annualMonthlyPrice?: number;
  customPriceLabel?: string;
  description: string;
  highlight?: string;
  cta: string;
  contactOnly?: boolean;
  tone: "light" | "dark" | "warm";
  features: PlanFeature[];
}

const plans: Plan[] = [
  {
    id: "standard",
    checkoutPlanId: "standard",
    name: "Growth",
    eyebrow: "Paid Tier 01",
    monthlyPrice: 149,
    annualMonthlyPrice: 129,
    description:
      "The practical upgrade for hosts who want their listing to stop sitting quietly in the catalogue.",
    highlight: "Most Popular",
    cta: "Choose Growth",
    tone: "light",
    features: [
      { text: "Higher search visibility" },
      { text: "Full photo gallery and video slot" },
      { text: "Verified host badge" },
      { text: "Monthly social visibility support" },
      { text: "Access to the content engine" },
      { text: "Promotion-ready listing presentation" },
    ],
  },
  {
    id: "premium",
    checkoutPlanId: "premium",
    name: "Scale",
    eyebrow: "Paid Tier 02",
    monthlyPrice: 399,
    annualMonthlyPrice: 349,
    description:
      "For revenue-minded hosts who want stronger amplification, featured positioning, and faster support.",
    highlight: "Best Reach",
    cta: "Choose Scale",
    tone: "dark",
    features: [
      { text: "Everything in Growth" },
      { text: "Featured promo support" },
      { text: "Priority traffic windows" },
      { text: "Professional video support" },
      { text: "Direct WhatsApp support" },
      { text: "Custom marketing templates" },
    ],
  },
  {
    id: "elite",
    name: "Elite",
    eyebrow: "Concierge",
    customPriceLabel: "Custom",
    description:
      "A white-glove path for hosts who want a tighter commercial relationship instead of a self-serve plan.",
    highlight: "Concierge",
    cta: "Talk to us",
    contactOnly: true,
    tone: "warm",
    features: [
      { text: "Everything in Scale" },
      { text: "Priority creative turnaround" },
      { text: "Campaign planning support" },
      { text: "Dedicated growth guidance" },
      { text: "Priority partner access" },
      { text: "White-glove launch support" },
    ],
  },
];

const planStats = [
  { label: "Commission", value: "0%", icon: BadgeCheck },
  { label: "Audience reach", value: "1M+", icon: Megaphone },
  { label: "Ranking uplift", value: "2.4x", icon: LineChart },
];

const storyBlocks = [
  {
    icon: ShieldCheck,
    title: "Trust lands first",
    body: "Verified presentation and richer listing depth reduce hesitation before the first message even arrives.",
  },
  {
    icon: Megaphone,
    title: "Distribution compounds",
    body: "The higher tiers buy more than decoration. They push the property into better placement and more useful traffic.",
  },
  {
    icon: Video,
    title: "Content stops stalling",
    body: "Paid plans unlock reusable campaign output, so the listing becomes promotion material instead of dormant inventory.",
  },
];

const engineBlocks = [
  {
    label: "Input",
    body: "Pick one listing and pull its title, location, price, and amenities directly into the content flow.",
  },
  {
    label: "Output",
    body: "Generate platform-ready copy for Instagram, Facebook, X, or LinkedIn without rewriting the same story from scratch.",
  },
  {
    label: "Media",
    body: "Higher tiers pair stronger placement with richer media support, which makes the promotion feel deliberate instead of improvised.",
  },
  {
    label: "Support",
    body: "When a listing matters commercially, the upper tiers buy faster escalation and less waiting around.",
  },
];

const comparisonRows = [
  { label: "Listings included", values: ["Multiple", "Multiple", "Multiple"] },
  { label: "Verified badge", values: ["Included", "Included", "Priority"] },
  { label: "Video placement", values: ["Included", "Included", "Priority"] },
  { label: "Social promotion", values: ["Monthly visibility", "Featured promo", "Campaign-led"] },
  { label: "Content engine", values: ["Included", "Advanced use", "Guided support"] },
  { label: "Analytics and support", values: ["Standard", "Priority", "Concierge"] },
];

function getPlanLabel(plan: HostPlan) {
  if (plan === "free") {
    return "No paid tier";
  }

  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export default function PricingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<PaidPlanId | null>(null);
  const [fetchingPlan, setFetchingPlan] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<HostPlan>("free");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const audience = searchParams.get("audience");
  const sourceType = searchParams.get("source_type");
  const sourceLabel = searchParams.get("source_label") || searchParams.get("region");
  const isOwnedMediaCampaign = sourceType === "owned_media";

  useEffect(() => {
    setBillingInterval(searchParams.get("billing") === "annual" ? "annual" : "monthly");
  }, [searchParams]);

  const fetchPlan = useCallback(async () => {
    if (!user) {
      setCurrentPlan("free");
      setFetchingPlan(false);
      return;
    }

    try {
      const profile = await hostApi.getProfile();
      setCurrentPlan(profile?.host_plan ?? "free");
    } catch (error) {
      console.error("Error fetching plan:", error);
    } finally {
      setFetchingPlan(false);
    }
  }, [user]);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const paymentSessionId = searchParams.get("paymentSessionId");
      const status = searchParams.get("status");

      if (status === "cancelled") {
        toast({
          variant: "destructive",
          title: "Payment Cancelled",
          description: "You have not been charged.",
        });
        return;
      }

      if (status === "failed") {
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: "The payment could not be completed.",
        });
        return;
      }

      if (!paymentSessionId) {
        return;
      }

      toast({
        title: "Payment Received",
        description: "Checking your plan upgrade...",
      });

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const session = await billingApi.getSessionStatus({ paymentSessionId });

        if (session.status === "succeeded" && session.plan_id) {
          setCurrentPlan(session.plan_id);
          setLoadingPlan(null);
          toast({
            title: "Plan Updated",
            description: `You are now on the ${getPlanLabel(session.plan_id)} plan.`,
          });
          return;
        }

        if (session.status === "failed" || session.status === "canceled") {
          setLoadingPlan(null);
          toast({
            variant: "destructive",
            title: "Upgrade Failed",
            description: "The payment did not complete successfully.",
          });
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      if (status === "success") {
        toast({
          title: "Payment Processing",
          description: "We have the return, but payment confirmation is still pending.",
        });
      }
    };

    checkPaymentStatus();
  }, [searchParams, toast]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleUpgrade = useCallback(
    async (planId: Plan["id"]) => {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Sign in required",
          description: "Please sign in before choosing a paid host plan.",
        });
        return;
      }

      const plan = plans.find((entry) => entry.id === planId);
      if (!plan) {
        return;
      }

      if (plan.contactOnly || !plan.checkoutPlanId) {
        toast({
          title: "Elite is concierge-led",
          description: "That tier is not self-serve yet. Use the host workspace and wire a direct sales path instead.",
        });
        return;
      }

      const amount =
        billingInterval === "annual"
          ? (plan.annualMonthlyPrice ?? plan.monthlyPrice ?? 0)
          : (plan.monthlyPrice ?? 0);

      if (amount <= 0) {
        return;
      }

      setLoadingPlan(plan.checkoutPlanId);

      try {
        const currentUrl = window.location.href.split("?")[0];
        const data = await billingApi.startPlanCheckout({
          planId: plan.checkoutPlanId,
          amount,
          successUrl: currentUrl,
          cancelUrl: `${currentUrl}?status=cancelled`,
          failUrl: `${currentUrl}?status=failed`,
        });

        if (!data?.redirectUrl) {
          throw new Error("No redirect URL returned from payment server");
        }

        window.location.href = data.redirectUrl;
      } catch (error: unknown) {
        setLoadingPlan(null);
        console.error("Payment setup error:", error);

        let message = error instanceof Error ? error.message : "Could not start payment session.";
        if (message.includes("Failed to fetch")) {
          message =
            "Payment server is unreachable. If you are developing locally, make sure the Supabase functions are running.";
        }

        toast({
          variant: "destructive",
          title: "Payment Error",
          description: message,
        });
      }
    },
    [billingInterval, toast, user],
  );

  const getPlanPrice = useCallback(
    (plan: Plan) => {
      if (plan.customPriceLabel) {
        return {
          display: plan.customPriceLabel,
          suffix: billingInterval === "monthly" ? "contact sales" : "concierge plan",
          helper: "Custom support path",
        };
      }

      const monthlyAmount = plan.monthlyPrice ?? 0;
      const annualMonthlyAmount = plan.annualMonthlyPrice ?? monthlyAmount;

      if (billingInterval === "monthly") {
        return {
          display: `R${monthlyAmount}`,
          suffix: "per month",
          helper: null as string | null,
        };
      }

      const annualAmount = annualMonthlyAmount * 10;
      return {
        display: `R${annualAmount.toLocaleString()}`,
        suffix: "per year",
        helper:
          annualMonthlyAmount > 0
            ? `2 months free (${annualMonthlyAmount.toLocaleString()} / month)`
            : null,
      };
    },
    [billingInterval],
  );

  if (fetchingPlan) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full bg-[linear-gradient(180deg,#f6f8fb_0%,#ffffff_24%,#f7fafc_100%)] pb-20">
      <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#08111f_0%,#10304c_48%,#14506e_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.16),_transparent_24%)]" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-14 md:px-10 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-14">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border border-white/20 bg-white/10 px-3 py-1 text-cyan-100 hover:bg-white/10">
                Host Pricing
              </Badge>
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/55">
                Public Pricing
              </span>
            </div>

            <div className="max-w-3xl space-y-5">
              <h1 className="text-5xl font-black leading-[0.9] tracking-[-0.05em] text-white md:text-7xl">
                Paid plans built to push serious listings harder.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
                This page is public because pricing is not a settings detail. It is a growth decision. Choose how much reach,
                trust, and promotional support you want behind the property.
              </p>
            </div>

            {isOwnedMediaCampaign && sourceLabel && (
              <div className="max-w-xl rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm text-cyan-50 backdrop-blur-sm">
                <div className="font-bold uppercase tracking-[0.2em] text-cyan-200">Campaign Source</div>
                <p className="mt-2 leading-6">
                  You arrived through <span className="font-semibold text-white">{sourceLabel}</span>. Attribution stays intact while you compare plans.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {!user ? (
                <div className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-medium text-amber-100">
                  Sign in to upgrade, but the full structure is visible before you commit.
                </div>
              ) : (
                <div className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100">
                  {currentPlan === "free"
                    ? "You are not on a paid host tier yet."
                    : `Your current plan: ${getPlanLabel(currentPlan)}`}
                </div>
              )}

              {audience === "host" && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/host")}
                  className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                >
                  Back to Host Workspace
                </Button>
              )}
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 p-1 shadow-[0_20px_50px_rgba(2,6,23,0.22)] backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setBillingInterval("monthly")}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  billingInterval === "monthly" ? "bg-white text-slate-950" : "text-white/75 hover:text-white",
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval("annual")}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  billingInterval === "annual" ? "bg-emerald-400 text-slate-950" : "text-white/75 hover:text-white",
                )}
              >
                Annual
              </button>
              <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
                2 months free
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_35px_100px_rgba(2,6,23,0.35)] backdrop-blur-md">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-100/70">Visibility Engine</p>
                  <h2 className="mt-3 text-3xl font-black leading-tight text-white">
                    A plan page should feel like a growth brief, not a billing form.
                  </h2>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {planStats.map((stat) => (
                  <div key={stat.label} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
                    <stat.icon className="mb-4 h-5 w-5 text-cyan-100" />
                    <div className="text-3xl font-black text-white">{stat.value}</div>
                    <div className="mt-1 text-sm font-medium text-slate-200">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 border-t border-white/10 pt-6 md:grid-cols-3">
                {storyBlocks.map((block) => (
                  <div key={block.title} className="space-y-3">
                    <block.icon className="h-5 w-5 text-amber-200" />
                    <h3 className="text-base font-bold text-white">{block.title}</h3>
                    <p className="text-sm leading-6 text-slate-300">{block.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-3 md:px-10 lg:px-14">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Reach</p>
            <p className="text-lg font-semibold text-slate-950">Push the listing into real audience circulation.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Trust</p>
            <p className="text-lg font-semibold text-slate-950">Show enough depth that hesitation drops and inquiry intent improves.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Output</p>
            <p className="text-lg font-semibold text-slate-950">Turn one property into reusable campaign material instead of quiet inventory.</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Choose The Push</p>
              <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
                Three paid paths. Three different levels of commercial intent.
              </h2>
              <p className="text-base leading-7 text-slate-600 md:text-lg">
                Growth handles serious visibility, Scale adds heavier amplification, and Elite is there when a host wants concierge support instead of self-serve.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
              Annual billing lowers the effective monthly rate and makes the commitment explicit.
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-200 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = !plan.contactOnly && currentPlan === plan.checkoutPlanId;
              const isLoading = !plan.contactOnly && loadingPlan === plan.checkoutPlanId;
              const price = getPlanPrice(plan);
              const isDark = plan.tone === "dark";
              const isWarm = plan.tone === "warm";

              return (
                <article
                  key={plan.id}
                  className={cn(
                    "relative flex min-h-[40rem] flex-col p-8 md:p-10",
                    isDark && "bg-slate-950 text-white",
                    isWarm && "bg-[linear-gradient(180deg,#f7f0ff_0%,#fdf8ff_100%)]",
                    !isDark && !isWarm && "bg-white",
                    isCurrent && "outline outline-2 outline-offset-[-12px] outline-cyan-400",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-1",
                      isDark
                        ? "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500"
                        : "bg-gradient-to-r from-amber-300 via-cyan-400 to-blue-500",
                    )}
                  />

                  <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                      <p
                        className={cn(
                          "text-xs font-semibold uppercase tracking-[0.35em]",
                          isDark ? "text-cyan-100/70" : "text-slate-400",
                        )}
                      >
                        {plan.eyebrow}
                      </p>
                      <h3
                        className={cn(
                          "mt-3 text-3xl font-black tracking-[-0.04em]",
                          isDark ? "text-white" : "text-slate-950",
                        )}
                      >
                        {plan.name}
                      </h3>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {plan.highlight && (
                        <Badge
                          className={cn(
                            "px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em]",
                            isDark
                              ? "border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10"
                              : "bg-slate-950 text-white hover:bg-slate-950",
                          )}
                        >
                          {plan.highlight}
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mb-5 flex items-end gap-3">
                    <span
                      className={cn(
                        "text-5xl font-black tracking-[-0.05em]",
                        isDark ? "text-white" : "text-slate-950",
                      )}
                    >
                      {price.display}
                    </span>
                    <span
                      className={cn(
                        "pb-1 text-sm font-semibold uppercase tracking-[0.22em]",
                        isDark ? "text-slate-300" : "text-slate-500",
                      )}
                    >
                      {price.suffix}
                    </span>
                  </div>

                  {price.helper && (
                    <p className={cn("mb-5 text-sm font-semibold", isDark ? "text-emerald-200" : "text-emerald-700")}>
                      {price.helper}
                    </p>
                  )}

                  <p className={cn("max-w-sm text-base leading-7", isDark ? "text-slate-200" : "text-slate-600")}>
                    {plan.description}
                  </p>

                  <ul className="mt-8 space-y-3 border-t border-current/10 pt-8">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-3 text-sm">
                        <Check className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", isDark ? "text-cyan-200" : "text-emerald-600")} />
                        <span className={cn("leading-6", isDark ? "text-slate-100" : "text-slate-700")}>{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-10">
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={(loadingPlan !== null && !isLoading) || isCurrent}
                      variant={isCurrent ? "outline" : "default"}
                      className={cn(
                        "h-12 w-full rounded-full text-base font-semibold",
                        isDark && "bg-white text-slate-950 hover:bg-slate-100",
                        !isDark && !isWarm && "bg-slate-950 text-white hover:bg-slate-800",
                        isWarm && "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          {plan.cta}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 md:px-10 lg:px-14">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
            <div className="mb-8 max-w-xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Compare What Changes</p>
              <h3 className="text-3xl font-black tracking-[-0.04em] text-slate-950">
                A blunt view of what each tier actually buys.
              </h3>
              <p className="text-base leading-7 text-slate-600">
                No filler. Just what gets unlocked when the listing stops being treated like background noise.
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
              <div className="grid grid-cols-4 bg-slate-950 text-white">
                <div className="px-4 py-4 text-sm font-bold uppercase tracking-[0.22em] text-slate-300">Feature</div>
                {plans.map((plan) => (
                  <div key={plan.id} className="px-4 py-4 text-center text-sm font-bold uppercase tracking-[0.22em]">
                    {plan.name}
                  </div>
                ))}
              </div>

              {comparisonRows.map((row, rowIndex) => (
                <div key={row.label} className={cn("grid grid-cols-4", rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50")}>
                  <div className="px-4 py-4 text-sm font-semibold text-slate-700">{row.label}</div>
                  {row.values.map((value, valueIndex) => (
                    <div key={`${row.label}-${valueIndex}`} className="px-4 py-4 text-center text-sm text-slate-600">
                      {value}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(140deg,#fff9ef_0%,#fff4ec_42%,#f2f7ff_100%)] p-8 shadow-sm md:p-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-sm font-medium text-amber-800">
                <Sparkles className="h-4 w-4" />
                Included Content Engine
              </div>

              <div className="space-y-3">
                <h3 className="text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl">
                  Every paid tier turns listings into reusable campaign material.
                </h3>
                <p className="max-w-2xl text-base leading-7 text-slate-700">
                  This is not “AI content” for the sake of a buzzword. The point is reducing the friction between having a property and promoting it consistently across real channels.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {engineBlocks.map((block) => (
                  <div key={block.label} className="rounded-[1.5rem] border border-white/80 bg-white/85 p-5">
                    <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{block.label}</div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{block.body}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] bg-slate-950 px-6 py-6 text-white">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-xl space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/70">Final Call</p>
                    <h4 className="text-2xl font-black tracking-[-0.04em]">
                      Pick the tier that matches how aggressively you want to move the listing.
                    </h4>
                  </div>
                  <Button
                    onClick={() => navigate(user ? "/host" : "/")}
                    className="rounded-full bg-white text-slate-950 hover:bg-slate-100"
                  >
                    {user ? "Go to host workspace" : "Explore the marketplace"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
