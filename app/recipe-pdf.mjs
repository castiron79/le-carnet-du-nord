const WIN1252 = "\u20ac\u0081\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u008d\u017d\u008f\u0090\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u009d\u017e\u0178";
const CHAR_MAP = { "\u00a0": " ", "⅓": "1/3", "⅔": "2/3", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8", "≤": "<=", "≥": ">=", "✓": "*" };

function normalizeText(text) {
  return String(text || "").replace(/[\u00a0⅓⅔⅛⅜⅝⅞≤≥✓]/g, (c) => CHAR_MAP[c] || " ");
}

function pdfStringHex(text) {
  let hex = "<";
  for (const ch of normalizeText(text)) {
    const code = ch.codePointAt(0) ?? 32;
    let b = 0x3f;
    if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)) b = code;
    else {
      const idx = WIN1252.indexOf(ch);
      if (idx >= 0) b = 0x80 + idx;
    }
    hex += b.toString(16).padStart(2, "0");
  }
  return hex + ">";
}

function approxWidth(text, size, bold = false, sans = false) {
  const factor = (sans ? 0.54 : 0.48) * (bold ? 1.07 : 1);
  let units = 0;
  for (const ch of normalizeText(text)) {
    if ("ilIj.,:;'!| ".includes(ch)) units += 0.52;
    else if ("mwMWÅÄÖŒ".includes(ch) || (ch >= "A" && ch <= "Z")) units += 1.24;
    else units += 1;
  }
  return units * size * factor;
}

