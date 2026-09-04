import z from "zod";
import { DashboardPeriod } from "../database/repositry/dashboard.repository.js";

export class DashboardSchema {
  public dashboardQuerySchema = z
    .object({
      departmentId: z
        .string({ error: "Department id must be a string" })
        .pipe(z.uuidv7("Invalid department ID format"))
        .optional(),
      period: z
        .enum([DashboardPeriod.week, DashboardPeriod.month, DashboardPeriod.year], {
          error: "Period must be one of week, month, year",
        })
        .default(DashboardPeriod.week),
    })
    .strict();

  public dashboardOverviewQuerySchema = z
    .object({
      period: z
        .enum([DashboardPeriod.week, DashboardPeriod.month, DashboardPeriod.year], {
          error: "Period must be one of week, month, year",
        })
        .default(DashboardPeriod.week),
    })
    .strict();
}
