import { API_CONFIG } from "../../../app/app.config.js";

export class ExploreService {
  constructor() {
    this.cachedData = null;
    this.pendingPromise = null;
  }

  async getExploreData() {
    if (
      this.cachedData &&
      Array.isArray(this.cachedData.boards) &&
      this.cachedData.boards.length >= 4 &&
      Array.isArray(this.cachedData.popularSections) &&
      this.cachedData.popularSections.length >= 3
    ) {
      return this.cachedData;
    }

    if (!this.pendingPromise) {
      this.pendingPromise = this.fetchExploreData()
        .then((data) => {
          if (
            data &&
            Array.isArray(data.boards) &&
            data.boards.length >= 4 &&
            Array.isArray(data.popularSections) &&
            data.popularSections.length >= 3
          ) {
            this.cachedData = data;
          }
          this.pendingPromise = null;
          return data;
        })
        .catch(() => {
          this.pendingPromise = null;
          return { boards: [], popularSections: [] };
        });
    }
    return this.pendingPromise;
  }

  async fetchExploreData() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const url = `${API_CONFIG.trendingEndpoint}?_cb=${Date.now()}`;
      const res = await fetch(url, {
        signal: controller.signal,
        cache: "no-cache"
      });
      clearTimeout(timeoutId);

      if (!res.ok) return { boards: [], popularSections: [] };

      const data = await res.json();
      if (data && Array.isArray(data.boards) && Array.isArray(data.popularSections)) {
        return data;
      }
      return { boards: [], popularSections: [] };
    } catch {
      return { boards: [], popularSections: [] };
    }
  }

  async getFeaturedBoards() {
    const data = await this.getExploreData();
    return data.boards || [];
  }

  async getPopularSections() {
    const data = await this.getExploreData();
    return data.popularSections || [];
  }
}

