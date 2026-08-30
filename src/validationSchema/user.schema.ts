import z from "zod";
import { ContactType } from "../types/contact.js";

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
          error: (issue) =>
            issue.input === undefined
              ? "First name is required"
              : "First name must be a string",
        })
        .trim()
        .min(1, "First name cannot be empty")
        .max(50, "First name must not exceed 50 characters")
        .optional(),
      lastName: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Last name is required"
              : "Last name must be a string",
        })
        .trim()
        .min(0)
        .max(50, "Last name must not exceed 50 characters")
        .optional(),
      departmentId: z
        .uuidv7("Invalid department ID format")
        .nullable()
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
    .strict();

  public contactIdParamSchema = z
    .object({
      contactId: z.uuidv7("Invalid contact ID format"),
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
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Contact detail is required"
              : "Contact detail must be a string",
        })
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
