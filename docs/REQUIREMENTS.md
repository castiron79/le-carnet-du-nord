# Kravspecifikation — Le Carnet du Nord

Version: 1.0  
Fastställd: 2026-08-11  
Status: godkänd grundomfattning

## 1. Produktmål

Le Carnet du Nord ska vara en privat, lättviktig och elegant receptsajt på Home Assistant Green. Ägaren ska löpande kunna skapa och importera receptpaket, hitta recepten från telefon eller surfplatta och registrera egna kommentarer, betyg och ändringsförslag.

Prioritet: **P0** krävs för första produktionsrelease, **P1** bör ingå eller planeras direkt efter, **P2** är framtida möjlighet.

## 2. Spårbara krav

### Innehåll och recept

| ID | Pri | Krav | Acceptans |
|---|---:|---|---|
| REC-001 | P0 | Varje recept lagras som en egen mapp med en strukturerad Markdown-fil och en eller flera lokala bilder. | Ett validerat paket kan importeras utan ändring av applikationskod. |
| REC-002 | P0 | Obligatoriska data omfattar svensk titel, restaurangtitel, ingress, portioner, tider, ingredienser, steg, serveringstips, allergener, förvaring, makron och bildmetadata. | Validatorn stoppar paket där obligatoriskt fält eller sektion saknas. |
| REC-003 | P0 | Energi, protein, kolhydrater, fett och fiber ska anges per portion som bästa rimliga egen beräkning från generiska råvaruvärden och råvikter. | Metod dokumenteras; energikontroll körs; osäkert underlag kan inte publiceras. |
| REC-004 | P0 | Produktvarumärken och beräkning från tillagad vikt krävs inte. | Specifikation och skill efterfrågar inte dessa uppgifter som obligatoriska. |
| REC-005 | P0 | Protein- och kolhydratfält beskriver dominanta stora råvarugrupper, exempelvis `kyckling` + `pasta`. | Små ingredienser som kryddor indexeras inte som huvudgrupp. |
| REC-006 | P0 | Recept ska ha stabil identitet och versionshistorik. | Uppdatering behåller `id`, höjer version och bevarar tidigare innehåll. |
| REC-007 | P0 | En lokal receptskill ska skapa, namnge, paketera och validera recept och bilder enligt samma specifikation som sajten. | Ett exempelpaket från skillen passerar projektets validator. |
| REC-008 | P0 | Bild och text lämnas separat; systemet ska inte behöva extrahera receptinformation ur bilden. | Importen kräver strukturerad text och behandlar bilder som bildresurser. |

### Upptäckt och visning

| ID | Pri | Krav | Acceptans |
|---|---:|---|---|
| UX-001 | P0 | Startsidan visar de senaste recepten utan sidskroll: 6 på dator, 4 på surfplatta och 2 på telefon. | Referensvyer visar angivet antal samt sökruta inom första skärmbilden. |
| UX-002 | P0 | En gemensam sökruta söker på namn, protein, kolhydrat eller kombination med AND-logik. | `kyckling pasta` hittar recept som matchar båda; sökning är skiftläges- och diakritikoberoende. |
| UX-007 | P0 | Receptvyn visar automatiska faktarikoner och en tonad övergång mellan titelblock och huvudbild. | Fem konsekventa ikoner härleds från metadata; toningen fungerar horisontellt på bred skärm och vertikalt på telefon. |
| UX-008 | P0 | Startsidan erbjuder ett komplett receptarkiv i långlista. | Alla matchande recept visas med namn, viktigaste ingredienser och total tid och kan filtreras och sorteras på namn, protein eller kolhydrat. |
| UX-003 | P0 | Receptvyn följer designmasterns fransk-nordiska uttryck och omformas till logisk enkolumnsläsning på mobil. | Visuell granskning godkänns på telefon, surfplatta och dator utan horisontell rullning. |
| UX-004 | P0 | Sajten heter **Le Carnet du Nord** med undertiteln **Recettes de la maison**. | Namnet används konsekvent i gränssnitt, add-on och styrdokument. |
| UX-005 | P0 | Receptbilder, typsnitt, ikoner och kod fungerar lokalt utan externa anrop. | Alla kärnvyer fungerar när internet är frånkopplat. |
| UX-006 | P0 | Kärnflöden uppfyller WCAG 2.2 AA. | Tangentbord, fokus, kontrast, 200 % zoom, 320 px bredd och pekytor verifieras. |

### Interaktion och redigering

