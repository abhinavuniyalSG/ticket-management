import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import db from "../config/db.js";

const tokenGenerator = (payload, time) => {
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign(payload, secret, {
    expiresIn: time,
  });
  return token;
};
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (e) {
    throw e;
  }
};
const generateHashPassword = async (password) => {
  try {
    const saltRound = 10;
    const hashedPasswored = await bcrypt.hash(password, saltRound);
    return hashedPasswored;
  } catch (e) {
    console.error("failed to encrypt password ", e);
    throw new Error("Failed to generate hash password");
  }
};
const verifypaswword = async (enteredPassword, hashPassword) => {
  try {
    const isMatch = await bcrypt.compare(enteredPassword, hashPassword);
    return isMatch;
  } catch (e) {
    console.error(e);
    return e;
  }
};

export { tokenGenerator, generateHashPassword, verifypaswword, verifyToken };
