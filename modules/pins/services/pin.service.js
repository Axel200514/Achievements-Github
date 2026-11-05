import { API_CONFIG } from "../../../app/app.config.js";
import { PinModel } from "../../shared/models/pin.model.js";

const ANCHOR_ATTR_REGEX = /(hair|streaks|eyes|skin|clothes|dress|skirt|shirt|pants|shoes|socks|boots|sleeves|sweater|jacket|coat|hoodie|uniform|swimsuit|bikini|gloves|ribbon|bow|belt|scarf|hat|cap|body|torso|arm|leg|hand|fingers|neck|apple|mouth|smile|blush|ahoge|twintails|ponytail|bangs|braid|holding|eyebrows|teeth|tongue|breasts|ass|belly|pocket|print|clenched|cropped|symbol|character_name|commentary|request|style|view|pose|solo|focus|looking|background|monochrome|greyscale|highres|absurdres|watermark|signature|text|safebooru|pixiv|twitter|resolución|vertical|horizontal|digital|ilustración|anime)/i;

const BOORU_SPECIAL = {
  goku: "son_goku",
  luffy: "monkey_d._luffy",
  naruto: "uzumaki_naruto",
  sasuke: "uchiha_sasuke",
  vegeta: "vegeta",
  miku: "hatsune_miku",
  tanjiro: "kamado_tanjirou",
  nezuko: "kamado_nezuko",
  gojo: "gojou_satoru",
  rem: "rem_(re:zero)",
  asuka: "souryuu_asuka_langley",
  shinji: "ikari_shinji",
  deku: "midoriya_izuku",
  bakugo: "bakugou_katsuki",
  todoroki: "todoroki_shouto",
  levi: "levi_(shingeki_no_kyojin)",
  eren: "eren_yeager",
  chica: "1girl",
  chicas: "multiple_girls",
  chico: "1boy",
  chicos: "multiple_boys",
  fondo: "wallpaper",
  fondos: "wallpaper",
  paisaje: "scenery",
  paisajes: "scenery",
  ilustracion: "waifu",
  ilustraciones: "waifu",
  personaje: "solo",
  personajes: "solo",
  zorro: "fox_ears",
  zorros: "fox_ears",
  kitsune: "fox_ears",
  genshin: "genshin_impact"
};

export class PinService {
  constructor() {
    this.cache = new Map();
    this.translationCache = new Map();
    this.tagResolutionCache = new Map();
    this.sessionSeenIds = new Set();
    this.resetSession();
  }

  resetSession() {
    this.sessionOffset = Math.floor(Math.random() * 250) + 1;
    this.sessionSeenIds = new Set();
    this.resetTopicSession();
    this.resetSearchSession();
    if (this.cache) {
      this.cache.clear();
    }
  }

  resetTopicSession() {
    this.topicOffset = Math.floor(Math.random() * 15);
  }

  resetSearchSession() {
    this.searchOffset = Math.floor(Math.random() * 4);
  }

  normalizeQuery(q) {
    const clean = (q || "").trim().toLowerCase();
    return BOORU_SPECIAL[clean] || clean;
  }

  toSingular(word) {
    if (!word) return "";
    if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
    if (word.endsWith("es") && !word.endsWith("les") && word.length > 4) return word.slice(0, -2);
    if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
    return word;
  }

  async translateQuery(query) {
    const clean = (query || "").trim().toLowerCase();
    if (!clean) return "";

    if (this.translationCache.has(clean)) {
      return this.translationCache.get(clean);
    }

    if (BOORU_SPECIAL[clean]) {
      this.translationCache.set(clean, BOORU_SPECIAL[clean]);
      return BOORU_SPECIAL[clean];
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(clean)}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        const data = JSON.parse(text);
        if (data && data[0]) {
          const raw = data[0].map((s) => s[0]).join("").replace(/[.,/#!$%^&*;:{}=\`~()]/g, "").trim().toLowerCase();
          const resolved = BOORU_SPECIAL[raw] || raw;
          if (resolved) {
            this.translationCache.set(clean, resolved);
            return resolved;
          }
        }
      }
    } catch {}

    this.translationCache.set(clean, clean);
    return clean;
  }