| ID | Pri | Krav | Acceptans |
|---|---:|---|---|
| INT-001 | P0 | Ägaren kan lägga till, ändra status på och logiskt radera en kommentar på ett recept. | Kommentaren överlever omstart och kan markeras hanterad. |
| INT-002 | P0 | Ägaren kan sätta eller ta bort ett betyg på 1–5 stjärnor. | Endast värden 1–5 accepteras och det aktuella betyget överlever omstart. |
| INT-003 | P0 | Ägaren kan skicka ett ändringsförslag på ett recept. | Förslag lagras separat med basversion och status `pending`. |
| INT-004 | P0 | Bara ägaren använder sajten; alla skrivfunktioner ligger bakom Home Assistants befintliga inloggning. | Ingen egen användardatabas krävs; direkt oautentiserad skrivning accepteras inte. |
| INT-005 | P0 | Ändringsförslag ska granskas innan receptet ändras. | Godkännande validerar kandidaten och ger konflikt om basversionen är inaktuell. |
| INT-006 | P0 | Kommentarer och betyg får inte ändra `recipe.md`. | De lagras i SQLite och finns kvar när receptet uppdateras. |

### Plattform, säkerhet och drift

| ID | Pri | Krav | Acceptans |
|---|---:|---|---|
| OPS-001 | P0 | Lösningen körs som lokalt Home Assistant-tillägg på Green (`aarch64`). | Imagen bygger/startar på `aarch64` och nås som Ingress-panel. |
| OPS-002 | P0 | Sajten är intern och inte publik. | Inga värdportar mappas; ingen routerport, tunnel eller publik tjänst konfigureras. |
| OPS-003 | P0 | Recept, bilder, kommentarer, betyg, förslag och revisioner lagras beständigt. | All auktoritativ användardata ligger under `/data` och överlever uppgradering. |
| OPS-004 | P0 | Home Assistant-backup och återställning omfattar all användardata. | Ett dokumenterat restore-test återger recept, bild, sökning och interaktionsdata. |
| OPS-005 | P0 | Import avvisar osäkra sökvägar, rå HTML och orimliga arkiv/bilder. | Traversering, symlänkar, skript och överskridna gränser nekas före publicering. |
| OPS-006 | P0 | Lösningen ska vara resurssnål för mycket liten hårdvara. | Mål: vilande RSS ≤80 MB, kallstart <5 s och ingen polling i vila; se arkitekturen. |
| OPS-007 | P0 | Normal drift kräver inte internet, telemetri eller extern databas. | Nätverksfrånkopplat acceptanstest passerar. |

### Förvaltning och dokumentation

| ID | Pri | Krav | Acceptans |
|---|---:|---|---|
| GOV-001 | P0 | Projektet har plan, krav, beslut, receptspecifikation, redaktionell guide, designsystem, arkitektur och driftguide. | README länkar till aktuella dokument och inga centrala kontrakt saknas. |
| GOV-002 | P0 | Receptschema, skill, validator, exempel, migrering och test ändras som en versionsstyrd enhet. | En schemaändring kan inte godkännas utan samstämmiga artefakter och bakåtplan. |
| GOV-003 | P0 | Nya recept följer ett dokumenterat skapande-, validerings-, gransknings- och importflöde. | En annan agent kan leverera ett korrekt paket enbart från styrdokumenten. |
| GOV-004 | P0 | Roller och beslutanderätt är dokumenterade. | Produktägare, projektledning, bemanning, design, utveckling, nutrition, QA och dokumentation har namngivet ansvar. |
| GOV-005 | P1 | Varje release har test-, backup-, restore- och återställningsplan. | Releasechecklistan är genomförd före installation på huvudsystemet. |

### Senare iterationer

| ID | Pri | Krav | Acceptans |
|---|---:|---|---|
| FUT-001 | P1 | Favoriter och ”senast lagat” kan tillföras utan ändring av receptformatets kärna. | Data lagras separat och migreras versionsstyrt. |
| FUT-002 | P1 | Portionsskalning kan tillföras med säkra avrundningsregler. | Originalmängder bevaras och svårskalade ingredienser markeras. |
| FUT-003 | P2 | Offline-cache, utskriftsvy, QR-länk och valfri `/share`-inkorg kan utvärderas. | Varje funktion beslutas och hot-/resursbedöms separat. |

## 3. Utanför version 1

- Publik åtkomst och routerkonfiguration.
- Flera användare eller komplex rollmodell.
- Extern databas, molnlagring, telemetri och obligatoriska externa API-anrop.
- Automatisk identifiering av recepttext från matbilder.
- Varumärkesspecifik näringsdatabas och krav på tillagad vikt.
- Medicinsk eller dietistgranskad näringsinformation.
- Automatisk tillämpning av fria ändringsnoteringar utan granskning.

## 4. Beslutsspårning

Kravens ursprung och tolkning dokumenteras i [DECISIONS.md](DECISIONS.md). Vid konflikt gäller senast godkända beslut, därefter denna kravspecifikation och sedan detaljerade domänspecifikationer. Konflikten ska rättas i samtliga dokument, inte lämnas permanent.
