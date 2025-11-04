
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
const useMysql = databaseUrl && !databaseUrl.includes('file:');

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: useMysql ? "mysql" : "sqlite",
  dbCredentials: useMysql 
    ? { url: databaseUrl }
    : { url: "file:./local.db" },
});
