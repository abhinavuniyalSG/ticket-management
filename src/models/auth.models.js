import db from "../config/db.js";
const createUser = async (name, email, hashedPasswored) => {
  const sqlQuery =
    "INSERT INTO USERS (user_email,user_password,user_name ) VALUES (?,?,?)";
  const [result] = await db.query(sqlQuery, [email, hashedPasswored, name]);
  return result;
};

const selectUser = async (email) => {
  const sqlQuery = "SELECT * FROM USERS WHERE user_email = ?";
  const [result] = await db.query(sqlQuery, [email]);
  return result[0];
};
export { createUser, selectUser };
