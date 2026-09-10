import { DepartmentRepository } from "../database/repositry/department.repository.js";
import { UserRepository } from "../database/repositry/user.repository.js";
import { HttpError } from "../utils/httpError.utils.js";
import { roleEnum } from "../types/user.js";
import type { Department } from "../database/models/department.model.js";
import { logger } from "../core/logger.js";
import type { RequesterInfo } from "./user.service.js";
import {
  buildPaginationMeta,
  DEFAULT_PAGE,
} from "../utils/pagination.util.js";

export interface CreateDepartmentInput {
  departmentName: string;
  departmentEmail: string;
  managedBy?: string | null;
}

export interface UpdateDepartmentInput {
  departmentName?: string;
  departmentEmail?: string;
  managedBy?: string | null;
}

export interface DepartmentQueryInput {
  departmentName?: string;
  page?: number;
  limit?: number;
}

export class DepartmentService {
  /**
   * The frontend only lets super_admin into the departments section
   * (constants/navigation.ts restricts that nav item to super_admin), but
   * viewing a department is open to every authenticated role so a regular
   * user can populate a department picker when filing a ticket. Without this
   * check, that same open GET was handing every role the manager's full name
   * and email - visible via a direct API call even though the UI hides it.
   * Everyone still gets id/name/email/managedBy (the department id is used
   * elsewhere, e.g. an admin's own "do I manage this department" checks);
   * only the nested manager user record is restricted.
   */
  private static sanitizeDepartment(
    department: Department,
    requester: RequesterInfo,
  ) {
    const { manager, ...rest } = department;

    if (manager && requester.role === roleEnum.superAdmin) {
      const { password, refreshToken, ...sanitizedManager } = manager as any;
      return { ...rest, manager: sanitizedManager };
    }

    return rest;
  }

  /**
   * Validates that managedBy references an existing user with role admin or super_admin.
   */
  private static async validateManager(managedBy: string): Promise<void> {
    const managerUser = await UserRepository.findById(managedBy);

    if (!managerUser) {
      throw new HttpError(404, "Manager user not found");
    }

    if (
      managerUser.role !== roleEnum.admin &&
      managerUser.role !== roleEnum.superAdmin
    ) {
      throw new HttpError(400, "Manager must have role admin or super_admin");
    }
  }

  /**
   * Only super_admin can create a department.
   * managedBy is optional; if provided, the referenced user must have role admin or super_admin.
   */
  public static async createDepartment(
    requester: RequesterInfo,
    input: CreateDepartmentInput,
  ) {
    if (requester.role !== roleEnum.superAdmin) {
      throw new HttpError(
        403,
        "Forbidden: only super_admin can create departments",
      );
    }

    // Check uniqueness of department name
    const existingByName = await DepartmentRepository.findByName(
      input.departmentName,
    );
    if (existingByName) {
      throw new HttpError(409, "A department with this name already exists");
    }

    // Check uniqueness of department email
    const existingByEmail = await DepartmentRepository.findByEmail(
      input.departmentEmail,
    );
    if (existingByEmail) {
      throw new HttpError(409, "A department with this email already exists");
    }

    // Validate managedBy if provided
    if (input.managedBy) {
      await this.validateManager(input.managedBy);
    }

    const departmentData: Partial<Department> = {
      departmentName: input.departmentName,
      departmentEmail: input.departmentEmail,
      managedBy: input.managedBy ?? null,
    };

    const department =
      await DepartmentRepository.createDepartment(departmentData);

    logger.info("Department created", {
      departmentId: department.departmentId,
      departmentName: department.departmentName,
      createdBy: requester.id,
    });

    // Re-fetch to include manager relation
    const fullDepartment = await DepartmentRepository.findById(
      department.departmentId,
    );

    return {
      message: "Department created successfully",
      department: fullDepartment
        ? this.sanitizeDepartment(fullDepartment, requester)
        : department,
    };
  }

