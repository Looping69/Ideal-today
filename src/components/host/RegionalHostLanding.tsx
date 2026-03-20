import { ArrowRight, BadgeCheck, Megaphone, Sparkles, LineChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getRegionCampaign } from "@/lib/hostGrowth";

export default function RegionalHostLanding() {
  const { regionSlug } = useParams<{ regionSlug: string }>();
  const navigate = useNavigate();
  const campaign = getRegionCampaign(regionSlug);

  if (!campaign) {
    return <Navigate to="/pricing?audience=host" replace />;
  }

  const pricingSearch = new URLSearchParams({
    audience: "host",
    source_type: "owned_media",
    source_key: campaign.slug,
    source_label: campaign.audienceLabel,
    region: campaign.region,
    billing: "annual",
  }).toString();

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-16">
      <section className={`relative overflow-hidden rounded-[2rem] border border-slate-200 px-6 py-10 shadow-sm md:px-10 md:py-14 ${campaign.heroGradient}`}>
        <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-cyan-200/25 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-amber-200/20 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.18fr_0.82fr] lg:items-end">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-700 hover:bg-cyan-50">
                {campaign.spotlightLabel}
              </Badge>
              <span className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
                Owned Media Campaign
              </span>
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                {campaign.headline}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                {campaign.subheadline}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                {campaign.mediaReach}
              </div>
              <div className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700">
                {campaign.proof}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate(`/pricing?${pricingSearch}`)}
                className="h-12 rounded-full px-6 text-base font-semibold"
              >
                See Host Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/pricing?${pricingSearch.replace("billing=annual", "billing=monthly")}`)}
                className="h-12 rounded-full border-slate-300 bg-white/80 px-6 text-base font-semibold"
              >
                Start Monthly Instead
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Annual bias", value: "2 months free", icon: BadgeCheck },
              { label: "Content perk", value: "Launch pack included", icon: Sparkles },
              { label: "Growth angle", value: "Regional visibility", icon: Megaphone },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/70 bg-white/80 p-5 backdrop-blur-sm shadow-sm">
                <stat.icon className="mb-3 h-5 w-5 text-cyan-700" />
                <div className="text-3xl font-black text-slate-950">{stat.value}</div>
                <div className="mt-1 text-sm font-medium text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-950">
              <Megaphone className="h-5 w-5 text-cyan-700" />
              Distribution
            </CardTitle>
            <CardDescription>This is not a cold-start listing.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-slate-600">
            You are coming through an owned Ideal Stay audience. That means the platform can offer more than a profile page. It can offer actual regional attention.
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-950">
              <Sparkles className="h-5 w-5 text-cyan-700" />
              Content Engine
            </CardTitle>
            <CardDescription>Move faster than the average host.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-slate-600">
            Paid plans unlock the content studio so your listing can be turned into reusable social copy instead of sitting there waiting for inspiration.
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-950">
              <LineChart className="h-5 w-5 text-cyan-700" />
              Better Economics
            </CardTitle>
            <CardDescription>Annual is the serious-host move.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-slate-600">
            The annual plans are where we can justify stronger launch incentives, better retention rewards, and a cleaner acquisition cost model.
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            <ShieldCheck className="h-4 w-4" />
            What you unlock
          </div>
          <h2 className="text-3xl font-black text-slate-950">
            Join through {campaign.region} and we keep the acquisition context intact.
          </h2>
          <p className="text-base leading-7 text-slate-600">
            This route preserves the source data so we can attribute your signup correctly, avoid fake referral leakage, and build better region-level economics over time.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            "Region-tagged source tracking",
            "Annual plan promotion path",
            "Content launch pack positioning",
            "Future visibility-credit support",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
