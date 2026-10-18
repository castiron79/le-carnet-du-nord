# Visuella timers

Kräver app 1.6.0. Valfri timers.json, max 100 KB:

```json
{"version":1,"timers":[{"id":"sjud","step":3,"label":"Sjud soppan","seconds":2400,"note":"Kontrollera efter 40 min; receptet anger 40–50 min."}]}
```

Unikt stabilt id: `[a-z][a-z0-9-]{0,63}`. Step är heltal inom receptets numrerade steg. Label är 1–100 tecken. Seconds är heltal 10–86400. Valfri note är sträng max 200 tecken. Valideras tillsammans med recipe.md. Recept utan manifest fungerar som förut.

Endast uttryckliga tillagningstider märks upp, efter redaktionell granskning. Intervall använder kortare tiden för kontroll, med hela intervallet i note. ”Per sida” och andra faser kräver separata tydliga timers som startas manuellt. Ändra inte recepttext, bild, makron eller tider när timerfilen läggs till. Granska step-kopplingar när stegföljden ändras. Timer-ID ska behållas när samma moment uppdateras.

Timern är visuell, lokal för webbläsaren och ljudlös. Den räknar ikapp när sidan öppnas igen; ingen extern signal utlovas. Tider skalas inte med portioner. Skillpaket v9 innehåller validatorstöd för timers.json.
