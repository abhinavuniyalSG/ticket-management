import { logger } from "../core/logger.js";
import { UserRepository } from "../database/repositry/user.repository.js";
import { ContactRepository } from "../database/repositry/contact.repository.js";
import { HttpError } from "../utils/httpError.utils.js";
import { roleEnum } from "../types/user.js";
import type { ContactType } from "../types/contact.js";
import type { User } from "../database/models/user.model.js";

export interface AddContactInput {
  contactType: ContactType;
  contactDetail: string;
}

export interface UpdateContactInput {
  contactType?: ContactType;
  contactDetail?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  departmentId?: string | null;
  role?: roleEnum;
  contacts?: Array<{
    contactType: ContactType;
    contactDetail: string;
  }>;
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
}

export class UserService {
  private static sanitizeUser(user: User): Partial<User> {
    const { password, refreshToken, ...sanitized } = user;
    return sanitized;
  }

  public static async getAllUsers(
    requester: RequesterInfo,
    query: UserQueryInput,
  ) {
    if (requester.role === roleEnum.superAdmin) {
      const users = await UserRepository.findAll({
        department: query.department,
        firstName: query.firstName,
        role: query.role,
      });
      return {
        message: "Users fetched successfully",
        users: users.map((u) => UserService.sanitizeUser(u)),
      };
    }

    if (requester.role === roleEnum.admin) {
      const adminUser = await UserRepository.findById(requester.id);
      if (!adminUser?.departmentId) {
        return {
          message: "Users fetched successfully",
          users: [],
        };
      }

      const users = await UserRepository.findAll({
        departmentId: adminUser.departmentId,
        department: query.department,
        firstName: query.firstName,
        role: query.role,
      });
      return {
        message: "Users fetched successfully",
        users: users.map((u) => UserService.sanitizeUser(u)),
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
      if (
        adminUser?.departmentId &&
        adminUser.departmentId === targetUser.departmentId
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

    const updatedUser = await UserRepository.updateUserWithContacts(
      id,
      userUpdates,
      updateData.contacts,
    );

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

    if (requester.role === roleEnum.superAdmin) {
      await UserRepository.deleteUser(id);
        logger.info("User deleted", { userId: id, deletedBy: requester.id });
        return { message: "User deleted successfully" };
    }

    if (requester.role === roleEnum.admin) {
      if (requester.id === targetUser.id) {
        await UserRepository.deleteUser(id);
        logger.info("User deleted", { userId: id, deletedBy: requester.id });
        return { message: "User deleted successfully" };
      }

      const adminUser = await UserRepository.findById(requester.id);
      if (
        adminUser?.departmentId &&
        adminUser.departmentId === targetUser.departmentId
      ) {
        await UserRepository.deleteUser(id);
        logger.info("User deleted", { userId: id, deletedBy: requester.id });
        return { message: "User deleted successfully" };
      }

      throw new HttpError(
        403,
        "Forbidden: cannot delete user outside your department",
      );
    }

    if (requester.role === roleEnum.user) {
      if (requester.id === targetUser.id) {
        await UserRepository.deleteUser(id);
        logger.info("User deleted", { userId: id, deletedBy: requester.id });
        return { message: "User deleted successfully" };
      }

      throw new HttpError(
        403,
        "Forbidden: you can only delete your own account",
      );
    }

    throw new HttpError(403, "Forbidden: insufficient permissions");
  }

  public static async addContact(
    userId: string,
    contactData: AddContactInput,
  ) {
    const existingContact = await ContactRepository.findByTypeAndDetail(
      contactData.contactType,
      contactData.contactDetail,
    );
    if (existingContact) {
      throw new HttpError(409, "Contact with this detail already exists");
    }

    const newContact = await ContactRepository.createContact(
      userId,
      contactData.contactType,
      contactData.contactDetail,
    );

    return {
      message: "Contact added successfully",
      contact: newContact,
    };
  }

  public static async updateContact(
    userId: string,
    contactId: string,
    updates: UpdateContactInput,
  ) {
    const contact = await ContactRepository.findById(contactId);
    if (!contact) {
      throw new HttpError(404, "Contact not found");
    }

    if (contact.userId !== userId) {
      throw new HttpError(
        403,
        "Forbidden: you can only update your own contact",
      );
    }

    const targetType = updates.contactType ?? contact.contactType;
    const targetDetail = updates.contactDetail ?? contact.contactDetail;

    if (
      (updates.contactType && updates.contactType !== contact.contactType) ||
      (updates.contactDetail && updates.contactDetail !== contact.contactDetail)
    ) {
      const existingContact = await ContactRepository.findByTypeAndDetail(
        targetType,
        targetDetail,
      );
      if (existingContact && existingContact.id !== contactId) {
        throw new HttpError(409, "Contact with this detail already exists");
      }
    }

    const updatedContact = await ContactRepository.updateContact(
      contactId,
      updates,
    );

    if (!updatedContact) {
      throw new HttpError(500, "Failed to update contact");
    }

    return {
      message: "Contact updated successfully",
      contact: updatedContact,
    };
  }

  public static async deleteContact(userId: string, contactId: string) {
    const contact = await ContactRepository.findById(contactId);
    if (!contact) {
      throw new HttpError(404, "Contact not found");
    }

    if (contact.userId !== userId) {
      throw new HttpError(
        403,
        "Forbidden: you can only delete your own contact",
      );
    }

    await ContactRepository.deleteContact(contactId);

    return {
      message: "Contact deleted successfully",
    };
  }
}
