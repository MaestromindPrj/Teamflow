import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { verifyPassword, hashPassword, verifySessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("teamflow_session")?.value;
    const body = await req.json();
    const { currentPassword, newPassword, userId: fallbackUserId } = body;

    let targetUserId = fallbackUserId;
    if (sessionCookie) {
      const verified = verifySessionToken(sessionCookie);
      if (verified?.userId) {
        targetUserId = verified.userId;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in again." },
        { status: 401 }
      );
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required." },
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
        { error: "Unable to update password. Please try again later." },
        { status: 500 }
      );
    }

    await initDatabase();
    const sql = getDb();

    const users = await sql`
      SELECT id, password_hash, initial_password
      FROM users
      WHERE id = ${targetUserId}
      LIMIT 1;
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const user = users[0];
    const passwordHash = user.password_hash as string;
    const initialPlain = user.initial_password as string;

    const isCurrentValid =
      verifyPassword(currentPassword, passwordHash) ||
      (initialPlain && currentPassword === initialPlain);

    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Current password does not match. Please verify and try again." },
        { status: 403 }
      );
    }

    const newHash = hashPassword(newPassword);

    await sql`
      UPDATE users
      SET password_hash = ${newHash},
          initial_password = ${newPassword}
      WHERE id = ${targetUserId};
    `;

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error: unknown) {
    console.error("POST /api/auth/change-password error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

