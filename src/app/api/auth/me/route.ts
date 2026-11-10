import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("teamflow_session")?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = verifySessionToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ user: null });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ user: null });
    }

    await initDatabase();
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, full_name, email, role, job_title, avatar, phone, employee_id, bio
      FROM users
      WHERE id = ${payload.userId}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ user: null });
    }

    const r = rows[0];
    return NextResponse.json({
      user: {
        id: r.id as string,
        name: r.name as string,
        fullName: r.full_name as string,
        email: r.email as string,
        role: r.role as "ceo" | "project_manager" | "employer",
        jobTitle: (r.job_title as string) || (r.role === "ceo" ? "Chief Executive Officer" : r.role === "project_manager" ? "Project Manager" : "Software Developer"),
        avatar: (r.avatar as string) || "",
        phone: (r.phone as string) || "",
        employeeId: (r.employee_id as string) || "",
        bio: (r.bio as string) || "",
      },
    });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      (err as { digest?: string }).digest === "NEXT_PRERENDER_INTERRUPTED"
    ) {
      throw err;
    }
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json({ user: null });
  }
}
