import { supabase } from "@/lib/supabase";
import type { ApiFailure, ApiResponse } from "@/lib/api/types";

function isFailure<T>(value: ApiResponse<T>): value is ApiFailure {
  return typeof value === "object" && value !== null && "error" in value;
}

export async function invokeAction<TPayload, TResult>(
  functionName: string,
  action: string,
  payload: TPayload,
): Promise<TResult> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: { action, payload },
  });

  if (error) {
    throw new Error(error.message || `Failed to invoke ${functionName}.${action}`);
  }

  const response = data as ApiResponse<TResult>;
  if (isFailure(response)) {
    throw new Error(response.error || `Failed to invoke ${functionName}.${action}`);
  }

  return response.data;
}
