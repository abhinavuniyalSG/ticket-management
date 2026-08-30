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
        .toLowerCase()
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
        .toLowerCase()
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
        .email("Invalid email address")
        .min(1, "Email is required")
        .max(255, "Email must not exceed 255 characters")
        .toLowerCase(),

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
        .email("Invalid email address")
        .min(1, "Email is required")
        .max(255, "Email must not exceed 255 characters")
        .toLowerCase(),

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

  public refreshTokenSchema = z
    .object({
      refreshToken: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Refresh token is required"
              : "Refresh token must be a string",
        })
        .min(1, "Refresh token is required"),
    })
    .strict();
}
