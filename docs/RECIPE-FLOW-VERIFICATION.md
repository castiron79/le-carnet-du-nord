# Slutkontroll av receptflödet – etapp 6

Kontrollerad 2026-10-19. App 1.6.6, skillpaket v12, receptrevision
`c019d71adcb5d8eb03097e483a78448e35b8d18c`.

## Flöde och nätverk

Recept skapas och valideras med skillen. Efter separat publiceringsgodkännande
skickas det låsta paketet till det privata `castiron79/le-carnet-recipes`.
Green hämtar paketet från GitHub över HTTPS och kontrollerar filerna före import.
Den vägen kräver inte fjärråtkomst till Home Assistant.

I ChatGPT Work används GitHub-anslutningen direkt; ingen lokal Git-klon behövs
på telefonen. Codex på datorn kan använda det lokala publiceringsskriptet.
En separat installation av skillen i ChatGPT måste vara uppdaterad till v12;
att Codex-kopian är uppdaterad bevisar inte detta.

Appens inkommande HTTP-kontroll gäller Supervisor-trafiken till appen, inte
telefonens anslutning till GitHub eller Greens utgående synk. Appen öppnas
fortsatt genom HA-inloggning och Ingress på hemnätverket. Fjärråtkomst till HA
har inte aktiverats eller provats.

## Verifierat

| Del | Faktiskt prov och resultat |
|---|---|
| Skillpaket | Alla 17 filer i v12-ZIP, underhållen källa, portabel mapp och installerad personlig Codex-skill är byte-identiska. Validatorernas kopior matchar receptarkivet. |
| Befintliga recept | Alla 14 passerar skillens validator utan varningar. Samtliga 90 receptfiler har oförändrade SHA-256 jämfört med etapp 1. |
| GitHub-anslutning | Ett riktigt läsanrop genom GitHub-pluginen hämtade sconesreceptets identitet från rätt privata arkiv och revision. Detta bevisar läsning i denna session, inte telefonens installation eller skrivrättighet. |
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

Vid dokumentationstillfället väntar användarens prov med avstängt wifi:
använd skill v12 i den vanliga ChatGPT-/Work-miljön för att hämta och validera
scones utan ändring eller publicering. Detta kan bekräfta mobildata,
skillinstallationen och GitHub-läsningen.

En ny, godkänd receptpublicering från telefon via mobildata till riktiga GitHub
och vidare till Green har inte genomförts inom denna slutkontroll. Det är ett
separat, oprövat led; ett läsprov och ett isolerat lokalt pushprov får inte
redovisas som ett sådant komplett verkligt publiceringsprov. Nästa vanliga
receptpublicering kan användas för den kontrollen genom att notera skapad
GitHub-revision och sedan jämföra med Greens synkrevision.

Inga recepttexter, bilder, skillfiler, appfunktioner, behörigheter, portar eller
installationsinställningar ändrades i denna etapp. Backup, byggberoenden och MFA
ligger utanför den beslutade sexetappsplanen.
