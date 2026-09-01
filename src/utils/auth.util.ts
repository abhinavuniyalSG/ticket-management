import jwt, { type JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { HttpError } from "./httpError.utils.js";
import type { TokenPayload } from "../types/jwtToken.type.js";
import { logger } from "../core/logger.js";
import { HASH_VARIABLES, JWT_VARIABLES } from "../config/secrets.js";
import crypto, { randomUUID } from "crypto";

const tokenGenerator = (payload: TokenPayload, generateType: string) => {
  let token;
  switch (generateType) {
    case "ACCESS":
      token = jwt.sign(
        { ...payload, jti: randomUUID(), typ: "access" },
        JWT_VARIABLES.JWT_ACCESS_SECRET,
        {
          expiresIn: JWT_VARIABLES.JWT_ACCESS_EXPIRES_IN,
        },
      );
      break;

    case "REFRESH":
      token = jwt.sign(
        { ...payload, jti: randomUUID(), typ: "refresh" },
        JWT_VARIABLES.JWT_REFRESH_SECRET,
        {
          expiresIn: JWT_VARIABLES.JWT_REFRESH_EXPIRES_IN,
        },
      );
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

const generateHashPassword = async (password: string) => {
  try {
    const saltRound = HASH_VARIABLES.SALT_ROUND;
    const hashedPasswored = await bcrypt.hash(password, saltRound);
    return hashedPasswored;
  } catch (e) {
    logger.error("Failed to encrypt password", { error: e });
    throw new HttpError(500, "Failed to securely process password");
  }
};

const verifyHashPassword = async (
  enteredPassword: string,
  hashPassword: string,
): Promise<boolean> => {
  try {
    return await bcrypt.compare(enteredPassword, hashPassword);
  } catch (e) {
    logger.error("Failed to verify password hash", { error: e });
    throw new HttpError(500, "Failed to verify password");
  }
};

const generateTokenHash = (token: string): string => {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
};
const verifyTokenHash = (token: string, storedHash: string): boolean => {
  const incomingHash = generateTokenHash(token);

  const incomingBuffer = Buffer.from(incomingHash, "hex");

  const storedBuffer = Buffer.from(storedHash, "hex");

  if (incomingBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(incomingBuffer, storedBuffer);
};
export {
  verifyToken,
  generateHashPassword,
  tokenGenerator,
  verifyHashPassword,
  generateTokenHash,
  verifyTokenHash,
};
