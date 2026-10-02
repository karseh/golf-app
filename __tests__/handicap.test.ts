import { calculateCourseHandicap, getStrokesGivenForHole, calculateNetScore } from '../src/engine/handicap';

describe('USGA Handicap Engine', () => {
  test('calculates Course Handicap correctly for standard index', () => {
    // Index 14.2 on Slope 135, Rating 74.3, Par 72
    // Unadjusted = (14.2 * 135 / 113) + (74.3 - 72) = 16.96 + 2.3 = 19.26 -> Rounds to 19
    const ch = calculateCourseHandicap(14.2, 135, 74.3, 72, 1.0);
    expect(ch).toBe(19);
  });

  test('calculates Course Handicap with 90% allowance', () => {
    // 19 CH * 0.9 = 17.1 -> Rounds to 17
    const ch = calculateCourseHandicap(14.2, 135, 74.3, 72, 0.9);
    expect(ch).toBe(17);
  });

  test('handles Plus Handicaps (+2.0 index)', () => {
    // Index -2.0 on Slope 120, Rating 70.0, Par 72
    // Unadjusted = (-2.0 * 120 / 113) + (70.0 - 72) = -2.12 + (-2) = -4.12 -> Rounds to -4
    const ch = calculateCourseHandicap(-2.0, 120, 70.0, 72, 1.0);
    expect(ch).toBe(-4);
  });

  test('allocates net strokes per hole index correctly for 14 Course Handicap', () => {
    const ch = 14;
    // Should get 1 stroke on hole handicap indexes 1 through 14
    expect(getStrokesGivenForHole(ch, 1)).toBe(1);
    expect(getStrokesGivenForHole(ch, 14)).toBe(1);
    // Should get 0 strokes on hole handicap indexes 15 through 18
    expect(getStrokesGivenForHole(ch, 15)).toBe(0);
    expect(getStrokesGivenForHole(ch, 18)).toBe(0);
  });

  test('allocates net strokes for high handicapper (CH = 22)', () => {
    const ch = 22;
    // 22 % 18 = 4 -> gets 2 strokes on hole indexes 1..4
    expect(getStrokesGivenForHole(ch, 1)).toBe(2);
    expect(getStrokesGivenForHole(ch, 4)).toBe(2);
    // gets 1 stroke on hole indexes 5..18
    expect(getStrokesGivenForHole(ch, 5)).toBe(1);
    expect(getStrokesGivenForHole(ch, 18)).toBe(1);
  });

  test('calculates net score correctly', () => {
    expect(calculateNetScore(5, 1)).toBe(4); // Par 4, gross 5, 1 stroke given -> net 4
    expect(calculateNetScore(4, 0)).toBe(4);
  });
});
