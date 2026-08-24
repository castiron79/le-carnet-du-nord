# Beslutslogg — Le Carnet du Nord

Version: 1.0  
Senast uppdaterad: 2026-08-11

## Användning

Detta är projektets korta arkitektur- och produktbeslutslogg. Beslut är normerande tills de ersätts. En ändring som påverkar kontrakt, användarupplevelse, säkerhetsgräns, datalagring eller drift ska få en ny post; historiska poster raderas inte.

Statusvärden: **Godkänt**, **Ersatt**, **Föreslaget**. En ersättande post hänvisar till den gamla och beskriver migrering och bakåtkompatibilitet.

## Godkända beslut

### D-001 — Produktnamn och visuell riktning

- **Datum/status:** 2026-08-11 — Godkänt
- **Beslut:** Produkten heter **Le Carnet du Nord** med undertiteln **Recettes de la maison**. De tre uppladdade designmastrarna styr ett lagom högtidligt fransk-nordiskt restauranguttryck.
- **Konsekvens:** Receptvyn efterliknar masterns hierarki men blir responsiv och läsbar, inte en fast A4-bild.
- **Spårar:** UX-003, UX-004.

### D-002 — Privat Home Assistant-tillägg

- **Datum/status:** 2026-08-11 — Godkänt
- **Beslut:** Sajten körs lokalt på Home Assistant Green som `aarch64`-tillägg via Ingress. Den exponeras inte publikt och får ingen mappad värdport.
- **Konsekvens:** Home Assistant-inloggning är säkerhetsgräns. Ingen egen login eller publik drift ingår.
- **Spårar:** INT-004, OPS-001, OPS-002, OPS-007.

### D-003 — Markdownpaket är receptets källa

- **Datum/status:** 2026-08-11 — Godkänt
- **Beslut:** Varje recept består av en strukturerad `recipe.md` och lokala bilder i en egen mapp. Rå HTML är inte tillåten receptkälla.
- **Skäl:** Formatet är lätt att skapa, läsa, versionshantera och validera samt håller layouten central.
- **Konsekvens:** Nya recept ändrar inte sidkod. Stabilt `id` och slug används genom revisioner.
- **Spårar:** REC-001, REC-002, REC-006, OPS-005.

### D-004 — SQLite för interaktionsdata

- **Datum/status:** 2026-08-11 — Godkänt
- **Beslut:** Kommentarer, betyg, ändringsförslag, register och auditdata lagras i lokal SQLite under `/data`; recepttexten förblir i Markdown.
- **Konsekvens:** Kommentarer/betyg överlever receptuppdatering. Backup ska använda en konsekvent SQLite-snapshot, inte rå kopiering av aktiv databas.
- **Spårar:** INT-001–INT-006, OPS-003, OPS-004.

### D-005 — Ägarstyrd granskning av ändringar

- **Datum/status:** 2026-08-11 — Godkänt
- **Beslut:** Endast ägaren beräknas använda sajten. Ändringsförslag hamnar i granskningskö och får aldrig uppdatera receptet direkt.
- **Konsekvens:** Ingen intern fleranvändarrollmodell krävs i version 1. Godkännande kontrollerar basversion och validerar hela kandidaten.
- **Spårar:** INT-003, INT-004, INT-005.

### D-006 — Sökning använder stora råvarugrupper

- **Datum/status:** 2026-08-11 — Godkänt
- **Beslut:** Gemensam sökning matchar namn, dominant protein och dominant kolhydrat, var för sig eller i kombination. Exempel är `kyckling` + `pasta`; små tillbehör och kryddor är inte huvudgrupper.
- **Konsekvens:** Metadata använder kontrollerade, normaliserade grupper och flera söktermer kombineras med AND.
- **Spårar:** REC-005, UX-002.

### D-007 — Makron är bästa rimliga uppskattning

- **Datum/status:** 2026-08-11 — Godkänt
- **Beslut:** Makron per portion beräknas från lämpliga generiska råvaruvärden och angivna råvikter. Produktbilder, varumärken och tillagad vikt krävs inte.
- **Konsekvens:** Värden märks som cirka, metod anges och energirimlighet kontrolleras. Oklart underlag stannar som utkast.
- **Spårar:** REC-003, REC-004.

