import { AppRouter } from "./app.routes.js";
import { APP_ROUTES, API_CONFIG } from "./app.config.js";
import { NavbarComponent } from "../modules/shared/components/navbar/navbar.component.js";
import { ModalComponent } from "../modules/shared/components/modal/modal.component.js";
import { LoaderComponent } from "../modules/shared/components/loader/loader.component.js";
import { PinService } from "../modules/pins/services/pin.service.js";
import { SavedService } from "../modules/saved/services/saved.service.js";
import { PinListComponent } from "../modules/pins/components/pin-list/pin-list.component.js";
import { SavedListComponent } from "../modules/saved/components/saved-list/saved-list.component.js";
import { SearchBarComponent } from "../modules/search/components/search-bar/search-bar.component.js";
import { TagFilterComponent } from "../modules/search/components/tag-filter/tag-filter.component.js";
import { ExploreMainComponent } from "../modules/explore/components/explore-main/explore-main.component.js";
import { ExploreService } from "../modules/explore/services/explore.service.js";
import { StorageUtils } from "../modules/shared/utils/storage.utils.js";

class LotusApp {
  constructor() {
    this.pinService = new PinService();
    this.savedService = new SavedService();
    this.exploreService = new ExploreService();

    this.currentQuery = "";
    this.currentMode = "feed";
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMore = true;
    this.fetchSeq = 0;
    this.hasRenderedExplore = false;

    this.gridContainer = document.getElementById("pins-grid");
    this.exploreView = document.getElementById("explore-view");
    this.template = document.getElementById("pin-card-template");
    this.categoriesContainer = document.getElementById("categories-bar");
    this.searchInput = document.getElementById("search-input");
    this.searchClear = document.getElementById("search-clear");
    this.sentinel = document.getElementById("scroll-sentinel");
    this.exploreHeader = document.getElementById("explore-header");
    this.exploreBackBtn = document.getElementById("explore-back-btn");
    this.exploreTopicTitle = document.getElementById("explore-topic-title");

    this.loader = new LoaderComponent();

    this.modal = new ModalComponent(
      (tag) => this.handleTagSelection(tag),
      (pin) => this.savedService.toggleSave(pin),
      (pin, page, limit, excludeIds) => this.pinService.getRelatedPins(pin, page, limit, excludeIds)
    );

    this.pinList = new PinListComponent(
      this.gridContainer,
      this.template,
      this.savedService,
      {
        onPinClick: (pin) => {
          const isSaved = this.savedService.isSaved(pin.id);
          this.modal.open(pin, isSaved);
        }
      }
    );

    this.savedList = new SavedListComponent(
      this.pinList,
      this.savedService,
      this.loader,
      () => this.router.navigate(APP_ROUTES.home)
    );

    this.exploreComponent = new ExploreMainComponent(
      this.exploreView,
      (tag, title) => this.router.navigate(`explore?topic=${encodeURIComponent(tag)}&title=${encodeURIComponent(title || tag)}`),
      this.exploreService
    );

    this.searchBar = new SearchBarComponent(
      this.searchInput,
      this.searchClear,
      (query) => this.handleSearch(query)
    );

    this.tagFilter = new TagFilterComponent(
      this.categoriesContainer,
      (tag) => {
        if (tag) {
          this.router.navigate(`topic=${encodeURIComponent(tag)}`);
        } else {
          this.router.navigate(APP_ROUTES.home);
        }
      }
    );

    this.loadDynamicTags();

    this.navbar = new NavbarComponent((route) => {
      this.router.navigate(route);
    });

    if (this.exploreBackBtn) {
      this.exploreBackBtn.addEventListener("click", () => {
        this.router.navigate(APP_ROUTES.explore);
      });
    }

    this.observer = null;
    this.initRouter();
    this.initIntersectionObserver();
    window._app = this;
  }

  initRouter() {
    this.router = new AppRouter({
      [APP_ROUTES.home]: () => this.showFeedView(),
      [APP_ROUTES.explore]: () => this.showExploreView(),
      explore: () => this.showExploreView(),
      explorar: () => this.showExploreView(),
      [APP_ROUTES.saved]: () => this.showSavedView(),
      saved: () => this.showSavedView(),
      guardados: () => this.showSavedView(),
      exploreTopic: (topic, title) => this.showExploreTopicView(topic, title),
      homeTopic: (topic) => this.showHomeTopicView(topic),
      search: (query) => this.showSearchView(query),
      pin: (pinId) => this.showPinModalById(pinId),
      default: () => this.showFeedView()
    });
  }

