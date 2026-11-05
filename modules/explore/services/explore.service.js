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
