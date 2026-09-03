import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationController } from "./authentication.controller.js";
import { AuthenticationService } from "../services/authentication.service.js";
import { extractToken } from "../utils/auth.util.js";
import { clearAuthCookies, setAuthCookies } from "../utils/cookie.util.js";

vi.mock("../services/authentication.service.js", () => ({
  AuthenticationService: {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
  },
}));

vi.mock("../utils/auth.util.js", () => ({
  extractToken: vi.fn(),
}));

vi.mock("../utils/cookie.util.js", () => ({
  setAuthCookies: vi.fn(),
  clearAuthCookies: vi.fn(),
}));

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
}

const next = vi.fn();

async function flush() {
  await new Promise((resolve) => setImmediate(resolve));
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("registerController", () => {
  it("sets auth cookies and returns 201 without the raw tokens in the body", async () => {
    const res = makeRes();
    vi.mocked(AuthenticationService.register).mockResolvedValue({
      message: "registered",
      accessToken: "at",
      refreshToken: "rt",
      user: { id: "u1" },
    } as any);
    const req = { normalized: { body: { email: "a@example.com" } }, body: {} } as any;

    AuthenticationController.registerController(req, res, next);
    await flush();

    expect(setAuthCookies).toHaveBeenCalledWith(res, "at", "rt");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "registered", user: { id: "u1" } });
  });
});

describe("loginController", () => {
  it("sets auth cookies and returns 200 without the raw tokens in the body", async () => {
    const res = makeRes();
    vi.mocked(AuthenticationService.login).mockResolvedValue({
      message: "logged in",
      accessToken: "at",
      refreshToken: "rt",
      user: { id: "u1" },
    } as any);
    const req = { normalized: { body: { email: "a@example.com" } }, body: {} } as any;

    AuthenticationController.loginController(req, res, next);
    await flush();

    expect(setAuthCookies).toHaveBeenCalledWith(res, "at", "rt");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "logged in", user: { id: "u1" } });
  });
});

describe("refreshController", () => {
  it("responds with 400 via next() when there is no refresh token", async () => {
    const res = makeRes();
    vi.mocked(extractToken).mockReturnValue(undefined);
    const req = {} as any;

    AuthenticationController.refreshController(req, res, next);
    await flush();

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(AuthenticationService.refresh).not.toHaveBeenCalled();
  });

  it("sets new auth cookies and returns 200 when the refresh token is valid", async () => {
    const res = makeRes();
    vi.mocked(extractToken).mockReturnValue("refresh-token");
    vi.mocked(AuthenticationService.refresh).mockResolvedValue({ accessToken: "at2", refreshToken: "rt2" });
    const req = {} as any;

    AuthenticationController.refreshController(req, res, next);
    await flush();

    expect(AuthenticationService.refresh).toHaveBeenCalledWith("refresh-token");
    expect(setAuthCookies).toHaveBeenCalledWith(res, "at2", "rt2");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("logoutController", () => {
  it("returns 401 when there is no authenticated user", async () => {
    const res = makeRes();
    const req = { user: undefined } as any;

    AuthenticationController.logoutController(req, res, next);
    await flush();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(AuthenticationService.logout).not.toHaveBeenCalled();
  });

  it("clears auth cookies and returns 200 for an authenticated user", async () => {
    const res = makeRes();
    vi.mocked(AuthenticationService.logout).mockResolvedValue({ message: "logged out" });
    const req = { user: { id: "u1", email: "a@example.com", role: "user" } } as any;

    AuthenticationController.logoutController(req, res, next);
    await flush();

    expect(AuthenticationService.logout).toHaveBeenCalledWith("u1");
    expect(clearAuthCookies).toHaveBeenCalledWith(res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("changePasswordController", () => {
  it("passes the body through and returns 200", async () => {
    const res = makeRes();
    const body = { email: "a@example.com", oldPassword: "old", newPassword: "New1!" };
    vi.mocked(AuthenticationService.changePassword).mockResolvedValue({ message: "changed" });
    const req = { normalized: { body }, body: {} } as any;

    AuthenticationController.changePasswordController(req, res, next);
    await flush();

    expect(AuthenticationService.changePassword).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("verifyEmailController", () => {
  it("reads the token param and returns 200", async () => {
    const res = makeRes();
    vi.mocked(AuthenticationService.verifyEmail).mockResolvedValue({ message: "verified" });
    const req = { normalized: { params: { token: "tok" } }, params: {} } as any;

    AuthenticationController.verifyEmailController(req, res, next);
    await flush();

    expect(AuthenticationService.verifyEmail).toHaveBeenCalledWith("tok");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("resendVerificationController", () => {
  it("reads the email from the body and returns 200", async () => {
    const res = makeRes();
    vi.mocked(AuthenticationService.resendVerification).mockResolvedValue({ message: "sent" });
    const req = { normalized: { body: { email: "a@example.com" } }, body: {} } as any;

    AuthenticationController.resendVerificationController(req, res, next);
    await flush();

    expect(AuthenticationService.resendVerification).toHaveBeenCalledWith("a@example.com");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
