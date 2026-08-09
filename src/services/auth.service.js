import * as authRepository from "../repositories/auth.repository.js";

import {
  generateHashPassword,
  tokenGenerator,
  verifypaswword,
} from "../utils/auth.util.js";

const login = async (email, password) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    const error = new Error("user not found");
    error.status = 404;
    throw error;
  }
  const isMatch = await verifypaswword(password, user.user_password);
  if (!isMatch) {
    return null;
  }
  return tokenGenerator({ email }, "1h");
};

const register = async (name, email, password) => {
  const hashedPassword = await generateHashPassword(password);
  try {
    await authRepository.createUser(name, email, hashedPassword);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      const error = new Error("User already exists.");
      error.status = 409;
      throw error;
    }
    throw e;
  }
  return tokenGenerator({ email }, "1h");
};

export { login, register };
