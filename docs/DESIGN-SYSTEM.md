# Le Carnet du Nord – designsystem

## 1. Syfte och visuell princip

Detta dokument översätter de tre godkända designmastrarna till ett responsivt webbgränssnitt för telefon, surfplatta och dator. Mastrarna är normerande för uttrycket: nordisk råvarukänsla möter fransk restaurangelegans.

Gränssnittet ska kännas som en välbevarad, illustrerad receptbok – inte som ett administrationssystem. Den visuella hierarkin bygger på fem återkommande drag:

1. Stor, aptitlig matbild med naturligt sidoljus och varm färgtemperatur.
2. Klassisk seriftypografi i mörk skogsgrön och dämpat guld.
3. Varmt, brutet pappersvitt som grund; aldrig kritvitt.
4. Tunna guldfärgade linjer, mjuka hörn och sparsamma ornament.
5. Tydlig redaktionell struktur med generös luft, även när innehållet är informationsrikt.

Designen ska återge masterns karaktär, men inte försöka efterlikna en tryckt A4-sida pixel för pixel. På små skärmar prioriteras läsbarhet, pekytor och logisk följd framför den tryckta trespaltslayouten.

## 2. Designprinciper

- **Maten är huvudpersonen.** Matbilder ska dominera receptkort och receptsidans ingress.
- **Elegant, inte teatraliskt.** Ornament används som skiljetecken, inte dekoration överallt.
- **Redaktionellt, inte tekniskt.** Fältnamn och kontroller skrivs på naturlig svenska.
- **Lugn informationsdensitet.** Innehåll grupperas med luft, linjer och tonade ytor – inte med många skuggor.
- **Mobil först i funktion.** Alla funktioner ska fungera med en hand på telefon.
- **Lättviktigt.** Uttrycket skapas primärt med CSS, typografi och riktiga receptbilder; inga tunga bakgrundsvideor eller dekorativa bildlager.

## 3. Design tokens

### 3.1 Färger

| Token | Hex | Användning |
|---|---:|---|
| `--color-forest-900` | `#123E2A` | Huvudrubriker, primära knappar, mörka faktarutor |
| `--color-forest-800` | `#1B4D35` | Interaktiva element, stegnummer, ikoner |
| `--color-forest-700` | `#2D6047` | Hover/fokus på ljus bakgrund |
| `--color-gold-600` | `#B7832F` | Accentord, stjärnor, ornament, tunna linjer |
| `--color-gold-500` | `#C89A4A` | Ljusare accent och vald kontroll |
| `--color-gold-200` | `#E3C895` | Kortkanter och avdelare |
| `--color-paper-50` | `#FBF8F0` | Sidans huvudbakgrund |
| `--color-paper-100` | `#F5EFE3` | Tonade ytor, formulärfält och sidopaneler |
| `--color-paper-200` | `#EDE2CF` | Pressat/valt tillstånd och diskreta avdelare |
| `--color-ink-900` | `#17221B` | Brödtext |
| `--color-ink-700` | `#39433C` | Sekundär text |
| `--color-ink-500` | `#6B716C` | Metadata och hjälptext |
| `--color-error-700` | `#9B2C2C` | Fel, destruktiva åtgärder |
| `--color-success-700` | `#2F6B45` | Bekräftelser |

Kontrast ska verifieras mot WCAG 2.2 AA. Guld används inte ensamt för liten brödtext på pappersvit bakgrund. Text på skogsgrön yta ska vara pappersvit; guldet används där för rubrik eller ikon i minst 18 px eller kompletteras med annan visuell markering.

### 3.2 Typografi

Använd systemnära eller lokalt paketerade typsnitt för att undvika externa anrop. Rekommenderad font-stack:

- **Display och rubriker:** `Cormorant Garamond`, `Georgia`, `Times New Roman`, serif.
- **Brödtext och gränssnitt:** `Source Serif 4`, `Georgia`, `Times New Roman`, serif.
- **Kompakt metadata:** `system-ui`, `Segoe UI`, sans-serif.

Om lokala woff2-filer inte följer med används fallbacks direkt. Högst två fontfamiljer och högst fyra fontfiler får paketeras.

