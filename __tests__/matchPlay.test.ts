import { calculateMatchPlay } from '../src/engine/matchPlay';
import { BAY_AREA_COURSES } from '../src/data/bayAreaCourses';
import { MatchConfig, Golfer } from '../src/types';

describe('Match Play Engine', () => {
  const course = BAY_AREA_COURSES[0]; // TPC Harding Park
  const tee = course.teeBoxes[0];

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
    paymentHandle: 'paypal.me/mikeross',
  };

  test('calculates 1v1 Net Match Play segment winners correctly', () => {
    const config: MatchConfig = {
      id: 'match-1',
      course,
      selectedTee: tee,
      gameFormat: 'MATCH_PLAY_1V1',
      scoringMode: 'NET',
      handicapAllowancePct: 1.0,
      wagers: { front9: 10, back9: 10, overall18: 10 },
      participants: [
        {
          golfer: golfer1,
          courseHandicap: 5,
          // John shoots 4 on all holes (72 total gross)
          grossScores: Array(18).fill(4),
        },
        {
          golfer: golfer2,
          courseHandicap: 15,
          // Mike shoots 5 on all holes (90 total gross)
          // Difference in CH is 10 strokes (Mike receives 1 stroke on 10 hardest holes)
          // On hole indexes 1..10, Mike gross 5 - 1 stroke = net 4 (ties John's 4 net)
          // On hole indexes 11..18, Mike gross 5 - 0 stroke = net 5 (John wins with net 4)
          grossScores: Array(18).fill(5),
        },
      ],
    };

    const results = calculateMatchPlay(config);

    expect(results.holeByHole).toHaveLength(18);
    expect(results.overall18.winnerGolferId).toBe('g1');
    expect(results.overall18.isHalved).toBe(false);
  });

  test('calculates 2v2 Team Match Play (Four-ball Best Ball)', () => {
    const golfer3: Golfer = { id: 'g3', name: 'Alice', handicapIndex: 10.0, preferredPaymentMethod: 'ZELLE', paymentHandle: 'alice@zelle.com' };
    const golfer4: Golfer = { id: 'g4', name: 'Bob', handicapIndex: 20.0, preferredPaymentMethod: 'CASHAPP', paymentHandle: '$bob' };

    const config: MatchConfig = {
      id: 'match-teams',
      course,
      selectedTee: tee,
      gameFormat: 'MATCH_PLAY_TEAMS',
      scoringMode: 'GROSS',
      handicapAllowancePct: 1.0,
      wagers: { front9: 20, back9: 20, overall18: 20 },
      teams: [
        { id: 1, name: 'Team 1', playerIds: ['g1', 'g2'] },
        { id: 2, name: 'Team 2', playerIds: ['g3', 'g4'] },
      ],
      participants: [
        { golfer: golfer1, courseHandicap: 5, teamId: 1, grossScores: Array(18).fill(3) }, // Team 1 shoots 3s
        { golfer: golfer2, courseHandicap: 15, teamId: 1, grossScores: Array(18).fill(4) },
        { golfer: golfer3, courseHandicap: 10, teamId: 2, grossScores: Array(18).fill(4) }, // Team 2 shoots 4s
        { golfer: golfer4, courseHandicap: 20, teamId: 2, grossScores: Array(18).fill(5) },
      ],
    };

    const results = calculateMatchPlay(config);

    expect(results.front9.winnerTeamId).toBe(1);
    expect(results.back9.winnerTeamId).toBe(1);
    expect(results.overall18.winnerTeamId).toBe(1);
  });
});
