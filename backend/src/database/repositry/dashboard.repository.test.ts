import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TicketTrendPeriod,
  getDailyTrendBucketKeys,
  getWeeklyTrendBucketKeys,
  getMonthlyTrendBucketKeys,
  getYearlyTrendBucketKeys,
  getTrendRangeStart,
} from "./dashboard.repository.js";

describe("trend bucket keys", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T15:30:00.000Z")); // a Friday
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("getDailyTrendBucketKeys: 7 days, oldest first, ending today", () => {
    expect(getDailyTrendBucketKeys()).toEqual([
      "2026-08-29",
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
    ]);
  });

  it("getWeeklyTrendBucketKeys: 4 Mondays, oldest first, ending this week's Monday", () => {
    expect(getWeeklyTrendBucketKeys()).toEqual([
      "2026-08-10",
      "2026-08-17",
      "2026-08-24",
      "2026-08-31",
    ]);
  });

  it("getMonthlyTrendBucketKeys: 12 months, oldest first, ending this month", () => {
    expect(getMonthlyTrendBucketKeys()).toEqual([
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
  });

  it("getYearlyTrendBucketKeys: one entry per year, from the earliest ticket's year through this year", () => {
    expect(getYearlyTrendBucketKeys(2023)).toEqual([
      "2023",
      "2024",
      "2025",
      "2026",
    ]);
  });

  it("getYearlyTrendBucketKeys: just this year when there's no earliest ticket", () => {
    expect(getYearlyTrendBucketKeys(null)).toEqual(["2026"]);
  });

  it("getYearlyTrendBucketKeys: just this year when the earliest ticket is somehow in the future", () => {
    expect(getYearlyTrendBucketKeys(2030)).toEqual(["2026"]);
  });
});

describe("month and week buckets roll over a year boundary correctly", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T12:00:00.000Z")); // a Monday, early January
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("getWeeklyTrendBucketKeys crosses into the previous year", () => {
    expect(getWeeklyTrendBucketKeys()).toEqual([
      "2025-12-15",
      "2025-12-22",
      "2025-12-29",
      "2026-01-05",
    ]);
  });

  it("getMonthlyTrendBucketKeys crosses into the previous year", () => {
    expect(getMonthlyTrendBucketKeys()).toEqual([
      "2025-01",
      "2025-02",
      "2025-03",
      "2025-04",
      "2025-05",
      "2025-06",
      "2025-07",
      "2025-08",
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
    ]);
  });
});

describe("getTrendRangeStart", () => {
  it("day: parses the key as a UTC date", () => {
    expect(getTrendRangeStart(TicketTrendPeriod.day, "2026-08-29")).toEqual(
      new Date("2026-08-29T00:00:00.000Z"),
    );
  });

  it("week: parses the key (a Monday) as a UTC date", () => {
    expect(getTrendRangeStart(TicketTrendPeriod.week, "2026-08-10")).toEqual(
      new Date("2026-08-10T00:00:00.000Z"),
    );
  });

  it("month: parses a 'YYYY-MM' key as the 1st of that month, UTC", () => {
    expect(getTrendRangeStart(TicketTrendPeriod.month, "2025-09")).toEqual(
      new Date("2025-09-01T00:00:00.000Z"),
    );
  });

  it("year: parses a 'YYYY' key as January 1st of that year, UTC", () => {
    expect(getTrendRangeStart(TicketTrendPeriod.year, "2023")).toEqual(
      new Date("2023-01-01T00:00:00.000Z"),
    );
  });
});
