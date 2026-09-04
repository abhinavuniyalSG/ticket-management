import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "./user.service.js";
import { UserRepository } from "../database/repositry/user.repository.js";
import { ContactRepository } from "../database/repositry/contact.repository.js";
import { DepartmentRepository } from "../database/repositry/department.repository.js";
import { roleEnum } from "../types/user.js";
import type { RequesterInfo } from "./user.service.js";

vi.mock("../database/repositry/user.repository.js", () => ({
  UserRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByRoleAndDepartment: vi.fn(),
    updateUserWithContacts: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

vi.mock("../database/repositry/contact.repository.js", () => ({
  ContactRepository: {
    findByTypeAndDetail: vi.fn(),
    createContact: vi.fn(),
    findById: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
  },
}));

vi.mock("../database/repositry/department.repository.js", () => ({
  DepartmentRepository: {
    findByManager: vi.fn(),
  },
}));

vi.mock("../core/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const DEPT_A = "dept-a";
const DEPT_B = "dept-b";

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    role: roleEnum.user,
    departmentId: DEPT_A,
    password: "hashed",
    refreshToken: "rt",
    ...overrides,
  } as any;
}

function requester(overrides: Partial<RequesterInfo> = {}): RequesterInfo {
  return { id: "user-1", email: "jane@example.com", role: roleEnum.user, ...overrides };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(UserRepository.findByRoleAndDepartment).mockResolvedValue([]);
  vi.mocked(DepartmentRepository.findByManager).mockResolvedValue([]);
});

describe("getAllUsers", () => {
  it("returns every user for a super_admin", async () => {
    vi.mocked(UserRepository.findAll).mockResolvedValue([makeUser()]);

    const result = await UserService.getAllUsers(requester({ role: roleEnum.superAdmin }), {});

    expect(result.users).toHaveLength(1);
    expect(UserRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ department: undefined, firstName: undefined, role: undefined }),
    );
  });

  it("scopes results to the admin's own department", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "admin-1", departmentId: DEPT_A }));
    vi.mocked(UserRepository.findAll).mockResolvedValue([]);

    await UserService.getAllUsers(requester({ id: "admin-1", role: roleEnum.admin }), {});

    expect(UserRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: [DEPT_A] }),
    );
  });

  it("also includes departments the admin manages, even if outside their own department", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "admin-1", departmentId: DEPT_A }));
    vi.mocked(DepartmentRepository.findByManager).mockResolvedValue([
      { departmentId: DEPT_B } as any,
    ]);
    vi.mocked(UserRepository.findAll).mockResolvedValue([]);

    await UserService.getAllUsers(requester({ id: "admin-1", role: roleEnum.admin }), {});

    expect(UserRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: expect.arrayContaining([DEPT_A, DEPT_B]) }),
    );
  });

  it("returns an empty list when the admin has no home department and manages none", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "admin-1", departmentId: null }));

    const result = await UserService.getAllUsers(requester({ id: "admin-1", role: roleEnum.admin }), {});

    expect(result.users).toEqual([]);
    expect(UserRepository.findAll).not.toHaveBeenCalled();
  });

  it("lists users from a managed department even when the admin has no home department", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "admin-1", departmentId: null }));
    vi.mocked(DepartmentRepository.findByManager).mockResolvedValue([
      { departmentId: DEPT_B } as any,
    ]);
    vi.mocked(UserRepository.findAll).mockResolvedValue([]);

    await UserService.getAllUsers(requester({ id: "admin-1", role: roleEnum.admin }), {});

    expect(UserRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: [DEPT_B] }),
    );
  });

  it("blocks a regular user from listing users", async () => {
    await expect(UserService.getAllUsers(requester(), {})).rejects.toMatchObject({ statusCode: 403 });
  });

  it("strips password and refreshToken from returned users", async () => {
    vi.mocked(UserRepository.findAll).mockResolvedValue([makeUser()]);

    const result = await UserService.getAllUsers(requester({ role: roleEnum.superAdmin }), {});

    expect(result.users[0]).not.toHaveProperty("password");
    expect(result.users[0]).not.toHaveProperty("refreshToken");
  });
});

