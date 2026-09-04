import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardController } from "./dashboard.controller.js";
import { DashboardService } from "../services/dashboard.service.js";

vi.mock("../services/dashboard.service.js", () => ({
  DashboardService: {
    getDashboard: vi.fn(),
    getDashboardOverview: vi.fn(),
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

const requester = { id: "super-1", email: "super@example.com", role: "super_admin" };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("getDashboardController", () => {
  it("passes the requester and normalized query through, and returns 200", async () => {
    const res = makeRes();
    vi.mocked(DashboardService.getDashboard).mockResolvedValue({ message: "ok" } as any);
    const req = { user: requester, normalized: { query: { period: "month" } }, query: {} } as any;

    DashboardController.getDashboardController(req, res, next);
    await flush();

    expect(DashboardService.getDashboard).toHaveBeenCalledWith(requester, { period: "month" });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("getDashboardOverviewController", () => {
  it("passes the requester and normalized query through, and returns 200", async () => {
    const res = makeRes();
    vi.mocked(DashboardService.getDashboardOverview).mockResolvedValue({ message: "ok" } as any);
    const req = { user: requester, normalized: { query: { period: "month" } }, query: {} } as any;

    DashboardController.getDashboardOverviewController(req, res, next);
    await flush();

    expect(DashboardService.getDashboardOverview).toHaveBeenCalledWith(requester, { period: "month" });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
