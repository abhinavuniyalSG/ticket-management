import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { requestValidator } from "./requestValidator.middleware.js";

vi.mock("../core/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
}

const next = vi.fn();
const schema = z.object({ title: z.string().min(3) });

beforeEach(() => {
  vi.resetAllMocks();
});

describe("requestValidator.validate", () => {
  it("normalizes a valid body and calls next()", () => {
    const res = makeRes();
    const req = { method: "POST", path: "/api/tickets", body: { title: "Valid title" } } as any;

    requestValidator.validate("body", schema)(req, res, next);

    expect(req.normalized?.body).toEqual({ title: "Valid title" });
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("responds with 400 and the validation error messages for an invalid body", () => {
    const res = makeRes();
    const req = { method: "POST", path: "/api/tickets", body: { title: "no" } } as any;

    requestValidator.validate("body", schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Validation failed", errors: expect.any(Array) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("validates req.params when type is 'params'", () => {
    const res = makeRes();
    const paramsSchema = z.object({ id: z.string().min(1) });
    const req = { method: "GET", path: "/api/tickets/1", params: { id: "t1" } } as any;

    requestValidator.validate("params", paramsSchema)(req, res, next);

    expect(req.normalized?.params).toEqual({ id: "t1" });
    expect(next).toHaveBeenCalledWith();
  });

  it("validates req.query when type is 'query'", () => {
    const res = makeRes();
    const querySchema = z.object({ status: z.string().optional() });
    const req = { method: "GET", path: "/api/tickets", query: { status: "open" } } as any;

    requestValidator.validate("query", querySchema)(req, res, next);

    expect(req.normalized?.query).toEqual({ status: "open" });
    expect(next).toHaveBeenCalledWith();
  });

  it("preserves previously normalized fields when validating a different type", () => {
    const res = makeRes();
    const req = {
      method: "PATCH",
      path: "/api/tickets/1",
      params: { id: "t1" },
      body: { title: "Valid title" },
      normalized: { params: { id: "t1" } },
    } as any;

    requestValidator.validate("body", schema)(req, res, next);

    expect(req.normalized).toEqual({ params: { id: "t1" }, body: { title: "Valid title" } });
  });
});
