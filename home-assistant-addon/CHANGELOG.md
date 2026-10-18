# Ändringslogg

## 1.6.4 – 2026-10-18

- Säkerhetskontroll av receptfiler och bildformat vid synk. Ett felaktigt receptpaket lämnar tidigare fungerande recept kvar.
- Bildfunktionen lämnar bara ut receptets godkända bilder. WebP och AVIF stöds som huvudbild.

## 1.6.3 – 2026-10-18

- Visar ”Visa illustration”, ”Visa hur det ska se ut” och ”Dölj illustration” även på mobil.

## 1.6.2 – 2026-10-18

- Favorithjärtat visas utan ring och ligger i linje med betygets stjärnor och rubrik.

## 1.6.1 – 2026-10-18

- Timerknapparna ändrar 10 sekunder upp till 2 minuter, 30 sekunder upp till 5 minuter och hela minuter därefter.
- Plus/minus fungerar konsekvent vid gränserna 2 och 5 minuter, även när timern räknar ned.

## 1.6.0 – 2026-10-18

- Visuella steg-timers med plus/minus, start, paus, fortsätt och avbryt bredvid illustrationsknappen.
- Timern sparas lokalt och räknar ikapp när receptet öppnas igen. Ingen ljudsignal eller synk mellan enheter.
- Stöd för valfria granskade timerfiler, med två recept som pilot. Ingen ny HA-behörighet.


## 1.5.0 – 2026-10-18

- Synkroniserar ingredienslistor och steg med gemensamma mängdreferenser i quantities.json.
- Böjer uttryckliga råvaru- och måttformer efter skalad mängd; antal portioner visas korrekt.
- Visar en notis om att antal bakverk, bitar och serveringskärl gäller grundreceptet.
- Bevarar äldre recept och rättar skalning av bråk och fasta styckvikter efter à/per.
- Utökar server- och publiceringsvalidering, tester och CI samt paketerar receptskill v8.
- Bygger om HA-vyn från aktuell källkod, inklusive stegillustrationer.

## 1.4.0 – 2026-10-17

- Nytt stöd för frivilliga stegillustrationer som är dolda tills du öppnar dem.
- Öppna enstaka eller alla bilder, se separat bildtext och korrekt färdiggrad.
- Validerat bildmanifest och krav på granskning av samtliga bilder före publicering.

## 1.3.3 – 2026-10-17

- Sidfoten ligger nu längst ned även på korta sidor.
- Rättar överlappande betyg och favorithjärta i surfplattans porträttläge.

## 1.3.2 – 2026-10-17

- Rättar startsidans karuseller så franskt namn, svensk rättbeskrivning och tid
  visas under bilden igen på telefon, surfplatta och dator.

## 1.3.1 – 2026-10-17

- Växla mellan lista och stående receptkort i Alla recept.
- Korten visar bild, namn, beskrivning samt tid, kalorier per portion och hjärta på en rad.
- Ditt visningsval sparas på enheten och alla befintliga filter fungerar i båda vyerna.

## 1.3.0 – 2026-10-17

- Svep bland upp till tolv senaste recept och upp till tolv favoriter.
- Favoriter sparas gemensamt och syns på alla dina enheter.
- Hela receptlistan har små matbilder, favoritfilter och klickbara hjärtan.
- Le Carnet-namnet återgår alltid till startsidan.
- Förbättrad layout för surfplatta och telefon, inklusive betygsstjärnorna.

## 1.2.11 – 2026-08-25

- Visar uppdaterade receptbilder direkt efter synkronisering utan att du behöver rensa appens cache.

## 1.2.10 – 2026-08-25

- Sorterar startsidans senaste recept efter publiceringsdatum, med det nyaste längst till vänster.
- Säkerställer att det senast publicerade receptet syns bland de två korten på mobil.

## 1.2.9 – 2026-08-24

- Förfinade startsidans gröna hero med ett diskret botaniskt kantmönster.
- Lade till ett smalt, ordlöst guldband och gjorde hero-ytan något lägre och ljusare.

## 1.2.8 – 2026-08-24

- Riktade receptkortens bilder mot toppen och gav dem gemensam bild- och textlinje.
- Behåller hellre luft under kortet än ojämna starter.

## 1.2.7 – 2026-08-24

- Minskade beskärningszoomen i stora hero-bilder och receptkort så mer av rätten syns.

## 1.2.6 – 2026-08-24

- Rättade tolkningen av instruktioner så varje numrerad rad alltid blir exakt ett steg.
- Tar defensivt bort äldre numreringsrester ur visad stegtext.

## 1.2.5 – 2026-08-24

- Återställde ett brett textfält och lade bilden bakom hela rubriklagret.
- Gjorde övergången lång och mjuk från täckande papper till helt genomskinlig bild.

## 1.2.4 – 2026-08-24

- Centrerade portionsknapparna under portionsrubriken och minskade dem till 25×25 px.
- Förstorade faktaradens fem ikoner med cirka 50 procent och minskade textradens luft.
- Förlängde bildtoningen bakom rubriken och säkrade att all text ligger läsbart ovanpå.

## 1.2.3 – 2026-08-24

- Ersatte portionsmenyn med två fasta, runda plus- och minusknappar.
- Förhindrar att faktaraden och portionskontrollerna flyttar eller ändrar form.

## 1.2.2 – 2026-08-24

- Förhindrar att Home Assistant visar en gammal receptsida efter appuppdatering.
- Behåller effektiv långtidslagring endast för versionsmärkta bild-, CSS- och JavaScript-filer.

## 1.2.1 – 2026-08-24

- Lade till Le Carnets guldfärgade krona som appikon i Home Assistant.

## 1.2.0 – 2026-08-24

- Lade till mobilanpassad portionsskalning direkt på receptsidan.
- Ersatte ändringsförslaget med **Kopiera för uppdatering**.
- Lade till ett säkert flöde för att uppdatera befintliga recept.
- Uppdaterade projektets dokumentation och kvalitetskontroller.

## 1.1.0 – 2026-08-20

- Första installerbara versionen för Home Assistant Green.
- Lade till privat receptsynkronisering, kommentarer och betyg.
