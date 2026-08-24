# Projektplan — Le Carnet du Nord

Version: 1.0  
Fastställd: 2026-08-11  
Produktägare: installationens ägare

## 1. Mål och arbetssätt

Projektet ska leverera ett resurssnålt, privat receptarkiv för Home Assistant Green. Arbetet omfattar webbgränssnitt, lokal lagring, Home Assistant-paketering, receptformat, en återanvändbar receptskill och den dokumentation som krävs för kontinuerlig förvaltning.

Projektet avslutas inte när första sajten är byggd. Grundstrukturen ska göra varje nytt recept till en liten, repeterbar innehållsleverans utan ändring av applikationskoden.

Principer:

- endast produktägaren fattar beslut om omfattning och godkänner publicering;
- dokumenterade krav och beslut styr implementationen;
- ett recept är data, inte handskriven sidkod;
- validering sker före import och publicering;
- användardata överlever omstart, uppgradering och återställning;
- funktion och resursförbrukning verifieras på eller nära Home Assistant Green;
- internet behövs inte i normal drift.

## 2. Roller och ansvar

En person eller agent kan ha flera roller, men ansvarspunkten ska alltid vara tydlig.

| Roll | Huvudansvar | Godkänner/levererar |
|---|---|---|
| Produktägare och kravställare | Prioriteringar, innehåll, målbild, acceptans | Omfattning, namn, publicerade recept och release |
| Projektledare och chefsarkitekt | Plan, beroenden, risker, arkitektur och samordning | Milstolpegrindar och tekniska helhetsval |
| Bemanningsagent | Identifierar kapacitetsbehov och formulerar avgränsade agentuppdrag | Bemanningsförslag; startar specialister efter projektledarens beslut |
| UX/UI- och varumärkesdesigner | Responsiv tolkning av designmastern | Designsystem, vyer och visuell QA |
| Informationsarkitekt/receptredaktör | Schema, metadata, språk och publiceringsflöde | Receptspecifikation och redaktionell kvalitet |
| Frontendutvecklare | Startsida, receptvy, sökning och formulär | Testad klientupplevelse |
| Backend- och Home Assistant-utvecklare | API, SQLite, import, Ingress och paketering | Säker lokal tjänst och add-on |
| Makrogranskare | Beräkningsmetod, rimlighets- och energikontroll | Dokumenterat granskningsresultat; ger inte medicinsk rådgivning |
| QA- och tillgänglighetsgranskare | Funktion, regression, WCAG, enheter och resursmål | Acceptansrapport och avvikelser |
| Dokumentationsansvarig | Styrdokument, driftguide och ändringslogg | Samstämmig dokumentationsrelease |

Bemanningsagenten äger inte produktbeslut eller arkitektur. Projektledaren väljer när en specialist behövs; produktägaren avgör ändrad omfattning.

## 3. Arbetsströmmar

### A. Produkt och design

Förvalta krav, informationsarkitektur, designsystem och referensvyer. Särskilt fokus: 6 senaste recept på dator, 4 på surfplatta och 2 på telefon inom första skärmbilden.

### B. Receptpipeline

Förvalta receptschema, receptskill, validator, bildregler, makroberäkning, import, revisioner och sökindex. Alla delar versionsändras samordnat.

### C. Webb och lokal data

Leverera sökning, receptvisning, kommentarer, 1–5-stjärnigt betyg, ändringsförslag och granskningskö. Kommentarer och betyg lagras separat från receptkällan.

### D. Home Assistant och drift

Leverera ett `aarch64`-tillägg via Ingress, beständig `/data`, backup/restore, uppgraderingar och mätning på liten hårdvara.

### E. Kvalitet och dokumentation

Automatisera schema-, funktion-, tillgänglighets- och regressionstest. Håll krav, beslut, specifikationer, guider och implementation samstämmiga.

## 4. Milstolpar och kvalitetsgrindar

| Milstolpe | Leverans | Klar när |
|---|---|---|
| M0 — Grund och styrning | Namn, roller, krav, beslut, arkitektur, designsystem och receptformat | Produktägaren har godkänt målbilden; varje kärnkrav har ID och acceptansmått |
| M1 — Responsiv läsprototyp | Startsida, sökning, receptkort och receptvy | Designmastern känns igen; 6/4/2-regeln och mobil läsordning är verifierade |
| M2 — Receptpipeline | Skill, validator, exempelpaket, import och sökindex | Ett nytt paket kan skapas, nekas vid fel och publiceras utan kodändring |
| M3 — Interaktion och revision | Kommentarer, betyg, ändringsförslag, granskningskö och historik | Data överlever omstart; förslag kan inte tyst skriva över nyare version |
| M4 — Home Assistant-release | `aarch64`-image, Ingress, `/data`, backup och restore | Kör på Green, exponerar ingen port och fungerar utan internet |
| M5 — Produktionsacceptans | Säkerhets-, tillgänglighets-, prestanda- och återställningstest | Alla P0/P1-krav uppfyllda, inga kritiska fel, produktägaren godkänner |
| M6+ — Förvaltning | Nya recept och prioriterade iterationer | Varje leverans följer ändringskontrollen och har verifierad återställningsväg |

