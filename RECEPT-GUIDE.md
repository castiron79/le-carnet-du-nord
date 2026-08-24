# Smulor – lokal receptsajt

Sajten är gjord för att vara liten, snabb och helt lokal. Den behöver ingen databas och gör inga anrop till internet.

## Lägga till egna bilder

1. Lägg dina komprimerade JPG- eller WebP-bilder i `public/images`.
2. Ge dem enkla filnamn, till exempel `lasagne.jpg`.
3. Ändra receptets `image` i `app/page.tsx` till `/images/lasagne.jpg`.

För telefoner och surfplattor räcker bilder på cirka 1200 × 900 pixlar. Sikta på under 300 KB per bild.

## Lägga till recept

Öppna `app/page.tsx` och kopiera ett objekt i listan `recipes`. Ändra titel, kategori, tid, antal portioner, bild, ingredienser och steg. Sajten skapar kortet och detaljvyn automatiskt.

## Home Assistant Green

Den enklaste driften är att bygga sajten på en vanlig dator och kopiera de färdiga statiska filerna till Home Assistants `config/www/smulor` via tillägget Samba share. Sajten blir då åtkomlig på det interna nätet via:

`http://homeassistant.local:8123/local/smulor/`

Lägg inte upp en extern port i routern och aktivera inte fjärråtkomst för sökvägen om sajten ska förbli intern.
