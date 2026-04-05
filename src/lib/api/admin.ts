import { invokeAction } from "@/lib/api/client";
import type {
  AdminSettingsRecord,
  BookingRecord,
  HostProfile,
  PropertyRecord,
  ReferralRecord,
  RewardCompletionRecord,
  VerificationDocumentAsset,
} from "@/lib/api/types";

export const adminApi = {
  getOverview: () =>
    invokeAction<
      Record<string, never>,
      {
        users: number;
        listings: number;
        bookings: number;
        reviews: number;
        pendingReviews: number;
      }
    >("admin-api", "getOverview", {}),

  approveVerification: (payload: { userId: string }) =>
    invokeAction<typeof payload, HostProfile>("admin-api", "approveVerification", payload),

  rejectVerification: (payload: { userId: string }) =>
    invokeAction<typeof payload, HostProfile>("admin-api", "rejectVerification", payload),

  editBooking: (payload: {
    bookingId: string;
    patch: Record<string, unknown>;
    delete?: boolean;
  }) => invokeAction<typeof payload, BookingRecord | { success: true }>("admin-api", "editBooking", payload),

  sendNotification: (payload: {
    userId?: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
    broadcast?: boolean;
  }) => invokeAction<typeof payload, { count: number }>("admin-api", "sendNotification", payload),

  updateSettings: (payload: { patch: Record<string, unknown> }) =>
    invokeAction<typeof payload, Record<string, unknown>>("admin-api", "updateSettings", payload),

  getSettings: () =>
    invokeAction<Record<string, never>, AdminSettingsRecord>("admin-api", "getSettings", {}),

  listUsers: (payload: { page?: number; pageSize?: number } = {}) =>
    invokeAction<typeof payload, HostProfile[]>("admin-api", "listUsers", payload),

  updateUser: (payload: { userId: string; patch: Record<string, unknown> }) =>
    invokeAction<typeof payload, HostProfile>("admin-api", "updateUser", payload),

  listListings: (payload: { limit?: number; approvalStatus?: string } = {}) =>
    invokeAction<typeof payload, PropertyRecord[]>("admin-api", "listListings", payload),

  listBookings: (payload: { page?: number; pageSize?: number; status?: string } = {}) =>
    invokeAction<typeof payload, BookingRecord[]>("admin-api", "listBookings", payload),

  getVerificationDocumentUrls: (payload: { userId: string }) =>
    invokeAction<typeof payload, Record<string, VerificationDocumentAsset>>(
      "admin-api",
      "getVerificationDocumentUrls",
      payload,
    ),

  markNotificationRead: (payload: { notificationId: string }) =>
    invokeAction<typeof payload, { success: true }>("admin-api", "markNotificationRead", payload),

  markAllNotificationsRead: () =>
    invokeAction<Record<string, never>, { success: true }>("admin-api", "markAllNotificationsRead", {}),

  deleteNotification: (payload: { notificationId: string }) =>
    invokeAction<typeof payload, { success: true }>("admin-api", "deleteNotification", payload),

  listNotificationRecipients: (payload: { limit?: number } = {}) =>
    invokeAction<typeof payload, HostProfile[]>("admin-api", "listNotificationRecipients", payload),

  listReferrals: (payload: {
    host?: boolean;
    page?: number;
    pageSize?: number;
    status?: "pending" | "confirmed" | "rewarded";
  }) => invokeAction<typeof payload, ReferralRecord[]>("admin-api", "listReferrals", payload),

  createReferral: (payload: { host?: boolean; referrerEmail: string; refereeEmail: string }) =>
    invokeAction<typeof payload, ReferralRecord>("admin-api", "createReferral", payload),

  updateReferral: (payload: {
    host?: boolean;
    referralId: string;
    status: "pending" | "confirmed" | "rewarded";
  }) => invokeAction<typeof payload, ReferralRecord>("admin-api", "updateReferral", payload),

  deleteReferrals: (payload: { host?: boolean; referralIds: string[] }) =>
    invokeAction<typeof payload, { success: true; count: number }>("admin-api", "deleteReferrals", payload),

  listRewards: (payload: {
    page?: number;
    pageSize?: number;
    rewardCode?: string;
  }) => invokeAction<typeof payload, RewardCompletionRecord[]>("admin-api", "listRewards", payload),

  awardReward: (payload: {
    userEmail: string;
    rewardCode: "coastal_explorer" | "photo_finisher";
  }) => invokeAction<typeof payload, RewardCompletionRecord>("admin-api", "awardReward", payload),

  deleteRewards: (payload: { rewardIds: string[] }) =>
    invokeAction<typeof payload, { success: true; count: number }>("admin-api", "deleteRewards", payload),
};
