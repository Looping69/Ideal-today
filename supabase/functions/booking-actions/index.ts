import { empty, json } from "../_shared/cors.ts";
import { createAdminClient, requireAdmin, requireUser } from "../_shared/supabase.ts";
import { assert, asIsoDate, isNonEmptyString } from "../_shared/validation.ts";

const HOST_ALLOWED_STATUSES = new Set(["confirmed", "canceled", "completed"]);
const ADMIN_ALLOWED_STATUSES = new Set(["pending", "confirmed", "completed", "canceled", "blocked"]);

function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return empty(req);
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    assert(isNonEmptyString(body?.action), "Missing action");

    if (body.action === "host-block-dates") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();

      assert(isNonEmptyString(body.propertyId), "Missing propertyId");
      const checkIn = asIsoDate(body.checkIn);
      const checkOut = asIsoDate(body.checkOut);
      assert(checkIn, "Invalid check-in date");
      assert(checkOut, "Invalid check-out date");
      assert(checkIn < checkOut, "Check-out must be after check-in");

      const { data: property, error: propertyError } = await admin
        .from("properties")
        .select("id")
        .eq("id", body.propertyId)
        .eq("host_id", user.id)
        .single();

      if (propertyError || !property) throw propertyError || new Error("Property not found");

      const { data: overlap, error: overlapError } = await admin
        .from("bookings")
        .select("id")
        .eq("property_id", body.propertyId)
        .neq("status", "canceled")
        .lt("check_in", checkOut.toISOString())
        .gt("check_out", checkIn.toISOString())
        .limit(1);

      if (overlapError) throw overlapError;
      assert(!overlap?.length, "These dates overlap an existing reservation or block");

      const { data, error } = await admin
        .from("bookings")
        .insert({
          property_id: body.propertyId,
          user_id: user.id,
          check_in: checkIn.toISOString(),
          check_out: checkOut.toISOString(),
          total_price: 0,
          status: "blocked",
          payment_status: "not_required",
        })
        .select("id, status")
        .single();

      if (error || !data) throw error || new Error("Failed to block dates");
      return json(req, { booking: data });
    }

    if (body.action === "host-update-booking-status") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();

      assert(isNonEmptyString(body.bookingId), "Missing bookingId");
      const nextStatus = normalizeStatus(body.status);
      assert(HOST_ALLOWED_STATUSES.has(nextStatus), "Invalid status");

      const { data: booking, error: bookingError } = await admin
        .from("bookings")
        .select("id, property_id")
        .eq("id", body.bookingId)
        .single();

      if (bookingError || !booking) throw bookingError || new Error("Booking not found");

      const { data: property, error: propertyError } = await admin
        .from("properties")
        .select("host_id")
        .eq("id", booking.property_id)
        .single();

      if (propertyError || !property) throw propertyError || new Error("Property not found");
      assert(property.host_id === user.id, "Forbidden");

      const updates: Record<string, unknown> = { status: nextStatus };
      if (nextStatus === "confirmed") updates.confirmed_at = new Date().toISOString();

      const { data, error } = await admin
        .from("bookings")
        .update(updates)
        .eq("id", body.bookingId)
        .select("id, status")
        .single();

      if (error || !data) throw error || new Error("Failed to update booking");
      return json(req, { booking: data });
    }

    if (body.action === "admin-update-booking-status" || body.action === "admin-update-booking") {
      const { admin } = await requireAdmin(req);
      assert(isNonEmptyString(body.bookingId), "Missing bookingId");

      const updates: Record<string, unknown> = {};
      if (body.status !== undefined) {
        const nextStatus = normalizeStatus(body.status);
        assert(ADMIN_ALLOWED_STATUSES.has(nextStatus), "Invalid status");
        updates.status = nextStatus;
        if (nextStatus === "confirmed") updates.confirmed_at = new Date().toISOString();
      }

      if (body.checkIn !== undefined) {
        const checkIn = asIsoDate(body.checkIn);
        assert(checkIn, "Invalid check-in date");
        updates.check_in = checkIn.toISOString();
      }

      if (body.checkOut !== undefined) {
        const checkOut = asIsoDate(body.checkOut);
        assert(checkOut, "Invalid check-out date");
        updates.check_out = checkOut.toISOString();
      }

      if (updates.check_in && updates.check_out) {
        assert(new Date(String(updates.check_in)) < new Date(String(updates.check_out)), "Check-out must be after check-in");
      }

      const { data, error } = await admin
        .from("bookings")
        .update(updates)
        .eq("id", body.bookingId)
        .select("id, status, check_in, check_out")
        .single();

      if (error || !data) throw error || new Error("Failed to update booking");
      return json(req, { booking: data });
    }

    if (body.action === "admin-delete-booking") {
      const { admin } = await requireAdmin(req);
      assert(isNonEmptyString(body.bookingId), "Missing bookingId");

      const { error: messageError } = await admin
        .from("messages")
        .delete()
        .eq("booking_id", body.bookingId);
      if (messageError) throw messageError;

      const { data, error } = await admin
        .from("bookings")
        .delete()
        .eq("id", body.bookingId)
        .select("id")
        .single();

      if (error || !data) throw error || new Error("Failed to delete booking");
      return json(req, { ok: true });
    }

    return json(req, { error: "Unsupported action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return json(req, { error: message }, status);
  }
});