### D-008 — Startsida utan skroll i referensvyn

- **Datum/status:** 2026-08-11 — Godkänt
- **Beslut:** Startsidan prioriterar sökning och senaste recept inom första skärmbilden: 6 kort på dator, 4 på surfplatta och 2 på telefon.
- **Konsekvens:** Övriga recept nås via arkiv/sökning; exakta brytpunkter följer designsystemet.
- **Spårar:** UX-001.

### D-009 — Lokal Codex-skill för receptproduktion

- **Datum/status:** 2026-08-11 — Godkänt
- **Beslut:** En projektlokal skill används i stället för en fristående special-GPT för att skapa, namnge, paketera och validera recept.
- **Skäl:** Instruktion och format kan versionshanteras tillsammans med projektet.
- **Konsekvens:** Skill, specifikation, validator, exempel, migrering och test måste hållas samstämmiga.
- **Spårar:** REC-007, GOV-002, GOV-003.

### D-010 — Projektledning styr bemanning

- **Datum/status:** 2026-08-11 — Godkänt
- **Beslut:** Projektledaren/chefsarkitekten ansvarar för helheten. Bemanningsagenten identifierar och startar avgränsade specialister efter behov men fattar inte produkt- eller arkitekturbeslut.
- **Konsekvens:** Produktägaren godkänner ändrad omfattning; roller och leveranser finns i projektplanen.
- **Spårar:** GOV-004.

### D-011 — Styrdokument ändras som kontrollerat system

- **Datum/status:** 2026-08-11 — Godkänt
- **Beslut:** Förändringar i receptformat eller publiceringskontrakt ska registreras här och genomföras samordnat i krav, specifikation, skill, validator, exempel, migrering, test och relevanta guider.
- **Konsekvens:** Bakåtkompatibilitet eller explicit migrering krävs innan ändringen släpps.
- **Spårar:** GOV-001, GOV-002, GOV-005.

### D-012 — Gemensamma ikoner och responsiv bildtoning

- **Datum/status:** 2026-08-11 — Godkänt
- **Beslut:** Faktaradens fem ikoner renderas av sajten från befintlig receptmetadata. Receptbilder levereras utan text eller toning; sajten skapar en responsiv tonad övergång mellan titelblocket och bilden.
- **Skäl:** Ett gemensamt system ger konsekvent form, bättre tillgänglighet och mindre receptpaket på Home Assistant Green.
- **Konsekvens:** Skillen får inte skapa separata faktarikoner. Tider, portioner, kcal och måltidstyp måste vara kompletta för varje publicerat recept.
- **Spårar:** REC-002, REC-007, UX-007.

### D-013 — Lokal portionsskalning och manuell receptrevision

- **Datum/status:** 2026-08-24 — Godkänt
- **Beslut:** Receptsidan erbjuder tillfällig portionsskalning av ingrediensmängder och ett kopieringsunderlag för uppdatering via chatten. Fritextfältet för ändringsförslag tas bort. Kommentarer används som anteckningar.
- **Skäl:** Lösningen ska vara enkel, resurssnål, fungera på alla enheter och inte kräva en betald språkmodellstjänst i drift.
- **Konsekvens:** Skalningen får aldrig mutera receptkällan eller makron per portion. Skillens uppdateringsläge måste hämta befintlig basversion, bevara identiteten, visa diff, kräva godkännande och publicera exakt validerade bytes.
- **Spårar:** INT-003, INT-005, INT-006, OPS-006, OPS-007.

## Beslutsmall

```markdown
### D-NNN — Kort titel

- **Datum/status:** ÅÅÅÅ-MM-DD — Föreslaget|Godkänt|Ersatt av D-NNN
- **Beslut:** Vad som gäller.
- **Skäl:** Varför detta val gjordes.
- **Konsekvens:** Vad som måste ändras, testas eller migreras.
- **Spårar:** Berörda krav-ID:n.
```

