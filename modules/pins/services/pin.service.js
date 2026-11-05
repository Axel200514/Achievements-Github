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

}
