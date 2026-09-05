import z from "zod";
import { TicketTrendPeriod } from "../database/repositry/dashboard.repository.js";
import { DashboardOverviewPeriod } from "../services/dashboard.service.js";

export class DashboardSchema {
  public dashboardQuerySchema = z
    .object({
      departmentId: z
        .string({ error: "Department id must be a string" })
        .pipe(z.uuidv7("Invalid department ID format"))
        .optional(),
      period: z
        .enum(
          [
            TicketTrendPeriod.day,
            TicketTrendPeriod.week,
            TicketTrendPeriod.month,
            TicketTrendPeriod.year,
          ],
          { error: "Period must be one of day, week, month, year" },
        )
        .default(TicketTrendPeriod.day),
    })
    .strict();

  public dashboardOverviewQuerySchema = z
    .object({
      departmentId: z
        .string({ error: "Department id must be a string" })
        .pipe(z.uuidv7("Invalid department ID format"))
        .optional(),
      period: z
        .enum(
          [
            DashboardOverviewPeriod.day,
            DashboardOverviewPeriod.week,
            DashboardOverviewPeriod.month,
            DashboardOverviewPeriod.year,
            DashboardOverviewPeriod.all,
            DashboardOverviewPeriod.custom,
          ],
          { error: "Period must be one of day, week, month, year, all, custom" },
        )
        .default(DashboardOverviewPeriod.day),
      year: z.coerce
        .number({ error: "Year must be a number" })
        .int("Year must be a whole number")
        .min(1000, "Year must be a 4-digit year")
        .max(9999, "Year must be a 4-digit year")
        .optional(),
      month: z.coerce
        .number({ error: "Month must be a number" })
        .int("Month must be a whole number")
        .min(1, "Month must be between 1 and 12")
        .max(12, "Month must be between 1 and 12")
        .optional(),
      day: z.coerce
        .number({ error: "Day must be a number" })
        .int("Day must be a whole number")
        .min(1, "Day must be between 1 and 31")
        .max(31, "Day must be between 1 and 31")
        .optional(),
    })
    .strict()
    .refine(
      (data) =>
        data.period === DashboardOverviewPeriod.custom ||
        (data.year === undefined &&
          data.month === undefined &&
          data.day === undefined),
      {
        message: "year, month, and day are only allowed when period is 'custom'",
      },
    )
    .refine(
      (data) =>
        data.period !== DashboardOverviewPeriod.custom ||
        data.year !== undefined,
      { message: "year is required when period is 'custom'" },
    )
    .refine((data) => data.day === undefined || data.month !== undefined, {
      message: "day requires month to also be provided",
    });
}
