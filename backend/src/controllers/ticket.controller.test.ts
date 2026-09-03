import { describe, it, expect, vi, beforeEach } from "vitest";
import { TicketController } from "./ticket.controller.js";
import { TicketService } from "../services/ticket.service.js";

vi.mock("../services/ticket.service.js", () => ({
  TicketService: {
    getAllTickets: vi.fn(),
    getTicketById: vi.fn(),
    createTicket: vi.fn(),
    updateTicket: vi.fn(),
    deleteTicket: vi.fn(),
  },
}));

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
}

const next = vi.fn();

async function flush() {
  await new Promise((resolve) => setImmediate(resolve));
}

const requester = { id: "user-1", email: "user@example.com", role: "user" };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("getAllTicketsController", () => {
  it("passes the normalized query and requester to the service, and returns 200", async () => {
    const res = makeRes();
    vi.mocked(TicketService.getAllTickets).mockResolvedValue({ message: "ok", tickets: [] } as any);
    const req = { user: requester, normalized: { query: { status: "open" } }, query: {} } as any;

    TicketController.getAllTicketsController(req, res, next);
    await flush();

    expect(TicketService.getAllTickets).toHaveBeenCalledWith(requester, { status: "open" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "ok", tickets: [] });
  });

  it("falls back to req.query when nothing was normalized", async () => {
    const res = makeRes();
    vi.mocked(TicketService.getAllTickets).mockResolvedValue({ message: "ok", tickets: [] } as any);
    const req = { user: requester, query: { status: "closed" } } as any;

    TicketController.getAllTicketsController(req, res, next);
    await flush();

    expect(TicketService.getAllTickets).toHaveBeenCalledWith(requester, { status: "closed" });
  });
});

describe("getTicketDetailsController", () => {
  it("reads the id param and returns 200 with the ticket", async () => {
    const res = makeRes();
    vi.mocked(TicketService.getTicketById).mockResolvedValue({ message: "ok", ticket: { ticketId: "t1" } } as any);
    const req = { user: requester, normalized: { params: { id: "t1" } }, params: {} } as any;

    TicketController.getTicketDetailsController(req, res, next);
    await flush();

    expect(TicketService.getTicketById).toHaveBeenCalledWith("t1", requester);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("createTicketController", () => {
  it("creates a ticket and returns 201", async () => {
    const res = makeRes();
    const body = { title: "t", description: "d", departmentId: "dept-1" };
    vi.mocked(TicketService.createTicket).mockResolvedValue({ message: "created", ticket: {} } as any);
    const req = { user: requester, normalized: { body }, body: {} } as any;

    TicketController.createTicketController(req, res, next);
    await flush();

    expect(TicketService.createTicket).toHaveBeenCalledWith(requester, body);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("updateTicketController", () => {
  it("updates a ticket and returns 200", async () => {
    const res = makeRes();
    const body = { title: "New title" };
    vi.mocked(TicketService.updateTicket).mockResolvedValue({ message: "updated", ticket: {} } as any);
    const req = { user: requester, normalized: { params: { id: "t1" }, body }, params: {}, body: {} } as any;

    TicketController.updateTicketController(req, res, next);
    await flush();

    expect(TicketService.updateTicket).toHaveBeenCalledWith("t1", body, requester);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("deleteTicketController", () => {
  it("deletes a ticket and returns 200", async () => {
    const res = makeRes();
    vi.mocked(TicketService.deleteTicket).mockResolvedValue({ message: "deleted" } as any);
    const req = { user: requester, normalized: { params: { id: "t1" } }, params: {} } as any;

    TicketController.deleteTicketController(req, res, next);
    await flush();

    expect(TicketService.deleteTicket).toHaveBeenCalledWith("t1", requester);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("error propagation", () => {
  it("forwards a rejected service call to next() instead of throwing", async () => {
    const res = makeRes();
    const error = new Error("boom");
    vi.mocked(TicketService.getTicketById).mockRejectedValue(error);
    const req = { user: requester, normalized: { params: { id: "t1" } }, params: {} } as any;

    TicketController.getTicketDetailsController(req, res, next);
    await flush();

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});
