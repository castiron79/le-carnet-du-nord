# Le Carnet du Nord – teknisk arkitektur

## Syfte och principer

Le Carnet du Nord är ett privat receptarkiv för en ensam ägare. Det körs som ett lokalt Home Assistant-tillägg på Home Assistant Green (`aarch64`) och nås endast genom Home Assistant Ingress. Normal drift kräver inte internet.

Arkitekturen prioriterar liten resursåtgång, begripliga filer, beständiga användardata, säkra uppgraderingar och ett stabilt format som receptagenten kan producera.

## Översikt

```text
Telefon/surfplatta
  → Home Assistant-session och Ingress
    → en liten add-on-process
      ├─ statiska HTML/CSS/JS-resurser
      ├─ lokalt JSON-API
      ├─ Markdown-renderare och validator
      ├─ sökindex i minnet
      └─ /data
          ├─ recipes/<slug>/recipe.md + bilder
          ├─ app.db (SQLite)
          ├─ exports/
          └─ settings.json
```

All auktoritativ användardata finns under `/data`. Webbcache, miniatyrer och sökindex är härledda och får byggas om.

## Komponenter

### Webbklient

Klienten är förkompilerad och utan tung runtime. Den ska använda relativa URL:er eftersom Ingress-sökvägen är dynamisk, hämta receptdetaljer först när de öppnas och endast använda webbläsarlagring för tillfälliga preferenser. Typsnitt, ikoner, kod och bilder levereras lokalt.

### Lokal tjänst

En process serverar statiska filer och API; separata databasservrar, köer och bakgrundstjänster behövs inte. Tjänsten validerar och renderar Markdown, bygger sökindex, hanterar import, kommentarer, betyg, ändringsförslag, export och migreringar.

Rå HTML i Markdown avvisas eller neutraliseras. Bildreferenser får bara peka inom receptets egen katalog.

### Receptlager

```text
/data/recipes/gyros-i-pita/
  recipe.md
  hero.webp
  step-01.webp
  revisions/
    2026-08-11T183000Z.recipe.md
```

`recipe.md` är innehållets källa. Sluggen är stabil, ASCII i gemener med bindestreck. Receptets UUID ändras inte vid namnbyte. Ett importpaket packas upp i en temporär katalog och valideras fullständigt innan ett atomiskt katalogbyte.

### Sökning

Vid start läses normaliserad metadata till ett kompakt index i minnet. Sökfält är svensk titel, restaurangtitel, huvudprotein, huvudkolhydrat, kategori och redaktionella taggar. Protein och kolhydrat är stora kontrollerade råvarugrupper, exempelvis `kyckling` och `pasta`, inte varje ingrediens. Flera termer kombineras med AND. Sökningen är skiftläges- och diakritikoberoende.

## Datamodell

SQLite använder foreign keys, WAL och `busy_timeout`. Tider lagras som UTC i ISO 8601.

### `recipe_registry`

Snabbt register; Markdown förblir innehållskälla.

| Fält | Typ och regel |
|---|---|
| `recipe_id` | TEXT PK, UUID |
| `slug` | TEXT UNIQUE |
| `content_version` | INTEGER, minst 1 |
| `title` | TEXT |
| `status` | `draft`, `published`, `archived` |
| `content_hash` | SHA-256 av normaliserat innehåll |
| `published_at` | TEXT NULL, UTC |
| `updated_at` | TEXT, UTC |

### `comments`

`id` TEXT PK, `recipe_id` FK, `body` TEXT 1–4000 tecken, `status` (`open`, `resolved`, `deleted`), `created_at`, `updated_at`. Kommentarer är ren text.

### `ratings`

`recipe_id` är PK/FK, `stars` är INTEGER med CHECK 1–5 samt `created_at` och `updated_at`. Eftersom bara ägaren använder sajten finns ett aktuellt betyg per recept.

### `change_proposals`

`id` TEXT PK, `recipe_id` FK, `base_version` INTEGER, `kind` (`note`, `replacement`), `summary`, valfritt `proposed_markdown`, `status` (`pending`, `approved`, `rejected`, `superseded`), valfri `decision_note`, `created_at` och `decided_at`.

### `audit_events`

Minimal revisionslogg: `id`, `event_type`, `entity_type`, `entity_id`, `metadata_json`, `created_at`. Den innehåller inte bilddata eller kompletta receptkopior.

### Index

- `idx_comments_recipe_status_created` på `(recipe_id, status, created_at)`
- `idx_proposals_status_created` på `(status, created_at)`
- `idx_proposals_recipe_created` på `(recipe_id, created_at)`
- `idx_registry_status_published` på `(status, published_at)`

Primärnycklar och UNIQUE-fält får inga redundanta index. Migreringar kör `PRAGMA optimize`; representativa frågor kontrolleras med `EXPLAIN QUERY PLAN`.

## API-kontrakt

API:t är JSON-baserat under relativ sökväg `api/v1`. Lyckade svar använder `{ "data": ..., "meta": { "requestId": "uuid" } }`. Fel använder `error.code`, ett säkert svenskt `error.message`, valfria fältfel och `meta.requestId`.

