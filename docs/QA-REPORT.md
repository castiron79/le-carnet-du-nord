# QA-rapport — Le Carnet du Nord

Datum: 2026-08-11  
Roll: oberoende QA-ledare

## Sammanfattning

Implementation, dokumentation, receptskill, Home Assistant-paketering och produktionsresurser har granskats. De efterfrågade kärnflödena finns. Ett blockerande Ingress-fel hittades och rättades: den förkompilerade klienten använde absoluta resurs- och API-sökvägar, vilka annars lämnar tilläggets dynamiska Ingress-sökväg. Byggkonfiguration och källkod använder nu relativa sökvägar; det redan byggda paketet har en liten kompatibilitetsfil tills nästa ordinarie bygge.

## Kontroller

| Område | Resultat | Evidens |
|---|---|---|
| 6 recept på bred skärm | Godkänd | `slice(0,6)` och sex kolumner |
| 4 recept på surfplatta | Godkänd | brytpunkt 1100 px, kort 5+ döljs |
| 2 recept på telefon | Godkänd | brytpunkt 720 px, kort 3+ döljs |
| Protein + kolhydrat | Godkänd | oberoende filter kombineras med AND; fritext omfattar båda fälten |
| Betyg 1–5 | Godkänd | fem val, klientpersistens och servervaliderad upsert med CHECK 1–5 |
| Kommentar | Godkänd | formulär, lokal fallback och SQLite-lagring |
| Portionsskalning | Godkänd | ren visningsfunktion med tal, bråk, intervall och skydd för temperatur/procent |
| Uppdateringsunderlag | Godkänd | recept-ID, tydligt befintlighetskrav och markerbar urklippsfallback |
| Responsiv receptvy | Godkänd genom kodgranskning | en kolumn under 720 px; fakta, formulär och sidokolumn bryts om |
| Paketstorlek | Godkänd | produktions-JS + CSS cirka 218 KiB; HTML och kompatibilitetsfil tillkommer marginellt |
| Privat drift | Godkänd konfiguration | endast Ingress, `ports: {}`, endast `aarch64` |
| Receptformat | Godkänd genom kodgranskning | obligatoriska metadata, sektioner, bildtyp, datum, tider och makron valideras |
| Säkerhetsbaslinje | Godkänd | CSP/säkerhetsrubriker, JSON-krav, CSRF-rubrik, parametriserad SQL och recept-id-allowlist |

## Automatiska kontroller

Projektets tidigare testfil hörde till startmallen och förväntade en laddningssida som inte längre finns. Den har ersatts med produktspecifika regressionstester för 6/4/2-layouten, råvarufiltren, betyg, anteckningar, Ingress-sökvägar och paketstorlek.

Node.js och Python var inte exponerade i denna QA-miljös kommandosökväg. Därför kunde lint, TypeScript-kompilering, nybyggnation, validatorns faktiska processkörning och ett levande backend-API-test inte köras här. Befintliga byggartefakter var aktuella nog för statisk granskning, men följande ska köras i en miljö med projektets runtime före release:

```text
npm run lint
npx tsc --noEmit
npm test
node skills/create-le-carnet-recipe/scripts/validate-recipe.mjs skills/create-le-carnet-recipe/assets/poulet-du-nord-med-pasta
```

Backendens rekommenderade smoke-test är: starta `server.py` mot en temporär datakatalog, kontrollera `/health`, spara/läs betyg 1 och 5, avvisa 0 och 6, spara både `comment` och `change`, samt verifiera 403 utan `X-Carnet-Request: 1` och 415 för annat än JSON.

Frontendens regressionstest verifierar även 1–20 portioner, återställning till exakta originalsträngar, flera mängder på samma ingrediensrad, decimaler/bråk/intervall, oförändrade temperaturer/procent/minuter, oförändrade makron per portion samt urklippsfallback. Äldre `change`-poster behålls endast som historik.

## Kvarstående avvikelser och risker

