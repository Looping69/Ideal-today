export type RegionCampaign = {
  slug: string;
  region: string;
  audienceLabel: string;
  headline: string;
  subheadline: string;
  proof: string;
  mediaReach: string;
  spotlightLabel: string;
  heroGradient: string;
};

export const REGION_CAMPAIGNS: RegionCampaign[] = [
  {
    slug: "durban",
    region: "Durban",
    audienceLabel: "Durban Holiday Accommodation",
    headline: "Turn Durban attention into booked nights, not ignored posts.",
    subheadline:
      "List on Ideal Stay, get a sharper listing, and plug straight into the Durban holiday audience already watching.",
    proof: "One of the strongest owned audience clusters in the network.",
    mediaReach: "431.9K audience reach",
    spotlightLabel: "Durban visibility launch",
    heroGradient:
      "bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_34%),linear-gradient(135deg,#fffef7_0%,#eef9ff_48%,#e6f5ff_100%)]",
  },
  {
    slug: "cape-town",
    region: "Cape Town",
    audienceLabel: "Cape Town Holiday Accommodation",
    headline: "Get your Cape Town property in front of travelers before they bounce elsewhere.",
    subheadline:
      "Use Ideal Stay to tighten the listing, generate reusable social content, and get distribution into a city people already search for obsessively.",
    proof: "High-intent destination audience with premium host upside.",
    mediaReach: "68K audience reach",
    spotlightLabel: "Cape Town host push",
    heroGradient:
      "bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_34%),linear-gradient(135deg,#fffef7_0%,#f3fff9_44%,#ecfdf5_100%)]",
  },
  {
    slug: "margate",
    region: "Margate",
    audienceLabel: "Margate Holiday Accommodation",
    headline: "Own more of the Margate booking conversation.",
    subheadline:
      "If your property sits in a seasonal market, you need speed, visibility, and content that gets posted before the rush passes.",
    proof: "Strong coastal demand with high seasonal upside.",
    mediaReach: "56.8K audience reach",
    spotlightLabel: "Margate seasonal campaign",
    heroGradient:
      "bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_34%),linear-gradient(135deg,#fffef7_0%,#fff7ed_44%,#fff1f2_100%)]",
  },
  {
    slug: "umhlanga",
    region: "Umhlanga",
    audienceLabel: "Umhlanga Holiday Accommodation",
    headline: "Premium Umhlanga stock needs premium presentation.",
    subheadline:
      "The play here is not just listing inventory. It is stronger positioning, cleaner social output, and higher-confidence visibility for better hosts.",
    proof: "Premium coastal demand with stronger monetization headroom.",
    mediaReach: "37.3K audience reach",
    spotlightLabel: "Umhlanga premium launch",
    heroGradient:
      "bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_34%),linear-gradient(135deg,#fffef7_0%,#eef2ff_42%,#f5f3ff_100%)]",
  },
  {
    slug: "mpumalanga",
    region: "Mpumalanga",
    audienceLabel: "Mpumalanga Holiday Accommodation",
    headline: "Lowveld properties win when the listing and the local distribution actually match.",
    subheadline:
      "Ideal Stay can package the property, sharpen the story, and help your listing move through a regional audience that already understands the destination.",
    proof: "Strong regional relevance across safari and scenic routes.",
    mediaReach: "43.6K audience reach",
    spotlightLabel: "Mpumalanga host rollout",
    heroGradient:
      "bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_34%),linear-gradient(135deg,#fffef7_0%,#f0fdf4_44%,#ecfeff_100%)]",
  },
  {
    slug: "garden-route",
    region: "Garden Route",
    audienceLabel: "Garden Route Holiday Accommodation",
    headline: "Garden Route listings should not look generic.",
    subheadline:
      "Use the platform, content engine, and visibility inventory together so your property feels worth clicking before the guest even opens the full details.",
    proof: "Strong destination demand with broad route-wide discovery patterns.",
    mediaReach: "1.3K core group plus cross-network amplification",
    spotlightLabel: "Garden Route host drive",
    heroGradient:
      "bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.16),_transparent_34%),linear-gradient(135deg,#fffef7_0%,#ecfeff_44%,#eef6ff_100%)]",
  },
];

export function getRegionCampaign(regionSlug: string | undefined) {
  if (!regionSlug) return null;
  return REGION_CAMPAIGNS.find((campaign) => campaign.slug === regionSlug) ?? null;
}
