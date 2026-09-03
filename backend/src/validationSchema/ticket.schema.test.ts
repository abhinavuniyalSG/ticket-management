import { describe, it, expect } from "vitest";
import { TicketSchema } from "./ticket.schema.js";

const schema = new TicketSchema();

// A valid UUIDv7, since the schemas specifically require that version.
const UUID_V7 = "018f4d2e-6b1a-7a3e-8b0a-0f2a1c9d4e5b";

describe("createTicketSchema", () => {
  const validPayload = {
    title: "Printer is on fire",
    description: "Smoke coming from the third floor printer.",
    departmentId: UUID_V7,
  };

  it("accepts a minimal valid ticket", () => {
    expect(schema.createTicketSchema.safeParse(validPayload).success).toBe(true);
  });

  it("accepts an optional priority and assignee", () => {
    const result = schema.createTicketSchema.safeParse({
      ...validPayload,
      priority: "urgent",
      assignedToId: UUID_V7,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a title that is too short", () => {
    const result = schema.createTicketSchema.safeParse({ ...validPayload, title: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects a description that is too short", () => {
    const result = schema.createTicketSchema.safeParse({ ...validPayload, description: "Hi" });
    expect(result.success).toBe(false);
  });

  it("rejects a department id that isn't a valid UUID", () => {
    const result = schema.createTicketSchema.safeParse({
      ...validPayload,
      departmentId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid priority value", () => {
    const result = schema.createTicketSchema.safeParse({ ...validPayload, priority: "critical" });
    expect(result.success).toBe(false);
  });
});

describe("updateTicketSchema", () => {
  it("accepts a single field update", () => {
    expect(schema.updateTicketSchema.safeParse({ title: "Updated title" }).success).toBe(true);
  });

  it("rejects an empty update (nothing to change)", () => {
    expect(schema.updateTicketSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an invalid status value", () => {
    const result = schema.updateTicketSchema.safeParse({ status: "archived" });
    expect(result.success).toBe(false);
  });

  it("allows clearing the assignee by passing null", () => {
    const result = schema.updateTicketSchema.safeParse({ assignedToId: null });
    expect(result.success).toBe(true);
  });
});

describe("ticketQuerySchema", () => {
  it("accepts an empty query (all filters optional)", () => {
    expect(schema.ticketQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts a combination of valid filters", () => {
    const result = schema.ticketQuerySchema.safeParse({
      status: "open",
      priority: "high",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid sortBy value", () => {
    const result = schema.ticketQuerySchema.safeParse({ sortBy: "urgency" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed ISO date for createdFrom", () => {
    const result = schema.ticketQuerySchema.safeParse({ createdFrom: "15-01-2026" });
    expect(result.success).toBe(false);
  });
});
