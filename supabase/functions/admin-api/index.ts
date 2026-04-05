import { corsHeaders, errorResponse, json, readActionBody, HttpError } from "../_shared/http.ts";
import { requireAdmin, requireUser } from "../_shared/supabase.ts";

async function requireAdminContext(req: Request) {
  const context = await requireUser(req);
  await requireAdmin(context.adminClient, context.user.id);
  return context;
}

const REFERRAL_REWARD_POINTS = {
  guest: { referrer: 500, referee: 200 },
  host: { referrer: 1000, referee: 500 },
} as const;

const REWARD_DEFINITIONS = {
  coastal_explorer: {
    points: 500,
    badge: {
      id: "coastal_explorer",
      name: "Coastal Explorer",
      icon: "🌊",
      description: "Booked Cape Town/Durban",
    },
  },
  photo_finisher: {
    points: 200,
    badge: {
      id: "photo_finisher",
      name: "Photo Finisher",
      icon: "📸",
      description: "Uploaded photo with review",
    },
  },
} as const;

function referralTable(host?: boolean) {
  return host ? "host_referrals" : "referrals";
}

function withRewardId<T extends { user_id: string; reward_code: string }>(row: T) {
  return {
    ...row,
    id: `${row.user_id}:${row.reward_code}`,
  };
}

async function addReferralRewardPoints(
  adminClient: ReturnType<typeof requireAdminContext> extends Promise<infer T> ? T["adminClient"] : never,
  kind: "guest" | "host",
  row: { referrer_id: string; referee_id: string; status: string; rewarded_at?: string | null },
) {
  if (row.status === "rewarded") {
    return;
  }

  const rewards = REFERRAL_REWARD_POINTS[kind];
  const { data: profiles, error: profilesError } = await adminClient
    .from("profiles")
    .select("id, points")
    .in("id", [row.referrer_id, row.referee_id]);

  if (profilesError) {
    throw new HttpError(500, "Failed to load referral reward balances", profilesError);
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const referrer = profileMap.get(row.referrer_id);
  const referee = profileMap.get(row.referee_id);

  if (!referrer || !referee) {
    throw new HttpError(404, "Referral participants could not be resolved");
  }

  const updates = [
    adminClient
      .from("profiles")
      .update({ points: Number(referrer.points ?? 0) + rewards.referrer })
      .eq("id", row.referrer_id),
    adminClient
      .from("profiles")
      .update({ points: Number(referee.points ?? 0) + rewards.referee })
      .eq("id", row.referee_id),
  ];

  const [referrerUpdate, refereeUpdate] = await Promise.all(updates);
  if (referrerUpdate.error || refereeUpdate.error) {
    throw new HttpError(500, "Failed to apply referral reward points", {
      referrer: referrerUpdate.error,
      referee: refereeUpdate.error,
    });
  }
}

async function awardRewardCompletion(
  adminClient: ReturnType<typeof requireAdminContext> extends Promise<infer T> ? T["adminClient"] : never,
  userId: string,
  rewardCode: keyof typeof REWARD_DEFINITIONS,
) {
  const definition = REWARD_DEFINITIONS[rewardCode];
  const { data: existingReward, error: existingRewardError } = await adminClient
    .from("rewards_completions")
    .select("user_id, reward_code")
    .eq("user_id", userId)
    .eq("reward_code", rewardCode)
    .maybeSingle();

  if (existingRewardError) {
    throw new HttpError(500, "Failed to inspect existing rewards", existingRewardError);
  }

  if (existingReward) {
    throw new HttpError(409, "Reward has already been awarded");
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("points, badges")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw new HttpError(500, "Failed to load reward profile", profileError);
  }

  const currentBadges = Array.isArray(profile.badges) ? profile.badges : [];
  const nextBadges = currentBadges.some((badge) => badge?.id === definition.badge.id)
    ? currentBadges
    : [
        ...currentBadges,
        {
          ...definition.badge,
          date: new Date().toISOString().slice(0, 10),
        },
      ];

  const { error: insertError } = await adminClient.from("rewards_completions").insert({
    user_id: userId,
    reward_code: rewardCode,
  });
  if (insertError) {
    throw new HttpError(500, "Failed to create reward completion", insertError);
  }

  const { error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({
      points: Number(profile.points ?? 0) + definition.points,
      badges: nextBadges,
    })
    .eq("id", userId);

  if (profileUpdateError) {
    throw new HttpError(500, "Failed to apply reward points", profileUpdateError);
  }

  const { data: insertedReward, error: rewardReadError } = await adminClient
    .from("rewards_completions")
    .select(`
      user_id,
      reward_code,
      created_at,
      user:profiles!rewards_completions_user_id_fkey(email, full_name)
    `)
    .eq("user_id", userId)
    .eq("reward_code", rewardCode)
    .single();

  if (rewardReadError) {
    throw new HttpError(500, "Failed to load awarded reward", rewardReadError);
  }

  return withRewardId(insertedReward);
}

async function getOverview(req: Request) {
  const { adminClient } = await requireAdminContext(req);
  const [users, listings, bookings, reviews, pendingReviews] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }),
    adminClient.from("properties").select("*", { count: "exact", head: true }),
    adminClient.from("bookings").select("*", { count: "exact", head: true }),
    adminClient.from("reviews").select("*", { count: "exact", head: true }),
    adminClient.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return {
    users: users.count ?? 0,
    listings: listings.count ?? 0,
    bookings: bookings.count ?? 0,
    reviews: reviews.count ?? 0,
    pendingReviews: pendingReviews.count ?? 0,
  };
}

