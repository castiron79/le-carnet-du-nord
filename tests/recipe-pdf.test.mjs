import assert from "node:assert/strict";
import test from "node:test";
import { buildPrintableHtml, buildRecipePdfBytes } from "../app/recipe-pdf.mjs";

const sampleRecipe = {
  id: "tarte-tatin",
  title: "TARTE TATIN",
  subtitle: "AUX POMMES CARAMÉLISÉES",
  swedishTitle: "Tarte Tatin med vaniljgrädde & œuf",
  description: "Klassisk fransk äppelpaj med smörig karamell.",
  imageUrl: "https://example.local/recipe-assets/tarte-tatin/hero.webp",
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

function assertValidXref(ascii) {
  assert.ok(ascii.startsWith("%PDF-1.4\n"));
  assert.ok(ascii.endsWith("%%EOF\n"));
  assert.match(ascii, /xref\n0 \d+\n0000000000 65535 f /);
  const xrefPart = ascii.split("xref\n")[1].split("trailer\n")[0];
  const entries = xrefPart.trim().split("\n").slice(2);
  for (const entry of entries) {
    const offset = Number.parseInt(entry.slice(0, 10), 10);
    assert.match(ascii.slice(offset, offset + 12), /^\d+ 0 obj\n/);
  }
}

test("buildRecipePdfBytes skapar 1-sides PDF 1.4 för kort recept med svensk huvudtitel och WinAnsi-tecken", () => {
  const bytes = buildRecipePdfBytes(sampleRecipe);
  const ascii = Buffer.from(bytes).toString("latin1");
  assertValidXref(ascii);
  assert.match(ascii, /\/Encoding \/WinAnsiEncoding/);
  assert.match(ascii, /\/Count 1\b/);
  // Svensk huvudtitel (19pt F2) samt WinAnsi 'ä' (e4) och 'œ' (9c)
  assert.match(ascii, /\/F2 19 Tf/);
  assert.ok(ascii.includes("e4") && ascii.includes("9c"));
});

test("buildRecipePdfBytes bäddar in hero-bild som DCTDecode XObject med exakta byte-offsets", () => {
  const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0xff, 0xd9]);
  const bytes = buildRecipePdfBytes({
    ...sampleRecipe,
    imageJpeg: { bytes: fakeJpeg, width: 1024, height: 368 },
  });
  const ascii = Buffer.from(bytes).toString("latin1");
  assertValidXref(ascii);
  assert.match(ascii, /\/Subtype \/Image \/Width 1024 \/Height 368 \/ColorSpace \/DeviceRGB \/BitsPerComponent 8 \/Filter \/DCTDecode \/Length 13/);
  assert.match(ascii, /\/XObject << \/Im1 8 0 R >>/);
  assert.match(ascii, /\/Im1 Do Q/);
});

test("buildRecipePdfBytes använder 2-sidors och 3+-sidors sidstandard beroende på längd", () => {
  const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const mediumRecipe = {
    ...sampleRecipe,
    imageJpeg: { bytes: fakeJpeg, width: 1024, height: 368 },
    steps: Array.from({ length: 7 }, (_, idx) => ({
      title: `Steg ${idx + 1}`,
      items: ["Sjud försiktigt på medelvärme och rör om då och då tills såsen tjocknat."],
    })),
  };
  const mediumAscii = Buffer.from(buildRecipePdfBytes(mediumRecipe)).toString("latin1");
  assertValidXref(mediumAscii);
  assert.match(mediumAscii, /\/Count 2\b/);

  const longRecipe = {
    ...sampleRecipe,
    imageJpeg: { bytes: fakeJpeg, width: 1024, height: 368 },
    steps: Array.from({ length: 30 }, (_, idx) => ({
      title: `Steg ${idx + 1} med lång beskrivning`,
      items: [
        "Arbeta noggrant igenom hela momentet i kastrullen på låg till medelhög värme tills konsistensen blir helt slät, blank och fyllig.",
        "Smaka av med nymalen svartpeppar, flingsalt och några droppar färskpressad citron före nästa delmoment.",
      ],
    })),
  };
  const longAscii = Buffer.from(buildRecipePdfBytes(longRecipe)).toString("latin1");
  assertValidXref(longAscii);
  assert.match(longAscii, /\/Count [3-9]/);
});

test("buildPrintableHtml visar svensk huvudtitel, hero-bild, 2-spalt och escapear HTML-tecken", () => {
  const html = buildPrintableHtml({
    ...sampleRecipe,
    description: "Syrlig & god <script>alert(1)</script>",
  });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /<h1>Tarte Tatin med vaniljgrädde &amp; œuf<\/h1>/);
  assert.match(html, /<img src="https:\/\/example\.local\/recipe-assets\/tarte-tatin\/hero\.webp"/);
  assert.match(html, /Mängder för 4 portioner \(original 6\)/);
  assert.match(html, /Förvaring/);
  assert.match(html, /Gluten, Mjölk/);
});
