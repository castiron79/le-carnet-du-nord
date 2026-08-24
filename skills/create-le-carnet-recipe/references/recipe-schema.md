# Receptschema 1

Den normativa projektspecifikationen finns i `docs/RECIPE-SPEC.md`. När skillen används utanför projektet gäller följande miniminivå:

- En katalog vars kebab-case-namn matchar `slug` och `id`.
- `recipe.md` med YAML-frontmatter.
- Obligatoriska fält: `schema_version`, `id`, `slug`, `title`, `restaurant_title`, `summary`, `status`, `published_at`, `updated_at`, `servings`, `prep_minutes`, `cook_minutes`, `total_minutes`, `protein_group`, `carb_group`, `meal_type`, `tags`, `allergens`, `hero_image`, `hero_alt` och hela `nutrition`.
- Sektioner: Ingredienser, Gör så här, Serveringstips, Varför det blir så gott, Förvaring.
- `nutrition` är per portion och innehåller kcal, protein, kolhydrater, fett, fiber och metod.
- Hero ska vara WebP/AVIF och finnas i samma katalog.

## Automatiska faktarikoner

Sajten renderar fem små linjeikoner automatiskt från befintlig metadata:

- klocka från `total_minutes`;
- kokkärl/värme från `cook_minutes`;
- portioner från `servings`;
- näring från `nutrition.kcal`;
- serveringskategori från `meal_type`.

Receptpaketet ska därför inte innehålla separata ikonfiler eller ikon-URL:er. Saknade metadatafält ska rättas före publicering.

Makron beräknas från generiska värden per 100 g och råvikter. Avrunda först efter summering och division med portioner. Kontrollera kcal mot 4/4/9-formeln med cirka 15 % tolerans. Otillräckligt underlag innebär `draft`, aldrig fabricerade värden.
