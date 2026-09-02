import z from "zod";
import { TicketPriority, TicketStatus } from "../types/ticket.js";

export class TicketSchema {
  public ticketIdParamSchema = z
    .object({
      id: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Ticket id  is required"
              : "Ticket id must be a string",
        })
        .pipe(z.uuidv7("Invalid ticket ID format")),
    })
    .strict();

  public createTicketSchema = z
    .object({
      title: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Title is required"
              : "Title must be a string",
        })
        .trim()
        .min(2, "Title must be at least 2 characters")
        .max(200, "Title must not exceed 200 characters"),
      description: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Description is required"
              : "Description must be a string",
        })
        .trim()
        .min(5, "Description must be at least 5 characters"),
      departmentId: z
        .string({
          error: (issue) =>
            issue.input === undefined
              ? "Department id is required"
              : "Department id must be a string",
        })
        .pipe(z.uuidv7("Invalid department ID format")),
      priority: z
        .enum([
          TicketPriority.low,
          TicketPriority.medium,
          TicketPriority.high,
          TicketPriority.urgent,
        ])
        .optional(),

      assignedToId: z
        .string({
          error: "User id must be a string",
        })
        .pipe(z.uuidv7("Invalid assignee ID format"))
        .nullable()
        .optional(),
    })
    .strict();

  public updateTicketSchema = z
    .object({
      title: z
        .string({
          error: "Title must be a string",
        })
        .trim()
        .min(2, "Title must be at least 2 characters")
        .max(200, "Title must not exceed 200 characters")
        .optional(),
      description: z
        .string({
          error: "Description must be a string",
        })
        .trim()
        .min(5, "Description must be at least 5 characters")
        .optional(),
      priority: z
        .enum([
          TicketPriority.low,
          TicketPriority.medium,
          TicketPriority.high,
          TicketPriority.urgent,
        ])
        .optional(),
      status: z
        .enum([
          TicketStatus.open,
          TicketStatus.assigned,
          TicketStatus.inProgress,
          TicketStatus.review,
          TicketStatus.completed,
          TicketStatus.closed,
        ])
        .optional(),
      assignedToId: z
        .string({ error: "User id must be a string" })
        .pipe(z.uuidv7("Invalid assignee ID format"))
        .nullable()
        .optional(),
    })
    .strict()
    .refine(
      (data) =>
        data.title !== undefined ||
        data.description !== undefined ||
        data.priority !== undefined ||
        data.status !== undefined ||
        data.assignedToId !== undefined,
      {
        message: "At least one field must be provided for update",
      },
    );

  public ticketQuerySchema = z
    .object({
      status: z
        .enum([
          TicketStatus.open,
          TicketStatus.assigned,
          TicketStatus.inProgress,
          TicketStatus.review,
          TicketStatus.completed,
          TicketStatus.closed,
        ])
        .optional(),
      priority: z
        .enum([
          TicketPriority.low,
          TicketPriority.medium,
          TicketPriority.high,
          TicketPriority.urgent,
        ])
        .optional(),
      departmentId: z
        .string()
        .pipe(
          z
            .string({ error: "Department id must be a string" })
            .pipe(z.uuidv7("Invalid department ID format")),
        )
        .optional(),
      assignedToId: z
        .string({ error: "User id must be a string" })
        .pipe(z.uuidv7("Invalid assignee ID format"))
        .optional(),
      createdById: z
        .string({ error: "User id must be a string" })
        .pipe(z.uuidv7("Invalid creator ID format"))
        .optional(),
      createdFrom: z
        .string()
        .pipe(
          z.iso.datetime({ message: "Invalid createdFrom ISO date format" }),
        )
        .optional(),
      createdTo: z
        .string()
        .pipe(z.iso.datetime({ message: "Invalid createdTo ISO date format" }))
        .optional(),
      sortBy: z
        .enum(["createdAt", "updatedAt", "priority", "status"])
        .optional(),
      sortOrder: z.enum(["asc", "desc", "ASC", "DESC"]).optional(),
    })
    .strict();
}
