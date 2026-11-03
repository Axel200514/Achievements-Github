import { PinCardComponent } from "../pin-card/pin-card.component.js";
import { showToast, copyToClipboard } from "../../../shared/utils/ui.utils.js";

export class PinListComponent {
  constructor(container, template, savedService, callbacks = {}) {
    this.container = container;
    this.template = template;
    this.savedService = savedService;
    this.callbacks = callbacks;
    this.cardComponent = new PinCardComponent(template);
    this.columns = [];
    this.columnHeights = [];
    this.renderedPins = [];
    this.renderedPinIds = new Set();

    this.onResize = () => {
      const needed = this.calcColumnCount();
      if (needed !== this.columns.length && this.renderedPins.length > 0) {
        this.rebuildGrid();
      }
    };
    window.addEventListener("resize", this.onResize, { passive: true });
  }

  calcColumnCount() {
    const width = window.innerWidth;
    if (width >= 1800) return 7;
    if (width >= 1500) return 6;
    if (width >= 1200) return 5;
    if (width >= 900) return 4;
    if (width >= 640) return 3;
    return 2;
  }

  setupColumns(count) {
    this.container.textContent = "";
    this.columns = [];
    this.columnHeights = new Array(count).fill(0);
    for (let i = 0; i < count; i++) {
      const col = document.createElement("div");
      col.className = "pins-col";
      this.container.appendChild(col);
      this.columns.push(col);
    }
  }

  clear() {
    this.renderedPins = [];
    this.renderedPinIds.clear();
    this.columnHeights = [];
    this.columns = [];
    this.container.textContent = "";
  }

  rebuildGrid() {
    const pins = [...this.renderedPins];
    this.clear();
    this.renderPins(pins);
  }

  renderPins(pins) {
    if (!Array.isArray(pins) || pins.length === 0) return;

    const uniquePins = pins.filter((pin) => {
      if (!pin || !pin.id || this.renderedPinIds.has(pin.id)) return false;
      this.renderedPinIds.add(pin.id);
      return true;
    });

    if (uniquePins.length === 0) return;

    const count = this.calcColumnCount();
    if (this.columns.length !== count) {
      this.setupColumns(count);
    }

    const colFragments = this.columns.map(() => document.createDocumentFragment());

    uniquePins.forEach((pin) => {
      this.renderedPins.push(pin);
      const isSaved = this.savedService.isSaved(pin.id);
      const cardNode = this.cardComponent.render(pin, isSaved, {
        onClick: this.callbacks.onPinClick,
        onToggleSave: (p) => this.savedService.toggleSave(p),
        onShare: async (p) => {
          const shareUrl = `${window.location.origin}${window.location.pathname}#pin=${encodeURIComponent(p.id)}`;
          if (navigator.share && window.isSecureContext) {
            try {
              await navigator.share({
                title: p.title || "Lotus Anime Art",
                text: `Mira "${p.title}" en Lotus`,
                url: shareUrl
              });
              showToast("¡Enlace compartido!");
              return;
            } catch (err) {
              if (err.name === "AbortError") return;
            }
          }
          await copyToClipboard(shareUrl);
          showToast("¡Enlace copiado al portapapeles!");
        }
      });

      let shortest = 0;
      for (let i = 1; i < this.columns.length; i++) {
        if (this.columnHeights[i] < this.columnHeights[shortest]) {
          shortest = i;
        }
      }

      colFragments[shortest].appendChild(cardNode);
      const ratio = pin.height && pin.width ? pin.height / pin.width : 1.33;
      this.columnHeights[shortest] += ratio;
    });

    this.columns.forEach((col, idx) => {
      col.appendChild(colFragments[idx]);
    });
  }
}
