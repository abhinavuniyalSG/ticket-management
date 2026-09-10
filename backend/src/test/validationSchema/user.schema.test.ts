import { describe, it, expect } from "vitest";
import { UserSchema } from "../../validationSchema/user.schema.js";

const schema = new UserSchema();
const UUID_V7 = "018f4d2e-6b1a-7a3e-8b0a-0f2a1c9d4e5b";

describe("updateUserSchema", () => {
  it("accepts a single field update", () => {
    expect(schema.updateUserSchema.safeParse({ firstName: "Ada" }).success).toBe(true);
  });

  it("rejects an empty update (nothing to change)", () => {
    expect(schema.updateUserSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a valid role", () => {
    expect(schema.updateUserSchema.safeParse({ role: "admin" }).success).toBe(true);
  });

  it("rejects an invalid role", () => {
    expect(schema.updateUserSchema.safeParse({ role: "owner" }).success).toBe(false);
  });

  it("allows clearing the department by passing null", () => {
    expect(schema.updateUserSchema.safeParse({ departmentId: null }).success).toBe(true);
  });
});

describe("userQuerySchema", () => {
  it("accepts an empty query (all filters optional)", () => {
    expect(schema.userQuerySchema.safeParse({}).success).toBe(true);
  });

  it("rejects an invalid role filter", () => {
    expect(schema.userQuerySchema.safeParse({ role: "owner" }).success).toBe(false);
  });

  it("defaults page to 1 and leaves limit undefined (no pagination) when omitted", () => {
    const result = schema.userQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBeUndefined();
  });

  it("rejects a limit above 100", () => {
    expect(schema.userQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });
});

describe("userIdParamSchema", () => {
  it("accepts a valid UUID", () => {
    expect(schema.userIdParamSchema.safeParse({ id: UUID_V7 }).success).toBe(true);
  });

  it("rejects a non-UUID id", () => {
    expect(schema.userIdParamSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
  });
});
