import { invokeAction } from "@/lib/api/client";
import type { AvailabilityEntry, PropertyRecord } from "@/lib/api/types";

export const propertiesApi = {
  listPublic: (payload: {
    from?: number;
    to?: number;
  } = {}) => invokeAction<typeof payload, PropertyRecord[]>("properties-api", "listPublic", payload),

  getPublic: (payload: { propertyId: string }) =>
    invokeAction<typeof payload, PropertyRecord | null>("properties-api", "getPublic", payload),

  getAvailability: (payload: {
    propertyId?: string;
    propertyIds?: string[];
    from?: string;
    to?: string;
  }) =>
    invokeAction<typeof payload, AvailabilityEntry[]>("properties-api", "getAvailability", payload),

  listHost: () => invokeAction<Record<string, never>, PropertyRecord[]>("properties-api", "listHost", {}),

  saveHostListing: (payload: {
    id?: string;
    title: string;
    description: string;
    location: string;
    province?: string | null;
    price: number;
    type: string;
    amenities: string[];
    guests: number;
    bedrooms: number;
    bathrooms: number;
    image?: string | null;
    images?: string[];
    video_url?: string | null;
    latitude?: number;
    longitude?: number;
    categories?: string[];
  }) =>
    invokeAction<typeof payload, PropertyRecord>("properties-api", "saveHostListing", payload),

  deleteHostListing: (payload: { propertyId: string }) =>
    invokeAction<typeof payload, { success: true }>("properties-api", "deleteHostListing", payload),

  moderateListing: (payload: {
    propertyId: string;
    update: Record<string, unknown>;
    delete?: boolean;
  }) =>
    invokeAction<typeof payload, PropertyRecord | { success: true }>("properties-api", "moderateListing", payload),
};