Typografisk skala:

| Roll | Storlek | Radavstånd | Vikt/stil |
|---|---|---|---|
| Receptets huvudtitel | `clamp(2.5rem, 6vw, 5.75rem)` | 0,9–1,0 | 600, versaler där titeln tillåter |
| Titelns andra/accentrad | samma eller 85 % | 0,95 | 500, guld |
| Sidrubrik | `clamp(2rem, 4vw, 3.5rem)` | 1,0 | 600 |
| Sektionsrubrik | `clamp(1.35rem, 2vw, 1.75rem)` | 1,15 | 600, versaler sparsamt |
| Korttitel | `clamp(1.15rem, 1.5vw, 1.45rem)` | 1,1 | 600 |
| Ingress | `clamp(1.05rem, 1.4vw, 1.3rem)` | 1,55 | kursiv |
| Brödtext | `1rem` | 1,55–1,65 | 400 |
| Metadata | `0.875rem` | 1,3 | 600, sans-serif |
| Hjälptext | `0.8125rem` | 1,4 | 400, sans-serif |

Rubriker får aldrig kapas med ellips på receptsidan. På kort får titeln vara högst två rader; resten av kortets metadata ska fortfarande ligga stabilt.

### 3.3 Avstånd, radier och skuggor

- Basenhet: 4 px.
- Standardavstånd: 8, 12, 16, 24, 32, 48, 64 px.
- Sidmarginal: 16 px telefon, 24–32 px surfplatta, 40–64 px dator.
- Maximal innehållsbredd: 1440 px på startsidan, 1280 px på receptsidan.
- Kortens hörnradie: 12 px.
- Små kontroller: 8 px.
- Bildradie: 12–16 px; receptsidans stora bild kan ligga kant i kant på telefon.
- Standardkant: 1 px solid `--color-gold-200`.
- Skugga används endast på flytande lager och receptkort: `0 8px 24px rgba(27, 38, 30, 0.08)`.

Papperskänslan bör skapas med en solid varm bakgrund och eventuellt en mycket diskret CSS-gradient. Ingen stor texturbild krävs.

## 4. Ornament och ikonografi

- Använd en enkel krona/laurbär-symbol som varumärkesmotiv. Den ska vara en liten lokal bildresurs eller enkel text-/ikonkomponent, aldrig detaljtung på mobil.
- Ornamentlinje: tunn guldlinje, liten romb eller fleurong i mitten. Max en gång per större sektion.
- Ikoner ska vara linjära, 1,75–2 px linjebredd och normalt skogsgröna.
- För tid, aktiv tid, portioner, energi och måltidstyp används konsekventa ikoner.
- Ikoner får aldrig vara enda informationsbärare; synlig etikett eller tillgängligt namn krävs.
- Stjärnor för betyg använder fylld guldstjärna för valt värde och kontur för övriga.

## 5. Global sidstruktur

### 5.1 Toppfält

Toppfältet är kompakt och lugnt:

- Vänster: monogram/ornament och texten **Le Carnet du Nord**.
- Mitten på bred skärm: Sök, Senaste, Favoriter och Alla recept.
- **Alla recept** öppnar en redaktionell långlista med receptnamn, tre viktigaste ingredienser och total tid. Sorteringsreglaget erbjuder Namn, Protein och Kolhydrat; protein- och kolhydratvärdena behöver inte visas i receptets titelblock.
- Höger: diskret knapp för administratörsläge eller inställningar.
- Telefon: varumärket till vänster, sökknapp och menyknapp till höger.
- Toppfältet får vara klistrat, men högst 64 px på telefon och 72 px på större skärmar.
- Pappersvit bakgrund med tunn guldkant nedtill; ingen tung skugga.

### 5.2 Sökning

Sökrutan är startsidans primära kontroll och ska ligga synlig utan interaktion.