async function listUsers(req: Request, payload: { page?: number; pageSize?: number }) {
  const { adminClient } = await requireAdminContext(req);
  const page = payload.page ?? 0;
  const pageSize = payload.pageSize ?? 20;
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await adminClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new HttpError(500, "Failed to load users", error);
  }

  return data ?? [];
}

async function updateUser(req: Request, payload: { userId: string; patch: Record<string, unknown> }) {
  const { adminClient } = await requireAdminContext(req);
  const { data, error } = await adminClient
    .from("profiles")
    .update(payload.patch)
    .eq("id", payload.userId)
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, "Failed to update user", error);
  }

  return data;
}

async function listListings(req: Request, payload: { limit?: number }) {
  const { adminClient } = await requireAdminContext(req);
  let query = adminClient
    .from("properties")
    .select(`
      *,
      host:profiles!properties_host_id_fkey(full_name, email, verification_status, avatar_url, host_plan)
    `)
    .order("created_at", { ascending: false })
    .limit(payload.limit ?? 50);

  if ((payload as { approvalStatus?: string }).approvalStatus) {
    query = query.eq("approval_status", (payload as { approvalStatus?: string }).approvalStatus!);
  }

  const { data, error } = await query;

  if (error) {
    throw new HttpError(500, "Failed to load listings", error);
  }

  return data ?? [];
}

async function listBookings(req: Request, payload: { page?: number; pageSize?: number; status?: string }) {
  const { adminClient } = await requireAdminContext(req);
  const page = payload.page ?? 0;
  const pageSize = payload.pageSize ?? 50;
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let query = adminClient
    .from("bookings")
    .select(`
      *,
      user:profiles!bookings_user_id_fkey(email, full_name, avatar_url),
      property:properties(id, title, image, location)
    `)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (payload.status) {
    query = query.eq("status", payload.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, "Failed to load bookings", error);
  }

  return data ?? [];
}

async function sendNotification(req: Request, payload: {
  userId?: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  broadcast?: boolean;
}) {
  const { adminClient } = await requireAdminContext(req);
  if (!payload.title?.trim() || !payload.message?.trim()) {
    throw new HttpError(400, "Title and message are required");
  }

  let userIds: string[] = [];
  if (payload.broadcast) {
    const { data, error } = await adminClient.from("profiles").select("id");
    if (error) {
      throw new HttpError(500, "Failed to load recipients", error);
    }
    userIds = (data ?? []).map((row) => row.id);
  } else if (payload.userId) {
    userIds = [payload.userId];
  } else {
    throw new HttpError(400, "A recipient is required");
  }

  if (userIds.length === 0) {
    return { count: 0 };
  }

  const notifications = userIds.map((userId) => ({
    user_id: userId,
    title: payload.title.trim(),
    message: payload.message.trim(),
    type: payload.type ?? "info",
    link: payload.link ?? null,
  }));

  const { error } = await adminClient.from("notifications").insert(notifications);
  if (error) {
    throw new HttpError(500, "Failed to send notifications", error);
  }

  return { count: notifications.length };
}

