const memoryStores = new Map();

function createMemoryStorage(initial = {}) {
  const state = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return state.has(key) ? state.get(key) : null;
    },
    setItem(key, value) {
      state.set(key, String(value));
    },
    removeItem(key) {
      state.delete(key);
    },
    clear() {
      state.clear();
    },
  };
}

function resolveStorage(provided) {
  if (provided) return provided;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (!memoryStores.has('default')) {
    memoryStores.set('default', createMemoryStorage());
  }
  return memoryStores.get('default');
}

function readStorageJSON(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Unable to parse storage value', key, error);
    return fallback;
  }
}

function writeStorageJSON(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Unable to persist storage value', key, error);
  }
}

export { createMemoryStorage, resolveStorage, readStorageJSON, writeStorageJSON };
