import { readFile } from "node:fs/promises";
import postgres from "postgres";

const envText = await readFile(".env.production.local", "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      const key = line.slice(0, index);
      let value = line.slice(index + 1).trim();

      if (value.startsWith('"') && value.endsWith('"')) {
        value = JSON.parse(value);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }

      return [key, value];
    }),
);

const connectionString = env.POSTGRES_URL_NON_POOLING ?? env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("No production Postgres connection string was found.");
}

const migrationPath = process.argv[2] ?? "supabase/migrations/202608280001_create_participants.sql";
const migration = await readFile(migrationPath, "utf8");
const sql = postgres(connectionString, { max: 1, ssl: "require" });

try {
  await sql.unsafe(migration);
  console.log(`Supabase migration applied successfully: ${migrationPath}`);
} finally {
  await sql.end();
}
