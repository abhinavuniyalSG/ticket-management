import { describe, it, expect } from "vitest";
import { getPasswordErrors, isValidEmail } from "./validation";

describe("getPasswordErrors", () => {
  it("returns no errors for a strong password", () => {
    expect(getPasswordErrors("Str0ng!Pass")).toEqual([]);
  });

  it("flags a password that is too short", () => {
    expect(getPasswordErrors("Ab1!")).toContain("At least 8 characters long");
  });

  it("flags a missing uppercase letter", () => {
    expect(getPasswordErrors("weak1234!")).toContain("At least one uppercase letter");
  });

  it("flags a missing lowercase letter", () => {
    expect(getPasswordErrors("WEAK1234!")).toContain("At least one lowercase letter");
  });

  it("flags a missing number", () => {
    expect(getPasswordErrors("WeakPass!")).toContain("At least one number");
  });

  it("flags a missing special character", () => {
    expect(getPasswordErrors("WeakPass1")).toContain("At least one special character");
  });

  it("flags a password that is too long", () => {
    const tooLong = "A1!".padEnd(256, "a");
    expect(getPasswordErrors(tooLong)).toContain("Must not exceed 255 characters");
  });

  it("can report multiple problems at once", () => {
    expect(getPasswordErrors("weak")).toHaveLength(4);
  });
});

describe("isValidEmail", () => {
  it.each([
    "user@example.com",
    "first.last@sub.example.co.uk",
    "user+tag@example.com",
  ])("accepts a valid email: %s", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    "",
    "not-an-email",
    "missing-domain@",
    "@missing-local.com",
    "has space@example.com",
  ])("rejects an invalid email: %s", (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});
