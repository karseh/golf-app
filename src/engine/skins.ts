import { MatchConfig, SkinsResults, SkinsHoleResult, HoleScoreDetail } from '../types';
import { getStrokesGivenForHole, calculateNetScore } from './handicap';

/**
 * Skins Game Engine with Carryover Logic
 * 
 * Rules:
 * - On each hole, low score (gross or net) wins the skin(s).
 * - If 2+ players tie for low score, the skin carries forward to the next hole.
 * - Carried skins accumulate until a player wins a hole outright.
 */
export function calculateSkins(config: MatchConfig): SkinsResults {
  const { selectedTee, scoringMode, participants } = config;
  const holes = selectedTee.holes;

  let lowestCH = 0;
  if (scoringMode === 'NET' && participants.length > 0) {
    lowestCH = Math.min(...participants.map(p => p.courseHandicap));
  }

  const golferSkinCounts: Record<string, number> = {};
  participants.forEach(p => {
    golferSkinCounts[p.golfer.id] = 0;
  });

  const holeByHole: SkinsHoleResult[] = [];
  let carriedSkins = 0;

  holes.forEach(hole => {
    const holeIdx = hole.holeNumber - 1;

    // Evaluate participants who have completed this hole
    const holeScores: { golferId: string; score: number }[] = [];

    participants.forEach(p => {
      const gross = p.grossScores[holeIdx];
      if (gross !== null && gross !== undefined && gross > 0) {
        const effectiveCH = scoringMode === 'NET' ? p.courseHandicap - lowestCH : 0;
        const strokesGiven = scoringMode === 'NET' ? getStrokesGivenForHole(effectiveCH, hole.handicapIndex) : 0;
        const net = calculateNetScore(gross, strokesGiven);
        const effectiveScore = scoringMode === 'NET' ? net : gross;

        holeScores.push({ golferId: p.golfer.id, score: effectiveScore });
      }
    });

    const skinsAtStake = 1 + carriedSkins;

    if (holeScores.length === 0) {
      // Unplayed hole
      holeByHole.push({
        holeNumber: hole.holeNumber,
        lowScore: null,
        winnerGolferId: undefined,
        isTie: false,
        skinsAtStake,
        skinsWon: 0,
      });
      return;
    }

    const minScore = Math.min(...holeScores.map(s => s.score));
    const lowScorers = holeScores.filter(s => s.score === minScore);

    if (lowScorers.length === 1) {
      // Outright winner!
      const winnerGolferId = lowScorers[0].golferId;
      golferSkinCounts[winnerGolferId] = (golferSkinCounts[winnerGolferId] || 0) + skinsAtStake;

      holeByHole.push({
        holeNumber: hole.holeNumber,
        lowScore: minScore,
        winnerGolferId,
        isTie: false,
        skinsAtStake,
        skinsWon: skinsAtStake,
      });

      carriedSkins = 0; // reset carryover
    } else {
      // Tie / Halved hole - Carry forward to next hole
      carriedSkins = skinsAtStake;

      holeByHole.push({
        holeNumber: hole.holeNumber,
        lowScore: minScore,
        winnerGolferId: undefined,
        isTie: true,
        skinsAtStake,
        skinsWon: 0,
      });
    }
  });

  const totalSkinsWon = Object.values(golferSkinCounts).reduce((acc, cnt) => acc + cnt, 0);

  return {
    holeByHole,
    golferSkinCounts,
    totalSkinsWon,
  };
}
