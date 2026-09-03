import { describe, it, expect } from "vitest";
import { UserSchema } from "./user.schema.js";

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

  it("accepts a list of contacts", () => {
    const result = schema.updateUserSchema.safeParse({
      contacts: [{ contactType: "phone", contactDetail: "+1 555 0100" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a contact with an invalid contactType", () => {
    const result = schema.updateUserSchema.safeParse({
      contacts: [{ contactType: "carrier-pigeon", contactDetail: "coop #4" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("userQuerySchema", () => {
  it("accepts an empty query (all filters optional)", () => {
    expect(schema.userQuerySchema.safeParse({}).success).toBe(true);
  });

  it("rejects an invalid role filter", () => {
    expect(schema.userQuerySchema.safeParse({ role: "owner" }).success).toBe(false);
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

describe("addContactSchema", () => {
  it("accepts a valid contact", () => {
    const result = schema.addContactSchema.safeParse({
      contactType: "whatsapp",
      contactDetail: "+1 555 0100",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty contact detail", () => {
    const result = schema.addContactSchema.safeParse({ contactType: "phone", contactDetail: "" });
    expect(result.success).toBe(false);
  });
});

describe("updateContactSchema", () => {
  it("accepts a partial update with just one field", () => {
    expect(schema.updateContactSchema.safeParse({ contactDetail: "+1 555 0199" }).success).toBe(
      true,
    );
  });

  it("rejects an empty update (nothing to change)", () => {
    expect(schema.updateContactSchema.safeParse({}).success).toBe(false);
  });
});
