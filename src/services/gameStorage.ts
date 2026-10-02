import { Game, Golfer, GolferHeadToHead, OpponentStat, MatchConfig, MatchResults } from '../types';
import { BAY_AREA_COURSES } from '../data/bayAreaCourses';
import { calculateMatchPlay } from '../engine/matchPlay';
import { calculateStrokePlay } from '../engine/strokePlay';
import { calculateSkins } from '../engine/skins';
import { calculateSettlement } from '../engine/settlement';

const STORAGE_KEY = 'GOLF_APP_GAMES_V1';

// In-Memory fallback for environments without localStorage/AsyncStorage
let inMemoryGamesStore: Game[] | null = null;

// Initial default golfers
export const INITIAL_GOLFERS: Golfer[] = [
  { id: 'g1', name: 'John Smith', handicapIndex: 5.2, preferredPaymentMethod: 'VENMO', paymentHandle: 'johnsmith' },
  { id: 'g2', name: 'Mike Ross', handicapIndex: 14.8, preferredPaymentMethod: 'PAYPAL', paymentHandle: 'mikeross' },
  { id: 'g3', name: 'David Lee', handicapIndex: 11.0, preferredPaymentMethod: 'CASHAPP', paymentHandle: '$davidlee' },
  { id: 'g4', name: 'Alex Wong', handicapIndex: 8.5, preferredPaymentMethod: 'ZELLE', paymentHandle: 'alex@zelle.com' },
];

/**
 * Seed initial completed sample games if storage is empty
 */
export function getSampleGames(): Game[] {
  const course = BAY_AREA_COURSES[0]; // Pebble Beach
  const selectedTee = course.teeBoxes[0]; // Championship Tee

  // Sample Game 1: 1v1 Match Play (John vs Mike) - Completed
  const game1Config: MatchConfig = {
    id: 'game-sample-1',
    course,
    selectedTee,
    gameFormat: 'MATCH_PLAY_1V1',
    scoringMode: 'NET',
    handicapAllowancePct: 1.0,
    wagers: { front9: 10, back9: 10, overall18: 20 },
    participants: [
      { golfer: INITIAL_GOLFERS[0], courseHandicap: 5, grossScores: [4, 4, 3, 5, 4, 5, 3, 5, 4,  4, 5, 3, 4, 4, 3, 5, 4, 4] }, // John (73)
      { golfer: INITIAL_GOLFERS[1], courseHandicap: 14, grossScores: [5, 5, 4, 6, 5, 4, 4, 6, 5,  5, 6, 4, 5, 5, 4, 6, 5, 5] }, // Mike (88)
    ],
  };

  const game1: Game = {
    id: 'game-sample-1',
    name: 'Saturday Pebble Beach Classic',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 3 + 14400000).toISOString(),
    status: 'completed',
    config: game1Config,
    grossScoresMap: {
      g1: game1Config.participants[0].grossScores,
      g2: game1Config.participants[1].grossScores,
    },
  };

  // Sample Game 2: Skins Game (John vs Mike vs David vs Alex) - Completed
  const game2Config: MatchConfig = {
    id: 'game-sample-2',
    course: BAY_AREA_COURSES[1] || course, // TPC Harding Park
    selectedTee: (BAY_AREA_COURSES[1] || course).teeBoxes[0],
    gameFormat: 'SKINS',
    scoringMode: 'NET',
    handicapAllowancePct: 1.0,
    wagers: { front9: 0, back9: 0, overall18: 0 },
    skinsWager: { skinAmount: 5 },
    participants: [
      { golfer: INITIAL_GOLFERS[0], courseHandicap: 5, grossScores: [4, 4, 3, 5, 4, 4, 3, 5, 4,  4, 5, 3, 4, 4, 3, 5, 4, 4] },
      { golfer: INITIAL_GOLFERS[1], courseHandicap: 14, grossScores: [5, 4, 4, 5, 5, 4, 4, 6, 5,  5, 6, 4, 5, 5, 4, 6, 5, 5] },
      { golfer: INITIAL_GOLFERS[2], courseHandicap: 11, grossScores: [4, 5, 4, 4, 4, 5, 3, 5, 4,  4, 5, 4, 4, 4, 4, 5, 4, 4] },
      { golfer: INITIAL_GOLFERS[3], courseHandicap: 8, grossScores: [4, 4, 4, 5, 4, 4, 4, 5, 4,  4, 4, 3, 5, 4, 3, 5, 4, 4] },
    ],
  };

  const game2: Game = {
    id: 'game-sample-2',
    name: 'Sunday Harding Park Skins Shootout',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86400000 + 14400000).toISOString(),
    status: 'completed',
    config: game2Config,
    grossScoresMap: {
      g1: game2Config.participants[0].grossScores,
      g2: game2Config.participants[1].grossScores,
      g3: game2Config.participants[2].grossScores,
      g4: game2Config.participants[3].grossScores,
    },
  };

  // Sample Game 3: Ongoing Match Play
  const game3Config: MatchConfig = {
    id: 'game-sample-3',
    course,
    selectedTee,
    gameFormat: 'MATCH_PLAY_1V1',
    scoringMode: 'NET',
    handicapAllowancePct: 1.0,
    wagers: { front9: 15, back9: 15, overall18: 20 },
    participants: [
      { golfer: INITIAL_GOLFERS[0], courseHandicap: 5, grossScores: [4, 4, 3, 5, 4, 5, 3, 5, 4,  null, null, null, null, null, null, null, null, null] },
      { golfer: INITIAL_GOLFERS[2], courseHandicap: 11, grossScores: [5, 4, 4, 5, 4, 5, 4, 6, 5,  null, null, null, null, null, null, null, null, null] },
    ],
  };

  const game3: Game = {
    id: 'game-sample-3',
    name: 'Midweek Pebble Front 9 Battle',
    createdAt: new Date().toISOString(),
    status: 'in_progress',
    config: game3Config,
    grossScoresMap: {
      g1: game3Config.participants[0].grossScores,
      g3: game3Config.participants[1].grossScores,
    },
  };

  return [game1, game2, game3];
}