describe("getUserById", () => {
  it("throws 404 when the target user doesn't exist", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(null);

    await expect(UserService.getUserById("missing", requester())).rejects.toMatchObject({ statusCode: 404 });
  });

  it("lets a super_admin view any user", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "target-1" }));

    const result = await UserService.getUserById(
      "target-1",
      requester({ role: roleEnum.superAdmin }),
    );

    expect(result.user.id).toBe("target-1");
  });

  it("lets an admin view their own details", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "admin-1" }));

    const result = await UserService.getUserById(
      "admin-1",
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.user.id).toBe("admin-1");
  });

  it("lets an admin view a same-department user", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "target-1", departmentId: DEPT_A }))
      .mockResolvedValueOnce(makeUser({ id: "admin-1", departmentId: DEPT_A }));

    const result = await UserService.getUserById(
      "target-1",
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.user.id).toBe("target-1");
  });

  it("blocks an admin from viewing a user in another department", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "target-1", departmentId: DEPT_B }))
      .mockResolvedValueOnce(makeUser({ id: "admin-1", departmentId: DEPT_A }));

    await expect(
      UserService.getUserById("target-1", requester({ id: "admin-1", role: roleEnum.admin })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("lets an admin view a user in a department they manage, even if it isn't their home department", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "target-1", departmentId: DEPT_B }))
      .mockResolvedValueOnce(makeUser({ id: "admin-1", departmentId: DEPT_A }));
    vi.mocked(DepartmentRepository.findByManager).mockResolvedValue([
      { departmentId: DEPT_B } as any,
    ]);

    const result = await UserService.getUserById(
      "target-1",
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.user.id).toBe("target-1");
  });

  it("lets a regular user view their own details", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));

    const result = await UserService.getUserById("user-1", requester({ id: "user-1" }));

    expect(result.user.id).toBe("user-1");
  });

  it("blocks a regular user from viewing someone else's details", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "other-1" }));

    await expect(
      UserService.getUserById("other-1", requester({ id: "user-1" })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe("updateUser", () => {
  it("throws 404 when the target user doesn't exist", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(null);

    await expect(
      UserService.updateUser("missing", { firstName: "New" }, requester()),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("blocks a regular user from updating someone else", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "other-1" }))
      .mockResolvedValueOnce(makeUser({ id: "user-1" }));

    await expect(
      UserService.updateUser("other-1", { firstName: "New" }, requester({ id: "user-1" })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks a regular user from changing their own department", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "user-1" }))
      .mockResolvedValueOnce(makeUser({ id: "user-1" }));

    await expect(
      UserService.updateUser("user-1", { departmentId: DEPT_B }, requester({ id: "user-1" })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks a regular user from changing their own role", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "user-1" }))
      .mockResolvedValueOnce(makeUser({ id: "user-1" }));

    await expect(
      UserService.updateUser("user-1", { role: roleEnum.admin }, requester({ id: "user-1" })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks an admin from changing their own department", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "admin-1", role: roleEnum.admin }))
      .mockResolvedValueOnce(makeUser({ id: "admin-1", role: roleEnum.admin }));

    await expect(
      UserService.updateUser("admin-1", { departmentId: DEPT_B }, requester({ id: "admin-1", role: roleEnum.admin })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks an admin from editing a user outside their department", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "target-1", departmentId: DEPT_B }))
      .mockResolvedValueOnce(makeUser({ id: "admin-1", departmentId: DEPT_A }));

    // Uses a non-name field so this exercises the cross-department gate specifically,
    // not the separate "can only change your own name" rule.
    await expect(
      UserService.updateUser("target-1", { contacts: [] }, requester({ id: "admin-1", role: roleEnum.admin })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks an admin from changing another user's role", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "target-1", departmentId: DEPT_A }))
      .mockResolvedValueOnce(makeUser({ id: "admin-1", departmentId: DEPT_A }));

    await expect(
      UserService.updateUser(
        "target-1",
        { role: roleEnum.admin },
        requester({ id: "admin-1", role: roleEnum.admin }),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("lets a super_admin change a user's role and department", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "target-1" }))
      .mockResolvedValueOnce(makeUser({ id: "super-1", role: roleEnum.superAdmin }));
    vi.mocked(UserRepository.updateUserWithContacts).mockResolvedValue(
      makeUser({ id: "target-1", role: roleEnum.admin, departmentId: DEPT_B }),
    );

    const result = await UserService.updateUser(
      "target-1",
      { role: roleEnum.admin, departmentId: DEPT_B },
      requester({ id: "super-1", role: roleEnum.superAdmin }),
    );

    expect(result.user.role).toBe(roleEnum.admin);
    expect(UserRepository.updateUserWithContacts).toHaveBeenCalledWith(
      "target-1",
      expect.objectContaining({ role: roleEnum.admin, departmentId: DEPT_B }),
      undefined,
    );
  });

  it("blocks any actor, including super_admin, from changing someone else's name", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "target-1" }))
      .mockResolvedValueOnce(makeUser({ id: "super-1", role: roleEnum.superAdmin }));

    await expect(
      UserService.updateUser(
        "target-1",
        { firstName: "New" },
        requester({ id: "super-1", role: roleEnum.superAdmin }),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(UserRepository.updateUserWithContacts).not.toHaveBeenCalled();
  });

  it("blocks an admin from changing someone else's last name too", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "target-1", departmentId: DEPT_A }))
      .mockResolvedValueOnce(makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A }));

    await expect(
      UserService.updateUser(
        "target-1",
        { lastName: "New" },
        requester({ id: "admin-1", role: roleEnum.admin }),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("lets a user change their own name", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "user-1" }))
      .mockResolvedValueOnce(makeUser({ id: "user-1" }));
    vi.mocked(UserRepository.updateUserWithContacts).mockResolvedValue(
      makeUser({ id: "user-1", firstName: "New" }),
    );

    const result = await UserService.updateUser(
      "user-1",
      { firstName: "New" },
      requester({ id: "user-1" }),
    );

    expect(result.user.firstName).toBe("New");
  });

  it("lets a super_admin change their own name", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "super-1", role: roleEnum.superAdmin }))
      .mockResolvedValueOnce(makeUser({ id: "super-1", role: roleEnum.superAdmin }));
    vi.mocked(UserRepository.updateUserWithContacts).mockResolvedValue(
      makeUser({ id: "super-1", role: roleEnum.superAdmin, firstName: "New" }),
    );

    const result = await UserService.updateUser(
      "super-1",
      { firstName: "New" },
      requester({ id: "super-1", role: roleEnum.superAdmin }),
    );

    expect(result.user.firstName).toBe("New");
  });

  it("blocks promoting a second user to admin in a department that already has one", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "target-1", departmentId: DEPT_A }))
      .mockResolvedValueOnce(makeUser({ id: "super-1", role: roleEnum.superAdmin }));
    vi.mocked(UserRepository.findByRoleAndDepartment).mockResolvedValue([
      makeUser({ id: "existing-admin", role: roleEnum.admin, departmentId: DEPT_A }),
    ]);

    await expect(
      UserService.updateUser(
        "target-1",
        { role: roleEnum.admin },
        requester({ id: "super-1", role: roleEnum.superAdmin }),
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(UserRepository.updateUserWithContacts).not.toHaveBeenCalled();
  });

  it("blocks moving an existing admin into a department that already has a different admin", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "target-1", role: roleEnum.admin, departmentId: DEPT_A }))
      .mockResolvedValueOnce(makeUser({ id: "super-1", role: roleEnum.superAdmin }));
    vi.mocked(UserRepository.findByRoleAndDepartment).mockResolvedValue([
      makeUser({ id: "existing-admin", role: roleEnum.admin, departmentId: DEPT_B }),
    ]);

    await expect(
      UserService.updateUser(
        "target-1",
        { departmentId: DEPT_B },
        requester({ id: "super-1", role: roleEnum.superAdmin }),
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("allows re-saving an admin's other fields without tripping the one-admin-per-department rule on themselves", async () => {
    const existingAdmin = makeUser({ id: "admin-1", role: roleEnum.admin, departmentId: DEPT_A });
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(existingAdmin)
      .mockResolvedValueOnce(existingAdmin);
    // The only admin found in the department is the target themselves, so this must not conflict.
    vi.mocked(UserRepository.findByRoleAndDepartment).mockResolvedValue([existingAdmin]);
    vi.mocked(UserRepository.updateUserWithContacts).mockResolvedValue(existingAdmin);

    const result = await UserService.updateUser(
      "admin-1",
      { firstName: "Same" },
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.message).toBe("User updated successfully");
  });

  it("allows promoting a user to admin in a department with no existing admin", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "target-1", departmentId: DEPT_A }))
      .mockResolvedValueOnce(makeUser({ id: "super-1", role: roleEnum.superAdmin }));
    vi.mocked(UserRepository.findByRoleAndDepartment).mockResolvedValue([]);
    vi.mocked(UserRepository.updateUserWithContacts).mockResolvedValue(
      makeUser({ id: "target-1", role: roleEnum.admin, departmentId: DEPT_A }),
    );

    const result = await UserService.updateUser(
      "target-1",
      { role: roleEnum.admin },
      requester({ id: "super-1", role: roleEnum.superAdmin }),
    );

    expect(result.user.role).toBe(roleEnum.admin);
  });

  it("throws 500 when the update fails to return an updated user", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "user-1" }))
      .mockResolvedValueOnce(makeUser({ id: "user-1" }));
    vi.mocked(UserRepository.updateUserWithContacts).mockResolvedValue(null);

    await expect(
      UserService.updateUser("user-1", { firstName: "New" }, requester({ id: "user-1" })),
    ).rejects.toMatchObject({ statusCode: 500 });
  });
});

