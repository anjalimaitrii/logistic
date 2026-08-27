/**
 * Who a booking was for.
 *
 * The reference to the client account is not the answer on its own: accounts get
 * deleted, and a trip that was run for Utkarsh was still run for Utkarsh. Every
 * booking therefore carries the names as they stood when it was made, and these
 * two helpers fix the order to trust them in — the live account first, so a
 * renamed client reads under its new name, then the stamp left on the booking.
 *
 * "Direct Client" is for a booking that genuinely never had one, and nothing else.
 */
export function clientNameOf(booking: any, fallback = ""): string {
  return (booking?.clientId as any)?.name || booking?.metadata?.client || fallback;
}

export function companyNameOf(booking: any, fallback = ""): string {
  return (
    (booking?.clientId as any)?.company?.companyName ||
    booking?.metadata?.company ||
    fallback
  );
}
