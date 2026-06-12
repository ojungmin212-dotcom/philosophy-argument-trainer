export const RESULTS_KEY = 'philosophyArgumentTrainer.results';

export function loadResults(store = globalThis.localStorage) {
  try {
    const rawValue = store?.getItem(RESULTS_KEY);
    if (!rawValue) return [];

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveResults(results, store = globalThis.localStorage) {
  store?.setItem(RESULTS_KEY, JSON.stringify(results));
}

export function createMemoryStorage() {
  const data = new Map();

  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    },
  };
}
