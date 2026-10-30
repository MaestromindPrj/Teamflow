import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

// Load environment variables from .env.local
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

const DATABASE_URL = process.env.DATABASE_URL;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not defined in .env.local");
  }

  const sql = neon(DATABASE_URL);

  console.log("Adding auth columns to users table if not exists...");
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
  `;
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS initial_password TEXT;
  `;

  console.log("Checking existing users...");
  const users = await sql`SELECT id, name, full_name, email, role, password_hash FROM users;`;
  console.log(`Found ${users.length} users in database.`);

  const defaultPassword = "Maestro@2026!";
  const defaultHash = hashPassword(defaultPassword);

  for (const u of users) {
    let email = u.email;
    // Normalize to @maestrominds.co.in if it has @teamflow.com
    if (email.endsWith("@teamflow.com")) {
      email = email.replace("@teamflow.com", "@maestrominds.co.in");
    }

    await sql`
      UPDATE users
      SET
        email = ${email},
        password_hash = COALESCE(password_hash, ${defaultHash}),
        initial_password = COALESCE(initial_password, ${defaultPassword})
      WHERE id = ${u.id};
    `;
    console.log(`Updated user ${u.full_name}: ${email} [Password: ${defaultPassword}]`);
  }

  console.log("Auth setup migration completed successfully!");
}

main().catch(console.error);

