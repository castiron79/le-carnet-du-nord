# Receptspecifikation — Le Carnet du Nord

Version: 1.1.0
Språk: svenska (sv-SE)  
Källformat: en katalog per recept med `recipe.md` och bilder.

## Katalog och namn

```text
recipes/<slug>/
  recipe.md
  hero.webp
  illustrations.json # valfri; krävs när moderna stegbilder används
  step-01-action-01.webp  # exempel
```

`slug` ska vara unik kebab-case med a–z, 0–9 och bindestreck, utan å/ä/ö. Bildnamn ska vara gemener och relativa till receptmappen. Hero-bilden ska vara WebP eller AVIF, helst 1600×1000 px, högst 500 KB. Stegbilder är valfria och styrs av illustrations.json enligt illustrationsstandarden.

## Obligatorisk frontmatter

```yaml
---
schema_version: 1
id: gyros-i-pita
slug: gyros-i-pita
title: Gyros i pita med feta och vitlökssås
restaurant_title: Le Gyros de la Maison
subtitle: Enkelt, gott, alltid rätt
summary: Varm pita med kryddig gyros, grönsaker och krämig sås.
status: published
published_at: 2026-08-11
updated_at: 2026-08-11
servings: 2
prep_minutes: 15
cook_minutes: 15
total_minutes: 30
protein_group: fläsk
carb_group: bröd
meal_type: snabb middag
tags: [grekiskt, vardag]
allergens: [gluten, mjölk]
hero_image: hero.webp
hero_alt: Gyrospita med fetaost, grönsaker och vitlökssås
nutrition:
  basis: per portion
  kcal: 540
  protein_g: 38
  carbs_g: 42
  fat_g: 28
  fiber_g: 6
  method: Beräknat från generiska råvaruvärden och angivna råvikter.
---
```

Tillåtna `status`: `draft`, `review`, `published`, `archived`. `protein_group` och `carb_group` ska vara en dominant, sökbar råvarugrupp, inte kryddor eller små tillbehör. Använd exempelvis `kyckling`, `nöt`, `fläsk`, `fisk`, `skaldjur`, `ägg`, `baljväxter`, `tofu`, `vilt` respektive `pasta`, `ris`, `potatis`, `bröd`, `nudlar`, `gryn`, `baljväxter`, `lågkolhydrat`.

Tider är heltal i minuter och `total_minutes >= prep_minutes + cook_minutes`. Passiv vila kan göra totalen större. Datum är ISO 8601. Alla näringsvärden är numeriska per portion.

## Obligatoriska Markdown-sektioner

Sektionerna ska förekomma exakt en gång och i denna ordning:

```markdown
## Ingredienser
### Gyros
- 300 g gyroskött

## Gör så här
1. **Förbered.** Beskriv ett tydligt moment.

## Serveringstips
- Servera direkt.

## Varför det blir så gott
- Syran balanserar sältan.

## Förvaring
Förvara kylt i högst två dagar.
```

Ingredienser ska ha mängd, enhet och råvara när mängden är känd. Använd svenska hushållsmått (`tsk`, `msk`, `dl`) och gram för precision. Skriv ugnstemperatur i °C. Numrerade moment ska vara genomförbara och kronologiska.

## Makrostandard

1. Använd angivna råvikter och generiska näringsvärden från en lämplig, trovärdig livsmedelsdatabas eller etablerad standardkälla.
2. Räkna varje ingrediens: `mängd × värde per 100 g / 100`.
3. Summera hela receptet och dividera med `servings`.
4. Redovisa kcal som heltal och gram med högst en decimal.
5. Gör en energikontroll: `4 × protein + 4 × kolhydrater + 9 × fett`; en avvikelse upp till cirka 15 % accepteras på grund av fiber, alkohol och avrundning.
6. Dokumentera metoden kort i `nutrition.method`. Ange aldrig att värdena är laboratoriemätta.
7. Om mängder eller råvaror är för oklara för en rimlig beräkning: behåll `status: draft`, markera vad som saknas och publicera inte.

