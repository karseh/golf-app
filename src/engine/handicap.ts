/**
 * USGA Handicap Calculation Engine
 */

/**
 * Calculates a golfer's Course Handicap for a specific tee box using the official USGA WHS Formula:
 * Course Handicap = Round((Handicap Index * (Slope Rating / 113)) + (Course Rating - Par)) * Allowance %
 *
 * @param handicapIndex Golfer's Handicap Index (e.g. 14.2; use negative for plus handicaps e.g. -2.1 for +2.1)
 * @param slopeRating Course Slope Rating (e.g. 135)
 * @param courseRating Course Rating (e.g. 74.3)
 * @param par Course Par (e.g. 72)
 * @param allowancePct Game Handicap Allowance percentage (default 1.0 = 100%)
 */
export function calculateCourseHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  par: number,
  allowancePct: number = 1.0
): number {
  const unadjustedCH = (handicapIndex * (slopeRating / 113)) + (courseRating - par);
  const roundedCH = Math.round(unadjustedCH);
  const finalCH = Math.round(roundedCH * allowancePct);
  return finalCH;
}

/**
 * Calculates how many net handicap strokes a player receives (or owes) on a specific hole based on hole handicap index (1-18).
 *
 * @param courseHandicap Golfer's total Course Handicap for the round
 * @param holeHandicapIndex The handicap ranking of the hole (1 = hardest hole on course, 18 = easiest)
 */
export function getStrokesGivenForHole(
  courseHandicap: number,
  holeHandicapIndex: number
): number {
  if (courseHandicap >= 0) {
    // Standard handicap >= 0
    const baseStrokes = Math.floor(courseHandicap / 18);
    const extraStrokesThreshold = courseHandicap % 18;
    return holeHandicapIndex <= extraStrokesThreshold ? baseStrokes + 1 : baseStrokes;
  } else {
    // Plus handicap < 0 (e.g., -2 Course Handicap)
    // Plus handicappers give strokes back on the easiest holes (handicap index 18 down)
    const plusStrokes = Math.abs(courseHandicap);
    const baseStrokesGivenBack = Math.floor(plusStrokes / 18);
    const threshold = 18 - (plusStrokes % 18);
    return holeHandicapIndex > threshold ? -(baseStrokesGivenBack + 1) : -baseStrokesGivenBack;
  }
}

/**
 * Calculates net score for a hole given gross score and strokes given.
 */
export function calculateNetScore(grossScore: number, strokesGiven: number): number {
  return grossScore - strokesGiven;
}
