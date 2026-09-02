import z from "zod";

export class DepartmentSchema {
  public departmentQuerySchema = z
    .object({
      departmentName: z
        .string({ error: "Department name must be a string" })
        .trim()
        .min(1, "Department name cannot be empty")
        .max(100, "Department name must not exceed 100 characters")
        .optional(),
    })
    .strict();

  public departmentIdParamSchema = z
    .object({
      id: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Department id  is required"
              : "Department id  must be a string",
        })
        .pipe(z.uuidv7("Invalid department ID format")),
    })
    .strict();

  public createDepartmentSchema = z
    .object({
      departmentName: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Departmen name is required"
              : "Department name must be a string",
        })
        .trim()
        .min(2, "Department name must be at least 2 characters")
        .max(100, "Department name must not exceed 100 characters"),
      departmentEmail: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Departmen email is required"
              : "Department email must be a string",
        })
        .trim()
        .max(254, "Email must not exceed 254 characters")
        .toLowerCase()
        .pipe(z.email("Invalid email format")),

      managedBy: z
        .string({
          error: "User id  must be a string",
        })
        .pipe(z.uuidv7("Invalid manager ID format"))
        .nullable()
        .optional(),
    })
    .strict();

  public updateDepartmentSchema = z
    .object({
      departmentName: z
        .string({
          error: "department name must be a string",
        })
        .trim()
        .min(2, "Department name must be at least 2 characters")
        .max(100, "Department name must not exceed 100 characters")
        .optional(),
      departmentEmail: z
        .string({
          error: "department email must be a string",
        })
        .trim()
        .max(254, "Email must not exceed 254 characters")
        .toLowerCase()
        .pipe(z.email("Invalid email format"))
        .optional(),

      managedBy: z
        .string({
          error: "User id  must be a string",
        })
        .pipe(z.uuidv7("Invalid manager ID format"))
        .nullable()
        .optional(),
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
