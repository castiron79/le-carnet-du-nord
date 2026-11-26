import assert from "node:assert/strict";
import test from "node:test";
import { buildPrintableHtml, buildRecipePdfBytes } from "../app/recipe-pdf.mjs";

const sampleRecipe = {
  id: "tarte-tatin",
  title: "TARTE TATIN",
  subtitle: "AUX POMMES CARAMÉLISÉES",
  swedishTitle: "Tarte Tatin med vaniljgrädde & œuf",
  description: "Klassisk fransk äppelpaj med smörig karamell.",
  totalLabel: "1 tim 10 min",
  active: 25,
  servings: 6,
  displayServings: 4,
  kcal: 519,
  occasion: "dessert",
  macros: { kcal: 519, protein: 3.4, carbs: 56.7, fat: 31.3, fiber: 3.6 },
  ingredients: [
    { heading: "Fyllning", items: ["500 g äpplen", "90 g strösocker"] },
    { heading: "Grädde", items: ["1,3 dl vispgrädde"] },
  ],
  steps: [
    { title: "Karamellisera", items: ["Smält sockret gyllene på medelvärme."] },
    { title: "Grädda", items: ["Grädda i 200 °C tills smördegen är frasig."] },
  ],
  tips: ["Servera ljummen."],
  sommelier: "Ett glas Sauternes eller nybryggt kaffe.",
  storage: "Förvara svalt i upp till 2 dagar.",
  allergens: ["gluten", "mjölk"],
  why: ["Långsam karamellisering ger djup smak."],
};

test("buildRecipePdfBytes skapar giltig PDF 1.4 med WinAnsi-kodade svenska och franska tecken", () => {
  const bytes = buildRecipePdfBytes(sampleRecipe);
  const ascii = Buffer.from(bytes).toString("latin1");
  assert.ok(ascii.startsWith("%PDF-1.4\n"));
  assert.ok(ascii.endsWith("%%EOF\n"));
  assert.match(ascii, /\/Encoding \/WinAnsiEncoding/);
  assert.match(ascii, /xref\n0 \d+\n0000000000 65535 f /);
  // Check exact xref offsets point to "<id> 0 obj"
  const xrefPart = ascii.split("xref\n")[1].split("trailer\n")[0];
  const entries = xrefPart.trim().split("\n").slice(2);
  for (const entry of entries) {
    const offset = Number.parseInt(entry.slice(0, 10), 10);
    assert.match(ascii.slice(offset, offset + 12), /^\d+ 0 obj\n/);
  }
  // Check Swedish 'ä' (0xe4) and French 'œ' (0x9c) appear in hex strings
  assert.ok(ascii.includes("e4") && ascii.includes("9c"));
  assert.ok(ascii.includes("startxref\n"));
});

test("buildRecipePdfBytes delar upp långa recept på flera sidor", () => {
  const longRecipe = {
    ...sampleRecipe,
    steps: Array.from({ length: 24 }, (_, idx) => ({
      title: `Steg ${idx + 1} med lång beskrivning`,
      items: ["Arbeta noggrant igenom hela momentet i kastrullen tills konsistensen blir helt slät och glansig."],
    })),
  };
  const ascii = Buffer.from(buildRecipePdfBytes(longRecipe)).toString("latin1");
  assert.match(ascii, /\/Count [2-9]/);
});

test("buildPrintableHtml escapear HTML-tecken och inkluderar skalade portioner", () => {
  const html = buildPrintableHtml({
    ...sampleRecipe,
    description: "Syrlig & god <script>alert(1)</script>",
  });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /Mängder för 4 portioner \(original 6\)/);
  assert.match(html, /Förvaring/);
  assert.match(html, /gluten, mjölk/);
});
