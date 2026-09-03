import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationService } from "./authentication.service.js";
import { UserRepository } from "../database/repositry/user.repository.js";
import { EmailService } from "./email.service.js";
import * as authUtil from "../utils/auth.util.js";

vi.mock("../database/repositry/user.repository.js", () => ({
  UserRepository: {
    findByEmail: vi.fn(),
    createUser: vi.fn(),
    updateRefreshToken: vi.fn(),
    findByVerificationTokenHash: vi.fn(),
    markEmailVerified: vi.fn(),
    setVerificationToken: vi.fn(),
    findByIdWithRefreshToken: vi.fn(),
    updatePassword: vi.fn(),
  },
}));

vi.mock("./email.service.js", () => ({
  EmailService: { send: vi.fn() },
}));

vi.mock("../core/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../utils/auth.util.js", () => ({
  generateHashPassword: vi.fn().mockResolvedValue("hashed-password"),
  verifyHashPassword: vi.fn(),
  generateRandomToken: vi.fn().mockReturnValue("raw-token"),
  generateTokenHash: vi.fn().mockReturnValue("hashed-token"),
  tokenGenerator: vi.fn().mockReturnValue("a.jwt.token"),
  verifyToken: vi.fn(),
  verifyTokenHash: vi.fn(),
}));

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "jane@example.com",
    password: "hashed-password",
    firstName: "Jane",
    lastName: "Doe",
    isVerified: false,
    verificationTokenExpires: new Date(Date.now() + 60_000),
    refreshToken: "hashed-token",
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(authUtil.generateHashPassword).mockResolvedValue("hashed-password");
  vi.mocked(authUtil.generateRandomToken).mockReturnValue("raw-token");
  vi.mocked(authUtil.generateTokenHash).mockReturnValue("hashed-token");
  vi.mocked(authUtil.tokenGenerator).mockReturnValue("a.jwt.token");
});

