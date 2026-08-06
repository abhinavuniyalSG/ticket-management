import db from "../config/db.js";
const createTicket = async (
  ticketDetails,
  ticketPrority,
  email,
  department,
) => {
  try {
    const sqlQuery =
      "INSERT INTO TICKET (ticket_description,ticket_priority,created_by,department_id) VALUES(?,?,?,?)";
    let [result] = await db.query(sqlQuery, [
      ticketDetails,
      ticketPrority,
      email,
      department,
    ]);
    return result;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to create ticket");
  }
};

const getUsersTicket = async (email, way) => {
  try {
    let sqlQuery;
    let params;
    switch (way) {
      case "created_by":
        sqlQuery = "SELECT * FROM TICKET WHERE created_by=?";
        params = [email];
        break;
      case "assigned_to":
        sqlQuery = "SELECT * FROM TICKET WHERE assigned_to=?";
        params = [email];
        break;
      default:
        sqlQuery = "SELECT * FROM TICKET WHERE created_by=? or assigned_to=?";
        params = [email, email];
        break;
    }
    const [tickets] = await db.query(sqlQuery, params);
    return tickets;
  } catch (e) {
    console.error(e);
    throw new Error("Filed to get user tickets");
  }
};
const getTicket = async (ticketID, email) => {
  try {
    const sqlQuery = "SELECT * FROM TICKET WHERE ticket_id =?;";
    const [ticketDetails] = await db.query(sqlQuery, [ticketID]);
    if (ticketDetails.length === 0) {
      const error = new Error("Ticket not found.");
      error.status = 404;
      throw error;
    }
    const [role] = await db.query(
      "SELECT user_role from users where user_email = ?",
      [email],
    );
    if (
      role[0].user_role !== "admin" &&
      ticketDetails[0].assigned_to !== email &&
      ticketDetails[0].created_by !== email
    ) {
      const error = new Error("You are not authorized to access the ticket.");
      error.status = 401;
      throw error;
    }
    return ticketDetails[0];
  } catch (e) {
    throw new Error(e);
  }
};

const updateTicket = async (id, updates, email) => {
  try {
    const sqlQuery = "SELECT assigned_to FROM ticket WHERE ticket_id = ?";
    const [rows] = await db.query(sqlQuery, [id]);

    if (rows.length === 0) {
      const error = new Error("Ticket not found");
      error.status = 404;
      throw error;
    }

    if ("status" in updates) {
      if (rows[0].assigned_to !== email && updates.status !== "Closed") {
        const error = new Error(
          "Only the assigned user can set status to In Progress or Completed.",
        );
        error.status = 403;
        throw error;
      }

      if (
        rows[0].assigned_to === email &&
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

    values.push(id);

    const sql = `
      UPDATE ticket
      SET ${fields.join(", ")}
      WHERE ticket_id = ?
    `;

    const [result] = await db.query(sql, values);

    return result;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const deleteTicket = async (id) => {
  try {
    const sqlQuery = "SELECT status FROM ticket WHERE ticket_id = ?";
    const [ticket] = await db.query(sqlQuery, [id]);
    if (ticket.length === 0) {
      const error = new Error("Ticket not found");
      error.status = 404;
      throw error;
    }
    if (ticket[0].status !== "Pending") {
      const error = new Error("Only pending tickets can be deleted.");
      error.status = 400;
      throw error;
    }

    const [result] = await db.query("DELETE FROM ticket WHERE ticket_id = ?", [
      id,
    ]);
    return result;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export { createTicket, getUsersTicket, getTicket, updateTicket, deleteTicket };