function wrapLines(text, maxWidth, size, bold = false, sans = false) {
  const words = normalizeText(text).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && approxWidth(candidate, size, bold, sans) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

export function buildRecipePdfBytes(recipe) {
  const W = 595.28, H = 841.89, M = 46, CW = W - M * 2;
  const pages = [[]];
  let y = H - M;
  const page = () => pages[pages.length - 1];
  const drawText = (text, x, py, size, font, rgb) =>
    page().push(`BT /${font} ${size} Tf ${rgb} rg 1 0 0 1 ${x.toFixed(2)} ${py.toFixed(2)} Tm ${pdfStringHex(text)} Tj ET`);
  const drawLine = (x1, y1, x2, y2, rgb, w = 0.75) =>
    page().push(`${w} w ${rgb} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  const drawRect = (x, ry, w, h, rgb) =>
    page().push(`${rgb} rg ${x.toFixed(2)} ${ry.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  const newPage = () => {
    pages.push([]);
    y = H - M;
    drawText("LE CARNET DU NORD", M, y, 8, "F5", "0.54 0.37 0.10");
    drawText(recipe.swedishTitle, W - M - approxWidth(recipe.swedishTitle, 8, false, true), y, 8, "F4", "0.35 0.35 0.31");
    y -= 10;
    drawLine(M, y, W - M, y, "0.82 0.76 0.63", 0.6);
    y -= 18;
  };
  const ensure = (n) => { if (y - n < 54) newPage(); };
  const writeWrapped = (text, x, width, size, lh, font, rgb) => {
    for (const line of wrapLines(text, width, size, font === "F2" || font === "F5", font === "F4" || font === "F5")) {
      ensure(lh);
      drawText(line, x, y, size, font, rgb);
      y -= lh;
    }
  };
  const section = (title) => {
    ensure(30);
    y -= 6;
    drawText(title.toLocaleUpperCase("sv"), M, y, 10, "F5", "0.07 0.24 0.17");
    y -= 5;
    drawLine(M, y, W - M, y, "0.78 0.68 0.47");
    y -= 14;
  };

  drawRect(M, y - 34, CW, 36, "0.07 0.24 0.17");
  drawRect(M, y - 36, CW, 2.2, "0.71 0.53 0.18");
  drawText("LE CARNET DU NORD", M + 14, y - 16, 11, "F5", "0.98 0.96 0.92");
  drawText("RECETTES DE LA MAISON", M + 14, y - 28, 7.5, "F4", "0.84 0.69 0.36");
  y -= 56;

  writeWrapped(recipe.title, M, CW, 19, 23, "F2", "0.07 0.24 0.17");
  if (recipe.subtitle) writeWrapped(recipe.subtitle, M, CW, 10, 14, "F5", "0.54 0.37 0.10");
  writeWrapped(recipe.swedishTitle, M, CW, 13, 17, "F2", "0.10 0.15 0.11");
  y -= 2;
  if (recipe.description) writeWrapped(recipe.description, M, CW, 10.5, 14.5, "F3", "0.24 0.27 0.24");
  y -= 8;

  drawLine(M, y, W - M, y, "0.78 0.68 0.47", 0.8);
  y -= 15;
  writeWrapped(`Total tid: ${recipe.totalLabel}   |   Aktiv tid: ${recipe.active} min   |   ${recipe.displayServings} ${recipe.displayServings === 1 ? "portion" : "portioner"}   |   ${recipe.kcal} kcal/port   |   ${recipe.occasion}`, M, CW, 8.5, 12, "F5", "0.22 0.26 0.23");
  y -= 2;
  drawLine(M, y, W - M, y, "0.78 0.68 0.47", 0.8);
  y -= 10;

  section("Ingredienser");
  if (recipe.displayServings !== recipe.servings) {
    writeWrapped(`Mängder anpassade för ${recipe.displayServings} ${recipe.displayServings === 1 ? "portion" : "portioner"} (original ${recipe.servings}).`, M, CW, 8.5, 12, "F3", "0.54 0.37 0.10");
    y -= 3;
  }
  for (const g of recipe.ingredients) {
    if (recipe.ingredients.length > 1) {
      ensure(18);
      drawText(g.heading, M, y, 9.5, "F5", "0.10 0.15 0.11");
      y -= 13;
    }
    for (const item of g.items) writeWrapped(`•  ${item}`, M + 6, CW - 6, 10, 13.5, "F1", "0.10 0.15 0.11");
    y -= 4;
  }

  section("Gör så här");
  recipe.steps.forEach((step, idx) => {
    ensure(28);
    writeWrapped(`${idx + 1}. ${step.title}`, M, CW, 10.5, 14, "F2", "0.07 0.24 0.17");
    for (const item of step.items) writeWrapped(item, M + 14, CW - 14, 10, 13.8, "F1", "0.10 0.15 0.11");
    y -= 5;
  });

  if (recipe.tips.length) {
    section("Serveringstips");
    for (const tip of recipe.tips) writeWrapped(`•  ${tip}`, M + 4, CW - 4, 10, 13.5, "F1", "0.10 0.15 0.11");
  }
  if (recipe.sommelier) {
    section("L'accord du sommelier");
    writeWrapped(recipe.sommelier, M, CW, 10, 14, "F3", "0.15 0.18 0.15");
  }
  if (recipe.storage) {
    section("Förvaring");
    writeWrapped(recipe.storage, M, CW, 10, 14, "F1", "0.10 0.15 0.11");
  }
  if (recipe.allergens) {
    section("Allergener");
    writeWrapped(recipe.allergens.length ? recipe.allergens.join(", ") : "Inga deklarerade allergener.", M, CW, 9.5, 13.5, "F4", "0.10 0.15 0.11");
  }

  section("Näringsvärde per portion (beräknat)");
  const m = recipe.macros;
  writeWrapped(`Kalorier: ${m.kcal} kcal   |   Protein: ${m.protein} g   |   Kolhydrater: ${m.carbs} g   |   Fett: ${m.fat} g   |   Fiber: ${m.fiber} g`, M, CW, 9.5, 13.5, "F4", "0.10 0.15 0.11");

  if (recipe.why.length) {
    section("Varför det blir så gott");
    for (const r of recipe.why) writeWrapped(`•  ${r}`, M + 4, CW - 4, 10, 13.5, "F1", "0.10 0.15 0.11");
  }

  pages.forEach((cmds, idx) => {
    cmds.push(`0.6 w 0.82 0.76 0.63 RG ${M} 36 m ${(W - M).toFixed(2)} 36 l S`);
    cmds.push(`BT /F4 8 Tf 0.45 0.45 0.40 rg 1 0 0 1 ${M} 24 Tm ${pdfStringHex(`Le Carnet du Nord  —  Sida ${idx + 1} av ${pages.length}`)} Tj ET`);
  });

  const encoder = new TextEncoder();
  const chunks = [];
  let offset = 0;
  const pushBytes = (b) => { chunks.push(b); offset += b.length; };
  const pushStr = (s) => pushBytes(encoder.encode(s));

  pushBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const fonts = ["Times-Roman", "Times-Bold", "Times-Italic", "Helvetica", "Helvetica-Bold"];
  const fontDict = fonts.map((_, i) => `/F${i + 1} ${3 + i} 0 R`).join(" ");
  const pageIds = pages.map((_, i) => 8 + i * 2);
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    `2 0 obj\n<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`,
    ...fonts.map((name, i) => `${3 + i} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>\nendobj\n`),
  ];
  pages.forEach((cmds, i) => {
    const pid = pageIds[i];
    const stream = cmds.join("\n");
    objects.push(`${pid} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << ${fontDict} >> >> /Contents ${pid + 1} 0 R >>\nendobj\n`);
    objects.push(`${pid + 1} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
  });

  const offsets = [0];
  for (const obj of objects) {
    offsets.push(offset);
    pushStr(obj);
  }
  const xrefOffset = offset;
  pushStr(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (let i = 1; i < offsets.length; i++) pushStr(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  pushStr(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const out = new Uint8Array(offset);
  let pos = 0;
  for (const chunk of chunks) { out.set(chunk, pos); pos += chunk.length; }
  return out;
}

function esc(value) {
  return String(value || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export function buildPrintableHtml(recipe) {
  const m = recipe.macros;
  const list = (items) => `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const ing = recipe.ingredients.map((g) => `${recipe.ingredients.length > 1 ? `<h4>${esc(g.heading)}</h4>` : ""}${list(g.items)}`).join("");
  const steps = recipe.steps.map((s, i) => `<div class="s"><b>${i + 1}. ${esc(s.title)}</b>${s.items.map((x) => `<p>${esc(x)}</p>`).join("")}</div>`).join("");
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>${esc(recipe.swedishTitle)}</title><style>body{font:14px/1.45 Georgia,serif;color:#15261d;margin:24px}header{border-bottom:2px solid #b5862e;padding-bottom:10px;margin-bottom:14px}.b{font:700 10px Arial,sans-serif;letter-spacing:.18em;color:#8a5f1a}h1{margin:6px 0 2px;font-size:25px;color:#123d2b}h2{margin:0 0 6px;font-size:17px}.f{display:flex;flex-wrap:wrap;gap:12px;padding:8px 0;border-block:1px solid #d4c5a5;font:12px Arial,sans-serif;margin:10px 0 16px}.c{display:grid;grid-template-columns:1fr 1.6fr;gap:22px}h3{font:700 11px Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#123d2b;border-bottom:1px solid #d4c5a5;padding-bottom:3px;margin:14px 0 7px}h4{margin:8px 0 4px;font-size:12px;text-transform:uppercase}ul{margin:0;padding-left:18px}.s{margin-bottom:10px;break-inside:avoid}.s p{margin:3px 0 0 14px}.m{margin-top:14px;display:grid;grid-template-columns:repeat(2,1fr);gap:12px}@media(max-width:640px){.c,.m{grid-template-columns:1fr}}@media print{body{margin:12mm}}</style></head><body><header><div class="b">LE CARNET DU NORD · RECETTES DE LA MAISON</div><h1>${esc(recipe.title)}</h1>${recipe.subtitle ? `<div class="b">${esc(recipe.subtitle)}</div>` : ""}<h2>${esc(recipe.swedishTitle)}</h2><p><i>${esc(recipe.description)}</i></p></header><div class="f"><span><b>Total tid:</b> ${esc(recipe.totalLabel)}</span><span><b>Aktiv tid:</b> ${recipe.active} min</span><span><b>Portioner:</b> ${recipe.displayServings}</span><span><b>Energi:</b> ${recipe.kcal} kcal/port</span><span><b>Passar som:</b> ${esc(recipe.occasion)}</span></div><div class="c"><section><h3>Ingredienser</h3>${recipe.displayServings !== recipe.servings ? `<p><small>Mängder för ${recipe.displayServings} ${recipe.displayServings === 1 ? "portion" : "portioner"} (original ${recipe.servings})</small></p>` : ""}${ing}</section><section><h3>Gör så här</h3>${steps}</section></div><div class="m">${recipe.tips.length ? `<div><h3>Serveringstips</h3>${list(recipe.tips)}</div>` : ""}${recipe.sommelier ? `<div><h3>L’accord du sommelier</h3><p><i>${esc(recipe.sommelier)}</i></p></div>` : ""}${recipe.storage ? `<div><h3>Förvaring</h3><p>${esc(recipe.storage)}</p></div>` : ""}${recipe.allergens ? `<div><h3>Allergener</h3><p>${recipe.allergens.length ? esc(recipe.allergens.join(", ")) : "Inga deklarerade allergener."}</p></div>` : ""}<div><h3>Näringsvärde per portion</h3><p>${m.kcal} kcal · Protein ${m.protein} g · Kolhydrater ${m.carbs} g · Fett ${m.fat} g · Fiber ${m.fiber} g</p></div>${recipe.why.length ? `<div><h3>Varför det blir så gott</h3>${list(recipe.why)}</div>` : ""}</div></body></html>`;
}
