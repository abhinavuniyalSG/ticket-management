import {
  DashboardRepository,
  TicketTrendPeriod,
  type TicketPriorityCounts,
} from "../database/repositry/dashboard.repository.js";
import { DepartmentRepository } from "../database/repositry/department.repository.js";
import { HttpError } from "../utils/httpError.utils.js";
import { roleEnum } from "../types/user.js";
import { TicketPriority } from "../types/ticket.js";
import type { RequesterInfo } from "./ticket.service.js";

/** Window a `GET /dashboard/overview` request counts tickets over. */
export enum DashboardOverviewPeriod {
  day = "day",
  week = "week",
  month = "month",
  year = "year",
  all = "all",
}

export interface DashboardQueryInput {
  departmentId?: string;
  period?: TicketTrendPeriod;
}

export interface DashboardOverviewQueryInput {
  departmentId?: string;
  period?: DashboardOverviewPeriod;
}

interface CreatedAtRange {
  createdFrom?: Date;
  createdTo?: Date;
}

function priorityDistributionOf(
  counts: TicketPriorityCounts,
): Array<{ priority: TicketPriority; count: number }> {
  return [
    { priority: TicketPriority.low, count: counts.low },
    { priority: TicketPriority.medium, count: counts.medium },
    { priority: TicketPriority.high, count: counts.high },
    { priority: TicketPriority.urgent, count: counts.urgent },
  ];
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/** Monday 00:00 UTC of the current ISO week. */
function startOfThisWeek(): Date {
  const today = startOfToday();
  const isoWeekday = today.getUTCDay() === 0 ? 7 : today.getUTCDay();
  today.setUTCDate(today.getUTCDate() - (isoWeekday - 1));
  return today;
}

function startOfThisMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function startOfThisYear(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
}

function getCreatedAtRangeForOverviewPeriod(
  query: DashboardOverviewQueryInput,
): CreatedAtRange {
  const period = query.period ?? DashboardOverviewPeriod.day;

  switch (period) {
    case DashboardOverviewPeriod.day:
      return { createdFrom: startOfToday() };
    case DashboardOverviewPeriod.week:
      return { createdFrom: startOfThisWeek() };
    case DashboardOverviewPeriod.month:
      return { createdFrom: startOfThisMonth() };
    case DashboardOverviewPeriod.year:
      return { createdFrom: startOfThisYear() };
    case DashboardOverviewPeriod.all:
      return {};
  }
}

/** `GET /dashboard`'s `priorityDistribution` is scoped to this same current period. */
function getCreatedAtRangeForCurrentPeriod(
  period: TicketTrendPeriod,
): CreatedAtRange {
  switch (period) {
    case TicketTrendPeriod.day:
      return { createdFrom: startOfToday() };
    case TicketTrendPeriod.week:
      return { createdFrom: startOfThisWeek() };
    case TicketTrendPeriod.month:
      return { createdFrom: startOfThisMonth() };
    case TicketTrendPeriod.year:
      return { createdFrom: startOfThisYear() };
  }
}

export class DashboardService {
  /**
   * Department id `GET /dashboard` is scoped to: an admin to a department they
   * manage (defaulting to, and validated against, `getManagedDepartmentIdForAdmin`
   * below); a super_admin to any existing department, or all of them if omitted.
   */
  private static async getDashboardDepartmentId(
    requester: RequesterInfo,
    requestedDepartmentId?: string,
  ): Promise<string | undefined> {
    if (requester.role === roleEnum.admin) {
      return this.getManagedDepartmentIdForAdmin(
        requester.id,
        requestedDepartmentId,
      );
    }

    if (requester.role === roleEnum.superAdmin) {
      return this.getRequestedDepartmentIdForSuperAdmin(requestedDepartmentId);
    }

    throw new HttpError(
      403,
      "Forbidden: only admin and super_admin can view the dashboard",
    );
  }

  public static async getDashboard(
    requester: RequesterInfo,
    query: DashboardQueryInput,
  ) {
    const departmentId = await this.getDashboardDepartmentId(
      requester,
      query.departmentId,
    );
    const period = query.period ?? TicketTrendPeriod.day;
    const { createdFrom, createdTo } =
      getCreatedAtRangeForCurrentPeriod(period);

    const [priorityCounts, trend] = await Promise.all([
      DashboardRepository.countTicketsByPriority({
        departmentId,
        createdFrom,
        createdTo,
      }),
      DashboardRepository.getTicketTrend(departmentId, period),
    ]);

    return {
      message: "Dashboard statistics fetched successfully",
      priorityDistribution: priorityDistributionOf(priorityCounts),
      ticketsOverTime: trend,
    };
  }

  /**
   * Every department id an admin manages (Department.managedBy), in the order
   * the database returns them. Used to both validate and default-pick the
   * department `GET /dashboard/overview` scopes an admin to.
   */
  private static async getManagedDepartmentIdForAdmin(
    adminId: string,
    requestedDepartmentId?: string,
  ): Promise<string> {
    const managedDepartments =
      await DepartmentRepository.findByManager(adminId);
    if (managedDepartments.length === 0) {
      throw new HttpError(403, "Forbidden: you do not manage any department");
    }

    if (requestedDepartmentId === undefined) {
      return managedDepartments[0]!.departmentId;
    }

    const managesRequestedDepartment = managedDepartments.some(
      (department) => department.departmentId === requestedDepartmentId,
    );
    if (!managesRequestedDepartment) {
      throw new HttpError(403, "Forbidden: you do not manage this department");
    }

    return requestedDepartmentId;
  }

  /** super_admin may scope the overview to any existing department, or omit it for all departments. */
  private static async getRequestedDepartmentIdForSuperAdmin(
    requestedDepartmentId?: string,
  ): Promise<string | undefined> {
    if (requestedDepartmentId === undefined) {
      return undefined;
    }

    const department = await DepartmentRepository.findById(
      requestedDepartmentId,
    );
    if (!department) {
      throw new HttpError(404, "Department not found");
    }

    return department.departmentId;
  }

  private static async getOverviewDepartmentId(
    requester: RequesterInfo,
    requestedDepartmentId?: string,
  ): Promise<string | undefined> {
    if (requester.role === roleEnum.admin) {
      return this.getManagedDepartmentIdForAdmin(
        requester.id,
        requestedDepartmentId,
      );
    }

    if (requester.role === roleEnum.superAdmin) {
      return this.getRequestedDepartmentIdForSuperAdmin(requestedDepartmentId);
    }

    throw new HttpError(
      403,
      "Forbidden: only admin and super_admin can view the dashboard overview",
    );
  }

  public static async getDashboardOverview(
    requester: RequesterInfo,
    query: DashboardOverviewQueryInput,
  ) {
    const departmentId = await this.getOverviewDepartmentId(
      requester,
      query.departmentId,
    );
    const { createdFrom, createdTo } =
      getCreatedAtRangeForOverviewPeriod(query);

    const counts = await DashboardRepository.countTicketsByStatus({
      departmentId,
      createdFrom,
      createdTo,
    });

    return {
      message: "Dashboard overview fetched successfully",
      departmentId: departmentId ?? null,
      period: query.period ?? DashboardOverviewPeriod.day,
      totalTicketsCreatedToday: counts.totalCreated_today,
      openTickets: counts.open,
      assignedTickets: counts.assigned,
      inProgressTickets: counts.inProgress,
      reviewedTickets: counts.reviewed,
      completedTickets: counts.completed,
      closedDateToday: counts.closed_date_today,
    };
  }
}
