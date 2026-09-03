import { describe, it, expect } from "vitest";
import { AuthenticationSchema } from "./authentication.schema.js";

const schema = new AuthenticationSchema();

describe("registerSchema", () => {
  const validPayload = {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    password: "Str0ng!Pass",
  };

  it("accepts a valid registration payload", () => {
    const result = schema.registerSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("lowercases and trims the email", () => {
    const result = schema.registerSchema.parse({
      ...validPayload,
      email: "  Ada@Example.com  ",
    });
    expect(result.email).toBe("ada@example.com");
  });

  it("rejects a missing first name", () => {
    const { firstName: _firstName, ...rest } = validPayload;
    const result = schema.registerSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email address", () => {
    const result = schema.registerSchema.safeParse({ ...validPayload, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a password missing a special character", () => {
    const result = schema.registerSchema.safeParse({ ...validPayload, password: "WeakPass1" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown extra fields (schema is strict)", () => {
    const result = schema.registerSchema.safeParse({ ...validPayload, role: "super_admin" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts an email and any non-empty password", () => {
    const result = schema.loginSchema.safeParse({
      email: "ada@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = schema.loginSchema.safeParse({ email: "ada@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const base = {
    email: "ada@example.com",
    oldPassword: "OldStr0ng!Pass",
    newPassword: "NewStr0ng!Pass",
  };

  it("accepts a valid password change", () => {
    expect(schema.changePasswordSchema.safeParse(base).success).toBe(true);
  });

  it("rejects when the new password is the same as the old one", () => {
    const result = schema.changePasswordSchema.safeParse({
      ...base,
      newPassword: base.oldPassword,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a weak new password", () => {
    const result = schema.changePasswordSchema.safeParse({ ...base, newPassword: "weak" });
    expect(result.success).toBe(false);
  });
});

describe("resendVerificationSchema", () => {
  it("accepts a valid email", () => {
    expect(schema.resendVerificationSchema.safeParse({ email: "ada@example.com" }).success).toBe(
      true,
    );
  });

  it("rejects an invalid email", () => {
    expect(schema.resendVerificationSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});
