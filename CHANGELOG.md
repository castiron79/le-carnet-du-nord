# Ändringslogg

## 1.6.7 – 2026-10-22

- Spotify play/paus i den gröna sidfoten med synkroniserad status och Kitchen Sonos som enda mål.
- Återanvänder SpotifyPlus-sessionen utan nya hjälpare, tvångsaktivering eller reservspelare. HA-behörighet aktiveras för servern; inga autentiseringsuppgifter skickas till webbläsaren.


## Receptskill v13 – 2026-10-19

- Befintliga receptbilder hämtas via GitHub med uttrycklig base64-kodning och avkodas till ursprungliga bytes. Undviker den verifierade anslutningens UTF-8-fel vid blobhämtning.
- Hela sconespaketet har hämtats genom GitHub-pluginen och validerats med oförändrade filbytes. Slutkontrollens dokumentation skiljer detta från verklig mobilpublicering.
- Endast skillanvisningar, paketering och dokumentation ändras. Appen ligger kvar på 1.6.6; ingen ny Green-installation.

## 1.6.6 – 2026-10-19

- Skriver anslutnings- och hälsologgar omedelbart så att Ingress och automatiska watchdog-anrop kan verifieras utan att invänta Python-bufferten. Åtkomstregeln från 1.6.5 är oförändrad.

## 1.6.5 – 2026-10-19

- Tillåter inkommande HTTP endast från Supervisors verkliga nätverksadress, före läsning och skrivning. Förfalskade proxyhuvuden ger ingen åtkomst.
- Samma kontroll omfattar webbgränssnitt, API, bilder och HEAD. Ingress, befintlig MCP-proxy och Supervisors hälsokontroll använder samma tillåtna källa.
- Uppdaterar åtkomstdokumentation och tester utan nya portar, behörigheter eller inloggningskrav.

## 1.6.4 – 2026-10-18

- Kontrollerar receptpaketets tillåtna filer och bildsignaturer före import; felaktiga paket avvisas innan fungerande recept ersätts.
- Bildfunktionen lämnar endast ut vald huvudbild och refererade stegillustrationer. Stödjer dokumenterade WebP- och AVIF-huvudbilder utan att ändra befintliga bilder.
- Behåller äldre recept utan mängd-/timerfiler och befintliga storleksgränser. Inga åtkomstregler eller nya behörigheter införs i denna etapp.

## 1.6.3 – 2026-10-18

- Visar illustrationsknapparnas text även på mobil. Reglagen delar rad när de får plats och radbryts vid behov.

## 1.6.2 – 2026-10-18

- Tar bort ramen runt favorithjärtat i receptvyn och linjerar favoritens rubrik och hjärta med betygets rubrik och stjärnor.

## 1.6.1 – 2026-10-18

- Timerknapparna ändrar 10 sekunder upp till 2 minuter, 30 sekunder upp till 5 minuter och hela minuter därefter.
- Vid exakt 2 eller 5 minuter används intervallet i knappens riktning; justering stannar vid nästa gräns.
- Uppdaterad timerdokumentation och receptskillpaket v11 med samma timermodul.

## 1.6.0 – 2026-10-18

- Visuella timers under stegtexten, på samma reglagerad som illustrationsknappen.
- Start, plus/minus, paus, fortsätt, avbryt och tydligt utgången tid. Lokal sparning och återhämtning efter omladdning/skärmvila.
- Valfria granskade timers.json, validering och skillpaket v9. Pilotmetadata publiceras separat för två recept.
- Ingen ljud- eller Spotify-kod och ingen ny HA-behörighet.

Alla märkbara ändringar i Le Carnet du Nord dokumenteras här. Versionsnumret
följer Home Assistant-appens version i `home-assistant-addon/config.yaml`.


## 1.5.0 – 2026-10-18

- Synkroniserar ingredienslistor och steg med gemensamma mängdreferenser i quantities.json.
- Böjer uttryckliga råvaru- och måttformer efter skalad mängd; antal portioner visas korrekt.
- Visar en notis om att antal bakverk, bitar och serveringskärl gäller grundreceptet.
- Bevarar äldre recept och rättar skalning av bråk och fasta styckvikter efter à/per.
- Utökar server- och publiceringsvalidering, tester och CI samt paketerar receptskill v8.
- Bygger om HA-vyn från aktuell källkod, inklusive stegillustrationer.

## 1.4.0 – 2026-10-17

