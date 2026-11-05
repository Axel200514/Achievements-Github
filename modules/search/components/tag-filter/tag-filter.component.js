const TAG_POOL = [
  { label: "Neko", query: "neko" },
  { label: "Kitsune", query: "fox_ears" },
  { label: "Illustrations", query: "waifu" },
  { label: "Characters", query: "solo" },
  { label: "Genshin", query: "genshin_impact" },
  { label: "Cyberpunk", query: "cyberpunk" },
  { label: "Fantasy", query: "fantasy" },
  { label: "Landscapes", query: "scenery" },
  { label: "Retro 90s", query: "retro" },
  { label: "Kimono", query: "kimono" },
  { label: "Samurai", query: "samurai" },
  { label: "Kawaii", query: "kawaii" },
  { label: "Vocaloid", query: "vocaloid" },
  { label: "Sci-Fi", query: "scifi" },
  { label: "Gothic", query: "gothic" },
  { label: "Pastel Dream", query: "pastel" },
  { label: "Aesthetic", query: "aesthetic" },
  { label: "Urban", query: "urban" },
  { label: "Night", query: "night" },
  { label: "Watercolor", query: "watercolor" },
  { label: "Neon", query: "neon" },
  { label: "Wallpapers", query: "wallpaper" },
  { label: "Manga", query: "manga" },
  { label: "Magical Girl", query: "magical" }
];

export class TagFilterComponent {
  constructor(containerEl, onSelectTag) {
    this.containerEl = containerEl;
    this.onSelectTag = onSelectTag;
    this.chips = [];
    this.renderRandomizedChips();
    this.init();
  }

  renderRandomizedChips() {
    this.containerEl.textContent = "";
    const fragment = document.createDocumentFragment();

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "category-chip active";
    allBtn.dataset.query = "";
    allBtn.textContent = "All";
    fragment.appendChild(allBtn);

    const isMobile = window.innerWidth <= 768;
    const shuffled = [...TAG_POOL].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, isMobile ? 6 : 14);

    selected.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "category-chip";
      btn.dataset.query = item.query;
      btn.textContent = item.label;
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
      const tag = chip.dataset.query || "";
      if (typeof this.onSelectTag === "function") {
        this.onSelectTag(tag);
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
