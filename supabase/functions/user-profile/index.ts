import { empty, json } from "../_shared/cors.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import { isNonEmptyString } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return empty(req);
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const { user } = await requireUser(req);
    const admin = createAdminClient();
    const body = await req.json();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (isNonEmptyString(body.fullName)) updates.full_name = body.fullName.trim();
    if (typeof body.avatarUrl === "string") updates.avatar_url = body.avatarUrl.trim();
    if (typeof body.phone === "string") updates.phone = body.phone.trim();
    if (typeof body.bio === "string") updates.bio = body.bio.trim();
    if (body.preferences && typeof body.preferences === "object") updates.preferences = body.preferences;

    const { error } = await admin
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        ...updates,
      });

    if (error) throw error;
    return json(req, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json(req, { error: message }, message === "Unauthorized" ? 401 : 400);
  }
});
