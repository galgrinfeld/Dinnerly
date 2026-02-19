/**
 * Event API functions.
 */
import { apiFetch } from "./http";
import { EventCreateRequest, EventRead } from "../types/api";

export async function createEvent(payload: EventCreateRequest): Promise<EventRead> {
  return apiFetch<EventRead>("/api/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listEvents(): Promise<EventRead[]> {
  return apiFetch<EventRead[]>("/api/events");
}
