# Le Carnet – arbetsguide

Denna guide ersätter det äldre, inaktuella Smulor-flödet. Le Carnet du Nord kör som en lokal Home Assistant-app på HA Green med kod i `castiron79/le-carnet-du-nord` och recept i det privata `castiron79/le-carnet-recipes`.

Recept skapas och uppdateras genom `skills/create-le-carnet-recipe/SKILL.md`. Varje recept har `recipe.md`, Hero-bilden `hero.webp` och kan få `illustrations.json` samt `step-NN-kind-XX.webp` för en eller flera bilder vid valda instruktioner. Bilder är dolda som standard och får endast publiceras efter att ägaren sett och godkänt samtliga. Se `docs/ILLUSTRATIONS.md`, `docs/RECIPE-SPEC.md` och `docs/GITHUB-AUTOMATION.md`.

Recepten publiceras via GitHub-anslutningen, inte genom att lägga till objekt i `app/page.tsx` eller manuellt kopiera bilder till `public/images`.
