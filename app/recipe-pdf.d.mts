export type PrintableRecipe = {
  id: string;
  title: string;
  subtitle: string;
  swedishTitle: string;
  description: string;
  totalLabel: string;
  active: number;
  servings: number;
  displayServings: number;
  kcal: number;
  occasion: string;
  macros: { kcal: number; protein: number; carbs: number; fat: number; fiber: number };
  ingredients: { heading: string; items: string[] }[];
  steps: { title: string; items: string[] }[];
  tips: string[];
  sommelier?: string;
  storage?: string;
  allergens?: string[];
  why: string[];
};

export function buildRecipePdfBytes(recipe: PrintableRecipe): Uint8Array;
export function buildPrintableHtml(recipe: PrintableRecipe): string;
