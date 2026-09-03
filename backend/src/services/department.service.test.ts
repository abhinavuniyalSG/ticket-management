import { describe, it, expect, vi, beforeEach } from "vitest";
import { DepartmentService } from "./department.service.js";
import { DepartmentRepository } from "../database/repositry/department.repository.js";
import { UserRepository } from "../database/repositry/user.repository.js";
import { roleEnum } from "../types/user.js";
import type { RequesterInfo } from "./user.service.js";

vi.mock("../database/repositry/department.repository.js", () => ({
  DepartmentRepository: {
    findByName: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    createDepartment: vi.fn(),
    updateDepartment: vi.fn(),
    deleteDepartment: vi.fn(),
  },
}));

vi.mock("../database/repositry/user.repository.js", () => ({
  UserRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("../core/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

function requester(overrides: Partial<RequesterInfo> = {}): RequesterInfo {
  return { id: "requester-1", email: "req@example.com", role: roleEnum.superAdmin, ...overrides };
}

function makeDepartment(overrides: Record<string, unknown> = {}) {
  return {
    departmentId: "dept-1",
    departmentName: "Support",
    departmentEmail: "support@example.com",
    managedBy: null,
    manager: null,
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("createDepartment", () => {
  it("blocks anyone but super_admin from creating a department", async () => {
    await expect(
      DepartmentService.createDepartment(requester({ role: roleEnum.admin }), {
        departmentName: "Support",
        departmentEmail: "support@example.com",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks a duplicate department name", async () => {
    vi.mocked(DepartmentRepository.findByName).mockResolvedValue(makeDepartment());

    await expect(
      DepartmentService.createDepartment(requester(), {
        departmentName: "Support",
        departmentEmail: "support@example.com",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("blocks a duplicate department email", async () => {
    vi.mocked(DepartmentRepository.findByName).mockResolvedValue(null);
    vi.mocked(DepartmentRepository.findByEmail).mockResolvedValue(makeDepartment());

    await expect(
      DepartmentService.createDepartment(requester(), {
        departmentName: "Support",
        departmentEmail: "support@example.com",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("throws 404 when managedBy references a user that doesn't exist", async () => {
    vi.mocked(DepartmentRepository.findByName).mockResolvedValue(null);
    vi.mocked(DepartmentRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(UserRepository.findById).mockResolvedValue(null);

    await expect(
      DepartmentService.createDepartment(requester(), {
        departmentName: "Support",
        departmentEmail: "support@example.com",
        managedBy: "missing-user",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects a manager who is a plain user (not admin or super_admin)", async () => {
    vi.mocked(DepartmentRepository.findByName).mockResolvedValue(null);
    vi.mocked(DepartmentRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(UserRepository.findById).mockResolvedValue({ id: "u-1", role: roleEnum.user } as any);

    await expect(
      DepartmentService.createDepartment(requester(), {
        departmentName: "Support",
        departmentEmail: "support@example.com",
        managedBy: "u-1",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("creates a department when the manager is a valid admin", async () => {
    vi.mocked(DepartmentRepository.findByName).mockResolvedValue(null);
    vi.mocked(DepartmentRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(UserRepository.findById).mockResolvedValue({ id: "admin-1", role: roleEnum.admin } as any);
    vi.mocked(DepartmentRepository.createDepartment).mockResolvedValue(makeDepartment({ managedBy: "admin-1" }));
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(
      makeDepartment({ managedBy: "admin-1", manager: { id: "admin-1", password: "x", refreshToken: "y" } }),
    );

    const result = await DepartmentService.createDepartment(requester(), {
      departmentName: "Support",
      departmentEmail: "support@example.com",
      managedBy: "admin-1",
    });

    expect(result.department.departmentName).toBe("Support");
    expect((result.department as any).manager).not.toHaveProperty("password");
  });
});

describe("getAllDepartments / getDepartmentById", () => {
  it("returns all departments, sanitizing the manager on each", async () => {
    vi.mocked(DepartmentRepository.findAll).mockResolvedValue([
      makeDepartment({ manager: { id: "m-1", password: "x", refreshToken: "y" } }),
    ]);

    const result = await DepartmentService.getAllDepartments();

    expect(result.departments[0]).not.toHaveProperty("managerPassword");
    expect((result.departments[0] as any).manager).not.toHaveProperty("password");
  });

  it("throws 404 when the department isn't found", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(null);

    await expect(DepartmentService.getDepartmentById("missing")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("returns the department when found", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(makeDepartment());

    const result = await DepartmentService.getDepartmentById("dept-1");

    expect(result.department.departmentId).toBe("dept-1");
  });
});

describe("updateDepartment", () => {
  it("blocks anyone but super_admin", async () => {
    await expect(
      DepartmentService.updateDepartment(requester({ role: roleEnum.admin }), "dept-1", {
        departmentName: "New name",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 404 when the department doesn't exist", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(null);

    await expect(
      DepartmentService.updateDepartment(requester(), "missing", { departmentName: "New name" }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("blocks renaming to a name that's already taken by another department", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(makeDepartment({ departmentName: "Old" }));
    vi.mocked(DepartmentRepository.findByName).mockResolvedValue(makeDepartment({ departmentId: "dept-2" }));

    await expect(
      DepartmentService.updateDepartment(requester(), "dept-1", { departmentName: "Taken" }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("allows keeping the same name unchanged", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(makeDepartment({ departmentName: "Support" }));
    vi.mocked(DepartmentRepository.updateDepartment).mockResolvedValue(makeDepartment());

    const result = await DepartmentService.updateDepartment(requester(), "dept-1", {
      departmentName: "Support",
    });

    expect(DepartmentRepository.findByName).not.toHaveBeenCalled();
    expect(result.department.departmentId).toBe("dept-1");
  });

  it("blocks changing to an email that's already taken", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(
      makeDepartment({ departmentEmail: "old@example.com" }),
    );
    vi.mocked(DepartmentRepository.findByEmail).mockResolvedValue(makeDepartment({ departmentId: "dept-2" }));

    await expect(
      DepartmentService.updateDepartment(requester(), "dept-1", { departmentEmail: "taken@example.com" }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("validates a newly assigned manager", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(makeDepartment());
    vi.mocked(UserRepository.findById).mockResolvedValue({ id: "u-1", role: roleEnum.user } as any);

    await expect(
      DepartmentService.updateDepartment(requester(), "dept-1", { managedBy: "u-1" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws 500 when the update fails to return a department", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(makeDepartment());
    vi.mocked(DepartmentRepository.updateDepartment).mockResolvedValue(null);

    await expect(
      DepartmentService.updateDepartment(requester(), "dept-1", { departmentName: "New name" }),
    ).rejects.toMatchObject({ statusCode: 500 });
  });
});

describe("deleteDepartment", () => {
  it("blocks anyone but super_admin", async () => {
    await expect(
      DepartmentService.deleteDepartment(requester({ role: roleEnum.admin }), "dept-1"),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 404 when the department doesn't exist", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(null);

    await expect(DepartmentService.deleteDepartment(requester(), "missing")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("deletes the department when found", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(makeDepartment());
    vi.mocked(DepartmentRepository.deleteDepartment).mockResolvedValue(true);

    const result = await DepartmentService.deleteDepartment(requester(), "dept-1");

    expect(result.message).toBe("Department deleted successfully");
  });

  it("throws 500 when the delete doesn't actually remove a row", async () => {
    vi.mocked(DepartmentRepository.findById).mockResolvedValue(makeDepartment());
    vi.mocked(DepartmentRepository.deleteDepartment).mockResolvedValue(false);

    await expect(DepartmentService.deleteDepartment(requester(), "dept-1")).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});