  buildTagCandidates(translated) {
    const clean = (translated || "").trim().toLowerCase();
    if (!clean) return [];

    const candidates = new Set();
    const tokens = clean.split(/[\s_]+/).filter(Boolean);
    const underscored = tokens.join("_");
    const spaced = tokens.join(" ");

    candidates.add(underscored);
    if (spaced !== underscored) {
      candidates.add(spaced);
    }

    const singularTokens = tokens.map((t) => this.toSingular(t));
    const singularUnderscored = singularTokens.join("_");
    const singularSpaced = singularTokens.join(" ");

    if (singularUnderscored !== underscored) {
      candidates.add(singularUnderscored);
    }
    if (singularSpaced !== spaced && singularSpaced !== singularUnderscored) {
      candidates.add(singularSpaced);
    }

    const wildcard = tokens.map((t) => (t.endsWith("*") ? t : `${t}*`)).join(" ");
    candidates.add(wildcard);

    if (tokens.length > 1) {
      for (const t of tokens) {
        if (t.length >= 3 && !["and", "the", "with", "for", "from"].includes(t)) {
          candidates.add(t);
        }
      }
    }

    return Array.from(candidates);
  }

  async getPins(query = "", page = 1, limit = API_CONFIG.defaultLimit) {
    const cleanQuery = query.trim().toLowerCase();
    const cacheKey = `${cleanQuery}_${page}_${limit}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let result;
    if (cleanQuery && cleanQuery.length >= 2) {
      result = await this.searchPins(cleanQuery, page, limit);
    } else {
      result = await this.getFeedPins(page, limit);
    }

    if (result && Array.isArray(result.pins) && result.pins.length > 0) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  async getPinById(pinId) {
    const cleanId = String(pinId || "").replace(/^sb_/, "").trim();
    if (!cleanId) return null;

    const cacheKey = `pin_${cleanId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${API_CONFIG.safebooruProxyEndpoint}?tags=id:${encodeURIComponent(cleanId)}&limit=1`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        const safeText = (text || "").trim();
        if (safeText.startsWith("[")) {
          const data = JSON.parse(safeText);
          if (Array.isArray(data) && data.length > 0) {
            const pin = PinModel.fromSafebooru(data[0]);
            this.cache.set(cacheKey, pin);
            return pin;
          }
        }
      }
    } catch {}

    return null;
  }

  async getFeedPins(page = 1, limit = API_CONFIG.defaultLimit) {
    const half = Math.max(6, Math.floor(limit / 2));
    const pageA = (page * 2 - 1) + this.sessionOffset;
    const pageB = (page * 2) + this.sessionOffset + 27;

    const [batchA, batchB] = await Promise.allSettled([
      this.fetchSafebooru("", pageA, half),
      this.fetchSafebooru("", pageB, limit - half)
    ]);

    const listA = batchA.status === "fulfilled" ? batchA.value : [];
    const listB = batchB.status === "fulfilled" ? batchB.value : [];
    const seen = new Set();
    const combined = [];

    for (const item of [...listA, ...listB]) {
      if (!this.sessionSeenIds.has(item.id) && !seen.has(item.id)) {
        seen.add(item.id);
        this.sessionSeenIds.add(item.id);
        combined.push(item);
      }
    }

    if (combined.length < limit) {
      const extraPage = pageB + page + 5;
      const fallback = await this.fetchSafebooru("", extraPage, limit);
      for (const item of fallback) {
        if (!this.sessionSeenIds.has(item.id) && !seen.has(item.id)) {
          seen.add(item.id);
          this.sessionSeenIds.add(item.id);
          combined.push(item);
          if (combined.length >= limit) break;
        }
      }
    }

    return {
      pins: this.shuffle(combined),
      hasNextPage: true,
      totalPages: 99
    };
  }

  async searchPins(query, page = 1, limit = API_CONFIG.defaultLimit) {
    const effectivePage = page + (page === 1 ? (this.searchOffset || 0) : 0);
    let safebooruResults = await this.fetchSafebooru(query, effectivePage, limit);

    if (safebooruResults.length === 0 && effectivePage !== page) {
      safebooruResults = await this.fetchSafebooru(query, page, limit);
    }

    const pins = this.shuffle(safebooruResults);

    return {
      pins,
      hasNextPage: pins.length >= 6,
      totalPages: 25
    };
  }

  async getTopicPins(topic, page = 1, limit = API_CONFIG.defaultLimit) {
    const cleanTopic = (topic || "").trim().toLowerCase();
    const effectivePage = page + (this.topicOffset || 0);
    const cacheKey = `topic_${cleanTopic}_${effectivePage}_${limit}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let results = await this.fetchSafebooru(cleanTopic, effectivePage, limit);
    if (results.length === 0 && effectivePage !== page) {
      results = await this.fetchSafebooru(cleanTopic, page, limit);
    }

    const pins = this.shuffle(results);

    const result = {
      pins,
      hasNextPage: pins.length >= 6,
      totalPages: 25
    };

    if (pins.length > 0) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

}