Skrivande anrop kräver JSON, samma origin och `X-Le-Carnet-Request: 1`. Servern accepterar inte alternativa formulärkodningar.

### Läsning

- `GET api/v1/health` – process- och databasstatus utan känsliga detaljer.
- `GET api/v1/recipes?query=&protein=&carb=&status=published&limit=24&cursor=` – kompakt lista, nyast först.
- `GET api/v1/recipes/{slug}` – renderingsmodell, makron, bilder, betyg och öppna kommentarer.
- `GET api/v1/recipes/{slug}/comments?status=open` – kommentarer.
- `GET api/v1/change-proposals?status=pending&cursor=` – granskningskö.

`limit` är högst 50; cursor är ogenomskinlig.

### Skrivning

- `POST api/v1/recipes/{slug}/comments` med `{ "body": "..." }`.
- `PATCH api/v1/comments/{id}` ändrar text eller status.
- `DELETE api/v1/comments/{id}` gör logisk radering.
- `PUT api/v1/recipes/{slug}/rating` med `{ "stars": 1..5 }` gör upsert.
- `DELETE api/v1/recipes/{slug}/rating` tar bort betyget.
- `POST api/v1/recipes/{slug}/change-proposals` skapar förslag med `kind`, `summary` och valfritt `proposedMarkdown`.
- `POST api/v1/change-proposals/{id}/approve` och `/reject` beslutar med valfri `decisionNote`.

Godkännande jämför `base_version` med aktuell version. Konflikt ger `409 VERSION_CONFLICT`; inget tillämpas tyst.

### Import och export

- `POST api/v1/imports` tar emot ett ZIP-paket med ett recept och returnerar valideringsrapport.
- `POST api/v1/exports` skapar lokal export och ger ett kortlivat nedladdnings-ID.
- `GET api/v1/exports/{id}` levererar filen utan att ta emot godtycklig sökväg.

## Gransknings- och versionsflöde

1. Förslaget skapas mot aktuell `content_version` och får status `pending`.
2. Granskningsvyn visar basversion, kandidat och valideringsresultat.
3. Vid godkännande kontrolleras basversionen på nytt och kandidaten valideras.
4. Aktuell fil kopieras till `revisions/`; ny fil skrivs temporärt och byts in atomiskt.
5. Version, hash, förslagsstatus och audit-händelse uppdateras transaktionellt/logiskt atomiskt.
6. Vid fel återställs föregående fil och databasen rullas tillbaka.

Ett `note`-förslag är arbetsunderlag och kan inte automatiskt bli recepttext. Receptagenten omvandlar det till ett validerat `replacement`-förslag.

## Säkerhet

- Endast Home Assistant Ingress används; ingen direkt värdport publiceras.
- Ingress är autentiseringsgräns; appen har ingen egen lösenordsdatabas.
- Varje skrivoperation gör serverbaserade kontroller av Ingress-kontext, origin, innehållstyp och CSRF-rubrik.
- CSP utgår från `default-src 'self'`; inga externa skript, fonter, bilder eller analysverktyg.
- Markdown saneras med allowlist. Script, iframe, event-attribut och `javascript:` förbjuds.
- Kanoniska sökvägar används; `..`, absoluta sökvägar, symlänkar och arkivposter utanför tempkatalogen avvisas.
- Import begränsas i total storlek, filantal, bilddimensioner och kompressionskvot.
- SQL parametriseras. Stackspår, databasvägar och fri text skrivs inte i klientfel eller normal logg.
- Klientangivna användar-ID:n accepteras inte.

## Backup, restore och migrering

Home Assistant-backup inkluderar hela `/data`. Manuell export använder SQLite backup-API, kopierar recept och skriver checksummor samt app-/schemaversion i `manifest.json`; en aktiv WAL-databas får inte kopieras fil för fil.

Restore sker först i tempkatalog. Checksummor och schema kontrolleras innan atomiskt byte. Befintlig data bevaras som återställningspunkt tills ny start lyckats. Nyare okänd schemaversion stoppas och databaser slås aldrig ihop implicit.

Schemat har monotont versionsnummer. Före migrering skapas snapshot; misslyckande stoppar starten. Receptformat migreras separat med original i `revisions/`. Nedgradering sker genom backup-restore, inte destruktiv bakåtmigrering.

## Resursmål

Målen gäller cirka 500 recept och högst 2 GB optimerade bilder:

| Resurs | Mål |
|---|---|
| Arkitektur | `aarch64` obligatorisk |
| Vilande RSS | högst 80 MB, mål under 50 MB |
| RSS vid import/indexering | högst 180 MB |
| CPU i vila | nära 0 %, ingen polling |
| Kallstart | under 5 s exklusive migrering |
| Startsida API | under 150 ms lokalt |
| Recept och sökning | under 100 ms |
| Produktionspaket | mål under 40 MB exklusive bilder och basimage |

Bilder begränsas normalt till 2400 px och cirka 1,5 MB per fil. Miniatyrer skapas en gång vid import. Ingen periodisk indexering körs.

## Icke-mål i version 1

Publik åtkomst, extern databas, molnpublicering, produkt-/varumärkesdatabas, näring från tillagad vikt, samtidiga redaktörer och fulltextsökning i varje instruktion ingår inte.
