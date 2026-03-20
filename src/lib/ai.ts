export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string };
export type SocialPlatform = "instagram" | "facebook" | "twitter" | "linkedin";

export interface SocialPostRequest {
  propertyTitle: string;
  description: string;
  location: string;
  price: number;
  amenities: string[];
  platform: SocialPlatform;
}

export interface SocialPostResponse {
  hook: string;
  body: string;
  callToAction: string;
  hashtags: string[];
}

export interface ListingAuditRequest {
  title: string;
  description: string;
  price: number;
  amenities: string[];
  imagesCount: number;
}

export interface ListingAuditResponse {
  score: number;
  strengths: string[];
  weaknesses: string[];
  actionableAdvice: string[];
}

import { supabase } from "@/lib/supabase";

export async function chat(messages: AIMessage[]): Promise<AIMessage> {
  const { data, error } = await supabase.functions.invoke("content-engine", {
    body: {
      action: "chat",
      messages,
    },
  });

  if (error) {
    return { role: 'assistant', content: 'Sorry, I could not reach the AI service. Try again in a moment.' };
  }

  const reply = (data?.message || '').toString();
  return { role: 'assistant', content: reply || 'Okay.' };
}

export async function generateSocialPost(input: SocialPostRequest): Promise<SocialPostResponse> {
  const { data, error } = await supabase.functions.invoke("content-engine", {
    body: {
      action: "generate-social-post",
      ...input,
    },
  });

  if (error) {
    throw error;
  }

  return data as SocialPostResponse;
}

export async function auditListing(input: ListingAuditRequest): Promise<ListingAuditResponse> {
  const { data, error } = await supabase.functions.invoke("content-engine", {
    body: {
      action: "audit-listing",
      ...input,
    },
  });

  if (error) {
    throw error;
  }

  return data as ListingAuditResponse;
}
