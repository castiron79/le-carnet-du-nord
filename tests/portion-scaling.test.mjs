import assert from "node:assert/strict";
import test from "node:test";
import { scaleIngredientText, updateRecipePrompt } from "../app/portion-scaling.mjs";

test("skalar vikter, decimaler, bråk och intervall", () => {
  assert.equal(scaleIngredientText("320 g pasta", 0.5), "160 g pasta");
  assert.equal(scaleIngredientText("2,5 dl mjölk", 0.5), "1 ¼ dl mjölk");
  assert.equal(scaleIngredientText("½ rödlök", 2), "1 rödlök");
  assert.equal(scaleIngredientText("1 1/2 dl fond", 0.5), "¾ dl fond");
  assert.equal(scaleIngredientText("250–300 g kött", 0.5), "125–150 g kött");
});

test("skalar alla mängder på samma ingrediensrad", () => {
  assert.equal(scaleIngredientText("2 lökar, cirka 220 g", 0.5), "1 lökar, cirka 110 g");
  assert.equal(scaleIngredientText("10 g olja, cirka 2 tsk", 2), "20 g olja, cirka 4 tsk");
  assert.equal(scaleIngredientText("1 citron, skal och 1 msk juice", 2), "2 citron, skal och 2 msk juice");
});

test("lämnar fri text, procent, temperatur och minuter oförändrade", () => {
  assert.equal(scaleIngredientText("Salt och svartpeppar", 2), "Salt och svartpeppar");
  assert.equal(scaleIngredientText("Ugn 225 °C", 2), "Ugn 225 °C");
  assert.equal(scaleIngredientText("Stek 10 minuter", 2), "Stek 10 minuter");
  assert.equal(scaleIngredientText("Yoghurt 10 %", 2), "Yoghurt 10 %");
});

test("faktor ett och ogiltiga faktorer returnerar exakt original", () => {
  const source = "0,25–0,5 tsk salt";
  assert.equal(scaleIngredientText(source, 1), source);
  assert.equal(scaleIngredientText(source, 0), source);
  assert.equal(scaleIngredientText(source, Number.NaN), source);
});

test("uppdateringsunderlaget identifierar befintligt recept", () => {
  const prompt = updateRecipePrompt({id:"gyros-i-pita",swedishTitle:"Gyros i pita"});
  assert.match(prompt, /Recept-ID: gyros-i-pita/);
  assert.match(prompt, /skapa inte ett nytt recept/i);
  assert.match(prompt, /invänta mitt godkännande/i);
});

