const WIN1252 = "\u20ac\u0081\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u008d\u017d\u008f\u0090\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u009d\u017e\u0178";
const CHAR_MAP = { "\u00a0": " ", "⅓": "1/3", "⅔": "2/3", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8", "≤": "<=", "≥": ">=", "✓": "*" };

function norm(t) {
  return String(t || "").replace(/[\u00a0⅓⅔⅛⅜⅝⅞≤≥✓]/g, (c) => CHAR_MAP[c] || " ");
}

function capFirst(t) {
  const s = norm(t).trim();
  return s ? s[0].toLocaleUpperCase("sv") + s.slice(1) : "";
}

function hexStr(text) {
  let h = "<";
  for (const ch of norm(text)) {
    const c = ch.codePointAt(0) ?? 32;
    let b = 0x3f;
    if ((c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff)) b = c;
    else {
      const i = WIN1252.indexOf(ch);
      if (i >= 0) b = 0x80 + i;
    }
    h += b.toString(16).padStart(2, "0");
  }
  return h + ">";
}

function measure(text, size, bold = false, sans = false) {
  const f = (sans ? 0.54 : 0.48) * (bold ? 1.07 : 1);
  let u = 0;
  for (const ch of norm(text)) {
    if ("ilIj.,:;'!| ".includes(ch)) u += 0.52;
    else if ("mwMWÅÄÖŒ".includes(ch) || (ch >= "A" && ch <= "Z")) u += 1.24;
    else u += 1;
  }
  return u * size * f;
}

function wrap(text, maxW, size, bold = false, sans = false) {
  const words = norm(text).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && measure(next, size, bold, sans) > maxW) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function loadRecipeImageJpeg(src) {
  if (!src || typeof document === "undefined" || typeof Image === "undefined") return null;
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = src;
    });
    const tw = 1024, th = 368;
    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#f2ede2";
    ctx.fillRect(0, 0, tw, th);
    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;
    if (!sw || !sh) return null;
    const targetRatio = tw / th;
    const srcRatio = sw / sh;
    let sx = 0, sy = 0, cw = sw, ch = sh;
    if (srcRatio > targetRatio) {
      cw = sh * targetRatio;
      sx = (sw - cw) / 2;
    } else {
      ch = sw / targetRatio;
      sy = (sh - ch) / 2;
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, cw, ch, 0, 0, tw, th);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
    const b64 = dataUrl.split(",")[1];
    if (!b64) return null;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes, width: tw, height: th };
  } catch {
    return null;
  }
}

function buildCards(recipe) {
  const m = recipe.macros;
  const allergenTxt = recipe.allergens
    ? (recipe.allergens.length ? recipe.allergens.map(capFirst).join(", ") : "Inga deklarerade allergener")
    : "";
  const cards = [];
  cards.push({
    key: "meta",
    title: "Allergener & näringsvärde",
    accent: "0.07 0.24 0.17",
    lines: [
      ...(allergenTxt ? [`Allergener: ${allergenTxt}.`] : []),
      `${m.kcal} kcal/port · Protein ${m.protein} g · Kolh. ${m.carbs} g · Fett ${m.fat} g · Fiber ${m.fiber} g`,
    ],
  });
  if (recipe.tips?.length) cards.push({ key: "tips", title: "Serveringstips", accent: "0.07 0.24 0.17", bullets: recipe.tips });
  if (recipe.sommelier) cards.push({ key: "sommelier", title: "L'accord du sommelier", accent: "0.56 0.39 0.10", italic: true, lines: [recipe.sommelier] });
  if (recipe.storage) cards.push({ key: "storage", title: "Förvaring", accent: "0.07 0.24 0.17", lines: [recipe.storage] });
  if (recipe.why?.length) cards.push({ key: "why", title: "Varför det blir så gott", accent: "0.56 0.39 0.10", bullets: recipe.why });
  return cards;
}

