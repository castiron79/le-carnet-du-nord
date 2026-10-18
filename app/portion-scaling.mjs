import { formatQuantityNumber } from "./quantity-references.mjs";

const vulgarFractions = {
  "¼": 0.25,
  "½": 0.5,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

const vulgarPattern = Object.keys(vulgarFractions).join("");
const numberPattern = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+\\s*[${vulgarPattern}]|\\d+(?:[.,]\\d+)?|[${vulgarPattern}])`;
const quantityPattern = new RegExp(
  `(^|[^\\p{L}\\d])((?:ca|cirka|ungefär)\\s+)?(${numberPattern})(\\s*[–-]\\s*(${numberPattern}))?`,
  "giu",
);

function parseNumber(value) {
  const normalized = value.trim();
  const mixed = normalized.match(new RegExp(`^(\\d+)\\s*([${vulgarPattern}])$`, "u"));
  if (mixed) return Number(mixed[1]) + vulgarFractions[mixed[2]];
  const fraction = normalized.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
  if (fraction && Number(fraction[3])) return Number(fraction[1] || 0) + Number(fraction[2]) / Number(fraction[3]);
  if (normalized in vulgarFractions) return vulgarFractions[normalized];
  return Number(normalized.replace(",", "."));
}

/**
 * Skalar tydliga numeriska mängder i en ingrediensrad. Procenttal och
 * temperaturer lämnas orörda. Receptkällan muteras aldrig.
 */
export function scaleIngredientText(text, factor) {
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return text;
  return text.replace(quantityPattern, (match, boundary, approximation, first, range, second, offset, source) => {
    const after = source.slice(offset + match.length).trimStart();
    const before = source.slice(0, offset + boundary.length);
    if (/(?:^|[^\p{L}])(?:à|per)\s*$/iu.test(before) || /^(?:%|°|min(?:ut(?:er)?)?\b|sek(?:und(?:er)?)?\b|tim(?:m(?:e|ar))?\b)/iu.test(after)) return match;
    const scaledFirst = formatQuantityNumber(parseNumber(first) * factor);
    if (!scaledFirst) return match;
    const scaledRange = second ? `–${formatQuantityNumber(parseNumber(second) * factor)}` : "";
    return `${boundary}${approximation || ""}${scaledFirst}${scaledRange}`;
  });
}

export function updateRecipePrompt(recipe) {
  return [
    "Uppdatera befintligt Le Carnet-recept.",
    `Recept-ID: ${recipe.id}`,
    `Titel: ${recipe.swedishTitle}`,
    "Utgå från den senast publicerade versionen i castiron79/le-carnet-recipes.",
    "Behåll recept-ID:t och skapa inte ett nytt recept.",
    "Ändra endast det jag uttryckligen ber om och nödvändiga följdberoenden.",
    "Visa diffen och invänta mitt godkännande före validering och publicering.",
    "",
    "Önskad ändring:",
  ].join("\n");
}

