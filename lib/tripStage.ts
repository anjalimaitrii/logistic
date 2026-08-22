/**
 * Where a trip is in its run, in the same terms the backend uses
 * (src/lib/tripStatus.ts). Kept in step by hand — the two must agree or a screen
 * will offer an action the server then refuses.
 *
 * The `_n` suffix appears only when a trip has more than one pickup OR more than
 * one dropoff, which is how the web panel and the driver app both build step ids.
 */
const norm = (s?: string) => (s || "").trim().toLowerCase();

/**
 * True when the truck has finished its LAST drop — all cargo is off.
 *
 * The distinction matters everywhere a screen asks "is this trip finishing?": a
 * truck emptying the first of three drops still has two loads aboard, so it can
 * neither be sent home nor handed another job.
 */
export function isLastOffloading(
  tripStatus: string | undefined,
  pickupCount: number,
  dropoffCount: number
): boolean {
  const ts = norm(tripStatus);
  const multi = pickupCount > 1 || dropoffCount > 1;
  return ts === (multi ? `offloading_${dropoffCount}` : "offloading");
}

/** Counts straight off a booking, defaulting to the single-stop shape. */
export function stopCounts(booking: any): { pickups: number; dropoffs: number } {
  return {
    pickups: booking?.pickupLocations?.length || 1,
    dropoffs: booking?.dropoffLocations?.length || 1,
  };
}
