import { AppDataSource } from "../dbConnection.js";
import { Ticket } from "../models/ticket.model.js";
import { TicketPriority, TicketStatus } from "../../types/ticket.js";
import type { SelectQueryBuilder } from "typeorm";

export interface TicketStatusCounts {
  totalCreated_today: number;
  open: number;
  assigned: number;
  inProgress: number;
  reviewed: number;
  completed: number;
  closed_date_today: number;
}

export interface TicketPriorityCounts {
  low: number;
  medium: number;
  high: number;
  urgent: number;
}

export interface TicketCountFilter {
  departmentId?: string | undefined;
  createdFrom?: Date | undefined;
  createdTo?: Date | undefined;
}

export interface TicketTrendEntry {
  date: string;
  created: number;
  closed: number;
}

/**
 * How `GET /dashboard`'s `ticketsOverTime` is bucketed:
 * - day: 7 daily buckets, today plus the previous 6 days.
 * - week: 4 weekly buckets (Monday-anchored), this week plus the previous 3 complete weeks.
 * - month: 12 monthly buckets, this month plus the previous 12 months.
 * - year: one bucket per year, from the department's (or system's) earliest ticket through this year.
 */
export enum TicketTrendPeriod {
  day = "day",
  week = "week",
  month = "month",
  year = "year",
}

const TREND_DAY_BUCKET_COUNT = 7;
const TREND_WEEK_BUCKET_COUNT = 4;
const TREND_MONTH_BUCKET_COUNT = 12;
const DAYS_PER_WEEK = 7;

