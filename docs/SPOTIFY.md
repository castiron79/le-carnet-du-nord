# Spotify i Le Carnet

Version 1.6.7, 2026-10-22.

Sidfotens tidigare privata arkivtext ersätts av Spotify och de tre godkända
notikonerna (spela, pausa och otillgänglig), med borttagen bakgrund.

## Koppling

- Den befintliga SpotifyPlus-entiteten `media_player.spotifyplus_bo_thysell`
  och dess befintliga session används. Befintliga cachehjälpare och automationer
  ändras inte.
- Enda mål är Spotify Connect-namnet `Kitchen`, verifierat mot Sonos-entiteten
  `media_player.kitchen`. Soundbar/Nest-skriptet anropas inte.
- Spela återupptar Kitchen eller gör en enda överföring till Kitchen med
  `force_activate_device: false`. Paus påverkar endast Spotify som redan har
  Kitchen som källa. Samtidiga knappkommandon avvisas och önskad åtgärd skickas
  uttryckligen, så dubbla play-anrop inte blir play följt av paus.
- Ingen väckningslogik, spellisteåterställning, reservspelare eller nya hjälpare.
  Vid misslyckande visas att Spotify kan startas manuellt.
- Status hämtas var femte sekund när sidan är synlig och vid återkomst/fokus.
  Verkligt HA-tillstånd visas; ingen optimistisk spela/pausindikering.

## Åtkomst

`homeassistant_api: true` ger appservern åtkomst till HA. Supervisors befintliga
token läses endast från servermiljön. Den fasta interna API-adressen och de två
fasta entiteterna kan inte väljas av webbläsaren. Statussvaret innehåller enbart
`playing`, `paused` eller `unavailable`; HA-attribut och token returneras inte.
POST kräver befintligt Ingress-skydd, JSON och `X-Carnet-Request: 1`.

Ikonerna finns i `public/spotify-icons` för webbbygget och
`static/public/spotify-icons` för Green-bygget, samt i det byggda Green-paketet.

## Verifierat

- Levande SpotifyPlus: överföring till Kitchen utan tvångsaktivering, paus och
  återupptagning. SpotifyPlus och Sonos rapporterade samma spelande låt.
  Båda rapporterade paus efter avslutat test. Detta är HA-tillståndsbevis,
  inte en mänsklig bekräftelse av hörbart ljud.
- 46 JavaScript-tester och 30 Python-servertester passerar.
- Lokalt webbläsartest av det byggda Green-gränssnittet med simulerade API-svar:
  spela, pausa, extern statusändring, otillgänglig, fel och mobilbredd 390 px.
  Inga JavaScript-fel eller sidledsskrollning.
- Green-bygget, webbbygget och releasekontrollen passerar.
- Nya komponenten: inga lintfel, en bildvarning enligt projektets befintliga
  användning av vanliga bildtaggar. Full lintkontroll har tre befintliga fel i
  arkivvyns localStorage-hantering. Full typkontroll saknar befintliga
  Cloudflare-typer i `db/index.ts` och `worker/index.ts`; dessa filer ändras inte.

## Kontroll vid installation

Installera 1.6.7 på Green så att HA-API-behörigheten träder i kraft, och testa
den verkliga Le Carnet-knappen via Ingress på telefonen mot kökets Sonos.
Det flödet är inte verifierat av den lokala simuleringen.

Återställning: installera föregående version 1.6.6. Inga HA-objekt har skapats
eller ändrats av implementationen.
