import { AppDataSource } from "../dbConnection.js";
import { Ticket } from "../models/ticket.model.js";
import { Department } from "../models/department.model.js";
import { TicketPriority, TicketStatus } from "../../types/ticket.js";

export interface DashboardStatusCounts {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  reviewed: number;
  completed: number;
  closed: number;
}

export interface DashboardPriorityCounts {
  low: number;
  medium: number;
  high: number;
  urgent: number;
}

export interface TicketsOverTimeEntry {
  date: string;
  created: number;
  closed: number;
}

export enum DashboardPeriod {
  week = "week",
  month = "month",
  year = "year",
}

export interface DepartmentBreakdownRow {
  departmentId: string;
  departmentName: string;
  statusCounts: DashboardStatusCounts;
  priorityCounts: DashboardPriorityCounts;
  averageCompletionTimeHours: number;
}

const TREND_WINDOW_DAYS = 7;

export class DashboardRepository {
  private static repository = AppDataSource.getRepository(Ticket);
  private static departmentRepository = AppDataSource.getRepository(Department);

  public static async getStatusCounts(
    departmentId?: string,
  ): Promise<DashboardStatusCounts> {
    const query = this.repository
      .createQueryBuilder("ticket")
      .select("COUNT(*)::int", "total")
      .addSelect("COUNT(*) FILTER (WHERE ticket.status = :open)::int", "open")
      .addSelect(
        "COUNT(*) FILTER (WHERE ticket.status = :assigned)::int",
        "assigned",
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE ticket.status = :inProgress)::int",
        "in_progress",
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE ticket.status = :reviewed)::int",
        "reviewed",
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE ticket.status = :completed)::int",
        "completed",
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE ticket.status = :closed)::int",
        "closed",
      )
      .setParameters({
        open: TicketStatus.open,
        assigned: TicketStatus.assigned,
        inProgress: TicketStatus.inProgress,
        reviewed: TicketStatus.reviewed,
        completed: TicketStatus.completed,
        closed: TicketStatus.closed,
      });

    if (departmentId) {
      query.where("ticket.departmentId = :departmentId", { departmentId });
    }

    const result = await query.getRawOne();

    return {
      total: Number(result.total ?? 0),
      open: Number(result.open ?? 0),
      assigned: Number(result.assigned ?? 0),
      inProgress: Number(result.in_progress ?? 0),
      reviewed: Number(result.reviewed ?? 0),
      completed: Number(result.completed ?? 0),
      closed: Number(result.closed ?? 0),
    };
  }

  public static async getPriorityCounts(
    departmentId?: string,
  ): Promise<DashboardPriorityCounts> {
    const query = this.repository
      .createQueryBuilder("ticket")
      .select("COUNT(*) FILTER (WHERE ticket.priority = :low)::int", "low")
      .addSelect(
        "COUNT(*) FILTER (WHERE ticket.priority = :medium)::int",
        "medium",
      )
      .addSelect("COUNT(*) FILTER (WHERE ticket.priority = :high)::int", "high")
      .addSelect(
        "COUNT(*) FILTER (WHERE ticket.priority = :urgent)::int",
        "urgent",
      )
      .setParameters({
        low: TicketPriority.low,
        medium: TicketPriority.medium,
        high: TicketPriority.high,
        urgent: TicketPriority.urgent,
      });

    if (departmentId) {
      query.where("ticket.departmentId = :departmentId", { departmentId });
    }

    const result = await query.getRawOne();

    return {
      low: Number(result.low ?? 0),
      medium: Number(result.medium ?? 0),
      high: Number(result.high ?? 0),
      urgent: Number(result.urgent ?? 0),
    };
  }

  private static getCompletionWindowInterval(period: DashboardPeriod): string {
    switch (period) {
      case DashboardPeriod.month:
        return "29 days";
      case DashboardPeriod.year:
        return "12 months";
      case DashboardPeriod.week:
      default:
        return "6 days";
    }
  }

  public static async getAverageCompletionTimeHours(
    departmentId?: string,
    period: DashboardPeriod = DashboardPeriod.week,
  ): Promise<number> {
    const windowInterval = this.getCompletionWindowInterval(period);
    const query = this.repository
      .createQueryBuilder("ticket")
      .select(
        "AVG(EXTRACT(EPOCH FROM (ticket.closedAt - ticket.createdAt)) / 3600.0)",
        "avgHours",
      )
      .where("ticket.status = :closed", { closed: TicketStatus.closed })
      .andWhere("ticket.closedAt IS NOT NULL")
      .andWhere("ticket.createdAt IS NOT NULL")
      .andWhere(
        `ticket.closedAt >= CURRENT_DATE - INTERVAL '${windowInterval}'`,
      );

    if (departmentId) {
      query.andWhere("ticket.departmentId = :departmentId", { departmentId });
    }

    const result = await query.getRawOne();
    const rawAvg = result?.avgHours;

    if (rawAvg === null || rawAvg === undefined) {
      return 0;
    }

    const avg = Number(rawAvg);
    return Number.isFinite(avg) ? Math.round(avg * 100) / 100 : 0;
  }

  /** UTC bucket keys for the period, oldest first, always 'YYYY-MM-DD' (first-of-month for `year`). */
  private static bucketKeysForPeriod(period: DashboardPeriod): string[] {
    const now = new Date();
    const todayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    if (period === DashboardPeriod.year) {
      const keys: string[] = [];
      for (let i = 11; i >= 0; i--) {
        const bucket = new Date(
          Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth() - i, 1),
        );
        keys.push(bucket.toISOString().slice(0, 10));
      }
      return keys;
    }

    const windowDays =
      period === DashboardPeriod.month ? 30 : TREND_WINDOW_DAYS;
    const keys: string[] = [];
    for (let i = windowDays - 1; i >= 0; i--) {
      const bucket = new Date(todayUtc);
      bucket.setUTCDate(bucket.getUTCDate() - i);
      keys.push(bucket.toISOString().slice(0, 10));
    }
    return keys;
  }

  /** SQL expression bucketing a timestamptz column into a UTC 'YYYY-MM-DD' string, matching bucketKeysForPeriod. */
  private static bucketExpression(
    column: string,
    period: DashboardPeriod,
  ): string {
    const utcColumn = `${column} AT TIME ZONE 'UTC'`;
    return period === DashboardPeriod.year
      ? `to_char(date_trunc('month', ${utcColumn}), 'YYYY-MM-DD')`
      : `to_char(${utcColumn}, 'YYYY-MM-DD')`;
  }

  public static async getTicketsOverTime(
    departmentId?: string,
    period: DashboardPeriod = DashboardPeriod.week,
  ): Promise<TicketsOverTimeEntry[]> {
    const bucketKeys = this.bucketKeysForPeriod(period);
    const rangeStart = new Date(`${bucketKeys[0]}T00:00:00.000Z`);

    const createdBucket = this.bucketExpression("ticket.createdAt", period);
    const closedBucket = this.bucketExpression("ticket.closedAt", period);

    const createdQuery = this.repository
      .createQueryBuilder("ticket")
      .select(createdBucket, "bucket")
      .addSelect("COUNT(*)", "count")
      .where("ticket.createdAt >= :rangeStart", { rangeStart })
      .groupBy(createdBucket);

    const closedQuery = this.repository
      .createQueryBuilder("ticket")
      .select(closedBucket, "bucket")
      .addSelect("COUNT(*)", "count")
      .where("ticket.status = :closed", { closed: TicketStatus.closed })
      .andWhere("ticket.closedAt >= :rangeStart", { rangeStart })
      .groupBy(closedBucket);

    if (departmentId) {
      createdQuery.andWhere("ticket.departmentId = :departmentId", {
        departmentId,
      });
      closedQuery.andWhere("ticket.departmentId = :departmentId", {
        departmentId,
      });
    }

    const [createdRows, closedRows] = await Promise.all([
      createdQuery.getRawMany<{ bucket: string; count: string }>(),
      closedQuery.getRawMany<{ bucket: string; count: string }>(),
    ]);

    const createdMap = new Map(
      createdRows.map((row) => [row.bucket, Number(row.count)]),
    );
    const closedMap = new Map(
      closedRows.map((row) => [row.bucket, Number(row.count)]),
    );

    return bucketKeys.map((date) => ({
      date,
      created: createdMap.get(date) ?? 0,
      closed: closedMap.get(date) ?? 0,
    }));
  }

  public static async getDepartmentBreakdown(): Promise<
    DepartmentBreakdownRow[]
  > {
    const rows = await this.departmentRepository
      .createQueryBuilder("dep")
      .leftJoin("dep.tickets", "t")
      .select("dep.departmentId", "department_id")
      .addSelect("dep.departmentName", "department_name")
      .addSelect("COUNT(t.ticketId)::int", "total")
      .addSelect("COUNT(*) FILTER (WHERE t.status = :open)::int", "open")
      .addSelect(
        "COUNT(*) FILTER (WHERE t.status = :assigned)::int",
        "assigned",
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE t.status = :inProgress)::int",
        "in_progress",
      )
      .addSelect("COUNT(*) FILTER (WHERE t.status = :reviewed)::int", "reviewed")
      .addSelect(
        "COUNT(*) FILTER (WHERE t.status = :completed)::int",
        "completed",
      )
      .addSelect("COUNT(*) FILTER (WHERE t.status = :closed)::int", "closed")
      .addSelect(
        "COUNT(*) FILTER (WHERE t.priority = :low)::int",
        "priority_low",
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE t.priority = :medium)::int",
        "priority_medium",
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE t.priority = :high)::int",
        "priority_high",
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE t.priority = :urgent)::int",
        "priority_urgent",
      )
      .addSelect(
        `AVG(EXTRACT(EPOCH FROM (t.closedAt - t.createdAt)) / 3600.0) FILTER (
          WHERE t.status = :closed
            AND t.closedAt IS NOT NULL
            AND t.closedAt >= CURRENT_DATE - INTERVAL '${TREND_WINDOW_DAYS - 1} days'
        )`,
        "avg_completion_hours",
      )
      .setParameters({
        open: TicketStatus.open,
        assigned: TicketStatus.assigned,
        inProgress: TicketStatus.inProgress,
        reviewed: TicketStatus.reviewed,
        completed: TicketStatus.completed,
        closed: TicketStatus.closed,
        low: TicketPriority.low,
        medium: TicketPriority.medium,
        high: TicketPriority.high,
        urgent: TicketPriority.urgent,
      })
      .groupBy("dep.departmentId")
      .addGroupBy("dep.departmentName")
      .orderBy("dep.departmentName", "ASC")
      .getRawMany<Record<string, string | number | null>>();

    return rows.map((row) => {
      const rawAvg = row.avg_completion_hours;
      const avg = rawAvg === null || rawAvg === undefined ? 0 : Number(rawAvg);

      return {
        departmentId: String(row.department_id),
        departmentName: String(row.department_name),
        statusCounts: {
          total: Number(row.total ?? 0),
          open: Number(row.open ?? 0),
          assigned: Number(row.assigned ?? 0),
          inProgress: Number(row.in_progress ?? 0),
          reviewed: Number(row.reviewed ?? 0),
          completed: Number(row.completed ?? 0),
          closed: Number(row.closed ?? 0),
        },
        priorityCounts: {
          low: Number(row.priority_low ?? 0),
          medium: Number(row.priority_medium ?? 0),
          high: Number(row.priority_high ?? 0),
          urgent: Number(row.priority_urgent ?? 0),
        },
        averageCompletionTimeHours: Number.isFinite(avg)
          ? Math.round(avg * 100) / 100
          : 0,
      };
    });
  }
}
