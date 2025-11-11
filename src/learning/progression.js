import { resolveStorage, readStorageJSON, writeStorageJSON } from './storage.js';

const STORAGE_KEY = 'learning-progression-v1';
const LEVEL_STEP = 120;

function determineLevel(xp) {
  return Math.floor(Math.max(0, xp) / LEVEL_STEP) + 1;
}

function nextLevelThreshold(level) {
  return level * LEVEL_STEP;
}

function getDateKey(date) {
  if (!(date instanceof Date)) {
    return String(date ?? '').slice(0, 10);
  }
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createProgressionManager({ storage, clock } = {}) {
  const resolvedStorage = resolveStorage(storage);
  const now = () => (clock && typeof clock.now === 'function' ? clock.now() : Date.now());
  let state = readStorageJSON(resolvedStorage, STORAGE_KEY, null);
  if (!state) {
    state = {
      xp: 0,
      level: 1,
      daily: {
        lastCompletion: null,
        lastTimestamp: null,
        streak: 0,
      },
      questCompletions: {},
    };
  }

  function persist() {
    writeStorageJSON(resolvedStorage, STORAGE_KEY, state);
  }

  function awardPoints(points, meta = {}) {
    const numeric = Number(points ?? 0);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return {
        awarded: false,
        points: 0,
        xp: state.xp,
        level: state.level,
        leveledUp: false,
        xpToNextLevel: Math.max(0, nextLevelThreshold(state.level) - state.xp),
        meta,
      };
    }
    const previousLevel = state.level;
    state.xp += numeric;
    state.level = determineLevel(state.xp);
    const leveledUp = state.level > previousLevel;
    persist();
    return {
      awarded: true,
      points: numeric,
      xp: state.xp,
      level: state.level,
      leveledUp,
      xpToNextLevel: Math.max(0, nextLevelThreshold(state.level) - state.xp),
      meta,
    };
  }

  function registerQuestCompletion(questId, points, meta = {}) {
    if (!questId) {
      return awardPoints(points, meta);
    }
    const count = state.questCompletions?.[questId] ?? 0;
    state.questCompletions[questId] = count + 1;
    const result = awardPoints(points, { ...meta, questId });
    persist();
    return {
      ...result,
      completions: state.questCompletions[questId],
    };
  }

  function completeDailyChallenge({ dateKey = getDateKey(new Date(now())), questId, bonusPoints = 0 } = {}) {
    if (!dateKey) {
      return { awarded: false, streak: state.daily.streak, points: 0 };
    }
    if (state.daily.lastCompletion === dateKey) {
      return {
        awarded: false,
        streak: state.daily.streak,
        points: 0,
      };
    }

    const currentTimestamp = Date.parse(`${dateKey}T00:00:00Z`);
    if (Number.isFinite(currentTimestamp) && Number.isFinite(state.daily.lastTimestamp)) {
      const diffDays = Math.round((currentTimestamp - state.daily.lastTimestamp) / 86_400_000);
      if (diffDays === 1) {
        state.daily.streak += 1;
      } else if (diffDays > 1 || diffDays < 0) {
        state.daily.streak = 1;
      }
    } else {
      state.daily.streak = Math.max(1, state.daily.streak || 0);
    }

    state.daily.lastCompletion = dateKey;
    state.daily.lastTimestamp = Number.isFinite(currentTimestamp) ? currentTimestamp : now();
    const result = awardPoints(bonusPoints, { reason: 'dailyBonus', questId, dateKey });
    persist();
    return {
      ...result,
      streak: state.daily.streak,
    };
  }

  function getState() {
    const xpToNext = Math.max(0, nextLevelThreshold(state.level) - state.xp);
    return {
      xp: state.xp,
      level: state.level,
      xpToNextLevel: xpToNext,
      streak: state.daily.streak ?? 0,
      lastDaily: state.daily.lastCompletion ?? null,
      questCompletions: { ...state.questCompletions },
    };
  }

  function reset() {
    state = {
      xp: 0,
      level: 1,
      daily: {
        lastCompletion: null,
        lastTimestamp: null,
        streak: 0,
      },
      questCompletions: {},
    };
    persist();
  }

  return {
    awardPoints,
    registerQuestCompletion,
    completeDailyChallenge,
    getState,
    reset,
  };
}

export { LEVEL_STEP, createProgressionManager, determineLevel, getDateKey, nextLevelThreshold };
