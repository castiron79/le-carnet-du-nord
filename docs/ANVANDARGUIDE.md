# Användarguide — Le Carnet du Nord

Den här guiden beskriver hur du installerar sajten på Home Assistant Green och hur du skapar, granskar och lägger till nya recept.

## 1. Förberedelser

Du behöver Home Assistant Green, en aktuell Home Assistant-backup, leveransen `le-carnet-du-nord-home-assistant.zip`, en dator på samma nätverk och filåtkomst via exempelvis **Samba share** eller **Studio Code Server**.

Sajten behöver inget internet i normal drift. Öppna ingen port i routern.

## 2. Installera tillägget

1. Skapa en fullständig backup i **Inställningar → System → Säkerhetskopior**.
2. Installera **Samba share** eller **Studio Code Server** om du saknar filåtkomst.
3. Packa upp `le-carnet-du-nord-home-assistant.zip` på datorn.
4. Kontrollera att huvudmappen heter `le_carnet_du_nord` och innehåller `config.yaml`, `Dockerfile`, `build.yaml` och `rootfs`.
5. Kopiera hela mappen `le_carnet_du_nord` till Home Assistants katalog `/addons`.
6. Öppna **Inställningar → Tillägg → Tilläggsbutik**.
7. Öppna menyn uppe till höger och välj **Sök efter uppdateringar**. Ladda om sidan vid behov.
8. Öppna **Le Carnet du Nord** under **Lokala tillägg** och välj **Installera**.
9. Aktivera **Starta vid uppstart**, **Watchdog** och **Visa i sidopanelen**.
10. Starta tillägget och öppna det från sidopanelen.

Åtkomsten går genom Home Assistant Ingress och Home Assistants inloggning. Tillägget exponerar ingen egen nätverksport.

## 3. Kontrollera installationen

Kontrollera att:

- startsidan och sökningen fungerar;
- ett recept kan öppnas;
- faktaraden visar fem ikoner för total tid, aktiv tid, portioner, kcal och måltidstyp;
- titel och beskrivning tonas mjukt in över bildkanten;
- ett betyg, en kommentar och ett ändringsförslag finns kvar efter omstart.

## 4. Skapa ett nytt recept

Den installerade Codex-skillen heter `create-le-carnet-recipe`. Lämna recepttexten och matbilden som separata underlag.

Exempel på beställning:

> Använd create-le-carnet-recipe och skapa ett komplett receptpaket för Le Carnet du Nord. Här är recepttexten och den separata huvudbilden. Beräkna bästa möjliga makron per portion, välj huvudprotein och huvudkolhydrat, skapa en återhållet elegant fransk titel, sätt status till review och validera paketet.

Skillen ska:

1. kontrollera ingredienser, råvikter, portioner och tider;
2. fråga bara om uppgifter som blockerar en rimlig beräkning;
3. beräkna kcal, protein, kolhydrater, fett och fiber per portion;
4. välja en grov protein- och kolhydratgrupp;
5. skapa svensk titel, fransk restaurangtitel och kort ingress;
6. skapa `recipe.md` enligt receptspecifikationen;
7. optimera huvudbilden som `hero.webp`;
8. lägga valfria stegbilder som `step-01.webp`, `step-02.webp` och så vidare;
9. kontrollera metadata som driver faktarikonerna;
10. köra validatorn och rätta alla fel;
11. leverera en receptmapp eller ZIP-fil.

Ikonerna skapas automatiskt av sajten från receptets metadata. Den tonade övergången skapas också av sajten. Ingen av dem ska bakas in i matbilden.

## 5. Paketets struktur

```text
poulet-du-nord-au-citron/
├── recipe.md
├── hero.webp
├── step-01.webp       valfri
└── step-02.webp       valfri
```

Mappnamn, `id` och `slug` ska vara identiska och skrivas med små bokstäver, siffror och bindestreck utan å, ä eller ö.

`recipe.md` innehåller svensk och fransk titel, beskrivning, status, portioner, tider, protein- och kolhydratgrupp, måltidstyp, allergener, bildinformation, makron per portion, ingredienser, arbetsmoment, serveringstips, smakförklaring och förvaring.

## 6. Granska före publicering

Kontrollera särskilt:

- att mängderna avser hela receptet och portionsantalet stämmer;
- att total tid inte är kortare än förberedelse plus tillagning;
- att makrona är rimliga;
- att protein- och kolhydratgruppen är tillräckligt grov;
- att allergenerna är kompletta;
- att bilden visar rätten och har korrekt alternativtext;
- att den franska titeln är elegant men inte missvisande.

Använd `status: review` under granskning. Byt till `status: published` när receptet är godkänt. `draft` visas inte på sajten.

## 7. Lägg in receptet

1. Öppna Home Assistants `addon_configs/le_carnet_du_nord` via Samba share eller Studio Code Server.
2. Skapa undermappen `recipes` om den saknas.
3. Kopiera hela receptmappen till `recipes`.
4. Kontrollera att sökvägen blir `addon_configs/le_carnet_du_nord/recipes/<slug>/recipe.md`.
5. Ladda om sidan. Starta om tillägget om receptet inte syns direkt.
6. Sök efter receptets namn, protein eller kolhydrat.
7. Kontrollera bild, tider, ikoner, portioner och makron.

Recept med status `review` eller `published` läses in automatiskt.

## 8. Uppdatera ett recept

1. Behåll samma `id`, `slug` och mappnamn.
2. Uppdatera `updated_at`.
3. Ändra receptet och bara de bilder som behöver bytas.
4. Kör validatorn igen.
5. Ta en backup och ersätt den gamla receptmappen.
6. Ladda om sajten och kontrollera resultatet.

Kommentarer och betyg ligger separat i SQLite och ska finnas kvar. Ändringsförslag på sajten ändrar aldrig receptfilen automatiskt; använd dem som underlag för en ny granskad version.

## 9. Bildregler

- Använd WebP eller AVIF, helst cirka 1600 × 1000 px.
- Sikta på högst 500 KB per huvudbild.
- Lägg inte in text, logotyp, faktarikoner eller toning i bilden.
- Håll huvudmotivet tydligt även när bilden beskärs på telefon.
- Skriv en beskrivande alternativtext.

## 10. Backup

Ta en Home Assistant-backup före uppdatering av tillägget, större receptimport och förändring av receptformatet. Behåll också en separat kopia av receptmapparna på dator eller annan lokal lagring.

Efter återställning kontrollerar du ett recept, en bild, ett betyg, en kommentar och ett ändringsförslag.

## 11. Felsökning

**Tillägget syns inte:** kontrollera att `le_carnet_du_nord/config.yaml` ligger direkt under `/addons` och uppdatera tilläggsbutiken.

**Receptet syns inte:** kontrollera status, mappstruktur och validatorns resultat. `draft` visas inte.

**Bilden syns inte:** kontrollera att `hero_image` exakt matchar filnamnet.

**Svenska tecken ser fel ut:** spara `recipe.md` som UTF-8.

**Betyg eller kommentarer försvinner:** kontrollera att tilläggets data ingår i backupen och att samma tilläggsinstans används.

## 12. Styrande dokument

Om receptformatet ändras ska receptspecifikation, skill, validator, exempel, beslut, tester och denna guide uppdateras tillsammans. Ett vanligt nytt recept kräver ingen ändring av styrdokumenten.
