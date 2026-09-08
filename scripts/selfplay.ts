// Headless self-play runner: plays full 20-hand Rıfkı games with a
// configurable agent per seat, verifies the zero-sum invariant, and
// prints per-level score summaries. With no --levels flag every seat
// plays uniformly random legal moves — the acceptance check for step 3
// of the build plan (docs/RIFKI_SPEC.md section 11): if totals always sum
// to zero, the engine's rules and scoring are self-consistent.
//
// --levels=R,M,R,R assigns RANDOM/MEDIUM/HARD per seat (in turn order) so
// step 4/8's acceptance criteria (MEDIUM beats random, HARD beats MEDIUM)
// can be checked from the command line, e.g.:
//   npm run selfplay -- --games=500 --levels=M,R,R,R
import { createAgent, Agent, AgentLevel } from '../src/ai/agent';
import {
  availableContracts,
  chooseContract,
  chooseTrump,
  createGame,
  legalPlays,
  nextHand,
  playCard,
} from '../src/engine/game';
import { publicView } from '../src/engine/publicView';
import { createRng, Rng } from '../src/engine/rng';
import { Contract, defaultRuleSet, GameState, Suit } from '../src/engine/types';

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

type SeatLevel = 'RANDOM' | AgentLevel;

function createRandomAgent(rng: Rng): Agent {
  return {
    chooseContract: (_view, options) => options[Math.floor(rng.next() * options.length)],
    chooseTrump: () => SUITS[Math.floor(rng.next() * 4)],
    chooseCard: (_view, legal) => legal[Math.floor(rng.next() * legal.length)],
  };
}

function buildAgent(level: SeatLevel, rng: Rng): Agent {
  if (level === 'RANDOM') return createRandomAgent(rng);
  return createAgent(level, rng);
}

async function playGame(
  seed: number,
  levels: [SeatLevel, SeatLevel, SeatLevel, SeatLevel],
): Promise<GameState> {
  let state = createGame(defaultRuleSet, seed);
  const agents = levels.map((level, i) => buildAgent(level, createRng(seed * 7919 + i * 104729 + 1)));
  state = nextHand(state);

  while (state.phase !== 'GAME_OVER') {
    const declarer = state.hand!.declarer;
    const options = availableContracts(state, declarer);
    const contract = await agents[declarer].chooseContract(publicView(state, declarer), options);
    state = chooseContract(state, contract);
    if (state.phase === 'CHOOSE_TRUMP') {
      const suit = await agents[declarer].chooseTrump(publicView(state, declarer));
      state = chooseTrump(state, suit);
    }
    while (state.phase === 'PLAYING') {
      const player = state.hand!.turn;
      const legal = legalPlays(state, player);
      const card = await agents[player].chooseCard(publicView(state, player), legal);
      state = playCard(state, player, card);
    }
    state = nextHand(state);
  }

  return state;
}

function parseLevels(value: string | undefined): [SeatLevel, SeatLevel, SeatLevel, SeatLevel] {
  const map: Record<string, SeatLevel> = { R: 'RANDOM', M: 'MEDIUM', H: 'HARD' };
  const tokens = (value ?? 'R,R,R,R').split(',').map((t) => t.trim().toUpperCase());
  const levels = tokens.map((t) => map[t] ?? 'RANDOM');
  while (levels.length < 4) levels.push('RANDOM');
  return levels.slice(0, 4) as [SeatLevel, SeatLevel, SeatLevel, SeatLevel];
}

function parseArgs(): { games: number; seed: number; levels: [SeatLevel, SeatLevel, SeatLevel, SeatLevel] } {
  const args = process.argv.slice(2);
  let games = 1;
  let seed = 1;
  let levels: [SeatLevel, SeatLevel, SeatLevel, SeatLevel] = ['RANDOM', 'RANDOM', 'RANDOM', 'RANDOM'];
  for (const arg of args) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    if (key === 'games' && value) games = Number(value);
    if (key === 'seed' && value) seed = Number(value);
    if (key === 'levels') levels = parseLevels(value);
  }
  return { games, seed, levels };
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

async function main(): Promise<void> {
  const { games, seed, levels } = parseArgs();
  const contractCounts = emptyContractCounts();
  const totalsSum = [0, 0, 0, 0];
  let failures = 0;

  for (let i = 0; i < games; i++) {
    const gameSeed = seed + i;
    const state = await playGame(gameSeed, levels);
    const total = state.totals.reduce((a, b) => a + b, 0);
    const ok = total === 0 && state.scoreTable.length === 20;
    if (!ok) {
      failures++;
      console.error(`[oyun ${i}] HATA: toplam=${total}, el sayısı=${state.scoreTable.length}`);
    }
    for (const row of state.scoreTable) contractCounts[row.contract]++;
    for (let p = 0; p < 4; p++) totalsSum[p] += state.totals[p];

    if (games === 1) {
      console.log(`Tohum: ${gameSeed}`);
      console.log(`Seviyeler: ${levels.join(', ')}`);
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
  console.log(
    'Ortalama toplam (oyuncu bazında):',
    totalsSum.map((t, i) => `${i}(${levels[i]}): ${(t / games).toFixed(1)}`).join('  '),
  );

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
