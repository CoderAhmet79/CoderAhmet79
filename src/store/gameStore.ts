import { create } from 'zustand';

import { Agent, AgentLevel, createAgent } from '../ai/agent';
import {
  availableContracts,
  chooseContract as engineChooseContract,
  chooseTrump as engineChooseTrump,
  createGame,
  legalPlays,
  nextHand as engineNextHand,
  playCard as enginePlayCard,
} from '../engine/game';
import { publicView } from '../engine/publicView';
import { createRng } from '../engine/rng';
import { Card, Contract, defaultRuleSet, GameState, Player, PlayerId, RuleSet, Suit } from '../engine/types';

export const HUMAN_PLAYER: PlayerId = 0;

// Bilgisayarın "düşünme süresi": kartlar birbirine yapışık atılmasın diye.
// HARD adım 8'de gerçek PIMC hesap süresine göre güncellenecek.
const THINK_MS: Record<AgentLevel, [number, number]> = {
  MEDIUM: [400, 700],
  HARD: [500, 900],
};

function randomDelay(level: AgentLevel): number {
  const [min, max] = THINK_MS[level];
  return min + Math.random() * (max - min);
}

function buildAgents(level: AgentLevel, seed: number): Partial<Record<PlayerId, Agent>> {
  const agents: Partial<Record<PlayerId, Agent>> = {};
  ([1, 2, 3] as PlayerId[]).forEach((id, i) => {
    agents[id] = createAgent(level, createRng(seed + (i + 1) * 97));
  });
  return agents;
}

type GameStore = {
  state: GameState | null;
  level: AgentLevel;
  agents: Partial<Record<PlayerId, Agent>>;

  startNewGame: (opts: {
    level: AgentLevel;
    playerNames: [string, string, string, string];
    ruleSet?: RuleSet;
  }) => void;
  loadGame: (state: GameState, level: AgentLevel) => void;
  chooseContract: (contract: Contract) => void;
  chooseTrump: (suit: Suit) => void;
  playCard: (card: Card) => void;
  continueAfterHandOver: () => void;
  resetGame: () => void;
};

export const useGameStore = create<GameStore>((set, get) => {
  function scheduleAI() {
    const { state, level } = get();
    if (!state) return;

    if (state.phase === 'CHOOSE_CONTRACT' || state.phase === 'CHOOSE_TRUMP') {
      const declarer = state.hand!.declarer;
      if (declarer === HUMAN_PLAYER) return;
      const phaseAtSchedule = state.phase;
      setTimeout(() => {
        const current = get().state;
        if (!current || current.phase !== phaseAtSchedule) return;
        const agent = get().agents[declarer];
        if (!agent) return;
        if (phaseAtSchedule === 'CHOOSE_CONTRACT') {
          const options = availableContracts(current, declarer);
          const contract = agent.chooseContract(publicView(current, declarer), options);
          set({ state: engineChooseContract(current, contract) });
        } else {
          const suit = agent.chooseTrump(publicView(current, declarer));
          set({ state: engineChooseTrump(current, suit) });
        }
        scheduleAI();
      }, randomDelay(level));
      return;
    }

    if (state.phase === 'PLAYING') {
      const turn = state.hand!.turn;
      if (turn === HUMAN_PLAYER) return;
      setTimeout(() => {
        const current = get().state;
        if (!current || current.phase !== 'PLAYING') return;
        const player = current.hand!.turn;
        if (player === HUMAN_PLAYER) return;
        const agent = get().agents[player];
        if (!agent) return;
        const legal = legalPlays(current, player);
        const card = agent.chooseCard(publicView(current, player), legal);
        set({ state: enginePlayCard(current, player, card) });
        scheduleAI();
      }, randomDelay(level));
    }
  }

  return {
    state: null,
    level: 'MEDIUM',
    agents: {},

    startNewGame: ({ level, playerNames, ruleSet }) => {
      const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
      const players: Player[] = [
        { id: 0, name: playerNames[0].trim() || 'Sen', isHuman: true },
        { id: 1, name: playerNames[1].trim() || 'Kemal', isHuman: false },
        { id: 2, name: playerNames[2].trim() || 'Ayşe', isHuman: false },
        { id: 3, name: playerNames[3].trim() || 'Selim', isHuman: false },
      ];
      let state = createGame(ruleSet ?? defaultRuleSet, seed, players);
      state = engineNextHand(state);
      set({ state, level, agents: buildAgents(level, seed) });
      scheduleAI();
    },

    loadGame: (state, level) => {
      set({ state, level, agents: buildAgents(level, state.seed) });
      scheduleAI();
    },

    chooseContract: (contract) => {
      const { state } = get();
      if (!state) return;
      set({ state: engineChooseContract(state, contract) });
      scheduleAI();
    },

    chooseTrump: (suit) => {
      const { state } = get();
      if (!state) return;
      set({ state: engineChooseTrump(state, suit) });
      scheduleAI();
    },

    playCard: (card) => {
      const { state } = get();
      if (!state) return;
      set({ state: enginePlayCard(state, HUMAN_PLAYER, card) });
      scheduleAI();
    },

    continueAfterHandOver: () => {
      const { state } = get();
      if (!state) return;
      set({ state: engineNextHand(state) });
      scheduleAI();
    },

    resetGame: () => set({ state: null, agents: {} }),
  };
});
