export class LoaderComponent {
  constructor() {
    this.indicator = document.getElementById("loading-indicator");
    this.emptyState = document.getElementById("empty-state");
    this.endIndicator = document.getElementById("end-indicator");
  }

  show() {
    this.indicator.classList.remove("d-none");
    this.emptyState.classList.remove("visible");
    this.endIndicator.classList.add("d-none");
  }

  hide() {
    this.indicator.classList.add("d-none");
  }

  showEmpty() {
    this.hide();
    this.endIndicator.classList.add("d-none");
    this.emptyState.classList.add("visible");
  }

  hideEmpty() {
    this.emptyState.classList.remove("visible");
  }

  showEnd() {
    this.hide();
    this.emptyState.classList.remove("visible");
    this.endIndicator.classList.remove("d-none");
  }

  hideEnd() {
    this.endIndicator.classList.add("d-none");
  }
}
