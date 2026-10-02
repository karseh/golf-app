export type PaymentMethod = 'VENMO' | 'PAYPAL' | 'ZELLE' | 'CASHAPP';

export interface Golfer {
  id: string;
  name: string;
  handicapIndex: number; // e.g. 14.2, +1.5 (negative number for plus handicaps)
  preferredPaymentMethod: PaymentMethod;
  paymentHandle: string; // e.g. "john-smith-99", "paypal.me/jsmith", "555-123-4567", "$jsmith"
}

export interface Hole {
  holeNumber: number; // 1 to 18
  par: number; // 3, 4, or 5
  handicapIndex: number; // 1 to 18 (stroke allocation rank)
}

export interface TeeBox {
  name: string; // "Black", "Blue", "White", "Red", "Gold"
  courseRating: number; // e.g. 74.3
  slopeRating: number; // e.g. 135
  par: number; // e.g. 72
  holes: Hole[]; // exactly 18 holes
}

export interface Course {
  id: string;
  name: string;
  city: string;
  state: string;
  teeBoxes: TeeBox[];
}

export type GameFormat = 
  | 'MATCH_PLAY_1V1' 
  | 'MATCH_PLAY_ALL_VS_ALL' 
  | 'MATCH_PLAY_TEAMS' 
  | 'STROKE_PLAY'
  | 'SKINS';

export type ScoringMode = 'GROSS' | 'NET';

export interface Wagers {
  front9: number; // e.g. 10
  back9: number; // e.g. 10
  overall18: number; // e.g. 10
}

export interface SkinsWager {
  skinAmount: number; // dollar amount per skin/hole, e.g. 5
}

export interface Team {
  id: number; // 1 or 2
  name: string; // e.g. "Team 1" or "John & Mike"
  playerIds: string[];
}

export interface MatchParticipant {
  golfer: Golfer;
  courseHandicap: number;
  teamId?: number;
  grossScores: (number | null)[]; // 18 hole gross scores (null if unplayed)
}

export interface MatchConfig {
  id: string;
  course: Course;
  selectedTee: TeeBox;
  gameFormat: GameFormat;
  scoringMode: ScoringMode;
  handicapAllowancePct: number; // e.g. 1.0 (100%), 0.9 (90%), 0.85 (85%)
  wagers: Wagers;
  skinsWager?: SkinsWager;
  participants: MatchParticipant[];
  teams?: Team[];
}

export interface HoleScoreDetail {
  golferId: string;
  gross: number;
  net: number;
  strokesGiven: number; // strokes received on this specific hole
}

export interface HoleMatchResult {
  holeNumber: number;
  scores: HoleScoreDetail[];
  winnerGolferId?: string; // set for 1v1 / individual hole winner
  winnerTeamId?: number;   // set for team hole winner
  isHalved: boolean;
  statusText: string;      // e.g. "Player A 1 Up", "All Square", "Halved"
}

export interface SegmentResult {
  segmentName: 'Front 9' | 'Back 9' | 'Overall 18';
  winnerGolferId?: string;
  winnerTeamId?: number;
  isHalved: boolean;
  scoreSummary: string; // e.g., "John won 2 Up", "Team 1 won 3&2", "Halved"
  details?: any;
}

export interface SkinsHoleResult {
  holeNumber: number;
  lowScore: number | null;
  winnerGolferId?: string;
  isTie: boolean;
  skinsAtStake: number;
  skinsWon: number;
}

export interface SkinsResults {
  holeByHole: SkinsHoleResult[];
  golferSkinCounts: Record<string, number>;
  totalSkinsWon: number;
}

export interface MatchResults {
  front9: SegmentResult;
  back9: SegmentResult;
  overall18: SegmentResult;
  holeByHole: HoleMatchResult[];
  skinsResults?: SkinsResults;
}

export interface GolferBalance {
  golferId: string;
  name: string;
  totalWonLost: number; // positive = net won (+), negative = net lost (-)
  segmentBreakdown: {
    front9: number;
    back9: number;
    overall18: number;
  };
}

export interface PaymentTransaction {
  fromGolfer: Golfer;
  toGolfer: Golfer;
  amount: number;
  paymentUrl: string;
  paymentSummaryText: string;
}

export interface SettlementResult {
  golferBalances: GolferBalance[];
  transactions: PaymentTransaction[];
}

export type GameStatus = 'in_progress' | 'completed';

export interface Game {
  id: string;
  name: string;
  createdAt: string; // ISO date string
  completedAt?: string;
  status: GameStatus;
  config: MatchConfig;
  grossScoresMap: Record<string, (number | null)[]>;
}

export interface OpponentStat {
  opponentId: string;
  opponentName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  netWinnings: number; // positive = won money, negative = lost money
}

export interface GolferHeadToHead {
  golferId: string;
  golferName: string;
  totalNetWinnings: number;
  gamesCount: number;
  opponents: OpponentStat[];
}
