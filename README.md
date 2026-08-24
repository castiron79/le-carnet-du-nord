# Le Carnet du Nord

Automatisk GitHub-publicering och synkronisering till Home Assistant Green beskrivs i `docs/GITHUB-AUTOMATION.md`. Flödet är mobilanpassat och kräver ingen manuell filkopiering efter engångsinställningen.

**Le Carnet du Nord — Recettes de la maison** är ett privat, lokalt receptarkiv för Home Assistant Green. Sajten är gjord för telefon och surfplatta, använder den fransk-nordiska designmastern och kräver ingen internetanslutning i normal drift.

Projektet är under utveckling. Recept kan läsas och sökas i den aktuella prototypen; beständig import, kommentarer, betyg och ändringsförslag färdigställs enligt [projektplanen](docs/PROJECT-PLAN.md).

## Dokumentation

- [Krav](docs/REQUIREMENTS.md) — spårbara produkt- och driftkrav
- [Projektplan](docs/PROJECT-PLAN.md) — roller, milstolpar och löpande receptflöde
- [Beslut](docs/DECISIONS.md) — styrande produkt- och arkitekturbeslut
- [Receptspecifikation](docs/RECIPE-SPEC.md) — formatet som varje receptpaket måste följa
- [Redaktionell guide](docs/EDITORIAL-GUIDE.md) — språk, bilder, makron och publicering
- [Designsystem](docs/DESIGN-SYSTEM.md) — responsiv tillämpning av designmastern
- [Arkitektur](docs/ARCHITECTURE.md) — lagring, API, säkerhet och resursmål
- [Home Assistant](docs/HOME-ASSISTANT.md) — installation, backup och återställning
- [Användarguide](docs/ANVANDARGUIDE.md) — exakt installation och löpande receptflöde

## Lokal utveckling

Förutsättning: Node.js 22.13 eller senare.

```bash
npm install
npm run dev
```

Kontrollera en ändring före leverans:

```bash
npm run lint
npm test
```

## Installation på Home Assistant Green

Måldistributionen är ett lokalt `aarch64`-tillägg med Home Assistant Ingress och utan exponerad nätverksport. Den färdiga versionen installeras från ett privat tilläggsrepository eller Home Assistants lokala add-on-katalog:

1. Ta en Home Assistant-backup.
2. Installera eller uppdatera **Le Carnet du Nord**.
3. Kontrollera att inga värdportar exponeras och starta tillägget.
4. Öppna det från Home Assistants sidopanel.
5. Verifiera startsida, sökning och en skrivoperation.

Se [Home Assistant-guiden](docs/HOME-ASSISTANT.md) för fullständigt drift- och återställningsflöde. Publicera inte tilläggets internport och öppna ingen routerport.

## Lägga till eller uppdatera recept

1. Skapa en mapp med `recipe.md`, `hero.webp` och eventuella stegbilder enligt [receptspecifikationen](docs/RECIPE-SPEC.md). Projektets lokala receptskill kan skapa paketet.
2. Kör validatorn:

   ```bash
   node skills/create-le-carnet-recipe/scripts/validate-recipe.mjs sokvag/till/receptmappen
   ```

3. Rätta alla fel. Ett recept med osäkra makron eller saknade obligatoriska uppgifter ska stanna som utkast.
4. Kopiera receptmappen till tilläggets `recipes`-mapp under Home Assistants `addon_configs/le_carnet_du_nord`. Recept med status `review` eller `published` läses automatiskt; `draft` visas inte.
5. Kontrollera bild, tider, portioner, sökgrupper och makron i telefon- och surfplattevy.
6. Publicera receptet. En receptuppdatering behåller samma `id`, höjer innehållsversionen och bevarar föregående revision.

Kommentarer och betyg ändrar aldrig receptfilen. Ändringsförslag hamnar i granskningskö och blir en ny receptversion först efter godkännande.

## Ändra ett styrande format

Ändra inte receptschema eller publiceringsregler isolerat. Samma ändring ska omfatta:

1. ett registrerat beslut i [DECISIONS.md](docs/DECISIONS.md);
2. relevanta krav och planer;
3. [RECIPE-SPEC.md](docs/RECIPE-SPEC.md) med versionshöjning;
4. receptskillens referens och instruktioner;
5. validator, exempel och migrering;
6. tester och ändringsnotering.

Detta gör att äldre recept kan fortsätta läsas eller migreras säkert.
