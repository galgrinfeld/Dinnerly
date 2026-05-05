/**
 * Friends API functions.
 */
import { apiFetch } from "./http";
import {
  FriendRequestRead,
  FriendRequestResponse,
  FriendsListResponse,
} from "../types/api";

export async function sendFriendRequest(email: string): Promise<FriendRequestResponse> {
  return apiFetch<FriendRequestResponse>("/api/friends/request-by-email", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function getIncomingRequests(): Promise<FriendRequestRead[]> {
  return apiFetch<FriendRequestRead[]>("/api/friends/requests/incoming");
}

export async function getOutgoingRequests(): Promise<FriendRequestRead[]> {
  return apiFetch<FriendRequestRead[]>("/api/friends/requests/outgoing");
}

export async function acceptFriendRequest(
  requestId: number
): Promise<FriendRequestResponse> {
  return apiFetch<FriendRequestResponse>(
    `/api/friends/requests/${requestId}/accept`,
    {
      method: "POST",
    }
  );
}

export async function rejectFriendRequest(
  requestId: number
): Promise<FriendRequestResponse> {
  return apiFetch<FriendRequestResponse>(
    `/api/friends/requests/${requestId}/reject`,
    {
      method: "POST",
    }
  );
}

export async function getFriends(): Promise<FriendsListResponse> {
  return apiFetch<FriendsListResponse>("/api/friends");
}
