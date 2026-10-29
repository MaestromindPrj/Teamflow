import { NextResponse } from "next/server";
import { isDbConfigured, getDb } from "@/lib/db";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export async function GET() {
  const dbConfigured = isDbConfigured();
  const cloudinaryConfigured = isCloudinaryConfigured();

  let dbConnected = false;
  let dbError: string | null = null;
  let stats: Record<string, number> = {};

  if (dbConfigured) {
    try {
      const sql = getDb();
      const testResult = await sql`SELECT 1 as connected;`;
      dbConnected = Boolean(testResult[0]?.connected);

      // Attempt to query counts
      try {
        const usersCount = await sql`SELECT count(*)::int as c FROM users;`;
        const projectsCount = await sql`SELECT count(*)::int as c FROM projects;`;
        const tasksCount = await sql`SELECT count(*)::int as c FROM tasks;`;
        stats = {
          users: usersCount[0]?.c || 0,
          projects: projectsCount[0]?.c || 0,
          tasks: tasksCount[0]?.c || 0,
        };
      } catch {
        // Tables might not be initialized yet
      }
    } catch (err: unknown) {
      dbError = err instanceof Error ? err.message : "Database connection failed";
    }
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      neonPostgres: {
        configured: dbConfigured,
        connected: dbConnected,
        error: dbError,
        stats: dbConnected ? stats : undefined,
      },
      cloudinary: {
        configured: cloudinaryConfigured,
      },
    },
  });
}

