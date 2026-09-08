import { isSameCard } from '../engine/cards';
import { shuffle } from '../engine/deck';
import { publicHandView, PublicState } from '../engine/publicView';
import { Rng } from '../engine/rng';
import { determineTrickWinner, isHandFinished, legalPlaysInHand } from '../engine/rules';
import { scoreHand } from '../engine/scoring';
import { Card, Contract, HandState, PlayerId, RuleSet, Suit, Trick } from '../engine/types';
import { chooseMediumCard } from './medium';
import { CardTracker } from './tracker';

const MAX_SAMPLE_ATTEMPTS = 50;

export type World = Partial<Record<PlayerId, Card[]>>;

// Bilinmeyen kartları (benim elim ve oynanmış kartlar hariç kalan tüm
// destesi), her oyuncunun kalan kart sayısına ve bilinen renksizlik
// kısıtlarına uyarak rakiplere dağıtır. Kısıtlar sıkıysa (daha çok renksiz
// olan) önce dağıtılır; bir deneme tutmazsa yeniden karıştırıp dener
// (reddetme örneklemesi). Hiçbiri tutmazsa (çok nadir, aşırı sıkı kısıtlar),
// kısıtları yok sayan basit bir bölüşüme düşer — HARD ajan her zaman bir
// karar verebilsin diye.
export function sampleWorld(view: PublicState, rng: Rng): World {
  const hand = view.hand!;
  const self = view.self;
  const opponents = ([0, 1, 2, 3] as PlayerId[]).filter((p) => p !== self);
  const pool = new CardTracker(view).remainingUnseen;

  const needed: Partial<Record<PlayerId, number>> = {};
  for (const p of opponents) needed[p] = hand.handSizes[p];

  const ordered = [...opponents].sort((a, b) => hand.voidSuits[b].length - hand.voidSuits[a].length);

  for (let attempt = 0; attempt < MAX_SAMPLE_ATTEMPTS; attempt++) {
    const remaining = shuffle(pool, rng);
    const assignment: World = {};
    let ok = true;

    for (const p of ordered) {
      const need = needed[p]!;
      const legalIdx: number[] = [];
      for (let i = 0; i < remaining.length; i++) {
        if (!hand.voidSuits[p].includes(remaining[i].suit)) legalIdx.push(i);
      }
      if (legalIdx.length < need) {
        ok = false;
        break;
      }
      const chosenIdx = new Set(legalIdx.slice(0, need));
      const chosen: Card[] = [];
      for (let i = remaining.length - 1; i >= 0; i--) {
        if (chosenIdx.has(i)) {
          chosen.unshift(remaining[i]);
          remaining.splice(i, 1);
        }
      }
      assignment[p] = chosen;
    }

    if (ok && remaining.length === 0) return assignment;
  }

  const fallback = shuffle(pool, rng);
  const assignment: World = {};
  let idx = 0;
  for (const p of opponents) {
    const need = needed[p]!;
    assignment[p] = fallback.slice(idx, idx + need);
    idx += need;
  }
  return assignment;
}

// PublicState + örneklenmiş dünyadan, motorun anladığı tam bilgili bir
// HandState kurar. overrideContract/overrideTrumpSuit, kontrat/koz henüz
// seçilmemişken ("bu kontratı seçseydim ne olurdu?") varsayımsal
// simülasyon için kullanılır.
export function buildSimulatedHand(
  view: PublicState,
  world: World,
  overrideContract?: Contract,
  overrideTrumpSuit?: Suit,
): HandState {
  const publicHand = view.hand!;
  const hands: Card[][] = [[], [], [], []];
  hands[view.self] = [...publicHand.myHand];
  for (const p of [0, 1, 2, 3] as PlayerId[]) {
    if (p !== view.self) hands[p] = world[p] ?? [];
  }

  return {
    handNo: publicHand.handNo,
    dealer: publicHand.dealer,
    declarer: publicHand.declarer,
    contract: overrideContract ?? publicHand.contract,
    trumpSuit: overrideTrumpSuit ?? publicHand.trumpSuit,
    hands,
    currentTrick: publicHand.currentTrick,
    completedTricks: publicHand.completedTricks,
    turn: publicHand.turn,
    finished: publicHand.finished,
    handScores: [0, 0, 0, 0],
  };
}

