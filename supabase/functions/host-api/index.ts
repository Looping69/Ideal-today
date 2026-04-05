import { corsHeaders, errorResponse, json, readActionBody, HttpError } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

async function getDashboard(req: Request) {
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
    return { propertyCount: 0, bookingCount: 0, reviewCount: 0, averageRating: 0 };
  }

  const [bookingsResult, reviewsResult, ratingsResult] = await Promise.all([
    adminClient.from("bookings").select("id", { count: "exact", head: true }).in("property_id", propertyIds),
    adminClient.from("reviews").select("id", { count: "exact", head: true }).in("property_id", propertyIds),
    adminClient.from("reviews").select("rating").in("property_id", propertyIds).eq("status", "approved"),
  ]);

  if (bookingsResult.error || reviewsResult.error || ratingsResult.error) {
    throw new HttpError(500, "Failed to load host dashboard");
  }

  const ratings = ratingsResult.data ?? [];
  const averageRating = ratings.length
    ? ratings.reduce((sum, review) => sum + Number(review.rating), 0) / ratings.length
    : 0;

  return {
    propertyCount: propertyIds.length,
    bookingCount: bookingsResult.count ?? 0,
    reviewCount: reviewsResult.count ?? 0,
    averageRating,
  };
}

async function getProfile(req: Request) {
  const { user, adminClient } = await requireUser(req);
  const { data, error } = await adminClient.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) {
    throw new HttpError(500, "Failed to load host profile", error);
  }

  if (!data) {
    const { data: inserted, error: insertError } = await adminClient
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      })
      .select("*")
      .single();

    if (insertError) {
      throw new HttpError(500, "Failed to initialize host profile", insertError);
    }

    return inserted;
  }

  return data;
}

async function updateProfile(req: Request, payload: Record<string, unknown>) {
  const { user, adminClient } = await requireUser(req);
  const patch = {
    full_name: payload.full_name ?? null,
    avatar_url: payload.avatar_url ?? null,
    phone: payload.phone ?? null,
    bio: payload.bio ?? null,
    preferences: payload.preferences ?? null,
    business_address: payload.business_address ?? null,
    email: user.email,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: user.id,
        ...patch,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new HttpError(500, "Failed to update host profile", error);
  }

  return data;
}

async function getVerificationStatus(req: Request) {
  const { user, adminClient } = await requireUser(req);
  const { data, error } = await adminClient
    .from("profiles")
    .select("verification_status, verification_docs, verification_submitted_at")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new HttpError(500, "Failed to load verification status", error);
  }

  const documents = data.verification_docs
    ? Object.fromEntries(
        await Promise.all(
          Object.entries(data.verification_docs as Record<string, string>).map(async ([key, path]) => {
            const signed = await adminClient.storage.from("verification").createSignedUrl(path, 60 * 15);
            if (signed.error) {
              throw new HttpError(500, "Failed to create verification preview URL", signed.error);
            }

            return [key, { path, url: signed.data.signedUrl }];
          }),
        ),
      )
    : null;

  return {
    status: data.verification_status,
    submittedAt: data.verification_submitted_at,
    documents,
  };
}

async function getVerificationUploadUrl(req: Request, payload: { fileName: string; contentType: string }) {
  const { user, adminClient } = await requireUser(req);
  const extension = payload.fileName.includes(".")
    ? payload.fileName.split(".").pop()
    : "bin";
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

  const upload = await adminClient.storage.from("verification").createSignedUploadUrl(path);
  if (upload.error) {
    throw new HttpError(500, "Failed to create signed upload URL", upload.error);
  }

  const preview = await adminClient.storage.from("verification").createSignedUrl(path, 60 * 15);
  if (preview.error) {
    throw new HttpError(500, "Failed to create signed preview URL", preview.error);
  }

  return {
    bucket: "verification",
    path,
    token: upload.data.token,
    signedUrl: preview.data.signedUrl,
  };
}

async function submitVerification(req: Request, payload: {
  full_name: string;
  phone: string;
  bio: string;
  business_address: string;
  documents: Record<string, string>;
}) {
  const { user, adminClient } = await requireUser(req);
  const documents = payload.documents ?? {};
  const requiredKeys = ["id_front", "id_back", "selfie"];

  for (const key of requiredKeys) {
    const path = documents[key];
    if (!path || !path.startsWith(`${user.id}/`)) {
      throw new HttpError(400, `Missing or invalid verification document: ${key}`);
    }
  }

  const { error } = await adminClient
    .from("profiles")
    .update({
      full_name: payload.full_name,
      phone: payload.phone,
      bio: payload.bio,
      business_address: payload.business_address,
      verification_status: "pending",
      verification_docs: documents,
      verification_submitted_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    throw new HttpError(500, "Failed to submit verification", error);
  }

  const { data: admins, error: adminsError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("is_admin", true);

  if (adminsError) {
    throw new HttpError(500, "Failed to load admins for notification", adminsError);
  }

  if (admins && admins.length > 0) {
    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      title: "New Host Verification",
      message: `${payload.full_name} submitted host verification documents.`,
      type: "system",
      link: "/admin/users",
    }));

    const { error: notificationsError } = await adminClient.from("notifications").insert(notifications);
    if (notificationsError) {
      throw new HttpError(500, "Failed to notify admins", notificationsError);
    }
  }

  return { status: "pending" };
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { action, payload } = await readActionBody(req);
    switch (action) {
      case "getDashboard":
        return json(await getDashboard(req));
      case "getProfile":
        return json(await getProfile(req));
      case "updateProfile":
        return json(await updateProfile(req, payload));
      case "getVerificationStatus":
        return json(await getVerificationStatus(req));
      case "submitVerification":
        return json(await submitVerification(req, payload));
      case "getVerificationUploadUrl":
        return json(await getVerificationUploadUrl(req, payload));
      case "listHostBookings":
        return json(await listHostBookings(req, payload));
      default:
        throw new HttpError(404, `Unsupported action: ${action}`);
    }
  } catch (error) {
    return errorResponse(error);
  }
});
