import { AppDataSource } from "../dbConnection.js";
import { Ticket } from "../models/ticket.model.js";
import { TicketPriority, TicketStatus } from "../../types/ticket.js";
import { roleEnum } from "../../types/user.js";

export interface TicketFilterOptions {
  requesterRole: roleEnum;
  requesterId: string;
  requesterDepartmentId?: string | null | undefined;
  title?: string | undefined;
  status?: TicketStatus | undefined;
  priority?: TicketPriority | undefined;
  departmentId?: string | undefined;
  assignedToId?: string | undefined;
  createdById?: string | undefined;
  createdFrom?: Date | undefined;
  createdTo?: Date | undefined;
  sortBy?: "createdAt" | "updatedAt" | "priority" | "status" | undefined;
  sortOrder?: "ASC" | "DESC" | undefined;
}

export class TicketRepository {
  private static repository = AppDataSource.getRepository(Ticket);

  public static async findById(id: string): Promise<Ticket | null> {
    return this.repository
      .createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.department", "department")
      .leftJoinAndSelect("ticket.createdBy", "createdBy")
      .leftJoinAndSelect("ticket.assignedTo", "assignedTo")
      .where("ticket.ticketId = :id", { id })
      .getOne();
  }

  public static async findAll(options: TicketFilterOptions): Promise<Ticket[]> {
    const query = this.repository
      .createQueryBuilder("ticket")
      .leftJoinAndSelect("ticket.department", "department")
      .leftJoinAndSelect("ticket.createdBy", "createdBy")
      .leftJoinAndSelect("ticket.assignedTo", "assignedTo");

    if (options.requesterRole === roleEnum.user) {
      query.andWhere(
        "(ticket.createdById = :requesterId OR ticket.assignedToId = :requesterId)",
        { requesterId: options.requesterId },
      );
    } else if (options.requesterRole === roleEnum.admin) {
      if (options.requesterDepartmentId) {
        query.andWhere(
          "(ticket.createdById = :requesterId OR ticket.assignedToId = :requesterId OR ticket.departmentId = :adminDeptId)",
          {
            requesterId: options.requesterId,
            adminDeptId: options.requesterDepartmentId,
          },
        );
      } else {
        query.andWhere(
          "(ticket.createdById = :requesterId OR ticket.assignedToId = :requesterId)",
          { requesterId: options.requesterId },
        );
      }
    }
    if (options.title) {
      query.andWhere("ticket.title ILIKE :title", {
        title: `%${options.title}%`,
      });
    }

    if (options.status) {
      query.andWhere("ticket.status = :status", { status: options.status });
    }

    if (options.priority) {
      query.andWhere("ticket.priority = :priority", {
        priority: options.priority,
      });
    }

    if (options.requesterRole === roleEnum.superAdmin && options.departmentId) {
      query.andWhere("ticket.departmentId = :departmentId", {
        departmentId: options.departmentId,
      });
    }

    if (options.assignedToId) {
      query.andWhere("ticket.assignedToId = :assignedToId", {
        assignedToId: options.assignedToId,
      });
    }

    if (options.createdById) {
      query.andWhere("ticket.createdById = :createdById", {
        createdById: options.createdById,
      });
    }

    if (options.createdFrom) {
      query.andWhere("ticket.createdAt >= :createdFrom", {
        createdFrom: options.createdFrom,
      });
    }

    if (options.createdTo) {
      query.andWhere("ticket.createdAt <= :createdTo", {
        createdTo: options.createdTo,
      });
    }

    const sortBy = options.sortBy ?? "createdAt";
    const sortOrder = options.sortOrder ?? "DESC";
    query.orderBy(`ticket.${sortBy}`, sortOrder);

    return query.getMany();
  }

  public static async createTicket(data: Partial<Ticket>): Promise<Ticket> {
    const ticket = this.repository.create(data);
    return this.repository.save(ticket);
  }

  public static async updateTicket(
    id: string,
    data: Partial<Ticket>,
  ): Promise<Ticket | null> {
    await this.repository.update({ ticketId: id }, data);
    return this.findById(id);
  }

  public static async deleteTicket(id: string): Promise<boolean> {
    const result = await this.repository.delete({ ticketId: id });
    return (result.affected ?? 0) > 0;
  }

  public static async findByDepartmentStatuses(
    departmentId: string,
    statuses: TicketStatus[],
  ): Promise<Ticket[]> {
    return this.repository
      .createQueryBuilder("ticket")
      .where("ticket.departmentId = :departmentId", { departmentId })
      .andWhere("ticket.status IN (:...statuses)", { statuses })
      .getMany();
  }

  public static async getSummary(): Promise<{
    live: number;
    createdToday: number;
    closedToday: number;
    openHighOrUrgent: number;
  }> {
    const result = await this.repository
      .createQueryBuilder("ticket")
      .select([
        "COUNT(*) FILTER (WHERE ticket.status <> :closed)::int AS live",
        "COUNT(*) FILTER (WHERE ticket.createdAt >= CURRENT_DATE)::int AS created_today",
        "COUNT(*) FILTER (WHERE ticket.status = :closed AND ticket.closedAt >= CURRENT_DATE)::int AS closed_today",
        "COUNT(*) FILTER (WHERE ticket.status IN (:...liveStatuses) AND ticket.priority IN (:...priorities))::int AS open_high_or_urgent",
      ])
      .setParameters({
        closed: TicketStatus.closed,
        liveStatuses: [
          TicketStatus.open,
          TicketStatus.assigned,
          TicketStatus.inProgress,
          TicketStatus.review,
          TicketStatus.completed,
        ],
        priorities: [TicketPriority.high, TicketPriority.urgent],
      })
      .getRawOne();
    return {
      live: Number(result.live),
      createdToday: Number(result.created_today),
      closedToday: Number(result.closed_today),
      openHighOrUrgent: Number(result.open_high_or_urgent),
    };
  }
}
