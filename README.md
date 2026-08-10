# Ticket Management System API

A RESTful backend API for managing support tickets, users, departments, and administrative operations.

The project is built with **Node.js**, **Express**, and **MySQL** and follows a layered architecture that separates HTTP handling, business logic, and database access.

## Features

- User registration and login
- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control for administrators
- Create, view, update, and delete tickets
- Ticket assignment and status management
- Department management
- Admin user management
- Admin ticket management and filtering
- Centralized error handling


---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| MySQL | Relational database |
| mysql2 | MySQL client and connection pool |
| JWT | Authentication |
| bcrypt | Password hashing |
| dotenv | Environment variables |
| CORS | Cross-origin request handling |

---


## Project Architecture

The project uses a **layered architecture** with responsibilities separated into routes, controllers, services, repositories, middleware, and database configuration.

```text
src/
├── app.js
│
├── config/
│   └── db.js
│
├── database/
│   └── schema.sql
│
├── middleware/
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── notFound.middleware.js
│
├── routes/
│   ├── status.routes.js
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── ticket.routes.js
│   ├── department.routes.js
│   └── admin.routes.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── ticket.controller.js
│   ├── department.controller.js
│   └── admin.controller.js
│
├── services/
│   ├── auth.service.js
│   ├── user.service.js
│   ├── ticket.service.js
│   ├── department.service.js
│   └── admin.service.js
│
├── repositories/
│   ├── auth.repository.js
│   ├── user.repository.js
│   ├── ticket.repository.js
│   ├── department.repository.js
│   └── admin.repository.js
│
└── utils/
    └── auth.util.js
```

### Request flow

A typical authenticated request follows this flow:

```text
Client
  ↓
Route
  ↓
Authentication / Authorization Middleware
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
MySQL
```
---

# API Documentation

## Base URL

```text
http://localhost:3000
```

---

# Authentication

## Register

Creates a new user and returns a JWT.

```http
POST /auth/register
```

### Request body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Success response

```json
{
  "message": "User Registered",
  "token": "<jwt-token>"
}
```

---

## Login

Authenticates an existing user.

```http
POST /auth/login
```

### Request body

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Success response

```json
{
  "message": "User successfully Login",
  "token": "<jwt-token>"
}
```

---

# Authentication Header

Protected routes require a JWT.

Send the token using the `Authorization` header:

```http
Authorization: Bearer <jwt-token>
```

Protected route groups include:

```text
/ticket
/user
/admin
/department
```

---

# Status

Checks whether the API is running.

```http
GET /status
```

### Response

```json
"Server is live !!!"
```

---

# User APIs

## Get Current User

Returns details for the authenticated user.

```http
GET /user
```

Authentication required.

---


# Ticket APIs

All ticket routes require authentication.

## Get User Tickets

```http
GET /ticket
```

By default, returns tickets where the authenticated user is either the creator or assignee.

### Get created tickets only

```http
GET /ticket?way=created_by
```

### Get assigned tickets only

```http
GET /ticket?way=assigned_to
```

---

## Get Ticket by ID

```http
GET /ticket/:id
```

A user can access a ticket when they are:

- the ticket creator,
- the assigned user, or
- an administrator.

---

## Create Ticket

```http
POST /ticket
```

### Request body

```json
{
  "ticketDetails": "Unable to access the internal application.",
  "ticketPrority": "High",
  "department": 1
}
```

Supported priorities:

```text
Low
Medium
High
Critical
```

New tickets are created with the default status:

```text
Pending
```

---

## Update Ticket

```http
PATCH /ticket/:id
```

Supported fields:

```json
{
  "ticket_description": "Updated description",
  "ticket_priority": "Critical",
  "status": "In Progress",
  "department_id": 2
}
```

Users cannot update arbitrary fields.

Status changes are subject to the ticket assignment rules implemented in the service layer.

---

## Delete Ticket

```http
DELETE /ticket/:id
```

Only tickets with the following status can be deleted:

```text
Pending
```

Tickets in other states cannot be deleted through this endpoint.

---

# Department APIs

Department routes require authentication.

## Get All Departments

```http
GET /department
```

## Get Department

```http
GET /department/:id
```

## Create Department

Admin only.

```http
POST /department
```

### Request body

```json
{
  "department_name": "Technical Support"
}
```

## Update Department

Admin only.

```http
PATCH /department/:id
```

### Request body

```json
{
  "department_name": "IT Support"
}
```

## Delete Department

Admin only.

```http
DELETE /department/:id
```

A department cannot be deleted while users or tickets are associated with it.

---

# Admin APIs

All admin routes require:

1. A valid JWT.
2. An authenticated user with the `admin` role.

The middleware chain is:

```text
JWT Authentication
        ↓
Admin Authorization
        ↓
Admin Route
```

---

## Get All Tickets

```http
GET /admin/ticket
```

The endpoint supports filtering through query parameters.

### Filter by status

```http
GET /admin/ticket?status=Pending
```

### Filter by assignee

```http
GET /admin/ticket?assigned_to=user@example.com
```

### Filter unassigned tickets

```http
GET /admin/ticket?assigned_to=null
```

### Filter by creator

```http
GET /admin/ticket?created_by=user@example.com
```

### Filter by department

```http
GET /admin/ticket?department_id=1
```

### Filter by priority

```http
GET /admin/ticket?ticket_priority=High
```

Multiple filters can be combined:

```http
GET /admin/ticket?status=Pending&department_id=1&ticket_priority=High
```

---

## Update Ticket as Admin

```http
PATCH /admin/ticket/:id
```

Supported fields:

```json
{
  "ticket_description": "Updated description",
  "ticket_priority": "High",
  "status": "Assigned",
  "assigned_to": "agent@example.com",
  "department_id": 2
}
```

Admins can update:

- ticket description
- priority
- status
- assigned user
- department

When a ticket is assigned through this endpoint, its status is automatically set to:

```text
Assigned
```

When a ticket is unassigned, its status must be:

```text
Pending
```

---

## Get All Users

```http
GET /admin/user
```

Returns user information without exposing stored passwords.

---

## Get User by Email

```http
GET /admin/user/:email
```

Example:

```http
GET /admin/user/john@example.com
```

---

## Update User

```http
PATCH /admin/user/:email
```

Supported fields:

```json
{
  "user_name": "John Smith",
  "user_email": "john.smith@example.com",
  "department_id": 2,
  "user_role": "admin"
}
```

---

## Delete User

```http
DELETE /admin/user/:email
```

---
