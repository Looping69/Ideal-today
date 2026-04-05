import { createClient } from "npm:@supabase/supabase-js@2.57.4";

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function createAdminClient() {
  return createClient(getEnv("SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createUserClient(req: Request) {
  return createClient(getEnv("SUPABASE_URL"), getEnv("SUPABASE_ANON_KEY"), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });
}

export async function requireUser(req: Request) {
  const client = createUserClient(req);
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error("Unauthorized");
  }

  return { client, user: data.user };
}

export async function requireAdmin(req: Request) {
  const { user } = await requireUser(req);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !data?.is_admin) {
    throw new Error("Forbidden");
  }

  return { admin, user };
}
