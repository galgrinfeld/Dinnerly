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

// Friend types
export interface FriendRequestRead {
  id: number;
  senderUserId: number;
  receiverUserId: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
  sender?: UserRead;
  receiver?: UserRead;
}

export interface FriendRequestResponse {
  message: string;
  request?: FriendRequestRead;
}

export interface FriendsListResponse {
  friends: UserRead[];
  count: number;
}

export interface UserProfileRead {
  id: number;
  email: string;
  displayName?: string;
  friendshipStatus: "friend" | "pending" | "blocked" | "none";
  sharedEventCount: number;
  isCurrentUser?: boolean;
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
  userId?: number;
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
  cookingTimeMinutes?: number | null;
  ingredients: RecipeIngredient[];
}

export interface RecipeRead {
  id: number;
  name: string;
  description: string;
  baseServings: number;
  instructionsHtml?: string;
  cookingTimeMinutes?: number | null;
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
  cookingTimeMinutes?: number | null;
  instructionsHtml?: string;
  imageUrl?: string | null;
  ingredients: RecipeIngredient[];
}

export interface RecipeListItem {
  id: number;
  name: string;
  baseServings: number;
  cookingTimeMinutes?: number | null;
  description?: string;
  imageUrl?: string | null;
}

// Event types
export interface EventCreateRequest {
  name: string;
  eventDate: string; // ISO date format (YYYY-MM-DD)
  targetServings: number;
}

export interface EventUpdateRequest {
  name: string;
  eventDate: string; // ISO date format (YYYY-MM-DD)
  targetServings: number;
}

export interface EventRecipeAttach {
  recipeId: number;
  desiredServings: number;
}

export interface EventRecipeRead {
  recipeId: number;
  recipeName: string;
  baseServings: number;
  desiredServings: number;
}

export interface EventRead {
  id: number;
  name: string;
  eventDate: string; // ISO date format (YYYY-MM-DD)
  targetServings: number;
  recipes?: EventRecipeRead[];
  members?: EventMemberRead[];
  createdAt?: string; // ISO datetime format
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
  assignedMemberId?: number;
  assignedMemberEmail?: string;
}

export interface ShoppingListResponse {
  items: ShoppingListItem[];
}

// Notification types
export interface NotificationRead {
  id: number;
  userId: number;
  type: "friend_request_received" | "friend_request_accepted" | "event_member_added" | "recipe_attached";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO datetime format
  relatedEventId?: number | null;
  relatedRecipeId?: number | null;
  relatedUserId?: number | null;
}

export interface UnreadCountResponse {
  count: number;
}