  /**
   * Any authenticated role can view all departments (manager details are
   * redacted for anyone but super_admin - see sanitizeDepartment).
   */
  public static async getAllDepartments(
    requester: RequesterInfo,
    query: DepartmentQueryInput = {},
  ) {
    const page = query.page ?? DEFAULT_PAGE;
    // Left undefined when the caller doesn't send a limit: the repository
    // only paginates when both page and limit are set, so this returns
    // every matching department in one response instead of defaulting to 20.
    const limit = query.limit;

    const { data: departments, total } = await DepartmentRepository.findAll({
      departmentName: query.departmentName,
      page,
      limit,
    });

    return {
      message: "Departments fetched successfully",
      departments: departments.map((d) => this.sanitizeDepartment(d, requester)),
      pagination: buildPaginationMeta(total, page, limit ?? total),
    };
  }

  /**
   * Any authenticated role can view a department's details (manager details
   * are redacted for anyone but super_admin - see sanitizeDepartment).
   */
  public static async getDepartmentById(requester: RequesterInfo, id: string) {
    const department = await DepartmentRepository.findById(id);

    if (!department) {
      throw new HttpError(404, "Department not found");
    }

    return {
      message: "Department details fetched successfully",
      department: this.sanitizeDepartment(department, requester),
    };
  }

  /**
   * Only super_admin can update a department.
   * If managedBy is updated, the referenced user must have role admin or super_admin.
   */
  public static async updateDepartment(
    requester: RequesterInfo,
    id: string,
    input: UpdateDepartmentInput,
  ) {
    if (requester.role !== roleEnum.superAdmin) {
      throw new HttpError(
        403,
        "Forbidden: only super_admin can update departments",
      );
    }

    const existingDepartment = await DepartmentRepository.findById(id);
    if (!existingDepartment) {
      throw new HttpError(404, "Department not found");
    }

    // Check uniqueness of new name if provided
    if (
      input.departmentName &&
      input.departmentName !== existingDepartment.departmentName
    ) {
      const existingByName = await DepartmentRepository.findByName(
        input.departmentName,
      );
      if (existingByName) {
        throw new HttpError(409, "A department with this name already exists");
      }
    }

    // Check uniqueness of new email if provided
    if (
      input.departmentEmail &&
      input.departmentEmail !== existingDepartment.departmentEmail
    ) {
      const existingByEmail = await DepartmentRepository.findByEmail(
        input.departmentEmail,
      );
      if (existingByEmail) {
        throw new HttpError(409, "A department with this email already exists");
      }
    }

    // Validate managedBy if provided (non-null)
    if (input.managedBy) {
      await this.validateManager(input.managedBy);
    }

    const updateData: Partial<Department> = {};

    if (input.departmentName !== undefined) {
      updateData.departmentName = input.departmentName;
    }
    if (input.departmentEmail !== undefined) {
      updateData.departmentEmail = input.departmentEmail;
    }
    if (input.managedBy !== undefined) {
      updateData.managedBy = input.managedBy;
    }

    const updatedDepartment = await DepartmentRepository.updateDepartment(
      id,
      updateData,
    );

    if (!updatedDepartment) {
      throw new HttpError(500, "Failed to update department");
    }

    logger.info("Department updated", {
      departmentId: id,
      updatedFields: Object.keys(updateData),
      updatedBy: requester.id,
    });

    return {
      message: "Department updated successfully",
      department: this.sanitizeDepartment(updatedDepartment, requester),
    };
  }

  /**
   * Only super_admin can delete a department.
   */
  public static async deleteDepartment(requester: RequesterInfo, id: string) {
    if (requester.role !== roleEnum.superAdmin) {
      throw new HttpError(
        403,
        "Forbidden: only super_admin can delete departments",
      );
    }

    const existingDepartment = await DepartmentRepository.findById(id);
    if (!existingDepartment) {
      throw new HttpError(404, "Department not found");
    }

    const deleted = await DepartmentRepository.deleteDepartment(id);

    if (!deleted) {
      throw new HttpError(500, "Failed to delete department");
    }

    logger.info("Department deleted", {
      departmentId: id,
      departmentName: existingDepartment.departmentName,
      deletedBy: requester.id,
    });

    return {
      message: "Department deleted successfully",
    };
  }
}
