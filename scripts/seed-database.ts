import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
}

import { initDatabase, getDb } from "../src/lib/db";

async function main() {
  console.log("Seeding Neon database via initDatabase()...");
  await initDatabase();
  const sql = getDb();

  const [u] = await sql`SELECT count(*)::int as c FROM users;`;
  const [p] = await sql`SELECT count(*)::int as c FROM projects;`;
  const [t] = await sql`SELECT count(*)::int as c FROM tasks;`;
  const [a] = await sql`SELECT count(*)::int as c FROM attendance;`;
  const [c] = await sql`SELECT count(*)::int as c FROM clock_in_status;`;
  const [d] = await sql`SELECT count(*)::int as c FROM departments;`;
  const [r] = await sql`SELECT count(*)::int as c FROM rewards_ledger;`;

  console.log("Seeding complete!");
  console.log({
    users: u.c,
    projects: p.c,
    tasks: t.c,
    attendance: a.c,
    clockInStatus: c.c,
    departments: d.c,
    rewardsLedger: r.c,
  });
}

main().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});

