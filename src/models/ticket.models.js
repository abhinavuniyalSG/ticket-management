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
  } catch (e) {
    console.error(e);
    throw new Error("Filed to add user to database");
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
const getTicket = async (ticketID) => {
  try {
    const sqlQuery = "SELECT * FROM TICKET WHERE ticket_id =?;";
    const [ticketDetails] = await db.query(sqlQuery, [ticketID]);

    return ticketDetails;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to ticketDetails from database");
  }
};

const updateTicket = async (id, updates, email) => {
  try {
    const sqlQuery = "SELECT assigned_to FROM ticket WHERE ticket_id = ?";
    const [rows] = await db.query(sqlQuery, [id]);

    if (rows.length === 0) {
      throw new Error("Ticket not found");
    }

    if ("status" in updates) {
      if (rows[0].assigned_to !== email && updates.status !== "Closed") {
        throw new Error(
          "Only the assigned user can set status to In Progress or Completed.",
        );
      }

      if (
        rows[0].assigned_to === email &&
        !["In Progress", "Completed"].includes(updates.status)
      ) {
        throw new Error(
          "Assigned user can only set status to In Progress or Completed.",
        );
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
        throw new Error(`Unauthorized field: ${key}`);
      }

      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }

    if (fields.length === 0) {
      throw new Error("No valid fields to update.");
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
