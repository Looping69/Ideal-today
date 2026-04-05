import { invokeAction } from "@/lib/api/client";
import type { RewardsDashboardData } from "@/lib/api/types";

export const engagementApi = {
  toggleWishlist: (payload: { propertyId: string }) =>
    invokeAction<typeof payload, { saved: boolean }>("engagement-api", "toggleWishlist", payload),

  submitReview: (payload: {
    propertyId: string;
    rating: number;
    content: string;
    photoUrl?: string | null;
  }) => invokeAction<typeof payload, { success: true }>("engagement-api", "submitReview", payload),

  getRewardsDashboard: () =>
    invokeAction<Record<string, never>, RewardsDashboardData>("engagement-api", "getRewardsDashboard", {}),

  claimReward: (payload: { rewardCode: "coastal_explorer" | "photo_finisher" }) =>
    invokeAction<typeof payload, { result: string }>("engagement-api", "claimReward", payload),

  getReferralDashboard: (payload: { host?: boolean } = {}) =>
    invokeAction<
      typeof payload,
      {
        code?: string | null;
        referrals: Array<{
          referee_id: string;
          status: string;
          created_at: string;
          rewarded_at?: string | null;
        }>;
      }
    >("engagement-api", "getReferralDashboard", payload),
};
