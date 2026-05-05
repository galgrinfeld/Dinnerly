/**
 * Ingredients API functions.
 */
import { apiFetch } from "./http";

export interface IngredientOption {
  id: number;
  name: string;
}

export async function searchIngredients(query: string): Promise<IngredientOption[]> {
  return apiFetch<IngredientOption[]>(`/api/ingredients?q=${encodeURIComponent(query)}`);
}

export async function getAllIngredients(): Promise<IngredientOption[]> {
  return apiFetch<IngredientOption[]>("/api/ingredients");
}