- Platshållare: **Sök på rätt, protein eller kolhydrat**.
- Sökikon till vänster, rensa-knapp till höger när text finns.
- Minst 48 px hög på telefon, 52–56 px på större skärm.
- Sökning sker i kombination: exempelvis `kyckling pasta` matchar recept där båda huvudgrupperna finns.
- Föreslagna filterchips kan visas under sökningen: Kyckling, Fisk, Vegetariskt, Pasta, Ris, Potatis.
- Aktivt chip visas med skogsgrön bakgrund och pappersvit text; avmarkering ska vara tydlig.

## 6. Startsida – allt viktigt ovanför vikningen

Målet är att visa sökning och de senaste recepten utan sidrullning vid normala vyhöjder. Detta gäller det avsedda antalet kort, inte varje texts fullständiga innehåll.

### 6.1 Dator – 6 recept

Brytpunkt: från 1180 px bredd. Referensvy: 1440 × 900.

- Toppfält: 72 px.
- Introduktionsrad: varumärkesrubrik och en kort mening till vänster; stor sökruta till höger eller direkt under, totalt högst 120 px.
- Sektionstitel **Senast från köket** och länk **Visa alla** på samma rad.
- Receptgrid: 3 kolumner × 2 rader.
- Mellanrum: 20–24 px.
- Kortens visuella höjd: cirka 250–275 px vid 900 px vyhöjd.
- Bilden upptar cirka 62 % av kortet, med 16:9-beskärning.
- Korttext: titel, protein + kolhydrat, tid och betyg. Ingen ingress i kompakt läge.

Vid lägre vyhöjd får korten bli tätare, men texten ska inte understiga angivna minimistorlekar. Om 6 kort inte ryms tillgängligt ska sista raden få hamna strax under vikningen; undvik att krympa användbarheten för att uppfylla ett absolut pixelkrav.

### 6.2 Surfplatta – 4 recept

Brytpunkt: 700–1179 px. Referensvy: 1024 × 768.

- Toppfält: 64–68 px.
- Sökningen ligger på egen rad direkt under en kort sidrubrik.
- Receptgrid: 2 kolumner × 2 rader.
- Mellanrum: 16 px.
- Kortens höjd: cirka 230–250 px.
- Bildförhållande: 16:9 eller lätt bredare beroende på tillgänglig höjd.
- Visa titel, råvarugrupper, tid och stjärnbetyg; dölj övrig metadata.

### 6.3 Telefon – 2 recept

Brytpunkt: under 700 px. Referensvy: 390 × 844.

- Toppfält: 56–60 px.
- Ingen stor dekorativ välkomstyta. Sökfältet placeras direkt efter toppfältet.
- Sektionstitel och **Alla recept** följer direkt efter sökningen.
- Två senaste recept visas som kompakta liggande kort, ett per rad.
- Kort: bild 38–42 % av bredden, text till höger, höjd 132–148 px.
- Visa titel, protein + kolhydrat samt total tid. Betyg kan visas som stjärna + siffra för att spara plats.
- Efter det andra kortet visas en fullbreddsknapp **Visa alla recept**.

Om telefonen är smalare än 350 px staplas kortbilden över texten, men endast två kort visas fortfarande i förstasektionen.

### 6.4 Receptkort

Obligatoriskt innehåll:

- Matbild med meningsfull alternativtext.
- Svensk huvudtitel; eventuell fransk titel får vara en mindre överrad.
- Huvudprotein och huvudkolhydrat som kort metadata, exempelvis **Kyckling · Pasta**.
- Total tid.
- Samlat betyg eller **Ej betygsatt**.

Interaktion:

- Hela kortet är klickbart med en enda semantisk länk.
- Synligt fokus med 3 px mörkgrön/guldfärgad fokusram och 3 px mellanrum.
- Hover: bild zoomas högst 2 %, kortet lyfts 2 px. Ingen rörelse om användaren föredrar reducerad rörelse.
- Favoritkontroll får finnas i bildens övre högra hörn men ska vara en separat knapp med minst 44 × 44 px pekyta.

## 7. Receptsida

### 7.1 Informationsordning

Sidan följer denna semantiska ordning på alla skärmar:

