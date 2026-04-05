import { corsHeaders, errorResponse, json, readActionBody, HttpError } from "../_shared/http.ts";
import { createServiceClient, requireAdmin, requireUser } from "../_shared/supabase.ts";

type SaveHostListingPayload = {
  id?: string;
  title: string;
  description: string;
  location: string;
  province?: string | null;
  price: number;
  type: string;
  amenities?: string[];
  guests: number;
  bedrooms: number;
  bathrooms: number;
  image?: string | null;
  images?: string[];
  video_url?: string | null;
  latitude?: number;
  longitude?: number;
  categories?: string[];
};

async function listPublic(payload: { from?: number; to?: number }) {
  const adminClient = createServiceClient();
  const from = payload.from ?? 0;
  const to = payload.to ?? 11;

  const { data, error } = await adminClient
    .from("properties")
    .select(`
      *,
      host:profiles!properties_host_id_fkey(full_name, avatar_url, created_at, host_plan)
    `)
    .eq("approval_status", "approved")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new HttpError(500, "Failed to load public properties", error);
  }

  return data ?? [];
}

async function getPublic(payload: { propertyId: string }) {
  const adminClient = createServiceClient();
  const { data, error } = await adminClient
    .from("properties")
    .select(`
      *,
      host:profiles!properties_host_id_fkey(full_name, avatar_url, created_at, host_plan)
    `)
    .eq("id", payload.propertyId)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "Failed to load property", error);
  }

  return data ?? null;
}

async function getAvailability(payload: {
  propertyId?: string;
  propertyIds?: string[];
  from?: string;
  to?: string;
}) {
  const adminClient = createServiceClient();
  let query = adminClient
    .from("bookings")
    .select("property_id, check_in, check_out, status")
    .in("status", ["pending", "confirmed", "completed", "blocked"]);

  if (payload.propertyId) {
    query = query.eq("property_id", payload.propertyId);
  }

  if (payload.propertyIds?.length) {
    query = query.in("property_id", payload.propertyIds);
  }

  if (payload.from) {
    query = query.gte("check_out", payload.from);
  }

  if (payload.to) {
    query = query.lte("check_in", payload.to);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, "Failed to load availability", error);
  }

  return data ?? [];
}

async function listHost(req: Request) {
  const { user, adminClient } = await requireUser(req);
  const { data, error } = await adminClient
    .from("properties")
    .select("*")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new HttpError(500, "Failed to load host listings", error);
  }

  return data ?? [];
}

async function saveHostListing(req: Request, payload: SaveHostListingPayload) {
  const { user, adminClient } = await requireUser(req);
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("host_plan, verification_status")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new HttpError(500, "Failed to load host profile", profileError);
  }

  if (profile.verification_status !== "verified") {
    throw new HttpError(403, "Host verification is required before publishing listings");
  }

  if (!payload.id && profile.host_plan === "free") {
    const { count, error: countError } = await adminClient
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("host_id", user.id);

    if (countError) {
      throw new HttpError(500, "Failed to validate listing limits", countError);
    }

    if ((count ?? 0) >= 1) {
      throw new HttpError(403, "Free plan hosts can only create one listing");
    }
  }

  const mutation = {
    title: payload.title,
    description: payload.description,
    location: payload.location,
    province: payload.province ?? null,
    price: payload.price,
    type: payload.type,
    amenities: payload.amenities ?? [],
    guests: payload.guests,
    bedrooms: payload.bedrooms,
    bathrooms: payload.bathrooms,
    image: payload.image ?? null,
    images: payload.images ?? [],
    video_url: payload.video_url ?? null,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    categories: payload.categories ?? [],
    host_id: user.id,
    approval_status: "pending",
  };

  if (payload.id) {
    const { data, error } = await adminClient
      .from("properties")
      .update(mutation)
      .eq("id", payload.id)
      .eq("host_id", user.id)
      .select("*")
      .single();

    if (error) {
      throw new HttpError(500, "Failed to update listing", error);
    }

    return data;
  }

  const { data, error } = await adminClient
    .from("properties")
    .insert(mutation)
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, "Failed to create listing", error);
  }

  return data;
}

async function deleteHostListing(req: Request, payload: { propertyId: string }) {
  const { user, adminClient } = await requireUser(req);
  const today = new Date().toISOString().slice(0, 10);
  const { data: activeBookings, error: bookingError } = await adminClient
    .from("bookings")
    .select("id")
    .eq("property_id", payload.propertyId)
    .gte("check_out", today)
    .in("status", ["pending", "confirmed", "completed"]);

  if (bookingError) {
    throw new HttpError(500, "Failed to validate listing bookings", bookingError);
  }

  if (activeBookings && activeBookings.length > 0) {
    throw new HttpError(409, "Cannot delete a listing with active or upcoming bookings");
  }

  const { error } = await adminClient
    .from("properties")
    .delete()
    .eq("id", payload.propertyId)
    .eq("host_id", user.id);

  if (error) {
    throw new HttpError(500, "Failed to delete listing", error);
  }

  return { success: true };
}

async function moderateListing(req: Request, payload: {
  propertyId: string;
  update: Record<string, unknown>;
  delete?: boolean;
}) {
  const { user, adminClient } = await requireUser(req);
  await requireAdmin(adminClient, user.id);

  if (payload.delete) {
    const { error } = await adminClient.from("properties").delete().eq("id", payload.propertyId);
    if (error) {
      throw new HttpError(500, "Failed to delete listing", error);
    }

    return { success: true };
  }

  const { data, error } = await adminClient
    .from("properties")
    .update(payload.update)
    .eq("id", payload.propertyId)
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, "Failed to moderate listing", error);
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
      case "listPublic":
        return json(await listPublic(payload));
      case "getPublic":
        return json(await getPublic(payload));
      case "getAvailability":
        return json(await getAvailability(payload));
      case "listHost":
        return json(await listHost(req));
      case "saveHostListing":
        return json(await saveHostListing(req, payload));
      case "deleteHostListing":
        return json(await deleteHostListing(req, payload));
      case "moderateListing":
        return json(await moderateListing(req, payload));
      default:
        throw new HttpError(404, `Unsupported action: ${action}`);
    }
  } catch (error) {
    return errorResponse(error);
  }
});
