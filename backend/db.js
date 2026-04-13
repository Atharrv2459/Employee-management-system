import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DB_URL || process.env.DATABASE_URL;

const shouldUseSsl =
  process.env.DB_SSL === "true" ||
  process.env.PGSSLMODE === "require" ||
  process.env.NODE_ENV === "production";

const sslConfig = shouldUseSsl ? { rejectUnauthorized: false } : undefined;

export const dbDiagnostics = (() => {
  const source = process.env.DB_URL ? "DB_URL" : process.env.DATABASE_URL ? "DATABASE_URL" : null;
  const diag = {
    hasConnectionString: Boolean(connectionString && String(connectionString).trim()),
    source,
    ssl: Boolean(sslConfig),
    host: null,
    port: null,
    database: null,
  };

  if (diag.hasConnectionString) {
    try {
      const u = new URL(String(connectionString));
      diag.host = u.hostname || null;
      diag.port = u.port || null;
      diag.database = u.pathname ? u.pathname.replace(/^\//, "") : null;
    } catch {
      // Don't leak the connection string; just mark it invalid.
      diag.host = "(invalid DATABASE_URL)";
    }
    return diag;
  }

  diag.host = process.env.DB_HOST || null;
  diag.port = process.env.DB_PORT || null;
  diag.database = process.env.DB_DATABASE || null;
  return diag;
})();

console.log("[db] diagnostics:", dbDiagnostics);

const poolConfig = connectionString
  ? { connectionString, ssl: sslConfig }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
      ssl: sslConfig,
    };

const pool = new Pool(poolConfig);

pool.on("connect", () => {
  console.log("Connection established");
});

export default pool;
