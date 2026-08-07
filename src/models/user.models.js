import db from "../config/db.js";

const getUserByEmail = async (email) => {
  try {
    const sqlQuery = `
      SELECT
        user_email,
        user_name,
        user_role,
        department_id
      FROM users
      WHERE user_email = ?
    `;

    const [users] = await db.query(sqlQuery, [email]);

    if (users.length === 0) {
      return null;
    }
    if (!users[0]) {
      const error = new Error("User not found.");
      error.status = 404;
      return error;
    }
    return users[0];
  } catch (e) {
    console.error(e);
    throw new Error("Failed to get user details.");
  }
};

export { getUserByEmail };
