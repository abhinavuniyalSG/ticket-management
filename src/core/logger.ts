import winston from "winston";
import { LOGGER_VARIABLES } from "../config/secrets.js";

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const isProduction = LOGGER_VARIABLES.NODE_ENV === "PRODUCTION";

const devFormat = combine(
  colorize({ all: true }),
  errors({ stack: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  simple(),
);

const prodFormat = combine(errors({ stack: true }), timestamp(), json());

const devTransports: winston.transport[] = [new winston.transports.Console()];

const prodTransports: winston.transport[] = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
  }),
  new winston.transports.File({
    filename: "logs/combined.log",
  }),
];

export const logger = winston.createLogger({
  level: LOGGER_VARIABLES.LOG_LEVEL ?? (isProduction ? "warn" : "http"),
  defaultMeta: { service: "ticket-management" },
  format: isProduction ? prodFormat : devFormat,
  transports: isProduction ? prodTransports : devTransports,
});
