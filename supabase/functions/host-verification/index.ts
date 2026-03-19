import { empty, json } from "../_shared/cors.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import { assert, isNonEmptyString } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return empty(req);
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const { user } = await requireUser(req);
    const admin = createAdminClient();
    const body = await req.json();

    assert(isNonEmptyString(body.fullName), "Full name is required");
    assert(isNonEmptyString(body.phone), "Phone is required");
    assert(isNonEmptyString(body.bio), "Bio is required");
    assert(isNonEmptyString(body.businessAddress), "Business address is required");
    assert(isNonEmptyString(body.documents?.id_front), "ID front document is required");
    assert(isNonEmptyString(body.documents?.id_back), "ID back document is required");
    assert(isNonEmptyString(body.documents?.selfie), "Selfie document is required");

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        full_name: body.fullName.trim(),
        phone: body.phone.trim(),
        bio: body.bio.trim(),
        business_address: body.businessAddress.trim(),
        verification_status: "pending",
        verification_docs: body.documents,
        verification_submitted_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    const { data: admins, error: adminsError } = await admin
      .from("profiles")
      .select("id")
      .eq("is_admin", true);

    if (adminsError) throw adminsError;

    if (admins?.length) {
      const notifications = admins.map((adminProfile) => ({
        user_id: adminProfile.id,
        title: "New Host Verification",
        message: `${body.fullName.trim()} submitted host verification documents.`,
        type: "system",
        link: "/admin/users",
      }));

      const { error: notificationsError } = await admin.from("notifications").insert(notifications);
      if (notificationsError) throw notificationsError;
    }

    return json(req, { status: "pending" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : 400;
    return json(req, { error: message }, status);
  }
});
