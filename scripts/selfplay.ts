// Headless self-play runner: plays full 20-hand Rıfkı games with an agent,
// verifies the zero-sum invariant, and prints a contract-distribution
// summary. With no --level flag every seat plays uniformly random legal
// moves — this is the acceptance check for step 3 of the build plan
// (docs/RIFKI_SPEC.md section 11): if totals always sum to zero, the
// engine's rules and scoring are self-consistent.
import {
  availableContracts,
  chooseContract,
  chooseTrump,
  createGame,
  legalPlays,
  nextHand,
  playCard,
} from '../src/engine/game';
import { createRng, Rng } from '../src/engine/rng';
import { Contract, defaultRuleSet, GameState, Suit } from '../src/engine/types';

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

function pickRandom<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng.next() * items.length)];
}

function playRandomGame(seed: number): GameState {
  const rng = createRng(seed);
  let state = createGame(defaultRuleSet, seed);
  state = nextHand(state);

  while (state.phase !== 'GAME_OVER') {
    const declarer = state.hand!.declarer;
    const contract = pickRandom(availableContracts(state, declarer), rng);
    state = chooseContract(state, contract);
    if (state.phase === 'CHOOSE_TRUMP') {
      state = chooseTrump(state, pickRandom(SUITS, rng));
    }
    while (state.phase === 'PLAYING') {
      const player = state.hand!.turn;
      const card = pickRandom(legalPlays(state, player), rng);
      state = playCard(state, player, card);
    }
    state = nextHand(state);
  }

  return state;
}

function parseArgs(): { games: number; seed: number } {
  const args = process.argv.slice(2);
  let games = 1;
  let seed = 1;
  for (const arg of args) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    if (key === 'games' && value) games = Number(value);
    if (key === 'seed' && value) seed = Number(value);
  }
  return { games, seed };
}

function emptyContractCounts(): Record<Contract, number> {
  return {
    NO_TRICKS: 0,
    NO_HEARTS: 0,
    NO_MEN: 0,
    NO_QUEENS: 0,
    RIFKI: 0,
    LAST_TWO: 0,
    TRUMP: 0,
  };
}

function main(): void {
  const { games, seed } = parseArgs();
  const contractCounts = emptyContractCounts();
  let failures = 0;

  for (let i = 0; i < games; i++) {
    const gameSeed = seed + i;
    const state = playRandomGame(gameSeed);
    const total = state.totals.reduce((a, b) => a + b, 0);
    const ok = total === 0 && state.scoreTable.length === 20;
    if (!ok) {
      failures++;
      console.error(`[oyun ${i}] HATA: toplam=${total}, el sayısı=${state.scoreTable.length}`);
    }
    for (const row of state.scoreTable) {
      contractCounts[row.contract]++;
    }

    if (games === 1) {
      console.log(`Tohum: ${gameSeed}`);
      console.log(`Toplamlar: ${state.totals.join(', ')}`);
      console.log('Skor Tablosu:');
      for (const row of state.scoreTable) {
        const trump = row.trumpSuit ? `, koz ${row.trumpSuit}` : '';
        console.log(
          `  El ${String(row.handNo).padStart(2, ' ')} — ${row.contract.padEnd(10, ' ')} ` +
            `(oyuncu ${row.declarer}${trump}): ${row.scores.join(', ')} | kümülatif: ${row.cumulative.join(', ')}`,
        );
      }
    }
  }

  console.log(`\n${games} oyun oynandı, ${failures} hata.`);
  console.log('Kontrat dağılımı:', contractCounts);

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main();