async function approveVerification(req: Request, payload: { userId: string }) {
  const { adminClient } = await requireAdminContext(req);
  const { data, error } = await adminClient
    .from("profiles")
    .update({ verification_status: "verified" })
    .eq("id", payload.userId)
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, "Failed to approve verification", error);
  }

  await adminClient.from("notifications").insert({
    user_id: payload.userId,
    title: "Verification Approved",
    message: "Your host verification has been approved.",
    type: "success",
    link: "/host/verification",
  });

  return data;
}

async function rejectVerification(req: Request, payload: { userId: string }) {
  const { adminClient } = await requireAdminContext(req);
  const { data, error } = await adminClient
    .from("profiles")
    .update({ verification_status: "rejected" })
    .eq("id", payload.userId)
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, "Failed to reject verification", error);
  }

  await adminClient.from("notifications").insert({
    user_id: payload.userId,
    title: "Verification Rejected",
    message: "Your host verification was rejected. Please review the requirements and submit again.",
    type: "error",
    link: "/host/verification",
  });

  return data;
}

async function editBooking(req: Request, payload: {
  bookingId: string;
  patch: Record<string, unknown>;
  delete?: boolean;
}) {
  const { adminClient } = await requireAdminContext(req);
  if (payload.delete) {
    const { error } = await adminClient.from("bookings").delete().eq("id", payload.bookingId);
    if (error) {
      throw new HttpError(500, "Failed to delete booking", error);
    }
    return { success: true };
  }

  const { data, error } = await adminClient
    .from("bookings")
    .update(payload.patch)
    .eq("id", payload.bookingId)
    .select(`
      *,
      user:profiles!bookings_user_id_fkey(email, full_name, avatar_url),
      property:properties(id, title, image, location)
    `)
    .single();

  if (error) {
    throw new HttpError(500, "Failed to update booking", error);
  }

  return data;
}

async function updateSettings(req: Request, payload: { patch: Record<string, unknown> }) {
  const { adminClient } = await requireAdminContext(req);
  const { data, error } = await adminClient
    .from("admin_settings")
    .update(payload.patch)
    .eq("id", 1)
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, "Failed to update admin settings", error);
  }

  return data;
}

async function getSettings(req: Request) {
  const { adminClient } = await requireAdminContext(req);
  const { data, error } = await adminClient.from("admin_settings").select("*").eq("id", 1).single();
  if (error) {
    throw new HttpError(500, "Failed to load admin settings", error);
  }
  return data;
}

async function getVerificationDocumentUrls(req: Request, payload: { userId: string }) {
  const { adminClient } = await requireAdminContext(req);
  const { data, error } = await adminClient
    .from("profiles")
    .select("verification_docs")
    .eq("id", payload.userId)
    .single();

  if (error) {
    throw new HttpError(500, "Failed to load verification documents", error);
  }

  const documents = data.verification_docs ?? {};
  return Object.fromEntries(
    await Promise.all(
      Object.entries(documents).map(async ([key, path]) => {
        const signed = await adminClient.storage.from("verification").createSignedUrl(String(path), 60 * 15);
        if (signed.error) {
          throw new HttpError(500, "Failed to create signed verification URL", signed.error);
        }
        return [key, { path, url: signed.data.signedUrl }];
      }),
    ),
  );
}

async function markNotificationRead(req: Request, payload: { notificationId: string }) {
  const { user, adminClient } = await requireUser(req);
  const { error } = await adminClient
    .from("notifications")
    .update({ read: true })
    .eq("id", payload.notificationId)
    .eq("user_id", user.id);

  if (error) {
    throw new HttpError(500, "Failed to mark notification as read", error);
  }

  return { success: true };
}

async function markAllNotificationsRead(req: Request) {
  const { user, adminClient } = await requireUser(req);
  const { error } = await adminClient
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    throw new HttpError(500, "Failed to mark notifications as read", error);
  }

  return { success: true };
}

async function deleteNotification(req: Request, payload: { notificationId: string }) {
  const { user, adminClient } = await requireUser(req);
  const { error } = await adminClient
    .from("notifications")
    .delete()
    .eq("id", payload.notificationId)
    .eq("user_id", user.id);

  if (error) {
    throw new HttpError(500, "Failed to delete notification", error);
  }

  return { success: true };
}

async function listNotificationRecipients(req: Request, payload: { limit?: number }) {
  const { adminClient } = await requireAdminContext(req);
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, email, full_name")
    .order("created_at", { ascending: false })
    .limit(payload.limit ?? 50);

  if (error) {
    throw new HttpError(500, "Failed to load notification recipients", error);
  }

  return data ?? [];
}

