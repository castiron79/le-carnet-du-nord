import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { renderQuantityText, validateQuantityReferences, portionNotice } from "../app/quantity-references.mjs";
import { scaleIngredientText } from "../app/portion-scaling.mjs";

const manifest = {version:1,quantities:[
  {id:"water",amount:6.5,unit:"dl",name:"vatten"},
  {id:"salt",amount:.75,unit:"tsk",name:"salt"},
  {id:"cream",amount:.4,unit:"dl",name:"vispgrädde"},
  {id:"onion",amount:2,name:{one:"gul lök",other:"gula lökar"}},
  {id:"oil",amount:[10,15],unit:"g",name:"olja"},
]};
const ingredientText=manifest.quantities.map(q=>`- {{q:${q.id}}}`).join("\n");

test("list and method share quantities, preserve alternatives and never mutate source",()=>{
  const before=JSON.stringify(manifest);
  for(const factor of [.5,1,2,10]) {
    const list=renderQuantityText("{{q:water}}",manifest,factor);
    const method=renderQuantityText("Häll på {{q:water}} och tillsätt {{q:salt}}. Sjud i 40–50 minuter.",manifest,factor);
    assert.ok(method.includes(list));
    assert.ok(method.endsWith("Sjud i 40–50 minuter."));
  }
  assert.equal(renderQuantityText("{{q:water}}; {{q:salt}}; {{q:cream}}",manifest,.5),"3 ¼ dl vatten; ⅜ tsk salt; 0,2 dl vispgrädde");
  assert.equal(renderQuantityText("{{q:cream}}",manifest),"0,4 dl vispgrädde");
  assert.equal(JSON.stringify(manifest),before);
});

test("explicit word forms, ranges, shares and amount-only references",()=>{
  assert.equal(renderQuantityText("{{q:onion}}",manifest,.5),"1 gul lök");
  assert.equal(renderQuantityText("{{q:onion}}",manifest,.25),"½ gul lök");
  assert.equal(renderQuantityText("{{q:onion}}",manifest,2),"4 gula lökar");
  assert.equal(renderQuantityText("{{q:oil*0.5}} / {{q:water:amount}}",manifest,2),"10–15 g olja / 13 dl");
  assert.equal(renderQuantityText("{{q:salt}}",manifest,1/100),"0,0075 tsk salt");
});

test("non-ingredient numbers and base-recipe counts stay unchanged; notice only on scaling",()=>{
  const text="Värm till 225 °C. Sjud 3–3½ timmar. Dela i 8 bitar, 2 cm tjocka. Använd två skålar, 40 % grädde.";
  assert.equal(renderQuantityText(text,manifest,2),text);
  assert.equal(portionNotice(2,2,true),"");
  assert.match(portionNotice(4,2,true),/grundreceptet för 2 portioner/);
  assert.match(portionNotice(2,1,true),/grundreceptet för 1 portion /);
  assert.match(portionNotice(4,2,false),/Mängder i instruktionerna gäller grundreceptet/);
});

test("malformed, missing, duplicate, unused and invalid references are rejected",()=>{
  assert.deepEqual(validateQuantityReferences(manifest,ingredientText,"1. Häll i {{q:water}}."),[]);
  assert.ok(validateQuantityReferences(undefined,"- {{q:water}}","").length);
  assert.ok(validateQuantityReferences(manifest,ingredientText,"1. {{q:missing}}").length);
  for(const token of ["{{q:water*0}}","{{q:water*2}}","{{q:water:typo}}","{{q:water", "{{q:water*NaN}}"])
    assert.ok(validateQuantityReferences(manifest,ingredientText,`1. ${token}`).length,token);
  for(const amount of [0,-1,NaN,Infinity,true,[],[2,1],[1,2,3],null]) {
    const bad=structuredClone(manifest);bad.quantities[0].amount=amount;
    assert.ok(validateQuantityReferences(bad,ingredientText,"").length);
  }
  const duplicate=structuredClone(manifest);duplicate.quantities.push(duplicate.quantities[0]);
  assert.ok(validateQuantityReferences(duplicate,ingredientText,"").length);
  assert.ok(validateQuantityReferences(manifest,"- {{q:water}}","").length);
  assert.ok(validateQuantityReferences(manifest,ingredientText+"\n- 20 g smör","").length);
  assert.ok(validateQuantityReferences(manifest,ingredientText+"\n### {{q:water}}","").length);
  assert.ok(validateQuantityReferences(manifest,ingredientText,"{{q:water}}").length);
});

test("legacy fractions, fixed package weights, time and percentages",()=>{
  assert.equal(scaleIngredientText("1/2 dl vatten",2),"1 dl vatten");
  assert.equal(scaleIngredientText("1½ msk olja",2),"3 msk olja");
  assert.equal(scaleIngredientText("2 burkar à 400 g",2),"4 burkar à 400 g");
  assert.equal(scaleIngredientText("40 % grädde, 1 timme och 30 sekunder",2),"40 % grädde, 1 timme och 30 sekunder");
});

test("shared quantity copies match the app module",()=>{
  const source=readFileSync(new URL('../app/quantity-references.mjs',import.meta.url),'utf8');
  assert.equal(readFileSync(new URL('../skills/create-le-carnet-recipe/scripts/quantity-references.mjs',import.meta.url),'utf8'),source);
});
