import { readStorageJSON, resolveStorage, writeStorageJSON } from './storage.js';

const CACHE_KEY = 'learning-content-cache-v1';

class LearningContentRepository {
  constructor({ basePath = '/content/learning', defaultLanguage = 'en', fetcher, storage } = {}) {
    this.basePath = basePath;
    this.defaultLanguage = defaultLanguage;
    this.fetcher = fetcher ?? (typeof fetch !== 'undefined' ? fetch.bind(window ?? globalThis) : null);
    this.storage = resolveStorage(storage);
    this.cache = new Map();
    this.loadCacheFromStorage();
  }

  loadCacheFromStorage() {
    const saved = readStorageJSON(this.storage, CACHE_KEY, null);
    if (!saved || typeof saved !== 'object') return;
    Object.entries(saved).forEach(([language, payload]) => {
      if (payload && typeof payload === 'object') {
        this.cache.set(language, payload);
      }
    });
  }

  persistCache() {
    const serialisable = {};
    this.cache.forEach((value, key) => {
      serialisable[key] = value;
    });
    writeStorageJSON(this.storage, CACHE_KEY, serialisable);
  }

  async loadLanguage(language) {
    const target = language || this.defaultLanguage;
    if (this.cache.has(target)) {
      return this.cache.get(target);
    }

    const payload = await this.fetchLanguagePayload(target);
    if (payload) {
      this.cache.set(target, payload);
      this.persistCache();
      return payload;
    }

    if (target !== this.defaultLanguage) {
      return this.loadLanguage(this.defaultLanguage);
    }

    throw new Error(`Unable to load learning content for ${target}`);
  }

  async fetchLanguagePayload(language) {
    if (!this.fetcher) {
      throw new Error('No fetch implementation available');
    }
    const url = `${this.basePath}/${language}.json`;
    const response = await this.fetcher(url, { cache: 'no-store' });
    const body = await this.extractJson(response);
    return normaliseContent(body ?? {});
  }

  async extractJson(response) {
    if (!response) return null;
    if (typeof response.json === 'function') {
      return response.json();
    }
    if (typeof response.text === 'function') {
      const text = await response.text();
      return JSON.parse(text);
    }
    return response;
  }

  getDailyChallenge(language, date = new Date()) {
    const payload = this.cache.get(language) ?? this.cache.get(this.defaultLanguage);
    if (!payload) return null;
    return resolveDailyChallenge(payload, date);
  }
}

function normaliseContent(raw) {
  const modules = Array.isArray(raw.modules) ? raw.modules.filter(Boolean) : [];
  const quests = Array.isArray(raw.quests) ? raw.quests.filter(Boolean) : [];
  const moduleMap = new Map();
  modules.forEach((module) => {
    if (!module || !module.id) return;
    const clone = {
      ...module,
      steps: Array.isArray(module.steps) ? module.steps.filter(Boolean) : [],
    };
    moduleMap.set(module.id, clone);
  });

  const questList = quests
    .map((quest) => {
      if (!quest || !quest.id || !quest.moduleId) return null;
      if (!moduleMap.has(quest.moduleId)) return null;
      return {
        id: quest.id,
        title: quest.title ?? quest.id,
        summary: quest.summary ?? '',
        moduleId: quest.moduleId,
        rewardPoints: Number(quest.rewardPoints ?? 0),
        rewardLabel: quest.rewardLabel ?? quest.title ?? quest.id,
      };
    })
    .filter(Boolean);

  const dailyChallenges = normaliseDaily(raw.dailyChallenges, questList);

  return {
    meta: raw.meta ?? {},
    modules: Array.from(moduleMap.values()),
    quests: questList,
    dailyChallenges,
  };
}

function normaliseDaily(daily, quests) {
  if (!daily || typeof daily !== 'object') {
    return { default: null, schedule: [] };
  }
  const defaultChallenge = daily.default && typeof daily.default === 'object' ? { ...daily.default } : null;
  const schedule = Array.isArray(daily.schedule) ? daily.schedule.filter(Boolean) : [];
  const questSet = new Set(quests.map((quest) => quest.id));

  const safeDefault = defaultChallenge && questSet.has(defaultChallenge.questId) ? defaultChallenge : null;
  const safeSchedule = schedule
    .map((entry) => {
      const weekday = typeof entry.weekday === 'number' ? entry.weekday : null;
      if (weekday === null || !questSet.has(entry.questId)) return null;
      return {
        weekday,
        questId: entry.questId,
        bonusPoints: Number(entry.bonusPoints ?? defaultChallenge?.bonusPoints ?? 0),
      };
    })
    .filter((entry) => entry !== null);

  return {
    default: safeDefault,
    schedule: safeSchedule,
  };
}

function resolveDailyChallenge(payload, date = new Date()) {
  if (!payload) return null;
  const schedule = payload.dailyChallenges?.schedule ?? [];
  const weekday = date.getDay();
  const scheduled = schedule.find((entry) => entry.weekday === weekday);
  const challenge = scheduled ?? payload.dailyChallenges?.default ?? null;
  if (!challenge) return null;
  const quest = payload.quests.find((item) => item.id === challenge.questId);
  if (!quest) return null;
  return {
    quest,
    bonusPoints: Number(challenge.bonusPoints ?? 0),
  };
}

export { LearningContentRepository, normaliseContent, resolveDailyChallenge };
