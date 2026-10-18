# Visuella steg-timers, version 1

App 1.6.0. En timer och illustrationsknappar delar en rad under stegtexten och kan radbrytas om utrymmet tar slut. Steg utan tidsmetadata får inga timerreglage. Varje timer startas manuellt. Tider påverkas inte av portionsskalning.

Från app 1.6.3 visas illustrationsknapparnas text även på mobil. Längre texter kan brytas inom den 44 px höga knappen för att ge plats bredvid timern. Hela knappen flyttas till nästa rad om utrymmet inte räcker.

Obligatorisk `timers.json` vid ny publicering och receptuppdatering (standard v10), bredvid recipe.md. Om stegen saknar uttryckliga tider används `{"version":1,"timers":[]}`:

```json
{"version":1,"timers":[{"id":"sjud","step":3,"label":"Sjud soppan","seconds":2400,"note":"Kontrollera efter 40 min; receptet anger 40–50 min."}]}
```

ID är stabilt och unikt inom receptet: bokstav följd av små bokstäver, siffror eller bindestreck, max 64 tecken. Steg är 1-baserat. Seconds är heltal 10–86400. Label är 1–100 tecken och note är valfri, max 200 tecken. Manifest max 100 KB. Servern och den fristående receptvalidatorn avvisar felaktiga manifest. Äldre recept utan fil är oförändrade.

Märk upp tider manuellt. Intervall föreslår nedre gränsen som kontrolltid; visa hela intervallet i note. Flera faser i samma steg får separata timers med tydlig label/note, inte en automatisk kedja. Tider utan tydlig siffra, som ”någon minut”, lämnas omärkta. Ingen automatisk tolkning av temperaturer eller totalrecepttid.

Från app 1.6.1 ändrar plus/minus 10 sekunder upp till 2 minuter, 30 sekunder upp till 5 minuter och hela minuter därefter. Vid exakt 2:00 ger minus 1:50 och plus 2:30; vid 5:00 ger minus 4:30 och plus 6:00. Justering stannar vid nästa intervallgräns även om nedräkningen ligger mellan jämna steg. Minimum 10 sekunder vid justering, maximum 24 timmar. Justering under gång utgår från aktuell återstående tid. Paus fryser tiden. Avbryt/Återställ går till grundtiden. En utgången timer måste återställas innan en ny start och visar ”Tiden är ute”.

Lokal lagring nycklas med recept-ID, stabilt timer-ID och grundtid. Start sparar absolut sluttid. Status överlever receptbyte/omladdning i samma webbläsare och räknar ikapp vid återöppning. Ändrad grundtid skapar en ny lagringsnyckel. Korrupt lagring ignoreras. Om lokal lagring blockeras fungerar timern i den öppna sidan och visar att den inte kan sparas. Olika enheter synkroniseras inte. Flikar på samma origin uppdateras via storage-event men samtidiga klick har vanlig last-write-wins-semantik.

Ingen ljudkod, notifiering, Spotify-styrning, HA-timerbackend eller utökad HA-behörighet ingår. Ingen garanti om visning när webbläsaren är stängd eller sover: vyn visar rätt återstående/utgången tid när den öppnas. Ljud och säker Spotify-återupptagning är separat framtida arbete. Den tidigare HA-larmpiloten är avstängd.

Utrullning 2026-10-18: samtliga 14 recept är granskade och har totalt 47 timers. Recepttexter, mängder och bilder har behållits. ”Per sida” får två manuellt startade timers.

Skillpaket v10 och receptarkivets GitHub-kontroll kräver manifestet och kontrollerar täckning av uttryckliga stegtider. Separata tidsfaser kräver separata poster. Redaktionell granskning av steg, etikett och startpunkt krävs även när kontrollen passerar. Kontrollen körs vid varje publicering och uppdatering. Appen förblir 1.6.0; detta är receptmetadata och kräver bara receptsynkronisering.