1. Tillbaka till recept / brödsmula.
2. Titelblock och huvudbild.
3. Kort beskrivning.
4. Faktrad: tid, aktiv tid, portioner, energi och måltidstyp.
5. Primära åtgärder: betygsätt, favorit, skriv ut.
6. Ingredienser.
7. Gör så här.
8. Serveringstips och förvaring.
9. Näringsvärde per portion.
10. **Varför det blir så gott**.
11. Kommentarer och ändringsförslag.

### 7.2 Datorlayout

- Hero i två delar, ungefär 43/57: titel och ingress till vänster, bild till höger.
- Herohöjd: 430–560 px beroende på skärm och titelns längd.
- Mjuk övergång eller tonad kant mellan text och bild får användas, inspirerad av mastern, men text ska aldrig ligga direkt över en stökig bild.
- Faktraden ligger fullbrett under hero och rymmer fem jämnt fördelade fakta.
- Huvudinnehåll i tre kolumner: ingredienser 26 %, instruktioner 48 %, sidoinformation 26 %.
- Sidoinformationen innehåller serveringstips, näringsvärde och smakförklaring.
- Kolumnernas överkant linjeras. Sektioner får fortsätta naturligt nedåt; de ska inte tvingas till samma höjd.
- Kommentarer och ändringsförslag ligger fullbrett under receptet för bättre läsbarhet.

### 7.3 Surfplattelayout

- Hero kan vara 45/55 i liggande läge; i stående läge ligger bilden över titelblocket.
- Faktraden bryts till 3 + 2 objekt.
- Innehåll i två kolumner: ingredienser 35–40 %, instruktioner 60–65 %.
- Serveringstips, näringsvärde och smakförklaring placeras i fullbredd under huvudkolumnerna, i två kort per rad där utrymme finns.

### 7.4 Mobillayout

- Stor bild först efter en kompakt tillbaka-länk; bildförhållande 4:3 eller 1:1, inte en extremt låg banner.
- Titel, undertitel och ingress följer bilden. Den läsbara svenska titeln prioriteras; fransk titel behandlas som dekorativ överrad.
- Fakta visas i en horisontellt svepbar rad med tydlig antydan om mer innehåll, eller i ett 2-kolumners rutnät. Undvik fem mycket smala kolumner.
- En klistrad, kompakt åtgärdsrad längst ned får innehålla **Betygsätt**, **Kommentera** och **Föreslå ändring**. Den får inte täcka formulärfält eller systemets hemindikator.
- Ingredienser visas före instruktionerna. Ingrediensgrupper kan vara öppna dragspel, men allt ska vara öppet som standard och fungera utan JavaScript.
- Instruktionssteg visas med gröna nummercirklar och tydligt stegavstånd.
- Serveringstips, näringsvärde och smakförklaring staplas i denna ordning.

### 7.5 Innehållskomponenter

**Faktafält**

- Ikon, kort versal etikett och värde.
- Exempel: **TOTAL TID** / 60 minuter.
- Energi anges som **cirka 550 kcal per portion** när underlaget är uppskattat.

**Ingredienspanel**

- Pappersvit yta, guldkant, 12 px radie.
- Ingrediensgrupper med mörkgrön underrubrik och diskret linje mellan grupper.
- Checkboxar får erbjudas som lokal tillfällig hjälp, men själva mängden och ingrediensen ska förbli läsbar när rutan markeras.
- Portionsskalning placeras vid panelrubriken; aktuell portionsmängd skrivs ut i klartext.

**Instruktionssteg**

- Nummercirkel 28–32 px i skogsgrönt.
- Stegrubrik i serif, 600.
- Brödtext eller kort punktlista under.
- Temperaturer, tider och vilotider framhävs med halvfet text, inte enbart färg.

**Näringsvärde**

- Tvåkolumnstabell med vänsterställd etikett och högerställt värde.
- Ordning: energi, protein, kolhydrater, fett, fiber.
- Rubrik: **Näringsvärde (cirka)** och tydligt **per portion**.
- Ingen diagramgrafik krävs; korrekt och skannbar text är viktigare.

**Varför det blir så gott**

- Mörkgrön ruta med pappersvit text och guldrubrik.
- Tre till fem korta punkter med guldfärgad bock.
- Ska beskriva smakkombination, textur och teknik – inte upprepa instruktionerna.

**Serveringstips/förvaring**

