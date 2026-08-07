import db from "../config/db.js";
const getAllTickets = async (query) => {
  try {
    const { status, assigned_to, created_by, department_id, ticket_priority } =
      query;

    let sqlQuery = "SELECT * FROM ticket";
    const conditions = [];
    const params = [];
    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }
    if (assigned_to) {
      if (assigned_to.toLowerCase() === "null") {
        conditions.push("assigned_to IS NULL");
      } else {
        conditions.push("assigned_to = ?");
        params.push(assigned_to);
      }
    }
    if (created_by) {
      conditions.push("created_by = ?");
      params.push(created_by);
    }
    if (department_id) {
      conditions.push("department_id = ?");
      params.push(department_id);
    }
    if (ticket_priority) {
      conditions.push("ticket_priority = ?");
      params.push(ticket_priority);
    }
    if (conditions.length > 0) {
      sqlQuery += " WHERE " + conditions.join(" AND ");
    }
    const [tickets] = await db.query(sqlQuery, params);
    return tickets;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to fetch tickets.");
  }
};
const updateTicketByAdmin = async (id, updates) => {
  try {
    const [ticket] = await db.query(
      "SELECT ticket_id FROM ticket WHERE ticket_id = ?",
      [id],
    );

    if (ticket.length === 0) {
      const error = new Error("Ticket not found");
      error.status = 404;
      throw error;
    }
    if (
      ticket[0].assigned_to === null &&
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
    if (updates.assigned_to !== undefined && updates.assigned_to !== null) {
      updates.status = "Assigned";
    }

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

    values.push(id);

    const sqlQuery = `
      UPDATE ticket
      SET ${fields.join(", ")}
      WHERE ticket_id = ?
    `;

    const [result] = await db.query(sqlQuery, values);

    return result;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
const getAllUsers = async () => {
  try {
    const sqlQuery = `
      SELECT
        user_email,
        user_name,
        user_role,
        department_id
      FROM users;
    `;

    const [users] = await db.query(sqlQuery);

    return users;
  } catch (e) {
    console.error(e);

    const error = new Error("Failed to fetch users.");
    error.status = 500;
    throw error;
  }
};
const getUserDetailByEmail = async (email) => {
  try {
    const sqlQuery = `
      SELECT
        user_email,
        user_name,
        user_role,
        department_id
      FROM users
      WHERE user_email = ?;
    `;

    const [users] = await db.query(sqlQuery, [email]);

    if (users.length === 0) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }

    return users[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const updateUserDetail = async (email, updates) => {
  try {
    const [users] = await db.query(
      "SELECT user_email FROM users WHERE user_email = ?",
      [email],
    );

    if (users.length === 0) {
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

    values.push(email);

    const sqlQuery = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE user_email = ?;
    `;

    const [result] = await db.query(sqlQuery, values);

    return result;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
const deleteUserDetail = async (email) => {
  try {
    const [users] = await db.query(
      "SELECT user_email FROM users WHERE user_email = ?",
      [email],
    );

    if (users.length === 0) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }

    const [result] = await db.query("DELETE FROM users WHERE user_email = ?", [
      email,
    ]);

    return result;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
export {
  getAllTickets,
  updateTicketByAdmin,
  getAllUsers,
  getUserDetailByEmail,
  updateUserDetail,
  deleteUserDetail,
};
