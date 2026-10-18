type WordForms = string | { one: string; other: string };
export type QuantityManifest = { version: 1; quantities: { id: string; amount: number | [number, number]; unit?: WordForms; name: WordForms }[] };
export function validateQuantityReferences(manifest: unknown, ingredientText: string, stepText: string): string[];
export function renderQuantityText(text: string, manifest?: QuantityManifest, factor?: number): string;
export function formatQuantityNumber(value: number): string;
export function portionNotice(servings: number, original: number, shared: boolean): string;
