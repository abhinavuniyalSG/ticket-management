import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 3000;

const NODE_ENV = process.env.NODE_ENV || "DEVELOPMENT";
const LOG_LEVEL = process.env.LOG_LEVEL || "http";

export const LOGGER_VARIABLES = { NODE_ENV, LOG_LEVEL };
