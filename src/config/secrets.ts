import dotenv from "dotenv";

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "DEVELOPMENT";
const LOG_LEVEL = process.env.LOG_LEVEL || "http";

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "abhinavuniyal";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "ticket_management";
const DB_PORT = Number(process.env.DB_PORT) || 5432;
const DB_LOGGING = Boolean(process.env.DB_LOGGING) || true;

export const DB_VARIABLES = {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT,
  DB_LOGGING,
};

export const LOGGER_VARIABLES = { NODE_ENV, LOG_LEVEL };

export const PORT = process.env.PORT || 3000;
