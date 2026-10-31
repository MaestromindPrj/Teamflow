import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = (body.email || "").trim().toLowerCase();
    const code = (body.code || "").trim();

    if (!rawEmail || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    if (!isDbConfigured()) {
      return NextResponse.json(
        { error: "Unable to verify code. Please try again later." },
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
      SELECT id, email FROM users
      WHERE LOWER(email) = LOWER(${normalizedEmail})
         OR LOWER(split_part(email, '@', 1)) = LOWER(${usernamePrefix})
      LIMIT 1;
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const userId = users[0].id as string;
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
        { error: "Invalid or expired verification code. Please check your email or request a new code." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: "Verification code confirmed.",
    });
  } catch (error: unknown) {
    console.error("POST /api/auth/forgot-password/verify-code error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

