# Gemensamma receptmängder

Version 1.0 — 2026-10-18. Kräver app 1.5.0 eller senare och receptskill v8.
Bakåtkompatibelt tillägg till `schema_version: 1`; receptidentiteten ändras inte.

## En källa för varje mängd

Lägg `quantities.json` bredvid `recipe.md`. Mängderna avser hela grundreceptet
för det antal portioner som anges i `servings`. Exempel:

```json
{
  "version": 1,
  "quantities": [
    {"id": "vatten", "amount": 6.5, "unit": "dl", "name": "vatten"},
    {"id": "lok", "amount": 2, "name": {"one": "gul lök", "other": "gula lökar"}},
    {"id": "olja", "amount": [10, 15], "unit": "g", "name": "olivolja"}
  ]
}
```

I Markdown används samma referens i lista och instruktion:

```markdown
## Ingredienser
### Gryta
- {{q:vatten}}
- {{q:lok}}, tunt skivad
- {{q:olja}}

## Gör så här
1. **Förbered.** Tillsätt {{q:vatten}} och låt sjuda i 20 minuter.
```

`{{q:vatten}}` visar mängd, enhet och råvara. `{{q:vatten:amount}}` visar bara
mängd och enhet, till exempel när råvaran behöver en annan grammatisk form.
`{{q:olja*0.5}}` anger halva mängden; `{{q:olja*0.5:amount}}` kombinerar formerna.
Andelen ska vara större än noll och högst ett. Talen skrivs med decimalpunkt i JSON
och referenser, men visas med svensk decimal och exakta vanliga bråk.

ID:n är unika och matchar `[a-z][a-z0-9-]*`. `amount` är ett positivt ändligt tal
eller två positiva tal i stigande ordning. `name` krävs. `unit` är valfri. Båda är
antingen en fast sträng eller ett objekt med `one` och `other`. `one` används för
mängder upp till och med ett, inklusive bråk; för intervall måste båda ändpunkter
vara högst ett. Använd fasta förkortningar som g, ml, dl, tsk och msk.

Skriv adjektiv som behöver böjas i ordformerna, exempelvis `liten gul lök` och
`små gula lökar`. Skriv om omgivande text så att den fungerar vid portionsbyte.
Ingen allmän grammatisk omskrivning görs. Använd separat ID per delrecept när
samma råvara förekommer flera gånger. Alternativa vikter och volymer får egna ID:n
och granskas tillsammans med huvudmåttet; enhetsomvandling gissas inte.

Alla kända numeriska ingrediensmängder i ett konverterat recept använder referenser.
Varje ID måste förekomma i ingredienslistan. Fri text som salt efter smak är tillåten.
Referenser är bara tillåtna i ingrediensrader och numrerade steg, inklusive stegrubriker.
Ingen mallkod, HTML eller godtycklig beräkning exekveras. Filen får vara högst 100 KB.
Saknade filer, fel version, felaktiga referenser, duplicerade ID:n och ogiltiga värden
stoppar publiceringsvalideringen och serverns synkinläsning.

## Vad som skalas

Endast mängdreferenser skalas i instruktionerna. Tider, temperaturer, procent,
bitstorlekar, fasta vikter per styck och all annan löptext är oförändrade. Skriv
exempelvis en förpackningsvikt efter `à` som vanlig text om den är konstant.
Råvaruvikt för hela receptet och antal förpackningar behöver då separata referenser.

Antal skålar, scones, köttbullar, bitar och serveringar räknas inte om. När
portionsantalet avviker från grundreceptet visas:

> Ingrediensmängderna är anpassade till valt portionsantal. Angivna antal bakverk,
> bitar och serveringskärl gäller grundreceptet för X portioner och kan behöva anpassas.

Notisen visas inte vid grundportionerna. Äldre recept utan mängdfil behåller
textskalning endast i ingredienslistan. Deras notis förklarar även att mängderna
i instruktionerna gäller grundreceptet. Tider och makron per portion ändras aldrig.
Skalning sker från grunddata vid varje visning och sparas inte i recept eller databas.

## Konvertering och leveransordning

1. Hämta hela baspaketet och spara revision och filhashar. Behåll identitet och bilder.
2. Flytta kända mängder till filen och ersätt dem med referenser. Ändra inte råmängder,
   näringsvärden, tider eller metod. Granska uppdelade mängder, alternativ och antal.
3. Uppdatera `updated_at`. Kör validatorn och `verify-recipe-update.mjs`.
4. Jämför renderat grundrecept med basen och kontrollera 1, grundantal, dubbelt och
   20 portioner. Kontrollera notisen, ordformer, återställning och oförändrade tider.
5. Visa receptdiffen för separat publiceringsgodkännande.

Installera och verifiera app 1.5.0 före recept med referenser: äldre appar känner
inte till syntaxen och kan visa råa referenser. Uppdatera därefter de två godkända
piloterna. Övriga recept behöver ingen massmigration. Vid återgång ska pilotreceptens
tidigare revision återställas före nedgradering av appen. SQLite berörs inte.

Skillpaketet byggs med `python scripts/package-recipe-skill.py`; det synkroniserar
validatorns fristående modul med appens kontrakt och skapar v8. Den installerade
ChatGPT-skillen ersätts separat med `skill-packages/create-le-carnet-recipe-v8.zip`.
