import {
  DashboardPeriod,
  DashboardRepository,
  type DashboardPriorityCounts,
  type DashboardStatusCounts,
  type TicketsOverTimeEntry,
} from "../database/repositry/dashboard.repository.js";
import { DepartmentRepository } from "../database/repositry/department.repository.js";
import { UserRepository } from "../database/repositry/user.repository.js";
import { HttpError } from "../utils/httpError.utils.js";
import { roleEnum } from "../types/user.js";
import { TicketPriority, TicketStatus } from "../types/ticket.js";
import type { RequesterInfo } from "./ticket.service.js";

export interface DashboardQueryInput {
  departmentId?: string;
  period?: DashboardPeriod;
}

interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  assignedTickets: number;
  inProgressTickets: number;
  reviewedTickets: number;
  completedTickets: number;
  closedTickets: number;
  statusDistribution: Array<{ status: TicketStatus; count: number }>;
  priorityDistribution: Array<{ priority: TicketPriority; count: number }>;
  ticketsOverTime: TicketsOverTimeEntry[];
}

function buildStatusDistribution(
  counts: DashboardStatusCounts,
): Array<{ status: TicketStatus; count: number }> {
  return [
    { status: TicketStatus.open, count: counts.open },
    { status: TicketStatus.assigned, count: counts.assigned },
    { status: TicketStatus.inProgress, count: counts.inProgress },
    { status: TicketStatus.reviewed, count: counts.reviewed },
    { status: TicketStatus.completed, count: counts.completed },
    { status: TicketStatus.closed, count: counts.closed },
  ];
}

function buildPriorityDistribution(
  counts: DashboardPriorityCounts,
): Array<{ priority: TicketPriority; count: number }> {
  return [
    { priority: TicketPriority.low, count: counts.low },
    { priority: TicketPriority.medium, count: counts.medium },
    { priority: TicketPriority.high, count: counts.high },
    { priority: TicketPriority.urgent, count: counts.urgent },
  ];
}

export class DashboardService {
  private static async buildMetrics(
    departmentId?: string,
    period: DashboardPeriod = DashboardPeriod.week,
  ): Promise<DashboardMetrics> {
    const [statusCounts, priorityCounts, ticketsOverTime] = await Promise.all([
      DashboardRepository.getStatusCounts(departmentId),
      DashboardRepository.getPriorityCounts(departmentId),
      DashboardRepository.getTicketsOverTime(departmentId, period),
    ]);

    return {
      totalTickets: statusCounts.total,
      openTickets: statusCounts.open,
      assignedTickets: statusCounts.assigned,
      inProgressTickets: statusCounts.inProgress,
      reviewedTickets: statusCounts.reviewed,
      completedTickets: statusCounts.completed,
      closedTickets: statusCounts.closed,
      statusDistribution: buildStatusDistribution(statusCounts),
      priorityDistribution: buildPriorityDistribution(priorityCounts),
      ticketsOverTime,
    };
  }

  private static async resolveScopedDepartmentId(
    requester: RequesterInfo,
    query: DashboardQueryInput,
  ): Promise<string | undefined> {
    if (requester.role === roleEnum.admin) {
      if (query.departmentId !== undefined) {
        throw new HttpError(
          403,
          "Forbidden: admins cannot filter the dashboard by department",
        );
      }

      const requesterUser = await UserRepository.findById(requester.id);
      if (!requesterUser?.departmentId) {
        throw new HttpError(
          403,
          "Forbidden: your account is not assigned to a department",
        );
      }

      return requesterUser.departmentId;
    }

    if (requester.role === roleEnum.superAdmin) {
      if (query.departmentId === undefined) {
        return undefined;
      }

      const department = await DepartmentRepository.findById(
        query.departmentId,
      );
      if (!department) {
        throw new HttpError(404, "Department not found");
      }

      return department.departmentId;
    }

    throw new HttpError(403, "Forbidden: insufficient permissions");
  }

  public static async getDashboard(
    requester: RequesterInfo,
    query: DashboardQueryInput,
  ) {
    const departmentId = await this.resolveScopedDepartmentId(
      requester,
      query,
    );

    const metrics = await this.buildMetrics(departmentId, query.period);

    return {
      message: "Dashboard statistics fetched successfully",
      ...metrics,
    };
  }

  public static async getDashboardOverview(
    requester: RequesterInfo,
    query: Pick<DashboardQueryInput, "period">,
  ) {
    if (requester.role !== roleEnum.superAdmin) {
      throw new HttpError(
        403,
        "Forbidden: only super_admin can access this resource",
      );
    }

    const systemWide = await this.buildMetrics(undefined, query.period);

    return {
      message: "Dashboard overview fetched successfully",
      systemWide,
    };
  }
}
