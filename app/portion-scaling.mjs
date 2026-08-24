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
const numberPattern = `(?:\\d+(?:[.,]\\d+)?(?:\\s+(?:[${vulgarPattern}]|\\d+\\/\\d+))?|\\d+\\/\\d+|[${vulgarPattern}])`;
const quantityPattern = new RegExp(
  `(^|[^\\p{L}\\d])((?:ca|cirka|ungefär)\\s+)?(${numberPattern})(\\s*[–-]\\s*(${numberPattern}))?`,
  "giu",
);

function parseNumber(value) {
  const normalized = value.trim();
  const mixed = normalized.match(new RegExp(`^(\\d+)\\s+([${vulgarPattern}])$`, "u"));
  if (mixed) return Number(mixed[1]) + vulgarFractions[mixed[2]];
  const fraction = normalized.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
  if (fraction && Number(fraction[3])) return Number(fraction[1] || 0) + Number(fraction[2]) / Number(fraction[3]);
  if (normalized in vulgarFractions) return vulgarFractions[normalized];
  return Number(normalized.replace(",", "."));
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 100) / 100;
  const whole = Math.floor(rounded + 1e-9);
  const fraction = rounded - whole;
  const common = [
    [0.125, "⅛"],
    [0.25, "¼"],
    [0.375, "⅜"],
    [0.5, "½"],
    [0.625, "⅝"],
    [0.75, "¾"],
    [0.875, "⅞"],
  ];
  for (const [candidate, glyph] of common) {
    if (Math.abs(fraction - candidate) < 0.025) return whole ? `${whole} ${glyph}` : glyph;
  }
  if (Math.abs(rounded - Math.round(rounded)) < 0.025) return String(Math.round(rounded));
  const precision = Math.abs(rounded) < 10 ? 1 : 0;
  return rounded.toFixed(precision).replace(".", ",").replace(/,0$/, "");
}

/**
 * Skalar tydliga numeriska mängder i en ingrediensrad. Procenttal och
 * temperaturer lämnas orörda. Receptkällan muteras aldrig.
 */
export function scaleIngredientText(text, factor) {
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return text;
  return text.replace(quantityPattern, (match, boundary, approximation, first, range, second, offset, source) => {
    const after = source.slice(offset + match.length).trimStart();
    if (/^(?:%|°|min(?:ut(?:er)?)?\b)/iu.test(after)) return match;
    const scaledFirst = formatNumber(parseNumber(first) * factor);
    if (!scaledFirst) return match;
    const scaledRange = second ? `–${formatNumber(parseNumber(second) * factor)}` : "";
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

