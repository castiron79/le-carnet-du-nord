# Slutkontroll av receptflödet – etapp 6

Kontrollerad 2026-10-19. App 1.6.6, skillpaket v13 (utgångsläge v12), receptrevision
`c019d71adcb5d8eb03097e483a78448e35b8d18c`.

## Flöde och nätverk

Recept skapas och valideras med skillen. Efter separat publiceringsgodkännande
skickas det låsta paketet till det privata `castiron79/le-carnet-recipes`.
Green hämtar paketet från GitHub över HTTPS och kontrollerar filerna före import.
Den vägen kräver inte fjärråtkomst till Home Assistant.

I ChatGPT Work används GitHub-anslutningen direkt; ingen lokal Git-klon behövs
på telefonen. Codex på datorn kan använda det lokala publiceringsskriptet.
En separat installation av skillen i ChatGPT behöver uppdateras till v13 för den
verifierade anvisningen om bildhämtning;
att Codex-kopian är uppdaterad bevisar inte detta.

Appens inkommande HTTP-kontroll gäller Supervisor-trafiken till appen, inte
telefonens anslutning till GitHub eller Greens utgående synk. Appen öppnas
fortsatt genom HA-inloggning och Ingress på hemnätverket. Fjärråtkomst till HA
har inte aktiverats eller provats.

## Verifierat

| Del | Faktiskt prov och resultat |
|---|---|
| Skillpaket | Utgångslägets 17 filer i v12-ZIP, källa, portabel mapp och installerad personlig Codex-skill matchade. v13 paketerar den verifierade anvisningen om binär bildhämtning; schema och validatorskript ändras inte. |
| Befintliga recept | Alla 14 passerar skillens validator utan varningar. Samtliga 90 receptfiler har oförändrade SHA-256 jämfört med etapp 1. |
| GitHub-anslutning | Alla sju sconesfiler hämtades genom GitHub-pluginens fetch_file med encoding=base64 från rätt privata arkiv och revision, avkodades och verifierades mot originalbytes och Git-blob-SHA. Hela paketet passerade validatorn utan varningar. Detta bevisar läsning i denna session, inte telefonens fullständiga körning eller skrivrättighet. |
| Lokalt publiceringsskript | Oförändrat, tidigare godkänt sconespaket validerades, committades och pushades till ett isolerat lokalt Git-arkiv. Alla sju filers bytes verifierades även i mottagararkivet. Ompublikation skapade ingen extra commit. Ingen skrivning gjordes till riktiga GitHub. |
| Serverimport | Samma isolerat publicerade paket importerades med aktuell serverkod. Alla sju filer var oförändrade; en timer och tre bilder fanns kvar. Alla 14 verkliga paket provimporterades också isolerat: 90 oförändrade filer och 34 godkända bilder. |
| GitHub → Green | Riktig manuell synk genom befintlig Ingress/MCP-väg gav current, 14 recept, revision c019d71. Recept-API visar 14 recept, 47 timers och 34 bildreferenser. Scones har fyra grundportioner, gemensamma mängdreferenser, tre bilder och en timer. |
| Drift | Installerad/senaste appversion är 1.6.6. Ingress, automatisk watchdog och HA:s uppdateringsvisning verifierades i etapp 5. Ingen ny appinstallation behövdes i etapp 6. |
| Verkliga enheter | Användaren bekräftade i etapp 5 att scones bilder, illustrationsknappar och timerreglage fungerar från dator, surfplatta och telefon på hemnätverket. |

GitHubs automatiska kontroller för apprevision
`5d315bb03107c94b2d3e74387fbf3e2375cb1e4c` och receptrevisionen ovan var
godkända vid slutkontrollen. Dessa tidigare körningar ska inte beskrivas som
ett nytt publiceringsprov från telefonen.

## Återstående verkligt mobilprov

Användaren rapporterade från det första mobilprovet att textdata kunde hämtas
från c019d71 och att mängd-/timerkontroller passerade, men att fullständig
paketvalidering stoppades eftersom bildbytes inte kunde hämtas. Inga skrivningar
gjordes. Detta är ett delvis lyckat mobilprov, inte ett fullständigt godkänt paket.

Felet reproducerades i denna anslutning: fetch_blob gav UnicodeDecodeError för
en giltig WebP-bild. fetch_file med encoding=base64 fungerade för alla sju filer
och gav ett byte-identiskt paket som passerar hela validatorn. Denna lösning
finns i skill v13. Omprov med samma metod i användarens mobilchatt inväntas;
lokal framgång ersätter inte det verkliga mobilprovet.

En ny, godkänd receptpublicering från telefon via mobildata till riktiga GitHub
och vidare till Green har inte genomförts inom denna slutkontroll. Det är ett
separat, oprövat led; ett läsprov och ett isolerat lokalt pushprov får inte
redovisas som ett sådant komplett verkligt publiceringsprov. Nästa vanliga
receptpublicering kan användas för den kontrollen genom att notera skapad
GitHub-revision och sedan jämföra med Greens synkrevision.

Endast skillanvisningar, paketering och dokumentation ändrades. Inga recepttexter,
bilder, appfunktioner, behörigheter, portar eller Green-inställningar ändrades.
Backup, byggberoenden och MFA
ligger utanför den beslutade sexetappsplanen.
