import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DB_URL || process.env.DATABASE_URL;

const poolConfig = connectionString
  ? { connectionString }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
    };

const pool = new Pool(poolConfig);

pool.on("connect", () => {
  console.log("Connection established");
});

export default pool;
