import { calculateSettlement, generatePaymentUrl } from '../src/engine/settlement';
import { BAY_AREA_COURSES } from '../src/data/bayAreaCourses';
import { MatchConfig, MatchResults, Golfer } from '../src/types';

describe('Settlement Engine & Payment Deep Links', () => {
  const golfer1: Golfer = {
    id: 'g1',
    name: 'John Smith',
    handicapIndex: 5.0,
    preferredPaymentMethod: 'VENMO',
    paymentHandle: 'johnsmith',
  };

  const golfer2: Golfer = {
    id: 'g2',
    name: 'Mike Ross',
    handicapIndex: 15.0,
    preferredPaymentMethod: 'PAYPAL',
    paymentHandle: 'mikeross',
  };

  const golfer3: Golfer = {
    id: 'g3',
    name: 'David Lee',
    handicapIndex: 12.0,
    preferredPaymentMethod: 'CASHAPP',
    paymentHandle: '$davidlee',
  };

  test('generates accurate Venmo deep link', () => {
    const url = generatePaymentUrl(golfer1, 30.0, 'Golf Settlement');
    expect(url).toContain('venmo://paycharge?txn=pay');
    expect(url).toContain('recipients=johnsmith');
    expect(url).toContain('amount=30.00');
  });

  test('generates accurate PayPal link', () => {
    const url = generatePaymentUrl(golfer2, 25.50, 'Golf Match');
    expect(url).toBe('https://paypal.me/mikeross/25.50');
  });

  test('generates accurate CashApp link', () => {
    const url = generatePaymentUrl(golfer3, 10.00, 'Golf Match');
    expect(url).toBe('https://cash.app/$davidlee/10.00');
  });

  test('calculates settlement transactions correctly for 1v1 match', () => {
    const course = BAY_AREA_COURSES[0];
    const config: MatchConfig = {
      id: 'm1',
      course,
      selectedTee: course.teeBoxes[0],
      gameFormat: 'MATCH_PLAY_1V1',
      scoringMode: 'GROSS',
      handicapAllowancePct: 1.0,
      wagers: { front9: 10, back9: 10, overall18: 10 }, // total $30
      participants: [
        { golfer: golfer1, courseHandicap: 5, grossScores: Array(18).fill(4) },
        { golfer: golfer2, courseHandicap: 15, grossScores: Array(18).fill(5) },
      ],
    };

    // John wins front 9, back 9, and overall 18 ($30 total)
    const mockResults: MatchResults = {
      front9: { segmentName: 'Front 9', winnerGolferId: 'g1', isHalved: false, scoreSummary: 'John won' },
      back9: { segmentName: 'Back 9', winnerGolferId: 'g1', isHalved: false, scoreSummary: 'John won' },
      overall18: { segmentName: 'Overall 18', winnerGolferId: 'g1', isHalved: false, scoreSummary: 'John won' },
      holeByHole: [],
    };

    const settlement = calculateSettlement(config, mockResults);

    expect(settlement.golferBalances).toHaveLength(2);
    const johnBal = settlement.golferBalances.find(b => b.golferId === 'g1');
    const mikeBal = settlement.golferBalances.find(b => b.golferId === 'g2');

    expect(johnBal?.totalWonLost).toBe(30);
    expect(mikeBal?.totalWonLost).toBe(-30);

    expect(settlement.transactions).toHaveLength(1);
    expect(settlement.transactions[0].fromGolfer.id).toBe('g2');
    expect(settlement.transactions[0].toGolfer.id).toBe('g1');
    expect(settlement.transactions[0].amount).toBe(30);
    expect(settlement.transactions[0].paymentUrl).toContain('venmo://paycharge');
  });
});
