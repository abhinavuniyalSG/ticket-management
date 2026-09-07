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
          ],
          { error: "Period must be one of day, week, month, year, all" },
        )
        .default(DashboardOverviewPeriod.day),
    })
    .strict();
}
