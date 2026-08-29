import dotenv from "dotenv";
import type { StringValue } from "ms";

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "DEVELOPMENT";
const LOG_LEVEL = process.env.LOG_LEVEL || "http";

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "abhinavuniyal";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "ticket_management";
const DB_PORT = Number(process.env.DB_PORT) || 5432;
const DB_LOGGING = Boolean(process.env.DB_LOGGING) || true;

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "default_secret_key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "default_secret_key";
const JWT_ACCESS_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN ||
  "15m") as StringValue;
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ||
  "7d") as StringValue;

const SALT_ROUND = Number(process.env.SALT_ROUND) || 10;

export const DB_VARIABLES = {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT,
  DB_LOGGING,
};

export const JWT_VARIABLES = {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
};

export const LOGGER_VARIABLES = { NODE_ENV, LOG_LEVEL };

export const PORT = process.env.PORT || 3000;

export const HASH_VARIABLES = { SALT_ROUND };
