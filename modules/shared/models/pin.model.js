const ATTR_REGEX = /(hair|streaks|eyes|skin|clothes|dress|skirt|shirt|pants|shoes|socks|boots|sleeves|sweater|jacket|coat|hoodie|uniform|swimsuit|bikini|gloves|ribbon|bow|belt|scarf|hat|cap|body|torso|arm|leg|hand|fingers|neck|apple|mouth|smile|blush|ahoge|twintails|ponytail|bangs|braid|holding|eyebrows|teeth|tongue|breasts|ass|belly|pocket|print|clenched|cropped|symbol|character_name|commentary|request|style|view|pose|solo|focus|looking|background|monochrome|greyscale|highres|absurdres|watermark|signature|text)/i;

const isCleanName = (tag) => {
  return tag.length > 2 && !/^\d/.test(tag) && !tag.startsWith("&") && !ATTR_REGEX.test(tag);
};

export class PinModel {
  constructor(data = {}) {
    this.id = data.id || String(Date.now());
    this.title = data.title || (data.author ? `Illustration by ${data.author}` : "Digital Illustration");
    this.previewUrl = data.previewUrl || "";
    this.fullUrl = data.fullUrl || this.previewUrl;
    this.width = Number(data.width) || 1200;
    this.height = Number(data.height) || 1600;
    this.tags = Array.isArray(data.tags) ? data.tags : [];
    this.author = data.author || "Visual Artist";
    this.authorHref = data.authorHref || "";
    this.source = data.source || this.fullUrl;
    this.sourceDomain = data.sourceDomain || "pixiv.net";
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  static fromSafebooru(item) {
    const rawTags = (item.tags || "")
      .split(" ")
      .map((t) => t.trim())
      .filter((t) => t.length > 1);

    const filteredTags = rawTags.filter(isCleanName);

    let characterTag = item.character || "";
    if (!characterTag) {
      characterTag =
        filteredTags.find((t) => t.includes("(") && t.includes(")")) ||
        filteredTags.find((t) => /^(princess|queen|king|lord|lady)_/i.test(t)) ||
        filteredTags.find((t) => t.includes("_") && !t.includes(":") && t !== "triforce") ||
        filteredTags[0] ||
        "Anime Art";
    }

    const cleanTitle = characterTag
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const full = item.file_url || item.sample_url || item.preview_url || "";
    const preview = item.sample_url || item.file_url || item.preview_url || "";
    const formattedTags = rawTags.slice(0, 24).map((t) => ({
      label: t.replace(/_/g, " "),
  }
}
