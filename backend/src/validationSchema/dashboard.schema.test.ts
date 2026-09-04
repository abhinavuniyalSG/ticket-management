import { describe, it, expect } from "vitest";
import { DashboardSchema } from "./dashboard.schema.js";

const schema = new DashboardSchema();
const UUID_V7 = "018f4d2e-6b1a-7a3e-8b0a-0f2a1c9d4e5b";

describe("dashboardQuerySchema", () => {
  it("defaults period to 'week' when not provided", () => {
    const result = schema.dashboardQuerySchema.parse({});
    expect(result.period).toBe("week");
  });

  it("accepts an explicit period", () => {
    const result = schema.dashboardQuerySchema.parse({ period: "month" });
    expect(result.period).toBe("month");
  });

  it("rejects an invalid period", () => {
    const result = schema.dashboardQuerySchema.safeParse({ period: "decade" });
    expect(result.success).toBe(false);
  });

  it("accepts an optional department filter", () => {
    const result = schema.dashboardQuerySchema.safeParse({ departmentId: UUID_V7 });
    expect(result.success).toBe(true);
  });

  it("rejects a department filter that isn't a valid UUID", () => {
    const result = schema.dashboardQuerySchema.safeParse({ departmentId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("dashboardOverviewQuerySchema", () => {
  it("defaults period to 'week' when not provided", () => {
    const result = schema.dashboardOverviewQuerySchema.parse({});
    expect(result.period).toBe("week");
  });

  it("accepts an explicit period", () => {
    const result = schema.dashboardOverviewQuerySchema.parse({ period: "year" });
    expect(result.period).toBe("year");
  });

  it("rejects an invalid period", () => {
    const result = schema.dashboardOverviewQuerySchema.safeParse({ period: "decade" });
    expect(result.success).toBe(false);
  });

  it("rejects a departmentId, since the overview is always system-wide", () => {
    const result = schema.dashboardOverviewQuerySchema.safeParse({
      departmentId: "018f4d2e-6b1a-7a3e-8b0a-0f2a1c9d4e5b",
    });
    expect(result.success).toBe(false);
  });
});
