# Publicering till GitHub

Standardarkivet för Le Carnet du Nord är det privata GitHub-repot `castiron79/le-carnet-recipes` på grenen `main`.

## Välj publiceringsväg

1. Om GitHub-anslutningen är tillgänglig i den aktuella ChatGPT Work-sessionen ska den användas direkt. Kräv då aldrig en lokal klon och försök inte köra det lokala publiceringsskriptet.
2. Om GitHub-anslutningen saknas ska du säga att användaren behöver aktivera GitHub-pluginen i just den aktuella Work-sessionen. Säg inte att en lokal klon krävs på telefonen.
3. Använd `scripts/publish-recipe.mjs` endast i en lokal Codex-/terminalmiljö där en riktig Git-klon redan finns. En lokal klon anges då med `LE_CARNET_RECIPES_REPO` eller som skriptets andra argument.

När användaren uttryckligen ber att publicera:

1. Kontrollera att receptet har status `published`; ändra aldrig från `review` utan användarens godkännande.
2. Kör receptvalidatorn.
3. Beräkna SHA-256 för varje fil i receptpaketet direkt efter lyckad validering. Från denna punkt är paketet låst: ingen text, metadata, mängd, makro eller bild får regenereras, räknas om eller formateras om.
4. Kontrollera med en läsoperation att `castiron79/le-carnet-recipes` och grenen `main` är åtkomliga.
5. Publicera hela katalogen under `recipes/<recept-id>/`. Receptfilen ska heta `recipe.md`, huvudbilden `hero.webp` och valfria stegbilder från `illustrations.json` med formatet `step-NN-kind-XX.webp` eller `.avif`.
6. Använd GitHub-anslutningens blob-, tree-, commit- och ref-funktioner när paketet innehåller binära bilder. Skapa blobbar direkt från de låsta filbytesen, kontrollera deras SHA-256 mot de validerade värdena, bygg ett träd ovanpå aktuell `main`, skapa en enda commit och flytta `main` med fast-forward.
7. Om samma recept-id redan finns, ersätt endast filer under dess egen katalog och bevara övriga recept.
   Vid en uppdatering måste `references/uppdatera-befintligt-recept.md` vara uppfylld, basrevisionen fortfarande vara aktuell och verifieringsmanifestets kandidatdigest motsvara de bytes som skickas.
8. Rapportera den skapade Git-revisionen. Gör högst ett publiceringsförsök; vid konflikt ska du läsa om aktuell `main` och använda samma låsta bytes. Regenerera aldrig receptet och använd aldrig force-push.

Använd aldrig en skrivoperation före användarens uttryckliga publiceringsgodkännande. En begäran om granskning eller ändring ger inte publiceringstillstånd.

Det lokala skriptet ersätter endast katalogen med samma recept-id, skapar en avgränsad commit och skickar till den klonens befintliga remote. GitHub-token ska aldrig skrivas i receptet, repot, loggen eller ett kommando. Autentisering hanteras av användarens Git-klient eller GitHub-anslutning.



## Bildgranskningsgrind

Alla föreslagna stegbilder samt Hero ska visas för användaren och vara uttryckligen godkända innan paketet hash-låses och skickas. När ägaren väljer att lägga till, ta bort eller göra om en bild måste hela den uppdaterade uppsättningen granskas på nytt. `illustrations.json`, bilder och captions ingår i exakt samma byte-låsta publiceringscommit. Skapa aldrig en ny bild efter låsningen.

## Obligatorisk timerkontroll (v10)

Granska alla steg och inkludera `timers.json` i samma receptmapp som övriga filer. Kör den aktuella validatorn före låsning av publiceringspaketet; den stoppar saknat manifest och saknade uttryckliga stegtider. Publicera även timerfilen med exakt de validerade filbytesen. Efter publicering ska arkivets automatiska receptkontroll vara grön. Ingen automatisk tidsuppskattning eller ljudfunktion ingår.

## Paketkontroll (v12)

Läs `recipe-files.md`. Endast godkända receptfiler och refererade bilder får ingå. Validatorn avvisar okända filer, länkar, underkataloger och felaktiga bildformat före publicering. Förvara granskningsunderlag och originalbilder utanför paketet. Publicera inte AVIF-huvudbilder till Green 1.6.3; använd hero.webp tills serverstödet är verifierat.
