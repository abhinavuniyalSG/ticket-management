import db from "../config/db.js";

const findByEmail = async (email) => {
  const [users] = await db.query(
    `
    SELECT user_email, user_name, user_role, department_id
    FROM users WHERE user_email = ?
  `,
    [email],
  );
  return users[0] || null;
};

export { findByEmail };
