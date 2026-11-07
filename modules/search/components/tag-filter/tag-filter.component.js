export class TagFilterComponent {
  constructor(containerEl, onSelectTag) {
    this.containerEl = containerEl;
    this.onSelectTag = onSelectTag;
    this.chips = [];
    this.init();
    this.setTags([]);
  }

  setTags(tags = []) {
    this.containerEl.textContent = "";
    const fragment = document.createDocumentFragment();

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "category-chip active";
    allBtn.dataset.query = "";
    allBtn.textContent = "All";
    fragment.appendChild(allBtn);

    const isMobile = window.innerWidth <= 768;
    const items = tags.slice(0, isMobile ? 8 : 16);

    items.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "category-chip";
      btn.dataset.query = item.query || item.tag || item;
      btn.textContent = item.label || item.title || item;
      fragment.appendChild(btn);
    });

    this.containerEl.appendChild(fragment);
    this.chips = Array.from(this.containerEl.querySelectorAll(".category-chip"));
  }

  init() {
    this.containerEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".category-chip");
      if (!chip) return;

      this.setActiveChip(chip);
      if (typeof this.onSelectTag === "function") {
        this.onSelectTag(chip.dataset.query || "");
      }
    });
  }

  setActiveChip(selectedChip) {
    this.chips.forEach((c) => c.classList.remove("active"));
    if (selectedChip) {
      selectedChip.classList.add("active");
      selectedChip.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }

  selectByTag(tag) {
    const cleanTag = (tag || "").trim().toLowerCase();
    this.chips = Array.from(this.containerEl.querySelectorAll(".category-chip"));

    if (!cleanTag) {
      this.setActiveChip(this.chips[0]);
      return;
    }

    const matched = this.chips.find(
      (c) => (c.dataset.query || "").toLowerCase() === cleanTag || c.textContent.trim().toLowerCase() === cleanTag
    );

    this.setActiveChip(matched || null);
  }
}
