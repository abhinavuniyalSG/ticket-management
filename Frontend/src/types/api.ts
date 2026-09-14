export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly errors?: string[];
  /** True when this error is the session having expired (a 401 that survived
   * a refresh attempt). AuthProvider already shows a single global "please
   * sign in again" toast for that case, so callers should skip showing their
   * own error toast for it rather than stacking a second, redundant one. */
  public readonly isSessionExpired: boolean;

  constructor(
    status: number,
    message: string,
    errors?: string[],
    isSessionExpired = false,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.isSessionExpired = isSessionExpired;
  }
}
