import { describe, it, expect, vi, beforeEach } from "vitest";
import { authMiddleware } from "./authentication.middleware.js";
import { extractToken, verifyToken } from "../utils/auth.util.js";
import { HttpError } from "../utils/httpError.utils.js";

vi.mock("../utils/auth.util.js", () => ({
  extractToken: vi.fn(),
  verifyToken: vi.fn(),
}));

const next = vi.fn();
const res = {} as any;

beforeEach(() => {
  vi.resetAllMocks();
});

describe("authMiddleware", () => {
  it("rejects with 401 when no token is present", () => {
    vi.mocked(extractToken).mockReturnValue(undefined);
    const req = { headers: {}, cookies: {} } as any;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it("rejects with 401 when the decoded payload is missing required fields", () => {
    vi.mocked(extractToken).mockReturnValue("a-token");
    vi.mocked(verifyToken).mockReturnValue({ id: "u1", email: "a@example.com" } as any); // no role, no typ

    const req = { headers: {}, cookies: {} } as any;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it("rejects with 401 when the token type isn't 'access'", () => {
    vi.mocked(extractToken).mockReturnValue("a-token");
    vi.mocked(verifyToken).mockReturnValue({
      id: "u1",
      email: "a@example.com",
      role: "user",
      typ: "refresh",
    } as any);

    const req = { headers: {}, cookies: {} } as any;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it("attaches the decoded user to the request and calls next() with no error on success", () => {
    vi.mocked(extractToken).mockReturnValue("a-token");
    vi.mocked(verifyToken).mockReturnValue({
      id: "u1",
      email: "a@example.com",
      role: "user",
      typ: "access",
    } as any);

    const req = { headers: {}, cookies: {} } as any;

    authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: "u1", email: "a@example.com", role: "user", typ: "access" });
    expect(next).toHaveBeenCalledWith();
  });

  it("passes an HttpError thrown by verifyToken straight through to next()", () => {
    vi.mocked(extractToken).mockReturnValue("expired-token");
    vi.mocked(verifyToken).mockImplementation(() => {
      throw new HttpError(401, "Token has expired");
    });

    const req = { headers: {}, cookies: {} } as any;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: "Token has expired" }));
  });

  it("wraps an unexpected error into a generic 500", () => {
    vi.mocked(extractToken).mockReturnValue("a-token");
    vi.mocked(verifyToken).mockImplementation(() => {
      throw new Error("unexpected");
    });

    const req = { headers: {}, cookies: {} } as any;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
  });
});
