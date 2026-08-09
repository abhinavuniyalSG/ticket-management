import db from "../config/db.js";

const create = async (ticketDetails, ticketPriority, email, department) => {
  const [result] = await db.query(
    "INSERT INTO TICKET (ticket_description,ticket_priority,created_by,department_id) VALUES(?,?,?,?)",
    [ticketDetails, ticketPriority, email, department],
  );
  return result;
};

const findForUser = async (email, way) => {
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
  }
  const [tickets] = await db.query(sqlQuery, params);
  return tickets;
};

const findById = async (id) => {
  const [tickets] = await db.query("SELECT * FROM TICKET WHERE ticket_id =?;", [
    id,
  ]);
  return tickets[0] || null;
};

const findRoleByEmail = async (email) => {
  const [users] = await db.query(
    "SELECT user_role from users where user_email = ?",
    [email],
  );
  return users[0];
};

const findAssignmentById = async (id) => {
  const [tickets] = await db.query(
    "SELECT assigned_to FROM ticket WHERE ticket_id = ?",
    [id],
  );
  return tickets[0] || null;
};

const findStatusById = async (id) => {
  const [tickets] = await db.query(
    "SELECT status FROM ticket WHERE ticket_id = ?",
    [id],
  );
  return tickets[0] || null;
};

const update = async (id, fields, values) => {
  const [result] = await db.query(
    `UPDATE ticket SET ${fields.join(", ")} WHERE ticket_id = ?`,
    [...values, id],
  );
  return result;
};

const remove = async (id) => {
  const [result] = await db.query("DELETE FROM ticket WHERE ticket_id = ?", [
    id,
  ]);
  return result;
};

export {
  create,
  findForUser,
  findById,
  findRoleByEmail,
  findAssignmentById,
  findStatusById,
  update,
  remove,
};
