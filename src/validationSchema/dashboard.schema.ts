import z from "zod";

export class DashboardSchema {
  public dashboardQuerySchema = z
    .object({
      departmentId: z
        .string({ error: "Department id must be a string" })
        .pipe(z.uuidv7("Invalid department ID format"))
        .optional(),
    })
    .strict();
}
