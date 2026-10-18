# Godkända receptfiler – skillpaket v12

Endast vanliga filer direkt i receptmappen tillåts:

- `recipe.md`.
- Exakt en vald huvudbild: `hero.webp` eller `hero.avif`, samma namn som `hero_image`.
- `quantities.json`, `timers.json`, `illustrations.json` enligt respektive befintligt kontrakt. Timerfil krävs vid publicering; mängdfil krävs för mängdreferenser och illustrationsmanifest för stegbilder.
- `step-NN-action-XX.webp` / `.avif`, motsvarande `result` och `detail`, endast när filen är refererad i `illustrations.json`. NN/XX har minst två siffror och steg/typ ska stämma.

Inga okända filer, underkataloger, länkar, extra huvudbilder eller orefererade stegbilder. Även extra Markdown/JSON, HTML, JavaScript, SVG, PNG/JPEG-original, ZIP, PDF, arbetsfiler och granskningsunderlag avvisas. Förvara sådant utanför det publicerade paketet. Ta aldrig tyst bort filer ur ett befintligt recept för att få det att passera; redovisa avvikelsen.

Textfiler ska vara giltig UTF-8, JSON ska kunna tolkas och bilder ska ha formatbytes som stämmer med filnamnet. En filändelse eller en platshållare är inte en bild. Exemplet i assets innehåller avsiktligt en platshållare som måste ersättas före validering/publicering. Befintliga storleksgränser och identitetsregler gäller fortsatt.

Kör `node scripts/validate-recipe.mjs <receptmapp>`. Filgränsen kontrolleras före övrig inläsning. Publiceringsskriptet anropar samma validator; publicera exakt det godkända paketet.

Skillpaket v12 kontrollerar paketet före publicering. Från app 1.6.4 kontrolleras samma filgräns även på servern före import, och bildfunktionen lämnar bara ut vald huvudbild och refererade stegbilder. Huvudbilden följer `hero_image` och kan vara WebP eller AVIF. Green 1.6.3 och äldre kräver fortfarande hero.webp vid import. Äldre recept utan mängdreferenser får fortsatt sakna quantities.json; äldre recept utan timerfil fungerar också i runtime.

Alla inkommande paket kontrolleras före ersättning av något befintligt recept. Ett paket som underkänns vid validering lämnar tidigare recept och synkrevision oförändrade. Detta är inte en garanti om en fullständig transaktion vid exempelvis diskfel mitt under installationen.