function removeCard(hands: Card[][], player: PlayerId, card: Card): Card[][] {
  return hands.map((h, i) => (i === player ? h.filter((c) => !isSameCard(c, card)) : h));
}

function stepHand(hand: HandState, player: PlayerId, card: Card, ruleSet: RuleSet): HandState {
  const withoutCard = { ...hand, hands: removeCard(hand.hands, player, card) };
  const trick: Trick = {
    ...withoutCard.currentTrick,
    plays: [...withoutCard.currentTrick.plays, { player, card }],
  };

  if (trick.plays.length === 4) {
    const winner = determineTrickWinner(withoutCard, trick);
    const completedTrick: Trick = { ...trick, winner };
    const completedTricks = [...withoutCard.completedTricks, completedTrick];
    const finished = isHandFinished(withoutCard, completedTricks, ruleSet);
    return {
      ...withoutCard,
      completedTricks,
      currentTrick: { leader: winner, plays: [] },
      turn: winner,
      finished,
    };
  }

  return { ...withoutCard, currentTrick: trick, turn: ((player + 1) % 4) as PlayerId };
}

function simulationView(hand: HandState, player: PlayerId, ruleSet: RuleSet): PublicState {
  return {
    self: player,
    ruleSet,
    // MEDIUM'un chooseCard'ı yalnızca `hand` alanını okur; aşağıdakiler
    // yalnızca tip uyumluluğu için var, simülasyon sırasında hiç okunmaz.
    players: [
      { id: 0, name: '', isHuman: false },
      { id: 1, name: '', isHuman: false },
      { id: 2, name: '', isHuman: false },
      { id: 3, name: '', isHuman: false },
    ],
    contractsRemaining: {} as Record<Contract, number>,
    playerQuota: {
      0: { penalty: 0, trump: 0 },
      1: { penalty: 0, trump: 0 },
      2: { penalty: 0, trump: 0 },
      3: { penalty: 0, trump: 0 },
    },
    scoreTable: [],
    totals: [0, 0, 0, 0],
    phase: 'PLAYING',
    hand: publicHandView(hand, player),
  };
}

function runToCompletion(hand: HandState, ruleSet: RuleSet): HandState {
  let current = hand;
  while (!current.finished) {
    const player = current.turn;
    const legal = legalPlaysInHand(current, player, ruleSet);
    const card = legal.length === 1 ? legal[0] : chooseMediumCard(simulationView(current, player, ruleSet), legal);
    current = stepHand(current, player, card, ruleSet);
  }
  return current;
}

// Örneklenmiş dünyada, `decidingPlayer`in ilk hamlesi `firstCard` olacak
// şekilde eli sonuna kadar MEDIUM ile oynatır ve `forPlayer`in nihai el
// puanını döndürür.
export function playOut(
  hand: HandState,
  ruleSet: RuleSet,
  decidingPlayer: PlayerId,
  firstCard: Card,
  forPlayer: PlayerId,
): number {
  const afterFirst = stepHand(hand, decidingPlayer, firstCard, ruleSet);
  const finished = afterFirst.finished ? afterFirst : runToCompletion(afterFirst, ruleSet);
  return scoreHand(finished)[forPlayer];
}

// Kontrat/koz seçimi değerlendirmesi için: elin tamamını (henüz hiç kart
// oynanmamış haliyle) MEDIUM ile baştan sona oynatır.
export function playOutFullHand(hand: HandState, ruleSet: RuleSet, forPlayer: PlayerId): number {
  const finished = hand.finished ? hand : runToCompletion(hand, ruleSet);
  return scoreHand(finished)[forPlayer];
}
