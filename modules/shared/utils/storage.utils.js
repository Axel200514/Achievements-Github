const STORAGE_KEY = "lotus_saved_pins";

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
}
