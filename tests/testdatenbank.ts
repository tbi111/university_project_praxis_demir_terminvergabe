import { execSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import Database from "better-sqlite3";

// Legt vor den Tests eine leere Testdatenbank (prisma/test.db) mit dem aktuellen Schema an.
export default function setup() {
  rmSync("prisma/test.db", { force: true });
  const schemaSql = process.env.TEST_SCHEMA_SQL;
  if (schemaSql) {
    new Database("prisma/test.db").exec(readFileSync(schemaSql, "utf8"));
    return;
  }
  execSync("npx prisma db push", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
  });
}
