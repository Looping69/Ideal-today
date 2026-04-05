import { corsHeaders, errorResponse, json, readActionBody, HttpError } from "../_shared/http.ts";
import { requireAdmin, requireUser } from "../_shared/supabase.ts";

async function listGuestBookings(req: Request) {
  const { user, adminClient } = await requireUser(req);
  const { data, error } = await adminClient
    .from("bookings")
    .select(`
      *,
      property:properties(id, title, location, image)
    `)
    .eq("user_id", user.id)
    .order("check_in", { ascending: true });

  if (error) {
    throw new HttpError(500, "Failed to load guest bookings", error);
  }

  return data ?? [];
}

async function listHostBookings(req: Request, payload: { propertyId?: string; includeBlocked?: boolean }) {
  const { user, adminClient } = await requireUser(req);
  const { data: properties, error: propertiesError } = await adminClient
    .from("properties")
    .select("id")
    .eq("host_id", user.id);

  if (propertiesError) {
    throw new HttpError(500, "Failed to load host properties", propertiesError);
  }

  const propertyIds = (properties ?? []).map((property) => property.id);
  if (propertyIds.length === 0) {
    return [];
  }

  let query = adminClient
    .from("bookings")
    .select(`
      *,
      user:profiles!bookings_user_id_fkey(full_name, avatar_url, email),
      property:properties(id, title, image, location)
    `)
    .in("property_id", payload.propertyId ? [payload.propertyId] : propertyIds)
    .order("created_at", { ascending: false });

  if (!payload.includeBlocked) {
    query = query.neq("status", "blocked");
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, "Failed to load host bookings", error);
  }

  return data ?? [];
}

async function blockDates(req: Request, payload: { propertyId: string; from: string; to: string }) {
  const { user, adminClient } = await requireUser(req);
  const { data: property, error: propertyError } = await adminClient
    .from("properties")
    .select("id")
    .eq("id", payload.propertyId)
    .eq("host_id", user.id)
    .single();

  if (propertyError || !property) {
    throw new HttpError(403, "You do not own this property");
  }

  const { data, error } = await adminClient
    .from("bookings")
    .insert({
      property_id: payload.propertyId,
      user_id: user.id,
      check_in: payload.from,
      check_out: payload.to,
      total_price: 0,
      status: "blocked",
    })
    .select(`
      *,
      user:profiles!bookings_user_id_fkey(full_name, avatar_url, email),
      property:properties(id, title, image, location)
    `)
    .single();

  if (error) {
    throw new HttpError(500, "Failed to block dates", error);
  }

  return data;
}

async function updateBookingStatus(req: Request, payload: { bookingId: string; status: string }) {
  const { user, adminClient } = await requireUser(req);
  const { data: booking, error: bookingError } = await adminClient
    .from("bookings")
    .select("id, user_id, property_id, status, property:properties(host_id)")
    .eq("id", payload.bookingId)
    .single();

  if (bookingError || !booking) {
    throw new HttpError(404, "Booking not found");
  }

  const isHost = booking.property?.host_id === user.id;
  const isGuest = booking.user_id === user.id;
  if (!isHost && !isGuest) {
    await requireAdmin(adminClient, user.id);
  }

  if (isGuest && payload.status !== "canceled") {
    throw new HttpError(403, "Guests may only cancel their own bookings");
  }

  const { data, error } = await adminClient
    .from("bookings")
    .update({ status: payload.status })
    .eq("id", payload.bookingId)
    .select(`
      *,
      user:profiles!bookings_user_id_fkey(full_name, avatar_url, email),
      property:properties(id, title, image, location)
    `)
    .single();

  if (error) {
    throw new HttpError(500, "Failed to update booking status", error);
  }

  return data;
}

async function listMessages(req: Request, payload: { bookingId: string }) {
  const { user, adminClient } = await requireUser(req);
  const { data: booking, error: bookingError } = await adminClient
    .from("bookings")
    .select("id, user_id, property:properties(host_id)")
    .eq("id", payload.bookingId)
    .single();

  if (bookingError || !booking) {
    throw new HttpError(404, "Booking not found");
  }

  if (booking.user_id !== user.id && booking.property?.host_id !== user.id) {
    throw new HttpError(403, "You do not have access to this conversation");
  }

  const { data, error } = await adminClient
    .from("messages")
    .select("*")
    .eq("booking_id", payload.bookingId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new HttpError(500, "Failed to load messages", error);
  }

  return data ?? [];
}

async function sendMessage(req: Request, payload: { bookingId: string; content: string }) {
  const { user, adminClient } = await requireUser(req);
  const content = payload.content?.trim();
  if (!content) {
    throw new HttpError(400, "Message content is required");
  }

  const { data: booking, error: bookingError } = await adminClient
    .from("bookings")
    .select("id, status, user_id, property:properties(host_id)")
    .eq("id", payload.bookingId)
    .single();

  if (bookingError || !booking) {
    throw new HttpError(404, "Booking not found");
  }

  if (booking.status !== "confirmed" && booking.status !== "completed") {
    throw new HttpError(409, "Messages are only available for confirmed bookings");
  }

  if (booking.user_id !== user.id && booking.property?.host_id !== user.id) {
    throw new HttpError(403, "You do not have access to this conversation");
  }

  const { data, error } = await adminClient
    .from("messages")
    .insert({
      booking_id: payload.bookingId,
      sender_id: user.id,
      content,
    })
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, "Failed to send message", error);
  }

  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { action, payload } = await readActionBody(req);
    switch (action) {
      case "listGuestBookings":
        return json(await listGuestBookings(req));
      case "listHostBookings":
        return json(await listHostBookings(req, payload));
      case "blockDates":
        return json(await blockDates(req, payload));
      case "updateBookingStatus":
        return json(await updateBookingStatus(req, payload));
      case "listMessages":
        return json(await listMessages(req, payload));
      case "sendMessage":
        return json(await sendMessage(req, payload));
      default:
        throw new HttpError(404, `Unsupported action: ${action}`);
    }
  } catch (error) {
    return errorResponse(error);
  }
});
