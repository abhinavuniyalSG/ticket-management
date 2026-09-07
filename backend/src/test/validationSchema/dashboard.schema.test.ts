import { describe, it, expect } from "vitest";
import { DashboardSchema } from "../../validationSchema/dashboard.schema.js";

const schema = new DashboardSchema();
const UUID_V7 = "018f4d2e-6b1a-7a3e-8b0a-0f2a1c9d4e5b";

describe("dashboardQuerySchema", () => {
  it("defaults period to 'day' when not provided", () => {
    const result = schema.dashboardQuerySchema.parse({});
    expect(result.period).toBe("day");
  });

  it("accepts every supported period", () => {
    for (const period of ["day", "week", "month", "year"]) {
      const result = schema.dashboardQuerySchema.safeParse({ period });
      expect(result.success).toBe(true);
    }
  });

  it("rejects an invalid period", () => {
    const result = schema.dashboardQuerySchema.safeParse({ period: "decade" });
    expect(result.success).toBe(false);
  });

  it("accepts an optional department filter", () => {
    const result = schema.dashboardQuerySchema.safeParse({
      departmentId: UUID_V7,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a department filter that isn't a valid UUID", () => {
    const result = schema.dashboardQuerySchema.safeParse({
      departmentId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("dashboardOverviewQuerySchema", () => {
  it("defaults period to 'day' when not provided", () => {
    const result = schema.dashboardOverviewQuerySchema.parse({});
    expect(result.period).toBe("day");
  });

  it("accepts every supported period", () => {
    for (const period of ["day", "week", "month", "year", "all"]) {
      const result = schema.dashboardOverviewQuerySchema.safeParse({ period });
      expect(result.success).toBe(true);
    }
  });

  it("rejects an invalid period", () => {
    const result = schema.dashboardOverviewQuerySchema.safeParse({
      period: "decade",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a departmentId, since both admin and super_admin may scope by department", () => {
    const result = schema.dashboardOverviewQuerySchema.safeParse({
      departmentId: UUID_V7,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a departmentId that isn't a valid UUID", () => {
    const result = schema.dashboardOverviewQuerySchema.safeParse({
      departmentId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});
