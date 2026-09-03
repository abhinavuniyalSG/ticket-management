import { TicketRepository } from "../database/repositry/ticket.repository.js";
import { UserRepository } from "../database/repositry/user.repository.js";
import { DepartmentRepository } from "../database/repositry/department.repository.js";
import { HttpError } from "../utils/httpError.utils.js";
import { roleEnum } from "../types/user.js";
import { TicketPriority, TicketStatus } from "../types/ticket.js";
import { Ticket } from "../database/models/ticket.model.js";
import { logger } from "../core/logger.js";
import { NotificationService } from "./notification.service.js";

export interface CreateTicketInput {
  title: string;
  description: string;
  departmentId: string;
  priority?: TicketPriority;
  assignedToId?: string | null;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedToId?: string | null;
}

export interface TicketQueryInput {
  title?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  departmentId?: string;
  assignedToId?: string;
  createdById?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: "createdAt" | "updatedAt" | "priority" | "status";
  sortOrder?: "asc" | "desc" | "ASC" | "DESC";
}

export interface RequesterInfo {
  id: string;
  email: string;
  role: string;
}

export class TicketService {
  private static sanitizeTicket(ticket: Ticket) {
    const { createdBy, assignedTo, ...rest } = ticket;

    let sanitizedCreatedBy = createdBy;
    if (createdBy) {
      const { password, refreshToken, ...userWithoutSecrets } =
        createdBy as any;
      sanitizedCreatedBy = userWithoutSecrets;
    }

    let sanitizedAssignedTo = assignedTo;
    if (assignedTo) {
      const { password, refreshToken, ...userWithoutSecrets } =
        assignedTo as any;
      sanitizedAssignedTo = userWithoutSecrets;
    }

    return {
      ...rest,
      createdBy: sanitizedCreatedBy,
      assignedTo: sanitizedAssignedTo,
    };
  }

  private static async validateAssigneeInDepartment(
    assigneeId: string,
    departmentId: string,
  ): Promise<void> {
    const assignee = await UserRepository.findById(assigneeId);
    if (!assignee) {
      throw new HttpError(404, "Assigned user not found");
    }
    if (!assignee.departmentId || assignee.departmentId !== departmentId) {
      throw new HttpError(
        400,
        "User can only be assigned to tickets in their own department",
      );
    }
  }

  private static validateStatusTransition(
    current: TicketStatus,
    target: TicketStatus,
    roles: {
      isCreator: boolean;
      isAssignee: boolean;
      isSameDeptAdmin: boolean;
      isSuperAdmin: boolean;
    },
  ) {
    if (roles.isSuperAdmin) return;

    if (roles.isSameDeptAdmin) {
      if (target === TicketStatus.closed && current !== TicketStatus.reviewed) {
        throw new HttpError(
          400,
          "Tickets can only be closed from the 'reviewed' status",
        );
      }
      if (current === TicketStatus.open && target !== TicketStatus.open) {
        throw new HttpError(
          400,
          "An open ticket can only become assigned when an assignee is assigned it cant be changes manually",
        );
      }
      return;
    }

    let allowed = false;

    if (roles.isCreator) {
      if (
        current === TicketStatus.completed &&
        (target === TicketStatus.reviewed || target === TicketStatus.open)
      ) {
        allowed = true;
      }
    }

    if (roles.isAssignee) {
      if (
        current === TicketStatus.assigned &&
        target === TicketStatus.inProgress
      ) {
        allowed = true;
      }
      if (
        current === TicketStatus.inProgress &&
        target === TicketStatus.completed
      ) {
        allowed = true;
      }
      if (
        current === TicketStatus.completed &&
        target === TicketStatus.inProgress
      ) {
        allowed = true;
      }
    }

    if (!allowed) {
      throw new HttpError(
        403,
        `Forbidden: You do not have permission to transition ticket from '${current}' to '${target}'`,
      );
    }
  }

  public static async getAllTickets(
    requester: RequesterInfo,
    query: TicketQueryInput,
  ) {
    const requesterUser = await UserRepository.findById(requester.id);
    const requesterDepartmentId = requesterUser?.departmentId;

    const tickets = await TicketRepository.findAll({
      requesterRole: requester.role as roleEnum,
      requesterId: requester.id,
      requesterDepartmentId,
      title: query.title,
      status: query.status,
      priority: query.priority,
      departmentId: query.departmentId,
      assignedToId: query.assignedToId,
      createdById: query.createdById,
      createdFrom: query.createdFrom ? new Date(query.createdFrom) : undefined,
      createdTo: query.createdTo ? new Date(query.createdTo) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder?.toUpperCase() as "ASC" | "DESC" | undefined,
    });

    return {
      message: "Tickets fetched successfully",
      tickets: tickets.map((t) => this.sanitizeTicket(t)),
    };
  }

