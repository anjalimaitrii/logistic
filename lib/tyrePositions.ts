// Where a tyre sits on the truck. Shared so the compliance record and the
// completion inspection cannot drift into two different vocabularies for the
// same wheel — a mismatch would make the two records impossible to line up.
//
// Named exactly as the company's tyre inspection sheet names them: the horse
// (front pair + two diff axles), the trailer (three axles), two spares. The old
// list counted axles 1st–5th straight through the rig, so its "1st Axle" was the
// horse's first diff while the sheet's "1st Axle" is the trailer's — the same
// words for a different wheel. Stored records were renamed by the backend's
// migrateTyrePositions script; keep its lib/tyrePositionMap list in step.
export const TYRE_POSITION_GROUPS = [
   {
      group: "Horse",
      positions: [
         "Left Front (1)",
         "1st Diff Left Out (2)",
         "1st Diff Left In (3)",
         "2nd Diff Left Out (4)",
         "2nd Diff Left In (5)",
         "Front Right (6)",
         "1st Diff Right Out (7)",
         "1st Diff Right In (8)",
         "2nd Diff Right Out (9)",
         "2nd Diff Right In (10)",
      ],
   },
   {
      group: "Trailer",
      positions: [
         "1st Axle Left Out (11)",
         "1st Axle Left In (12)",
         "2nd Axle Left Out (13)",
         "2nd Axle Left In (14)",
         "3rd Axle Left Out (15)",
         "3rd Axle Left In (16)",
         "1st Axle Right Out (17)",
         "1st Axle Right In (18)",
         "2nd Axle Right Out (19)",
         "2nd Axle Right In (20)",
         "3rd Axle Right Out (21)",
         "3rd Axle Right In (22)",
      ],
   },
   {
      group: "Spare Tyre",
      positions: ["1st Spare (23)", "2nd Spare (24)"],
   },
] as const;

export const TYRE_POSITIONS: readonly string[] = TYRE_POSITION_GROUPS.flatMap(g => [...g.positions]);

/** Best first, matching the order these have always been offered in. */
export const TYRE_CONDITIONS = ["Excellent", "Good", "Fair", "Poor — Replace"] as const;
