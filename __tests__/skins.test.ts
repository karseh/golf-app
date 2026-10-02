import { calculateSkins } from '../src/engine/skins';
import { calculateSettlement } from '../src/engine/settlement';
import { BAY_AREA_COURSES } from '../src/data/bayAreaCourses';
import { MatchConfig, Golfer } from '../src/types';

describe('Skins Engine & Carryover Logic', () => {
  const course = BAY_AREA_COURSES[0];
  const selectedTee = course.teeBoxes[0];

  const golfers: Golfer[] = [
    { id: 'g1', name: 'John Smith', handicapIndex: 5.0, preferredPaymentMethod: 'VENMO', paymentHandle: 'john' },
    { id: 'g2', name: 'Mike Ross', handicapIndex: 10.0, preferredPaymentMethod: 'PAYPAL', paymentHandle: 'mike' },
    { id: 'g3', name: 'David Lee', handicapIndex: 15.0, preferredPaymentMethod: 'CASHAPP', paymentHandle: 'david' },
  ];

  it('calculates single hole skin win correctly without carryover', () => {
    // 18 hole gross scores map
    const scoresG1 = Array(18).fill(4); // John scores 4 on every hole
    const scoresG2 = Array(18).fill(5); // Mike scores 5 on every hole
    const scoresG3 = Array(18).fill(5); // David scores 5 on every hole

    const config: MatchConfig = {
      id: 'skins-test-1',
      course,
      selectedTee,
      gameFormat: 'SKINS',
      scoringMode: 'GROSS',
      handicapAllowancePct: 1.0,
      wagers: { front9: 0, back9: 0, overall18: 0 },
      skinsWager: { skinAmount: 10 },
      participants: [
        { golfer: golfers[0], courseHandicap: 5, grossScores: scoresG1 },
        { golfer: golfers[1], courseHandicap: 10, grossScores: scoresG2 },
        { golfer: golfers[2], courseHandicap: 15, grossScores: scoresG3 },
      ],
    };

    const skinsRes = calculateSkins(config);

    expect(skinsRes.totalSkinsWon).toBe(18);
    expect(skinsRes.golferSkinCounts['g1']).toBe(18);
    expect(skinsRes.golferSkinCounts['g2']).toBe(0);
    expect(skinsRes.golferSkinCounts['g3']).toBe(0);

    const settlement = calculateSettlement(config, {
      front9: { segmentName: 'Front 9', isHalved: true, scoreSummary: '' },
      back9: { segmentName: 'Back 9', isHalved: true, scoreSummary: '' },
      overall18: { segmentName: 'Overall 18', isHalved: true, scoreSummary: '' },
      holeByHole: [],
      skinsResults: skinsRes,
    });

    // g1 won 18 skins @ $10 each from 2 players => +$360
    // g2 lost 18 skins @ $10 => -$180
    // g3 lost 18 skins @ $10 => -$180
    const g1Bal = settlement.golferBalances.find(b => b.golferId === 'g1')?.totalWonLost;
    const g2Bal = settlement.golferBalances.find(b => b.golferId === 'g2')?.totalWonLost;
    const g3Bal = settlement.golferBalances.find(b => b.golferId === 'g3')?.totalWonLost;

    expect(g1Bal).toBe(360);
    expect(g2Bal).toBe(-180);
    expect(g3Bal).toBe(-180);
  });

  it('carries over skins on tied holes until an outright winner', () => {
    // Hole 1: tied (4, 4, 5) -> g1 and g2 tie (low 4). Carried 1 skin.
    // Hole 2: tied (4, 4, 5) -> g1 and g2 tie (low 4). Carried 2 skins total.
    // Hole 3: g1 scores 3 (birdie), g2 scores 4, g3 scores 4. g1 wins outright! (Wins 3 skins)
    // Remaining 15 holes unplayed (null)
    const scoresG1 = [4, 4, 3, ...Array(15).fill(null)];
    const scoresG2 = [4, 4, 4, ...Array(15).fill(null)];
    const scoresG3 = [5, 5, 4, ...Array(15).fill(null)];

    const config: MatchConfig = {
      id: 'skins-test-carryover',
      course,
      selectedTee,
      gameFormat: 'SKINS',
      scoringMode: 'GROSS',
      handicapAllowancePct: 1.0,
      wagers: { front9: 0, back9: 0, overall18: 0 },
      skinsWager: { skinAmount: 5 },
      participants: [
        { golfer: golfers[0], courseHandicap: 5, grossScores: scoresG1 },
        { golfer: golfers[1], courseHandicap: 10, grossScores: scoresG2 },
        { golfer: golfers[2], courseHandicap: 15, grossScores: scoresG3 },
      ],
    };

    const skinsRes = calculateSkins(config);

    expect(skinsRes.holeByHole[0].isTie).toBe(true);
    expect(skinsRes.holeByHole[0].skinsAtStake).toBe(1);

    expect(skinsRes.holeByHole[1].isTie).toBe(true);
    expect(skinsRes.holeByHole[1].skinsAtStake).toBe(2);

    expect(skinsRes.holeByHole[2].isTie).toBe(false);
    expect(skinsRes.holeByHole[2].winnerGolferId).toBe('g1');
    expect(skinsRes.holeByHole[2].skinsWon).toBe(3);

    expect(skinsRes.golferSkinCounts['g1']).toBe(3);
    expect(skinsRes.golferSkinCounts['g2']).toBe(0);
    expect(skinsRes.golferSkinCounts['g3']).toBe(0);
  });
});