- Stöder valfria, utfällbara illustrationer per matlagningssteg med Visa alla / Dölj alla.
- Flera handlings-, resultat- och detaljbilder kan finnas på samma steg, och öppnade bilder laddas först vid behov.
- Introducerar illustrations.json, bild- och filvalidering samt obligatoriskt bildgodkännande före receptpublicering.
- Utökar receptskill, design- och redaktionsstandard med dova råvarufärger och textfria illustrationer.

## 1.3.3 – 2026-10-17

- Placerar sidfoten vid skärmens nederkant när innehållet är kortare än den
  tillgängliga ytan i Home Assistant, och efter innehållet på längre sidor.
- Ger betyg och favorit egna utrymmen och flyttar åtgärdsknapparna till en egen
  rad på surfplatta så stjärnor, hjärta och rubriker inte överlappar.

## 1.3.2 – 2026-10-17

- Återställer karusellkortens separata bild- och textyta så franskt namn,
  svensk rättbeskrivning och tid alltid visas under bilden i båda karusellerna.

## 1.3.1 – 2026-10-17

- Lägger till en responsiv spelkortsgrid i Alla recept med bild, svenskt namn,
  fransk titel och kort beskrivning samt tid, kcal per portion och hjärta på en rad.
- Växla mellan lista och kort; visningsvalet sparas på enheten.
- Båda vyerna använder samma sökning, sortering och favoritfilter.

## 1.3.0 – 2026-10-17

- Gör de senaste recepten till en horisontell karusell med upp till tolv recept.
- Lägger till centralt sparade favoriter, en egen favoritkarusell och favoritfilter.
- Visar små Hero-bilder och klickbara hjärtan i hela receptlistan.
- Säkerställer att ordmärket alltid återgår till startsidans senaste-vy.
- Stabiliserar betygsstjärnorna och optimerar porträttläget för Galaxy Tab S7+.

## 1.2.11 – 2026-08-25

- Versionsmärker receptbilder med den synkroniserade GitHub-revisionen så en
  utbytt hero-bild visas direkt utan manuell rensning av appens bildcache.

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

- Förhindrar extra listnummer inne i `Gör så här` genom både robust inläsning
  och skärpt receptvalidering.

## 1.2.5 – 2026-08-24

- Korrigerade hjältytans kolumnberäkning så texten behåller full läsbredd medan
  bilden ligger bakom en lång, mjuk tonad övergång.

## 1.2.4 – 2026-08-24

- Förfinade faktaradens ikonstorlek, avstånd och portionskontroller.
- Gjorde receptbildens överlapp och tonade övergång längre utan att rubriktext försvinner.

## 1.2.3 – 2026-08-24

- Förenklade portionskontrollen till stabila plus- och minusikoner utan
  layoutförskjutning på dator, mobil eller surfplatta.

## 1.2.2 – 2026-08-24

- Lade till cache-regler och automatiskt test som säkerställer att den aktuella
  receptsidan laddas efter varje Home Assistant-appuppdatering.

## 1.2.1 – 2026-08-24

- Lade till Le Carnets guldfärgade krona som appikon i Home Assistant.

## 1.2.0 – 2026-08-24

- Lade till diskret, mobilanpassad portionsskalning direkt på receptsidan.
- Ersatte formuläret för ändringsförslag med **Kopiera för uppdatering**.
- Lade till ett säkert uppdateringsflöde som bevarar recept-ID, visar diff och
  kräver uttryckligt godkännande före publicering.
- Uppdaterade användar-, arkitektur-, design-, säkerhets- och QA-dokumentation.

## 1.1.0 – 2026-08-20

- Första installerbara versionen för Home Assistant Green.
- Lade till privat GitHub-synkronisering, kommentarer och betyg.

## Receptstandard v10 – 2026-10-18

- Obligatoriskt timermanifest och kontroll av uttryckliga stegtider i receptskillen och publiceringsflödet.
- Samtliga 14 recept granskade: 47 visuella timers. Ingen ändring av app 1.6.0 eller ljudfunktion.

## Receptskill v12 – 2026-10-18

- Filkontroll före publicering: endast receptdata, vald huvudbild och refererade stegillustrationer. Stoppar extra filer, länkar, undermappar, ogiltig UTF-8/JSON och felaktiga bildsignaturer.
- Isolerade regressionstester för WebP/AVIF och publiceringsvalidatorn. Ingen ändring av app 1.6.3 eller Green-installationen.
