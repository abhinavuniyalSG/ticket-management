import type { PaginationMeta } from "../types/api";

export function makePagination(overrides: Partial<PaginationMeta> = {}): PaginationMeta {
  return {
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
    ...overrides,
  };
}
