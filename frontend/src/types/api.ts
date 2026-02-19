/**
 * API types for recipes and events.
 */

export interface RecipeIngredient {
  name: string;
  quantity: number | null;
  unit: string;
  note?: string;
  optional?: boolean;
}

export interface RecipeCreateRequest {
  name: string;
  description?: string;
  baseServings: number;
  instructionsHtml?: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeRead {
  id: number;
  name: string;
  description: string;
  baseServings: number;
  instructionsHtml: string;
}

export interface RecipeListItem {
  id: number;
  name: string;
  baseServings: number;
  description?: string;
}

export interface EventCreateRequest {
  name: string;
  targetServings: number;
}

export interface EventRead {
  id: number;
  name: string;
  targetServings: number;
}