function startOfUtcDay(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/** Monday 00:00 UTC of the current ISO week. */
function startOfUtcWeek(): Date {
  const today = startOfUtcDay();
  const isoWeekday = today.getUTCDay() === 0 ? 7 : today.getUTCDay();
  today.setUTCDate(today.getUTCDate() - (isoWeekday - 1));
  return today;
}

function startOfUtcMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Oldest-first 'YYYY-MM-DD' keys: today and the previous 6 days. */
export function getDailyTrendBucketKeys(): string[] {
  const today = startOfUtcDay();
  const keys: string[] = [];
  for (let i = TREND_DAY_BUCKET_COUNT - 1; i >= 0; i--) {
    const bucket = new Date(today);
    bucket.setUTCDate(bucket.getUTCDate() - i);
    keys.push(bucket.toISOString().slice(0, 10));
  }
  return keys;
}

/** Oldest-first 'YYYY-MM-DD' keys (each a Monday): this week and the previous 3 complete weeks. */
export function getWeeklyTrendBucketKeys(): string[] {
  const thisWeek = startOfUtcWeek();
  const keys: string[] = [];
  for (let i = TREND_WEEK_BUCKET_COUNT - 1; i >= 0; i--) {
    const bucket = new Date(thisWeek);
    bucket.setUTCDate(bucket.getUTCDate() - i * DAYS_PER_WEEK);
    keys.push(bucket.toISOString().slice(0, 10));
  }
  return keys;
}

/** Oldest-first 'YYYY-MM' keys: this month and the previous 12 months. */
export function getMonthlyTrendBucketKeys(): string[] {
  const thisMonth = startOfUtcMonth();
  const keys: string[] = [];
  for (let i = TREND_MONTH_BUCKET_COUNT - 1; i >= 0; i--) {
    const bucket = new Date(
      Date.UTC(thisMonth.getUTCFullYear(), thisMonth.getUTCMonth() - i, 1),
    );
    keys.push(bucket.toISOString().slice(0, 7));
  }
  return keys;
}

/** Oldest-first 'YYYY' keys, from `earliestTicketYear` through the current year (just the current year if null). */
export function getYearlyTrendBucketKeys(
  earliestTicketYear: number | null,
): string[] {
  const currentYear = new Date().getUTCFullYear();
  const startYear = Math.min(earliestTicketYear ?? currentYear, currentYear);
  const keys: string[] = [];
  for (let year = startYear; year <= currentYear; year++) {
    keys.push(String(year));
  }
  return keys;
}

/** The Date an oldest-first bucket-key array starts at, for bounding the SQL query. */
export function getTrendRangeStart(
  period: TicketTrendPeriod,
  oldestBucketKey: string,
): Date {
  if (period === TicketTrendPeriod.month) {
    return new Date(`${oldestBucketKey}-01T00:00:00.000Z`);
  }
  if (period === TicketTrendPeriod.year) {
    return new Date(`${oldestBucketKey}-01-01T00:00:00.000Z`);
  }
  return new Date(`${oldestBucketKey}T00:00:00.000Z`);
}

export class DashboardRepository {
  private static repository = AppDataSource.getRepository(Ticket);

  private static filterByDepartment(
    query: SelectQueryBuilder<Ticket>,
    departmentId?: string,
  ): void {
    if (departmentId) {
      query.andWhere("ticket.departmentId = :departmentId", { departmentId });
    }
  }

  private static filterByCreatedAtRange(
    query: SelectQueryBuilder<Ticket>,
    createdFrom?: Date,
    createdTo?: Date,
  ): void {
    if (createdFrom) {
      query.andWhere("ticket.createdAt >= :createdFrom", { createdFrom });
    }
    if (createdTo) {
      query.andWhere("ticket.createdAt < :createdTo", { createdTo });
    }
  }

  /**
   * A `COUNT(*) FILTER (WHERE ...)` time-window condition against `column`,
   * built without referencing any unbound parameter (Postgres rejects a
   * parameter that isn't given a value, even inside an unused branch).
   */
  private static rangeCondition(
    column: string,
    from?: Date,
    to?: Date,
    params: Record<string, unknown> = {},
  ): { sql: string; params: Record<string, unknown> } {
    const conditions: string[] = [];
    if (from) {
      conditions.push(`${column} >= :rangeFrom`);
      params.rangeFrom = from;
    }
    if (to) {
      conditions.push(`${column} <= :rangeTo`);
      params.rangeTo = to;
    }
    return {
      sql: conditions.length > 0 ? conditions.join(" AND ") : "TRUE",
      params,
    };
  }

  /**
   * Ticket counts per status, optionally scoped to a department and/or a
   * createdAt window ("tickets created in this period").
   *
   * The `closed` count is the one exception: it's windowed by `closedAt`
   * instead of `createdAt`, so it answers "tickets closed in this period" -
   * matching how `getTicketTrend`'s `closed` bucket is computed. Windowing it
   * by `createdAt` like the other statuses would make a ticket created
   * earlier and closed today invisible to the "today" overview even though
   * the trend chart counts it as closed today, which is exactly the mismatch
   * this was reported for.
   */
  public static async countTicketsByStatus(
    filter: TicketCountFilter = {},
  ): Promise<TicketStatusCounts> {
    const created = this.rangeCondition(
      "ticket.createdAt",
      filter.createdFrom,
      filter.createdTo,
    );
    const closed = this.rangeCondition(
      "ticket.closedAt",
      filter.createdFrom,
      filter.createdTo,
      { ...created.params },
    );

    const query = this.repository
      .createQueryBuilder("ticket")
      .select(`COUNT(*) FILTER (WHERE ${created.sql})::int`, "total")
      .addSelect(
        `COUNT(*) FILTER (WHERE ticket.status = :open AND ${created.sql})::int`,
        "open",
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE ticket.status = :assigned AND ${created.sql})::int`,
        "assigned",
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE ticket.status = :inProgress AND ${created.sql})::int`,
        "in_progress",
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE ticket.status = :reviewed AND ${created.sql})::int`,
        "reviewed",
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE ticket.status = :completed AND ${created.sql})::int`,
        "completed",
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE ticket.status = :closed AND ${closed.sql})::int`,
        "closed",
      )
      .setParameters({
        open: TicketStatus.open,
        assigned: TicketStatus.assigned,
        inProgress: TicketStatus.inProgress,
        reviewed: TicketStatus.reviewed,
        completed: TicketStatus.completed,
        closed: TicketStatus.closed,
        ...closed.params,
      });

    this.filterByDepartment(query, filter.departmentId);

    const row = await query.getRawOne();

    return {
      totalCreated_today: Number(row.total ?? 0),
      open: Number(row.open ?? 0),
      assigned: Number(row.assigned ?? 0),
      inProgress: Number(row.in_progress ?? 0),
      reviewed: Number(row.reviewed ?? 0),
      completed: Number(row.completed ?? 0),
      closed_date_today: Number(row.closed ?? 0),
    };
  }

  /** Ticket counts per priority, optionally scoped to a department and/or a createdAt window. */
  public static async countTicketsByPriority(
    filter: TicketCountFilter = {},
  ): Promise<TicketPriorityCounts> {
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

    this.filterByDepartment(query, filter.departmentId);
    this.filterByCreatedAtRange(query, filter.createdFrom, filter.createdTo);

    const row = await query.getRawOne();

    return {
      low: Number(row.low ?? 0),
      medium: Number(row.medium ?? 0),
      high: Number(row.high ?? 0),
      urgent: Number(row.urgent ?? 0),
    };
  }

  /** The calendar year of the department's (or system's) very first ticket, or null if there are none. */
  private static async findEarliestTicketYear(
    departmentId?: string,
  ): Promise<number | null> {
    const query = this.repository
      .createQueryBuilder("ticket")
      .select("MIN(ticket.createdAt)", "earliestCreatedAt");
    this.filterByDepartment(query, departmentId);

    const row = await query.getRawOne<{
      earliestCreatedAt: Date | string | null;
    }>();
    if (!row?.earliestCreatedAt) {
      return null;
    }
    return new Date(row.earliestCreatedAt).getUTCFullYear();
  }

  private static async trendBucketKeys(
    period: TicketTrendPeriod,
    departmentId?: string,
  ): Promise<string[]> {
    switch (period) {
      case TicketTrendPeriod.day:
        return getDailyTrendBucketKeys();
      case TicketTrendPeriod.week:
        return getWeeklyTrendBucketKeys();
      case TicketTrendPeriod.month:
        return getMonthlyTrendBucketKeys();
      case TicketTrendPeriod.year: {
        const earliestYear = await this.findEarliestTicketYear(departmentId);
        return getYearlyTrendBucketKeys(earliestYear);
      }
    }
  }

  /** SQL bucketing a timestamptz column to match the keys `trendBucketKeys` produces for this period. */
  private static trendBucketExpression(
    column: string,
    period: TicketTrendPeriod,
  ): string {
    const utcColumn = `${column} AT TIME ZONE 'UTC'`;
    switch (period) {
      case TicketTrendPeriod.week:
        return `to_char(date_trunc('week', ${utcColumn}), 'YYYY-MM-DD')`;
      case TicketTrendPeriod.month:
        return `to_char(date_trunc('month', ${utcColumn}), 'YYYY-MM')`;
      case TicketTrendPeriod.year:
        return `to_char(date_trunc('year', ${utcColumn}), 'YYYY')`;
      case TicketTrendPeriod.day:
        return `to_char(${utcColumn}, 'YYYY-MM-DD')`;
    }
  }

  /** Tickets created and closed per bucket over the trend period, oldest first, zero-filled. */
  public static async getTicketTrend(
    departmentId: string | undefined,
    period: TicketTrendPeriod = TicketTrendPeriod.day,
  ): Promise<TicketTrendEntry[]> {
    const bucketKeys = await this.trendBucketKeys(period, departmentId);
    const rangeStart = getTrendRangeStart(period, bucketKeys[0]!);

    const createdBucket = this.trendBucketExpression(
      "ticket.createdAt",
      period,
    );
    const closedBucket = this.trendBucketExpression("ticket.closedAt", period);

    const createdQuery = this.repository
      .createQueryBuilder("ticket")
      .select(createdBucket, "bucket")
      .addSelect("COUNT(*)", "count")
      .where("ticket.createdAt >= :rangeStart", { rangeStart })
      .groupBy(createdBucket);
    this.filterByDepartment(createdQuery, departmentId);

    const closedQuery = this.repository
      .createQueryBuilder("ticket")
      .select(closedBucket, "bucket")
      .addSelect("COUNT(*)", "count")
      .where("ticket.status = :closed", { closed: TicketStatus.closed })
      .andWhere("ticket.closedAt >= :rangeStart", { rangeStart })
      .groupBy(closedBucket);
    this.filterByDepartment(closedQuery, departmentId);

    const [createdRows, closedRows] = await Promise.all([
      createdQuery.getRawMany<{ bucket: string; count: string }>(),
      closedQuery.getRawMany<{ bucket: string; count: string }>(),
    ]);

    const createdByBucket = new Map(
      createdRows.map((row) => [row.bucket, Number(row.count)]),
    );
    const closedByBucket = new Map(
      closedRows.map((row) => [row.bucket, Number(row.count)]),
    );

    return bucketKeys.map((date) => ({
      date,
      created: createdByBucket.get(date) ?? 0,
      closed: closedByBucket.get(date) ?? 0,
    }));
  }
}
