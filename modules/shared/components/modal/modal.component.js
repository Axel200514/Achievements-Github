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

}
