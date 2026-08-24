---
name: create-le-carnet-recipe
description: Skapa, bearbeta, paketera och validera svenska recept för Le Carnet du Nord med bilder. Använd automatiskt när användaren beskriver, klistrar in, diskuterar, ändrar eller godkänner ett recept i Le Carnet-sammanhang, även utan att uttryckligen be om skillen. Omvandla receptunderlaget till ett komplett granskningsutkast med makron, tider, fransk restaurangtitel, klassificering, allergener och bild; publicera aldrig utan separat uttryckligt godkännande.
---

# Skapa Le Carnet-recept

## Automatisk aktivering och standardsvar

- Behandla varje recept, råvarulista, maträttsidé eller fortsättning på en receptdiskussion i ett Le Carnet-projekt som en begäran att köra hela arbetsflödet.
- Användaren behöver inte skriva "använd skillen", "enligt mina vanliga instruktioner" eller räkna upp vilka receptfält som behövs.
- Börja omedelbart skapa eller uppdatera det kompletta granskningsutkastet. Kommentera, beröm, sammanfatta eller bekräfta inte bara receptet.
- Presentera receptets fullständiga redaktionella innehåll i chatten så att användaren kan granska och begära ändringar innan publicering.
- Om ingen användbar huvudbild har bifogats och bildgenerering finns tillgänglig, skapa automatiskt en fotorealistisk `hero.webp`-bild av den färdiga rätten i Le Carnets nordiskt-franska bildstil.
- Håll alltid receptet i `review` eller `draft` tills användaren separat och uttryckligen godkänner publicering.

## Arbetsflöde

1. Läs `references/recipe-schema.md` innan du skapar eller ändrar recept.
2. Samla receptets råvaror, råvikter, portioner, tider och separata bilder. Fråga endast efter uppgifter som blockerar en rimlig beräkning eller säker instruktion.
3. Välj dominant `protein_group` och `carb_group` på grov råvarunivå. Använd inte kryddor eller små tillbehör.
4. Skriv en tydlig svensk titel och en återhållsamt elegant, idiomatisk fransk `restaurant_title`. Bevara rättens identitet.
5. Beräkna näring från generiska råvaruvärden och råvikter. Summera hela receptet, dividera med portioner och rimlighetskontrollera energin. Hitta inte på precision; sätt `draft` om underlaget inte räcker.
6. Skapa `<slug>/recipe.md`. Kopiera/optimera en bifogad huvudbild som `hero.webp`, eller generera automatiskt huvudbilden när ingen bild har bifogats och bildgenerering finns tillgänglig. Använd `step-NN.webp` för valfria stegbilder. Ändra aldrig källbilder destruktivt.
7. Säkerställ att de fem automatiska faktarikonerna kan visas: total tid, aktiv tid, portioner, kcal per portion och måltidstyp. De skapas av sajten från receptets metadata och ska inte levereras som separata bildfiler.
8. Kör `node scripts/validate-recipe.mjs <receptmapp>`. Åtgärda alla fel. Varningar kräver redaktionellt ställningstagande.
9. Sätt `published` först efter manuell granskning. Paketera endast receptmappen, utan temporära filer.
10. När användaren uttryckligen ber att publicera till Le Carnet, läs `references/github-publicering.md`. I ChatGPT Work ska den aktiva GitHub-pluginen användas direkt; kräv inte lokal klon. Publicera till det privata recept-repot först efter lyckad validering. Ett vanligt önskemål om att skapa eller granska ett recept innebär inte tillstånd att skicka något externt.

## Regler

- Följ den lokala projektspecifikationen om den är nyare än den bundlade referensen.
- Använd svenska mått, °C och ISO-datum.
- Ange allergener efter aktiv kontroll.
- Bevara `id` efter första publicering och uppdatera `updated_at` vid innehållsändring.
- Generera aldrig egna ikonbilder för faktafält. Använd alltid sajtens gemensamma, lokala ikonsystem så att uttryck, tillgänglighet och filstorlek förblir konsekventa.
- Ändra styrande dokument och validator tillsammans när schemaformatet ändras.
- Efter lyckad validering är hela paketet låst. Publicera exakt de validerade filbytesen och ändra eller räkna aldrig om innehåll, mängder, bilder eller näringsvärden i publiceringssteget.

