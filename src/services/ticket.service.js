import * as ticketRepository from "../repositories/ticket.repository.js";

const createTicket = async (
  ticketDetails,
  ticketPriority,
  email,
  department,
) => {
  try {
    return await ticketRepository.create(
      ticketDetails,
      ticketPriority,
      email,
      department,
    );
  } catch (e) {
    throw new Error("Failed to create ticket");
  }
};

const getUsersTicket = async (email, way) => {
  try {
    return await ticketRepository.findForUser(email, way?.toLowerCase());
  } catch (e) {
    throw new Error("Filed to get user tickets");
  }
};

const getTicket = async (ticketId, email) => {
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) {
    const error = new Error("Ticket not found.");
    error.status = 404;
    throw error;
  }
  const role = await ticketRepository.findRoleByEmail(email);
  if (
    role.user_role !== "admin" &&
    ticket.assigned_to !== email &&
    ticket.created_by !== email
  ) {
    const error = new Error("You are not authorized to access the ticket.");
    error.status = 403;
    throw error;
  }
  return ticket;
};

const updateTicket = async (id, updates, email) => {
  const ticket = await ticketRepository.findAssignmentById(id);
  if (!ticket) {
    const error = new Error("Ticket not found");
    error.status = 404;
    throw error;
  }
  if ("status" in updates) {
    if (ticket.assigned_to !== email && updates.status !== "Closed") {
      const error = new Error(
        "Only the assigned user can set status to In Progress or Completed.",
      );
      error.status = 403;
      throw error;
    }
    if (
      ticket.assigned_to === email &&
      !["In Progress", "Completed"].includes(updates.status)
    ) {
      const error = new Error(
        "Assigned user can only set status to In Progress or Completed.",
      );
      error.status = 403;
      throw error;
    }
  }
  const allowedFields = [
    "ticket_description",
    "ticket_priority",
    "status",
    "department_id",
  ];
  const fields = [];
  const values = [];
  for (const key of Object.keys(updates)) {
    if (!allowedFields.includes(key)) {
      const error = new Error(`Unauthorized field: ${key}`);
      error.status = 400;
      throw error;
    }
    fields.push(`${key} = ?`);
    values.push(updates[key]);
  }
  if (fields.length === 0) {
    const error = new Error("No valid fields to update.");
    error.status = 400;
    throw error;
  }
  const result = await ticketRepository.update(id, fields, values);
  if (result.affectedRows === 0) {
    const error = new Error("Failed to find and update ticket.");
    error.status = 404;
    throw error;
  }
  return result;
};

const deleteTicket = async (id) => {
  const ticket = await ticketRepository.findStatusById(id);
  if (!ticket) {
    const error = new Error("Ticket not found");
    error.status = 404;
    throw error;
  }
  if (ticket.status !== "Pending") {
    const error = new Error("Only pending tickets can be deleted.");
    error.status = 400;
    throw error;
  }
  return ticketRepository.remove(id);
};

export { createTicket, getUsersTicket, getTicket, updateTicket, deleteTicket };