async function listReferrals(
  req: Request,
  payload: {
    host?: boolean;
    page?: number;
    pageSize?: number;
    status?: "pending" | "confirmed" | "rewarded";
  },
) {
  const { adminClient } = await requireAdminContext(req);
  const page = payload.page ?? 0;
  const pageSize = payload.pageSize ?? 25;
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const table = referralTable(payload.host);

  let query = adminClient
    .from(table)
    .select(`
      id,
      referrer_id,
      referee_id,
      status,
      created_at,
      rewarded_at,
      referrer:profiles!${table}_referrer_id_fkey(email, full_name),
      referee:profiles!${table}_referee_id_fkey(email, full_name)
    `)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (payload.status) {
    query = query.eq("status", payload.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, "Failed to load referrals", error);
  }

  return data ?? [];
}

async function createReferral(
  req: Request,
  payload: { host?: boolean; referrerEmail: string; refereeEmail: string },
) {
  const { adminClient } = await requireAdminContext(req);
  const table = referralTable(payload.host);
  const emails = [payload.referrerEmail.trim().toLowerCase(), payload.refereeEmail.trim().toLowerCase()];
  const { data: profiles, error: profileError } = await adminClient
    .from("profiles")
    .select("id, email, full_name")
    .in("email", emails);

  if (profileError) {
    throw new HttpError(500, "Failed to resolve referral users", profileError);
  }

  const referrer = (profiles ?? []).find((profile) => profile.email?.toLowerCase() === emails[0]);
  const referee = (profiles ?? []).find((profile) => profile.email?.toLowerCase() === emails[1]);

  if (!referrer || !referee) {
    throw new HttpError(404, "Both referrer and referee must exist");
  }

  const { data, error } = await adminClient
    .from(table)
    .insert({
      referrer_id: referrer.id,
      referee_id: referee.id,
      status: "pending",
    })
    .select(`
      id,
      referrer_id,
      referee_id,
      status,
      created_at,
      rewarded_at,
      referrer:profiles!${table}_referrer_id_fkey(email, full_name),
      referee:profiles!${table}_referee_id_fkey(email, full_name)
    `)
    .single();

  if (error) {
    throw new HttpError(500, "Failed to create referral", error);
  }

  return data;
}

async function updateReferral(
  req: Request,
  payload: { host?: boolean; referralId: string; status: "pending" | "confirmed" | "rewarded" },
) {
  const { adminClient } = await requireAdminContext(req);
  const table = referralTable(payload.host);
  const { data: existing, error: existingError } = await adminClient
    .from(table)
    .select("id, referrer_id, referee_id, status, rewarded_at")
    .eq("id", payload.referralId)
    .single();

  if (existingError) {
    throw new HttpError(500, "Failed to load referral", existingError);
  }

  if (payload.status === "rewarded") {
    await addReferralRewardPoints(adminClient, payload.host ? "host" : "guest", existing);
  }

  const { data, error } = await adminClient
    .from(table)
    .update({
      status: payload.status,
      rewarded_at: payload.status === "rewarded" ? new Date().toISOString() : null,
    })
    .eq("id", payload.referralId)
    .select(`
      id,
      referrer_id,
      referee_id,
      status,
      created_at,
      rewarded_at,
      referrer:profiles!${table}_referrer_id_fkey(email, full_name),
      referee:profiles!${table}_referee_id_fkey(email, full_name)
    `)
    .single();

  if (error) {
    throw new HttpError(500, "Failed to update referral", error);
  }

  return data;
}

async function deleteReferrals(
  req: Request,
  payload: { host?: boolean; referralIds: string[] },
) {
  const { adminClient } = await requireAdminContext(req);
  if (!payload.referralIds?.length) {
    return { success: true, count: 0 };
  }

  const { error } = await adminClient
    .from(referralTable(payload.host))
    .delete()
    .in("id", payload.referralIds);

  if (error) {
    throw new HttpError(500, "Failed to delete referrals", error);
  }

  return { success: true, count: payload.referralIds.length };
}

