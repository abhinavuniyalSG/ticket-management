import db from "../config/db.js";

const createUser = async (name, email, hashedPassword) => {
  const [result] = await db.query(
    "INSERT INTO USERS (user_email,user_password,user_name ) VALUES (?,?,?)",
    [email, hashedPassword, name],
  );
  return result;
};

const findUserByEmail = async (email) => {
  const [users] = await db.query("SELECT * FROM USERS WHERE user_email = ?", [
    email,
  ]);
  return users[0] || null;
};

export { createUser, findUserByEmail };
