import { apiRequest } from "./apiClient";
import type {
  CreateTicketPayload,
  Ticket,
  TicketQueryParams,
  UpdateTicketPayload,
} from "../types/ticket";

interface TicketListResponse {
  message: string;
  tickets: Ticket[];
}

interface TicketResponse {
  message: string;
  ticket: Ticket;
}

interface MessageResponse {
  message: string;
}

function toQuery(params: TicketQueryParams): Record<string, string | undefined> {
  return {
    status: params.status,
    priority: params.priority,
    departmentId: params.departmentId,
    assignedToId: params.assignedToId,
    createdById: params.createdById,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  };
}

export const ticketService = {
  list: (params: TicketQueryParams = {}) =>
    apiRequest<TicketListResponse>("/tickets", { query: toQuery(params) }),

  getById: (id: string) => apiRequest<TicketResponse>(`/tickets/${id}`),

  create: (payload: CreateTicketPayload) =>
    apiRequest<TicketResponse>("/tickets", { method: "POST", body: payload }),

  update: (id: string, payload: UpdateTicketPayload) =>
    apiRequest<TicketResponse>(`/tickets/${id}`, { method: "PATCH", body: payload }),

  remove: (id: string) =>
    apiRequest<MessageResponse>(`/tickets/${id}`, { method: "DELETE" }),
};
