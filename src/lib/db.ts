import { neon } from "@neondatabase/serverless";
import {
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_TASKS_DATA,
  INITIAL_ATTENDANCE_DATA,
  User,
  Project,
  Task,
  AttendanceRecord,
} from "@/data/teamflowData";

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Neon PostgreSQL DATABASE_URL is not configured. Please add DATABASE_URL in your .env.local file."
    );
  }
  return neon(process.env.DATABASE_URL);
}

// Track whether init has already executed in this process
let isInitialized = false;

/**
 * Initializes database tables and automatically seeds them with initial data if empty.
 */
export async function initDatabase() {
  if (isInitialized) return;
  if (!isDbConfigured()) return;

  const sql = getDb();

  try {
    // 1. Create Users Table
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
        location VARCHAR(255),
        employee_id VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Create Projects Table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        description TEXT,
        project_manager_id VARCHAR(100),
        team_lead_id VARCHAR(100),
        team_member_ids JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50),
        priority VARCHAR(50),
        start_date VARCHAR(50),
        deadline VARCHAR(50),
        category VARCHAR(100),
        budget VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 3. Create Tasks Table
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

    // 4. Create Attendance Table
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

    // 5. Create Clock In Status Table
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

    // Check if initial users exist
    const userCountResult = await sql`SELECT COUNT(*)::int AS count FROM users;`;
    const userCount = Number(userCountResult[0]?.count || 0);

    if (userCount === 0) {
      // Seed Initial Users
      for (const u of INITIAL_USERS) {
        await sql`
          INSERT INTO users (id, name, full_name, email, role, job_title, department, avatar, phone, location, employee_id)
          VALUES (
            ${u.id},
            ${u.name},
            ${u.fullName},
            ${u.email},
            ${u.role},
            ${u.jobTitle},
            ${u.department},
            ${u.avatar},
            ${u.phone},
            ${u.location},
            ${u.employeeId}
          )
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    // Check if initial projects exist
    const projectCountResult = await sql`SELECT COUNT(*)::int AS count FROM projects;`;
    const projectCount = Number(projectCountResult[0]?.count || 0);

    if (projectCount === 0) {
      // Seed Initial Projects
      for (const p of INITIAL_PROJECTS) {
        await sql`
          INSERT INTO projects (id, name, code, description, project_manager_id, team_lead_id, team_member_ids, status, priority, start_date, deadline, category, budget)
          VALUES (
            ${p.id},
            ${p.name},
            ${p.code},
            ${p.description},
            ${p.projectManagerId},
            ${p.teamLeadId},
            ${JSON.stringify(p.teamMemberIds)}::jsonb,
            ${p.status},
            ${p.priority},
            ${p.startDate},
            ${p.deadline},
            ${p.category},
            ${p.budget}
          )
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    // Check if initial tasks exist
    const taskCountResult = await sql`SELECT COUNT(*)::int AS count FROM tasks;`;
    const taskCount = Number(taskCountResult[0]?.count || 0);

    if (taskCount === 0) {
      // Seed Initial Tasks
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

    // Check if initial attendance records exist
    const attCountResult = await sql`SELECT COUNT(*)::int AS count FROM attendance;`;
    const attCount = Number(attCountResult[0]?.count || 0);

    if (attCount === 0) {
      for (const a of INITIAL_ATTENDANCE_DATA) {
        await sql`
          INSERT INTO attendance (id, user_id, user_name, user_role, department, date, clock_in, clock_out, duration, status)
          VALUES (
            ${a.id},
            ${a.userId},
            ${a.userName},
            ${a.userRole},
            ${a.department},
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

    isInitialized = true;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

