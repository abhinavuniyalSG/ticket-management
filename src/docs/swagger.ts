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
All endpoints (except \`/auth/register\`, \`/auth/login\`, and \`/auth/refresh\`) require a
**Bearer token** in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`
Obtain tokens by calling \`POST /api/auth/login\`.

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
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT access token obtained from POST /api/auth/login",
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