function buildIngRows(recipe, width) {
  const rows = [];
  if (recipe.displayServings !== recipe.servings) {
    for (const l of wrap(`Mängder för ${recipe.displayServings} ${recipe.displayServings === 1 ? "portion" : "portioner"} (orig. ${recipe.servings}).`, width, 8, false, false)) {
      rows.push({ text: l, font: "F3", size: 8, lh: 10.5, rgb: "0.56 0.39 0.10" });
    }
    rows.push({ gap: 3 });
  }
  recipe.ingredients.forEach((g, gi) => {
    if (recipe.ingredients.length > 1) {
      if (gi > 0) rows.push({ gap: 4 });
      for (const l of wrap(g.heading, width, 8.5, true, true)) {
        rows.push({ text: l, font: "F5", size: 8.5, lh: 11.5, rgb: "0.07 0.24 0.17" });
      }
    }
    for (const item of g.items) {
      const wrapped = wrap(item, width - 8, 8.8, false, false);
      wrapped.forEach((l, li) => rows.push({ text: li === 0 ? `•  ${l}` : l, dx: li === 0 ? 0 : 8, font: "F1", size: 8.8, lh: 11.8, rgb: "0.11 0.15 0.12" }));
    }
  });
  return rows;
}

function measureCard(card, width) {
  const iw = width - 16;
  const rows = [];
  const font = card.italic ? "F3" : "F1";
  const src = card.bullets ? card.bullets.map((b) => `•  ${b}`) : (card.lines || []);
  for (const s of src) {
    for (const l of wrap(s, iw, 8.4, false, false)) rows.push({ text: l, font });
  }
  return { card, rows, h: 10 + 11 + rows.length * 11 + 6 };
}

function measureStep(step, idx, width) {
  const tw = width - 22;
  const titleLines = wrap(step.title, tw, 9.8, true, false);
  const bodyLines = [];
  for (const item of step.items) {
    for (const l of wrap(item, tw, 9.2, false, false)) bodyLines.push(l);
  }
  const h = Math.max(15, titleLines.length * 12.5) + bodyLines.length * 12.2 + 8;
  return { idx, titleLines, bodyLines, h };
}

