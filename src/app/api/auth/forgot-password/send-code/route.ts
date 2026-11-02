import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { sendPasswordResetOtpEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = (body.email || "").trim().toLowerCase();

    if (!rawEmail) {
      return NextResponse.json(
        { error: "Please enter your registered email address." },
        { status: 400 }
      );
    }

    if (!isDbConfigured()) {
      return NextResponse.json(
        { error: "Unable to process request at this time. Please try again later." },
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
      SELECT id, full_name, email
      FROM users
      WHERE LOWER(email) = LOWER(${normalizedEmail})
         OR LOWER(split_part(email, '@', 1)) = LOWER(${usernamePrefix})
      LIMIT 1;
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No user found with this email or username." },
        { status: 404 }
      );
    }

    const user = users[0];
    const userEmail = user.email as string;
    const recipientName = (user.full_name as string) || "Team Member";

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeId = `otp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    await sql`
      UPDATE password_reset_codes
      SET used = true
      WHERE user_id = ${user.id as string} AND used = false;
    `;

    await sql`
      INSERT INTO password_reset_codes (id, user_id, email, code, expires_at, used)
      VALUES (${codeId}, ${user.id as string}, ${userEmail}, ${otpCode}, ${expiresAt}, false);
    `;

    const emailResult = await sendPasswordResetOtpEmail({
      toEmail: userEmail,
      recipientName,
      otpCode,
    });

    if (!emailResult.success) {
      console.warn("SMTP verification email send failed:", emailResult.error);
      return NextResponse.json(
        {
          error: "Failed to deliver verification email. Please check your email address and try again.",
        },
        { status: 502 }
      );
    }

    const parts = userEmail.split("@");
    const namePart = parts[0];
    const domainPart = parts[1] || "";
    const maskedName =
      namePart.length <= 2
        ? namePart[0] + "***"
        : namePart[0] + "***" + namePart[namePart.length - 1];
    const maskedEmail = `${maskedName}@${domainPart}`;

    console.log(`[Password Reset OTP] Generated code for ${userEmail}: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${maskedEmail}`,
      maskedEmail,
      email: userEmail,
    });
  } catch (error: unknown) {
    console.error("POST /api/auth/forgot-password/send-code error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

