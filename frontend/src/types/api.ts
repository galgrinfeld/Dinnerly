/**
 * API types for recipes, events, and authentication.
 */

// Auth types
export interface UserRead {
  id: number;
  email: string;
  displayName?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserRead;
  accessToken: string;
}

// Participant types
export interface ParticipantAddRequest {
  email: string;
}

export interface EventMemberRead {
  id: number;
  email: string;
  role: "owner" | "participant";
  status: "active" | "invited";
}

// Recipe types
export interface RecipeIngredient {
  name: string;
  quantity: number | null;
  unit: string;
  note?: string;
  optional?: boolean;
  id?: number;
  ingredientId?: number;
}

export interface RecipeCreateRequest {
  name: string;
  description?: string;
  baseServings: number;
  instructionsHtml?: string;
  imageUrl?: string | null;
  ingredients: RecipeIngredient[];
}

export interface RecipeRead {
  id: number;
  name: string;
  description: string;
  baseServings: number;
  instructionsHtml?: string;
  imageUrl?: string | null;
  ingredients: Array<{
    id: number;
    ingredientId: number;
    ingredientName: string;
    quantity: number | null;
    unit: string;
    note: string;
    optional: boolean;
  }>;
}

export interface RecipeUpdateRequest {
  name: string;
  description?: string;
  baseServings: number;
  instructionsHtml?: string;
  imageUrl?: string | null;
  ingredients: RecipeIngredient[];
}

export interface RecipeListItem {
  id: number;
  name: string;
  baseServings: number;
  description?: string;
}

// Event types
export interface EventCreateRequest {
  name: string;
  targetServings: number;
}

export interface EventUpdateRequest {
  name: string;
  targetServings: number;
}

export interface EventRecipeAttach {
  recipeId: number;
  desiredServings: number;
}

export interface EventRecipeRead {
  recipeId: number;
  desiredServings: number;
}

export interface EventRead {
  id: number;
  name: string;
  targetServings: number;
  recipes?: EventRecipeRead[];
  members?: EventMemberRead[];
}

// Shopping list types
export interface ShoppingListSource {
  recipeId: number;
  recipeName: string;
  originalQuantity: number | null;
  scaledQuantity: number | null;
  scaleFactor: number;
  desiredServings: number;
  baseServings: number;
}

export interface ShoppingListItem {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  quantity: number | null;
  optional: boolean;
  sources: ShoppingListSource[];
}

export interface ShoppingListResponse {
  items: ShoppingListItem[];
}
