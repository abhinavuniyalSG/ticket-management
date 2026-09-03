import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserController } from "./user.controller.js";
import { UserService } from "../services/user.service.js";

vi.mock("../services/user.service.js", () => ({
  UserService: {
    getAllUsers: vi.fn(),
    getUserById: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    addContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
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

describe("addContactController", () => {
  it("uses req.user.id as the contact owner and returns 201", async () => {
    const res = makeRes();
    const body = { contactType: "phone", contactDetail: "12345" };
    vi.mocked(UserService.addContact).mockResolvedValue({ message: "added", contact: {} } as any);
    const req = { user: requester, normalized: { body }, body: {} } as any;

    UserController.addContactController(req, res, next);
    await flush();

    expect(UserService.addContact).toHaveBeenCalledWith("user-1", body);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("falls back to an empty string when there is no authenticated user", async () => {
    const res = makeRes();
    vi.mocked(UserService.addContact).mockResolvedValue({ message: "added", contact: {} } as any);
    const req = { normalized: { body: {} }, body: {} } as any;

    UserController.addContactController(req, res, next);
    await flush();

    expect(UserService.addContact).toHaveBeenCalledWith("", {});
  });
});

describe("updateContactController", () => {
  it("scopes the update to the requesting user and the given contact id", async () => {
    const res = makeRes();
    const updates = { contactDetail: "99999" };
    vi.mocked(UserService.updateContact).mockResolvedValue({ message: "updated", contact: {} } as any);
    const req = {
      user: requester,
      normalized: { params: { contactId: "c1" }, body: updates },
      params: {},
      body: {},
    } as any;

    UserController.updateContactController(req, res, next);
    await flush();

    expect(UserService.updateContact).toHaveBeenCalledWith("user-1", "c1", updates);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("deleteContactController", () => {
  it("scopes the deletion to the requesting user and the given contact id", async () => {
    const res = makeRes();
    vi.mocked(UserService.deleteContact).mockResolvedValue({ message: "deleted" } as any);
    const req = { user: requester, normalized: { params: { contactId: "c1" } }, params: {} } as any;

    UserController.deleteContactController(req, res, next);
    await flush();

    expect(UserService.deleteContact).toHaveBeenCalledWith("user-1", "c1");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
