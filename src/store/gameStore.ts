import { InteractionManager } from 'react-native';
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
import { clearSavedGame, saveGame } from './persistence';
import { AnimationSpeed, useSettingsStore } from './settingsStore';
import { useStatsStore } from './statsStore';

export const HUMAN_PLAYER: PlayerId = 0;

// Bilgisayarın "düşünme süresi": MEDIUM anında karar verir, bu yüzden
// kartlar birbirine yapışık atılmasın diye yapay bir bekleme uygulanır.
// HARD'ın kendi PIMC hesabı zaten gerçek süreyi alır; yalnızca bir alt
// sınır (en az görünür süre) uygulanır.
const MEDIUM_THINK_MS: [number, number] = [400, 700];
const HARD_MIN_VISIBLE_MS = 500;

const SPEED_MULTIPLIER: Record<AnimationSpeed, number> = {
  slow: 1.6,
  normal: 1,
  fast: 0.6,
};

function speedMultiplier(): number {
  return SPEED_MULTIPLIER[useSettingsStore.getState().settings.animationSpeed];
}

function mediumThinkDelay(): number {
  const [min, max] = MEDIUM_THINK_MS;
  return (min + Math.random() * (max - min)) * speedMultiplier();
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

// HARD'ın hesaplaması sürerken dokunma/animasyon tepkiselliğini bozmasın
// diye, bekleyen etkileşimler bitene kadar başlatılmasını erteler.
function runAfterInteractions<T>(fn: () => Promise<T> | T): Promise<T> {
  return new Promise((resolve, reject) => {
    InteractionManager.runAfterInteractions(() => {
      Promise.resolve(fn()).then(resolve, reject);
    });
  });
}

function buildAgents(level: AgentLevel, seed: number, ruleSet: RuleSet): Partial<Record<PlayerId, Agent>> {
  const agents: Partial<Record<PlayerId, Agent>> = {};
  ([1, 2, 3] as PlayerId[]).forEach((id, i) => {
    agents[id] = createAgent(level, createRng(seed + (i + 1) * 97), ruleSet);
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
  // Her hamleden sonra tek giriş noktası: state'i uygular, otomatik kaydeder
  // ve oyun bittiyse istatistiğe yazıp kayıtlı oyunu temizler.
  function applyState(next: GameState) {
    set({ state: next });
    if (next.phase === 'GAME_OVER') {
      useStatsStore.getState().recordGame(next);
      clearSavedGame();
    } else {
      saveGame(next, get().level);
    }
  }

  function scheduleAI() {
    const { state, level } = get();
    if (!state) return;

    if (state.phase === 'CHOOSE_CONTRACT' || state.phase === 'CHOOSE_TRUMP') {
      const declarer = state.hand!.declarer;
      if (declarer === HUMAN_PLAYER) return;
      const phaseAtSchedule = state.phase;

      runAfterInteractions(async () => {
        const before = get().state;
        if (!before || before.phase !== phaseAtSchedule) return;
        const agent = get().agents[declarer];
        if (!agent) return;
        const start = Date.now();

        if (phaseAtSchedule === 'CHOOSE_CONTRACT') {
          const options = availableContracts(before, declarer);
          const contract = await agent.chooseContract(publicView(before, declarer), options);
          if (level === 'MEDIUM') await wait(mediumThinkDelay());
          else await wait(HARD_MIN_VISIBLE_MS * speedMultiplier() - (Date.now() - start));
          const latest = get().state;
          if (!latest || latest.phase !== 'CHOOSE_CONTRACT' || latest.hand?.declarer !== declarer) return;
          applyState(engineChooseContract(latest, contract));
        } else {
          const suit = await agent.chooseTrump(publicView(before, declarer));
          if (level === 'MEDIUM') await wait(mediumThinkDelay());
          else await wait(HARD_MIN_VISIBLE_MS * speedMultiplier() - (Date.now() - start));
          const latest = get().state;
          if (!latest || latest.phase !== 'CHOOSE_TRUMP') return;
          applyState(engineChooseTrump(latest, suit));
        }
        scheduleAI();
      });
      return;
    }

    if (state.phase === 'PLAYING') {
      const turn = state.hand!.turn;
      if (turn === HUMAN_PLAYER) return;

      runAfterInteractions(async () => {
        const before = get().state;
        if (!before || before.phase !== 'PLAYING') return;
        const player = before.hand!.turn;
        if (player === HUMAN_PLAYER) return;
        const agent = get().agents[player];
        if (!agent) return;

        const start = Date.now();
        const legal = legalPlays(before, player);
        const card = await agent.chooseCard(publicView(before, player), legal);
        if (level === 'MEDIUM') await wait(mediumThinkDelay());
        else await wait(HARD_MIN_VISIBLE_MS * speedMultiplier() - (Date.now() - start));

        const latest = get().state;
        if (!latest || latest.phase !== 'PLAYING' || latest.hand!.turn !== player) return;
        applyState(enginePlayCard(latest, player, card));
        scheduleAI();
      });
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
      const resolvedRuleSet = ruleSet ?? defaultRuleSet;
      let state = createGame(resolvedRuleSet, seed, players);
      state = engineNextHand(state);
      set({ state, level, agents: buildAgents(level, seed, resolvedRuleSet) });
      saveGame(state, level);
      scheduleAI();
    },

    loadGame: (state, level) => {
      set({ state, level, agents: buildAgents(level, state.seed, state.ruleSet) });
      scheduleAI();
    },

    chooseContract: (contract) => {
      const { state } = get();
      if (!state) return;
      applyState(engineChooseContract(state, contract));
      scheduleAI();
    },

    chooseTrump: (suit) => {
      const { state } = get();
      if (!state) return;
      applyState(engineChooseTrump(state, suit));
      scheduleAI();
    },

    playCard: (card) => {
      const { state } = get();
      if (!state) return;
      applyState(enginePlayCard(state, HUMAN_PLAYER, card));
      scheduleAI();
    },

    continueAfterHandOver: () => {
      const { state } = get();
      if (!state) return;
      applyState(engineNextHand(state));
      scheduleAI();
    },

    resetGame: () => set({ state: null, agents: {} }),
  };
});
