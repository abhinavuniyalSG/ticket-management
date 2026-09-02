import z from "zod";

export class AuthenticationSchema {
  public registerSchema = z
    .object({
      firstName: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "First name is required"
              : "First name must be a string",
        })
        .trim()
        .min(1, "First name is required")
        .max(50, "First name must not exceed 50 characters"),

      lastName: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Last name is required"
              : "Last name must be a string",
        })
        .trim()
        .min(0, "Last name is required")
        .max(50, "Last must not exceed 50 characters"),

      email: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Email is required"
              : "Email must be a string",
        })
        .trim()
        .min(1, "Email is required")
        .max(255, "Email must not exceed 255 characters")
        .toLowerCase()
        .pipe(z.email("Invalid email address")),

      password: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Password is required"
              : "Password must be a string",
        })
        .min(8, "Password must be at least 8 characters long")
        .max(255, "Password must not exceed 255 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(
          /[^A-Za-z0-9]/,
          "Password must contain at least one special character",
        ),
    })
    .strict();

  public loginSchema = z
    .object({
      email: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Email is required"
              : "Email must be a string",
        })
        .trim()
        .min(1, "Email is required")
        .max(255, "Email must not exceed 255 characters")
        .toLowerCase()
        .pipe(z.email("Invalid email address")),

      password: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Password is required"
              : "Password must be a string",
        })
        .min(1, "Password is required")
        .max(255, "Password must not exceed 255 characters"),
    })
    .strict();

  public changePasswordSchema = z
    .object({
      email: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Email is required"
              : "Email must be a string",
        })
        .trim()
        .min(1, "Email is required")
        .max(255, "Email must not exceed 255 characters")
        .toLowerCase()
        .pipe(z.email("Invalid email address")),

      oldPassword: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Old password is required"
              : "Old password must be a string",
        })
        .min(1, "Old password is required")
        .max(255, "Old password must not exceed 255 characters"),

      newPassword: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "New password is required"
              : "New password must be a string",
        })
        .min(8, "New password must be at least 8 characters long")
        .max(255, "New password must not exceed 255 characters")
        .regex(
          /[A-Z]/,
          "New password must contain at least one uppercase letter",
        )
        .regex(
          /[a-z]/,
          "New password must contain at least one lowercase letter",
        )
        .regex(/[0-9]/, "New password must contain at least one number")
        .regex(
          /[^A-Za-z0-9]/,
          "New password must contain at least one special character",
        ),
    })
    .strict()
    .refine((data) => data.newPassword !== data.oldPassword, {
      message: "New password must be different from the old password",
      path: ["newPassword"],
    });

  public verifyEmailParamSchema = z
    .object({
      token: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Verification token is required"
              : "Verification token must be a string",
        })
        .min(1, "Verification token is required"),
    })
    .strict();

  public resendVerificationSchema = z
    .object({
      email: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Email is required"
              : "Email must be a string",
        })
        .trim()
        .min(1, "Email is required")
        .max(255, "Email must not exceed 255 characters")
        .toLowerCase()
        .pipe(z.email("Invalid email address")),
    })
    .strict();
}
