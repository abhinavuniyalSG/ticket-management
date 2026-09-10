import { logger } from "../core/logger.js";
import { UserRepository } from "../database/repositry/user.repository.js";
import { DepartmentRepository } from "../database/repositry/department.repository.js";
import { TicketRepository } from "../database/repositry/ticket.repository.js";
import { HttpError } from "../utils/httpError.utils.js";
import { roleEnum } from "../types/user.js";
import type { User } from "../database/models/user.model.js";
import {
  buildPaginationMeta,
  DEFAULT_PAGE,
} from "../utils/pagination.util.js";

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  departmentId?: string | null;
  role?: roleEnum;
}

export interface RequesterInfo {
  id: string;
  email: string;
  role: string;
}

export interface UserQueryInput {
  department?: string | undefined;
  firstName?: string | undefined;
  role?: roleEnum | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export class UserService {
  private static sanitizeUser(user: User): Partial<User> {
    const { password, refreshToken, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Every department id an admin may read tickets/users from: their own home
   * department plus every department where they are set as the manager
   * (Department.managedBy). Not applicable to other roles.
   */
  private static async getAdminScopedDepartmentIds(
    adminId: string,
    adminDepartmentId?: string | null,
  ): Promise<string[]> {
    const managedDepartments = await DepartmentRepository.findByManager(adminId);
    return Array.from(
      new Set(
        [adminDepartmentId, ...managedDepartments.map((d) => d.departmentId)].filter(
          (departmentId): departmentId is string => Boolean(departmentId),
        ),
      ),
    );
  }

  public static async getAllUsers(
    requester: RequesterInfo,
    query: UserQueryInput,
  ) {
    const page = query.page ?? DEFAULT_PAGE;
    // Left undefined when the caller doesn't send a limit: the repository
    // only paginates when both page and limit are set, so this returns
    // every matching user in one response instead of defaulting to 20.
    const limit = query.limit;

    if (requester.role === roleEnum.superAdmin) {
      const { data: users, total } = await UserRepository.findAll({
        department: query.department,
        firstName: query.firstName,
        role: query.role,
        page,
        limit,
      });
      return {
        message: "Users fetched successfully",
        users: users.map((u) => UserService.sanitizeUser(u)),
        pagination: buildPaginationMeta(total, page, limit ?? total),
      };
    }

    if (requester.role === roleEnum.admin) {
      const adminUser = await UserRepository.findById(requester.id);
      const scopedDepartmentIds = await this.getAdminScopedDepartmentIds(
        requester.id,
        adminUser?.departmentId,
      );

      if (scopedDepartmentIds.length === 0) {
        return {
          message: "Users fetched successfully",
          users: [],
          pagination: buildPaginationMeta(0, page, limit ?? 0),
        };
      }

      const { data: users, total } = await UserRepository.findAll({
        departmentId: scopedDepartmentIds,
        department: query.department,
        firstName: query.firstName,
        role: query.role,
        page,
        limit,
      });
      return {
        message: "Users fetched successfully",
        users: users.map((u) => UserService.sanitizeUser(u)),
        pagination: buildPaginationMeta(total, page, limit ?? total),
      };
    }

    throw new HttpError(403, "Forbidden: insufficient permissions");
  }

  public static async getUserById(id: string, requester: RequesterInfo) {
    const targetUser = await UserRepository.findById(id);

    if (!targetUser) {
      throw new HttpError(404, "User not found");
    }

    if (requester.role === roleEnum.superAdmin) {
      return {
        message: "User details fetched successfully",
        user: UserService.sanitizeUser(targetUser),
      };
    }

    if (requester.role === roleEnum.admin) {
      if (requester.id === targetUser.id) {
        return {
          message: "User details fetched successfully",
          user: UserService.sanitizeUser(targetUser),
        };
      }

      const adminUser = await UserRepository.findById(requester.id);
      const scopedDepartmentIds = await this.getAdminScopedDepartmentIds(
        requester.id,
        adminUser?.departmentId,
      );

      if (
        targetUser.departmentId &&
        scopedDepartmentIds.includes(targetUser.departmentId)
      ) {
        return {
          message: "User details fetched successfully",
          user: UserService.sanitizeUser(targetUser),
        };
      }

      throw new HttpError(
        403,
        "Forbidden: cannot view user from another department",
      );
    }

    if (requester.role === roleEnum.user) {
      if (requester.id === targetUser.id) {
        return {
          message: "User details fetched successfully",
          user: UserService.sanitizeUser(targetUser),
        };
      }

      throw new HttpError(403, "Forbidden: you can only view your own details");
    }

    throw new HttpError(403, "Forbidden: insufficient permissions");
  }

  public static async updateUser(
    id: string,
    updateData: UpdateUserInput,
    requester: RequesterInfo,
  ) {
    const targetUser = await UserRepository.findById(id);

    if (!targetUser) {
      throw new HttpError(404, "User not found");
    }

    const requesterUser = await UserRepository.findById(requester.id);

    const isChangingName =
      updateData.firstName !== undefined || updateData.lastName !== undefined;

    if (isChangingName && requester.id !== targetUser.id) {
      throw new HttpError(
        403,
        "Forbidden: you can only change your own first or last name",
      );
    }

    if (requester.role === roleEnum.user) {
      if (requester.id !== targetUser.id) {
        throw new HttpError(
          403,
          "Forbidden: you can only update your own details",
        );
      }
      if (updateData.departmentId !== undefined) {
        throw new HttpError(403, "Forbidden: users cannot modify department");
      }
      if (updateData.role !== undefined) {
        throw new HttpError(403, "Forbidden: users cannot modify role");
      }
    } else if (requester.role === roleEnum.admin) {
      if (requester.id === targetUser.id) {
        if (updateData.departmentId !== undefined) {
          throw new HttpError(
            403,
            "Forbidden: admins cannot modify their own department",
          );
        }
      } else {
        if (
          !requesterUser?.departmentId ||
          requesterUser.departmentId !== targetUser.departmentId
        ) {
          throw new HttpError(
            403,
            "Forbidden: cannot edit user from another department",
          );
        }
      }
      if (updateData.role !== undefined) {
        throw new HttpError(403, "Forbidden: only super_admin can modify roles");
      }
    } else if (requester.role !== roleEnum.superAdmin) {
      throw new HttpError(403, "Forbidden: insufficient permissions");
    }

    // A department may have at most one admin. Check whenever the update
    // would leave the target user as an admin of a department, whether that's
    // because the role is becoming admin, the department is changing, or both.
    const effectiveRole = updateData.role ?? targetUser.role;
    const effectiveDepartmentId =
      updateData.departmentId !== undefined
        ? updateData.departmentId
        : targetUser.departmentId;

    if (effectiveRole === roleEnum.admin && effectiveDepartmentId) {
      const departmentAdmins = await UserRepository.findByRoleAndDepartment(
        roleEnum.admin,
        effectiveDepartmentId,
      );
      const conflictingAdmin = departmentAdmins.find(
        (existingAdmin) => existingAdmin.id !== targetUser.id,
      );
      if (conflictingAdmin) {
        throw new HttpError(
          409,
          "This department already has an admin. Reassign or remove the existing admin before assigning another.",
        );
      }
    }

    const userUpdates: Partial<User> = {};

    if (updateData.firstName !== undefined) {
      userUpdates.firstName = updateData.firstName;
    }
    if (updateData.lastName !== undefined) {
      userUpdates.lastName = updateData.lastName;
    }
    if (updateData.departmentId !== undefined) {
      userUpdates.departmentId = updateData.departmentId;
    }
    if (updateData.role !== undefined) {
      userUpdates.role = updateData.role;
    }

    const updatedUser = await UserRepository.updateUser(id, userUpdates);

    if (!updatedUser) {
      throw new HttpError(500, "Failed to update user");
    }

    logger.info("User updated successfully", { userId: id, updatedBy: requester.id });

    return {
      message: "User updated successfully",
      user: UserService.sanitizeUser(updatedUser),
    };
  }

  public static async deleteUser(id: string, requester: RequesterInfo) {
    const targetUser = await UserRepository.findById(id);

    if (!targetUser) {
      throw new HttpError(404, "User not found");
    }

    let isAllowed = false;
    let forbiddenMessage = "Forbidden: insufficient permissions";

    if (requester.role === roleEnum.superAdmin) {
      isAllowed = true;
    } else if (requester.role === roleEnum.admin) {
      forbiddenMessage = "Forbidden: cannot delete user outside your department";

      if (requester.id === targetUser.id) {
        isAllowed = true;
      } else {
        const adminUser = await UserRepository.findById(requester.id);
        const isSameDept =
          Boolean(adminUser?.departmentId) &&
          adminUser?.departmentId === targetUser.departmentId;

        // An admin set as a department's manager (Department.managedBy) may
        // also delete users in that department, even if it isn't their own
        // home department - mirrors the same scoping used for tickets.
        const managesTargetDepartment =
          targetUser.department?.managedBy === requester.id;

        isAllowed = isSameDept || managesTargetDepartment;
      }
    } else if (requester.role === roleEnum.user) {
      forbiddenMessage = "Forbidden: you can only delete your own account";
      isAllowed = requester.id === targetUser.id;
    }

    if (!isAllowed) {
      throw new HttpError(403, forbiddenMessage);
    }

    // ticket.createdById is onDelete: "RESTRICT", so the DB itself refuses to
    // delete a user who has created any ticket. Check for that up front and
    // reject with a clear message instead of letting a foreign key violation
    // reach the client as an opaque 500.
    const createdTicketCount = await TicketRepository.countByCreator(id);
    if (createdTicketCount > 0) {
      throw new HttpError(
        409,
        `Cannot delete this user: they have created ${createdTicketCount} ticket${
          createdTicketCount === 1 ? "" : "s"
        }. Reassign or delete those tickets first.`,
      );
    }

    await UserRepository.deleteUser(id);
    logger.info("User deleted", { userId: id, deletedBy: requester.id });
    return { message: "User deleted successfully" };
  }
}
