import { showToast, copyToClipboard } from "../../../shared/utils/ui.utils.js";
import { PinCardComponent } from "../pin-card/pin-card.component.js";

export class PinListComponent {
  constructor(container, template, savedService, callbacks = {}) {
    this.container = container;
    this.template = template;
    this.savedService = savedService;
    this.callbacks = callbacks;
    this.cardComponent = new PinCardComponent(this.template);
    this.columns = [];
    this.columnHeights = [];
    this.renderedPins = [];
    this.initColumns();
  }

  getOptimalColumnCount() {
    const width = window.innerWidth;
    if (width < 640) return 2;
    if (width < 900) return 3;
    if (width < 1200) return 4;
    if (width < 1600) return 5;
    return 6;
  }

  initColumns() {
    this.container.textContent = "";
    const colCount = this.getOptimalColumnCount();
    this.columns = [];
    this.columnHeights = new Array(colCount).fill(0);

    for (let i = 0; i < colCount; i++) {
      const col = document.createElement("div");
      col.className = `pins-col pins-col-${i}`;
      this.container.appendChild(col);
      this.columns.push(col);
    }
  }

  clear() {
    this.initColumns();
    this.renderedPins = [];
  }

  handleResize() {
    const needed = this.getOptimalColumnCount();
    if (needed !== this.columns.length) {
      const pinsToReRender = [...this.renderedPins];
      this.initColumns();
      this.renderPins(pinsToReRender);
    }
  }

  renderPins(pins = []) {
    if (!Array.isArray(pins) || pins.length === 0) return;

    if (this.columns.length === 0) {
      this.initColumns();
    }

  }
}
