import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserController } from "../../controllers/user.controller.js";
import { UserService } from "../../services/user.service.js";

vi.mock("../../services/user.service.js", () => ({
  UserService: {
    getAllUsers: vi.fn(),
    getUserById: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
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

describe("getAllUsersController", () => {
  it("narrows the normalized query down to department/firstName/role and returns 200", async () => {
    const res = makeRes();
    vi.mocked(UserService.getAllUsers).mockResolvedValue({ message: "ok", users: [] } as any);
    const req = {
      user: requester,
      normalized: { query: { department: "Support", firstName: "Jane", role: "admin", extra: "ignored" } },
      query: {},
    } as any;

    UserController.getAllUsersController(req, res, next);
    await flush();

    expect(UserService.getAllUsers).toHaveBeenCalledWith(requester, {
      department: "Support",
      firstName: "Jane",
      role: "admin",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("getUserDetailsController", () => {
  it("reads the id param and returns 200", async () => {
    const res = makeRes();
    vi.mocked(UserService.getUserById).mockResolvedValue({ message: "ok", user: {} } as any);
    const req = { user: requester, normalized: { params: { id: "u1" } }, params: {} } as any;

    UserController.getUserDetailsController(req, res, next);
    await flush();

    expect(UserService.getUserById).toHaveBeenCalledWith("u1", requester);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("updateUserController", () => {
  it("updates the target user and returns 200", async () => {
    const res = makeRes();
    const body = { firstName: "New" };
    vi.mocked(UserService.updateUser).mockResolvedValue({ message: "ok", user: {} } as any);
    const req = { user: requester, normalized: { params: { id: "u1" }, body }, params: {}, body: {} } as any;

    UserController.updateUserController(req, res, next);
    await flush();

    expect(UserService.updateUser).toHaveBeenCalledWith("u1", body, requester);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("deleteUserController", () => {
  it("deletes the target user and returns 200", async () => {
    const res = makeRes();
    vi.mocked(UserService.deleteUser).mockResolvedValue({ message: "deleted" } as any);
    const req = { user: requester, normalized: { params: { id: "u1" } }, params: {} } as any;

    UserController.deleteUserController(req, res, next);
    await flush();

    expect(UserService.deleteUser).toHaveBeenCalledWith("u1", requester);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
