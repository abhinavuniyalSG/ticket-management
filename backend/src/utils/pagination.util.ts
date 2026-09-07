import { z } from "zod";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const paginationQuerySchema = {
  page: z.coerce
    .number({ error: "page must be a number" })
    .int("page must be an integer")
    .min(1, "page must be at least 1")
    .default(DEFAULT_PAGE),
  limit: z.coerce
    .number({ error: "limit must be a number" })
    .int("limit must be an integer")
    .min(1, "limit must be at least 1")
    .max(MAX_LIMIT, `limit must not exceed ${MAX_LIMIT}`)
    .default(DEFAULT_LIMIT),
};

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export function buildPaginationMeta(
  totalItems: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