  setExploreViewVisible(isExplore) {
    this.exploreView.classList.toggle("d-none", !isExplore);
    this.gridContainer.classList.toggle("d-none", isExplore);
  }

  async showPinModalById(pinId) {
    if (!pinId) return;

    if (this.pinList.renderedPins.length === 0) {
      this.showFeedView();
    }

    const existing = this.pinList.renderedPins.find((p) => p.id === pinId)
      || this.savedService.getAllSaved().find((p) => p.id === pinId);

    if (existing) {
      this.modal.open(existing, this.savedService.isSaved(existing.id));
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
      return;
    }

    try {
      const pin = await this.pinService.getPinById(pinId);
      if (pin) {
        this.modal.open(pin, this.savedService.isSaved(pin.id));
        history.replaceState(null, document.title, window.location.pathname + window.location.search);
      }
    } catch {}
  }

  initIntersectionObserver() {
    if (!("IntersectionObserver" in window) || !this.sentinel) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isInfiniteScrollable = this.currentMode === "feed" || this.currentMode === "topic" || this.currentMode === "search";
        if (entry.isIntersecting && !this.isLoading && this.hasMore && isInfiniteScrollable) {
          if (this.modal && this.modal.isOpen) return;
          this.fetchMorePins();
        }
      },
      {
        rootMargin: "300px 0px"
      }
    );

    this.observer.observe(this.sentinel);
  }

  showFeedView() {
    this.navbar.setActive(APP_ROUTES.home);
    this.categoriesContainer.classList.remove("d-none");
    if (this.exploreHeader) this.exploreHeader.classList.add("d-none");
    this.setExploreViewVisible(false);
    this.searchBar.setValue("");
    this.tagFilter.selectByTag("");

    if (this.currentMode === "feed" && this.pinList.renderedPins.length > 0) {
      return;
    }

    this.currentMode = "feed";
    this.currentQuery = "";
    this.currentPage = 1;
    this.hasMore = true;

    if (this.pinList.renderedPins.length === 0) {
      this.loader.hideEnd();
      this.loader.hideEmpty();
      this.pinService.resetSession();
      this.fetchMorePins(true);
    }
  }

  showHomeTopicView(topic) {
    this.navbar.setActive(APP_ROUTES.home);
    this.categoriesContainer.classList.remove("d-none");
    if (this.exploreHeader) this.exploreHeader.classList.add("d-none");
    this.setExploreViewVisible(false);

    if (this.currentMode === "topic" && this.currentQuery === topic && this.pinList.renderedPins.length > 0) {
      return;
    }

    this.currentQuery = topic;
    this.currentMode = "topic";
    this.currentPage = 1;
    this.hasMore = true;
    this.searchBar.setValue("");
    this.tagFilter.selectByTag(topic);
    this.pinList.clear();
    this.loader.hideEnd();
    this.loader.hideEmpty();
    this.pinService.resetTopicSession();
    this.fetchMorePins(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  showExploreTopicView(topic, title) {
    this.navbar.setActive(APP_ROUTES.explore);
    this.categoriesContainer.classList.add("d-none");
    if (this.exploreHeader) {
      this.exploreHeader.classList.remove("d-none");
      if (this.exploreTopicTitle) {
        this.exploreTopicTitle.textContent = title || topic;
      }
    }
    this.setExploreViewVisible(false);

    if (this.currentMode === "topic" && this.currentQuery === topic && this.pinList.renderedPins.length > 0) {
      return;
    }

    this.currentQuery = topic;
    this.currentMode = "topic";
    this.currentPage = 1;
    this.hasMore = true;
    this.searchBar.setValue("");
    this.pinList.clear();
    this.loader.hideEnd();
    this.loader.hideEmpty();
    this.pinService.resetTopicSession();
    this.fetchMorePins(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  showSearchView(query) {
    this.navbar.setActive(APP_ROUTES.home);
    this.categoriesContainer.classList.remove("d-none");
    if (this.exploreHeader) this.exploreHeader.classList.add("d-none");
    this.setExploreViewVisible(false);

    if (this.currentMode === "search" && this.currentQuery === query && this.pinList.renderedPins.length > 0) {
      return;
    }

    this.currentQuery = query;
    this.currentMode = "search";
    this.currentPage = 1;
    this.hasMore = true;
    this.searchBar.setValue(query.replace(/_/g, " "));
    this.tagFilter.selectByTag(query);
    this.pinList.clear();
    this.loader.hideEnd();
    this.loader.hideEmpty();
    this.pinService.resetSearchSession();
    this.fetchMorePins(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async showExploreView() {
    this.fetchSeq += 1;
    this.navbar.setActive(APP_ROUTES.explore);
    this.categoriesContainer.classList.add("d-none");
    if (this.exploreHeader) this.exploreHeader.classList.add("d-none");
    this.setExploreViewVisible(true);
    this.currentMode = "explore";
    this.hasMore = false;
    this.loader.hideEnd();
    this.loader.hideEmpty();

    if (!this.hasRenderedExplore) {
      this.loader.show();
      const rendered = await this.exploreComponent.render();
      if (rendered) {
        this.hasRenderedExplore = true;
      }
      this.loader.hide();
    }
  }

  showSavedView() {
    this.fetchSeq += 1;
    this.navbar.setActive(APP_ROUTES.saved);
    this.categoriesContainer.classList.add("d-none");
    if (this.exploreHeader) this.exploreHeader.classList.add("d-none");
    this.setExploreViewVisible(false);
    this.currentMode = "saved";
    this.hasMore = false;
    this.pinList.clear();
    this.loader.hide();
    this.loader.hideEnd();
    this.savedList.render();
  }

  handleSearch(query) {
    const clean = (query || "").trim();
    if (clean) {
      StorageUtils.addRecentSearch(clean);
      this.router.navigate(`search=${encodeURIComponent(clean)}`);
    } else {
      this.router.navigate(APP_ROUTES.home);
    }
  }

  async loadDynamicTags() {
    try {
      const data = await this.exploreService.getExploreData();
      const tags = [];
      if (Array.isArray(data.boards)) {
        data.boards.forEach((b) => {
          if (b.title && b.tag) {
            tags.push({ label: b.title, query: b.tag });
          }
        });
      }
      if (Array.isArray(data.popularSections)) {
        data.popularSections.forEach((s) => {
          if (s.title && s.tag) {
            tags.push({ label: s.title, query: s.tag });
          }
        });
      }
      if (tags.length > 0) {
        this.tagFilter.setTags(tags);
        this.hasLoadedTrendingTags = true;
      }
    } catch {}
  }

  handleTagSelection(tag) {
    if (this.modal) {
      if (typeof this.modal.closeForNavigation === "function") {
        this.modal.closeForNavigation();
      } else {
        this.modal.close();
      }
    }
    this.router.navigate(`search=${encodeURIComponent(tag)}`);
  }

  async fetchMorePins(reset = false) {
    if (this.isLoading && !reset) return;
    if (!this.hasMore && !reset) return;

    this.isLoading = true;
    this.loader.show();
    this.loader.hideEmpty();

    this.fetchSeq += 1;
    const currentSeq = this.fetchSeq;

    try {
      let result;
      if (this.currentMode === "topic") {
        result = await this.pinService.getTopicPins(
          this.currentQuery,
          this.currentPage,
          API_CONFIG.defaultLimit
        );
      } else if (this.currentMode === "search") {
        result = await this.pinService.searchPins(
          this.currentQuery,
          this.currentPage,
          API_CONFIG.defaultLimit
        );
      } else {
        result = await this.pinService.getFeedPins(
          this.currentPage,
          API_CONFIG.defaultLimit
        );
      }

      if (currentSeq !== this.fetchSeq) return;

      const pins = result?.pins || [];
      this.hasMore = Boolean(result?.hasNextPage);

      if (reset && pins.length === 0) {
        this.loader.showEmpty();
        this.hasMore = false;
        return;
      }

      this.loader.hideEmpty();
      if (!this.hasLoadedTrendingTags && this.tagFilter.chips.length <= 1) {
        const extracted = [];
        const seen = new Set();
        pins.forEach((p) => {
          if (Array.isArray(p.tags)) {
            p.tags.forEach((t) => {
              const q = typeof t === "string" ? t : t.query;
              const l = typeof t === "string" ? t : t.label;
              if (q && !seen.has(q) && q.length > 3 && !/(hair|eyes|dress|skirt|highres|absurdres|1girl|1boy|solo)/i.test(q)) {
                seen.add(q);
                extracted.push({ label: l, query: q });
              }
            });
          }
        });
        if (extracted.length > 0) {
          this.tagFilter.setTags(extracted);
        }
      }
      this.pinList.renderPins(pins);
      this.currentPage += 1;

      if (!this.hasMore) {
        this.loader.showEnd();
      }
    } catch {
      if (currentSeq !== this.fetchSeq) return;
      if (reset) {
        this.loader.showEmpty();
      }
    } finally {
      if (currentSeq === this.fetchSeq) {
        this.isLoading = false;
        this.loader.hide();
      }
    }
  }
}

new LotusApp();
