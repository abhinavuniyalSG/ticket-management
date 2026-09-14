import { describe, it, expect } from "vitest";
import { formatDate, fullName, initials } from "./format";

describe("formatDate", () => {
  it("returns an em dash for null, undefined or empty input", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
  });

  it("returns an em dash for an unparseable date string", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("formats a valid ISO date string as numeric D/M/YYYY, 24-hour time", () => {
    const result = formatDate("2026-01-15T10:30:00.000Z");
    // Avoid asserting the exact day/month/time (they depend on the machine's
    // timezone); just check the format shape is right.
    expect(result).toMatch(/^\d{1,2}\/\d{1,2}\/2026, \d{2}:\d{2}$/);
  });
});

describe("fullName", () => {
  it("returns 'Unassigned' when there is no person", () => {
    expect(fullName(null)).toBe("Unassigned");
    expect(fullName(undefined)).toBe("Unassigned");
  });

  it("joins first and last name", () => {
    expect(fullName({ firstName: "Ada", lastName: "Lovelace" })).toBe("Ada Lovelace");
  });

  it("trims extra whitespace when a name part is empty", () => {
    expect(fullName({ firstName: "Ada", lastName: "" })).toBe("Ada");
  });
});

describe("initials", () => {
  it("returns '?' when there is no person", () => {
    expect(initials(null)).toBe("?");
    expect(initials(undefined)).toBe("?");
  });

  it("returns the first letter of each name, uppercased", () => {
    expect(initials({ firstName: "Ada", lastName: "Lovelace" })).toBe("AL");
    expect(initials({ firstName: "ada", lastName: "lovelace" })).toBe("AL");
  });
});
