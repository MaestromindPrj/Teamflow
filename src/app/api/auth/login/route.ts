import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { verifyPassword, signSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!rawEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = rawEmail.includes("@")
      ? rawEmail
      : `${rawEmail}@maestrominds.co.in`;
    const usernamePrefix = rawEmail.split("@")[0];

    if (!isDbConfigured()) {
      return NextResponse.json(
        { error: "Authentication service is currently unavailable. Please try again later." },
        { status: 500 }
      );
    }

    await initDatabase();
    const sql = getDb();

    const rows = await sql`
      SELECT id, name, full_name, email, role, job_title, avatar, phone, employee_id, bio, password_hash, initial_password
      FROM users
      WHERE LOWER(email) = LOWER(${normalizedEmail})
         OR LOWER(split_part(email, '@', 1)) = LOWER(${usernamePrefix})
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No user found with this email or username." },
        { status: 401 }
      );
    }

    const dbUser = rows[0];
    const passwordHash = dbUser.password_hash as string;
    const initialPlain = dbUser.initial_password as string;

    const isValid =
      verifyPassword(password, passwordHash) ||
      (initialPlain && password === initialPlain);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password. Please check your credentials." },
        { status: 401 }
      );
    }

    const token = signSessionToken(dbUser.id as string);

    const userProfile = {
      id: dbUser.id as string,
      name: dbUser.name as string,
      fullName: dbUser.full_name as string,
      email: dbUser.email as string,
      role: dbUser.role as "ceo" | "project_manager" | "employer",
      jobTitle: (dbUser.job_title as string) || (dbUser.role === "ceo" ? "Chief Executive Officer" : dbUser.role === "project_manager" ? "Project Manager" : "Software Developer"),
      avatar: (dbUser.avatar as string) || "",
      phone: (dbUser.phone as string) || "",
      employeeId: (dbUser.employee_id as string) || "",
      bio: (dbUser.bio as string) || "",
    };

    const response = NextResponse.json({
      success: true,
      user: userProfile,
    });

    response.cookies.set("teamflow_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, 
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    console.error("POST /api/auth/login error:", error);
    const message = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

