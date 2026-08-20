// Where a tyre sits on the truck. Shared so the compliance record and the
// completion inspection cannot drift into two different vocabularies for the
// same wheel — a mismatch would make the two records impossible to line up.
export const TYRE_POSITIONS = [
   "Front Left (1)",
   "Front Right (2)",
   "1st Axle Left Inner (3)",
   "1st Axle Right Inner (4)",
   "1st Axle Left Outer (5)",
   "1st Axle Right Outer (6)",
   "2nd Axle Left Inner (7)",
   "2nd Axle Right Inner (8)",
   "2nd Axle Left Outer (9)",
   "2nd Axle Right Outer (10)",
   "3rd Axle Left Inner (11)",
   "3rd Axle Right Inner (12)",
   "3rd Axle Left Outer (13)",
   "3rd Axle Right Outer (14)",
   "4th Axle Left Inner (15)",
   "4th Axle Right Inner (16)",
   "4th Axle Left Outer (17)",
   "4th Axle Right Outer (18)",
   "5th Axle Left Inner (19)",
   "5th Axle Right Inner (20)",
   "5th Axle Left Outer (21)",
   "5th Axle Right Outer (22)",
   "Spare Tyre (23)",
] as const;

/** Best first, matching the order these have always been offered in. */
export const TYRE_CONDITIONS = ["Excellent", "Good", "Fair", "Poor — Replace"] as const;
