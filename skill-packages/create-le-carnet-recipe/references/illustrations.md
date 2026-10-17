# Le Carnet – illustrationsstandard v1.0

Beslutad 2026-10-17. Gäller nya och ändrade recept. För detaljer i receptets tekniska format, se `RECIPE-SPEC.md`.

## Kreativt uttryck
- En blandning av klassisk fransk kokboksgravyr och moderna enkla instruktionsbilder.
- Tunna svarta tuschlinjer, lätt skraffering och rent utsnitt på ljus neutral bakgrund.
- Endast ingredienserna och maten får återhållsamma, naturliga, dämpade kulörer. Redskap, händer, kastruller, ytor och miljö är svartvita.
- Ingen inbakad text, etikett, siffra eller handskriven notering. All text ligger i separat caption i HTML.
- Korrekt anatomi och teknik. Inget fotorealistiskt eller serietidningsaktigt bildspråk. Minimera rekvisita.

## Bildtyper och urval
`action` visar själva arbetet. `result` visar korrekt färdiggrad eller konsistens. `detail` visar storlek, struktur eller annat avgörande utsnitt. Ett numrerat receptsteg får noll, en eller flera bilder. Det finns ingen övre gräns per recept. Inga bilder för rent triviala moment krävs; ibland får en bild finnas bara för att den är vacker eller rolig.

## Receptfil
`illustrations.json` är valfritt och ligger bredvid `recipe.md` och `hero.webp`. Format:

```json
{
 "version":1,
 "illustrations":[
  {"step":2,"kind":"action","file":"step-02-action-01.webp","alt":"Älgkött som bryns i gryta","caption":"Bryn i små omgångar."},
  {"step":2,"kind":"result","file":"step-02-result-02.webp","alt":"Brynt älgkött med mörk stekyta","caption":"Ytan ska vara brynt, inte bränd."}
 ]
}
```

- `step`: 1-baserat index i `## Gör så här`. Manifestordningen styr ordningen för bilder vid samma steg.
- `kind`: action, result, detail. `file`: `step-NN-kind-XX.webp` eller `.avif`.
- `alt`: meningsfull bildbeskrivning. `caption`: separat text under bilden; får vara tom sträng.
- Filer måste ligga i samma receptmapp. Inga URL:er, absoluta sökvägar, traversal eller duplicerade filnamn.
- Rekommenderat format 1200×750 px, WebP under 300 KB om möjligt. Över 500 KB varning; över 2 MB publiceringsstopp. Hero är separat.
- Legacy-recept utan manifest ska fortsätta fungera.

## Interaktion
- Alla bilder dolda vid sidladdning. Inga bildknappar visas för steg utan bilder.
- Knapp per bild: Visa illustration / Visa hur det ska se ut / Dölj illustration.
- Globalt: Visa alla illustrationer och Dölj alla. Enskild ändring påverkar inte andra.
- Bilder visas inline under sin stegtext med caption, inte i modal.
- Mobil och tangentbord: minst 44 px knappar, synlig fokusmarkering, aria-expanded och aria-controls.
- Bildresurser ska inte laddas förrän de visas. Cachebrytande revisions-ID från GitHub gäller.

## Obligatorisk redaktionell grind
1. Färdigställ recept och numrerade steg.
2. Välj bildmoment och generera **Hero plus samtliga** föreslagna illustrationer.
3. Visa allt för användaren, med stegnummer, typ och caption.
4. Låt användaren behålla, ta bort, lägga till och göra om, utan övre gräns. Upprepa översikten efter ändringar.
5. Invänta separat uttryckligt godkännande av hela text- och bildpaketet. Ett tidigare Hero-godkännande räcker inte.
6. Validera `recipe.md`, manifest, bildreferenser och bildbytes. Lås SHA-256 för samtliga filer.
7. Publicera exakt samma filbytes via befintlig GitHub-process, utan nya genereringar eller formattering efter låsning.

Automatisk kontroll kan verifiera struktur och bildfiler; att illustrationerna saknar text och visar rätt teknik verifieras manuellt.

## Fast genereringsprompt
”Le Carnet du Nord culinary instruction illustration. Vintage French cookbook engraving blended with modern clean instructional line art. Fine black ink strokes, light hatching, elegant minimal warm-neutral background. Only ingredients and cooked food use realistic muted low-saturation colours; hands, implements, cookware and surroundings stay monochrome. Show exactly [step action or correct result], anatomically and culinarily accurate. No words, numerals, labels, lettering or text anywhere in the image. Avoid photorealism, cartoon exaggeration, high saturation and clutter.”
