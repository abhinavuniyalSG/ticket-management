export class ApiError extends Error {
  public readonly status: number;
  public readonly errors?: string[];

  constructor(status: number, message: string, errors?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}
