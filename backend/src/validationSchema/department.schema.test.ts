import { describe, it, expect } from "vitest";
import { DepartmentSchema } from "./department.schema.js";

const schema = new DepartmentSchema();
const UUID_V7 = "018f4d2e-6b1a-7a3e-8b0a-0f2a1c9d4e5b";

describe("createDepartmentSchema", () => {
  const validPayload = {
    departmentName: "Facilities",
    departmentEmail: "facilities@example.com",
  };

  it("accepts a minimal valid department", () => {
    expect(schema.createDepartmentSchema.safeParse(validPayload).success).toBe(true);
  });

  it("lowercases the department email", () => {
    const result = schema.createDepartmentSchema.parse({
      ...validPayload,
      departmentEmail: "Facilities@Example.com",
    });
    expect(result.departmentEmail).toBe("facilities@example.com");
  });

  it("accepts an optional manager id", () => {
    const result = schema.createDepartmentSchema.safeParse({
      ...validPayload,
      managedBy: UUID_V7,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a department name that is too short", () => {
    const result = schema.createDepartmentSchema.safeParse({ ...validPayload, departmentName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid department email", () => {
    const result = schema.createDepartmentSchema.safeParse({
      ...validPayload,
      departmentEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a manager id that isn't a valid UUID", () => {
    const result = schema.createDepartmentSchema.safeParse({
      ...validPayload,
      managedBy: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateDepartmentSchema", () => {
  it("accepts a single field update", () => {
    expect(schema.updateDepartmentSchema.safeParse({ departmentName: "Support" }).success).toBe(
      true,
    );
  });

  it("rejects an empty update (nothing to change)", () => {
    expect(schema.updateDepartmentSchema.safeParse({}).success).toBe(false);
  });

  it("allows clearing the manager by passing null", () => {
    expect(schema.updateDepartmentSchema.safeParse({ managedBy: null }).success).toBe(true);
  });
});

describe("departmentIdParamSchema", () => {
  it("accepts a valid UUID", () => {
    expect(schema.departmentIdParamSchema.safeParse({ id: UUID_V7 }).success).toBe(true);
  });

  it("rejects a non-UUID id", () => {
    expect(schema.departmentIdParamSchema.safeParse({ id: "123" }).success).toBe(false);
  });
});
