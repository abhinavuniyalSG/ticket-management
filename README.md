# Ticket Management System

A role-based support ticket management system: a REST API (Express, TypeORM, PostgreSQL) with a React frontend, covering ticket creation and lifecycle management, department organisation, user and contact management, dashboard analytics, and email notifications.

## Tech stack

**Backend** (`backend/`)
- Node.js, Express 5, TypeScript
- PostgreSQL via TypeORM
- Zod for request validation
- JWT authentication (access + refresh tokens, httpOnly cookies), bcrypt password hashing
- Nodemailer for email (verification, notifications, scheduled summaries)
- Winston (logging), Morgan (HTTP request logging), express-rate-limit
- Swagger/OpenAPI docs via swagger-jsdoc and swagger-ui-express
- Vitest for tests

**Frontend** (`Frontend/`)
- React 19, TypeScript, Vite
- React Router for routing
- Tailwind CSS
- Vitest + React Testing Library for unit/component tests
- Playwright for end-to-end tests

## Features

- **Authentication**: register, login, logout, rotating access/refresh tokens delivered as httpOnly cookies, email verification (24-hour link) with resend, and a change-password flow that only needs the account's email and current password (no active session required).
- **Roles**: `user`, `admin`, and `super_admin`, enforced on both the API and the frontend's routing.
  - `user` manages their own tickets and profile.
  - `admin` manages tickets and users within the department(s) they manage.
  - `super_admin` has full access across all departments, users, and tickets.
- **Departments**: any authenticated, verified user can list departments; creating, updating, and deleting departments is restricted to `super_admin`. A department can have a managing admin (`managedBy`), and one admin can manage more than one department.
- **Tickets**: create, view, update, and delete tickets, scoped to the requester's role and department access. Tickets have a priority (`low`/`medium`/`high`/`urgent`) and a status lifecycle (`open` → `assigned` → `in_progress` → `reviewed` → `completed` → `closed`), with status-change permissions depending on whether the requester is the ticket's creator, its assignee, an admin of that department, or a super admin. Tickets can be filtered and sorted (by title, status, priority, department, assignee, creator, and creation date).
- **Contacts**: users can attach phone, WhatsApp, or LinkedIn contact details to their profile.
- **Dashboard analytics**: two endpoints for department- and period-scoped ticket analytics (counts, a priority breakdown, and a ticket activity trend), with access rules mirroring the department/role model above.
- **Email notifications**: sent when a ticket is assigned, when it's ready for review, and when a high/urgent-priority ticket is created; plus scheduled emails, a reminder to department admins every 3 hours, and a daily ticket summary to super admins (also sent once on server startup).
- **API docs**: interactive Swagger UI served at `/api/docs` (raw spec at `/api/docs.json`).

## Project structure

```
Ticket Management System/
├── backend/
│   ├── src/
│   │   ├── server.ts             # Process entry point (listens, schedules notification jobs)
│   │   ├── app.ts                # Express app setup (middleware + route wiring)
│   │   ├── core/                 # App bootstrap (Kernel) and the Winston logger
│   │   ├── config/               # Env var loading (secrets.ts)
│   │   ├── routes/                # Express routers: auth, users, departments, tickets, dashboard
│   │   ├── controllers/           # Request/response handling
│   │   ├── services/              # Business logic
│   │   ├── database/
│   │   │   ├── models/            # TypeORM entities (user, department, ticket, contact)
│   │   │   ├── repositry/         # Data access
│   │   │   └── migration/         # TypeORM migrations
│   │   ├── middleware/            # Auth, email verification, validation, rate limiting, error handling, request logging
│   │   ├── validationSchema/      # Zod request schemas
│   │   ├── types/                 # Shared TypeScript types
│   │   ├── utils/                 # Auth/cookie helpers, HttpError, catchAsync
│   │   ├── docs/                  # Swagger registration
│   │   └── test/                  # Test files, mirroring the folders above
│   ├── swaggerDocs/               # OpenAPI path/schema definitions (YAML)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── nodemon.json
│   └── .env.example
└── Frontend/
    ├── src/
    │   ├── main.tsx               # Entry point (mounts <App />)
    │   ├── index.css
    │   ├── app/                   # App.tsx, routes.tsx, and the auth context/provider
    │   ├── pages/                 # Route-level views: auth/, tickets/, users/, departments/, plus top-level pages
    │   ├── components/            # atoms/, molecules/, organisms/, templates/, layout/
    │   ├── services/              # API client (apiClient.ts) plus one file per resource
    │   ├── hooks/                 # useAuth, useLogout, useDebouncedValue
    │   ├── utils/                 # Formatting, validation, and permission-check helpers
    │   ├── constants/              # Navigation and option/label lookups
    │   ├── types/                  # Shared TypeScript types
    │   └── test/                   # Vitest setup only - see note below
    ├── e2e/                        # Playwright end-to-end specs
    ├── public/                     # Static assets served as-is
    ├── index.html                  # Vite entry HTML
    ├── package.json
    ├── vite.config.ts
    ├── vitest.config.ts
    ├── playwright.config.ts
    ├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
    └── .env.example
```

Frontend unit/component tests live next to the file they test (e.g. `Button.tsx` and `Button.test.tsx` in the same folder), rather than in a separate test directory - `src/test/` only holds the Vitest setup file.

## Getting started

### Prerequisites

- Node.js and npm
- A running PostgreSQL instance

### Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in real values
npm run migration:run  # applies the TypeORM migrations
npm run dev             # starts the API with nodemon, on the PORT set in .env
```

The API listens on the port set by `PORT` in `.env` (see `.env.example` for every variable the backend reads). Once running, the docs are at `http://localhost:<PORT>/api/docs`.

### Frontend

```bash
cd Frontend
npm install
cp .env.example .env   # then fill in real values (defaults to the backend above)
npm run dev
```

## Testing

**Backend** (from `backend/`):
```bash
npm run test        # runs the Vitest suite once
npm run test:watch  # watch mode
```

**Frontend** (from `Frontend/`):
```bash
npm run test          # Vitest unit/component tests
npm run test:e2e      # Playwright end-to-end tests
npm run test:e2e:ui   # Playwright tests with the UI runner
```

## Backend scripts

Run from `backend/`:

| Script | Purpose |
|---|---|
| `npm run dev` | Start the API in watch mode (nodemon) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build (`dist/server.js`) |
| `npm run migration:generate` / `migration:create` / `migration:run` / `migration:revert` / `migration:show` | TypeORM migration management |
