/**
 * Event API functions.
 */
import { apiFetch } from "./http";
import {
  EventCreateRequest,
  EventRead,
  EventRecipeAttach,
  ShoppingListResponse,
} from "../types/api";

export async function createEvent(payload: EventCreateRequest): Promise<EventRead> {
  return apiFetch<EventRead>("/api/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listEvents(): Promise<EventRead[]> {
  return apiFetch<EventRead[]>("/api/events");
}

export async function getEvent(eventId: number): Promise<EventRead> {
  return apiFetch<EventRead>(`/api/events/${eventId}`);
}

export async function attachRecipe(
  eventId: number,
  payload: EventRecipeAttach
): Promise<EventRead> {
  return apiFetch<EventRead>(`/api/events/${eventId}/recipes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getShoppingList(eventId: number): Promise<ShoppingListResponse> {
  return apiFetch<ShoppingListResponse>(`/api/events/${eventId}/shopping-list`);
}
