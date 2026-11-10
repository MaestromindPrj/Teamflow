import { neon } from "@neondatabase/serverless";
import { hashPassword } from "@/lib/auth";
import {
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_TASKS_DATA,
  INITIAL_ATTENDANCE_DATA,
  DEFAULT_PROJECT_CATEGORIES,
  DEFAULT_JOB_ROLES,
  User,
  Project,
  Task,
  AttendanceRecord,
} from "@/data/teamflowData";

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL
  );
}

export function isDbConfigured(): boolean {
  return !!getDatabaseUrl();
}

export function getDb() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "Neon PostgreSQL DATABASE_URL is not configured. Please add DATABASE_URL in your .env.local or Vercel environment variables."
    );
  }
  return neon(url);
}

let isInitialized = false;

export async function initDatabase() {
  if (isInitialized) return;
  if (!isDbConfigured()) return;

  const sql = getDb();

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        job_title VARCHAR(255),
        department VARCHAR(255),
        avatar TEXT,
        phone VARCHAR(100),
        employee_id VARCHAR(100),
        bio TEXT,
        password_hash TEXT,
        initial_password TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        project_manager_id VARCHAR(100),
        team_lead_id VARCHAR(100),
        team_member_ids JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50),
        priority VARCHAR(50),
        start_date VARCHAR(50),
        deadline VARCHAR(50),
        category VARCHAR(100),
        budget VARCHAR(100),
        tech_stack JSONB DEFAULT '[]'::jsonb,
        attachments JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(100) PRIMARY KEY,
        project_id VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_to VARCHAR(100),
        assigned_by VARCHAR(100),
        priority VARCHAR(50),
        status VARCHAR(50),
        deadline VARCHAR(50),
        progress INTEGER DEFAULT 0,
        attachments JSONB DEFAULT '[]'::jsonb,
        activity JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100),
        user_name VARCHAR(255),
        user_role VARCHAR(50),
        department VARCHAR(255),
        date VARCHAR(50),
        clock_in VARCHAR(50),
        clock_out VARCHAR(50),
        duration VARCHAR(50),
        status VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS clock_in_status (
        user_id VARCHAR(100) PRIMARY KEY,
        is_clocked_in BOOLEAN DEFAULT false,
        clock_in_timestamp BIGINT,
        clock_in_time_string VARCHAR(50),
        clock_out_time_string VARCHAR(50),
        elapsed_seconds INTEGER DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS rewards_ledger (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        points INTEGER NOT NULL,
        action VARCHAR(255) NOT NULL,
        reason TEXT NOT NULL,
        awarded_by_id VARCHAR(100),
        awarded_by_name VARCHAR(255),
        date VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS project_categories (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS job_roles (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS office_leaves (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        end_date VARCHAR(50),
        declared_by_id VARCHAR(100),
        declared_by_name VARCHAR(255),
        declared_by_role VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Drop description column from office_leaves, projects & project_categories if they still exist (migration)
    await sql`
      ALTER TABLE office_leaves DROP COLUMN IF EXISTS description;
    `;
    await sql`
      ALTER TABLE projects DROP COLUMN IF EXISTS description;
    `;
    await sql`
      ALTER TABLE project_categories DROP COLUMN IF EXISTS description;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tech_stacks (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_role VARCHAR(50),
        start_date VARCHAR(50) NOT NULL,
        end_date VARCHAR(50) NOT NULL,
        leave_type VARCHAR(50) NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        applied_by_id VARCHAR(100),
        applied_by_name VARCHAR(255),
        reviewed_by_id VARCHAR(100),
        reviewed_by_name VARCHAR(255),
        reviewed_by_role VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS initial_password TEXT;`;
      await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS discussion JSONB DEFAULT '[]'::jsonb;`;
      await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_stack JSONB DEFAULT '[]'::jsonb;`;

      await sql`
        UPDATE projects
        SET tech_stack = CASE
          WHEN LOWER(COALESCE(category, '')) LIKE '%web%' THEN '["React", "Next.js", "TypeScript", "Tailwind CSS"]'::jsonb
          WHEN LOWER(COALESCE(category, '')) LIKE '%mobile%' THEN '["Flutter", "Node.js", "PostgreSQL", "Docker"]'::jsonb
          WHEN LOWER(COALESCE(category, '')) LIKE '%cloud%' OR LOWER(COALESCE(category, '')) LIKE '%data%' THEN '["Python", "AWS", "PostgreSQL", "Docker"]'::jsonb
          WHEN LOWER(COALESCE(category, '')) LIKE '%design%' THEN '["Figma", "React", "TypeScript", "Tailwind CSS"]'::jsonb
          ELSE '["React", "TypeScript", "Node.js", "PostgreSQL"]'::jsonb
        END
        WHERE tech_stack IS NULL OR tech_stack = '[]'::jsonb OR tech_stack = 'null'::jsonb;
      `;
      await sql`ALTER TABLE clock_in_status ADD COLUMN IF NOT EXISTS clock_in_date VARCHAR(50);`;
      await sql`ALTER TABLE clock_in_status ADD COLUMN IF NOT EXISTS sessions JSONB DEFAULT '[]'::jsonb;`;
      await sql`ALTER TABLE clock_in_status ADD COLUMN IF NOT EXISTS last_heartbeat BIGINT;`;
      await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS sessions JSONB DEFAULT '[]'::jsonb;`;
      await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS leave_type VARCHAR(50);`;
      await sql`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS leave_reason TEXT;`;
      await sql`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reviewed_by_role VARCHAR(50);`;
      await sql`ALTER TABLE office_leaves ADD COLUMN IF NOT EXISTS declared_by_id VARCHAR(100);`;
      await sql`ALTER TABLE office_leaves ADD COLUMN IF NOT EXISTS declared_by_name VARCHAR(255);`;
      await sql`ALTER TABLE office_leaves ADD COLUMN IF NOT EXISTS declared_by_role VARCHAR(50);`;
      await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;`;
      await sql`ALTER TABLE project_categories DROP COLUMN IF EXISTS description;`;

      // Performance Indexes for scalable, fast querying
      await sql`CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_rewards_ledger_user_id ON rewards_ledger(user_id);`;

      // Migrate project codes to be based on categories
      await sql`
        UPDATE projects
        SET code = 'MOB-01'
        WHERE code = 'GRE-01' OR (id = 'proj-1793958191493' AND code != 'MOB-01');
      `;

      try {
        await sql`
          UPDATE projects p
          SET attachments = (
            SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
            FROM (
              SELECT jsonb_array_elements(COALESCE(p.attachments, '[]'::jsonb)) AS elem
              UNION
              SELECT jsonb_array_elements(COALESCE(t.attachments, '[]'::jsonb)) AS elem
            ) s
          )
          FROM tasks t
          WHERE t.project_id = p.id
            AND (t.title = 'Project Assets & Deliverables' OR t.title = 'Project Deliverables & Assets')
            AND t.attachments IS NOT NULL
            AND jsonb_array_length(t.attachments) > 0;
        `;
        await sql`
          DELETE FROM tasks
          WHERE title = 'Project Assets & Deliverables' OR title = 'Project Deliverables & Assets';
        `;
      } catch (cleanupErr) {
        console.warn("Cleanup warning:", cleanupErr);
      }

      // Remove test leave for Muthu Krishnan (456-day leave request and its generated attendance records)
      try {
        await sql`
          DELETE FROM leave_requests
          WHERE id = 'leave-1793958337968-u-emp-1793956721315'
             OR (user_id = 'u-emp-1793956721315' AND end_date = '2028-02-05');
        `;
        await sql`
          DELETE FROM attendance
          WHERE user_id = 'u-emp-1793956721315' AND status = 'Leave';
        `;
        await sql`
          UPDATE attendance
          SET leave_type = NULL, leave_reason = NULL
          WHERE user_id = 'u-emp-1793956721315' AND date = '2026-11-06';
        `;
      } catch (leaveCleanupErr) {
        console.warn("Leave cleanup warning:", leaveCleanupErr);
      }

      const defaultPassword = "Maestro@CEO2026!";
      const defaultHash = hashPassword(defaultPassword);
      await sql`
        UPDATE users 
        SET initial_password = ${defaultPassword}, password_hash = ${defaultHash} 
        WHERE password_hash IS NULL OR password_hash = '';
      `;
    } catch (migErr) {
      console.warn("Migration warning:", migErr);
    }

    const userCountResult = await sql`SELECT COUNT(*)::int AS count FROM users;`;
    const userCount = Number(userCountResult[0]?.count || 0);

    if (userCount === 0) {
      const defaultPassword = "Maestro@CEO2026!";
      const defaultHash = hashPassword(defaultPassword);

      for (const u of INITIAL_USERS) {
        await sql`
          INSERT INTO users (id, name, full_name, email, role, job_title, avatar, phone, employee_id, password_hash, initial_password)
          VALUES (
            ${u.id},
            ${u.name},
            ${u.fullName},
            ${u.email},
            ${u.role},
            ${u.jobTitle},
            ${u.avatar},
            ${u.phone},
            ${u.employeeId},
            ${defaultHash},
            ${defaultPassword}
          )
          ON CONFLICT (id) DO UPDATE SET
            password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash),
            initial_password = COALESCE(users.initial_password, EXCLUDED.initial_password);
        `;
      }
    }

    if (INITIAL_PROJECTS.length > 0) {
      const projectCountResult = await sql`SELECT COUNT(*)::int AS count FROM projects;`;
      const projectCount = Number(projectCountResult[0]?.count || 0);

      if (projectCount === 0) {
        for (const p of INITIAL_PROJECTS) {
          await sql`
            INSERT INTO projects (id, name, code, project_manager_id, team_lead_id, team_member_ids, status, priority, start_date, deadline, category, budget, tech_stack)
            VALUES (
              ${p.id},
              ${p.name},
              ${p.code},
              ${p.projectManagerId},
              ${p.teamLeadId},
              ${JSON.stringify(p.teamMemberIds)}::jsonb,
              ${p.status},
              ${p.priority},
              ${p.startDate},
              ${p.deadline},
              ${p.category},
              ${p.budget},
              ${JSON.stringify(p.techStack || [])}::jsonb
            )
            ON CONFLICT (id) DO NOTHING;
          `;
        }
      }
    }

    if (INITIAL_TASKS_DATA.length > 0) {
      const taskCountResult = await sql`SELECT COUNT(*)::int AS count FROM tasks;`;
      const taskCount = Number(taskCountResult[0]?.count || 0);

      if (taskCount === 0) {
        for (const t of INITIAL_TASKS_DATA) {
          await sql`
            INSERT INTO tasks (id, project_id, title, description, assigned_to, assigned_by, priority, status, deadline, progress, attachments, activity)
            VALUES (
              ${t.id},
              ${t.projectId},
              ${t.title},
              ${t.description},
              ${t.assignedTo},
              ${t.assignedBy},
              ${t.priority},
              ${t.status},
              ${t.deadline},
              ${t.progress},
              ${JSON.stringify(t.attachments || [])}::jsonb,
              ${JSON.stringify(t.activity || [])}::jsonb
            )
            ON CONFLICT (id) DO NOTHING;
          `;
        }
      }
    }

    if (INITIAL_ATTENDANCE_DATA.length > 0) {
      const attCountResult = await sql`SELECT COUNT(*)::int AS count FROM attendance;`;
      const attCount = Number(attCountResult[0]?.count || 0);

      if (attCount === 0) {
        for (const a of INITIAL_ATTENDANCE_DATA) {
          await sql`
            INSERT INTO attendance (id, user_id, user_name, user_role, date, clock_in, clock_out, duration, status)
            VALUES (
              ${a.id},
              ${a.userId},
              ${a.userName},
              ${a.userRole},
              ${a.date},
              ${a.clockIn},
              ${a.clockOut},
              ${a.duration},
              ${a.status}
            )
            ON CONFLICT (id) DO NOTHING;
          `;
        }
      }
    }

    const clockCountResult = await sql`SELECT COUNT(*)::int AS count FROM clock_in_status;`;
    const clockCount = Number(clockCountResult[0]?.count || 0);

    if (clockCount === 0) {
      const defaultClockIns = [
        { userId: "u-ceo-1", isClockedIn: false, clockInTimeString: null, elapsedSeconds: 0 },
      ];

      for (const c of defaultClockIns) {
        await sql`
          INSERT INTO clock_in_status (user_id, is_clocked_in, clock_in_time_string, elapsed_seconds)
          VALUES (${c.userId}, ${c.isClockedIn}, ${c.clockInTimeString}, ${c.elapsedSeconds})
          ON CONFLICT (user_id) DO NOTHING;
        `;
      }
    }

    const jobRoleCountResult = await sql`SELECT COUNT(*)::int AS count FROM job_roles;`;
    const jobRoleCount = Number(jobRoleCountResult[0]?.count || 0);
    if (jobRoleCount === 0) {
      for (const r of DEFAULT_JOB_ROLES) {
        await sql`
          INSERT INTO job_roles (id, name)
          VALUES (${r.id}, ${r.name})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    isInitialized = true;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

