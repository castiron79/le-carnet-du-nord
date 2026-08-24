# Automatisk publicering via GitHub

## Resultatet

Le Carnet använder två arkiv:

- `castiron79/le-carnet-du-nord` innehåller appkoden och Home Assistant-tillägget. Det innehåller inga privata recept.
- `castiron79/le-carnet-recipes` är privat och innehåller receptmapparna under `recipes/`.

Mobil, surfplatta och dator visar samma recept eftersom alla använder samma Home Assistant-app. Green kontrollerar det privata receptarkivet var 15:e minut. Knappen **Uppdatera recept** gör samma kontroll direkt och är anpassad för små skärmar.

## Engångsinställning på GitHub

1. Skapa ett publikt repo med namnet `le-carnet-du-nord` och ett privat repo med namnet `le-carnet-recipes` under användaren `castiron79`.
2. Lägg projektets kod i kod-repot och innehållet i `github-recipe-repository-template/` i recept-repot.
3. Skapa en fine-grained personal access token på GitHub. Ge den endast läsrättigheten **Contents: Read-only** och begränsa den till `le-carnet-recipes`.
4. Lägg aldrig token i ett repo eller receptfil.

## Engångsinställning i Home Assistant Green

1. Lägg till `https://github.com/castiron79/le-carnet-du-nord` som eget app-/tilläggsrepository.
2. Installera **Le Carnet du Nord**.
3. Öppna tilläggets konfiguration och fyll i GitHub-token. Ägare, repo, gren och intervall är redan ifyllda.
4. Starta om tillägget och öppna panelen.
5. Tryck **Uppdatera recept**. Statusen ska ändras till **Recepten är aktuella**.
6. Aktivera automatisk uppdatering för appen om även kodversioner ska installeras automatiskt. Brytande versioner kan alltid kräva manuellt godkännande.

## Skapa och publicera framtida recept

1. Be Codex använda `$create-le-carnet-recipe` och skapa receptet.
2. Granska receptet i sajten. Det ligger kvar som `review` och skickas inte till GitHub.
3. När allt är rätt, skriv exempelvis: **Godkänn och publicera receptet till Le Carnet.**
4. Skillen ändrar status först efter ditt godkännande, validerar receptet och skickar endast dess egen mapp till det privata recept-repot.
5. Green hämtar ändringen inom 15 minuter, eller direkt när du trycker **Uppdatera recept** från mobilen.

## Säkerhet och återställning

- Sajten exponeras inte på internet; endast Green gör utgående HTTPS-anrop till GitHub.
- Token är skrivskyddad för receptarkivet och kan inte ändra eller radera GitHub-innehåll.
- Kommentarer och betyg skickas aldrig till GitHub.
- Recept installeras först efter kontroll av struktur, status, bild, storlek och säkra filsökvägar.
- Vid fel behålls den tidigare fungerande receptversionen.
- Återställ ett recept genom att återställa en tidigare commit i GitHub och synkronisera igen.