- Ljus panel med guldkant.
- Eventuell liten dekorativ råvarubild är frivillig och ska döljas på mobil om den tränger undan innehåll.

## 8. Betyg, kommentarer och ändringsförslag

### 8.1 Betyg

- Kontroll med fem stjärnknappar och synlig etikett **Ditt betyg**.
- Varje stjärna har minst 44 × 44 px pekyta.
- Tangentbord: vänster/höger ändrar värde, Enter eller blanksteg bekräftar.
- Skärmläsare ska höra exempelvis **4 av 5 stjärnor**.
- Efter sparande visas ett kort, icke-blockerande meddelande: **Ditt betyg har sparats**.
- Samlat betyg visas som siffra, stjärna och antal betyg; aldrig enbart som fem ikoner.

### 8.2 Kommentarer

- Kommentarlistan visar datum, kommentarstext och status **Hanterad** när relevant.
- Eftersom sajten är privat behövs ingen publik profilbild eller social metadata.
- Formulär: etiketten **Din kommentar**, flerradigt fält och knapp **Spara kommentar**.
- Visa teckengräns och tydliga fel nära fältet.
- Bekräfta innan en kommentar tas bort.

### 8.3 Föreslå ändring

- Öppnas i dialog eller separat panel med fokusfälla och stängning via Escape.
- Fält: berörd del, föreslagen ändring och orsak/notering.
- Primär knapp: **Skicka till granskning**. Förslaget ska inte framstå som direkt publicerat.
- Efter inskick: tydlig status **Väntar på granskning**.
- Administratörsvyn skiljer tydligt på **Godkänn och publicera**, **Redigera** och **Avslå**; destruktiva beslut kräver bekräftelse.

## 9. Bilder

### 9.1 Bildstil

- Fotografisk, realistisk matbild med tydlig huvudråvara och aptitlig textur.
- Varmt naturligt ljus, dämpad rustik rekvisita och mörkare trä/linne fungerar väl.
- Färger ska vara trovärdiga; undvik övermättnad, plastig skärpa och aggressiv HDR.
- Huvudrätten ska vara begriplig även i kortets lilla beskärning.
- Ingen text, logotyp, ram eller ornament bakas in i receptbilden. All text renderas som HTML för tillgänglighet och responsivitet.

### 9.2 Format och leverans

- Hero-original: minst 1600 × 1200 px, rekommenderat 4:3.
- Kortbeskärning: definierad fokuspunkt i receptets metadata; visas normalt i 16:9.
- Mobil hero: 4:3 eller 1:1 med samma fokuspunkt.
- Format: AVIF om miljön kan generera det stabilt, annars WebP. JPEG som reserv vid behov.
- Riktvärde: hero högst 250–350 KB, kortvariant högst 80–120 KB.
- Ange `width` och `height` för att förhindra layoutförskjutning.
- Ladda första synliga bilden prioriterat; övriga bilder lazy-loadas.
- Alternativtext beskriver rättens synliga innehåll kortfattat, utan fraser som ”bild på”.

### 9.3 Flera bilder

- Stegbilder är valfria och placeras intill relevant steg, aldrig i en tung karusell som enda åtkomst.
- Galleri efter instruktionerna: 2–3 kolumner på dator, 2 på surfplatta, 1 på telefon.
- Klickbar förstoring ska kunna stängas med knapp, Escape och klick utanför; fokus återgår till ursprungskontrollen.

## 10. Responsiva brytpunkter

Brytpunkter ska styras av när innehållet behöver ändra form, inte av specifika enhetsmodeller:

- `0–699 px`: telefon.
- `700–1179 px`: surfplatta och liten dator.
- `1180–1599 px`: dator.
- `1600 px+`: stor dator; innehållet växer inte förbi maxbredden.

Komponenter får använda container queries där det förenklar kortens beteende. Innehållet får aldrig orsaka horisontell sidrullning vid 320 px bredd.

## 11. Tillgänglighet

