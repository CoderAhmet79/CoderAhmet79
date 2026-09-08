import { isSameCard } from './cards';
import { determineTrickWinner, isHandFinished, legalPlaysInHand } from './rules';
import { Card, HandState, PlayerId, RuleSet, Trick } from './types';

// Bu, motorun kendisi çalıştırır: dört elin de tam olarak bilindiği bir
// double-dummy analizidir (AI'nın kısıtlı PublicState'i değil). "El (koz
// oynarken) sonuna kadar oynanmadan bitirilebilir mi?" sorusunun cevabı:
// sıradaki oyuncu (candidate), rakipler ne oynarsa oynasın kalan TÜM
// trickleri kazanmayı garanti edebiliyor mu?
//
// Arama, mümkün olan her dalı denediği için pahalı olabilir; bu yüzden
// yalnızca az sayıda el kaldığında (MAX_SEARCH_TRICKS) ve bir düğüm
// sınırının altında (MAX_SEARCH_NODES) denenir. Sınır aşılırsa "garanti
// yok" varsayılır — yanlış-pozitif asla üretilmez, yalnızca bazı gerçek
// garantiler (çok pahalıysa) atlanabilir.
const MAX_SEARCH_TRICKS = 6;
const MAX_SEARCH_NODES = 20000;

function removeCard(hands: Card[][], player: PlayerId, card: Card): Card[][] {
  return hands.map((h, i) => (i === player ? h.filter((c) => !isSameCard(c, card)) : h));
}

function stepTrick(hand: HandState, player: PlayerId, card: Card, ruleSet: RuleSet): HandState {
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

type SearchBudget = { nodes: number };

function canForceWinAll(
  hand: HandState,
  ruleSet: RuleSet,
  forPlayer: PlayerId,
  budget: SearchBudget,
): boolean {
  // Dikkat: forPlayer'ın eli bittiğinde değil, ancak o an sürmekte olan
  // trick de tamamen çözülüp (plays boş) kazananı doğrulandığında "bitti"
  // sayılır — aksi halde son kartını henüz oynamış ama trick'in geri kalanı
  // hâlâ belirsizken erken "başarılı" dönülür (yanlış-pozitif).
  if (hand.finished) return true;
  if (hand.hands[forPlayer].length === 0 && hand.currentTrick.plays.length === 0) return true;
  budget.nodes++;
  if (budget.nodes > MAX_SEARCH_NODES) return false;

  const player = hand.turn;
  const legal = legalPlaysInHand(hand, player, ruleSet);
  const completedBefore = hand.completedTricks.length;
  const isForPlayer = player === forPlayer;

  for (const card of legal) {
    const next = stepTrick(hand, player, card, ruleSet);
    const trickCompleted = next.completedTricks.length > completedBefore;
    const wonByForPlayer =
      !trickCompleted || next.completedTricks[next.completedTricks.length - 1].winner === forPlayer;

    if (isForPlayer) {
      if (wonByForPlayer && canForceWinAll(next, ruleSet, forPlayer, budget)) return true;
    } else {
      if (!wonByForPlayer || !canForceWinAll(next, ruleSet, forPlayer, budget)) return false;
    }
  }

  return !isForPlayer;
}

// Yalnızca bir trick'in başında (henüz kimse kart atmamışken) ve yalnızca
// Koz kontratında anlamlıdır: o anda sırası gelen oyuncu, rakipler ne
// yaparsa yapsın kalan tüm trickleri kazanmayı garanti edebiliyorsa onun
// PlayerId'sini döndürür; garanti yoksa (ya da ucuzca kanıtlanamıyorsa)
// null döner.
export function findForcedWinner(hand: HandState, ruleSet: RuleSet): PlayerId | null {
  if (hand.contract !== 'TRUMP' || !hand.trumpSuit) return null;
  if (hand.finished) return null;
  if (hand.currentTrick.plays.length !== 0) return null;

  const candidate = hand.turn;
  const remainingTricks = hand.hands[candidate].length;
  if (remainingTricks === 0 || remainingTricks > MAX_SEARCH_TRICKS) return null;

  const budget: SearchBudget = { nodes: 0 };
  return canForceWinAll(hand, ruleSet, candidate, budget) ? candidate : null;
}
