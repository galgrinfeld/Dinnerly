/**
 * Event API functions.
 */
import { apiFetch } from "./http";
import {
  EventCreateRequest,
  EventUpdateRequest,
  EventRead,
  EventRecipeAttach,
  ShoppingListResponse,
  EventMemberRead,
  ParticipantAddRequest,
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

export async function updateEvent(
  eventId: number,
  payload: EventUpdateRequest
): Promise<EventRead> {
  return apiFetch<EventRead>(`/api/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteEvent(eventId: number): Promise<void> {
  return apiFetch<void>(`/api/events/${eventId}`, {
    method: "DELETE",
  });
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

// Participant functions
export async function listParticipants(eventId: number): Promise<EventMemberRead[]> {
  return apiFetch<EventMemberRead[]>(`/api/events/${eventId}/participants`);
}

export async function addParticipant(
  eventId: number,
  payload: ParticipantAddRequest
): Promise<EventMemberRead> {
  return apiFetch<EventMemberRead>(`/api/events/${eventId}/participants`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function removeParticipant(eventId: number, memberId: number): Promise<void> {
  return apiFetch<void>(`/api/events/${eventId}/participants/${memberId}`, {
    method: "DELETE",
  });
}

// Ingredient assignment functions
export async function assignIngredient(
  eventId: number,
  ingredientId: number,
  eventMemberId: number
): Promise<{ status: string; assignment_id: number }> {
  return apiFetch<{ status: string; assignment_id: number }>(
    `/api/events/${eventId}/ingredients/${ingredientId}/assign`,
    {
      method: "POST",
      body: JSON.stringify({ eventMemberId }),
    }
  );
}

export async function unassignIngredient(
  eventId: number,
  ingredientId: number
): Promise<void> {
  return apiFetch<void>(
    `/api/events/${eventId}/ingredients/${ingredientId}/assign`,
    {
      method: "DELETE",
    }
  );
}
