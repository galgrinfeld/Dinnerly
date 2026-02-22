/**
 * Recipe API functions.
 */
import { apiFetch } from "./http";
import { RecipeCreateRequest, RecipeRead, RecipeListItem, RecipeUpdateRequest } from "../types/api";

export async function createRecipe(payload: RecipeCreateRequest): Promise<RecipeRead> {
  return apiFetch<RecipeRead>("/api/recipes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listRecipes(): Promise<RecipeListItem[]> {
  return apiFetch<RecipeListItem[]>("/api/recipes");
}

export async function getRecipe(recipeId: number): Promise<RecipeRead> {
  return apiFetch<RecipeRead>(`/api/recipes/${recipeId}`);
}

export async function updateRecipe(
  recipeId: number,
  payload: RecipeUpdateRequest
): Promise<RecipeRead> {
  return apiFetch<RecipeRead>(`/api/recipes/${recipeId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteRecipe(recipeId: number): Promise<void> {
  return apiFetch<void>(`/api/recipes/${recipeId}`, {
    method: "DELETE",
  });
}
