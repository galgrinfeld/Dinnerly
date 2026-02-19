/**
 * Recipe API functions.
 */
import { apiFetch } from "./http";
import { RecipeCreateRequest, RecipeRead, RecipeListItem } from "../types/api";

export async function createRecipe(payload: RecipeCreateRequest): Promise<RecipeRead> {
  return apiFetch<RecipeRead>("/api/recipes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listRecipes(): Promise<RecipeListItem[]> {
  return apiFetch<RecipeListItem[]>("/api/recipes");
}
