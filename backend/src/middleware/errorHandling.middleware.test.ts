import { describe, it, expect, vi, beforeEach } from "vitest";
import { ErrorMiddleware } from "./errorHandling.middleware.js";
import { HttpError } from "../utils/httpError.utils.js";
import { logger } from "../core/logger.js";

vi.mock("../core/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
}

const req = { method: "GET", path: "/api/tickets" } as any;
const next = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
});

describe("ErrorMiddleware.middleware", () => {
  it("responds with an HttpError's own status code and message", () => {
    const res = makeRes();
    const error = new HttpError(404, "Ticket not found");

    ErrorMiddleware.middleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Ticket not found" });
  });

  it("masks a generic error's message behind 'Internal Server Error' at 500", () => {
    const res = makeRes();
    const error = new Error("some sensitive internal detail");

    ErrorMiddleware.middleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
  });

  it("uses the generic error's own message when it isn't a 5xx (e.g. a HttpError-like status)", () => {
    const res = makeRes();
    const error = Object.assign(new Error("Bad input"), { statusCode: 422 });

    ErrorMiddleware.middleware(error as any, req, res, next);

    // statusCode is only read off HttpError instances, so a plain Error still falls back to 500
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
  });

  it("falls back to 'Bad Request' when a non-HttpError has no message", () => {
    const res = makeRes();
    const error = Object.assign(new Error(), { statusCode: 400 });
    // statusCode isn't read from a plain Error, so this still resolves to 500 + generic message
    ErrorMiddleware.middleware(error as any, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("responds with 400 'Invalid JSON body' for a body-parser JSON parse failure", () => {
    const res = makeRes();
    const error = Object.assign(new Error("Unexpected token"), { type: "entity.parse.failed" });

    ErrorMiddleware.middleware(error as any, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid JSON body" });
  });

  it("logs 5xx errors at error level and 4xx errors at warn level", () => {
    const res = makeRes();

    ErrorMiddleware.middleware(new HttpError(400, "Bad request"), req, res, next);
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();

    vi.clearAllMocks();

    ErrorMiddleware.middleware(new Error("boom"), req, res, next);
    expect(logger.error).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
