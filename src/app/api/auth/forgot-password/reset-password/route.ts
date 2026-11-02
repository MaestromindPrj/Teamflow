import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { hashPassword, signSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = (body.email || "").trim().toLowerCase();
    const code = (body.code || "").trim();
    const newPassword = (body.newPassword || "").trim();

    if (!rawEmail || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, verification code, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (!isDbConfigured()) {
      return NextResponse.json(
        { error: "Unable to reset password. Please try again later." },
        { status: 500 }
      );
    }

    await initDatabase();
    const sql = getDb();

    const normalizedEmail = rawEmail.includes("@")
      ? rawEmail
      : `${rawEmail}@maestrominds.co.in`;
    const usernamePrefix = rawEmail.split("@")[0];

    const users = await sql`
      SELECT id, name, full_name, email, role, job_title, avatar, phone, employee_id, bio
      FROM users
      WHERE LOWER(email) = LOWER(${normalizedEmail})
         OR LOWER(split_part(email, '@', 1)) = LOWER(${usernamePrefix})
      LIMIT 1;
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const dbUser = users[0];
    const userId = dbUser.id as string;
    const now = new Date();

    const matchedCodes = await sql`
      SELECT id, code, expires_at, used
      FROM password_reset_codes
      WHERE user_id = ${userId}
        AND code = ${code}
        AND used = false
        AND expires_at > ${now}
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    if (matchedCodes.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired verification code. Please request a new code." },
        { status: 400 }
      );
    }

    const codeId = matchedCodes[0].id as string;
    await sql`
      UPDATE password_reset_codes
      SET used = true
      WHERE id = ${codeId};
    `;

    const newHash = hashPassword(newPassword);

    await sql`
      UPDATE users
      SET password_hash = ${newHash},
          initial_password = ${newPassword}
      WHERE id = ${userId};
    `;

    const token = signSessionToken(userId);

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
      bio: (dbUser.bio as string) || undefined,
    };

    const response = NextResponse.json({
      success: true,
      message: "Password updated successfully. Signing in...",
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
    console.error("POST /api/auth/forgot-password/reset-password error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
