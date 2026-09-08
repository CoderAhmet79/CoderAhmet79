import AsyncStorage from '@react-native-async-storage/async-storage';

import { AgentLevel } from '../ai/agent';
import { GameState } from '../engine/types';

const GAME_KEY = 'rifki:game';

export type SavedGame = {
  state: GameState;
  level: AgentLevel;
};

export async function saveGame(state: GameState, level: AgentLevel): Promise<void> {
  try {
    await AsyncStorage.setItem(GAME_KEY, JSON.stringify({ state, level }));
  } catch {
    // Kayıt başarısız olsa da oyun akışı bozulmasın.
  }
}

export async function loadSavedGame(): Promise<SavedGame | null> {
  try {
    const raw = await AsyncStorage.getItem(GAME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedGame;
  } catch {
    return null;
  }
}

export async function clearSavedGame(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GAME_KEY);
  } catch {
    // yoksay
  }
}

export async function hasSavedGame(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(GAME_KEY);
    return raw != null;
  } catch {
    return false;
  }
}
