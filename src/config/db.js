import mysql from "mysql2/promise";
import fs from "fs/promises";
import { error } from "console";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

let pool;
const initailizeDatabase = async () => {
  try {
    let connect = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306,
    });
    console.log("connected");
    const dbName = process.env.DB_NAME;
    console.log(`checking if database ${dbName} exist`);
    const [row] = await connect.query(`SHOW DATABASES LIKE '${dbName}'`);
    console.log(row);
    if (!row.length > 0) {
      console.log("Database not exists creating it ");
      await connect.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    }
    connect.end();

    connect = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
      port: process.env.DB_PORT || 3306,
    });
    const sqlQuery = await fs.readFile("./src/database/schema.sql", "utf8");
    await connect.query(sqlQuery);
    connect.end();
    let pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 10,
    });
    return pool;
  } catch (e) {
    throw error;
  }
};

pool = initailizeDatabase();
export default {
  query: async (sql, params) => {
    const activePool = await pool;
    return activePool.query(sql, params);
  },

  close: async () => {
    const activePool = await pool;
    console.log("Closing database pool");
    await activePool.end();
  },
};
