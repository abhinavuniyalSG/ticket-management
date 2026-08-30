import z from "zod";

export class DepartmentSchema {
  public departmentIdParamSchema = z
    .object({
      id: z.string().uuid("Invalid department ID format"),
    })
    .strict();

  public createDepartmentSchema = z
    .object({
      departmentName: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "departmen name is required"
              : "department name must be a string",
        })
        .trim()
        .min(2, "Department name must be at least 2 characters")
        .max(100, "Department name must not exceed 100 characters"),
      departmentEmail: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "departmen email is required"
              : "department email must be a string",
        })
        .trim()
        .max(254, "Email must not exceed 254 characters")
        .pipe(z.email("Invalid email format")),
      managedBy: z.uuidv7("Invalid manager ID format").nullable().optional(),
    })
    .strict();

  public updateDepartmentSchema = z
    .object({
      departmentName: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "departmen name is required"
              : "department name must be a string",
        })
        .trim()
        .min(2, "Department name must be at least 2 characters")
        .max(100, "Department name must not exceed 100 characters")
        .optional(),
      departmentEmail: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "departmen email is required"
              : "department email must be a string",
        })
        .trim()
        .max(254, "Email must not exceed 254 characters")
        .optional()
        .pipe(z.email("Invalid email format")),

      managedBy: z.uuidv7("Invalid manager ID format").nullable().optional(),
    })
    .strict()
    .refine(
      (data) =>
        data.departmentName !== undefined ||
        data.departmentEmail !== undefined ||
        data.managedBy !== undefined,
      {
        message:
          "At least one field (departmentName, departmentEmail, or managedBy) must be provided",
      },
    );
}
