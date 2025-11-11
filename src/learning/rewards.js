import { resolveStorage, readStorageJSON, writeStorageJSON } from './storage.js';

const STORAGE_KEY = 'learning-reward-ledger-v1';
const DEFAULT_RATE = 0.04; // REAL tokens per XP point

function createRewardLedger({ storage, conversionRate = DEFAULT_RATE, clock } = {}) {
  const resolvedStorage = resolveStorage(storage);
  const now = () => (clock && typeof clock.now === 'function' ? clock.now() : Date.now());
  let state = readStorageJSON(resolvedStorage, STORAGE_KEY, null);
  if (!state) {
    state = {
      history: [],
      totalTokens: 0,
    };
  }

  function persist() {
    writeStorageJSON(resolvedStorage, STORAGE_KEY, state);
  }

  function registerReward(points, meta = {}) {
    const numeric = Number(points ?? 0);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return {
        recorded: false,
        tokens: 0,
        entry: null,
        totalTokens: state.totalTokens,
      };
    }
    const tokens = Number((numeric * conversionRate).toFixed(4));
    const entry = {
      id: `reward-${now()}-${Math.random().toString(16).slice(2, 8)}`,
      timestamp: now(),
      points: numeric,
      tokens,
      meta,
    };
    state.history.unshift(entry);
    state.history = state.history.slice(0, 25);
    state.totalTokens = Number((state.totalTokens + tokens).toFixed(4));
    persist();
    return {
      recorded: true,
      tokens,
      entry,
      totalTokens: state.totalTokens,
    };
  }

  function getSummary() {
    return {
      totalTokens: state.totalTokens,
      history: state.history.slice(),
      conversionRate,
    };
  }

  function reset() {
    state = { history: [], totalTokens: 0 };
    persist();
  }

  return {
    registerReward,
    getSummary,
    reset,
  };
}

export { createRewardLedger, DEFAULT_RATE };