describe("register", () => {
  it("blocks registering with an email that already exists", async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(makeUser());

    await expect(
      AuthenticationService.register({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        password: "Str0ng!Pass",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("creates the user, issues tokens, and sends a verification email", async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(UserRepository.createUser).mockResolvedValue(makeUser());

    const result = await AuthenticationService.register({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "Str0ng!Pass",
    });

    expect(result.accessToken).toBe("a.jwt.token");
    expect(result.refreshToken).toBe("a.jwt.token");
    expect(result.user).not.toHaveProperty("password");
    expect(UserRepository.updateRefreshToken).toHaveBeenCalledWith("user-1", "hashed-token");
    expect(EmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "jane@example.com", subject: expect.stringContaining("Verify") }),
    );
  });
});

describe("verifyEmail", () => {
  it("throws 400 when no token is given", async () => {
    await expect(AuthenticationService.verifyEmail("")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws 400 when the token doesn't match any user", async () => {
    vi.mocked(UserRepository.findByVerificationTokenHash).mockResolvedValue(null);

    await expect(AuthenticationService.verifyEmail("bad-token")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("returns early when the user is already verified", async () => {
    vi.mocked(UserRepository.findByVerificationTokenHash).mockResolvedValue(makeUser({ isVerified: true }));

    const result = await AuthenticationService.verifyEmail("token");

    expect(result.message).toBe("Email already verified");
    expect(UserRepository.markEmailVerified).not.toHaveBeenCalled();
  });

  it("throws 400 when the verification token has expired", async () => {
    vi.mocked(UserRepository.findByVerificationTokenHash).mockResolvedValue(
      makeUser({ verificationTokenExpires: new Date(Date.now() - 1000) }),
    );

    await expect(AuthenticationService.verifyEmail("token")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("marks the user verified on a valid, unexpired token", async () => {
    vi.mocked(UserRepository.findByVerificationTokenHash).mockResolvedValue(makeUser());

    const result = await AuthenticationService.verifyEmail("token");

    expect(result.message).toBe("Email verified successfully");
    expect(UserRepository.markEmailVerified).toHaveBeenCalledWith("user-1");
  });
});

describe("resendVerification", () => {
  it("returns a generic response when no account exists, without leaking that fact", async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(null);

    const result = await AuthenticationService.resendVerification("nobody@example.com");

    expect(result.message).toMatch(/if an account/i);
    expect(EmailService.send).not.toHaveBeenCalled();
  });

  it("returns early when already verified, without sending another email", async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(makeUser({ isVerified: true }));

    const result = await AuthenticationService.resendVerification("jane@example.com");

    expect(result.message).toBe("Email already verified");
    expect(EmailService.send).not.toHaveBeenCalled();
  });

  it("issues a new token and resends the verification email for an unverified user", async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(makeUser());

    const result = await AuthenticationService.resendVerification("jane@example.com");

    expect(result.message).toMatch(/if an account/i);
    expect(UserRepository.setVerificationToken).toHaveBeenCalled();
    expect(EmailService.send).toHaveBeenCalled();
  });
});

describe("login", () => {
  it("throws 401 when the email isn't registered", async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(null);

    await expect(
      AuthenticationService.login({ email: "nobody@example.com", password: "whatever" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 401 when the password is wrong", async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(makeUser());
    vi.mocked(authUtil.verifyHashPassword).mockResolvedValue(false);

    await expect(
      AuthenticationService.login({ email: "jane@example.com", password: "wrong" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("returns tokens and a sanitized user on success", async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(makeUser());
    vi.mocked(authUtil.verifyHashPassword).mockResolvedValue(true);

    const result = await AuthenticationService.login({ email: "jane@example.com", password: "correct" });

    expect(result.accessToken).toBe("a.jwt.token");
    expect(result.user).not.toHaveProperty("password");
    expect(result.user).not.toHaveProperty("refreshToken");
  });
});

describe("refresh", () => {
  it("throws 401 when the decoded token isn't a refresh token", async () => {
    vi.mocked(authUtil.verifyToken).mockReturnValue({ id: "user-1", typ: "access" } as any);

    await expect(AuthenticationService.refresh("some-token")).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 401 when the stored refresh token hash doesn't match", async () => {
    vi.mocked(authUtil.verifyToken).mockReturnValue({ id: "user-1", typ: "refresh" } as any);
    vi.mocked(UserRepository.findByIdWithRefreshToken).mockResolvedValue(makeUser());
    vi.mocked(authUtil.verifyTokenHash).mockReturnValue(false);

    await expect(AuthenticationService.refresh("some-token")).rejects.toMatchObject({ statusCode: 401 });
  });

  it("issues fresh tokens when the refresh token is valid", async () => {
    vi.mocked(authUtil.verifyToken).mockReturnValue({ id: "user-1", typ: "refresh" } as any);
    vi.mocked(UserRepository.findByIdWithRefreshToken).mockResolvedValue(makeUser());
    vi.mocked(authUtil.verifyTokenHash).mockReturnValue(true);

    const result = await AuthenticationService.refresh("some-token");

    expect(result.accessToken).toBe("a.jwt.token");
    expect(result.refreshToken).toBe("a.jwt.token");
  });

  it("wraps an unexpected verifyToken throw into a generic 401", async () => {
    vi.mocked(authUtil.verifyToken).mockImplementation(() => {
      throw new Error("boom");
    });

    await expect(AuthenticationService.refresh("bad-token")).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("logout", () => {
  it("clears the stored refresh token", async () => {
    const result = await AuthenticationService.logout("user-1");

    expect(UserRepository.updateRefreshToken).toHaveBeenCalledWith("user-1", null);
    expect(result.message).toBe("Logout successful");
  });
});

describe("changePassword", () => {
  it("throws 401 when the account doesn't exist", async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(null);

    await expect(
      AuthenticationService.changePassword({
        email: "nobody@example.com",
        oldPassword: "old",
        newPassword: "New1!Pass",
      }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 401 when the old password is wrong", async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(makeUser());
    vi.mocked(authUtil.verifyHashPassword).mockResolvedValue(false);

    await expect(
      AuthenticationService.changePassword({
        email: "jane@example.com",
        oldPassword: "wrong",
        newPassword: "New1!Pass",
      }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("updates the password and invalidates the existing refresh token", async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(makeUser());
    vi.mocked(authUtil.verifyHashPassword).mockResolvedValue(true);

    const result = await AuthenticationService.changePassword({
      email: "jane@example.com",
      oldPassword: "correct",
      newPassword: "New1!Pass",
    });

    expect(UserRepository.updatePassword).toHaveBeenCalledWith("user-1", "hashed-password");
    expect(UserRepository.updateRefreshToken).toHaveBeenCalledWith("user-1", null);
    expect(result.message).toBe("Password changed successfully");
  });
});
