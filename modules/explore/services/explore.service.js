import { API_CONFIG } from "../../../app/app.config.js";

const THEME_POOL = [
  { title: "Cyberpunk & Neo Tokyo", tag: "cyberpunk", subtitle: "Futurismo y Neón" },
  { title: "Genshin Impact & Fantasía", tag: "genshin", subtitle: "Mundos Mágicos" },
  { title: "Retro 90s Anime Aesthetic", tag: "retro", subtitle: "Clásicos y Nostalgia" },
  { title: "Vocaloid & Hatsune Miku", tag: "miku", subtitle: "Ídolos Virtuales" },
  { title: "Kimono & Tradición Nipona", tag: "kimono", subtitle: "Elegancia Tradicional" },
  { title: "Mecha & Estética Sci-Fi", tag: "mecha", subtitle: "Robótica y Blindaje" },
  { title: "Kitsune Spirits & Santuarios", tag: "kitsune", subtitle: "Mitos y Zorros Celestiales" },
  { title: "Neko World & Catgirls", tag: "neko", subtitle: "Estilo Felino y Cute" },
  { title: "Paisajes & Naturaleza", tag: "scenery", subtitle: "Horizontes y Cielos" },
  { title: "Samurai & Guerreros", tag: "samurai", subtitle: "Honor y Katanas" },
  { title: "Neon Nights & Estética", tag: "neon", subtitle: "Brillo Nocturno" },
  { title: "Manga & Blanco y Negro", tag: "manga", subtitle: "Tinta Japonesa" }
];

const DEFAULT_PREVIEWS = [
  "https://safebooru.org/thumbnails/4439/thumbnail_1dd6a8ce3ca0b65691b8cb20d103d782.jpg",
  "https://safebooru.org/thumbnails/4439/thumbnail_4656de996e54a1e61017ce4fcd0ddcfd.jpg",
  "https://safebooru.org/thumbnails/4439/thumbnail_4b5758f71745e023b4e4302df0572c96.jpg",
  "https://safebooru.org/thumbnails/4203/thumbnail_dc318f32589e2843485c4d979a1dcb08.jpg"
];

export class ExploreService {
  constructor() {
    this.thumbCache = new Map();
  }

  getRandomThemes(count) {
    const shuffled = [...THEME_POOL].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async fetchThemePreviews(tag, amount) {
    const randomPage = Math.floor(Math.random() * 6) + 1;
    const cacheKey = `${tag}_${amount}_${randomPage}`;
    if (this.thumbCache.has(cacheKey)) {
      return this.thumbCache.get(cacheKey);
    }

    const clean = (tag || "").trim().toLowerCase();
    const attempts = [
      `${API_CONFIG.safebooruProxyEndpoint}?tags=${encodeURIComponent(clean)}&page=${randomPage}&limit=${amount}`,
      `${API_CONFIG.safebooruProxyEndpoint}?tags=${encodeURIComponent(clean.endsWith("*") ? clean : `${clean}*`)}&page=${randomPage}&limit=${amount}&_t=${Date.now()}`,
      `${API_CONFIG.safebooruProxyEndpoint}?tags=${encodeURIComponent(clean)}&page=1&limit=${amount}&_t=${Date.now()}`
    ];

    for (const url of attempts) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const text = await res.text();
          const safeText = (text || "").trim();
          if (safeText.startsWith("[")) {
            const data = JSON.parse(safeText);
            if (Array.isArray(data) && data.length > 0) {
              const list = data.map((i) => i.sample_url || i.file_url || i.preview_url);
              this.thumbCache.set(cacheKey, list);
              return list;
            }
          }
        }
      } catch {}
    }

    return [];
  }

  async getFeaturedBoards() {
    const selected = this.getRandomThemes(4);

    const results = await Promise.allSettled(
      selected.map(async (theme, idx) => {
        const previews = await this.fetchThemePreviews(theme.tag, 3);
        return {
          id: `board-${idx}-${Date.now()}`,
          title: theme.title,
          author: "Comunidad Lotus",
          tag: theme.tag,
          pinCount: Math.floor(Math.random() * 50) + 20,
          previews: previews.length > 0 ? previews : DEFAULT_PREVIEWS.slice(0, 3)
        };
      })
    );

    return results.map((r, idx) => {
      if (r.status === "fulfilled") return r.value;
      const theme = selected[idx];
      return {
        id: `board-${idx}-${Date.now()}`,
        title: theme.title,
        author: "Comunidad Lotus",
        tag: theme.tag,
        pinCount: 25,
        previews: DEFAULT_PREVIEWS.slice(0, 3)
      };
    });
  }

  async getPopularSections() {
    const selected = this.getRandomThemes(3);

    const results = await Promise.allSettled(
      selected.map(async (theme, idx) => {
        const thumbs = await this.fetchThemePreviews(theme.tag, 6);
        return {
          id: `pop-${idx}-${Date.now()}`,
          title: theme.title,
          tag: theme.tag,
          thumbnails: thumbs.length > 0 ? thumbs : DEFAULT_PREVIEWS
        };
      })
    );

    return results.map((r, idx) => {
      if (r.status === "fulfilled") return r.value;
      const theme = selected[idx];
      return {
        id: `pop-${idx}-${Date.now()}`,
        title: theme.title,
        tag: theme.tag,
        thumbnails: DEFAULT_PREVIEWS
      };
    });
  }
}
