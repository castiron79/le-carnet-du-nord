# Slutkontroll av receptflödet – etapp 6

Slutverifierad 2026-10-19. App 1.6.6, skillpaket v13 (utgångsläge v12).
Baslinjen var receptrevision `c019d71adcb5d8eb03097e483a78448e35b8d18c`;
verklig mobilpublicering och Green-synk verifierades därefter på
`598fcd12c8adb4324d5c9be633725013f95c6be2`.

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
| Telefon via mobildata | Användaren bekräftade i omprovet att hela v12-validatorn passerar med giltigt paket och 0 varningar. Alla tre bilder hämtades med fetch_file, encoding=base64, från c019d71 och avkodade bytes verifierades mot respektive Git-blob-SHA. Inga arkivfiler ändrades eller publicerades. |
| Verklig mobilpublicering → Green | Användaren publicerade älggryta med trattkantareller från telefon utan wifi. GitHub-main och Greens synkrevision matchar 598fcd1. Recept-API visar det nya receptet med fyra timers; huvudbild och båda stegillustrationerna gav 200/image-webp. GitHubs receptkontroll är godkänd. |

Antalen 14 recept och 90 paketfiler ovan avser baslinjen före användarens nya
älggryta. Efter den verkliga publiceringen visar Green 15 synkroniserade recept.

GitHubs automatiska kontroller för apprevision
`5d315bb03107c94b2d3e74387fbf3e2375cb1e4c` och receptrevisionen ovan var
godkända vid slutkontrollen. Dessa tidigare körningar ska inte beskrivas som
ett nytt publiceringsprov från telefonen.

## Mobilprov och slutverifiering

Användaren rapporterade från det första mobilprovet att textdata kunde hämtas
från c019d71 och att mängd-/timerkontroller passerade, men att fullständig
paketvalidering stoppades eftersom bildbytes inte kunde hämtas. Inga skrivningar
gjordes. Detta är ett delvis lyckat mobilprov, inte ett fullständigt godkänt paket.

Felet reproducerades i denna anslutning: fetch_blob gav UnicodeDecodeError för
en giltig WebP-bild. fetch_file med encoding=base64 fungerade för alla sju filer
och gav ett byte-identiskt paket som passerar hela validatorn. Denna lösning
finns i skill v13. Användarens efterföljande omprov på telefon via mobildata
passerade hela v12-validatorn med 0 varningar. Alla tre bilder hämtades med
uttrycklig base64-kodning från c019d71 och kontrollerades mot Git-blob-SHA.
Det verifierar hämtning och fullständig paketvalidering i mobilmiljön med den
korrigerade metoden; det bevisar inte en separat installation av v13 där.

Användaren genomförde därefter en verklig publicering av
`alggryta-med-trattkantareller` från mobiltelefon utan wifi. GitHub-main är
`598fcd12c8adb4324d5c9be633725013f95c6be2` och Greens befintliga synk visar
current, 15 recept och samma revision 598fcd1. Receptet finns i appens API med
fyra timers. Samtliga tre bild-URL:er gav 200/image-webp.
[GitHubs receptkontroll](https://github.com/castiron79/le-carnet-recipes/actions/runs/39199235982)
är godkänd. Användarens verkliga mobilpublicering och den oberoende kontrollen
av GitHub/Green slutför därmed flödesprovet. Inget separat testrecept behövdes.

Agentens säkerhetsarbete ändrade endast skillanvisningar, paketering och
dokumentation. Det nya receptet publicerades av användaren i ett separat
receptärende. Inga appfunktioner, behörigheter, portar eller Green-inställningar ändrades.
Backup, byggberoenden och MFA
ligger utanför den beslutade sexetappsplanen.