/**
 * Load all stored games
 */
export function loadStoredGames(): Game[] {
  try {
    const storage = typeof globalThis !== 'undefined' ? (globalThis as any).localStorage : null;
    if (storage) {
      const saved = storage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (e) {
    console.warn('Failed to load games from storage:', e);
  }

  if (inMemoryGamesStore !== null) {
    return inMemoryGamesStore;
  }

  const defaultGames = getSampleGames();
  saveStoredGames(defaultGames);
  return defaultGames;
}

/**
 * Save games to storage
 */
export function saveStoredGames(games: Game[]): void {
  inMemoryGamesStore = games;
  try {
    const storage = typeof globalThis !== 'undefined' ? (globalThis as any).localStorage : null;
    if (storage) {
      storage.setItem(STORAGE_KEY, JSON.stringify(games));
    }
  } catch (e) {
    console.warn('Failed to save games to storage:', e);
  }
}

/**
 * Compute MatchResults for a given Game
 */
export function computeGameResults(game: Game): MatchResults {
  const { config } = game;
  if (config.gameFormat === 'SKINS') {
    const skinsRes = calculateSkins(config);
    return {
      front9: { segmentName: 'Front 9', isHalved: true, scoreSummary: 'Skins Game' },
      back9: { segmentName: 'Back 9', isHalved: true, scoreSummary: 'Skins Game' },
      overall18: { segmentName: 'Overall 18', isHalved: true, scoreSummary: `${skinsRes.totalSkinsWon} Skins Won` },
      holeByHole: [],
      skinsResults: skinsRes,
    };
  } else if (config.gameFormat === 'STROKE_PLAY') {
    return calculateStrokePlay(config).results;
  } else {
    return calculateMatchPlay(config);
  }
}

/**
 * Compute Head-to-Head opponent analytics across all completed (and optionally in-progress) games
 */
export function calculateOpponentMatrix(games: Game[], allGolfers: Golfer[]): GolferHeadToHead[] {
  // Map of golferId -> Map of opponentId -> { gamesPlayed, wins, losses, ties, netWinnings }
  const matrix: Map<string, Map<string, OpponentStat>> = new Map();

  allGolfers.forEach(g => {
    matrix.set(g.id, new Map());
  });

  const completedGames = games.filter(g => g.status === 'completed');

  completedGames.forEach(game => {
    const results = computeGameResults(game);
    const settlement = calculateSettlement(game.config, results);

    const participants = game.config.participants;

    // Evaluate pairwise interactions between every pair of golfers in this game
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const p1 = participants[i].golfer;
        const p2 = participants[j].golfer;

        const p1Bal = settlement.golferBalances.find(b => b.golferId === p1.id)?.totalWonLost || 0;
        const p2Bal = settlement.golferBalances.find(b => b.golferId === p2.id)?.totalWonLost || 0;

        let p1NetAgainstP2 = 0;
        let p2NetAgainstP1 = 0;

        if (game.config.gameFormat === 'SKINS' && results.skinsResults) {
          const skinAmt = game.config.skinsWager?.skinAmount || 5;
          const p1Skins = results.skinsResults.golferSkinCounts[p1.id] || 0;
          const p2Skins = results.skinsResults.golferSkinCounts[p2.id] || 0;
          p1NetAgainstP2 = (p1Skins - p2Skins) * skinAmt;
          p2NetAgainstP1 = -p1NetAgainstP2;
        } else if (participants.length === 2) {
          // Direct 1v1 match: p1's net total is directly against p2
          p1NetAgainstP2 = p1Bal;
          p2NetAgainstP1 = p2Bal;
        } else {
          // Multi-player match: proportional split of balance per opponent
          p1NetAgainstP2 = p1Bal / (participants.length - 1);
          p2NetAgainstP1 = p2Bal / (participants.length - 1);
        }

        // Helper to update player stats against opponent
        const recordMatch = (player: Golfer, opponent: Golfer, netAmount: number) => {
          let pMap = matrix.get(player.id);
          if (!pMap) {
            pMap = new Map();
            matrix.set(player.id, pMap);
          }

          let stat = pMap.get(opponent.id);
          if (!stat) {
            stat = {
              opponentId: opponent.id,
              opponentName: opponent.name,
              gamesPlayed: 0,
              wins: 0,
              losses: 0,
              ties: 0,
              netWinnings: 0,
            };
            pMap.set(opponent.id, stat);
          }

          stat.gamesPlayed += 1;
          stat.netWinnings += netAmount;

          if (netAmount > 0.01) {
            stat.wins += 1;
          } else if (netAmount < -0.01) {
            stat.losses += 1;
          } else {
            stat.ties += 1;
          }
        };

        recordMatch(p1, p2, p1NetAgainstP2);
        recordMatch(p2, p1, p2NetAgainstP1);
      }
    }
  });

  // Convert map to GolferHeadToHead list
  const result: GolferHeadToHead[] = [];

  allGolfers.forEach(golfer => {
    const oppMap = matrix.get(golfer.id) || new Map();
    const opponents = Array.from(oppMap.values());
    const totalNetWinnings = opponents.reduce((acc, o) => acc + o.netWinnings, 0);

    // Count unique games played by golfer
    const gamesCount = completedGames.filter(g =>
      g.config.participants.some(p => p.golfer.id === golfer.id)
    ).length;

    result.push({
      golferId: golfer.id,
      golferName: golfer.name,
      totalNetWinnings,
      gamesCount,
      opponents,
    });
  });

  return result;
}
