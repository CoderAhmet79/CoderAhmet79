export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J 12=Q 13=K 14=A
export type Card = { suit: Suit; rank: Rank };
export type PlayerId = 0 | 1 | 2 | 3;

export type Contract =
  | 'NO_TRICKS'
  | 'NO_HEARTS'
  | 'NO_MEN'
  | 'NO_QUEENS'
  | 'RIFKI'
  | 'LAST_TWO'
  | 'TRUMP';

export type Trick = {
  leader: PlayerId;
  plays: { player: PlayerId; card: Card }[];
  winner?: PlayerId;
};

export type HandState = {
  handNo: number; // 1..20
  dealer: PlayerId;
  declarer: PlayerId;
  contract: Contract | null;
  trumpSuit: Suit | null;
  hands: Card[][]; // 4 oyuncunun eli
  currentTrick: Trick;
  completedTricks: Trick[];
  turn: PlayerId;
  finished: boolean;
  handScores: [number, number, number, number];
};

export type RuleSet = {
  mustTrumpWhenVoid: boolean; // varsayılan true
  earlyEndOnPenaltyExhausted: boolean; // Rıfkı/Kız/Erkek erken bitiş, varsayılan true
};

export const defaultRuleSet: RuleSet = {
  mustTrumpWhenVoid: true,
  earlyEndOnPenaltyExhausted: true,
};

export type HandScoreRow = {
  handNo: number;
  contract: Contract;
  declarer: PlayerId;
  trumpSuit: Suit | null;
  scores: [number, number, number, number];
  cumulative: [number, number, number, number];
};

export type Player = { id: PlayerId; name: string; isHuman: boolean };

export type GameState = {
  ruleSet: RuleSet;
  seed: number;
  players: Player[];
  contractsRemaining: Record<Contract, number>; // global kalan (ceza 2'şer, TRUMP 8)
  playerQuota: Record<PlayerId, { penalty: number; trump: number }>; // 3 ve 2'den geri sayar
  scoreTable: HandScoreRow[];
  totals: [number, number, number, number];
  hand: HandState | null;
  phase: 'CHOOSE_CONTRACT' | 'CHOOSE_TRUMP' | 'PLAYING' | 'HAND_OVER' | 'GAME_OVER';
};

export const PENALTY_CONTRACTS: Contract[] = [
  'NO_TRICKS',
  'NO_HEARTS',
  'NO_MEN',
  'NO_QUEENS',
  'RIFKI',
  'LAST_TWO',
];

export const ALL_CONTRACTS: Contract[] = [...PENALTY_CONTRACTS, 'TRUMP'];

export const TOTAL_HANDS = 20;
export const TRICKS_PER_HAND = 13;
