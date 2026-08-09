import db from "../config/db.js";

const findAll = async () => {
  const [departments] = await db.query(`
    SELECT department_id, department_name
    FROM department
    ORDER BY department_name;
  `);
  return departments;
};

const findById = async (id) => {
  const [departments] = await db.query(
    "SELECT department_id, department_name FROM department WHERE department_id = ?;",
    [id],
  );
  return departments[0] || null;
};

const findByName = async (departmentName, excludedId) => {
  const sql =
    excludedId === undefined
      ? "SELECT department_id FROM department WHERE department_name = ?"
      : "SELECT department_id FROM department WHERE department_name = ? AND department_id != ?";
  const params =
    excludedId === undefined ? [departmentName] : [departmentName, excludedId];
  const [departments] = await db.query(sql, params);
  return departments;
};

const create = async (departmentName) => {
  const [result] = await db.query(
    "INSERT INTO department (department_name) VALUES (?);",
    [departmentName],
  );
  return result;
};

const update = async (id, departmentName) => {
  const [result] = await db.query(
    "UPDATE department SET department_name = ? WHERE department_id = ?",
    [departmentName, id],
  );
  return result;
};

const countUsers = async (id) => {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS total FROM users WHERE department_id = ?",
    [id],
  );
  return rows[0].total;
};

const countTickets = async (id) => {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS total FROM ticket WHERE department_id = ?",
    [id],
  );
  return rows[0].total;
};

const remove = async (id) => {
  const [result] = await db.query(
    "DELETE FROM department WHERE department_id = ?",
    [id],
  );
  return result;
};

export {
  findAll,
  findById,
  findByName,
  create,
  update,
  countUsers,
  countTickets,
  remove,
};
