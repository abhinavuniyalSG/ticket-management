import { AppDataSource } from "../dbConnection.js";
import { Ticket } from "../models/ticket.model.js";
import { TicketPriority, TicketStatus } from "../../types/ticket.js";

export interface DashboardStatusCounts {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  review: number;
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

  public static async getStatusCounts(
    departmentId?: string,
  ): Promise<DashboardStatusCounts> {
    const query = this.repository
      .createQueryBuilder("ticket")
      .select("COUNT(*)::int", "total")
      .addSelect(
        "COUNT(*) FILTER (WHERE ticket.status = :open)::int",
        "open",
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE ticket.status = :assigned)::int",
        "assigned",
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE ticket.status = :inProgress)::int",
        "in_progress",
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE ticket.status = :review)::int",
        "review",
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
        review: TicketStatus.review,
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
      review: Number(result.review ?? 0),
      completed: Number(result.completed ?? 0),
      closed: Number(result.closed ?? 0),
    };
  }

  public static async getPriorityCounts(
    departmentId?: string,
  ): Promise<DashboardPriorityCounts> {
    const query = this.repository
      .createQueryBuilder("ticket")
      .select(
        "COUNT(*) FILTER (WHERE ticket.priority = :low)::int",
        "low",
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE ticket.priority = :medium)::int",
        "medium",
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE ticket.priority = :high)::int",
        "high",
      )
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

  public static async getAverageCompletionTimeHours(
    departmentId?: string,
  ): Promise<number> {
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
        `ticket.closedAt >= CURRENT_DATE - INTERVAL '${TREND_WINDOW_DAYS - 1} days'`,
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

  public static async getTicketsOverTime(
    departmentId?: string,
  ): Promise<TicketsOverTimeEntry[]> {
    const params: string[] = [];
    let departmentFilter = "";

    if (departmentId) {
      departmentFilter = "AND department_id = $1";
      params.push(departmentId);
    }

    const sql = `
      SELECT
        to_char(d.day, 'YYYY-MM-DD') AS date,
        COALESCE(created.count, 0)::int AS created,
        COALESCE(closed.count, 0)::int AS closed
      FROM generate_series(
        CURRENT_DATE - INTERVAL '${TREND_WINDOW_DAYS - 1} days',
        CURRENT_DATE,
        INTERVAL '1 day'
      ) AS d(day)
      LEFT JOIN (
        SELECT DATE(created_at) AS day, COUNT(*) AS count
        FROM ticket
        WHERE created_at >= CURRENT_DATE - INTERVAL '${TREND_WINDOW_DAYS - 1} days'
        ${departmentFilter}
        GROUP BY DATE(created_at)
      ) created ON created.day = d.day
      LEFT JOIN (
        SELECT DATE(closed_at) AS day, COUNT(*) AS count
        FROM ticket
        WHERE status = 'closed' AND closed_at >= CURRENT_DATE - INTERVAL '${TREND_WINDOW_DAYS - 1} days'
        ${departmentFilter}
        GROUP BY DATE(closed_at)
      ) closed ON closed.day = d.day
      ORDER BY d.day ASC
    `;

    return this.repository.query(sql, params);
  }

  public static async getDepartmentBreakdown(): Promise<
    DepartmentBreakdownRow[]
  > {
    const sql = `
      SELECT
        dep.department_id AS department_id,
        dep.department_name AS department_name,
        COUNT(t.ticket_id)::int AS total,
        COUNT(*) FILTER (WHERE t.status = 'open')::int AS open,
        COUNT(*) FILTER (WHERE t.status = 'assigned')::int AS assigned,
        COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE t.status = 'review')::int AS review,
        COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE t.status = 'closed')::int AS closed,
        COUNT(*) FILTER (WHERE t.priority = 'low')::int AS priority_low,
        COUNT(*) FILTER (WHERE t.priority = 'medium')::int AS priority_medium,
        COUNT(*) FILTER (WHERE t.priority = 'high')::int AS priority_high,
        COUNT(*) FILTER (WHERE t.priority = 'urgent')::int AS priority_urgent,
        AVG(EXTRACT(EPOCH FROM (t.closed_at - t.created_at)) / 3600.0) FILTER (
          WHERE t.status = 'closed'
            AND t.closed_at IS NOT NULL
            AND t.closed_at >= CURRENT_DATE - INTERVAL '${TREND_WINDOW_DAYS - 1} days'
        ) AS avg_completion_hours
      FROM department dep
      LEFT JOIN ticket t ON t.department_id = dep.department_id
      GROUP BY dep.department_id, dep.department_name
      ORDER BY dep.department_name ASC
    `;

    const rows: Array<Record<string, string | number | null>> =
      await this.repository.query(sql);

    return rows.map((row) => {
      const rawAvg = row.avg_completion_hours;
      const avg =
        rawAvg === null || rawAvg === undefined ? 0 : Number(rawAvg);

      return {
        departmentId: String(row.department_id),
        departmentName: String(row.department_name),
        statusCounts: {
          total: Number(row.total ?? 0),
          open: Number(row.open ?? 0),
          assigned: Number(row.assigned ?? 0),
          inProgress: Number(row.in_progress ?? 0),
          review: Number(row.review ?? 0),
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
