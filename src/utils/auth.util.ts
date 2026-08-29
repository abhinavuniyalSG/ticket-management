import jwt, { type JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { HttpError } from "./httpError.utils.js";
import type { TokenPayload } from "../types/jwtToken.type.js";
import { logger } from "../core/logger.js";
import { HASH_VARIABLES, JWT_VARIABLES } from "../config/secrets.js";

const tokenGenerator = (payload: TokenPayload, generateType: string) => {
  let token;
  switch (generateType) {
    case "ACCESS":
      token = jwt.sign(payload, JWT_VARIABLES.JWT_ACCESS_SECRET, {
        expiresIn: JWT_VARIABLES.JWT_ACCESS_EXPIRES_IN,
      });
      break;

    case "REFRESH":
      token = jwt.sign(payload, JWT_VARIABLES.JWT_REFRESH_SECRET, {
        expiresIn: JWT_VARIABLES.JWT_REFRESH_EXPIRES_IN,
      });
      break;
    default:
      throw new Error("Provide valid generateType");
  }

  return token;
};

const verifyToken = (token: string, key: string) => {
  try {
    const decoded = jwt.verify(token, key);
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new HttpError(401, "Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new HttpError(401, "Invalid token signature");
    }
  }
};
const generateHash = async (password: string) => {
  try {
    const saltRound = HASH_VARIABLES.SALT_ROUND;
    const hashedPasswored = await bcrypt.hash(password, saltRound);
    return hashedPasswored;
  } catch (e) {
    logger.error("failed to encrypt password ", e);
    throw new HttpError(500, "Failed to securely process password");
  }
};
const verifyHash = async (enteredPassword: string, hashPassword: string) => {
  try {
    const isMatch = await bcrypt.compare(enteredPassword, hashPassword);
    return isMatch;
  } catch (e) {
    console.error(e);
    return e;
  }
};

export { verifyToken, generateHash, tokenGenerator, verifyHash };
