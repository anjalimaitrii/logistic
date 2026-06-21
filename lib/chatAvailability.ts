// Single source of truth for when trip chat is available.
// Chat is open only while the deal is still "Active" — i.e. NOT yet finalized.
// Once a price is finalized (finalAmount is set, or the status has moved to
// finalized/paid/transit/delivered/completed), chat closes. This mirrors the
// requests-page logic and is kept here so every page behaves the same.
export function canChatForTrip(booking: any): boolean {
  const s = (booking?.status || "").toLowerCase();
  const finalized = (booking?.finalAmount || 0) > 0
    || ["finalized", "paid", "transit", "delivered", "completed"].includes(s);
  return !finalized;
}
