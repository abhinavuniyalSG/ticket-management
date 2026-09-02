import type { Application } from "express";
import { resolve } from "node:path";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Ticket Management System API",
      version: "1.0.0",
      description: `
## Overview
A role-based ticket management REST API built with Express, TypeORM, and PostgreSQL.

## Authentication
Tokens are never sent or accepted in the request/response body. All endpoints
(except \`/auth/register\`, \`/auth/login\`, \`/auth/refresh\`, \`/auth/verify-email/{token}\`,
and \`/auth/resend-verification\`) require an access token, supplied via (in order of
precedence) the \`Authorization\` header, or the \`accessToken\` httpOnly cookie:
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`
\`POST /api/auth/login\`, \`/register\`, and \`/refresh\` set the tokens as httpOnly
cookies (\`accessToken\`, \`refreshToken\`) on the response. \`POST /api/auth/refresh\`
reads the refresh token from (in order of precedence) an \`Authorization: Bearer
<refreshToken>\` header, or the \`refreshToken\` cookie. \`POST /api/auth/logout\`
clears both cookies.

## Email verification
New accounts are created with \`isVerified: false\` and receive a verification email
(link valid for 24 hours). Every endpoint **other than the \`/auth/*\` routes** requires the
authenticated user to have a verified email, and returns **403** with
\`{ "message": "Please verify your email first" }\` otherwise. \`/auth/*\` endpoints
(login, logout, change-password, etc.) remain usable while unverified.

## Roles
| Role | Description |
|---|---|
| \`user\` | Regular user. Can manage own tickets and profile. |
| \`admin\` | Department-level admin. Can manage users and tickets within their department. |
| \`super_admin\` | Full access across all departments, users, and tickets. |
      `,
      contact: {
        name: "Ticket Management System",
      },
    },
    servers: [
      { url: "/api", description: "Current server" },
    ],
    tags: [
      { name: "Authentication", description: "Register, login, token refresh, logout" },
      { name: "Users", description: "User profile and contact management" },
      { name: "Departments", description: "Department CRUD (super_admin only for writes)" },
      { name: "Tickets", description: "Ticket lifecycle management with role-based access" },
      { name: "Dashboard", description: "Read-only ticket analytics and statistics (role-scoped)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT access token obtained from POST /api/auth/login",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "httpOnly accessToken cookie set by /auth/login, /auth/register, or /auth/refresh",
        },
      },
    },
  },
  apis: [resolve(process.cwd(), "swaggerDocs/**/*.yaml")],
});

export const registerSwagger = (app: Application): void => {
  app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: "Ticket Management API Docs",
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "list",
        filter: true,
        tagsSorter: "alpha",
      },
    }),
  );
};
