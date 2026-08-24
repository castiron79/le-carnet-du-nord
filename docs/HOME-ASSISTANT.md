# Le Carnet du Nord på Home Assistant Green

## Distributionsform

Sajten paketeras som ett lokalt Home Assistant-tillägg (add-on), inte enbart som filer under `config/www`. Kommentarer, betyg, import, ändringsförslag och SQLite kräver en liten serverprocess och beständig skrivbar lagring.

Tillägget byggs för Green-enhetens `aarch64` och visas som panel genom Home Assistant Ingress. Ingen publik eller direkt lokal webbport behövs.

## Paketstruktur

```text
repository.yaml
le_carnet_du_nord/
  config.yaml
  Dockerfile
  build.yaml
  run.sh
  rootfs/
  app/
  translations/sv.yaml
  DOCS.md
  CHANGELOG.md
```

Minsta relevanta manifestinställningar:

```yaml
name: Le Carnet du Nord
slug: le_carnet_du_nord
version: 0.1.0
description: Privat, lokalt receptarkiv
arch:
  - aarch64
startup: application
boot: auto
init: false
ingress: true
ingress_port: 8099
panel_icon: mdi:silverware-fork-knife
panel_title: Le Carnet du Nord
ports: {}
ports_description: {}
homeassistant_api: false
hassio_api: false
auth_api: false
map: []
backup: hot
options:
  log_level: info
schema:
  log_level: list(trace|debug|info|warning|error)
```

Fälten ska verifieras mot aktuell Home Assistant-version när paketet byggs. Oanvända API-behörigheter och katalogmappningar förblir avstängda. `ports: {}` är avsiktligt.

## Ingress och autentisering

Home Assistant sköter inloggning och proxy. Appen ska:

- lyssna endast på internport `8099`;
- använda relativa URL:er och respektera dynamisk Ingress-bassökväg;
- inte erbjuda egen login eller lagra Home Assistant-token;
- avvisa direktanrop utanför förväntad Ingress-kontext när detta kan verifieras säkert;
- kontrollera same-origin och en appspecifik rubrik på varje skrivande anrop.

Eftersom endast ägaren använder installationen behövs ingen intern rollmodell i version 1. Framtida fleranvändarstöd kräver explicit verifierad identitet och serverbaserad auktorisering; det får inte antas finnas nu.

Projektet öppnar ingen routerport, aktiverar ingen molntunnel och konfigurerar ingen extern URL.

## Beständig lagring

All användardata ligger under Supervisor-hanterade `/data`:

```text
/data/
  app.db
  app.db-wal
  app.db-shm
  recipes/
  exports/
  settings.json
  migration-backups/
```

Kod och medföljande exempel är skrivskyddade i imagen. Vid första start kan startinnehåll kopieras till `/data/recipes`; uppgraderingar får aldrig skriva över användarens recept.

Ingen Samba-mappning krävs. Nya recept tas in genom appens validerade import, vilket undviker halvkopierade recept. En framtida `/share`-inkorg ska vara opt-in och behandlas som opålitlig indata.

## Installation

Använd ett privat add-on-repository eller Home Assistants lokala add-on-katalog:

1. bygg och versionsmärk imagen för `aarch64`;
2. lägg till det privata repositoryt i tilläggsbutiken;
3. installera **Le Carnet du Nord**;
4. lämna nätverksportar tomma och aktivera sidopanelen;
5. starta tillägget och kontrollera loggen;
6. öppna panelen genom Home Assistant och importera ett validerat paket;
7. skapa backup och verifiera en teståterställning.

Konkreta repo-adresser och bygginstruktioner tillkommer med add-on-koden. Kopiera aldrig en aktiv SQLite-fil som backup.

## Startsekvens

1. verifiera skrivbar `/data`;
2. validera konfiguration;
3. öppna SQLite med foreign keys, WAL och timeout;
4. skapa snapshot om migrering krävs;
5. köra väntande migreringar;
6. stämma av receptregister och filer;
7. bygga sökindex;
8. börja lyssna på internporten;
9. rapportera redo i logg och hälsokontroll.

