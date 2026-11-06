import { showToast, copyToClipboard } from "../../utils/ui.utils.js";
import { API_CONFIG } from "../../../../app/app.config.js";

export class ModalComponent {
  constructor(onTagClick, onToggleSave, fetchRelatedPins) {
    this.onTagClick = onTagClick;
    this.onToggleSave = onToggleSave;
    this.fetchRelatedPins = fetchRelatedPins;
    this.activePin = null;
    this.isOpen = false;
    this.seenPinIds = new Set();
    this.renderedRelatedIds = new Set();
    this.relatedCache = new Map();
    this.pinStack = [];
    this.relatedPage = 1;
    this.hasMoreRelated = true;
    this.isLoadingRelated = false;
    this.relatedCols = [];
    this.colHeights = [];
    this.sentinelObserver = null;

    this.backdrop = document.getElementById("pin-modal");
    this.wrap = document.getElementById("modal-content-wrap");
    this.container = this.backdrop ? this.backdrop.querySelector(".modal-container") : null;
    this.infoCol = this.container ? this.container.querySelector(".modal-info-col") : null;
    this.img = document.getElementById("modal-img");
    this.title = document.getElementById("modal-title");
    this.author = document.getElementById("modal-author");
    this.authorPlatform = document.getElementById("modal-author-platform");
    this.authorAvatar = document.getElementById("modal-author-avatar");
    this.dimensions = document.getElementById("modal-dimensions");
    this.idEl = document.getElementById("modal-id");
    this.tagsContainer = document.getElementById("modal-tags");
    this.sourceLink = document.getElementById("modal-source-link");
    this.downloadBtn = document.getElementById("modal-download-btn");
    this.shareBtn = document.getElementById("modal-share-btn");
    this.saveBtn = document.getElementById("modal-save-btn");
    this.closeBtn = document.getElementById("modal-close-btn");
    this.scrollCue = document.getElementById("modal-scroll-cue");
    this.relatedContainer = document.getElementById("modal-related-container");
    this.relatedGrid = document.getElementById("modal-related-grid");
    this.relatedLoader = document.getElementById("modal-related-loader");
    this.sentinel = document.getElementById("modal-related-sentinel");
    this.relatedCardTemplate = document.getElementById("modal-related-card-template");
    window._modal = this;

    this.bindEvents();
    this.initSentinelObserver();
  }

  bindEvents() {
    this.closeBtn.addEventListener("click", () => this.close());
    this.backdrop.addEventListener("click", (e) => {
      if (e.target === this.backdrop || e.target === this.wrap) {
        this.close();
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });

    window.addEventListener("popstate", () => {
      if (!this.isOpen) return;
      if (this.pinStack.length > 1) {
        this.pinStack.pop();
        const prevPin = this.pinStack[this.pinStack.length - 1];
        this.renderPin(prevPin, false);
      } else {
        this.pinStack = [];
        this.closeInternal();
      }
    });

    if (this.scrollCue) {
      this.scrollCue.addEventListener("click", () => {
        if (this.relatedContainer) {
          this.relatedContainer.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    const onScroll = () => {
      if (!this.isOpen) return;
      if (this.scrollCue) {
        this.scrollCue.classList.toggle("hide", this.backdrop.scrollTop > 100);
      }

      if (this.isLoadingRelated || !this.hasMoreRelated) return;
      const scrollRemaining = this.backdrop.scrollHeight - (this.backdrop.scrollTop + this.backdrop.clientHeight);
      if (scrollRemaining < 650) {
        this.loadNextRelatedBatch();
      }
    };

    if (this.backdrop) {
      this.backdrop.addEventListener("scroll", onScroll, { passive: true });
    }

    this.saveBtn.addEventListener("click", () => {
      if (!this.activePin) return;
      if (typeof this.onToggleSave === "function") {
        const isSaved = this.onToggleSave(this.activePin);
        this.updateSaveButton(isSaved);
        showToast(isSaved ? "Saved to Collections!" : "Removed from Collections");
      }
    });

    this.downloadBtn.addEventListener("click", async (e) => {
      if (!this.activePin) return;
      e.preventDefault();
      await this.downloadDirectly(this.activePin);
    });

    if (this.shareBtn) {
      this.shareBtn.addEventListener("click", async (e) => {
        if (!this.activePin) return;
        e.preventDefault();
        const pin = this.activePin;
        const shareUrl = `${window.location.origin}${window.location.pathname}#pin=${encodeURIComponent(pin.id)}`;
        const shareData = {
          title: pin.title || "Lotus Anime Art",
          text: `Check out "${pin.title}" on Lotus`,
          url: shareUrl
        };

        if (navigator.share && window.isSecureContext) {
          try {
            await navigator.share(shareData);
            showToast("Link shared!");
            return;
          } catch (err) {
            if (err.name === "AbortError") return;
          }
        }

        await copyToClipboard(shareUrl);
        showToast("Link copied to clipboard!");
      });
    }
  }

  initSentinelObserver() {
    if (!("IntersectionObserver" in window) || !this.sentinel) return;
    this.sentinelObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && this.isOpen && !this.isLoadingRelated && this.hasMoreRelated) {
          this.loadNextRelatedBatch();
        }
      },
      {
        root: this.backdrop,
        rootMargin: "500px 0px"
      }
    );
    this.sentinelObserver.observe(this.sentinel);
  }

  }
}