  public static async getTicketById(id: string, requester: RequesterInfo) {
    const ticket = await TicketRepository.findById(id);
    if (!ticket) {
      throw new HttpError(404, "Ticket not found");
    }

    if (requester.role === roleEnum.superAdmin) {
      return {
        message: "Ticket details fetched successfully",
        ticket: this.sanitizeTicket(ticket),
      };
    }

    if (requester.role === roleEnum.admin) {
      const requesterUser = await UserRepository.findById(requester.id);
      const isCreator = ticket.createdById === requester.id;
      const isAssignee = ticket.assignedToId === requester.id;
      const isSameDept =
        requesterUser?.departmentId &&
        requesterUser.departmentId === ticket.departmentId;

      if (isCreator || isAssignee || isSameDept) {
        return {
          message: "Ticket details fetched successfully",
          ticket: this.sanitizeTicket(ticket),
        };
      }

      throw new HttpError(
        403,
        "Forbidden: cannot view tickets outside your department",
      );
    }

    if (requester.role === roleEnum.user) {
      const isCreator = ticket.createdById === requester.id;
      const isAssignee = ticket.assignedToId === requester.id;

      if (isCreator || isAssignee) {
        return {
          message: "Ticket details fetched successfully",
          ticket: this.sanitizeTicket(ticket),
        };
      }

      throw new HttpError(
        403,
        "Forbidden: you can only view tickets created by or assigned to you",
      );
    }

    throw new HttpError(403, "Forbidden: insufficient permissions");
  }

  public static async createTicket(
    requester: RequesterInfo,
    input: CreateTicketInput,
  ) {
    const department = await DepartmentRepository.findById(input.departmentId);
    if (!department) {
      throw new HttpError(404, "Department not found");
    }

    let initialStatus = TicketStatus.open;

    if (input.assignedToId) {
      if (
        requester.role !== roleEnum.superAdmin &&
        requester.role !== roleEnum.admin
      ) {
        throw new HttpError(
          403,
          "Forbidden: regular users cannot assign tickets upon creation",
        );
      }

      if (requester.role === roleEnum.admin) {
        const adminUser = await UserRepository.findById(requester.id);
        if (adminUser?.departmentId !== input.departmentId) {
          throw new HttpError(
            403,
            "Forbidden: admins can only assign tickets for their department",
          );
        }
      }

      await this.validateAssigneeInDepartment(
        input.assignedToId,
        input.departmentId,
      );
      initialStatus = TicketStatus.assigned;
    }

    const newTicket = await TicketRepository.createTicket({
      title: input.title,
      description: input.description,
      departmentId: input.departmentId,
      priority: input.priority ?? TicketPriority.low,
      status: initialStatus,
      createdById: requester.id,
      assignedToId: input.assignedToId ?? null,
    });

    logger.info("Ticket created", {
      ticketId: newTicket.ticketId,
      title: newTicket.title,
      createdById: requester.id,
      departmentId: newTicket.departmentId,
    });

    const fullTicket = await TicketRepository.findById(newTicket.ticketId);
    if (fullTicket) {
      if (fullTicket.assignedToId)
        void NotificationService.ticketAssigned(fullTicket);
      void NotificationService.notifyPriorityTicket(fullTicket);
    }

    return {
      message: "Ticket created successfully",
      ticket: fullTicket ? this.sanitizeTicket(fullTicket) : newTicket,
    };
  }

