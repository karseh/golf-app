import { MatchConfig, MatchResults, SegmentResult, HoleMatchResult, HoleScoreDetail } from '../types';
import { getStrokesGivenForHole, calculateNetScore } from './handicap';

export interface GolferSegmentStrokes {
  golferId: string;
  name: string;
  front9Gross: number;
  front9Net: number;
  back9Gross: number;
  back9Net: number;
  total18Gross: number;
  total18Net: number;
}

export function calculateStrokePlay(config: MatchConfig): {
  results: MatchResults;
  golferTotals: GolferSegmentStrokes[];
} {
  const { selectedTee, scoringMode, participants } = config;
  const holes = selectedTee.holes;

  const golferTotals: GolferSegmentStrokes[] = participants.map(p => {
    let front9Gross = 0;
    let front9Net = 0;
    let back9Gross = 0;
    let back9Net = 0;

    holes.forEach(hole => {
      const gross = p.grossScores[hole.holeNumber - 1] || 0;
      const strokesGiven = scoringMode === 'NET' ? getStrokesGivenForHole(p.courseHandicap, hole.handicapIndex) : 0;
      const net = calculateNetScore(gross, strokesGiven);

      if (hole.holeNumber <= 9) {
        front9Gross += gross;
        front9Net += net;
      } else {
        back9Gross += gross;
        back9Net += net;
      }
    });

    return {
      golferId: p.golfer.id,
      name: p.golfer.name,
      front9Gross,
      front9Net,
      back9Gross,
      back9Net,
      total18Gross: front9Gross + back9Gross,
      total18Net: front9Net + back9Net,
    };
  });

  // Hole by hole details
  const holeResults: HoleMatchResult[] = holes.map(hole => {
    const scores: HoleScoreDetail[] = participants.map(p => {
      const gross = p.grossScores[hole.holeNumber - 1] || 0;
      const strokesGiven = scoringMode === 'NET' ? getStrokesGivenForHole(p.courseHandicap, hole.handicapIndex) : 0;
      const net = calculateNetScore(gross, strokesGiven);
      return { golferId: p.golfer.id, gross, net, strokesGiven };
    });

    return {
      holeNumber: hole.holeNumber,
      scores,
      isHalved: true,
      statusText: `Stroke Play Hole ${hole.holeNumber}`,
    };
  });

  // Helper to find segment winner
  const evaluateSegment = (
    key: 'front9' | 'back9' | 'total18',
    segmentName: 'Front 9' | 'Back 9' | 'Overall 18'
  ): SegmentResult => {
    const getScore = (g: GolferSegmentStrokes) => {
      if (key === 'front9') return scoringMode === 'NET' ? g.front9Net : g.front9Gross;
      if (key === 'back9') return scoringMode === 'NET' ? g.back9Net : g.back9Gross;
      return scoringMode === 'NET' ? g.total18Net : g.total18Gross;
    };

    const minScore = Math.min(...golferTotals.map(getScore));
    const winners = golferTotals.filter(g => getScore(g) === minScore);

    if (winners.length === 1) {
      return {
        segmentName,
        winnerGolferId: winners[0].golferId,
        isHalved: false,
        scoreSummary: `${winners[0].name} won with ${minScore} ${scoringMode === 'NET' ? 'net' : 'gross'} strokes`,
      };
    } else {
      return {
        segmentName,
        isHalved: true,
        scoreSummary: `Tied / Halved with ${minScore} ${scoringMode === 'NET' ? 'net' : 'gross'} strokes`,
      };
    }
  };

  const results: MatchResults = {
    front9: evaluateSegment('front9', 'Front 9'),
    back9: evaluateSegment('back9', 'Back 9'),
    overall18: evaluateSegment('total18', 'Overall 18'),
    holeByHole: holeResults,
  };

  return { results, golferTotals };
}
