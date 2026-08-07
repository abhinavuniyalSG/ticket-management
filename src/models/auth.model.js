import db from "../config/db.js";
const createUser = async (name, email, hashedPasswored) => {
  try {
    const sqlQuery =
      "INSERT INTO USERS (user_email,user_password,user_name ) VALUES (?,?,?)";
    const [result] = await db.query(sqlQuery, [email, hashedPasswored, name]);
    return result;
  } catch (e) {
    console.error(e);
    if (e.code === "ER_DUP_ENTRY") {
      const error = new Error("User already exists.");
      error.status = 409;
      throw error;
    }
    throw e;
  }
};

const selectUser = async (email) => {
  try {
    const sqlQuery = "SELECT * FROM USERS WHERE user_email = ?";
    const [result] = await db.query(sqlQuery, [email]);
    if (result.length === 0) {
      const error = new Error("user not found");
      error.status = 404;
      throw error;
    }
    return result[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};
export { createUser, selectUser };
