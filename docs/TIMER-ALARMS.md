# Gemensamma recepttimers, app 1.7.0

Le Carnet på Green äger nedräkningen. Webbläsaren är endast gränssnitt.
SQLite-tabellerna `carnet_*` är additiva och ändrar inte recept, anteckningar,
betyg eller favoriter. `timers.json` behåller version 1 och samma redaktionella regler.

## Drift

En scheduler avslutar timers och sparar larmhändelser atomiskt, även utan en
ansluten webbläsare. En separat arbetare sköter HA-anrop. Alla ändringar kräver
revisionsnummer och unikt begärande-ID; osäkra svar kan kontrolleras via det ID:t.
Det finns ingen lokal reservtimer och gamla localStorage-timers importeras inte.

Aktiva timers återställs efter appomstart. Aldrig skickade avslut återhämtas inom
60 sekunder; äldre avslut ger felnotis utan ljud. En redan påbörjad eller osäker
leverans spelas inte om. Klockhopp under processen bevarar återstående tid med
monoton klocka. Vid omstart används sparade UTC-sluttider och Greens systemklocka.

Högst 128 aktiva/pausade timers och 128 ändringskommandon per minut tillåts.
Klienterna delar en statusförfrågan varannan sekund. Historik sparas i 30 dagar.
Färdiga timers visas tills återställning; annan pågående timer påverkas inte av
att det gemensamma larmet kvitteras.

## Ljud och HA-konfiguration

`home-assistant-addon/ha/timer-alarm.json` innehåller versionslåsta definitioner
för tre hjälpare, två skript och säkerhetsautomation. De skapas via HA:s API;
de får inte skrivas direkt till `.storage`. Vid skapande av hjälpare används
namnet för ID-bildning; `helper_id` i filen anger förväntat ID för kontroll,
inte ett argument tillsammans med API-operationen create.

Enda mål är Nest Audio `media_player.big_speaker` och kökets Mini
`media_player.kitchen_speaker`. Sonos och SpotifyPlus anropas aldrig.
Larmvolym är 45 procent och medieuppspelningen avmutas. Volymen återställs inte.
Annat ljud på dessa Google-enheter kan avbrytas och återupptas inte.

Appens `media:rw`-mappning installerar bara den medföljande MP3-filen i
`/media/le-carnet/`. Kopieringen verifierar SHA-256 och gör atomiskt namnbyte;
oväntat gammalt innehåll säkerhetskopieras. Samma checksumma lämnas orörd.
Manifestet i rootfs anger licens CC0-1.0, källa, encoder och uppmätt signalnivå.
Filen är en originalsyntes utan externa ljudsamplingar. Den avkodas som MPEG-1
Layer III, 128 kbps, mono 44,1 kHz; samtliga bildrutor valideras i testsviten.

Flera timeravslut under ett accepterat larm delar ett 30-sekundersfönster utan
förlängning eller ljudkö. **Stäng av larm** stoppar hela den aktuella omgången.
Stoppskriptet kontrollerar larm-ID och ljudets identitet, inte bara spelartillstånd.
Stoppen upprepas kort för att fånga påbörjade Cast-anrop; nya larm accepteras
inte medan det stoppskriptet fortfarande körs.

Absolut HA-stopptid fungerar utan appservern. MP3-filens egen längd under
30 sekunder är extra skydd om HA stannar. Vid HA-start stängs tidigare aktiv
omgång. Varken HA:s mottagande eller `playing` bevisar att ljud hördes.

## Installation och återställning

1. Kontrollera att inga gamla lokala recepttimers används.
2. Spara appdata och kontrollera aktuell main och HA-version.
3. Skapa/läs tillbaka HA-objekten och låt gamla piloten förbli avstängd.
4. Installera appversionen med media-mappning och kontrollera `/health` och
   `/api/timers`, samt att mediefilen kan lösas via HA.
5. Genomför verkligt lyssningsprov på båda högtalarna, gemensamt stopp och
   automatiskt stopp. Starta riktig timer och stäng av den startande telefonen.
6. Verifiera Spotify på Sonos samt recept, bilder, favoriter och anteckningar.

Återställning: stoppa först aktuellt larm och informera om/avbryt centrala timers,
stäng av säkerhetsautomationen och återgå till 1.6.7. Nya tabeller kan behållas
för felsökning. Ingen full HA-återställning krävs för att ändra de nya objekten.
En appbackup återställs bara efter separat användargodkännande.

## Verifieringsstatus vid utveckling

Timerkärnans automatiska avbrotts-/samtidighetstester, API-test och ljudfilstest
ska kompletteras med verkliga högtalar- och telefonprov. Läs arbetsrapporten
för faktiskt utförda prov; installation och hörbart ljud får inte antas från bygget.
