const STORAGE_KEY = "lotus_saved_pins";
const RECENT_SEARCHES_KEY = "lotus_recent_searches";

const NOISY_TAGS_REGEX = /^(1girl|1boy|solo|breasts|hair|eyes|dress|skirt|clothes|uniform|shirt|pants|boots|shoes|gloves|highres|absurdres|monochrome|greyscale|long_hair|short_hair|black_hair|blonde_hair|brown_hair|blue_hair|white_hair|looking_at_viewer|open_mouth|smile|blush|simple_background|white_background)$/i;

export class StorageUtils {
  static getSavedPins() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static isSaved(pinId) {
    const list = this.getSavedPins();
    return list.some((p) => String(p.id) === String(pinId));
  }

  static toggleSave(pin) {
    const list = this.getSavedPins();
    const index = list.findIndex((p) => String(p.id) === String(pin.id));

    if (index >= 0) {
      list.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return false;
    } else {
      list.unshift(pin);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    }
  }

  static getRecentSearches() {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static addRecentSearch(query) {
    const clean = (query || "").trim();
    if (!clean || clean.length < 2) return;
    const list = this.getRecentSearches().filter(
      (item) => item.toLowerCase() !== clean.toLowerCase()
    );
    list.unshift(clean);
    const capped = list.slice(0, 10);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(capped));
    } catch {}
  }

  static removeRecentSearch(query) {
    const clean = (query || "").trim().toLowerCase();
    const list = this.getRecentSearches().filter(
      (item) => item.toLowerCase() !== clean
    );
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
    } catch {}
  }

  static clearRecentSearches() {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  }

  static getUserTasteTags() {
    const saved = this.getSavedPins();
    const tagCounts = new Map();

    saved.forEach((pin) => {
      if (Array.isArray(pin.tags)) {
        pin.tags.forEach((t) => {
          const raw = typeof t === "string" ? t : t.query || t.label;
          if (raw && raw.length > 2 && !NOISY_TAGS_REGEX.test(raw)) {
            const normalized = raw.toLowerCase().replace(/_/g, " ").trim();
            tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1);
          }
        });
      }
    });

    const sorted = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    return sorted.slice(0, 5);
  }
}