  public static async updateTicket(
    id: string,
    input: UpdateTicketInput,
    requester: RequesterInfo,
  ) {
    const ticket = await TicketRepository.findById(id);

    if (!ticket) {
      throw new HttpError(404, "Ticket not found");
    }

    const requesterUser = await UserRepository.findById(requester.id);

    if (!requesterUser) {
      throw new HttpError(401, "Requester not found");
    }

    const updatePayload: Partial<Ticket> = {};

    const isCreator = ticket.createdById === requester.id;
    const isAssignee = ticket.assignedToId === requester.id;

    const isSameDeptAdmin =
      requester.role === roleEnum.admin &&
      requesterUser.departmentId === ticket.departmentId;

    const isSuperAdmin = requester.role === roleEnum.superAdmin;

    let targetStatus = ticket.status;
    let targetAssigneeId = ticket.assignedToId;

    const isContentUpdating =
      input.title !== undefined ||
      input.description !== undefined ||
      input.priority !== undefined;

    if (isContentUpdating) {
      if (!isCreator) {
        throw new HttpError(
          403,
          "Forbidden: Only the creator of the ticket can change its title, description, or priority",
        );
      }

      const isReopening =
        ticket.status === TicketStatus.completed &&
        input.status === TicketStatus.open;

      if (ticket.status !== TicketStatus.open && !isReopening) {
        throw new HttpError(
          400,
          "Bad request: You cannot update title, description, or priority unless the ticket is open",
        );
      }

      if (input.title !== undefined) {
        updatePayload.title = input.title;
      }

      if (input.description !== undefined) {
        updatePayload.description = input.description;
      }

      if (input.priority !== undefined) {
        updatePayload.priority = input.priority;
      }
    }

    const isAssignmentUpdating = input.assignedToId !== undefined;

    if (isAssignmentUpdating) {
      if (!isSameDeptAdmin && !isSuperAdmin) {
        throw new HttpError(
          403,
          "Forbidden: Only a department admin or super admin can assign or unassign tickets",
        );
      }

      if (input.assignedToId === null) {
        targetAssigneeId = null;
        targetStatus = TicketStatus.open;
      } else {
        const assignee = await UserRepository.findById(
          input.assignedToId ?? "",
        );

        if (!assignee) {
          throw new HttpError(404, "User not found to assign");
        }

        await this.validateAssigneeInDepartment(
          input.assignedToId ?? "",
          ticket.departmentId,
        );

        targetAssigneeId = input.assignedToId ?? ticket.assignedToId;
        targetStatus = TicketStatus.assigned;
      }
    }

    const isStatusUpdating = input.status !== undefined;

    if (isStatusUpdating) {
      const requestedStatus = input.status!;

      if (isAssignmentUpdating) {
        if (
          input.assignedToId !== null &&
          requestedStatus !== TicketStatus.assigned
        ) {
          throw new HttpError(
            400,
            "A newly assigned ticket must have assigned status",
          );
        }

        if (
          input.assignedToId === null &&
          requestedStatus !== TicketStatus.open
        ) {
          throw new HttpError(
            400,
            "An unassigned ticket must have open status",
          );
        }
      }

      /*
       * If assignment is NOT being changed, validate the
       * requested status transition normally.
       */
      if (!isAssignmentUpdating && requestedStatus !== ticket.status) {
        this.validateStatusTransition(ticket.status, requestedStatus, {
          isCreator,
          isAssignee,
          isSameDeptAdmin,
          isSuperAdmin,
        });

        targetStatus = requestedStatus;
      }

      if (isAssignmentUpdating) {
        targetStatus = requestedStatus;
      }
    }

    if (targetStatus === TicketStatus.open) {
      targetAssigneeId = null;
    }

    if (targetStatus !== TicketStatus.open && targetAssigneeId === null) {
      throw new HttpError(
        400,
        `A ticket in '${targetStatus}' status must have an assignee`,
      );
    }

    if (targetAssigneeId !== ticket.assignedToId) {
      updatePayload.assignedToId = targetAssigneeId;
    }

    if (targetStatus !== ticket.status) {
      updatePayload.status = targetStatus;
    }

    if (
      ticket.status !== TicketStatus.closed &&
      targetStatus === TicketStatus.closed
    ) {
      updatePayload.closedAt = new Date();
    }

    if (
      ticket.status === TicketStatus.closed &&
      targetStatus !== TicketStatus.closed
    ) {
      updatePayload.closedAt = null;
    }

    if (Object.keys(updatePayload).length === 0) {
      return {
        message: "No changes detected",
        ticket: this.sanitizeTicket(ticket),
      };
    }

    const updatedTicket = await TicketRepository.updateTicket(
      id,
      updatePayload,
    );

    if (!updatedTicket) {
      throw new HttpError(500, "Failed to update ticket");
    }

    logger.info("Ticket updated", {
      ticketId: id,
      updatedBy: requester.id,
      fields: Object.keys(updatePayload),
    });

    if (
      updatedTicket.assignedToId &&
      updatedTicket.assignedToId !== ticket.assignedToId
    ) {
      void NotificationService.ticketAssigned(updatedTicket);
    }
    if (
      updatedTicket.status === TicketStatus.completed &&
      ticket.status !== TicketStatus.completed
    ) {
      void NotificationService.ticketReadyForReview(updatedTicket);
    }
    if (
      updatePayload.priority &&
      (updatePayload.priority === TicketPriority.high ||
        updatePayload.priority === TicketPriority.urgent)
    ) {
      void NotificationService.notifyPriorityTicket(updatedTicket);
    }

    return {
      message: "Ticket updated successfully",
      ticket: this.sanitizeTicket(updatedTicket),
    };
  }

  public static async deleteTicket(id: string, requester: RequesterInfo) {
    const ticket = await TicketRepository.findById(id);
    if (!ticket) {
      throw new HttpError(404, "Ticket not found");
    }

    const requesterUser = await UserRepository.findById(requester.id);
    const isCreator = ticket.createdById === requester.id;
    const isSameDeptAdmin =
      requester.role === roleEnum.admin &&
      requesterUser?.departmentId === ticket.departmentId;
    const isSuperAdmin = requester.role === roleEnum.superAdmin;

    if (isSuperAdmin) {
      await TicketRepository.deleteTicket(id);
      logger.info("Ticket deleted by super_admin", {
        ticketId: id,
        deletedBy: requester.id,
      });
      return { message: "Ticket deleted successfully" };
    }

    if (isCreator || isSameDeptAdmin) {
      if (ticket.assignedToId !== null || ticket.status !== TicketStatus.open) {
        throw new HttpError(
          403,
          "Forbidden: tickets can only be deleted if they are unassigned and in open status",
        );
      }

      await TicketRepository.deleteTicket(id);
      logger.info("Ticket deleted", {
        ticketId: id,
        deletedBy: requester.id,
      });
      return { message: "Ticket deleted successfully" };
    }

    throw new HttpError(
      403,
      "Forbidden: insufficient permissions to delete ticket",
    );
  }
}
