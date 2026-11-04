import { ExploreService } from "../../services/explore.service.js";

export class ExploreMainComponent {
  constructor(container, onTopicSelect) {
    this.container = container;
    this.onTopicSelect = onTopicSelect;
    this.service = new ExploreService();
    this.boardTemplate = document.getElementById("explore-board-card-template");
    this.popularTemplate = document.getElementById("explore-popular-section-template");
    this.thumbTemplate = document.getElementById("explore-popular-thumb-template");
  }

  async render() {
    this.container.textContent = "";

    const [boards, popularSections] = await Promise.all([
      this.service.getFeaturedBoards(),
      this.service.getPopularSections()
    ]);

    const wrapper = document.createElement("div");
    wrapper.className = "explore-container";

    const fragment = document.createDocumentFragment();

    const boardsSection = this.buildFeaturedBoards(boards);
    fragment.appendChild(boardsSection);

    popularSections.forEach((section) => {
      const sectionNode = this.buildPopularSection(section);
      fragment.appendChild(sectionNode);
    });

    wrapper.appendChild(fragment);
    this.container.appendChild(wrapper);
  }

  buildFeaturedBoards(boards) {
    const section = document.createElement("section");

    const header = document.createElement("div");
    header.className = "explore-section-header";

    const title = document.createElement("h2");
    title.className = "explore-section-title";
    title.textContent = "Tendencias visuales de Lotus";

    header.appendChild(title);
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "boards-grid";

    const boardsFragment = document.createDocumentFragment();

    boards.forEach((board) => {
      const clone = this.boardTemplate.content.cloneNode(true);
      const card = clone.querySelector(".board-card");
      const mainImg = clone.querySelector(".board-main-img");
      const sub1 = clone.querySelector(".board-sub-1");
      const sub2 = clone.querySelector(".board-sub-2");
      const bTitle = clone.querySelector(".board-title");
      const bAuthorName = clone.querySelector(".author-name");
      const stats = clone.querySelector(".board-stats");

      mainImg.src = board.previews[0];
      mainImg.alt = board.title;

      sub1.src = board.previews[1] || board.previews[0];
      sub1.alt = board.title;

      sub2.src = board.previews[2] || board.previews[0];
      sub2.alt = board.title;

      bTitle.textContent = board.title;
      bAuthorName.textContent = `${board.author} `;
      stats.textContent = `${board.pinCount} Pines · Activo`;

      card.addEventListener("click", () => {
        if (typeof this.onTopicSelect === "function") {
          this.onTopicSelect(board.tag, board.title);
        }
      });

      boardsFragment.appendChild(clone);
    });

    grid.appendChild(boardsFragment);
    section.appendChild(grid);
    return section;
  }

  buildPopularSection(item) {
    const clone = this.popularTemplate.content.cloneNode(true);
    const section = clone.querySelector("section");
    const titleText = clone.querySelector(".explore-popular-title");
    const shortcutBtn = clone.querySelector(".explore-search-shortcut");
    const row = clone.querySelector(".popular-row");

    titleText.textContent = item.title;
    shortcutBtn.title = `Explorar ${item.title}`;

    const thumbsFragment = document.createDocumentFragment();

    item.thumbnails.forEach((src) => {
      const thumbClone = this.thumbTemplate.content.cloneNode(true);
      const img = thumbClone.querySelector(".popular-thumb");
      img.src = src;
      img.alt = item.title;
      thumbsFragment.appendChild(thumbClone);
    });

    row.appendChild(thumbsFragment);

    const triggerAction = () => {
      if (typeof this.onTopicSelect === "function") {
        this.onTopicSelect(item.tag, item.title);
      }
    };

    shortcutBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerAction();
    });
    row.addEventListener("click", triggerAction);

    return section;
  }
}
