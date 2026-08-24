---
name: create-le-carnet-recipe
description: Skapa, paketera och validera svenska recept för Le Carnet du Nord som Markdown med tillhörande bilder. Använd när Codex ska omvandla receptunderlag till projektets receptformat, beräkna bästa möjliga makron per portion, skapa en fransk restaurangtitel, klassificera dominant protein och kolhydrat, kontrollera obligatoriska tider/allergener eller reparera ett receptpaket inför publicering.
---

# Skapa Le Carnet-recept

## Arbetsflöde

1. Läs `references/recipe-schema.md` innan du skapar eller ändrar recept.
2. Samla receptets råvaror, råvikter, portioner, tider och separata bilder. Fråga endast efter uppgifter som blockerar en rimlig beräkning eller säker instruktion.
3. Välj dominant `protein_group` och `carb_group` på grov råvarunivå. Använd inte kryddor eller små tillbehör.
4. Skriv en tydlig svensk titel och en återhållsamt elegant, idiomatisk fransk `restaurant_title`. Bevara rättens identitet.
5. Beräkna näring från generiska råvaruvärden och råvikter. Summera hela receptet, dividera med portioner och rimlighetskontrollera energin. Hitta inte på precision; sätt `draft` om underlaget inte räcker.
6. Skapa `<slug>/recipe.md`, kopiera/optimera huvudbilden som `hero.webp` och använd `step-NN.webp` för valfria stegbilder. Ändra aldrig källbilder destruktivt.
7. Säkerställ att de fem automatiska faktarikonerna kan visas: total tid, aktiv tid, portioner, kcal per portion och måltidstyp. De skapas av sajten från receptets metadata och ska inte levereras som separata bildfiler.
8. Kör `node scripts/validate-recipe.mjs <receptmapp>`. Åtgärda alla fel. Varningar kräver redaktionellt ställningstagande.
9. Sätt `published` först efter manuell granskning. Paketera endast receptmappen, utan temporära filer.
10. När användaren uttryckligen ber att publicera till Le Carnet, läs `references/github-publicering.md`. Publicera till det privata recept-repot först efter lyckad validering. Ett vanligt önskemål om att skapa eller granska ett recept innebär inte tillstånd att skicka något externt.

## Regler

- Följ den lokala projektspecifikationen om den är nyare än den bundlade referensen.
- Använd svenska mått, °C och ISO-datum.
- Ange allergener efter aktiv kontroll.
- Bevara `id` efter första publicering och uppdatera `updated_at` vid innehållsändring.
- Generera aldrig egna ikonbilder för faktafält. Använd alltid sajtens gemensamma, lokala ikonsystem så att uttryck, tillgänglighet och filstorlek förblir konsekventa.
- Ändra styrande dokument och validator tillsammans när schemaformatet ändras.
