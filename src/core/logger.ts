import winston from "winston";
import { LOGGER_VARIABLES } from "../config/secrets.js";
const { combine, timestamp, json, colorize } = winston.format;

const optionsFormats = [
  timestamp(),
  json(),
  LOGGER_VARIABLES.NODE_ENV !== "PRODUCTION"
    ? winston.format.prettyPrint()
    : undefined,
  colorize({ all: true }),
].filter((item) => item !== undefined);

const optionsTransports =
  LOGGER_VARIABLES.NODE_ENV === "PRODUCTION"
    ? [new winston.transports.File({ filename: "app.log" })]
    : [new winston.transports.Console()];

const options: winston.LoggerOptions = {
  level: LOGGER_VARIABLES.LOG_LEVEL,
  format: combine(...optionsFormats),
  transports: optionsTransports,
};

export const logger = winston.createLogger(options);