- Målnivå: WCAG 2.2 AA.
- Semantisk ordning ska följa läsordningen; visuella kolumner får inte skapa fel tabbordning.
- Alla interaktiva element ska vara riktiga länkar, knappar eller formulärkontroller.
- Minsta pekyta: 44 × 44 px. Mellan närliggande mål bör finnas minst 8 px.
- Synlig fokusindikator på alla kontroller; fokus får inte döljas av klistrade element.
- Textkontrast minst 4,5:1; stor text minst 3:1; komponentgränser minst 3:1 där de behövs för förståelse.
- Brödtext får inte understiga 16 px på telefon.
- Zoom till 200 % ska fungera utan förlorat innehåll; vid 400 % ska sidan kunna läsas som en kolumn.
- Ingen information uttrycks enbart med färg, ikon eller position.
- Respektera `prefers-reduced-motion`; all dekorativ rörelse stängs av.
- Formulärfel sammanfattas och kopplas programmatiskt till rätt fält.
- Sparstatus och bekräftelser annonseras med en artig live-region utan att flytta fokus.
- Bilder har relevanta alt-texter; rent dekorativa ornament har tom alt-text eller döljs för hjälpmedel.

## 12. Innehållsregler som påverkar layouten

- Svensk titel ska alltid finnas och vara primär för förståelse och sökning.
- Fransk/restauranglik titel är frivillig och får inte ersätta den begripliga svenska benämningen.
- Huvudprotein och huvudkolhydrat ska vara normaliserade sökfält, inte fria taggar. Exempel: **kyckling + pasta**, **nötkött + potatis**.
- Titelmål: högst 60 tecken svensk titel och högst 70 tecken fransk titel. Längre titlar ska fortfarande brytas korrekt.
- Ingress: 160–300 tecken.
- Serveringstips: högst 5 punkter.
- Smakförklaring: 3–5 punkter.
- Makron visas alltid per portion och märks **cirka** när de bygger på egen uträkning.

## 13. Tillstånd och återkoppling

- **Laddning:** använd stilla tonade platshållare med samma geometri som slutligt innehåll. Ingen pulserande animation krävs.
- **Tom sökning:** rubrik **Inga recept matchar** samt föreslagna sätt att ta bort filter.
- **Inga recept ännu:** varm redaktionell tomvy och administratörslänk **Lägg till första receptet**.
- **Bild saknas:** pappersfärgad yta med enkel tallriksikon och recepttitel; ingen extern reservbild.
- **Sparar:** kontrollen visar lokal aktivitet men behåller sin bredd.
- **Sparat:** kort bekräftelse nära den utlösande kontrollen.
- **Fel:** konkret felmeddelande och möjlighet att försöka igen; användarinnehåll ska ligga kvar i formuläret.

## 14. Prestandabudget för Home Assistant Green

- Ingen tredjepartsanalys, externa typsnitt eller externa bildanrop.
- Initial JavaScript-budget bör hållas under cirka 100 KB komprimerat för den publika läsvyn.
- Initial CSS-budget bör hållas under cirka 40 KB komprimerat.
- Startsidan laddar endast bildvarianterna som faktiskt behövs för 6/4/2 synliga kort samt en liten reservmarginal.
- Ingen klientrenderad tung bildkarusell, animationsmotor eller komplett ikonfont.
- Ikoner levereras som ett litet, trädfällbart paket eller lokala optimerade resurser.

## 15. Definition of Done för visuell granskning

En vy är designmässigt klar när:

- den tydligt känns besläktad med de tre mastrarna utan att vara en bild av en trycksida;
- sökning och rätt antal senaste recept ryms i avsedd referensvy: 6 dator, 4 surfplatta, 2 telefon;
- receptets titel, bild, fakta, ingredienser och instruktioner har obruten visuell hierarki;
- kommentarer, betyg och ändringsförslag är fullt användbara med tangentbord och pekskärm;
- ingen text ligger oläsligt ovanpå matbilden;
- vyn fungerar vid 320 px bredd, 200 % zoom och reducerad rörelse;
- alla bilder har korrekt beskärning, definierad fokuspunkt och alternativtext;
- färgkontrast, fokusmarkeringar och formulärfel uppfyller WCAG 2.2 AA;
- inga externa resurser krävs för att upprätthålla sajtens visuella identitet.
