import { corsHeaders, errorResponse, json, readActionBody, HttpError } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

async function toggleWishlist(req: Request, payload: { propertyId: string }) {
  const { user, adminClient } = await requireUser(req);
  const { data: existing, error: existingError } = await adminClient
    .from("wishlists")
    .select("property_id")
    .eq("user_id", user.id)
    .eq("property_id", payload.propertyId)
    .maybeSingle();

  if (existingError) {
    throw new HttpError(500, "Failed to inspect wishlist state", existingError);
  }

  if (existing) {
    const { error } = await adminClient
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("property_id", payload.propertyId);

    if (error) {
      throw new HttpError(500, "Failed to remove wishlist item", error);
    }

    return { saved: false };
  }

  const { error } = await adminClient.from("wishlists").insert({
    user_id: user.id,
    property_id: payload.propertyId,
  });

  if (error) {
    throw new HttpError(500, "Failed to save wishlist item", error);
  }

  return { saved: true };
}

async function submitReview(req: Request, payload: {
  propertyId: string;
  rating: number;
  content: string;
  photoUrl?: string | null;
}) {
  const { user, adminClient } = await requireUser(req);
  const { data: booking, error: bookingError } = await adminClient
    .from("bookings")
    .select("id")
    .eq("user_id", user.id)
    .eq("property_id", payload.propertyId)
    .in("status", ["confirmed", "completed"])
    .limit(1)
    .maybeSingle();

  if (bookingError) {
    throw new HttpError(500, "Failed to validate review eligibility", bookingError);
  }

  if (!booking) {
    throw new HttpError(403, "You can only review properties you have booked");
  }

  const { data: existing, error: existingError } = await adminClient
    .from("reviews")
    .select("id")
    .eq("property_id", payload.propertyId)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new HttpError(500, "Failed to inspect existing reviews", existingError);
  }

  if (existing) {
    throw new HttpError(409, "You have already reviewed this property");
  }

  const { error } = await adminClient.from("reviews").insert({
    property_id: payload.propertyId,
    user_id: user.id,
    rating: payload.rating,
    content: payload.content,
    photo_url: payload.photoUrl ?? null,
    status: "pending",
  });

  if (error) {
    throw new HttpError(500, "Failed to submit review", error);
  }

  return { success: true };
}

async function getRewardsDashboard(req: Request) {
  const { user, adminClient } = await requireUser(req);
  const [profileResult, referralResult] = await Promise.all([
    adminClient
      .from("profiles")
      .select("points, level, badges, referral_code")
      .eq("id", user.id)
      .single(),
    adminClient
      .from("referrals")
      .select("referee_id, status, created_at, rewarded_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (profileResult.error || referralResult.error) {
    throw new HttpError(500, "Failed to load rewards dashboard");
  }

  return {
    points: profileResult.data.points ?? 0,
    level: profileResult.data.level ?? "Scout",
    badges: profileResult.data.badges ?? [],
    referral_code: profileResult.data.referral_code ?? null,
    referrals: referralResult.data ?? [],
  };
}

async function claimReward(req: Request, payload: { rewardCode: "coastal_explorer" | "photo_finisher" }) {
  const { userClient } = await requireUser(req);
  const rpcName = payload.rewardCode === "coastal_explorer" ? "claim_coastal_explorer" : "claim_photo_finisher";
  const { data, error } = await userClient.rpc(rpcName);
  if (error) {
    throw new HttpError(500, "Failed to claim reward", error);
  }
  return { result: String(data) };
}

async function getReferralDashboard(req: Request, payload: { host?: boolean }) {
  const { user, adminClient } = await requireUser(req);
  if (payload.host) {
    const [profileResult, refsResult] = await Promise.all([
      adminClient.from("profiles").select("host_referral_code").eq("id", user.id).single(),
      adminClient
        .from("host_referrals")
        .select("referee_id, status, created_at, rewarded_at")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (profileResult.error || refsResult.error) {
      throw new HttpError(500, "Failed to load host referral dashboard");
    }

    return {
      code: profileResult.data.host_referral_code ?? null,
      referrals: refsResult.data ?? [],
    };
  }

  const [profileResult, refsResult] = await Promise.all([
    adminClient.from("profiles").select("referral_code").eq("id", user.id).single(),
    adminClient
      .from("referrals")
      .select("referee_id, status, created_at, rewarded_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (profileResult.error || refsResult.error) {
    throw new HttpError(500, "Failed to load referral dashboard");
  }

  return {
    code: profileResult.data.referral_code ?? null,
    referrals: refsResult.data ?? [],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { action, payload } = await readActionBody(req);
    switch (action) {
      case "toggleWishlist":
        return json(await toggleWishlist(req, payload));
      case "submitReview":
        return json(await submitReview(req, payload));
      case "getRewardsDashboard":
        return json(await getRewardsDashboard(req));
      case "claimReward":
        return json(await claimReward(req, payload));
      case "getReferralDashboard":
        return json(await getReferralDashboard(req, payload));
      default:
        throw new HttpError(404, `Unsupported action: ${action}`);
    }
  } catch (error) {
    return errorResponse(error);
  }
});
