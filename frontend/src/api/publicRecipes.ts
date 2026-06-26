import { apiFetch } from "./http";
import { RecipeListItem, RecipeRead, SimilarRecipeItem } from "../types/api";

export async function listPublicRecipes(): Promise<RecipeListItem[]> {
  return apiFetch<RecipeListItem[]>("/api/public-recipes");
}

export async function getPublicRecipe(recipeId: number): Promise<RecipeRead> {
  return apiFetch<RecipeRead>(`/api/public-recipes/${recipeId}`);
}

export async function savePublicRecipe(recipeId: number): Promise<RecipeRead> {
  return apiFetch<RecipeRead>(`/api/public-recipes/${recipeId}/save`, {
    method: "POST",
  });
}

export async function getSimilarPublicRecipes(
  recipeId: number,
  limit = 4
): Promise<SimilarRecipeItem[]> {
  return apiFetch<SimilarRecipeItem[]>(
    `/api/public-recipes/${recipeId}/similar?limit=${limit}`
  );
}
