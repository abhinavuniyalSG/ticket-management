import { apiRequest } from "./apiClient";
import type { User, UpdateUserPayload } from "../types/user";
import type { AddContactPayload, Contact, UpdateContactPayload } from "../types/contact";

interface UserListResponse {
  message: string;
  users: User[];
}

interface UserResponse {
  message: string;
  user: User;
}

interface ContactResponse {
  message: string;
  contact: Contact;
}

interface MessageResponse {
  message: string;
}

export const userService = {
  list: () => apiRequest<UserListResponse>("/users"),

  getById: (id: string) => apiRequest<UserResponse>(`/users/${id}`),

  update: (id: string, payload: UpdateUserPayload) =>
    apiRequest<UserResponse>(`/users/${id}`, { method: "PATCH", body: payload }),

  remove: (id: string) =>
    apiRequest<MessageResponse>(`/users/${id}`, { method: "DELETE" }),

  addContact: (payload: AddContactPayload) =>
    apiRequest<ContactResponse>("/users/contacts", { method: "POST", body: payload }),

  updateContact: (contactId: string, payload: UpdateContactPayload) =>
    apiRequest<ContactResponse>(`/users/contacts/${contactId}`, {
      method: "PATCH",
      body: payload,
    }),

  removeContact: (contactId: string) =>
    apiRequest<MessageResponse>(`/users/contacts/${contactId}`, { method: "DELETE" }),
};