Varumärken och tillagad vikt krävs inte. Salt, vatten och kryddor utan energi får utelämnas ur beräkningen. Makron är bästa möjliga uppskattning, inte medicinsk information.

## Versionsregel

Ändring av schema kräver uppdatering av detta dokument, skillens referens och validator. Innehållsändring ska uppdatera `updated_at`. Ändra aldrig `id` efter publicering.

## Presentation och ikoner

Faktaraden använder ett gemensamt, lokalt ikonsystem. Ikonerna för total tid, aktiv tid, portioner, kcal och måltidstyp skapas automatiskt av sajten från receptets obligatoriska metadata. En receptmapp ska inte innehålla egna faktarikoner. Detta håller alla recept visuellt enhetliga och undviker extra bildfiler på Home Assistant Green.

Receptets huvudbild ska kunna beskäras responsivt. På bred skärm ligger titel och beskrivning bredvid bilden med en tonad övergång från pappersbakgrunden in över bildkanten. Text eller toning ska aldrig bakas in i själva matbilden.

## Manifest för valfria stegillustrationer

Bakåtkompatibelt med `schema_version: 1`. Vid stegillustrationer läggs `illustrations.json` i samma katalog som `recipe.md` och `hero.webp`. Exempel:

```json
{"version":1,"illustrations":[{"step":2,"kind":"action","file":"step-02-action-01.webp","alt":"Älgkött bryns i gryta","caption":"Bryn i små omgångar för en vacker yta."},{"step":2,"kind":"result","file":"step-02-result-02.webp","alt":"Älgkött med brynt stekyta","caption":"Ytan ska vara brynt, inte bränd."}]}
```

`step` pekar på det 1-baserade numret under `Gör så här`; `kind` är action/result/detail. Bildfilen ska heta `step-NN-kind-XX.webp` eller `.avif`, finnas lokalt i katalogen och ha giltig signatur. Flera bilder per steg och obegränsat antal per recept tillåts. Alla bilder, inklusive Hero, skapas och granskas före publicering. Äldre recept utan manifest förblir oförändrade.

## Stegillustrationer – fast standard 1.0 (2026-10-17)

En ny receptbildserie blandar klassiska franska kokboksillustrationer med rena moderna instruktionsbilder. Bilderna är svartvita, med tunna tuschlinjer och lätt skraffering; **endast mat och råvaror får dämpade naturliga färger**. Det får **aldrig finnas text, siffror eller handskrivna noteringar inne i bilden**. Använd separat `caption` under bilden om förklaring behövs. Tre bildtyper: `action` (teknik), `result` (hur det ska se ut), `detail` (viktigt utsnitt). Ingen maxgräns, flera bilder per steg tillåtna. Se `docs/ILLUSTRATIONS.md`.

## Gemensamma mängdreferenser

Valfria `quantities.json` version 1 delar ingrediensmängder mellan lista och steg, utan ändring av `schema_version: 1`. Format, språkformer, antalnotis, validering och migrationsordning är normativa i [PORTION-SCALING.md](PORTION-SCALING.md). Äldre recept fortsätter läsas.

## Visuella timers i receptstandard v10

Alla nya eller uppdaterade receptpaket ska innehålla `timers.json`, även om `timers` är en tom lista. Varje uttrycklig stegtid ska ha en granskad timer på rätt steg. Intervall använder nedre gränsen med hela intervallet i notisen. Separata faser och båda sidor får egna timers. Vaga tider och förpackningsanvisningar får ingen påhittad tid. Tider portionsskalas aldrig. App 1.6.0 är bakåtkompatibel med äldre recept utan fil. Se timerstandarden och kör receptvalidatorn före publicering. Receptets schema_version är fortsatt 1.

## Paketkontroll vid publicering (skillpaket v12)

Endast filer enligt `RECIPE-PACKAGE-FILES.md` får ingå. Kontrollen körs före övrig publiceringsvalidering och inför inga nya storleks- eller bildantalsgränser. Från app 1.6.4 finns motsvarande kontroll vid serverimport och bildutlämning. Bildfunktionen lämnar endast ut vald huvudbild och manifestrefererade stegbilder.
