import { Agent } from '../src/ai/agent';
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
import { Rng } from '../src/engine/rng';
import { defaultRuleSet, GameState, Suit } from '../src/engine/types';

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

export async function playFullGameWithAgents(
  seed: number,
  agents: [Agent, Agent, Agent, Agent],
): Promise<GameState> {
  let state = createGame(defaultRuleSet, seed);
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
      const chosen = await agents[player].chooseCard(publicView(state, player), legal);
      state = playCard(state, player, chosen);
    }
    state = nextHand(state);
  }

  return state;
}

export function randomAgent(rng: Rng): Agent {
  return {
    chooseContract: (_view, options) => options[Math.floor(rng.next() * options.length)],
    chooseTrump: () => SUITS[Math.floor(rng.next() * 4)],
    chooseCard: (_view, legal) => legal[Math.floor(rng.next() * legal.length)],
  };
}
