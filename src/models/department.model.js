import db from "../config/db.js";

const getAllDepartments = async () => {
  try {
    const sqlQuery = `
      SELECT
        department_id,
        department_name
      FROM department
      ORDER BY department_name;
    `;
    const [departments] = await db.query(sqlQuery);
    return departments;
  } catch (e) {
    console.error(e);
    const error = new Error("Failed to fetch departments.");
    error.status = 500;
    throw error;
  }
};
const createDepartment = async (departmentName) => {
  try {
    const [department] = await db.query(
      "SELECT department_id FROM department WHERE department_name = ?",
      [departmentName],
    );

    if (department.length > 0) {
      const error = new Error("Department already exists.");
      error.status = 409;
      throw error;
    }

    const sqlQuery = `
      INSERT INTO department (department_name)
      VALUES (?);
    `;

    const [result] = await db.query(sqlQuery, [departmentName]);

    return result;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
const getDepartment = async (id) => {
  try {
    const sqlQuery = `
      SELECT
        department_id,
        department_name
      FROM department
      WHERE department_id = ?;
    `;

    const [department] = await db.query(sqlQuery, [id]);

    if (department.length === 0) {
      const error = new Error("Department not found.");
      error.status = 404;
      throw error;
    }
    return department[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const updateDepartment = async (id, departmentName) => {
  try {
    const [department] = await db.query(
      "SELECT department_id FROM department WHERE department_id = ?",
      [id],
    );

    if (department.length === 0) {
      const error = new Error("Department not found.");
      error.status = 404;
      throw error;
    }

    const [duplicate] = await db.query(
      "SELECT department_id FROM department WHERE department_name = ? AND department_id != ?",
      [departmentName, id],
    );

    if (duplicate.length > 0) {
      const error = new Error("Department already exists.");
      error.status = 409;
      throw error;
    }

    const [result] = await db.query(
      "UPDATE department SET department_name = ? WHERE department_id = ?",
      [departmentName, id],
    );

    return result;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
const deleteDepartment = async (id) => {
  try {
    const [department] = await db.query(
      "SELECT department_id FROM department WHERE department_id = ?",
      [id],
    );

    if (department.length === 0) {
      const error = new Error("Department not found.");
      error.status = 404;
      throw error;
    }

    const [users] = await db.query(
      "SELECT COUNT(*) AS total FROM users WHERE department_id = ?",
      [id],
    );

    if (users[0].total > 0) {
      const error = new Error(
        "Cannot delete department. Users are assigned to it.",
      );
      error.status = 409;
      throw error;
    }

    const [tickets] = await db.query(
      "SELECT COUNT(*) AS total FROM ticket WHERE department_id = ?",
      [id],
    );

    if (tickets[0].total > 0) {
      const error = new Error(
        "Cannot delete department. Tickets are assigned to it.",
      );
      error.status = 409;
      throw error;
    }

    const [result] = await db.query(
      "DELETE FROM department WHERE department_id = ?",
      [id],
    );

    return result;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