describe("deleteUser", () => {
  it("throws 404 when the target user doesn't exist", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(null);

    await expect(UserService.deleteUser("missing", requester())).rejects.toMatchObject({ statusCode: 404 });
  });

  it("lets a super_admin delete anyone", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "target-1" }));
    vi.mocked(UserRepository.deleteUser).mockResolvedValue(true);

    const result = await UserService.deleteUser(
      "target-1",
      requester({ id: "super-1", role: roleEnum.superAdmin }),
    );

    expect(result.message).toBe("User deleted successfully");
  });

  it("lets an admin delete their own account", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "admin-1" }));
    vi.mocked(UserRepository.deleteUser).mockResolvedValue(true);

    const result = await UserService.deleteUser(
      "admin-1",
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.message).toBe("User deleted successfully");
  });

  it("lets an admin delete a same-department user", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "target-1", departmentId: DEPT_A }))
      .mockResolvedValueOnce(makeUser({ id: "admin-1", departmentId: DEPT_A }));
    vi.mocked(UserRepository.deleteUser).mockResolvedValue(true);

    const result = await UserService.deleteUser(
      "target-1",
      requester({ id: "admin-1", role: roleEnum.admin }),
    );

    expect(result.message).toBe("User deleted successfully");
  });

  it("blocks an admin from deleting a user outside their department", async () => {
    vi.mocked(UserRepository.findById)
      .mockResolvedValueOnce(makeUser({ id: "target-1", departmentId: DEPT_B }))
      .mockResolvedValueOnce(makeUser({ id: "admin-1", departmentId: DEPT_A }));

    await expect(
      UserService.deleteUser("target-1", requester({ id: "admin-1", role: roleEnum.admin })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("lets a regular user delete their own account", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "user-1" }));
    vi.mocked(UserRepository.deleteUser).mockResolvedValue(true);

    const result = await UserService.deleteUser("user-1", requester({ id: "user-1" }));

    expect(result.message).toBe("User deleted successfully");
  });

  it("blocks a regular user from deleting someone else's account", async () => {
    vi.mocked(UserRepository.findById).mockResolvedValue(makeUser({ id: "other-1" }));

    await expect(
      UserService.deleteUser("other-1", requester({ id: "user-1" })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe("contacts", () => {
  it("blocks adding a contact with a duplicate type+detail", async () => {
    vi.mocked(ContactRepository.findByTypeAndDetail).mockResolvedValue({ id: "existing" } as any);

    await expect(
      UserService.addContact("user-1", { contactType: "phone" as any, contactDetail: "12345" }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("adds a contact when no duplicate exists", async () => {
    vi.mocked(ContactRepository.findByTypeAndDetail).mockResolvedValue(null);
    vi.mocked(ContactRepository.createContact).mockResolvedValue({ id: "new-contact" } as any);

    const result = await UserService.addContact("user-1", {
      contactType: "phone" as any,
      contactDetail: "12345",
    });

    expect(result.contact).toEqual({ id: "new-contact" });
  });

  it("throws 404 when updating a contact that doesn't exist", async () => {
    vi.mocked(ContactRepository.findById).mockResolvedValue(null);

    await expect(
      UserService.updateContact("user-1", "contact-1", { contactDetail: "new" }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("blocks updating a contact owned by a different user", async () => {
    vi.mocked(ContactRepository.findById).mockResolvedValue({ id: "contact-1", userId: "someone-else" } as any);

    await expect(
      UserService.updateContact("user-1", "contact-1", { contactDetail: "new" }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks updating a contact into a value that collides with another existing contact", async () => {
    vi.mocked(ContactRepository.findById).mockResolvedValue({
      id: "contact-1",
      userId: "user-1",
      contactType: "phone",
      contactDetail: "12345",
    } as any);
    vi.mocked(ContactRepository.findByTypeAndDetail).mockResolvedValue({ id: "other-contact" } as any);

    await expect(
      UserService.updateContact("user-1", "contact-1", { contactDetail: "99999" }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("updates a contact when there's no collision", async () => {
    vi.mocked(ContactRepository.findById).mockResolvedValue({
      id: "contact-1",
      userId: "user-1",
      contactType: "phone",
      contactDetail: "12345",
    } as any);
    vi.mocked(ContactRepository.updateContact).mockResolvedValue({
      id: "contact-1",
      contactDetail: "99999",
    } as any);

    const result = await UserService.updateContact("user-1", "contact-1", { contactDetail: "99999" });

    expect(result.contact.contactDetail).toBe("99999");
  });

  it("throws 404 when deleting a contact that doesn't exist", async () => {
    vi.mocked(ContactRepository.findById).mockResolvedValue(null);

    await expect(UserService.deleteContact("user-1", "contact-1")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("blocks deleting a contact owned by a different user", async () => {
    vi.mocked(ContactRepository.findById).mockResolvedValue({ id: "contact-1", userId: "someone-else" } as any);

    await expect(UserService.deleteContact("user-1", "contact-1")).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("deletes a contact owned by the requesting user", async () => {
    vi.mocked(ContactRepository.findById).mockResolvedValue({ id: "contact-1", userId: "user-1" } as any);
    vi.mocked(ContactRepository.deleteContact).mockResolvedValue(true);

    const result = await UserService.deleteContact("user-1", "contact-1");

    expect(result.message).toBe("Contact deleted successfully");
  });
});
