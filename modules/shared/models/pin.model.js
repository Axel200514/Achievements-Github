export class PinModel {
  constructor(data = {}) {
    this.id = data.id || String(Date.now());
    this.title = data.title || (data.author ? `Ilustración de ${data.author}` : "Ilustración Digital");
    this.previewUrl = data.previewUrl || "";
    this.fullUrl = data.fullUrl || this.previewUrl;
    this.width = Number(data.width) || 1200;
    this.height = Number(data.height) || 1600;
    this.tags = Array.isArray(data.tags) ? data.tags : [];
    this.author = data.author || "Artista Visual";
    this.authorHref = data.authorHref || "";
    this.source = data.source || this.fullUrl;
    this.sourceDomain = data.sourceDomain || "pixiv.net";
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  static fromSafebooru(item) {
    const GENERIC_EXCLUSIONS = new Set([
      "1boy", "1girl", "2girls", "2boys", "3girls", "4girls", "multiple_girls", "multiple_boys",
      "solo", "looking_at_viewer", "looking_away", "looking_back", "looking_down", "looking_up",
      "simple_background", "white_background", "transparent_background", "grey_background", "black_background",
      "monochrome", "greyscale", "long_hair", "short_hair", "medium_hair", "black_hair", "blonde_hair",
      "brown_hair", "blue_hair", "pink_hair", "purple_hair", "red_hair", "green_hair", "white_hair", "silver_hair",
      "blue_eyes", "brown_eyes", "green_eyes", "red_eyes", "purple_eyes", "yellow_eyes", "closed_eyes",
      "smile", "open_mouth", "closed_mouth", "parted_lips", "blush", "dress", "skirt", "shirt", "t-shirt",
      "jacket", "coat", "hoodie", "sweater", "swimsuit", "bikini", "uniform", "school_uniform", "sailor_suit",
      "gym_uniform", "maid", "apron", "gloves", "socks", "shoes", "boots", "thighhighs", "bow", "bowtie",
      "ribbon", "jewelry", "necklace", "earrings", "glasses", "sunglasses", "hat", "cap", "hair_ornament",
      "hair_ribbon", "hair_bow", "hair_flower", "hair_clip", "animal_ears", "cat_ears", "fox_ears",
      "rabbit_ears", "dog_ears", "horse_ears", "tail", "wings", "halo", "fur_trim", "pointy_ears",
      "crown_braid", "braid", "braided_hair", "ponytail", "twintails", "side_ponytail", "sidelocks",
      "ahoge", "bangs", "blunt_bangs", "winter_clothes", "summer_clothes", "standing", "sitting",
      "lying", "kneeling", "holding", "holding_hands", "full_body", "upper_body", "portrait", "profile",
      "barefoot", "cleavage", "collarbone", "bare_shoulders", "navel", "midriff", "armpits",
      "heterochromia", "fangs", "expressionless", "commentary_request", "translation_request",
      "character_request", "source_request", "check_commentary", "cropped_torso", "cropped_shoulders",
      "official_alternate_costume", "alternate_costume", "alternate_hairstyle", "alternate_color",
      "white_border", "black_border", "border", "dated", "sample", "sample_watermark", "watermark",
      "signature", "artist_name", "bad_id", "bad_pixiv_id", "bad_twitter_id", "bad_source", "reprint",
      "redrawn", "redraw", "sketch", "doodle", "lineart", "comic", "parody", "cover", "original",
      "scan", "screencap", "text", "english_text", "japanese_text", "chinese_text", "korean_text",
      "sound_effects", "speech_bubble", "translation_notes", "web_address", "third-party_edit",
      "character_name", "highres", "absurdres", "superabsurdres"
    ]);

    const KNOWN_SERIES = [
      "the_legend_of_zelda", "legend_of_zelda", "breath_of_the_wild", "genshin_impact", "genshin",
      "honkai", "vocaloid", "touhou", "fate", "hololive", "arknights", "blue_archive",
      "dragon_ball", "naruto", "one_piece", "bleach", "chainsaw_man", "spy_x_family",
      "evangelion", "pokemon", "azur_lane", "danganronpa", "nier", "persona", "idolmaster",
      "love_live", "bang_dream", "umamusume"
    ];

    const isNonCharacter = (tag) => {
      if (GENERIC_EXCLUSIONS.has(tag)) return true;
      if (tag.endsWith("_request") || tag.endsWith("_background") || tag.endsWith("_eyes") ||
          tag.endsWith("_hair") || tag.endsWith("_ears") || tag.endsWith("_clothes") ||
          tag.endsWith("_costume") || tag.endsWith("_uniform") || tag.endsWith("_border") ||
          tag.endsWith("_notes") || tag.endsWith("_style") || tag.endsWith("_pose")) {
        return true;
      }
      return false;
    };

    const rawTags = (item.tags || "")
      .split(" ")
      .map((t) => t.trim())
      .filter((t) => t.length > 1);

    const filteredTags = rawTags.filter((t) => !isNonCharacter(t));

    let characterTag = item.character || "";
    if (!characterTag) {
      characterTag =
        filteredTags.find((t) => t.includes("(") && t.includes(")")) ||
        filteredTags.find((t) => (t.includes("princess_") || t.includes("queen_") || t.includes("king_") || t.includes("lord_") || t.includes("lady_")) && !KNOWN_SERIES.some((s) => t.startsWith(s))) ||
        filteredTags.find((t) => t.includes("_") && !KNOWN_SERIES.some((s) => t.startsWith(s)) && !t.includes(":") && t !== "triforce") ||
        filteredTags[0] ||
        "Arte Anime";
    }

    const cleanTitle = characterTag
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const full = item.file_url || item.sample_url || item.preview_url || "";
    const preview = item.sample_url || item.file_url || item.preview_url || "";
    const formattedTags = rawTags.slice(0, 24).map((t) => t.replace(/_/g, " "));

    const src = (item.source || "").trim();
    let authorName = item.artist ? (item.artist.startsWith("@") ? item.artist : `@${item.artist}`) : "";
    let authorHref = `https://safebooru.org/index.php?page=post&s=view&id=${item.id}`;
    let domain = "safebooru.org";

    if (!authorName && (src.includes("twitter.com/") || src.includes("x.com/"))) {
      const match = src.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
      if (match && match[1] && match[1] !== "i") {
        authorName = `@${match[1]}`;
        authorHref = `https://x.com/${match[1]}`;
        domain = "x.com";
      }
    } else if (!authorName && src.includes("bsky.app/profile/")) {
      const match = src.match(/bsky\.app\/profile\/([^/?#]+)/);
      if (match && match[1]) {
        domain = "bsky.app";
        authorHref = src;
        if (!match[1].startsWith("did:plc:")) {
          authorName = `@${match[1]}`;
        }
      }
    } else if (!authorName && (src.includes("pixiv.net") || src.includes("pximg.net"))) {
      domain = "pixiv.net";
      authorName = "Artista en Pixiv";
      authorHref = src.startsWith("http") ? src : "https://www.pixiv.net";
    } else if (!authorName && src.includes("artstation.com/")) {
      const match = src.match(/artstation\.com\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        authorName = `@${match[1]}`;
        authorHref = `https://www.artstation.com/${match[1]}`;
        domain = "artstation.com";
      }
    } else if (!authorName && src.includes("deviantart.com/")) {
      const match = src.match(/deviantart\.com\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        authorName = `@${match[1]}`;
        authorHref = `https://www.deviantart.com/${match[1]}`;
        domain = "deviantart.com";
      }
    } else if (!authorName && src.includes("lofter.com")) {
      domain = "lofter.com";
      const match = src.match(/https?:\/\/([a-zA-Z0-9_-]+)\.lofter\.com/);
      if (match && match[1]) {
        authorName = `@${match[1]}`;
        authorHref = `https://${match[1]}.lofter.com`;
      }
    } else if (!authorName && item.owner && item.owner !== "danbooru") {
      authorName = `@${item.owner}`;
    }

    if (!authorName) {
      const explicitArtistTag = filteredTags.find((t) => t.endsWith("_(artist)"));
      const candidateArtistTag = explicitArtistTag || filteredTags.find((t) => t !== characterTag && !KNOWN_SERIES.some((s) => t.startsWith(s)) && !t.includes(":") && t !== "triforce");
      if (candidateArtistTag) {
        const cleanArtist = candidateArtistTag.replace(/_\(artist\)$/, "");
        authorName = `@${cleanArtist}`;
        authorHref = `https://safebooru.org/index.php?page=post&s=list&tags=${encodeURIComponent(cleanArtist)}`;
      } else {
        authorName = "Artista Digital";
        domain = "Ilustración Digital";
      }
    }

    return new PinModel({
      id: `sb_${item.id}`,
      title: cleanTitle,
      previewUrl: preview,
      fullUrl: full,
      width: Number(item.width) || 1200,
      height: Number(item.height) || 1600,
      tags: formattedTags,
      author: authorName,
      authorHref: authorHref,
      source: src || authorHref,
      sourceDomain: domain,
      createdAt: item.change ? new Date(item.change * 1000).toISOString() : new Date().toISOString()
    });
  }
}
