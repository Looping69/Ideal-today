import { supabase } from "@/lib/supabase";

export async function invokeAdminUserAction<T = unknown>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-users", { body });
  if (error) throw error;
  return data as T;
}

export async function createCheckout<T = unknown>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("create-checkout", { body });
  if (error) throw error;
  return data as T;
}

export async function submitHostVerification<T = unknown>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("host-verification", { body });
  if (error) throw error;
  return data as T;
}

export async function saveUserProfile<T = unknown>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("user-profile", { body });
  if (error) throw error;
  return data as T;
}

export async function invokePropertiesApi<T = unknown>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("properties-api", { body });
  if (error) throw error;
  return data as T;
}

export async function invokeBookingAction<T = unknown>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("booking-actions", { body });
  if (error) throw error;
  return data as T;
}

export async function invokeEngagementAction<T = unknown>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("engagement-actions", { body });
  if (error) throw error;
  return data as T;
}
