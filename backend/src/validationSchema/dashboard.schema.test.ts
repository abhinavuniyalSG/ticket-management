import { describe, it, expect } from "vitest";
import { DashboardSchema } from "./dashboard.schema.js";

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

  describe("period: custom", () => {
    it("accepts a year on its own", () => {
      const result = schema.dashboardOverviewQuerySchema.safeParse({
        period: "custom",
        year: "2024",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2024);
      }
    });

    it("accepts a year and month", () => {
      const result = schema.dashboardOverviewQuerySchema.safeParse({
        period: "custom",
        year: "2024",
        month: "2",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a year, month, and day", () => {
      const result = schema.dashboardOverviewQuerySchema.safeParse({
        period: "custom",
        year: "2024",
        month: "2",
        day: "29",
      });
      expect(result.success).toBe(true);
    });

    it("rejects 'custom' with no year", () => {
      const result = schema.dashboardOverviewQuerySchema.safeParse({
        period: "custom",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a day without a month", () => {
      const result = schema.dashboardOverviewQuerySchema.safeParse({
        period: "custom",
        year: "2024",
        day: "5",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an out-of-range month", () => {
      const result = schema.dashboardOverviewQuerySchema.safeParse({
        period: "custom",
        year: "2024",
        month: "13",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an out-of-range day", () => {
      const result = schema.dashboardOverviewQuerySchema.safeParse({
        period: "custom",
        year: "2024",
        month: "1",
        day: "32",
      });
      expect(result.success).toBe(false);
    });
  });

  it("rejects year/month/day when period isn't 'custom'", () => {
    const result = schema.dashboardOverviewQuerySchema.safeParse({
      period: "week",
      year: "2024",
    });
    expect(result.success).toBe(false);
  });
});
