import { empty, json } from "../_shared/cors.ts";
import { createAdminClient, requireAdmin, requireUser } from "../_shared/supabase.ts";
import { assert, isNonEmptyString } from "../_shared/validation.ts";

const REWARD_POINTS: Record<string, number> = {
  coastal_explorer: 500,
  photo_finisher: 200,
};

const REFERRAL_TABLES = new Set(["referrals", "host_referrals"]);
const REFERRAL_STATUSES = new Set(["pending", "confirmed", "rewarded"]);

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function appendBadge(existing: unknown, rewardCode: string) {
  const badgeMeta: Record<string, { name: string; icon: string; description: string }> = {
    coastal_explorer: {
      name: "Coastal Explorer",
      icon: "🌊",
      description: "Booked Cape Town/Durban",
    },
    photo_finisher: {
      name: "Photo Finisher",
      icon: "📸",
      description: "Uploaded photo with review",
    },
  };

  const meta = badgeMeta[rewardCode];
  if (!meta) return existing ?? [];
  const current = Array.isArray(existing) ? existing : [];
  if (current.some((badge) => badge?.id === rewardCode)) return current;
  return [
    ...current,
    {
      id: rewardCode,
      name: meta.name,
      icon: meta.icon,
      description: meta.description,
      date: new Date().toISOString().slice(0, 10),
    },
  ];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return empty(req);
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    assert(isNonEmptyString(body?.action), "Missing action");

    if (body.action === "toggle-wishlist" || body.action === "set-wishlist") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();
      assert(isNonEmptyString(body.propertyId), "Missing propertyId");

      const explicitSave = typeof body.saved === "boolean" ? body.saved : undefined;
      const { data: existing, error: existingError } = await admin
        .from("wishlists")
        .select("property_id")
        .eq("user_id", user.id)
        .eq("property_id", body.propertyId)
        .maybeSingle();
      if (existingError) throw existingError;

      const shouldSave = explicitSave ?? !existing;
      if (!shouldSave) {
        const { error } = await admin
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("property_id", body.propertyId);
        if (error) throw error;
        return json(req, { saved: false });
      }

      if (!existing) {
        const { error } = await admin
          .from("wishlists")
          .insert({ user_id: user.id, property_id: body.propertyId });
        if (error) throw error;
      }
      return json(req, { saved: true });
    }

    if (body.action === "add-guest-note" || body.action === "save-guest-note") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();
      assert(isNonEmptyString(body.guestId), "Missing guestId");
      const content = normalizeText(body.content);
      assert(content, "Missing note content");

      const { data: properties, error: propertiesError } = await admin
        .from("properties")
        .select("id")
        .eq("host_id", user.id);
      if (propertiesError) throw propertiesError;
      const propertyIds = (properties || []).map((property) => property.id);
      assert(propertyIds.length > 0, "You do not have any properties");

      const { data: booking, error: bookingError } = await admin
        .from("bookings")
        .select("id")
        .eq("user_id", body.guestId)
        .neq("status", "canceled")
        .in("property_id", propertyIds)
        .limit(1);

      if (bookingError) throw bookingError;
      assert(!!booking?.length, "Guest is not linked to one of your properties");

      const { data, error } = await admin
        .from("guest_notes")
        .insert({ host_id: user.id, guest_id: body.guestId, content })
        .select("id, guest_id, content, created_at")
        .single();

      if (error || !data) throw error || new Error("Failed to save note");
      return json(req, { note: data });
    }

    if (body.action === "delete-guest-note") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();
      assert(isNonEmptyString(body.noteId), "Missing noteId");

      const { data, error } = await admin
        .from("guest_notes")
        .delete()
        .eq("id", body.noteId)
        .eq("host_id", user.id)
        .select("id")
        .single();

      if (error || !data) throw error || new Error("Failed to delete note");
      return json(req, { ok: true });
    }

    if (body.action === "send-message") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();
      assert(isNonEmptyString(body.bookingId), "Missing bookingId");
      const content = normalizeText(body.content);
      assert(content, "Missing message content");

      const { data: booking, error: bookingError } = await admin
        .from("bookings")
        .select("id, user_id, status, property_id")
        .eq("id", body.bookingId)
        .single();

      if (bookingError || !booking) throw bookingError || new Error("Booking not found");

      const { data: property, error: propertyError } = await admin
        .from("properties")
        .select("host_id")
        .eq("id", booking.property_id)
        .single();

      if (propertyError || !property) throw propertyError || new Error("Property not found");
      const hostId = property.host_id;
      const isParticipant = booking.user_id === user.id || hostId === user.id;
      assert(isParticipant, "Forbidden");
      assert(booking.status === "confirmed" || booking.status === "completed", "Messaging is only available for active bookings");

      const { data, error } = await admin
        .from("messages")
        .insert({ booking_id: body.bookingId, sender_id: user.id, content })
        .select("id, booking_id, sender_id, content, created_at")
        .single();

      if (error || !data) throw error || new Error("Failed to send message");
      return json(req, { message: data });
    }

    if (body.action === "submit-review") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();
      assert(isNonEmptyString(body.propertyId), "Missing propertyId");
      const rating = Number(body.rating);
      assert(Number.isFinite(rating) && rating >= 1 && rating <= 5, "Invalid rating");

      const { data: eligibleBooking, error: bookingError } = await admin
        .from("bookings")
        .select("id")
        .eq("property_id", body.propertyId)
        .eq("user_id", user.id)
        .in("status", ["confirmed", "completed"])
        .order("check_out", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (bookingError) throw bookingError;
      assert(!!eligibleBooking?.id, "You can only review properties you have stayed at");

      const { data: existing, error: existingError } = await admin
        .from("reviews")
        .select("id")
        .eq("property_id", body.propertyId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingError) throw existingError;
      assert(!existing, "You have already reviewed this property");

      const { data, error } = await admin
        .from("reviews")
        .insert({
          property_id: body.propertyId,
          user_id: user.id,
          booking_id: eligibleBooking.id,
          rating,
          content: normalizeText(body.content) || null,
          photo_url: isNonEmptyString(body.photoUrl) ? body.photoUrl.trim() : null,
        })
        .select("id, status")
        .single();

      if (error || !data) throw error || new Error("Failed to submit review");
      return json(req, { review: data });
    }

    if (body.action === "generate-host-referral-code") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
        const { data: existing, error: existingError } = await admin
          .from("profiles")
          .select("id")
          .eq("host_referral_code", code)
          .maybeSingle();

        if (existingError) throw existingError;
        if (existing) continue;

        const { error } = await admin
          .from("profiles")
          .update({ host_referral_code: code })
          .eq("id", user.id);

        if (error) throw error;
        return json(req, { code });
      }

      throw new Error("Failed to generate a unique referral code");
    }

    if (body.action === "mark-notification-read") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();
      assert(isNonEmptyString(body.notificationId), "Missing notificationId");

      const { data, error } = await admin
        .from("notifications")
        .update({ read: true })
        .eq("id", body.notificationId)
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (error || !data) throw error || new Error("Failed to update notification");
      return json(req, { ok: true });
    }

    if (body.action === "mark-all-notifications-read") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();

      const { error } = await admin
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;
      return json(req, { ok: true });
    }

    if (body.action === "delete-notification") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();
      assert(isNonEmptyString(body.notificationId), "Missing notificationId");

      const { data, error } = await admin
        .from("notifications")
        .delete()
        .eq("id", body.notificationId)
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (error || !data) throw error || new Error("Failed to delete notification");
      return json(req, { ok: true });
    }

    if (body.action === "admin-update-referral-status" || body.action === "admin-bulk-update-referrals") {
      const { admin } = await requireAdmin(req);
      assert(REFERRAL_TABLES.has(body.table), "Invalid referral table");
      const status = normalizeText(body.status).toLowerCase();
      assert(REFERRAL_STATUSES.has(status), "Invalid referral status");
      const rewardedAt = status === "rewarded" ? new Date().toISOString() : null;

      if (body.action === "admin-update-referral-status") {
        assert(isNonEmptyString(body.id), "Missing referral id");
        const { error } = await admin
          .from(body.table)
          .update({ status, rewarded_at: rewardedAt })
          .eq("id", body.id);
        if (error) throw error;
        return json(req, { ok: true });
      }

      assert(Array.isArray(body.ids) && body.ids.length > 0, "Missing referral ids");
      const { error } = await admin
        .from(body.table)
        .update({ status, rewarded_at: rewardedAt })
        .in("id", body.ids);
      if (error) throw error;
      return json(req, { ok: true });
    }

    if (body.action === "admin-delete-referral" || body.action === "admin-bulk-delete-referrals") {
      const { admin } = await requireAdmin(req);
      assert(REFERRAL_TABLES.has(body.table), "Invalid referral table");

      if (body.action === "admin-delete-referral") {
        assert(isNonEmptyString(body.id), "Missing referral id");
        const { error } = await admin.from(body.table).delete().eq("id", body.id);
        if (error) throw error;
        return json(req, { ok: true });
      }

      assert(Array.isArray(body.ids) && body.ids.length > 0, "Missing referral ids");
      const { error } = await admin.from(body.table).delete().in("id", body.ids);
      if (error) throw error;
      return json(req, { ok: true });
    }

    if (body.action === "admin-create-referral") {
      const { admin } = await requireAdmin(req);
      assert(REFERRAL_TABLES.has(body.table), "Invalid referral table");
      const referrerEmail = normalizeText(body.referrerEmail);
      const refereeEmail = normalizeText(body.refereeEmail);
      assert(referrerEmail, "Missing referrer email");
      assert(refereeEmail, "Missing referee email");

      const { data: referrer, error: referrerError } = await admin
        .from("profiles")
        .select("id")
        .eq("email", referrerEmail)
        .maybeSingle();
      if (referrerError) throw referrerError;
      assert(referrer?.id, "Referrer profile not found");

      const { data: referee, error: refereeError } = await admin
        .from("profiles")
        .select("id")
        .eq("email", refereeEmail)
        .maybeSingle();
      if (refereeError) throw refereeError;
      assert(referee?.id, "Referee profile not found");

      const { data, error } = await admin
        .from(body.table)
        .insert({
          referrer_id: referrer.id,
          referee_id: referee.id,
          status: "pending",
        })
        .select("id, referrer_id, referee_id, status, created_at, rewarded_at")
        .single();

      if (error || !data) throw error || new Error("Failed to create referral");
      return json(req, { referral: data });
    }

    if (body.action === "admin-award-reward") {
      const { admin } = await requireAdmin(req);
      const userEmail = normalizeText(body.userEmail);
      const rewardCode = normalizeText(body.rewardCode);
      assert(userEmail, "Missing user email");
      assert(rewardCode in REWARD_POINTS, "Unsupported reward code");

      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("id, points, badges")
        .eq("email", userEmail)
        .maybeSingle();
      if (profileError) throw profileError;
      assert(profile?.id, "User not found");

      const { data: existing, error: existingError } = await admin
        .from("rewards_completions")
        .select("user_id")
        .eq("user_id", profile.id)
        .eq("reward_code", rewardCode)
        .maybeSingle();
      if (existingError) throw existingError;
      assert(!existing, "Reward already exists for this user");

      const { data, error } = await admin
        .from("rewards_completions")
        .insert({ user_id: profile.id, reward_code: rewardCode })
        .select("user_id, reward_code, created_at")
        .single();
      if (error || !data) throw error || new Error("Failed to award reward");

      const nextPoints = (profile.points || 0) + REWARD_POINTS[rewardCode];
      const nextBadges = appendBadge(profile.badges, rewardCode);
      const { error: profileUpdateError } = await admin
        .from("profiles")
        .update({ points: nextPoints, badges: nextBadges })
        .eq("id", profile.id);
      if (profileUpdateError) throw profileUpdateError;

      return json(req, { reward: data });
    }

    if (body.action === "admin-delete-rewards") {
      const { admin } = await requireAdmin(req);
      assert(Array.isArray(body.ids) && body.ids.length > 0, "Missing reward ids");

      const rewardKeys = (body.ids as string[])
        .map((value) => {
          const [userId, rewardCode] = String(value).split(":");
          return userId && rewardCode ? { user_id: userId, reward_code: rewardCode } : null;
        })
        .filter((value): value is { user_id: string; reward_code: string } => !!value);
      assert(rewardKeys.length > 0, "Invalid reward ids");

      const grouped = new Map<string, number>();
      for (const reward of rewardKeys) {
        grouped.set(reward.user_id, (grouped.get(reward.user_id) || 0) + (REWARD_POINTS[reward.reward_code] || 0));
      }

      for (const [userId, pointsToRollback] of grouped.entries()) {
        const { data: profile, error: profileError } = await admin
          .from("profiles")
          .select("points")
          .eq("id", userId)
          .maybeSingle();
        if (profileError) throw profileError;
        const nextPoints = Math.max(0, (profile?.points || 0) - pointsToRollback);
        const { error } = await admin.from("profiles").update({ points: nextPoints }).eq("id", userId);
        if (error) throw error;
      }

      for (const reward of rewardKeys) {
        const { error } = await admin
          .from("rewards_completions")
          .delete()
          .eq("user_id", reward.user_id)
          .eq("reward_code", reward.reward_code);
        if (error) throw error;
      }
      return json(req, { ok: true });
    }

    if (body.action === "admin-save-settings") {
      const { admin } = await requireAdmin(req);
      const payload = {
        id: 1,
        site_name: body.site_name ?? "",
        support_email: body.support_email ?? "",
        meta_description: body.meta_description ?? "",
        require_email_verification: !!body.require_email_verification,
        enable_2fa: !!body.enable_2fa,
        maintenance_mode: !!body.maintenance_mode,
        service_fee_percent: typeof body.service_fee_percent === "number" ? body.service_fee_percent : 10,
        welcome_email_template: body.welcome_email_template ?? "",
        booking_confirmation_template: body.booking_confirmation_template ?? "",
      };

      const { data, error } = await admin
        .from("admin_settings")
        .upsert(payload, { onConflict: "id" })
        .select("*")
        .single();

      if (error || !data) throw error || new Error("Failed to save settings");
      return json(req, { settings: data });
    }

    return json(req, { error: "Unsupported action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return json(req, { error: message }, status);
  }
});
