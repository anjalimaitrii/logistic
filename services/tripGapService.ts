import { fetchApi } from "./api";

export const tripGapService = {
  forBooking: (bookingId: string) =>
    fetchApi(`/api/trip-gaps?bookingId=${encodeURIComponent(bookingId)}`),

  /** Every unattributed gap — one request for the accountant list badges. */
  unattributed: () => fetchApi(`/api/trip-gaps?status=unattributed`),

  claim: (
    gapId: string,
    body: { bookingId: string; side: "append" | "prepend"; km: number; claimedBy?: string }
  ) => fetchApi(`/api/trip-gaps/${gapId}/claim`, { method: "POST", body: JSON.stringify(body) }),

  release: (gapId: string, bookingId: string) =>
    fetchApi(`/api/trip-gaps/${gapId}/release`, { method: "POST", body: JSON.stringify({ bookingId }) }),
};
