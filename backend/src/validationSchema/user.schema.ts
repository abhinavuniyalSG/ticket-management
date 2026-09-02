import z from "zod";
import { ContactType } from "../types/contact.js";
import { roleEnum } from "../types/user.js";

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

      contacts: z
        .array(
          z.object({
            contactType: z.enum([
              ContactType.phone,
              ContactType.whatsapp,
              ContactType.linkedin,
            ]),
            contactDetail: z
              .string({
                error: (issue) =>
                  issue.input === undefined
                    ? "Contact detail is required"
                    : "Contact detail must be a string",
              })
              .trim()
              .min(1, "Contact detail cannot be empty")
              .max(500, "Contact detail must not exceed 500 characters"),
          }),
        )
        .optional(),
    })
    .strict()
    .refine(
      (data) =>
        data.firstName !== undefined ||
        data.lastName !== undefined ||
        data.departmentId !== undefined ||
        data.role !== undefined ||
        data.contacts !== undefined,
      {
        message:
          "At least one field (firstName, lastName, departmentId, or contacts) must be provided",
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
    })
    .strict();

  public contactIdParamSchema = z
    .object({
      contactId: z
        .string({ error: "Contact id must be a string" })
        .pipe(z.uuidv7("Invalid contact ID format")),
    })
    .strict();

  public addContactSchema = z
    .object({
      contactType: z.enum([
        ContactType.phone,
        ContactType.whatsapp,
        ContactType.linkedin,
      ]),

      contactDetail: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Contact detail is required"
              : "Contact detail must be a string",
        })
        .trim()
        .min(1, "Contact detail cannot be empty")
        .max(500, "Contact detail must not exceed 500 characters"),
    })
    .strict();

  public updateContactSchema = z
    .object({
      contactType: z
        .enum([ContactType.phone, ContactType.whatsapp, ContactType.linkedin])
        .optional(),

      contactDetail: z
        .string({ error: "Contact detail must be a string" })
        .trim()
        .min(1, "Contact detail cannot be empty")
        .max(500, "Contact detail must not exceed 500 characters")
        .optional(),
    })
    .strict()
    .refine(
      (data) =>
        data.contactType !== undefined || data.contactDetail !== undefined,
      {
        message:
          "At least one field (contactType or contactDetail) must be provided",
      },
    );
}
