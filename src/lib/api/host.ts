import { invokeAction } from "@/lib/api/client";
import type {
  BookingRecord,
  HostProfile,
  VerificationDocumentAsset,
  VerificationStatus,
} from "@/lib/api/types";

export const hostApi = {
  getDashboard: () =>
    invokeAction<
      Record<string, never>,
      {
        propertyCount: number;
        bookingCount: number;
        reviewCount: number;
        averageRating: number;
      }
    >("host-api", "getDashboard", {}),

  getProfile: () => invokeAction<Record<string, never>, HostProfile>("host-api", "getProfile", {}),

  updateProfile: (payload: {
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    bio?: string;
    preferences?: Record<string, unknown>;
    business_address?: string;
  }) => invokeAction<typeof payload, HostProfile>("host-api", "updateProfile", payload),

  getVerificationStatus: () =>
    invokeAction<
      Record<string, never>,
      {
        status: VerificationStatus;
        submittedAt?: string | null;
        documents: Record<string, VerificationDocumentAsset> | null;
      }
    >("host-api", "getVerificationStatus", {}),

  submitVerification: (payload: {
    full_name: string;
    phone: string;
    bio: string;
    business_address: string;
    documents: Record<string, string>;
  }) =>
    invokeAction<typeof payload, { status: VerificationStatus }>("host-api", "submitVerification", payload),

  getVerificationUploadUrl: (payload: { fileName: string; contentType: string }) =>
    invokeAction<
      typeof payload,
      { bucket: string; path: string; token: string; signedUrl: string }
    >("host-api", "getVerificationUploadUrl", payload),

  listHostBookings: (payload: { propertyId?: string; includeBlocked?: boolean } = {}) =>
    invokeAction<typeof payload, BookingRecord[]>("host-api", "listHostBookings", payload),
};
