export type IngredientUnit =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "tsp"
  | "tbsp"
  | "cup"
  | "unit"
  | "slice"
  | "to_taste";

export type IngredientRow = {
  id: string;
  name: string;
  quantity: string;
  unit: IngredientUnit;
  note: string;
  optional: boolean;
};

export type RecipeFormState = {
  name: string;
  description: string;
  baseServings: number;
  imageUrl?: string | null;
  cookingTimeMinutes?: number | null;
  isPublic: boolean;
  ingredients: IngredientRow[];
  instructions: string;
};

export function createEmptyIngredientRow(): IngredientRow {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  return {
    id,
    name: "",
    quantity: "",
    unit: "unit",
    note: "",
    optional: false,
  };
}