export function buildRecipePdfBytes(recipe) {
  const W = 595.28, H = 841.89, M = 38, CW = W - M * 2, BOTTOM = 48;
  const LW = 186, GAP = 18, RW = CW - LW - GAP, RX = M + LW + GAP;
  const G = "0.07 0.24 0.17", AU = "0.71 0.53 0.18", AUD = "0.56 0.39 0.10";
  const INK = "0.11 0.15 0.12", MUTED = "0.35 0.39 0.35", LINE = "0.84 0.80 0.71";
  const SAND = "0.95 0.93 0.89", CREAM = "0.98 0.96 0.93", WHITE = "1 1 1";
  const swTitle = recipe.swedishTitle || recipe.title;
  const frSub = [recipe.title, recipe.subtitle].filter(Boolean).join(" · ");
  const hasImg = Boolean(recipe.imageJpeg?.bytes?.length && recipe.imageJpeg.width > 0 && recipe.imageJpeg.height > 0);

  const pages = [[]];
  let pi = 0;
  const P = () => pages[pi];
  const txt = (t, x, y, s, f, rgb) => P().push(`BT /${f} ${s} Tf ${rgb} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm ${hexStr(t)} Tj ET`);
  const txtC = (t, cx, y, s, f, rgb) => txt(t, cx - measure(t, s, f === "F2" || f === "F5", f === "F4" || f === "F5") / 2, y, s, f, rgb);
  const ln = (x1, y1, x2, y2, rgb, w = 0.75) => P().push(`${w} w ${rgb} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  const rect = (x, y, w, h, rgb) => P().push(`${rgb} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  const stroke = (x, y, w, h, rgb, lw = 0.65) => P().push(`${lw} w ${rgb} RG ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  const box = (x, y, w, h, fill, border = LINE) => { rect(x, y, w, h, fill); stroke(x, y, w, h, border); };

  const addPage = () => {
    pages.push([]);
    pi = pages.length - 1;
    const top = H - M;
    txt(swTitle, M, top - 10, 10, "F2", G);
    if (recipe.title) {
      const off = measure(swTitle, 10, true, false) + 8;
      if (off + measure(recipe.title, 7.5, true, true) < CW - 65) txt(recipe.title, M + off, top - 9.5, 7.5, "F5", AUD);
    }
    ln(M, top - 16, W - M, top - 16, AU, 0.7);
    return top - 28;
  };

  // --- Sida 1: Bistro-vinjett + svensk titel + fransk undertitel + helbreddsbild + faktarad ---
  let y = H - M;
  rect(M, y - 22, CW, 22, G);
  rect(M, y - 24, CW, 2, AU);
  txt("LE CARNET DU NORD", M + 10, y - 14.5, 8.5, "F5", "0.99 0.98 0.96");
  const rightTag = "RECETTES DE LA MAISON";
  txt(rightTag, W - M - 10 - measure(rightTag, 7.5, true, true), y - 14, 7.5, "F5", "0.89 0.74 0.42");
  y -= 42;

  for (const l of wrap(swTitle, CW - 16, 19, true, false)) {
    txtC(l, W / 2, y, 19, "F2", G);
    y -= 22;
  }
  if (frSub) {
    for (const l of wrap(frSub.toLocaleUpperCase("sv"), CW - 24, 8, true, true)) {
      txtC(l, W / 2, y + 3, 8, "F5", AUD);
      y -= 11;
    }
  }
  if (recipe.description) {
    y -= 2;
    for (const l of wrap(recipe.description, CW - 40, 9.2, false, false).slice(0, 3)) {
      txtC(l, W / 2, y, 9.2, "F3", MUTED);
      y -= 12;
    }
  }
  y -= 5;

  if (hasImg) {
    const imgH = 180;
    const imgY = y - imgH;
    P().push(`q ${CW.toFixed(2)} 0 0 ${imgH.toFixed(2)} ${M.toFixed(2)} ${imgY.toFixed(2)} cm /Im1 Do Q`);
    stroke(M, imgY, CW, imgH, LINE, 0.8);
    y = imgY - 9;
  }

  // Faktarad (5 kolumner)
  const factH = 30;
  box(M, y - factH, CW, factH, SAND, LINE);
  const facts = [
    ["TID", recipe.totalLabel],
    ["AKTIV", `${recipe.active} min`],
    ["PORTIONER", `${recipe.displayServings} ${recipe.displayServings === 1 ? "portion" : "portioner"}`],
    ["ENERGI", `${recipe.kcal} kcal`],
    ["PASSAR SOM", capFirst(recipe.occasion)],
  ];
  const colW = CW / facts.length;
  facts.forEach(([k, v], i) => {
    const cx = M + colW * i + colW / 2;
    if (i > 0) ln(M + colW * i, y - 5, M + colW * i, y - factH + 5, LINE, 0.5);
    txtC(k, cx, y - 11, 6.8, "F5", AUD);
    txtC(v, cx, y - 23, 8.8, "F5", G);
  });
  const bodyTop1 = y - factH - 14;
  const avail1 = bodyTop1 - BOTTOM;

  // --- Hjälpare för att rita sektioner ---
  const drawHead = (title, x, topY, w) => {
    txt(title.toLocaleUpperCase("sv"), x, topY - 9, 8.5, "F5", G);
    ln(x, topY - 13, x + w, topY - 13, AU, 0.7);
    return topY - 21;
  };

  const drawIngSlice = (rows, startIdx, x, topY, w, maxBottom, heading) => {
    const headH = 20;
    let curH = headH + 10;
    let end = startIdx;
    while (end < rows.length) {
      const rh = rows[end].gap ?? rows[end].lh;
      if (topY - (curH + rh + 6) < maxBottom && end > startIdx) break;
      curH += rh;
      end++;
    }
    const boxH = curH + 6;
    box(x, topY - boxH, w, boxH, CREAM, LINE);
    let cy = drawHead(heading, x + 9, topY - 6, w - 18);
    for (let i = startIdx; i < end; i++) {
      const r = rows[i];
      if (r.gap) { cy -= r.gap; continue; }
      txt(r.text, x + 9 + (r.dx || 0), cy - r.size + 1, r.size, r.font, r.rgb);
      cy -= r.lh;
    }
    return { nextIdx: end, bottomY: topY - boxH };
  };

  const drawCard = (mc, x, topY, w) => {
    box(x, topY - mc.h, w, mc.h, WHITE, LINE);
    txt(mc.card.title.toLocaleUpperCase("sv"), x + 8, topY - 13, 7.6, "F5", mc.card.accent);
    let cy = topY - 25;
    for (const r of mc.rows) {
      txt(r.text, x + 8, cy, 8.4, r.font, INK);
      cy -= 11;
    }
    return topY - mc.h;
  };

  const drawStepBlock = (ms, x, topY, w) => {
    rect(x, topY - 14, 15, 14, G);
    txtC(String(ms.idx + 1), x + 7.5, topY - 10.2, 8.2, "F5", WHITE);
    let cy = topY - 10;
    for (const l of ms.titleLines) {
      txt(l, x + 21, cy, 9.8, "F2", G);
      cy -= 12.5;
    }
    cy = Math.min(cy, topY - 18) - 2;
    for (const l of ms.bodyLines) {
      txt(l, x + 21, cy, 9.2, "F1", INK);
      cy -= 12.2;
    }
    ln(x, topY - ms.h + 3, x + w, topY - ms.h + 3, "0.91 0.88 0.82", 0.5);
    return topY - ms.h;
  };

  const drawCardsGrid = (cardList, startY) => {
    const halfW = (CW - 12) / 2;
    let cy = startY;
    for (let i = 0; i < cardList.length; i += 2) {
      const a = measureCard(cardList[i], halfW);
      const b = cardList[i + 1] ? measureCard(cardList[i + 1], halfW) : null;
      const rowH = Math.max(a.h, b ? b.h : 0);
      if (cy - rowH < BOTTOM) cy = addPage();
      drawCard({ ...a, h: rowH }, M, cy, halfW);
      if (b) drawCard({ ...b, h: rowH }, M + halfW + 12, cy, halfW);
      cy -= rowH + 8;
    }
    return cy;
  };

  // --- Mätning för 1-sida / 2-sidor / 3+-sidor standard ---
  const ingRows = buildIngRows(recipe, LW - 18);
  const ingTotalH = 36 + ingRows.reduce((s, r) => s + (r.gap ?? r.lh), 0);
  const stepsRight = recipe.steps.map((s, i) => measureStep(s, i, RW));
  const stepsTotalRightH = 22 + stepsRight.reduce((s, x) => s + x.h, 0);
  const cards = buildCards(recipe);
  const halfW = (CW - 12) / 2;
  let gridH = 0;
  for (let i = 0; i < cards.length; i += 2) {
    const a = measureCard(cards[i], halfW).h;
    const b = cards[i + 1] ? measureCard(cards[i + 1], halfW).h : 0;
    gridH += Math.max(a, b) + 8;
  }

  // LÄGE 1: 1 SIDA (kort recept) -> 2 spalter + 2-kolumns faktaband i botten
  if (Math.max(ingTotalH, stepsTotalRightH) + (cards.length ? 10 + gridH : 0) <= avail1) {
    const ingRes = drawIngSlice(ingRows, 0, M, bodyTop1, LW, BOTTOM, "Ingredienser");
    let ry = drawHead("Gör så här", RX, bodyTop1, RW);
    for (const ms of stepsRight) ry = drawStepBlock(ms, RX, ry, RW);
    const belowY = Math.min(ingRes.bottomY, ry) - 10;
    if (cards.length) drawCardsGrid(cards, belowY);
  } else {
    // Sida 1: 2-spalt (Ingredienser vänster, Gör så här startar höger)
    const ing1 = drawIngSlice(ingRows, 0, M, bodyTop1, LW, BOTTOM, "Ingredienser");
    let ingNext = ing1.nextIdx;
    let metaOnP1 = false;
    if (ingNext >= ingRows.length && cards[0]?.key === "meta") {
      const metaCard = measureCard(cards[0], LW);
      if (ing1.bottomY - 8 - metaCard.h >= BOTTOM) {
        drawCard(metaCard, M, ing1.bottomY - 8, LW);
        metaOnP1 = true;
      }
    }
    let ry = drawHead("Gör så här", RX, bodyTop1, RW);
    let stepNext = 0;
    while (stepNext < stepsRight.length) {
      const ms = stepsRight[stepNext];
      if (ry - ms.h < BOTTOM && stepNext > 0) break;
      if (ry - ms.h < BOTTOM) break;
      ry = drawStepBlock(ms, RX, ry, RW);
      stepNext++;
    }

    // Kontrollera om allt återstående ryms på exakt Sida 2 (LÄGE 2: 2-sidors kokboksuppslag)
    const p2Avail = (H - M - 28) - BOTTOM;
    const remIngH = ingNext < ingRows.length ? 36 + ingRows.slice(ingNext).reduce((s, r) => s + (r.gap ?? r.lh), 0) + 10 : 0;
    const leftCards = cards.filter((c) => c.key !== "tips" && !(metaOnP1 && c.key === "meta")).map((c) => measureCard(c, LW));
    const rightTips = cards.find((c) => c.key === "tips");
    const rightTipsM = rightTips ? measureCard(rightTips, RW) : null;
    const p2LeftH = remIngH + leftCards.reduce((s, c) => s + c.h + 8, 0);
    const remStepsRight = stepsRight.slice(stepNext);
    const p2RightH = (remStepsRight.length ? 22 + remStepsRight.reduce((s, x) => s + x.h, 0) : 0) + (rightTipsM ? rightTipsM.h + 10 : 0);

    if (p2LeftH <= p2Avail && p2RightH <= p2Avail) {
      // LÄGE 2: 2 SIDOR – klassiskt 2-spaltsuppslag på Sida 2
      const top2 = addPage();
      let ly = top2;
      if (ingNext < ingRows.length) {
        ly = drawIngSlice(ingRows, ingNext, M, ly, LW, BOTTOM, "Ingredienser (forts.)").bottomY - 10;
      }
      for (const mc of leftCards) ly = drawCard(mc, M, ly, LW) - 8;

      let r2y = top2;
      if (remStepsRight.length) {
        r2y = drawHead(stepNext > 0 ? "Gör så här (forts.)" : "Gör så här", RX, r2y, RW);
        for (const ms of remStepsRight) r2y = drawStepBlock(ms, RX, r2y, RW);
        r2y -= 6;
      }
      if (rightTipsM) drawCard(rightTipsM, RX, r2y, RW);
    } else {
      // LÄGE 3: 3+ SIDOR – släpp vänsterspalten när ingredienserna är slut → full bredd för steg + faktakort på slutet
      let cy = addPage();
      while (ingNext < ingRows.length) {
        const slice = drawIngSlice(ingRows, ingNext, M, cy, LW, BOTTOM, "Ingredienser (forts.)");
        ingNext = slice.nextIdx;
        let r2y = drawHead(stepNext > 0 ? "Gör så här (forts.)" : "Gör så här", RX, cy, RW);
        while (stepNext < stepsRight.length && r2y - stepsRight[stepNext].h >= BOTTOM) {
          r2y = drawStepBlock(stepsRight[stepNext], RX, r2y, RW);
          stepNext++;
        }
        cy = Math.min(slice.bottomY, r2y) - 12;
        if (ingNext < ingRows.length) cy = addPage();
      }

      if (stepNext < recipe.steps.length) {
        const remFull = recipe.steps.slice(stepNext).map((s, i) => measureStep(s, stepNext + i, CW));
        if (cy < BOTTOM + 70) cy = addPage();
        cy = drawHead(stepNext > 0 ? "Gör så här (forts.)" : "Gör så här", M, cy, CW);
        for (const ms of remFull) {
          if (cy - ms.h < BOTTOM) {
            if (cy < H - M - 40) cy = addPage();
            cy = drawHead("Gör så här (forts.)", M, cy, CW);
          }
          cy = drawStepBlock(ms, M, cy, CW);
        }
        cy -= 8;
      }

      const remCards = cards.filter((c) => !(metaOnP1 && c.key === "meta"));
      if (remCards.length) drawCardsGrid(remCards, cy);
    }
  }

  // Sidfot + sidnummer i sidhuvud på sida 2+
  const totalPages = pages.length;
  pages.forEach((cmds, idx) => {
    const pn = idx + 1;
    if (pn > 1) {
      const label = `Sida ${pn} av ${totalPages}`;
      cmds.push(`BT /F4 7.5 Tf ${MUTED} rg 1 0 0 1 ${(W - M - measure(label, 7.5, false, true)).toFixed(2)} ${(H - M - 9.5).toFixed(2)} Tm ${hexStr(label)} Tj ET`);
    }
    cmds.push(`0.6 w ${LINE} RG ${M} 34 m ${(W - M).toFixed(2)} 34 l S`);
    cmds.push(`BT /F4 7.5 Tf ${MUTED} rg 1 0 0 1 ${M} 22 Tm ${hexStr(`Le Carnet du Nord · ${swTitle}`)} Tj ET`);
    const pTxt = `Sida ${pn} av ${totalPages}`;
    cmds.push(`BT /F4 7.5 Tf ${MUTED} rg 1 0 0 1 ${(W - M - measure(pTxt, 7.5, false, true)).toFixed(2)} 22 Tm ${hexStr(pTxt)} Tj ET`);
  });

  // --- Serialisera PDF 1.4 ---
  const enc = new TextEncoder();
  const chunks = [];
  let offset = 0;
  const pushBytes = (b) => { chunks.push(b); offset += b.length; };
  const pushStr = (s) => pushBytes(enc.encode(s));

  pushBytes(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const fonts = ["Times-Roman", "Times-Bold", "Times-Italic", "Helvetica", "Helvetica-Bold"];
  const fontDict = fonts.map((_, i) => `/F${i + 1} ${3 + i} 0 R`).join(" ");
  const imgObjId = hasImg ? 8 : 0;
  const firstPageId = hasImg ? 9 : 8;
  const pageIds = pages.map((_, i) => firstPageId + i * 2);

  const offsets = [0];
  const writeObj = (str) => { offsets.push(offset); pushStr(str); };

  writeObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  writeObj(`2 0 obj\n<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`);
  fonts.forEach((name, i) => writeObj(`${3 + i} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>\nendobj\n`));

  if (hasImg) {
    const img = recipe.imageJpeg;
    offsets.push(offset);
    pushStr(`${imgObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`);
    pushBytes(img.bytes);
    pushStr("\nendstream\nendobj\n");
  }

  pages.forEach((cmds, i) => {
    const pid = pageIds[i];
    const streamBytes = enc.encode(cmds.join("\n"));
    const xobj = i === 0 && hasImg ? ` /XObject << /Im1 ${imgObjId} 0 R >>` : "";
    writeObj(`${pid} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << ${fontDict} >>${xobj} >> /Contents ${pid + 1} 0 R >>\nendobj\n`);
    offsets.push(offset);
    pushStr(`${pid + 1} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`);
    pushBytes(streamBytes);
    pushStr("\nendstream\nendobj\n");
  });

  const xrefOffset = offset;
  pushStr(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (let i = 1; i < offsets.length; i++) pushStr(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  pushStr(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const out = new Uint8Array(offset);
  let pos = 0;
  for (const c of chunks) { out.set(c, pos); pos += c.length; }
  return out;
}

function esc(v) {
  return String(v || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

export function buildPrintableHtml(recipe) {
  const m = recipe.macros;
  const swTitle = recipe.swedishTitle || recipe.title;
  const frSub = [recipe.title, recipe.subtitle].filter(Boolean).join(" · ");
  const list = (items) => `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const ing = recipe.ingredients.map((g) => `${recipe.ingredients.length > 1 ? `<h4>${esc(g.heading)}</h4>` : ""}${list(g.items)}`).join("");
  const steps = recipe.steps.map((s, i) => `<div class="s"><span class="n">${i + 1}</span><div><b>${esc(s.title)}</b>${s.items.map((x) => `<p>${esc(x)}</p>`).join("")}</div></div>`).join("");
  const hero = recipe.imageUrl ? `<div class="hero"><img src="${esc(recipe.imageUrl)}" alt="${esc(swTitle)}"></div>` : "";
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>${esc(swTitle)}</title><style>*{box-sizing:border-box}body{font:13.5px/1.45 Georgia,serif;color:#18231c;margin:20px;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.bar{background:#123d2b;color:#fdfbf7;border-bottom:2.5px solid #b5862e;padding:7px 14px;display:flex;justify-content:space-between;font:700 10px Arial,sans-serif;letter-spacing:.18em}.bar span:last-child{color:#e2bc6b}header{text-align:center;margin:14px 0 10px}h1{margin:0;font-size:25px;color:#123d2b}.sub{font:700 10px Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#8e6419;margin-top:3px}.desc{margin:5px auto 0;max-width:560px;font-style:italic;color:#4a584e}.hero{margin:10px 0;border:1px solid #d6cbb4;overflow:hidden;border-radius:4px}.hero img{display:block;width:100%;aspect-ratio:2.8/1;object-fit:cover}.f{display:grid;grid-template-columns:repeat(5,1fr);background:#f2ede2;border:1px solid #d6cbb4;padding:7px 4px;margin:0 0 16px;text-align:center;font-family:Arial,sans-serif}.f div+div{border-left:1px solid #d6cbb4}.f small{display:block;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#8e6419;font-weight:700}.f b{font-size:12px;color:#123d2b}.c{display:grid;grid-template-columns:36% 1fr;gap:20px;align-items:start}.ing{background:#faf6ed;border:1px solid #d6cbb4;padding:12px 14px}h3{font:700 10.5px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#123d2b;border-bottom:1px solid #b5862e;padding-bottom:3px;margin:0 0 9px}h4{margin:9px 0 3px;font:700 11px Arial,sans-serif;color:#123d2b}ul{margin:0;padding-left:16px}li{margin:3px 0}.s{display:grid;grid-template-columns:20px 1fr;gap:9px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #ece5d8;break-inside:avoid}.n{width:20px;height:20px;background:#123d2b;color:#fff;font:700 11px/20px Arial,sans-serif;text-align:center}.s b{color:#123d2b}.s p{margin:3px 0 0}.cards{margin-top:14px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.card{border:1px solid #d6cbb4;padding:9px 11px;break-inside:avoid}.card h3{border:0;margin:0 0 4px;padding:0;font-size:9.5px}.card p{margin:0;font-size:12.5px}@media(max-width:640px){.c,.cards,.f{grid-template-columns:1fr}.f div+div{border:0}}@media print{@page{size:A4;margin:11mm}body{margin:0}}</style></head><body><div class="bar"><span>LE CARNET DU NORD</span><span>RECETTES DE LA MAISON</span></div><header><h1>${esc(swTitle)}</h1>${frSub ? `<div class="sub">${esc(frSub)}</div>` : ""}${recipe.description ? `<p class="desc">${esc(recipe.description)}</p>` : ""}</header>${hero}<div class="f"><div><small>Tid</small><b>${esc(recipe.totalLabel)}</b></div><div><small>Aktiv</small><b>${recipe.active} min</b></div><div><small>Portioner</small><b>${recipe.displayServings}</b></div><div><small>Energi</small><b>${recipe.kcal} kcal</b></div><div><small>Passar som</small><b>${esc(capFirst(recipe.occasion))}</b></div></div><div class="c"><section class="ing"><h3>Ingredienser</h3>${recipe.displayServings !== recipe.servings ? `<p><small><i>Mängder för ${recipe.displayServings} ${recipe.displayServings === 1 ? "portion" : "portioner"} (original ${recipe.servings})</i></small></p>` : ""}${ing}</section><section><h3>Gör så här</h3>${steps}</section></div><div class="cards"><div class="card"><h3>Allergener &amp; näringsvärde</h3><p>${recipe.allergens ? `Allergener: ${recipe.allergens.length ? esc(recipe.allergens.map(capFirst).join(", ")) : "Inga deklarerade"}. ` : ""}${m.kcal} kcal/port · Protein ${m.protein} g · Kolh. ${m.carbs} g · Fett ${m.fat} g · Fiber ${m.fiber} g</p></div>${recipe.tips.length ? `<div class="card"><h3>Serveringstips</h3>${list(recipe.tips)}</div>` : ""}${recipe.sommelier ? `<div class="card"><h3>L’accord du sommelier</h3><p><i>${esc(recipe.sommelier)}</i></p></div>` : ""}${recipe.storage ? `<div class="card"><h3>Förvaring</h3><p>${esc(recipe.storage)}</p></div>` : ""}${recipe.why.length ? `<div class="card"><h3>Varför det blir så gott</h3>${list(recipe.why)}</div>` : ""}</div></body></html>`;
}