Korrupt schema eller receptdata ska stoppa tjänsten med begripligt fel, inte ge ett delvis skrivbart läge.

## Backup

Manifestet deklarerar hot backup. En backup-hook ska skapa en konsekvent SQLite-snapshot eller checkpoint enligt implementationen innan Supervisor samlar `/data`.

Backupen ska innehålla recept, bilder, miniatyrer, kommentarer, betyg, ändringsförslag, revisioner, auditlogg, inställningar och schemaversion. Efter större uppgradering tas ny backup först när läsning, sökning och ett skrivtest fungerar.

## Restore

Testa återställning så här:

1. skapa testrecept, kommentar och betyg;
2. ta en Home Assistant-backup med tillägget;
3. ändra testdatan;
4. återställ tilläggets data;
5. starta om;
6. kontrollera recept, bild, kommentar, betyg, sökning och granskningskö;
7. kontrollera loggen efter migrerings- eller checksummefel.

Vid flytt till ny Green installeras först kompatibel eller nyare add-on-version, därefter återställs backupen. Data från en nyare schemaversion tvingas inte in i äldre kod.

## Uppdateringar

Kod och design levereras som ny add-on-version. Recept uppdateras separat genom validerade paket eller granskningsflödet, så ett recept kräver inte ny containerimage.

Version 1.1 kan som ett aktivt val synkronisera recept från det privata GitHub-repot `castiron79/le-carnet-recipes`. En begränsad, skrivskyddad token lagras i Home Assistants tilläggsinställningar. Synkningen sker var 15:e minut och kan startas från den mobilanpassade knappen **Uppdatera recept**. Nedladdat innehåll valideras och installeras atomiskt; kommentarer, betyg och lokala databaser berörs inte. Se `GITHUB-AUTOMATION.md`.

Inför uppgradering: skapa backup, läs ändringsloggen, installera, kontrollera start och startsida samt testa sökning, kommentar, betyg och en granskningsåtgärd. Behåll föregående backup tills versionen är verifierad.

När receptschemat ändras ska styrdokument, migrering och receptagentens formatversion uppdateras tillsammans.

## Nätverk och integritet

- Inga utgående nätverksanrop i normal drift, förutom valfri aktiverad GitHub-synkronisering över HTTPS.
- Bilder, typsnitt, ikoner och skript är lokala.
- Ingen telemetri eller extern analys.
- Ingen port mappas till värden.
- DNS, fjärråtkomst och TLS ägs av Home Assistant-installationen.
- Hemnätet ersätter inte autentisering; Home Assistant-inloggningen behålls.

## Felsökning

**Panelen öppnas inte:** kontrollera att tillägget körs, Ingress/panel är aktiverat och internporten lyssnar. Publicera inte `8099` som genväg.

**Import misslyckas:** läs valideringsrapporten. Vanliga orsaker är saknade makron/portioner, fel filnamn, saknad eller för stor bild och inkompatibel formatversion.

**Data försvinner:** kontrollera skrivbar `/data` och att ingen containerkatalog används som lagring. Återställ verifierad backup vid databasskada.

**Hög minnesanvändning:** kontrollera stora bilder/arkiv, samtidiga importer och att miniatyrer inte genereras per sidvisning.

## Acceptanskriterier

- Imagen bygger och startar på `aarch64`.
- Panelen nås endast efter Home Assistant-inloggning via Ingress.
- Inga värdportar exponeras och dynamisk Ingress-sökväg fungerar.
- Recept, bilder, kommentar, 1–5-betyg och ändringsförslag överlever omstart och uppgradering.
- Backup och testad restore återger samma data.
- Tom installation, migrering och felaktigt paket hanteras säkert.
- Resursmålen i `ARCHITECTURE.md` verifieras på eller nära Green-hårdvara.
- Appen fungerar utan internet efter installation.
