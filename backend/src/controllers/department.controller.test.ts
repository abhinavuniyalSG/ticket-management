import { describe, it, expect, vi, beforeEach } from "vitest";
import { DepartmentController } from "./department.controller.js";
import { DepartmentService } from "../services/department.service.js";

vi.mock("../services/department.service.js", () => ({
  DepartmentService: {
    getAllDepartments: vi.fn(),
    getDepartmentById: vi.fn(),
    createDepartment: vi.fn(),
    updateDepartment: vi.fn(),
    deleteDepartment: vi.fn(),
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

describe("getAllDepartmentsController", () => {
  it("passes the normalized query through and returns 200", async () => {
    const res = makeRes();
    vi.mocked(DepartmentService.getAllDepartments).mockResolvedValue({ message: "ok", departments: [] } as any);
    const req = { normalized: { query: { departmentName: "Support" } }, query: {} } as any;

    DepartmentController.getAllDepartmentsController(req, res, next);
    await flush();

    expect(DepartmentService.getAllDepartments).toHaveBeenCalledWith({ departmentName: "Support" });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("getDepartmentDetailsController", () => {
  it("reads the id param and returns 200", async () => {
    const res = makeRes();
    vi.mocked(DepartmentService.getDepartmentById).mockResolvedValue({ message: "ok", department: {} } as any);
    const req = { normalized: { params: { id: "d1" } }, params: {} } as any;

    DepartmentController.getDepartmentDetailsController(req, res, next);
    await flush();

    expect(DepartmentService.getDepartmentById).toHaveBeenCalledWith("d1");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("createDepartmentController", () => {
  it("creates a department and returns 201", async () => {
    const res = makeRes();
    const body = { departmentName: "Support", departmentEmail: "support@example.com" };
    vi.mocked(DepartmentService.createDepartment).mockResolvedValue({ message: "created", department: {} } as any);
    const req = { user: requester, normalized: { body }, body: {} } as any;

    DepartmentController.createDepartmentController(req, res, next);
    await flush();

    expect(DepartmentService.createDepartment).toHaveBeenCalledWith(requester, body);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("updateDepartmentController", () => {
  it("updates the target department and returns 200", async () => {
    const res = makeRes();
    const body = { departmentName: "New name" };
    vi.mocked(DepartmentService.updateDepartment).mockResolvedValue({ message: "updated", department: {} } as any);
    const req = { user: requester, normalized: { params: { id: "d1" }, body }, params: {}, body: {} } as any;

    DepartmentController.updateDepartmentController(req, res, next);
    await flush();

    expect(DepartmentService.updateDepartment).toHaveBeenCalledWith(requester, "d1", body);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("deleteDepartmentController", () => {
  it("deletes the target department and returns 200", async () => {
    const res = makeRes();
    vi.mocked(DepartmentService.deleteDepartment).mockResolvedValue({ message: "deleted" } as any);
    const req = { user: requester, normalized: { params: { id: "d1" } }, params: {} } as any;

    DepartmentController.deleteDepartmentController(req, res, next);
    await flush();

    expect(DepartmentService.deleteDepartment).toHaveBeenCalledWith(requester, "d1");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
