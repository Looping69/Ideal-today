import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2.45.6";
import { HttpError } from "./http.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error("Missing Supabase environment variables for edge functions");
}

export function createServiceClient() {
  return createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createAuthedClient(authHeader: string) {
  return createClient(supabaseUrl!, anonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

export async function requireUser(req: Request): Promise<{
  user: User;
  authHeader: string;
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing bearer token");
  }

  const token = authHeader.slice("Bearer ".length);
  const adminClient = createServiceClient();
  const { data, error } = await adminClient.auth.getUser(token);

  if (error || !data.user) {
    throw new HttpError(401, "Invalid or expired session");
  }

  return {
    user: data.user,
    authHeader,
    adminClient,
    userClient: createAuthedClient(authHeader),
  };
}

export async function requireAdmin(adminClient: SupabaseClient, userId: string) {
  const { data, error } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (error || !data?.is_admin) {
    throw new HttpError(403, "Admin access required");
  }
}

export async function getProfile(adminClient: SupabaseClient, userId: string) {
  const { data, error } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new HttpError(500, "Failed to load profile", error);
  }

  return data;
}
