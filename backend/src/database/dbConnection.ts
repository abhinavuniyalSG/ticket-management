import { DataSource } from "typeorm";
import { DB_VARIABLES } from "../config/secrets.js";
import { logger } from "../core/logger.js";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_VARIABLES.DB_HOST,
  port: DB_VARIABLES.DB_PORT,
  username: DB_VARIABLES.DB_USER,
  password: DB_VARIABLES.DB_PASSWORD,
  database: DB_VARIABLES.DB_NAME,
  synchronize: false,
  logging: DB_VARIABLES.DB_LOGGING,
  entities: [path.resolve(`${__dirname}/models/**/*.{ts,js}`)],
  migrations: ["src/database/migration/**/*.ts"],
  //   subscribers: [],
});

export class DatabaseConnection {
  public static connection: DataSource;
  public static async connectDB(): Promise<void> {
    try {
      DatabaseConnection.connection = await AppDataSource.initialize();
      logger.info("Data Base connected ");
    } catch (e) {
      logger.error("Failed to connect to the database", { error: e });
      throw new Error("Failed to connect to DB");
    }
  }
}
