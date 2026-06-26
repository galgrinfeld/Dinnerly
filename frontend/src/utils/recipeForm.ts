import { RecipeCreateRequest } from "../types/api";
import { RecipeFormState } from "../types/recipe";

export interface RecipeFormValidationResult {
  valid: boolean;
  error: string | null;
}

export function validateRecipeForm(formState: RecipeFormState): RecipeFormValidationResult {
  if (!formState.name.trim()) {
    return { valid: false, error: "Recipe name is required" };
  }

  const ingredientsWithNames = formState.ingredients.filter((ing) => ing.name.trim());
  if (ingredientsWithNames.length === 0) {
    return { valid: false, error: "At least one ingredient with a name is required" };
  }

  for (const ing of ingredientsWithNames) {
    if (ing.unit !== "to_taste") {
      const qty = parseFloat(ing.quantity);
      if (!ing.quantity || isNaN(qty) || qty <= 0) {
        return {
          valid: false,
          error: `Ingredient "${ing.name}" requires a positive quantity (unit: ${ing.unit})`,
        };
      }
    }
  }

  return { valid: true, error: null };
}

export function toRecipePayload(formState: RecipeFormState): RecipeCreateRequest {
  return {
    name: formState.name,
    description: formState.description,
    baseServings: formState.baseServings,
    instructionsHtml: formState.instructions,
    imageUrl: formState.imageUrl?.trim() || null,
    cookingTimeMinutes: formState.cookingTimeMinutes ?? null,
    ingredients: formState.ingredients
      .filter((ing) => ing.name.trim())
      .map((ing) => ({
        name: ing.name,
        quantity: ing.unit === "to_taste" ? null : parseFloat(ing.quantity),
        unit: ing.unit,
        note: ing.note,
        optional: ing.optional,
      })),
  };
}
