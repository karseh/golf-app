import { MatchConfig, MatchResults, HoleMatchResult, SegmentResult, HoleScoreDetail } from '../types';
import { getStrokesGivenForHole, calculateNetScore } from './handicap';

/**
 * Match Play Scoring Engine (1v1, All-vs-All, 2v2 Teams)
 */
export function calculateMatchPlay(config: MatchConfig): MatchResults {
  const { selectedTee, gameFormat, scoringMode, participants, teams } = config;
  const holes = selectedTee.holes;

  // Determine baseline handicap for stroke differential in Net matches
  let lowestCH = 0;
  if (scoringMode === 'NET' && participants.length > 0) {
    lowestCH = Math.min(...participants.map(p => p.courseHandicap));
  }

  // Calculate hole-by-hole scores and stroke allocations
  const holeResults: HoleMatchResult[] = holes.map(hole => {
    const holeScores: HoleScoreDetail[] = participants.map(p => {
      const gross = p.grossScores[hole.holeNumber - 1];
      if (gross === null || gross === undefined) {
        return {
          golferId: p.golfer.id,
          gross: 0,
          net: 0,
          strokesGiven: 0,
        };
      }

      // Net stroke allocation relative to lowest handicap in match
      const effectiveCH = scoringMode === 'NET' ? p.courseHandicap - lowestCH : 0;
      const strokesGiven = scoringMode === 'NET' ? getStrokesGivenForHole(effectiveCH, hole.handicapIndex) : 0;
      const net = calculateNetScore(gross, strokesGiven);

      return {
        golferId: p.golfer.id,
        gross,
        net,
        strokesGiven,
      };
    });

    if (gameFormat === 'MATCH_PLAY_TEAMS' && teams && teams.length === 2) {
      // 2v2 Team Match Play (Best Ball per hole)
      const team1 = teams[0];
      const team2 = teams[1];

      const getBestTeamScore = (team: typeof team1) => {
        const teamScores = holeScores.filter(s => team.playerIds.includes(s.golferId) && s.gross > 0);
        if (teamScores.length === 0) return Infinity;
        return Math.min(...teamScores.map(s => (scoringMode === 'NET' ? s.net : s.gross)));
      };

      const score1 = getBestTeamScore(team1);
      const score2 = getBestTeamScore(team2);

      let winnerTeamId: number | undefined;
      let isHalved = false;

      if (score1 < score2) {
        winnerTeamId = team1.id;
      } else if (score2 < score1) {
        winnerTeamId = team2.id;
      } else {
        isHalved = true;
      }

      return {
        holeNumber: hole.holeNumber,
        scores: holeScores,
        winnerTeamId,
        isHalved,
        statusText: winnerTeamId ? `Team ${winnerTeamId} Won` : 'Halved',
      };
    } else {
      // 1v1 or Individual comparison per hole
      const validScores = holeScores.filter(s => s.gross > 0);
      if (validScores.length === 0) {
        return {
          holeNumber: hole.holeNumber,
          scores: holeScores,
          isHalved: true,
          statusText: 'Unplayed',
        };
      }

      const getScoreVal = (s: HoleScoreDetail) => (scoringMode === 'NET' ? s.net : s.gross);
      const minScore = Math.min(...validScores.map(getScoreVal));
      const winners = validScores.filter(s => getScoreVal(s) === minScore);

      let winnerGolferId: string | undefined;
      let isHalved = false;

      if (winners.length === 1) {
        winnerGolferId = winners[0].golferId;
      } else {
        isHalved = true;
      }

      return {
        holeNumber: hole.holeNumber,
        scores: holeScores,
        winnerGolferId,
        isHalved,
        statusText: winnerGolferId ? `Golfer Won` : 'Halved',
      };
    }
  });

  // Evaluate Segment Results (Front 9, Back 9, Overall 18)
  const evaluateSegment = (
    startHole: number,
    endHole: number,
    segmentName: 'Front 9' | 'Back 9' | 'Overall 18'
  ): SegmentResult => {
    const segmentHoles = holeResults.filter(
      h => h.holeNumber >= startHole && h.holeNumber <= endHole
    );

    if (gameFormat === 'MATCH_PLAY_TEAMS' && teams && teams.length === 2) {
      let team1Wins = 0;
      let team2Wins = 0;

      segmentHoles.forEach(h => {
        if (h.winnerTeamId === teams[0].id) team1Wins++;
        if (h.winnerTeamId === teams[1].id) team2Wins++;
      });

      const diff = Math.abs(team1Wins - team2Wins);
      let winnerTeamId: number | undefined;
      let isHalved = false;
      let scoreSummary = 'All Square';

      if (team1Wins > team2Wins) {
        winnerTeamId = teams[0].id;
        scoreSummary = `${teams[0].name} won ${diff} Up`;
      } else if (team2Wins > team1Wins) {
        winnerTeamId = teams[1].id;
        scoreSummary = `${teams[1].name} won ${diff} Up`;
      } else {
        isHalved = true;
        scoreSummary = 'Halved (All Square)';
      }

      return {
        segmentName,
        winnerTeamId,
        isHalved,
        scoreSummary,
      };
    } else if (participants.length === 2) {
      // 1v1 Single Match Play
      const p1 = participants[0].golfer.id;
      const p2 = participants[1].golfer.id;

      let p1Wins = 0;
      let p2Wins = 0;

      segmentHoles.forEach(h => {
        if (h.winnerGolferId === p1) p1Wins++;
        if (h.winnerGolferId === p2) p2Wins++;
      });

      const diff = Math.abs(p1Wins - p2Wins);
      let winnerGolferId: string | undefined;
      let isHalved = false;
      let scoreSummary = 'All Square';

      if (p1Wins > p2Wins) {
        winnerGolferId = p1;
        scoreSummary = `${participants[0].golfer.name} won ${diff} Up`;
      } else if (p2Wins > p1Wins) {
        winnerGolferId = p2;
        scoreSummary = `${participants[1].golfer.name} won ${diff} Up`;
      } else {
        isHalved = true;
        scoreSummary = 'Halved (All Square)';
      }

      return {
        segmentName,
        winnerGolferId,
        isHalved,
        scoreSummary,
      };
    } else {
      // Multi-player All-vs-All or Individual summary
      return {
        segmentName,
        isHalved: false,
        scoreSummary: 'Multi-player round robin calculated in settlement matrix',
      };
    }
  };

  return {
    front9: evaluateSegment(1, 9, 'Front 9'),
    back9: evaluateSegment(10, 18, 'Back 9'),
    overall18: evaluateSegment(1, 18, 'Overall 18'),
    holeByHole: holeResults,
  };
}
