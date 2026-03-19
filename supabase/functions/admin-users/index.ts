import { empty, json } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/supabase.ts";
import { assert, isNonEmptyString } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return empty(req);
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const { admin } = await requireAdmin(req);
    const body = await req.json();
    assert(isNonEmptyString(body?.action), "Missing action");

    if (body.action === "update-role-status") {
      assert(isNonEmptyString(body.userId), "Missing userId");
      const updates: Record<string, unknown> = {};
      if (typeof body.isAdmin === "boolean") updates.is_admin = body.isAdmin;
      if (typeof body.deactivated === "boolean") updates.deactivated = body.deactivated;

      const { data, error } = await admin
        .from("profiles")
        .update(updates)
        .eq("id", body.userId)
        .select("id, is_admin, deactivated")
        .single();

      if (error) throw error;
      return json(req, { profile: data });
    }

    if (body.action === "update-profile") {
      assert(isNonEmptyString(body.userId), "Missing userId");
      const updates: Record<string, unknown> = {};
      if (isNonEmptyString(body.fullName)) updates.full_name = body.fullName.trim();
      if (typeof body.points === "number") updates.points = body.points;
      if (isNonEmptyString(body.hostPlan)) updates.host_plan = body.hostPlan;
      if (isNonEmptyString(body.referralTier)) updates.referral_tier = body.referralTier;

      const { data, error } = await admin
        .from("profiles")
        .update(updates)
        .eq("id", body.userId)
        .select("id, full_name, points, host_plan, referral_tier")
        .single();

      if (error) throw error;
      return json(req, { profile: data });
    }

    if (body.action === "review-verification") {
      assert(isNonEmptyString(body.userId), "Missing userId");
      assert(body.status === "verified" || body.status === "rejected", "Invalid status");

      const { error: profileError } = await admin
        .from("profiles")
        .update({ verification_status: body.status })
        .eq("id", body.userId);

      if (profileError) throw profileError;

      const title = body.status === "verified" ? "Verification Approved" : "Verification Rejected";
      const message = body.status === "verified"
        ? "Your host verification has been approved. You now have access to verified host features."
        : "Your host verification was rejected. Please review your documents and try again.";

      const { error: notificationError } = await admin
        .from("notifications")
        .insert({
          user_id: body.userId,
          title,
          message,
          type: body.status === "verified" ? "success" : "error",
          link: "/host/verification",
        });

      if (notificationError) throw notificationError;
      return json(req, { ok: true });
    }

    if (body.action === "send-notification") {
      assert(isNonEmptyString(body.userId), "Missing userId");
      assert(isNonEmptyString(body.title), "Missing title");
      assert(isNonEmptyString(body.message), "Missing message");

      const { error } = await admin.from("notifications").insert({
        user_id: body.userId,
        title: body.title.trim(),
        message: body.message.trim(),
        type: isNonEmptyString(body.type) ? body.type : "info",
        link: isNonEmptyString(body.link) ? body.link.trim() : null,
      });

      if (error) throw error;
      return json(req, { ok: true });
    }

    if (body.action === "broadcast") {
      assert(isNonEmptyString(body.title), "Missing title");
      assert(isNonEmptyString(body.message), "Missing message");

      const { data: users, error: usersError } = await admin.from("profiles").select("id");
      if (usersError) throw usersError;

      const notifications = (users || []).map((user) => ({
        user_id: user.id,
        title: body.title.trim(),
        message: body.message.trim(),
        type: isNonEmptyString(body.type) ? body.type : "info",
        link: isNonEmptyString(body.link) ? body.link.trim() : null,
      }));

      for (let index = 0; index < notifications.length; index += 100) {
        const { error } = await admin.from("notifications").insert(notifications.slice(index, index + 100));
        if (error) throw error;
      }

      return json(req, { count: notifications.length });
    }

    return json(req, { error: "Unsupported action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return json(req, { error: message }, status);
  }
});
