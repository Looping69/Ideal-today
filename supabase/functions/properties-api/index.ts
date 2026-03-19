import { empty, json } from "../_shared/cors.ts";
import { createAdminClient, requireAdmin, requireUser } from "../_shared/supabase.ts";
import { assert, isNonEmptyString } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return empty(req);
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    assert(isNonEmptyString(body?.action), "Missing action");

    if (body.action === "save-host-listing") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();

      const payload = {
        title: body.title,
        description: body.description,
        location: body.location,
        area: body.area,
        province: body.province || null,
        price: body.price,
        discount: body.discount,
        type: body.type,
        amenities: body.amenities,
        facilities: body.facilities,
        other_facility: body.other_facility,
        guests: body.guests,
        adults: body.adults,
        children: body.children,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        is_self_catering: body.is_self_catering,
        has_restaurant: body.has_restaurant,
        restaurant_offers: body.restaurant_offers,
        image: body.image,
        images: body.images,
        video_url: body.video_url,
        is_occupied: body.is_occupied,
        host_id: user.id,
        latitude: body.latitude,
        longitude: body.longitude,
        approval_status: "pending",
      };

      if (isNonEmptyString(body.id)) {
        const { data, error } = await admin
          .from("properties")
          .update(payload)
          .eq("id", body.id)
          .eq("host_id", user.id)
          .select("id")
          .single();
        if (error || !data) throw error || new Error("Failed to update listing");
        return json(req, { id: data.id });
      }

      const { data, error } = await admin
        .from("properties")
        .insert(payload)
        .select("id")
        .single();
      if (error || !data) throw error || new Error("Failed to create listing");
      return json(req, { id: data.id });
    }

    if (body.action === "delete-host-listing") {
      const { user } = await requireUser(req);
      const admin = createAdminClient();
      assert(isNonEmptyString(body.id), "Missing listing id");

      const today = new Date().toISOString();
      const { data: activeBookings, error: activeBookingsError } = await admin
        .from("bookings")
        .select("id")
        .eq("property_id", body.id)
        .gte("check_out", today)
        .neq("status", "canceled");

      if (activeBookingsError) throw activeBookingsError;
      assert(!activeBookings?.length, "This property has active or upcoming bookings");

      const { data: bookings, error: bookingsError } = await admin
        .from("bookings")
        .select("id")
        .eq("property_id", body.id);
      if (bookingsError) throw bookingsError;

      if (bookings?.length) {
        const bookingIds = bookings.map((booking) => booking.id);
        const { error: messagesError } = await admin.from("messages").delete().in("booking_id", bookingIds);
        if (messagesError) throw messagesError;
      }

      const { error: reviewsError } = await admin.from("reviews").delete().eq("property_id", body.id);
      if (reviewsError) throw reviewsError;

      const { error: deleteBookingsError } = await admin.from("bookings").delete().eq("property_id", body.id);
      if (deleteBookingsError) throw deleteBookingsError;

      const { data, error } = await admin
        .from("properties")
        .delete()
        .eq("id", body.id)
        .eq("host_id", user.id)
        .select("id")
        .single();
      if (error || !data) throw error || new Error("Failed to delete listing");

      return json(req, { ok: true });
    }

    const { admin } = await requireAdmin(req);

    if (body.action === "admin-set-featured") {
      assert(isNonEmptyString(body.id), "Missing listing id");
      const { data, error } = await admin
        .from("properties")
        .update({ is_featured: !!body.isFeatured })
        .eq("id", body.id)
        .select("id")
        .single();
      if (error || !data) throw error || new Error("Failed to update featured state");
      return json(req, { ok: true });
    }

    if (body.action === "admin-update-listing") {
      assert(isNonEmptyString(body.id), "Missing listing id");
      const updates: Record<string, unknown> = {};
      if (typeof body.title === "string") updates.title = body.title.trim();
      if (typeof body.location === "string") updates.location = body.location.trim();
      if (typeof body.price === "number") updates.price = body.price;
      if (typeof body.type === "string") updates.type = body.type;
      if (body.video_url === null || typeof body.video_url === "string") updates.video_url = body.video_url;

      const { data, error } = await admin
        .from("properties")
        .update(updates)
        .eq("id", body.id)
        .select("id")
        .single();
      if (error || !data) throw error || new Error("Failed to update listing");
      return json(req, { ok: true });
    }

    if (body.action === "admin-review-listing") {
      assert(isNonEmptyString(body.id), "Missing listing id");
      assert(body.status === "approved" || body.status === "rejected", "Invalid listing status");

      const { data: listing, error: listingError } = await admin
        .from("properties")
        .update({
          approval_status: body.status,
          rejection_reason: body.status === "rejected" ? (body.rejectionReason || null) : null,
        })
        .eq("id", body.id)
        .select("id, host_id, title")
        .single();

      if (listingError || !listing) throw listingError || new Error("Failed to review listing");

      const title = body.status === "approved" ? "Listing Approved" : "Listing Rejected";
      const message = body.status === "approved"
        ? `${listing.title} is now live on Ideal Stay.`
        : `${listing.title} was rejected.${body.rejectionReason ? ` Reason: ${body.rejectionReason}` : ""}`;

      await admin.from("notifications").insert({
        user_id: listing.host_id,
        title,
        message,
        type: body.status === "approved" ? "success" : "error",
        link: "/host/listings",
      });

      return json(req, { ok: true });
    }

    if (body.action === "admin-delete-listing") {
      assert(isNonEmptyString(body.id), "Missing listing id");
      const { data, error } = await admin.from("properties").delete().eq("id", body.id).select("id").single();
      if (error || !data) throw error || new Error("Failed to delete listing");
      return json(req, { ok: true });
    }

    return json(req, { error: "Unsupported action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return json(req, { error: message }, status);
  }
});
