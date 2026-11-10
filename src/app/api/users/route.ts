import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { INITIAL_USERS, User } from "@/data/teamflowData";
import { hashPassword, generateInitialPassword } from "@/lib/auth";
import { sendNewUserCredentialsEmail } from "@/lib/email";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ users: INITIAL_USERS, source: "mock" });
  }

  try {
    await initDatabase();
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, full_name, email, role, job_title, avatar, phone, employee_id, bio
      FROM users
      ORDER BY id ASC;
    `;

    const users: User[] = rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      fullName: r.full_name as string,
      email: r.email as string,
      role: r.role as "ceo" | "project_manager" | "employee",
      jobTitle: (r.job_title as string) || (r.role === "ceo" ? "Chief Executive Officer" : r.role === "project_manager" ? "Project Manager" : "Software Developer"),
      avatar: (r.avatar as string) || "",
      phone: (r.phone as string) || "",
      employeeId: (r.employee_id as string) || "",
      bio: (r.bio as string) || "",
    }));

    return NextResponse.json({ users, source: "database" });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users", users: [], source: "error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const { id, name, fullName, email, role, jobTitle, avatar, phone, employeeId, bio } = body;

    if (!id || !email || !fullName) {
      return NextResponse.json({ error: "Missing required fields (id, email, fullName)" }, { status: 400 });
    }

    const initialPassword = body.password || body.initialPassword || generateInitialPassword();
    const passwordHash = hashPassword(initialPassword);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@maestrominds.co.in")) {
      return NextResponse.json(
        { error: "Only @maestrominds.co.in email addresses are accepted." },
        { status: 400 }
      );
    }

    const effectiveRole = role === "project_manager" ? "project_manager" : role === "ceo" ? "ceo" : "employee";
    const effectiveJobTitle = effectiveRole === "project_manager"
      ? "Project Manager"
      : effectiveRole === "ceo"
      ? "Chief Executive Officer"
      : (jobTitle?.trim() || "Software Developer");

    const sql = getDb();

    const existingUsers = await sql`
      SELECT id FROM users
      WHERE LOWER(email) = LOWER(${normalizedEmail})
        AND id != ${id}
      LIMIT 1;
    `;

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User already exists with this email address." },
        { status: 409 }
      );
    }

    const effectiveName = (name && name !== id && !name.includes("@") ? name : fullName).trim();
    const cleanPhone = phone !== undefined ? phone.trim() : "";
    const cleanBio = bio !== undefined ? (bio.trim() || null) : null;
    const cleanAvatar = avatar !== undefined ? avatar.trim() : "";

    await sql`
      INSERT INTO users (id, name, full_name, email, role, job_title, avatar, phone, employee_id, bio, password_hash, initial_password)
      VALUES (${id}, ${effectiveName}, ${fullName}, ${normalizedEmail}, ${effectiveRole}, ${effectiveJobTitle}, ${cleanAvatar}, ${cleanPhone}, ${employeeId || ""}, ${cleanBio}, ${passwordHash}, ${initialPassword})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        job_title = EXCLUDED.job_title,
        avatar = EXCLUDED.avatar,
        phone = EXCLUDED.phone,
        employee_id = EXCLUDED.employee_id,
        bio = EXCLUDED.bio,
        password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash),
        initial_password = COALESCE(users.initial_password, EXCLUDED.initial_password);
    `;

    const cleanSyncName = (fullName || effectiveName || "").trim();
    if (cleanSyncName) {
      await sql`UPDATE attendance SET user_name = ${cleanSyncName}, user_role = ${effectiveRole} WHERE user_id = ${id};`;
      await sql`UPDATE leave_requests SET user_name = ${cleanSyncName}, user_role = ${effectiveRole} WHERE user_id = ${id};`;
      await sql`UPDATE leave_requests SET applied_by_name = ${cleanSyncName} WHERE applied_by_id = ${id};`;
      await sql`UPDATE leave_requests SET reviewed_by_name = ${cleanSyncName} WHERE reviewed_by_id = ${id};`;
      await sql`UPDATE office_leaves SET declared_by_name = ${cleanSyncName} WHERE declared_by_id = ${id};`;
      await sql`UPDATE rewards_ledger SET awarded_by_name = ${cleanSyncName} || ' (' || CASE WHEN ${effectiveRole} = 'ceo' THEN 'CEO' ELSE 'Project Manager' END || ')' WHERE awarded_by_id = ${id};`;
    }

    let emailSent = false;
    let emailError: string | undefined;

    if (body.sendWelcomeEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://teamflow-topaz.vercel.app";
      const loginUrl = `${appUrl}/login`;

      try {
        const emailResult = await sendNewUserCredentialsEmail({
          toEmail: email,
          recipientName: fullName,
          role: role === "project_manager" ? "Project Manager" : "Employee",
          jobTitle: jobTitle || (role === "project_manager" ? "Project Manager" : "Software Developer"),
          initialPassword,
          loginUrl,
        });
        emailSent = emailResult.success;
        emailError = emailResult.error;
      } catch (e: unknown) {
        emailSent = false;
        emailError = e instanceof Error ? e.message : "Failed to dispatch email";
      }
    }

    return NextResponse.json({
      success: true,
      user: body,
      initialPassword,
      emailSent,
      emailError,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create/update user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    await initDatabase();
    const body = await req.json();
    const { id, name, fullName, email, role, jobTitle, avatar, phone, bio, password } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const sql = getDb();
    const existing = await sql`SELECT id, name, full_name, email, role, job_title, avatar, phone, bio, password_hash, initial_password FROM users WHERE id = ${id} LIMIT 1;`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const current = existing[0];

    const normalizedEmail = (email || "").trim().toLowerCase();
    if (normalizedEmail) {
      if (!normalizedEmail.endsWith("@maestrominds.co.in")) {
        return NextResponse.json(
          { error: "Only @maestrominds.co.in email addresses are accepted." },
          { status: 400 }
        );
      }

      const emailConflict = await sql`
        SELECT id FROM users
        WHERE LOWER(email) = LOWER(${normalizedEmail})
          AND id != ${id}
        LIMIT 1;
      `;
      if (emailConflict.length > 0) {
        return NextResponse.json({ error: "Another user already exists with this email address." }, { status: 409 });
      }
    }

    const effectiveRole = role || current.role;
    const finalJobTitle =
      effectiveRole === "project_manager"
        ? "Project Manager"
        : effectiveRole === "ceo"
        ? "Chief Executive Officer"
        : (jobTitle !== undefined ? jobTitle.trim() : (current.job_title || "Software Developer"));

    const effectiveFullName = fullName !== undefined ? fullName.trim() : current.full_name;
    const effectiveName = name !== undefined ? name.trim() : (effectiveFullName || current.name);
    const finalPhone = phone !== undefined ? phone.trim() : (current.phone || "");
    const finalBio = bio !== undefined ? (bio.trim() || null) : current.bio;
    const finalAvatar = avatar !== undefined ? avatar.trim() : (current.avatar || "");
    const finalEmail = normalizedEmail ? normalizedEmail : current.email;

    let newPasswordHash: string | null = null;
    let initialPasswordPlain: string | null = null;
    if (password && typeof password === "string" && password.trim()) {
      newPasswordHash = hashPassword(password.trim());
      initialPasswordPlain = password.trim();
    }

    if (newPasswordHash) {
      await sql`
        UPDATE users
        SET
          full_name = ${effectiveFullName},
          name = ${effectiveName},
          email = ${finalEmail},
          role = ${effectiveRole},
          job_title = ${finalJobTitle},
          phone = ${finalPhone},
          bio = ${finalBio},
          avatar = ${finalAvatar},
          password_hash = ${newPasswordHash},
          initial_password = ${initialPasswordPlain}
        WHERE id = ${id};
      `;
    } else {
      await sql`
        UPDATE users
        SET
          full_name = ${effectiveFullName},
          name = ${effectiveName},
          email = ${finalEmail},
          role = ${effectiveRole},
          job_title = ${finalJobTitle},
          phone = ${finalPhone},
          bio = ${finalBio},
          avatar = ${finalAvatar}
        WHERE id = ${id};
      `;
    }

    // Keep all related logs and historical tables in sync if name or role changed
    const cleanSyncName = (effectiveFullName || effectiveName || "").trim();
    if (cleanSyncName) {
      await sql`UPDATE attendance SET user_name = ${cleanSyncName}, user_role = ${effectiveRole} WHERE user_id = ${id};`;
      await sql`UPDATE leave_requests SET user_name = ${cleanSyncName}, user_role = ${effectiveRole} WHERE user_id = ${id};`;
      await sql`UPDATE leave_requests SET applied_by_name = ${cleanSyncName} WHERE applied_by_id = ${id};`;
      await sql`UPDATE leave_requests SET reviewed_by_name = ${cleanSyncName} WHERE reviewed_by_id = ${id};`;
      await sql`UPDATE office_leaves SET declared_by_name = ${cleanSyncName} WHERE declared_by_id = ${id};`;
      await sql`UPDATE rewards_ledger SET awarded_by_name = ${cleanSyncName} || ' (' || CASE WHEN ${effectiveRole} = 'ceo' THEN 'CEO' ELSE 'Project Manager' END || ')' WHERE awarded_by_id = ${id};`;
    }

    const updatedRows = await sql`
      SELECT id, name, full_name, email, role, job_title, avatar, phone, employee_id, bio
      FROM users
      WHERE id = ${id}
      LIMIT 1;
    `;

    const u = updatedRows[0];
    const updatedUser: User = {
      id: u.id as string,
      name: u.name as string,
      fullName: u.full_name as string,
      email: u.email as string,
      role: u.role as "ceo" | "project_manager" | "employee",
      jobTitle: (u.job_title as string) || "",
      avatar: (u.avatar as string) || "",
      phone: (u.phone as string) || "",
      employeeId: (u.employee_id as string) || "",
      bio: (u.bio as string) || "",
    };

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (userId === "u-ceo-1") {
      return NextResponse.json({ error: "The primary CEO account cannot be deleted." }, { status: 403 });
    }

    await initDatabase();
    const sql = getDb();
    await sql`DELETE FROM users WHERE id = ${userId};`;
    await sql`DELETE FROM clock_in_status WHERE user_id = ${userId};`;
    await sql`DELETE FROM password_reset_codes WHERE user_id = ${userId};`;
    await sql`DELETE FROM attendance WHERE user_id = ${userId};`;
    await sql`DELETE FROM leave_requests WHERE user_id = ${userId};`;

    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

