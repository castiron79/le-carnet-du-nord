# Säkerhets- och driftgranskning

Datum: 2026-08-11  
Omfattning: Home Assistant-tillägget, Python-servern, Ingress, SQLite, lagring, backup och resurskrav.

## Receptuppdatering 2026-08-24

- Receptsidan skriver inte till GitHub och innehåller ingen skrivtoken.
- Portionsskalning sker endast i klientminnet och kan inte förändra källreceptet.
- Kopieringsunderlaget innehåller recept-ID och titel men inga hemligheter eller kommentarer.
- Uppdateringsskillen stoppar om originalet inte kan hämtas, identitetsfält ändras eller basrevisionen inte längre är aktuell.
- Publicering kräver en uttryckligen godkänd diff och exakt hashmatchning efter validering; force-push och automatisk merge är förbjudna.

## Sammanfattning

Tilläggets grundmodell är lämplig för en privat Home Assistant Green: en liten Python-process, lokala statiska filer, SQLite och ingen exponerad värdport. Granskningen resulterade i konkreta förstärkningar av datalagring, indata, HTTP-svar och manifest. Innan distribution måste klientens Ingress-sökvägar korrigeras och en verklig backup/restore provas på Home Assistant.

## Rättningar som genomförts

- Beständig data skrivs till Supervisor-hanterade `/data`, inte `/config`.
- SQLite använder timeout, foreign keys, WAL och `synchronous=NORMAL`.
- Recept-id tillåter endast normaliserade sluggar på högst 120 tecken.
- POST kräver JSON, appspecifik rubrik och en deklarerad storlek mellan 2 och 20 000 byte.
- Anteckningar begränsas till 8 000 tecken och 1 000 poster per recept.
- UTC-tidsstämplar används.
- Säkerhetsrubriker har lagts till: CSP, `nosniff`, strikt referrer-policy och avstängda webbläsarbehörigheter.
- Manifestet exponerar inga värdportar, deklarerar kall backup och har watchdog mot `/health`.
- Den onödiga `addon_config`-mappningen har tagits bort.

## Kritisk punkt före leverans: Ingress-bassökväg

Klienten använder för närvarande anrop som `fetch("/api/...")`. En inledande snedstreck går till Home Assistants webbrot och lämnar normalt den dynamiska Ingress-sökvägen. Använd Ingress-relativa adresser, exempelvis `fetch("api/ratings")`, och säkerställ att dokumentets basadress slutar med `/`. Samma regel gäller bilder och andra appresurser. Detta ska verifieras i en riktig Ingress-panel; vanlig körning på `localhost` upptäcker inte felet.

## Autentisering och CSRF

Home Assistant Ingress är autentiseringsgränsen. Ingen port får publiceras och ingen separat login eller token ska införas i appen. Den appspecifika rubriken gör att vanliga korsdomänformulär inte kan utföra skrivningar. Webbläsarens same-origin-policy hindrar främmande JavaScript från att sätta rubriken eftersom servern inte ger CORS-tillstånd.

En Origin/Host-jämförelse har inte införts: bakom Ingress kan extern `Origin`, intern `Host` och vidarebefordrade värden skilja sig, vilket riskerar att blockera legitima anrop. Om en sådan kontroll senare läggs till måste den testas mot de faktiska proxyhuvudena och en uttrycklig lista över betrodda värdar. Appen ska fortsatt sakna CORS-rubriker.

Ingress ger inte appen en säker användaridentitet. Lösningen är därför korrekt endast för det beslutade ensam-användarfallet. Fleranvändarstöd kräver serververifierad identitet och auktorisering.

## Filservering och innehåll

`SimpleHTTPRequestHandler` begränsas till den medföljande webbrooten och databasfilerna ligger utanför denna. Lägg aldrig `/data`, importarkiv eller revisionsfiler under `/app/www`. Följande bör gälla vid framtida receptimport:

- packa aldrig upp absoluta sökvägar eller `..`-segment;
- tillåt endast specificerade filtyper och kontrollera verkligt filformat;
- sätt gränser för arkivets totalstorlek, filantal, bilddimensioner och uppackad storlek;
- lagra filnamn från servergenererade sluggar, inte direkt från uppladdningsnamn;
- servera inte användaruppladdad HTML, SVG eller JavaScript.

CSP tillåter för närvarande inline-stilar för befintlig UI-kompatibilitet men inte inline-skript. Den kan skärpas när styling är inventerad.

## SQLite och samtidighet

Databasen använder parametriserade frågor och schema-`CHECK` för betyg och typ. WAL och tio sekunders timeout är rimliga för få, korta skrivningar. Varje anrop öppnar en anslutning, vilket är enkelt och acceptabelt vid ensam användare. Anteckningslistan är begränsad vid skrivning för att förhindra obegränsad databas- och svarstillväxt.

Vid framtida import eller migrering ska transaktioner vara atomiska. Schemaändring kräver versionsnummer och en databas-snapshot innan migrering.

## Backup och återställning

Manifestet deklarerar `backup: cold`, så processen ska stoppas medan Supervisor kopierar data. Det är den säkra enkla modellen för den nuvarande implementationen. Om framtida krav gör hot backup önskvärd krävs en hook som använder SQLite Backup API och ett praktiskt verifierat återställningsflöde. Kopiera aldrig endast huvudfilen medan WAL används.

Godkännande kräver ett dokumenterat restore-test med minst ett betyg och en anteckning. Kontrollera att huvuddatabas samt eventuell `-wal`/`-shm` hanteras konsekvent och att data överlever uppgradering.

## Resursbedömning

Servern har inga tunga ramverk eller bakgrundsjobb. Normal tomgång bör därför vara liten nog för Green. De huvudsakliga riskerna är stora originalbilder, obegränsad import och många samtidiga HTTP-trådar. Bilder ska förkomprimeras till WebP/AVIF och inga miniatyrer ska genereras vid sidvisning.

Mät på eller nära Green-hårdvara med mål för tomgångsminne, kallstart, startsidans överförda byte och söksvar. Belastningstest bör inkludera snabb upprepad betygsättning och 1 000 anteckningar på ett recept. Vid framtida fleranvändning bör servern få en fast gräns för samtidiga anslutningar eller ersättas av en liten produktionsserver med sådan gräns.

## Kvarvarande leveranskontroller

1. Bygg add-on-imagen för `aarch64` och kontrollera att angiven basimage/tagg finns.
2. Verifiera dynamiska relativa URL:er genom riktig Home Assistant Ingress.
3. Bekräfta att ingen port syns i tilläggets nätverksinställningar.
4. Kontrollera att watchdog-formatet accepteras av aktuell Supervisor-version.
5. Genomför backup och restore med WAL-data.
6. Starta utan internet och kontrollera att inga externa typsnitt, bilder eller skript efterfrågas.
7. Kontrollera loggar så att kommentarer, receptinnehåll och andra personuppgifter inte skrivs ut.

