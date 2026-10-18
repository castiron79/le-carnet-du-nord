// Shared by the client and publication validator; recipe text is never evaluated.
const reference = /\{\{q:([a-z][a-z0-9-]*)(?:\*([0-9]+(?:\.[0-9]+)?))?(?::(amount))?\}\}/g;
const formsValid = value => typeof value === "string" ? value.trim().length > 0
  : value !== null && typeof value === "object" && !Array.isArray(value)
    && typeof value.one === "string" && value.one.trim().length > 0
    && typeof value.other === "string" && value.other.trim().length > 0;
const positive = value => typeof value === "number" && Number.isFinite(value) && value > 0;

export function validateQuantityReferences(manifest, ingredientText, stepText) {
  const errors = [];
  const combined = `${ingredientText}\n${stepText}`;
  if (manifest === undefined) return combined.includes("{{q:") ? ["Mängdreferens utan quantities.json"] : [];
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.quantities) || !manifest.quantities.length) {
    return ["quantities.json måste ha version 1 och en icke-tom quantities-lista"];
  }
  const ids = new Set();
  for (const item of manifest.quantities) {
    if (!item || typeof item !== "object" || typeof item.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(item.id)) {
      errors.push("Ogiltigt mängd-ID"); continue;
    }
    if (ids.has(item.id)) errors.push(`Duplicerat mängd-ID: ${item.id}`);
    ids.add(item.id);
    const amountValid = positive(item.amount) || (Array.isArray(item.amount) && item.amount.length === 2
      && item.amount.every(positive) && item.amount[0] <= item.amount[1]);
    if (!amountValid) errors.push(`Ogiltig mängd: ${item.id}`);
    if (!formsValid(item.name) || (item.unit !== undefined && !formsValid(item.unit))) errors.push(`Ogiltiga ordformer: ${item.id}`);
  }
  const ingredientIds = new Set();
  for (const [text, isIngredients] of [[ingredientText, true], [stepText, false]]) {
    for (const match of text.matchAll(reference)) {
      if (!ids.has(match[1])) errors.push(`Okänt mängd-ID: ${match[1]}`);
      if (match[2] !== undefined && (!positive(Number(match[2])) || Number(match[2]) > 1)) errors.push(`Ogiltig andel: ${match[0]}`);
      if (isIngredients) ingredientIds.add(match[1]);
    }
    if (text.replace(reference, "").includes("{{q:")) errors.push("Felaktig mängdreferens");
  }
  for (const id of ids) if (!ingredientIds.has(id)) errors.push(`Mängden saknas i ingredienslistan: ${id}`);
  if (/^-\s+[0-9¼½¾⅓⅔⅛⅜⅝⅞]/m.test(ingredientText)) errors.push("Kända ingrediensmängder måste använda mängdreferenser");
  if (ingredientText.split(/\r?\n/).some(line => line.includes("{{q:") && !/^-\s+/.test(line))
      || stepText.split(/\r?\n/).some(line => line.includes("{{q:") && !/^\d+\.\s+/.test(line))) {
    errors.push("Mängdreferenser tillåts bara i ingrediensrader och numrerade steg");
  }
  return errors;
}

export function formatQuantityNumber(value) {
  // Exact common fractions only: do not turn 0.4 into 3/8 or lose tiny quantities.
  const whole = Math.floor(value);
  const fractions = [[1/8,"⅛"],[1/4,"¼"],[1/3,"⅓"],[3/8,"⅜"],[1/2,"½"],[5/8,"⅝"],[2/3,"⅔"],[3/4,"¾"],[7/8,"⅞"]];
  for (const [part, glyph] of fractions) {
    if (Math.abs(value - whole - part) < 1e-9) return whole ? `${whole} ${glyph}` : glyph;
  }
  return new Intl.NumberFormat("sv-SE", { maximumSignificantDigits: 4, useGrouping: false }).format(value);
}

const word = (value, single) => typeof value === "string" ? value : value[single ? "one" : "other"];

export function renderQuantityText(text, manifest, factor = 1) {
  if (!manifest) return text;
  if (!Number.isFinite(factor) || factor <= 0) throw new Error("Ogiltig portionsfaktor");
  const quantities = new Map(manifest.quantities.map(item => [item.id, item]));
  return text.replace(reference, (_, id, share, mode) => {
    const item = quantities.get(id);
    if (!item) throw new Error(`Okänt mängd-ID: ${id}`);
    const values = (Array.isArray(item.amount) ? item.amount : [item.amount]).map(n => n * factor * Number(share ?? 1));
    const single = values.every(n => n <= 1);
    return [values.map(formatQuantityNumber).join("–"), item.unit ? word(item.unit, single) : "",
      mode === "amount" ? "" : word(item.name, single)].filter(Boolean).join(" ");
  });
}

export function portionNotice(servings, original, shared) {
  if (servings === original) return "";
  const quantity = shared ? "Ingrediensmängderna är anpassade till valt portionsantal."
    : "Ingredienslistan är anpassad till valt portionsantal. Mängder i instruktionerna gäller grundreceptet.";
  return `${quantity} Angivna antal bakverk, bitar och serveringskärl gäller grundreceptet för ${original} ${original === 1 ? "portion" : "portioner"} och kan behöva anpassas.`;
}
