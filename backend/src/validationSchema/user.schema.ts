import z from "zod";
import { roleEnum } from "../types/user.js";
import { paginationQuerySchema } from "../utils/pagination.util.js";

export class UserSchema {
  public userIdParamSchema = z
    .object({
      id: z.uuidv7("Invalid user ID format"),
    })
    .strict();

  public updateUserSchema = z
    .object({
      firstName: z
        .string({
          error: "First name must be a string",
        })
        .trim()
        .min(1, "First name cannot be empty")
        .max(50, "First name must not exceed 50 characters")
        .optional(),

      lastName: z
        .string({
          error: "Last name must be a string",
        })
        .trim()
        .min(0)
        .max(50, "Last name must not exceed 50 characters")
        .optional(),

      departmentId: z
        .string({ error: "Department id must be string" })
        .pipe(z.uuidv7("Invalid department ID format"))
        .nullable()
        .optional(),

      role: z
        .enum([roleEnum.user, roleEnum.admin, roleEnum.superAdmin])
        .optional(),
    })
    .strict()
    .refine(
      (data) =>
        data.firstName !== undefined ||
        data.lastName !== undefined ||
        data.departmentId !== undefined ||
        data.role !== undefined,
      {
        message:
          "At least one field (firstName, lastName, departmentId, or role) must be provided",
      },
    );

  public userQuerySchema = z
    .object({
      department: z
        .string({ error: "Department must be a string" })
        .trim()
        .min(1, "Department cannot be empty")
        .max(100, "Department must not exceed 100 characters")
        .optional(),

      firstName: z
        .string({ error: "First name must be a string" })
        .trim()
        .min(1, "First name cannot be empty")
        .max(50, "First name must not exceed 50 characters")
        .optional(),

      role: z
        .enum([roleEnum.user, roleEnum.admin, roleEnum.superAdmin])
        .optional(),

      ...paginationQuerySchema,
    })
    .strict();
}
