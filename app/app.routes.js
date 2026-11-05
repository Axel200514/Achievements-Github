import { APP_ROUTES } from "./app.config.js";

export class AppRouter {
  constructor(routes = {}) {
    this.routes = routes;
    this.currentRoute = null;
    this.init();
  }

  init() {
    window.addEventListener("hashchange", () => this.handleHashChange());
    this.handleHashChange();
  }

  handleHashChange() {
    const rawHash = window.location.hash.replace(/^#\/?/, "");

    if (rawHash.startsWith("pin=")) {
      const pinId = decodeURIComponent(rawHash.slice(4));
      this.currentRoute = "pin";
      if (typeof this.routes.pin === "function") {
        this.routes.pin(pinId);
      }
      return;
    }

    if (rawHash.startsWith("explore?")) {
      const params = new URLSearchParams(rawHash.slice("explore?".length));
      const topic = params.get("topic") || "";
      const title = params.get("title") || topic;
      this.currentRoute = "explore-topic";
      if (typeof this.routes.exploreTopic === "function") {
        this.routes.exploreTopic(topic, title);
      }
      return;
    }

    if (rawHash.startsWith("topic=")) {
      const topic = decodeURIComponent(rawHash.slice(6));
      this.currentRoute = "home-topic";
      if (typeof this.routes.homeTopic === "function") {
        this.routes.homeTopic(topic);
      }
      return;
    }

    if (rawHash.startsWith("search=")) {
      const query = decodeURIComponent(rawHash.slice(7));
      this.currentRoute = "search";
      if (typeof this.routes.search === "function") {
        this.routes.search(query);
      }
      return;
    }

    if (rawHash.startsWith("tag=")) {
      const tag = decodeURIComponent(rawHash.slice(4));
      this.currentRoute = "search";
      if (typeof this.routes.search === "function") {
        this.routes.search(tag);
      }
      return;
    }

    const route = rawHash || APP_ROUTES.home;
    this.currentRoute = route;

    if (typeof this.routes[route] === "function") {
      this.routes[route]();
    } else if (typeof this.routes.default === "function") {
      this.routes.default(route);
    }
  }

  navigate(route) {
    const targetHash = route ? `#${route}` : "";
    if (window.location.hash === targetHash || (window.location.hash === "" && targetHash === "")) {
      this.handleHashChange();
    } else {
      window.location.hash = targetHash;
    }
  }
}