1. Dokumentet `docs/ARCHITECTURE.md` beskriver ett större framtida `api/v1`. Den levererade lösningen använder i stället kommentarer och ett versionslåst uppdateringsflöde via chatten; äldre ändringsförslag bevaras endast som historik.
2. Automatisk läsning av validerade Markdown-recept implementerades efter QA-granskningen. Servern läser `review` och `published` från tilläggets `recipes`-mapp och exponerar tillhörande bilder; detta har verifierats i ett efterföljande API-smoke-test.
3. Startsidan visar rätt antal kort per brytpunkt, men kravet ”utan att skrolla” kan inte garanteras på varje fysisk skärmhöjd; hero och kortens höjd kan tillsammans överskrida mycket låga telefonvyer.
4. Makrona i demonstrationsrecepten är redaktionella exempel. Validatorn rimlighetskontrollerar energibalans men verifierar inte automatiskt mot en extern livsmedelsdatabas.
5. Visuell kontroll i riktiga webbläsarstorlekar och på faktisk Home Assistant Green återstår eftersom ingen körbar webbruntime var tillgänglig i QA-miljön.

## Releasebedömning

Gränssnittet, lokal v1-lagring och Markdown-import är lämpliga för intern provdrift. Efter QA-granskningen kördes bygg, receptvalidator och ett levande smoke-test av import, makrodata, betyg, ändringsförslag, SQLite och startsida med godkänt resultat. Den större webbaserade granskningskön i punkt 1 är en planerad förvaltningsfunktion.

## Tillagda acceptansfall för illustrationsfunktion (1.4.0)

Regressionskontroll: äldre recept utan manifest; flera illustrationer i ett enda steg; många steg utan teknisk gräns; fel stegnummer; saknad eller extra bildfil; osäker sökväg; fel bildsignatur. Webbtest: enstaka visa/dölj, globala Visa alla/Dölj alla, bilder dolda och nätverksladdning uppskjuten, mobil, surfplatta, tangentbord och ARIA. Den faktiska CI-statusen ska kontrolleras innan release; manuell mobil-/HA Green-kontroll ska inte rapporteras som genomförd utan observation. Norm: `ILLUSTRATIONS.md`.


## Portionspilot 1.5.0 — verifierad lokalt 2026-10-18

- Webbbygge och separat statiskt HA-bygge godkända. JS/CSS sammanlagt cirka 254 KB.
- 28 Node-tester för app/validator/paket och 10 Python-servertester godkända.
- Receptarkivet: 9 Node-tester och samtliga 13 recept godkända utan validatorvarningar.
- Skill v8 validerad med skill-creator; ZIP med 12 filer och synkroniserad mängdmodul.
- Berörda klientfiler typkontrollerade separat utan fel. Ny JS och ändrade skalningsfunktioner lintkontrollerade utan fel.
- Webbläsare mot den faktiska Python-servern och det byggda HA-paketet: soppa 1/2/4 portioner, lökbiff 1/2/4/20, maxknapp spärrad vid 20, minus spärrad vid 1, notis bara vid ändring, återställning till grundantal, oförändrade tider och makron. Inga råa mängdreferenser visas.
- Mobilkontroll 390 px: notisen är läsbar med 13 px text. Befintlig faktarad sticker ut cirka 8 px vid denna bredd; övrig layout ändrades inte inom portionspiloten.
- Projektets globala lintkontroll har samma tre befintliga fel som basrevisionen: set-state-in-effect och två no-empty i arkivvyns lagring. Global TypeScript-kontroll saknar Cloudflare-typer i db/index.ts och worker/index.ts; berörda klientfiler passerar separat. Dessa befintliga förvaltningsfel ingår inte i denna ändring.
- Ingen körning eller installation på HA Green, ingen ny CI-körning på GitHub och ingen publicering är genomförd. Appen måste uppdateras före referensrecepten. Se PORTION-SCALING.md.
