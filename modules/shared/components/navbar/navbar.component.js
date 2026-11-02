export class NavbarComponent {
  constructor(onRouteSelect) {
    this.onRouteSelect = onRouteSelect;
    this.navButtons = document.querySelectorAll(".nav-btn");
    this.brandLink = document.getElementById("brand-link");
    this.init();
  }

  init() {
    this.navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const route = btn.dataset.route || "";
        this.setActive(route);
        if (typeof this.onRouteSelect === "function") {
          this.onRouteSelect(route);
        }
      });
    });

    if (this.brandLink) {
      this.brandLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.setActive("");
        if (typeof this.onRouteSelect === "function") {
          this.onRouteSelect("");
        }
      });
    }
  }

  setActive(route) {
    this.navButtons.forEach((btn) => {
      if ((btn.dataset.route || "") === route) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }
}
