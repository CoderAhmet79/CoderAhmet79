export interface Rng {
  next(): number; // [0, 1)
  getState(): number;
}

// mulberry32 — small, fast, deterministic PRNG. Good enough for shuffling
// and reproducible tests; not cryptographic.
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next(): number {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    getState(): number {
      return state >>> 0;
    },
  };
}
