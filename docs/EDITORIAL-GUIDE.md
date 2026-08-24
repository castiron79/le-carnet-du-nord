# Redaktionell guide — Le Carnet du Nord

## Röst och namn

Skriv på klar, varm svenska med återhållsam restaurangkänsla. `title` ska säga vad rätten är. `restaurant_title` får vara elegant franska men måste vara idiomatisk och får inte dölja huvudråvaran. Undvik överdrifter som “världens bästa”.

Stilen är fransk-nordisk: mörkgrönt, benvitt och mässing; klassisk typografi; en aptitlig huvudbild; kort ingress; luftiga faktarutor. Designen får kännas högtidlig men receptet ska vara lätt att laga.

Faktaraden får sina fem ikoner automatiskt från receptets tider, portioner, kcal och måltidstyp. Skapa inte ikoner som bildfiler för enskilda recept. Huvudbilden ska vara ren matfotografi utan text eller toning; sajten lägger själv på den responsiva tonade övergången mot titelblocket.

## Redaktionell kontroll

- Kontrollera att portionsantal, tider och alla mängder går ihop.
- Kontrollera att protein- och kolhydratgruppen beskriver rättens dominanta komponenter.
- Ange kända allergener enligt ingredienserna; skriv `[]` endast efter aktiv kontroll.
- Skriv steg i faktisk arbetsordning och ange temperatur, kärl och visuella tecken när det hjälper.
- Håll serveringstips praktiska. Förklara smakbalans konkret under “Varför det blir så gott”.
- Ange säker, försiktig förvaring. Ge inte råd som förlänger hållbarhet utan stöd.
- Skriv alt-text som beskriver maten, inte “bild av”.
- Korrekturläs svenska tecken, decimaler och enheter.

## Bildregler

Hero-bilden ska visa den färdiga rätten, utan text inbakad i bilden. Beskär motivet så att det fungerar i 16:10 och på mobil. Bevara naturlig matfärg; undvik aggressiv skärpa och övermättnad. Ta bort EXIF-position vid export. Stegbilder ska tillföra information, inte dekoration.

## Publiceringsflöde

1. Skapa receptpaketet som `draft`.
2. Beräkna makron och dokumentera metod.
3. Kör validatorn.
4. Gör redaktionell granskning och sätt `review`.
5. Godkänn manuellt, sätt `published` och datum.
6. Lägg paketet i projektets receptkatalog och bygg om sökindex.

Kommentarer och betyg ändrar inte receptfilen. Ändringsförslag går till granskning och resulterar, efter godkännande, i en versionshanterad ändring av `recipe.md`.
