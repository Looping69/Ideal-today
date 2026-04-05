import { invokeAction } from "@/lib/api/client";
import type { BookingRecord, BookingStatus, MessageRecord } from "@/lib/api/types";

export const bookingsApi = {
  listGuestBookings: () =>
    invokeAction<Record<string, never>, BookingRecord[]>("bookings-api", "listGuestBookings", {}),

  listHostBookings: (payload: { propertyId?: string; includeBlocked?: boolean } = {}) =>
    invokeAction<typeof payload, BookingRecord[]>("bookings-api", "listHostBookings", payload),

  blockDates: (payload: { propertyId: string; from: string; to: string }) =>
    invokeAction<typeof payload, BookingRecord>("bookings-api", "blockDates", payload),

  updateBookingStatus: (payload: { bookingId: string; status: BookingStatus }) =>
    invokeAction<typeof payload, BookingRecord>("bookings-api", "updateBookingStatus", payload),

  listMessages: (payload: { bookingId: string }) =>
    invokeAction<typeof payload, MessageRecord[]>("bookings-api", "listMessages", payload),

  sendMessage: (payload: { bookingId: string; content: string }) =>
    invokeAction<typeof payload, MessageRecord>("bookings-api", "sendMessage", payload),
};
