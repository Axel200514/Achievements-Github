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
    const normalized = route === "explorar" ? "explore" : route === "guardados" ? "saved" : route;
    this.navButtons.forEach((btn) => {
      const btnRoute = btn.dataset.route || "";
      btn.classList.toggle("active", btnRoute === normalized || btnRoute === route);
    });
  }
}
