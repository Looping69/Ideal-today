import { empty, json } from "../_shared/cors.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import { auditListing, generateHolidayChat, generateSocialPost } from "../_shared/content.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return empty(req);
  }

  if (req.method !== "POST") {
    return json(req, { error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const action = body?.action;
    const admin = createAdminClient();

    if (action === "chat") {
      const reply = await generateHolidayChat(body.messages || []);
      return json(req, { message: reply });
    }

    const { user } = await requireUser(req);

    if (action === "generate-social-post") {
      const result = await generateSocialPost(body);
      await admin.from("content_generations").insert({
        user_id: user.id,
        action,
        request_payload: body,
        response_payload: result,
      });
      return json(req, result);
    }

    if (action === "audit-listing") {
      const result = await auditListing(body);
      await admin.from("content_generations").insert({
        user_id: user.id,
        action,
        request_payload: body,
        response_payload: result,
      });
      return json(req, result);
    }

    return json(req, { error: "Unsupported action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : 400;
    return json(req, { error: message }, status);
  }
});