async function listRewards(
  req: Request,
  payload: { page?: number; pageSize?: number; rewardCode?: string },
) {
  const { adminClient } = await requireAdminContext(req);
  const page = payload.page ?? 0;
  const pageSize = payload.pageSize ?? 50;
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let query = adminClient
    .from("rewards_completions")
    .select(`
      user_id,
      reward_code,
      created_at,
      user:profiles!rewards_completions_user_id_fkey(email, full_name)
    `)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (payload.rewardCode) {
    query = query.eq("reward_code", payload.rewardCode);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, "Failed to load rewards", error);
  }

  return (data ?? []).map(withRewardId);
}

async function awardReward(
  req: Request,
  payload: { userEmail: string; rewardCode: keyof typeof REWARD_DEFINITIONS },
) {
  const { adminClient } = await requireAdminContext(req);
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", payload.userEmail.trim().toLowerCase())
    .single();

  if (profileError || !profile) {
    throw new HttpError(404, "User not found");
  }

  return awardRewardCompletion(adminClient, profile.id, payload.rewardCode);
}

async function deleteRewards(
  req: Request,
  payload: { rewardIds: string[] },
) {
  const { adminClient } = await requireAdminContext(req);
  if (!payload.rewardIds?.length) {
    return { success: true, count: 0 };
  }

  const rewardPairs = payload.rewardIds
    .map((id) => {
      const [userId, rewardCode] = id.split(":");
      if (!userId || !rewardCode || !(rewardCode in REWARD_DEFINITIONS)) {
        throw new HttpError(400, `Invalid reward id: ${id}`);
      }
      return { userId, rewardCode: rewardCode as keyof typeof REWARD_DEFINITIONS };
    });

  for (const pair of rewardPairs) {
    const definition = REWARD_DEFINITIONS[pair.rewardCode];
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("points, badges")
      .eq("id", pair.userId)
      .single();

    if (profileError) {
      throw new HttpError(500, "Failed to load reward profile", profileError);
    }

    const nextPoints = Math.max(0, Number(profile.points ?? 0) - definition.points);
    const nextBadges = Array.isArray(profile.badges)
      ? profile.badges.filter((badge) => badge?.id !== definition.badge.id)
      : [];

    const { error: deleteError } = await adminClient
      .from("rewards_completions")
      .delete()
      .eq("user_id", pair.userId)
      .eq("reward_code", pair.rewardCode);
    if (deleteError) {
      throw new HttpError(500, "Failed to delete reward completion", deleteError);
    }

    const { error: profileUpdateError } = await adminClient
      .from("profiles")
      .update({ points: nextPoints, badges: nextBadges })
      .eq("id", pair.userId);
    if (profileUpdateError) {
      throw new HttpError(500, "Failed to rewind reward points", profileUpdateError);
    }
  }

  return { success: true, count: rewardPairs.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { action, payload } = await readActionBody(req);
    switch (action) {
      case "getOverview":
        return json(await getOverview(req));
      case "listUsers":
        return json(await listUsers(req, payload));
      case "updateUser":
        return json(await updateUser(req, payload));
      case "listListings":
        return json(await listListings(req, payload));
      case "listBookings":
        return json(await listBookings(req, payload));
      case "approveVerification":
        return json(await approveVerification(req, payload));
      case "rejectVerification":
        return json(await rejectVerification(req, payload));
      case "editBooking":
        return json(await editBooking(req, payload));
      case "sendNotification":
        return json(await sendNotification(req, payload));
      case "getSettings":
        return json(await getSettings(req));
      case "updateSettings":
        return json(await updateSettings(req, payload));
      case "getVerificationDocumentUrls":
        return json(await getVerificationDocumentUrls(req, payload));
      case "markNotificationRead":
        return json(await markNotificationRead(req, payload));
      case "markAllNotificationsRead":
        return json(await markAllNotificationsRead(req));
      case "deleteNotification":
        return json(await deleteNotification(req, payload));
      case "listNotificationRecipients":
        return json(await listNotificationRecipients(req, payload));
      case "listReferrals":
        return json(await listReferrals(req, payload));
      case "createReferral":
        return json(await createReferral(req, payload));
      case "updateReferral":
        return json(await updateReferral(req, payload));
      case "deleteReferrals":
        return json(await deleteReferrals(req, payload));
      case "listRewards":
        return json(await listRewards(req, payload));
      case "awardReward":
        return json(await awardReward(req, payload));
      case "deleteRewards":
        return json(await deleteRewards(req, payload));
      default:
        throw new HttpError(404, `Unsupported action: ${action}`);
    }
  } catch (error) {
    return errorResponse(error);
  }
});
