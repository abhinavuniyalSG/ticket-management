import { describe, it, expect } from "vitest";
import {
  generateHashPassword,
  verifyHashPassword,
  generateRandomToken,
  generateTokenHash,
  verifyTokenHash,
  tokenGenerator,
  verifyToken,
} from "./auth.util.js";
import { JWT_VARIABLES } from "../config/secrets.js";

describe("password hashing", () => {
  it("hashes a password to something other than the plain text", async () => {
    const hash = await generateHashPassword("Str0ng!Pass");
    expect(hash).not.toBe("Str0ng!Pass");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("verifies the correct password against its hash", async () => {
    const hash = await generateHashPassword("Str0ng!Pass");
    await expect(verifyHashPassword("Str0ng!Pass", hash)).resolves.toBe(true);
  });

  it("rejects the wrong password against a hash", async () => {
    const hash = await generateHashPassword("Str0ng!Pass");
    await expect(verifyHashPassword("SomethingElse1!", hash)).resolves.toBe(false);
  });
});

describe("random tokens", () => {
  it("generates a hex string of the requested byte length", () => {
    const token = generateRandomToken(16);
    expect(token).toMatch(/^[0-9a-f]+$/);
    expect(token).toHaveLength(32); // 16 bytes -> 32 hex characters
  });

  it("generates a different token every time", () => {
    expect(generateRandomToken()).not.toBe(generateRandomToken());
  });
});

describe("token hashing (used for email verification / refresh tokens)", () => {
  it("hashes the same token to the same value every time", () => {
    const token = "some-verification-token";
    expect(generateTokenHash(token)).toBe(generateTokenHash(token));
  });

  it("verifies a token against its own hash", () => {
    const token = "some-verification-token";
    const hash = generateTokenHash(token);
    expect(verifyTokenHash(token, hash)).toBe(true);
  });

  it("rejects a token that doesn't match the stored hash", () => {
    const hash = generateTokenHash("original-token");
    expect(verifyTokenHash("tampered-token", hash)).toBe(false);
  });
});

describe("JWT access/refresh tokens", () => {
  const payload = { id: "user-1", email: "user@example.com", role: "user" };

  it("issues an access token that verifies successfully with the access secret", () => {
    const token = tokenGenerator(payload, "ACCESS");
    expect(typeof token).toBe("string");

    const decoded = verifyToken(token as string, JWT_VARIABLES.JWT_ACCESS_SECRET) as {
      id: string;
      role: string;
      typ: string;
    };
    expect(decoded.id).toBe("user-1");
    expect(decoded.role).toBe("user");
    expect(decoded.typ).toBe("access");
  });

  it("issues a refresh token that verifies successfully with the refresh secret", () => {
    const token = tokenGenerator(payload, "REFRESH");

    const decoded = verifyToken(token as string, JWT_VARIABLES.JWT_REFRESH_SECRET) as {
      typ: string;
    };
    expect(decoded.typ).toBe("refresh");
  });

  it("throws for an unknown token type", () => {
    expect(() => tokenGenerator(payload, "BOGUS")).toThrow("Provide valid generateType");
  });

  it("rejects a token signed with the wrong secret", () => {
    const token = tokenGenerator(payload, "ACCESS");
    expect(() => verifyToken(token as string, "a-completely-different-secret")).toThrow(
      "Invalid token signature",
    );
  });
});