## 5. Löpande receptimport

Varje recept följer samma flöde:

1. Produktägaren lämnar recepttext och separata bilder till receptskillen.
2. Skillen normaliserar struktur, filnamn, tider, råvarugrupper och bildmetadata.
3. Makron beräknas per portion från lämpliga generiska råvaruvärden och råvikter. Metod och osäkerhet dokumenteras.
4. Validatorn kontrollerar schema, obligatoriska sektioner, bildreferenser, portionsmatematik och energirimlighet.
5. Ofullständigt underlag stannar som `draft`; publiceringsfel får inte kringgås.
6. Det färdiga paketet importeras till en temporär yta och valideras på servern igen.
7. Produktägaren förhandsgranskar och publicerar. Publicering uppdaterar register och sökindex atomiskt.
8. Uppdatering av befintligt recept behåller `id`, kontrollerar basversion och arkiverar föregående revision.
9. Backup verifieras regelbundet och före större format- eller programuppdateringar.

Nya recept kräver normalt varken ombyggnad av klienten eller ny add-on-version.

## 6. Ändringskontroll för styrande dokument

Styrande dokument är `REQUIREMENTS.md`, `DECISIONS.md`, `RECIPE-SPEC.md`, `EDITORIAL-GUIDE.md`, `DESIGN-SYSTEM.md`, `ARCHITECTURE.md`, `HOME-ASSISTANT.md`, denna plan samt receptskillens instruktioner och referens.

Varje ändring ska:

1. beskrivas med orsak, omfattning och bakåtkompatibilitet;
2. registreras i `DECISIONS.md` om den påverkar kontrakt, arkitektur, UX-princip eller drift;
3. uppdatera berörda krav-ID:n och acceptanskriterier;
4. höja schema-/formatversion när maskinläsbart receptformat ändras;
5. samtidigt uppdatera receptspecifikation, skill, validator, exempel, migrering och test;
6. kontrollera länkar och begrepp i övriga styrdokument;
7. godkännas av relevant roll och, vid ändrad omfattning eller användarupplevelse, produktägaren.

Dokumentversionsdatum är inte ersättning för beslutspost eller migreringsplan. Ett äldre publicerat recept får aldrig göras oläsbart utan dokumenterad migrering eller kompatibilitetslager.

## 7. Release- och uppdateringsflöde

### Programrelease

1. Frys omfattning och uppdatera krav/beslut.
2. Kör lint, test, bygg, säkerhets- och tillgänglighetskontroller.
3. Verifiera import, sökning, kommentar, betyg, ändringsförslag och konfliktfall.
4. Testa backup och återställning med representativa data.
5. Mät minne, starttid och svarstider.
6. Versionsmärk add-on och dokumentation.
7. Ta backup, uppdatera, genomför smoke test och behåll föregående backup tills godkännande.

### Innehållsrelease

Recept importeras oberoende av programrelease enligt avsnitt 5. En batch får innehålla flera paket endast om varje recept kan valideras, godkännas och återställas separat.

## 8. Risker och motåtgärder

| Risk | Motåtgärd |
|---|---|
| Green får hög minnes- eller CPU-belastning | Förkompilerad klient, en liten serverprocess, importbaserade miniatyrer och mätbara budgetar |
| Felaktiga makron framstår som exakta | Märk som cirka, dokumentera metod, gör energikontroll och stoppa publicering vid oklart underlag |
| Ett schemaändras utan att agenten följer med | Gemensam ändringsgrind för specifikation, skill, validator, exempel, migrering och test |
| Uppgradering skriver över recept | Håll kod skrivskyddad och all användardata i `/data`; testa restore |
| Ingress kringgås | Exponera ingen port, använd relativa URL:er och serverkontrollera skrivande anrop |
| Bildpaket växer okontrollerat | Storleks-, dimensions- och kompressionsgränser vid import |
| Ensam ägare saknar tydlig återställningsväg | Automatiserad Home Assistant-backup och regelbundna restore-prov |

## 9. Framtida iterationer

Efter M5 prioriteras endast med produktägarens beslut. Kandidater:

- favoriter och ”senast lagat”;
- portionsskalning med tydliga avrundningsregler;
- offline-cache/PWA;
- utskriftsvy och QR-länk;
- valfri bevakad `/share`-inkorg;
- bättre jämförelsevy för ändringsförslag;
- export av hela biblioteket med checksummor;
- fler användare med verifierad identitet och serverbaserad behörighet.

Ingen framtida funktion får göra internet, extern databas eller molnkonto obligatoriskt för normal drift.
