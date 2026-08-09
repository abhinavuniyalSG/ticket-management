import * as adminRepository from "../repositories/admin.repository.js";

const getAllTickets = async (query) => {
  try {
    return await adminRepository.findTickets(query);
  } catch (e) {
    throw new Error("Failed to fetch tickets.");
  }
};
const updateTicketByAdmin = async (id, updates) => {
  const ticket = await adminRepository.findTicketForUpdate(id);
  if (!ticket) {
    const error = new Error("Ticket not found");
    error.status = 404;
    throw error;
  }
  if (
    ticket.assigned_to === null &&
    (updates.assigned_to === undefined || updates.assigned_to === null) &&
    updates.status !== undefined
  ) {
    const error = new Error("Cannot update status of an unassigned ticket.");
    error.status = 400;
    throw error;
  }
  if (updates.assigned_to === null && updates.status !== "Pending") {
    const error = new Error(
      "Status must be 'Pending' when unassigning a ticket.",
    );
    error.status = 400;
    throw error;
  }
  if (updates.assigned_to !== undefined && updates.assigned_to !== null)
    updates.status = "Assigned";
  const allowedFields = [
    "ticket_description",
    "ticket_priority",
    "status",
    "assigned_to",
    "department_id",
  ];
  const fields = [];
  const values = [];
  for (const key of Object.keys(updates)) {
    if (!allowedFields.includes(key)) {
      const error = new Error(
        `Unauthorized field '${key}' cannot be updated by admin.`,
      );
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
  return adminRepository.updateTicket(id, fields, values);
};
const getAllUsers = async () => {
  try {
    return await adminRepository.findAllUsers();
  } catch (e) {
    const error = new Error("Failed to fetch users.");
    error.status = 500;
    throw error;
  }
};
const getUserDetailByEmail = async (email) => {
  const user = await adminRepository.findUserByEmail(email);
  if (!user) {
    const error = new Error("User not found.");
    error.status = 404;
    throw error;
  }
  return user;
};
const updateUserDetail = async (email, updates) => {
  if (!(await adminRepository.findUserEmail(email))) {
    const error = new Error("User not found.");
    error.status = 404;
    throw error;
  }
  const allowedFields = [
    "user_name",
    "user_email",
    "department_id",
    "user_role",
  ];
  const fields = [];
  const values = [];
  for (const key of Object.keys(updates)) {
    if (!allowedFields.includes(key)) {
      const error = new Error(`Field '${key}' cannot be updated.`);
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
  return adminRepository.updateUser(email, fields, values);
};
const deleteUserDetail = async (email) => {
  if (!(await adminRepository.findUserEmail(email))) {
    const error = new Error("User not found.");
    error.status = 404;
    throw error;
  }
  return adminRepository.removeUser(email);
};

export {
  getAllTickets,
  updateTicketByAdmin,
  getAllUsers,
  getUserDetailByEmail,
  updateUserDetail,
  deleteUserDetail,
};
