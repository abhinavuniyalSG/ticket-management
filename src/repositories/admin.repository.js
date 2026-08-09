import db from "../config/db.js";

const findTickets = async (query) => {
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
    if (assigned_to.toLowerCase() === "null")
      conditions.push("assigned_to IS NULL");
    else {
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
  if (conditions.length > 0) sqlQuery += " WHERE " + conditions.join(" AND ");
  const [tickets] = await db.query(sqlQuery, params);
  return tickets;
};

const findTicketForUpdate = async (id) => {
  const [tickets] = await db.query(
    "SELECT ticket_id FROM ticket WHERE ticket_id = ?",
    [id],
  );
  return tickets[0] || null;
};
const updateTicket = async (id, fields, values) => {
  const [result] = await db.query(
    `UPDATE ticket SET ${fields.join(", ")} WHERE ticket_id = ?`,
    [...values, id],
  );
  return result;
};
const findAllUsers = async () => {
  const [users] = await db.query(
    "SELECT user_email, user_name, user_role, department_id FROM users;",
  );
  return users;
};
const findUserByEmail = async (email) => {
  const [users] = await db.query(
    "SELECT user_email, user_name, user_role, department_id FROM users WHERE user_email = ?;",
    [email],
  );
  return users[0] || null;
};
const findUserEmail = async (email) => {
  const [users] = await db.query(
    "SELECT user_email FROM users WHERE user_email = ?",
    [email],
  );
  return users[0] || null;
};
const updateUser = async (email, fields, values) => {
  const [result] = await db.query(
    `UPDATE users SET ${fields.join(", ")} WHERE user_email = ?;`,
    [...values, email],
  );
  return result;
};
const removeUser = async (email) => {
  const [result] = await db.query("DELETE FROM users WHERE user_email = ?", [
    email,
  ]);
  return result;
};

export {
  findTickets,
  findTicketForUpdate,
  updateTicket,
  findAllUsers,
  findUserByEmail,
  findUserEmail,
  updateUser,
  removeUser,
};
