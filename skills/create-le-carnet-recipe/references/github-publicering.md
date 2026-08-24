# Publicering till GitHub

Standardarkivet för Le Carnet du Nord är det privata GitHub-repot `castiron79/le-carnet-recipes`. En lokal klon anges med miljövariabeln `LE_CARNET_RECIPES_REPO` eller som andra argument till publiceringsskriptet.

När användaren uttryckligen ber att publicera:

1. Kontrollera att receptet har status `published`; ändra aldrig från `review` utan användarens godkännande.
2. Kör receptvalidatorn.
3. Kör `node scripts/publish-recipe.mjs <receptmapp> <lokal-repoklon> --push`.
4. Rapportera den skapade Git-revisionen. Om autentisering eller nätverk saknas ska receptet förbli validerat lokalt och felet rapporteras utan upprepade pushförsök.

Skriptet ersätter endast katalogen med samma recept-id, skapar en avgränsad commit och skickar till den klonens befintliga remote. GitHub-token ska aldrig skrivas i receptet, repot, loggen eller ett kommando. Autentisering hanteras av användarens Git-klient eller GitHub-anslutning.
