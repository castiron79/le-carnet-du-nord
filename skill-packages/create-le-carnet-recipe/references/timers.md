# Visuella timers

Kräver app 1.6.0. Receptstandard v10 kräver timers.json vid ny publicering och uppdatering, max 100 KB. Saknas uttryckliga tider används `{"version":1,"timers":[]}`. Format:

```json
{"version":1,"timers":[{"id":"sjud","step":3,"label":"Sjud soppan","seconds":2400,"note":"Kontrollera efter 40 min; receptet anger 40–50 min."}]}
```

Unikt stabilt id: `[a-z][a-z0-9-]{0,63}`. Step är heltal inom receptets numrerade steg. Label är 1–100 tecken. Seconds är heltal 10–86400. Valfri note är sträng max 200 tecken. Valideras tillsammans med recipe.md. Recept utan manifest fungerar som förut.

Endast uttryckliga tillagningstider märks upp, efter redaktionell granskning. Intervall använder kortare tiden för kontroll, med hela intervallet i note. ”Per sida” och andra faser kräver separata tydliga timers som startas manuellt. Ändra inte recepttext, bild, makron eller tider när timerfilen läggs till. Granska step-kopplingar när stegföljden ändras. Timer-ID ska behållas när samma moment uppdateras.

Från app 1.7.0 körs timern gemensamt på Green och kan larma på Nest Audio och kökets Mini även när skärmen är avstängd. Äldre appversioner har enbart lokala visuella timers. Formatet timers.json är oförändrat. Tider skalas inte med portioner. Skillpaket v10 kräver manifestet och kontrollerar att varje uttrycklig stegtid har en timer med rätt steg och grundtid. Samma timer får inte täcka två faser; ”per sida” kräver två timers. Kontrollen stödjer numeriska sekunder, minuter och timmar, intervall samt ”en minut” och ”sista minuten”. Redaktionell granskning krävs också: validatorn förstår inte alla möjliga språkliga formuleringar. Publicera exakt de validerade filerna.
