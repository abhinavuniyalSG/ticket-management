import { roleEnum } from "../types/user.js";
import { TicketPriority, TicketStatus } from "../types/ticket.js";
import { Ticket } from "../database/models/ticket.model.js";
import { Department } from "../database/models/department.model.js";
import { UserRepository } from "../database/repositry/user.repository.js";
import { DepartmentRepository } from "../database/repositry/department.repository.js";
import { TicketRepository } from "../database/repositry/ticket.repository.js";
import { EmailService } from "./email.service.js";
import { logger } from "../core/logger.js";

const details = (ticket: Ticket) =>
  `Title: ${ticket.title}\nDescription: ${ticket.description}\nPriority: ${ticket.priority}\nStatus: ${ticket.status}\nTicket ID: ${ticket.ticketId}`;

export class NotificationService {
  public static async ticketAssigned(ticket: Ticket): Promise<void> {
    const assignee = ticket.assignedToId
      ? await UserRepository.findById(ticket.assignedToId)
      : null;
    if (assignee?.email)
      await EmailService.send({
        to: assignee.email,
        subject: `Ticket assigned: ${ticket.title}`,
        text: `You have been assigned a ticket.\n\n${details(ticket)}`,
      });
    else
      logger.warn("Assignment notification skipped: assignee has no email", {
        ticketId: ticket.ticketId,
        assigneeId: ticket.assignedToId,
      });
    logger.info("Assignment notification processed", {
      ticketId: ticket.ticketId,
      assigneeId: ticket.assignedToId,
    });
  }

  public static async ticketReadyForReview(ticket: Ticket): Promise<void> {
    const creator = await UserRepository.findById(ticket.createdById);
    if (creator?.email)
      await EmailService.send({
        to: creator.email,
        subject: `Ticket ready for review: ${ticket.title}`,
        text: `Your ticket is completed and ready for review.\n\n${details(ticket)}`,
      });
    else
      logger.warn("Review notification skipped: ticket creator has no email", {
        ticketId: ticket.ticketId,
        creatorId: ticket.createdById,
      });
    logger.info("Review notification processed", {
      ticketId: ticket.ticketId,
      creatorId: ticket.createdById,
    });
  }

  private static async departmentRecipients(
    department: Department,
  ): Promise<string[]> {
    const admins = await UserRepository.findByRoleAndDepartment(
      roleEnum.admin,
      department.departmentId,
    );
    const recipients = admins.map((user) => user.email);
    if (department.manager?.email) recipients.push(department.manager.email);
    return [...new Set(recipients)];
  }

  public static async notifyPriorityTicket(ticket: Ticket): Promise<void> {
    if (
      ticket.priority !== TicketPriority.high &&
      ticket.priority !== TicketPriority.urgent
    )
      return;
    const department = await DepartmentRepository.findById(ticket.departmentId);
    if (!department) return;
    const to = await this.departmentRecipients(department);
    if (to.length)
      await EmailService.send({
        to,
        subject: `${ticket.priority.toUpperCase()} priority ticket created`,
        text: `A ${ticket.priority} priority ticket requires attention.\n\n${details(ticket)}`,
      });
    logger.info("Priority notification processed", {
      ticketId: ticket.ticketId,
      priority: ticket.priority,
      recipientCount: to.length,
    });
  }

  public static async sendDepartmentReminders(): Promise<void> {
    const departments = await DepartmentRepository.findAll();
    for (const department of departments) {
      const tickets = await TicketRepository.findByDepartmentStatuses(
        department.departmentId,
        [TicketStatus.open, TicketStatus.reviewed],
      );
      if (!tickets.length) {
        logger.debug("Department reminder skipped: no open or reviewed tickets", {
          departmentId: department.departmentId,
        });
        continue;
      }
      const to = await this.departmentRecipients(department);
      if (!to.length) {
        logger.warn("Department reminder skipped: no admin recipient email", {
          departmentId: department.departmentId,
        });
        continue;
      }
      const open = tickets.filter(
        (ticket) => ticket.status === TicketStatus.open,
      ).length;
      const reviewed = tickets.filter(
        (ticket) => ticket.status === TicketStatus.reviewed,
      ).length;
      await EmailService.send({
        to,
        subject: `Department ticket reminder: ${department.departmentName}`,
        text: `Please work on the department tickets.\nOpen: ${open}\nReviewed: ${reviewed}\nTotal requiring attention: ${tickets.length}`,
      });
      logger.info("Department reminder processed", {
        departmentId: department.departmentId,
        open,
        reviewed,
        recipientCount: to.length,
      });
    }
  }

  public static async sendSuperAdminSummary(): Promise<void> {
    const recipients = await UserRepository.findByRole(roleEnum.superAdmin);
    if (!recipients.length) {
      logger.debug("Super-admin summary skipped: no recipients found");
      return;
    }
    const summary = await TicketRepository.getSummary();
    const to = recipients.map((user) => user.email);
    await EmailService.send({
      to,
      subject: "Daily ticket summary",
      text: `Live tickets: ${summary.live}\nCreated today: ${summary.createdToday}\nClosed today: ${summary.closedToday}\nOpen high/urgent tickets: ${summary.openHighOrUrgent}`,
    });
    logger.info("Super-admin summary processed", {
      ...summary,
      recipientCount: to.length,
    });
  }
}
