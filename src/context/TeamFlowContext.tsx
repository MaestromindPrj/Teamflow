"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  User,
  Project,
  Task,
  TaskAttachment,
  AttendanceRecord,
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_TASKS_DATA,
  INITIAL_ATTENDANCE_DATA
} from "@/data/teamflowData";
import { RewardLedgerEntry } from "@/app/api/rewards/route";

export interface UserClockInState {
  isClockedIn: boolean;
  clockInTimestamp: number | null;
  clockInTimeString: string | null;
  clockOutTimeString: string | null;
  elapsedSeconds?: number;
  clockInDate?: string;
}

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStartOfTodayTimestamp(d: Date = new Date()): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
}

export function formatSecondsToDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

const DEFAULT_CLOCK_IN_DATA: Record<string, UserClockInState> = {
  "u-ceo-1": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
    clockInDate: undefined
  },
  "u-pm-1": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
    clockInDate: undefined
  },
  "u-pm-2": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
    clockInDate: undefined
  },
  "u-emp-1": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
    clockInDate: undefined
  },
  "u-emp-2": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
    clockInDate: undefined
  },
  "u-emp-3": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
    clockInDate: undefined
  },
  "u-emp-4": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
    clockInDate: undefined
  },
  "u-emp-5": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
    clockInDate: undefined
  }
};

interface TeamFlowContextType {
  currentUser: User;
  users: User[];
  projects: Project[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  userClockInData: Record<string, UserClockInState>;
  currentUserClockIn: UserClockInState;
  setCurrentUserId: (id: string) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  createProject: (projectData: {
    name: string;
    code?: string;
    description: string;
    projectManagerId: string;
    teamLeadId: string;
    teamMemberIds: string[];
    priority: "High" | "Medium" | "Low";
    deadline: string;
    category: string;
    budget?: string;
  }) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createTask: (taskData: {
    projectId: string;
    title: string;
    description: string;
    assignedTo: string;
    priority: "High" | "Medium" | "Low";
    deadline: string;
    status?: "To Do" | "In Progress" | "Review" | "Completed";
  }) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  uploadTaskMedia: (
    taskId: string,
    file: {
      name: string;
      size: string;
      type: "image" | "pdf" | "figma" | "zip" | "doc";
      url?: string;
      rawFile?: File | null;
    }
  ) => void;
  toggleClockInOut: () => void;
  toggleUserClockIn: (userId: string) => void;
  isClockedIn: boolean;
  getProjectTasks: (projectId: string) => Task[];
  getUserAssignedTasks: (userId: string, projectId?: string) => Task[];
  getProjectTeamLead: (projectId: string) => User | undefined;
  getProjectManager: (projectId: string) => User | undefined;
  isUserTeamLead: (userId: string, projectId: string) => boolean;
  getAllMedia: () => Array<TaskAttachment & { projectTitle: string; taskTitle: string; projectId: string }>;
  getProjectMedia: (projectId: string) => Array<TaskAttachment & { taskTitle: string }>;
  departments: { id: string; name: string }[];
  createDepartment: (name: string) => Promise<boolean>;
  updateDepartment: (id: string, name: string, oldName?: string) => Promise<boolean>;
  deleteDepartment: (id: string) => Promise<boolean>;
  addTeamMember: (userData: {
    fullName: string;
    email: string;
    role: "employer" | "project_manager";
    department?: string;
    jobTitle?: string;
    initialPassword?: string;
  }) => Promise<User>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  rewardsLedger: RewardLedgerEntry[];
  awardRewardPoints: (params: {
    userId: string;
    points: number;
    action: string;
    reason: string;
  }) => Promise<boolean>;
}

const TeamFlowContext = createContext<TeamFlowContextType | undefined>(undefined);

const DEFAULT_DEPARTMENTS: { id: string; name: string }[] = [
  { id: "dept-ui-ux-designer", name: "UI/UX Designer" },
  { id: "dept-software-developer", name: "Software Developer" },
  { id: "dept-junior-software-developer", name: "Junior Software Developer" },
  { id: "dept-ai-engineer", name: "AI Engineer" },
  { id: "dept-project-manager", name: "Project Manager" },
];

export function TeamFlowProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserIdState] = useState<string>("u-ceo-1");
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS_DATA);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_DATA);
  const [userClockInData, setUserClockInData] = useState<Record<string, UserClockInState>>(DEFAULT_CLOCK_IN_DATA);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>(DEFAULT_DEPARTMENTS);
  const [rewardsLedger, setRewardsLedger] = useState<RewardLedgerEntry[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Initial local hydration from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("teamflow_current_user");
      const savedProjects = localStorage.getItem("teamflow_projects");
      const savedTasks = localStorage.getItem("teamflow_tasks");
      const savedAttendance = localStorage.getItem("teamflow_attendance");

      const validUserIds = new Set(INITIAL_USERS.map((u) => u.id));
      if (savedUser && validUserIds.has(savedUser)) {
        setCurrentUserIdState(savedUser);
      } else {
        setCurrentUserIdState("u-ceo-1");
      }

      const savedUsers = localStorage.getItem("teamflow_users");
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUsers(parsed);
          }
        } catch {}
      }

      if (savedProjects) {
        try {
          const parsed = JSON.parse(savedProjects);
          if (Array.isArray(parsed)) setProjects(parsed);
        } catch {}
      }

      if (savedTasks) {
        try {
          const parsed = JSON.parse(savedTasks);
          if (Array.isArray(parsed)) setTasks(parsed);
        } catch {}
      }

      const hasAttendanceCleaned = localStorage.getItem("teamflow_attendance_v4_reset");
      if (!hasAttendanceCleaned) {
        localStorage.removeItem("teamflow_attendance");
        localStorage.setItem("teamflow_attendance_v4_reset", "true");
      } else if (savedAttendance) {
        try {
          const parsed = JSON.parse(savedAttendance);
          if (Array.isArray(parsed)) setAttendance(parsed);
        } catch {}
      }

      localStorage.removeItem("teamflow_user_clock_in");
      const hasResetToCheckedOut = localStorage.getItem("teamflow_clock_v3_reset");
      if (!hasResetToCheckedOut) {
        localStorage.removeItem("teamflow_user_clock_in_v2");
        localStorage.removeItem("teamflow_user_clock_in_v3");
        localStorage.setItem("teamflow_clock_v3_reset", "true");
        setUserClockInData(DEFAULT_CLOCK_IN_DATA);
      } else {
        const savedUserClockIn = localStorage.getItem("teamflow_user_clock_in_v3");
        if (savedUserClockIn) {
          try {
            const parsed = JSON.parse(savedUserClockIn);
            setUserClockInData(parsed);
          } catch {}
        }
      }
    } catch {
      // Fallback silently
    } finally {
      setHasHydrated(true);
    }
  }, []);

  // Fetch initial data from backend Neon PostgreSQL API
  const refreshFromBackend = useCallback(async () => {
    try {
      const [usersRes, projectsRes, tasksRes, attendanceRes, clockInRes, deptsRes, rewardsRes] = await Promise.all([
        fetch("/api/users").catch(() => null),
        fetch("/api/projects").catch(() => null),
        fetch("/api/tasks").catch(() => null),
        fetch("/api/attendance").catch(() => null),
        fetch("/api/clock-in").catch(() => null),
        fetch("/api/departments").catch(() => null),
        fetch("/api/rewards").catch(() => null),
      ]);

      if (usersRes && usersRes.ok) {
        const data = await usersRes.json();
        if (Array.isArray(data.users) && data.users.length > 0) {
          setUsers(data.users);
          try {
            localStorage.setItem("teamflow_users", JSON.stringify(data.users));
          } catch {}
        }
      }

      if (projectsRes && projectsRes.ok) {
        const data = await projectsRes.json();
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
        }
      }

      if (tasksRes && tasksRes.ok) {
        const data = await tasksRes.json();
        if (Array.isArray(data.tasks) && data.tasks.length > 0) {
          setTasks(data.tasks);
        }
      }

      if (attendanceRes && attendanceRes.ok) {
        const data = await attendanceRes.json();
        if (Array.isArray(data.attendance) && data.attendance.length > 0) {
          setAttendance(data.attendance);
        }
      }

      if (clockInRes && clockInRes.ok) {
        const data = await clockInRes.json();
        if (data.clockInData && Object.keys(data.clockInData).length > 0) {
          setUserClockInData(data.clockInData);
        }
      }

      if (deptsRes && deptsRes.ok) {
        const data = await deptsRes.json();
        if (Array.isArray(data.departments) && data.departments.length > 0) {
          setDepartments(data.departments);
        }
      }

      if (rewardsRes && rewardsRes.ok) {
        const data = await rewardsRes.json();
        if (Array.isArray(data.ledger)) {
          setRewardsLedger(data.ledger);
        }
      }
    } catch (err) {
      console.warn("Backend sync notice (using local state):", err);
    }
  }, []);

  useEffect(() => {
    refreshFromBackend();
  }, [refreshFromBackend]);

  // Synchronize with localStorage
  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem("teamflow_current_user", currentUserId);
      localStorage.setItem("teamflow_projects", JSON.stringify(projects));
      localStorage.setItem("teamflow_tasks", JSON.stringify(tasks));
      localStorage.setItem("teamflow_attendance", JSON.stringify(attendance));
      localStorage.setItem("teamflow_user_clock_in_v3", JSON.stringify(userClockInData));
    } catch {
      // ignore storage quota errors
    }
  }, [currentUserId, projects, tasks, attendance, userClockInData, hasHydrated]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
  };

  const updateUserProfile = (updates: Partial<User>) => {
    setUsers((prev) => {
      const nextUsers = prev.map((u) => {
        if (u.id === currentUserId) {
          const updated = { ...u, ...updates };
          fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
          }).catch((err) => console.warn("Failed to persist user profile:", err));
          return updated;
        }
        return u;
      });
      try {
        localStorage.setItem("teamflow_users", JSON.stringify(nextUsers));
      } catch {}
      return nextUsers;
    });
  };

  const createDepartment = async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const newDept = {
      id: `dept-${Date.now()}`,
      name: trimmed,
    };
    setDepartments((prev) => [...prev, newDept]);

    try {
      await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDept),
      });
      return true;
    } catch (err) {
      console.warn("Failed to create department on backend:", err);
      return false;
    }
  };

  const updateDepartment = async (id: string, name: string, oldName?: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    setDepartments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: trimmed } : d))
    );

    if (oldName && oldName !== trimmed) {
      setUsers((prev) =>
        prev.map((u) => (u.department === oldName ? { ...u, department: trimmed } : u))
      );
    }

    try {
      await fetch("/api/departments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: trimmed, oldName }),
      });
      return true;
    } catch (err) {
      console.warn("Failed to update department on backend:", err);
      return false;
    }
  };

  const deleteDepartment = async (id: string): Promise<boolean> => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    try {
      await fetch(`/api/departments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return true;
    } catch (err) {
      console.warn("Failed to delete department on backend:", err);
      return false;
    }
  };

  const addTeamMember = async (memberData: {
    fullName: string;
    email: string;
    role: "employer" | "project_manager";
    department?: string;
    jobTitle?: string;
    initialPassword?: string;
  }): Promise<User> => {
    const isPm = memberData.role === "project_manager";
    const timestamp = Date.now();
    const id = isPm ? `u-pm-${timestamp}` : `u-emp-${timestamp}`;
    const employeeId = isPm
      ? `TF-PM-${Math.floor(100 + Math.random() * 900)}`
      : `TF-EMP-${Math.floor(200 + Math.random() * 800)}`;
    const firstName = memberData.fullName.trim().split(" ")[0] || "Staff";
    const dept = isPm ? "Project Management" : memberData.department || "General";
    const title = memberData.jobTitle || (isPm ? "Project Manager" : dept);

    const avatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
    ];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newUser: User = {
      id,
      name: firstName,
      fullName: memberData.fullName.trim(),
      email: memberData.email.trim(),
      role: memberData.role,
      jobTitle: title,
      department: dept,
      avatar,
      phone: "+91 98" + Math.floor(10000000 + Math.random() * 90000000),
      location: "MaestroMinds Tech Hub",
      employeeId,
    };

    setUsers((prev) => [...prev, newUser]);

    setUserClockInData((prev) => ({
      ...prev,
      [newUser.id]: {
        isClockedIn: false,
        clockInTimestamp: null,
        clockInTimeString: null,
        clockOutTimeString: null,
        elapsedSeconds: 0,
      },
    }));

    // Persist to backend Neon PostgreSQL
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newUser,
        initialPassword: memberData.initialPassword,
      }),
    }).catch((err) => console.warn("Failed to persist new team member to database:", err));

    return newUser;
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Authentication failed." };
      }

      if (data.user) {
        setCurrentUserId(data.user.id);
        setUsers((prev) => {
          const exists = prev.some((u) => u.id === data.user.id);
          return exists ? prev.map((u) => (u.id === data.user.id ? data.user : u)) : [...prev, data.user];
        });
      }

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const awardRewardPoints = async (params: {
    userId: string;
    points: number;
    action: string;
    reason: string;
  }): Promise<boolean> => {
    const numericPoints = Math.max(1, Number(params.points) || 50);
    const newEntry: RewardLedgerEntry = {
      id: `rw-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: params.userId,
      points: numericPoints,
      action: params.action.trim() || "Performance Award",
      reason: params.reason.trim() || "Exemplary contribution to team initiatives",
      awardedById: currentUser.id,
      awardedByName: `${currentUser.fullName} (${currentUser.role === "ceo" ? "CEO" : "Project Manager"})`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    };

    setRewardsLedger((prev) => [newEntry, ...prev]);

    try {
      await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
      return true;
    } catch (err) {
      console.warn("Failed to persist reward to backend:", err);
      return false;
    }
  };

  const createProject = (projectData: {
    name: string;
    code?: string;
    description: string;
    projectManagerId: string;
    teamLeadId: string;
    teamMemberIds: string[];
    priority: "High" | "Medium" | "Low";
    deadline: string;
    category: string;
    budget?: string;
  }): Project => {
    const fallbackCode = `PRJ-${String(projects.length + 1).padStart(2, "0")}`;
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectData.name,
      code: (projectData.code || fallbackCode).toUpperCase(),
      description: projectData.description,
      projectManagerId: projectData.projectManagerId,
      teamLeadId: projectData.teamLeadId,
      teamMemberIds: Array.from(new Set([...projectData.teamMemberIds, projectData.teamLeadId])),
      status: "In Progress",
      priority: projectData.priority,
      startDate: new Date().toISOString().split("T")[0],
      deadline: projectData.deadline,
      category: projectData.category || "General",
      budget: projectData.budget || "$50,000"
    };

    setProjects((prev) => [newProject, ...prev]);

    // Async backend persist to Neon Postgres
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProject),
    }).catch((err) => console.warn("Failed to persist project to backend:", err));

    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const { code: _ignoredCode, ...safeUpdates } = updates;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...safeUpdates };
          if (safeUpdates.teamLeadId && !updated.teamMemberIds.includes(safeUpdates.teamLeadId)) {
            updated.teamMemberIds = [...updated.teamMemberIds, safeUpdates.teamLeadId];
          }
          return updated;
        }
        return p;
      })
    );

    // Async backend update to Neon Postgres
    fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(safeUpdates),
    }).catch((err) => console.warn("Failed to update project on backend:", err));
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));

    // Async backend delete
    fetch(`/api/projects/${id}`, {
      method: "DELETE",
    }).catch((err) => console.warn("Failed to delete project on backend:", err));
  };

  const createTask = (taskData: {
    projectId: string;
    title: string;
    description: string;
    assignedTo: string;
    priority: "High" | "Medium" | "Low";
    deadline: string;
    status?: "To Do" | "In Progress" | "Review" | "Completed";
  }): Task => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId: taskData.projectId,
      title: taskData.title,
      description: taskData.description,
      assignedTo: taskData.assignedTo,
      assignedBy: currentUser.id,
      priority: taskData.priority,
      status: taskData.status || "To Do",
      deadline: taskData.deadline,
      progress: taskData.status === "Completed" ? 100 : taskData.status === "Review" ? 90 : 15,
      attachments: [],
      activity: [
        {
          id: `act-${Date.now()}`,
          title: `Task created by ${currentUser.fullName}`,
          detail: `Assigned to ${users.find((u) => u.id === taskData.assignedTo)?.fullName || "Team Member"}`,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        }
      ]
    };

    setTasks((prev) => [newTask, ...prev]);

    // Async backend persist to Neon Postgres
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    }).catch((err) => console.warn("Failed to persist task to backend:", err));

    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          if (updates.status === "Completed") {
            updated.progress = 100;
          }
          if (updates.status && updates.status !== t.status) {
            updated.activity = [
              {
                id: `act-${Date.now()}`,
                title: `Status changed to ${updates.status}`,
                detail: `Updated by ${currentUser.fullName}`,
                date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              },
              ...updated.activity
            ];
          }
          return updated;
        }
        return t;
      })
    );

    // Async backend update to Neon Postgres
    fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updates,
        updatedByName: currentUser.fullName,
      }),
    }).catch((err) => console.warn("Failed to update task on backend:", err));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));

    // Async backend delete
    fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    }).catch((err) => console.warn("Failed to delete task on backend:", err));
  };

  const uploadTaskMedia = async (
    taskId: string,
    file: {
      name: string;
      size: string;
      type: "image" | "pdf" | "figma" | "zip" | "doc";
      url?: string;
      rawFile?: File | null;
    }
  ) => {
    const attachmentId = `att-${Date.now()}`;
    const initialUrl =
      file.url ||
      (file.type === "image"
        ? "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80"
        : "#");

    const newAttachment: TaskAttachment = {
      id: attachmentId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: initialUrl,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.fullName,
      uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };

    const newActivityItem = {
      id: `act-${Date.now()}`,
      title: `Deliverable uploaded: ${file.name}`,
      detail: `Uploaded by ${currentUser.fullName}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };

    // Optimistically update frontend state
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            attachments: [newAttachment, ...t.attachments],
            activity: [newActivityItem, ...t.activity]
          };
        }
        return t;
      })
    );

    // If a physical file was provided, upload to Cloudinary via backend /api/upload
    if (file.rawFile) {
      try {
        const formData = new FormData();
        formData.append("file", file.rawFile);
        formData.append("taskId", taskId);
        formData.append("name", file.name);
        formData.append("uploadedBy", currentUser.id);
        formData.append("uploadedByName", currentUser.fullName);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData?.attachment?.url) {
            const finalUrl = uploadData.attachment.url;
            // Update attachment with genuine Cloudinary secure URL
            setTasks((prev) =>
              prev.map((t) => {
                if (t.id === taskId) {
                  return {
                    ...t,
                    attachments: t.attachments.map((att) =>
                      att.id === attachmentId ? { ...att, url: finalUrl } : att
                    ),
                  };
                }
                return t;
              })
            );
          }
        }
      } catch (uploadErr) {
        console.warn("Could not upload to Cloudinary backend:", uploadErr);
      }
    } else {
      // No raw file, sync updated attachments directly to backend
      const targetTask = tasks.find((t) => t.id === taskId);
      if (targetTask) {
        fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attachments: [newAttachment, ...targetTask.attachments],
            activity: [newActivityItem, ...targetTask.activity],
            updatedByName: currentUser.fullName,
          }),
        }).catch((err) => console.warn("Failed to sync media to backend:", err));
      }
    }
  };

  const checkAndHandleMidnightRollover = useCallback(() => {
    const now = new Date();
    const todayString = getLocalDateString(now);
    const midnightTimestamp = getStartOfTodayTimestamp(now);

    setUserClockInData((prevData) => {
      let hasChanges = false;
      const nextData = { ...prevData };

      Object.entries(prevData).forEach(([userId, state]) => {
        if (state.isClockedIn && state.clockInDate && state.clockInDate !== todayString) {
          hasChanges = true;
          const targetUser = users.find((u) => u.id === userId);
          const previousClockInTimestamp = state.clockInTimestamp || (midnightTimestamp - 1000);
          const secondsBeforeMidnight = Math.max(
            1,
            Math.floor((midnightTimestamp - previousClockInTimestamp) / 1000)
          );
          const totalDay1Seconds = (state.elapsedSeconds || 0) + secondsBeforeMidnight;
          const day1Duration = formatSecondsToDuration(totalDay1Seconds);

          // Close previous day record at midnight
          const prevDate = state.clockInDate;
          setAttendance((prevAtt) => {
            const existingYesterday = prevAtt.find((r) => r.userId === userId && r.date === prevDate);
            let updatedList = [...prevAtt];
            if (existingYesterday) {
              const closedYesterday: AttendanceRecord = {
                ...existingYesterday,
                clockOut: "12:00 AM",
                duration: day1Duration,
                status: "Checked Out",
              };
              updatedList = updatedList.map((r) => (r.id === existingYesterday.id ? closedYesterday : r));
              fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(closedYesterday),
              }).catch(() => null);
            }

            // Create Day 2 record starting at 12:00 AM
            const existingToday = updatedList.find((r) => r.userId === userId && r.date === todayString);
            if (!existingToday && targetUser) {
              const newTodayRecord: AttendanceRecord = {
                id: `att-rec-${Date.now()}-${userId}`,
                userId: targetUser.id,
                userName: targetUser.fullName,
                userRole: targetUser.role,
                department: targetUser.department,
                date: todayString,
                clockIn: "12:00 AM",
                clockOut: "—",
                duration: "00h 00m 01s",
                status: "Present",
              };
              updatedList = [newTodayRecord, ...updatedList];
              fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTodayRecord),
              }).catch(() => null);
            }

            return updatedList;
          });

          // Rollover user state for today starting from 12:00 AM
          const secondsSinceMidnight = Math.max(0, Math.floor((Date.now() - midnightTimestamp) / 1000));
          const rolledState: UserClockInState = {
            isClockedIn: true,
            clockInTimestamp: midnightTimestamp,
            clockInTimeString: "12:00 AM",
            clockOutTimeString: null,
            elapsedSeconds: secondsSinceMidnight,
            clockInDate: todayString,
          };
          nextData[userId] = rolledState;

          fetch("/api/clock-in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, ...rolledState }),
          }).catch(() => null);
        }
      });

      return hasChanges ? nextData : prevData;
    });
  }, [users]);

  useEffect(() => {
    checkAndHandleMidnightRollover();
    const interval = setInterval(checkAndHandleMidnightRollover, 5000);
    return () => clearInterval(interval);
  }, [checkAndHandleMidnightRollover]);

  const toggleUserClockIn = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const userState = userClockInData[userId] || {
      isClockedIn: false,
      clockInTimestamp: null,
      clockInTimeString: null,
      clockOutTimeString: null,
      elapsedSeconds: 0
    };

    const nextClockedIn = !userState.isClockedIn;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const todayString = getLocalDateString(now);

    let nextState: UserClockInState;

    if (nextClockedIn) {
      const prevElapsedToday = userState.clockInDate === todayString ? (userState.elapsedSeconds || 0) : 0;
      nextState = {
        isClockedIn: true,
        clockInTimestamp: Date.now(),
        clockInTimeString: timeString,
        clockOutTimeString: null,
        elapsedSeconds: prevElapsedToday,
        clockInDate: todayString,
      };

      setAttendance((prev) => {
        const existingToday = prev.find((r) => r.userId === userId && r.date === todayString);
        if (existingToday) {
          const updatedRecord: AttendanceRecord = {
            ...existingToday,
            clockIn: existingToday.clockIn && existingToday.clockIn !== "—" ? existingToday.clockIn : timeString,
            clockOut: "—",
            status: "Present"
          };
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedRecord),
          }).catch(() => null);
          return prev.map((r) => (r.id === existingToday.id ? updatedRecord : r));
        } else {
          const newRecord: AttendanceRecord = {
            id: `att-rec-${Date.now()}-${userId}`,
            userId: targetUser.id,
            userName: targetUser.fullName,
            userRole: targetUser.role,
            department: targetUser.department,
            date: todayString,
            clockIn: timeString,
            clockOut: "—",
            duration: "00h 00m 01s",
            status: "Present"
          };
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRecord),
          }).catch(() => null);
          return [newRecord, ...prev];
        }
      });
    } else {
      // Clock out
      const clockInDate = userState.clockInDate || todayString;
      if (clockInDate !== todayString && userState.clockInTimestamp) {
        // Crossed midnight! Day 1 is closed at 12:00 AM, Day 2 has duration from midnight to now
        const midnightToday = getStartOfTodayTimestamp(now);
        const day1Seconds = Math.max(0, Math.floor((midnightToday - userState.clockInTimestamp) / 1000));
        const day1Duration = formatSecondsToDuration(day1Seconds);

        // Close Day 1 record
        setAttendance((prev) => {
          const prevRec = prev.find((r) => r.userId === userId && r.date === clockInDate);
          if (prevRec) {
            const closedPrev: AttendanceRecord = {
              ...prevRec,
              clockOut: "12:00 AM",
              duration: day1Duration,
              status: "Checked Out",
            };
            fetch("/api/attendance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(closedPrev),
            }).catch(() => null);
            return prev.map((r) => (r.id === prevRec.id ? closedPrev : r));
          }
          return prev;
        });

        const todaySeconds = Math.max(1, Math.floor((Date.now() - midnightToday) / 1000));
        const todayDuration = formatSecondsToDuration(todaySeconds);

        nextState = {
          isClockedIn: false,
          clockInTimestamp: null,
          clockInTimeString: "12:00 AM",
          clockOutTimeString: timeString,
          elapsedSeconds: todaySeconds,
          clockInDate: todayString,
        };

        setAttendance((prev) => {
          const existingToday = prev.find((r) => r.userId === userId && r.date === todayString);
          const closedToday: AttendanceRecord = {
            id: existingToday ? existingToday.id : `att-rec-${Date.now()}-${userId}`,
            userId: targetUser.id,
            userName: targetUser.fullName,
            userRole: targetUser.role,
            department: targetUser.department,
            date: todayString,
            clockIn: "12:00 AM",
            clockOut: timeString,
            duration: todayDuration,
            status: "Checked Out",
          };
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(closedToday),
          }).catch(() => null);
          return existingToday ? prev.map((r) => (r.id === existingToday.id ? closedToday : r)) : [closedToday, ...prev];
        });
      } else {
        // Same-day check out
        const sessionSeconds = userState.clockInTimestamp
          ? Math.max(1, Math.floor((Date.now() - userState.clockInTimestamp) / 1000))
          : 0;
        const totalElapsed = (userState.elapsedSeconds || 0) + sessionSeconds;
        const formattedDuration = formatSecondsToDuration(totalElapsed);

        nextState = {
          isClockedIn: false,
          clockInTimestamp: null,
          clockInTimeString: userState.clockInTimeString || timeString,
          clockOutTimeString: timeString,
          elapsedSeconds: totalElapsed,
          clockInDate: todayString,
        };

        setAttendance((prev) => {
          const existingToday = prev.find((r) => r.userId === userId && r.date === todayString);
          if (existingToday) {
            const updatedRecord: AttendanceRecord = {
              ...existingToday,
              clockOut: timeString,
              duration: formattedDuration,
              status: "Checked Out",
            };
            fetch("/api/attendance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedRecord),
            }).catch(() => null);
            return prev.map((r) => (r.id === existingToday.id ? updatedRecord : r));
          } else {
            const newRecord: AttendanceRecord = {
              id: `att-rec-${Date.now()}-${userId}`,
              userId: targetUser.id,
              userName: targetUser.fullName,
              userRole: targetUser.role,
              department: targetUser.department,
              date: todayString,
              clockIn: userState.clockInTimeString || timeString,
              clockOut: timeString,
              duration: formattedDuration,
              status: "Checked Out",
            };
            fetch("/api/attendance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newRecord),
            }).catch(() => null);
            return [newRecord, ...prev];
          }
        });
      }
    }

    setUserClockInData((prev) => ({
      ...prev,
      [userId]: nextState
    }));

    // Async persist clock-in status to Neon Postgres
    fetch("/api/clock-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        ...nextState,
      }),
    }).catch((err) => console.warn("Failed to persist clock-in to backend:", err));
  };

  const currentUserClockIn: UserClockInState = userClockInData[currentUserId] || {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0
  };

  const isClockedIn = currentUserClockIn.isClockedIn;

  const toggleClockInOut = () => {
    toggleUserClockIn(currentUserId);
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter((t) => t.projectId === projectId);
  };

  const getUserAssignedTasks = (userId: string, projectId?: string) => {
    return tasks.filter((t) => {
      const matchesUser = t.assignedTo === userId;
      if (projectId) return matchesUser && t.projectId === projectId;
      return matchesUser;
    });
  };

  const getProjectTeamLead = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return undefined;
    return users.find((u) => u.id === project.teamLeadId);
  };

  const getProjectManager = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return undefined;
    return users.find((u) => u.id === project.projectManagerId);
  };

  const isUserTeamLead = (userId: string, projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return false;
    return project.teamLeadId === userId;
  };

  const getAllMedia = () => {
    const list: Array<TaskAttachment & { projectTitle: string; taskTitle: string; projectId: string }> = [];
    tasks.forEach((t) => {
      const proj = projects.find((p) => p.id === t.projectId);
      t.attachments.forEach((att) => {
        list.push({
          ...att,
          projectTitle: proj ? proj.name : "Unknown Project",
          taskTitle: t.title,
          projectId: t.projectId
        });
      });
    });
    return list;
  };

  const getProjectMedia = (projectId: string) => {
    const list: Array<TaskAttachment & { taskTitle: string }> = [];
    tasks
      .filter((t) => t.projectId === projectId)
      .forEach((t) => {
        t.attachments.forEach((att) => {
          list.push({
            ...att,
            taskTitle: t.title
          });
        });
      });
    return list;
  };

  return (
    <TeamFlowContext.Provider
      value={{
        currentUser,
        users,
        projects,
        tasks,
        attendance,
        userClockInData,
        currentUserClockIn,
        setCurrentUserId,
        updateUserProfile,
        createProject,
        updateProject,
        deleteProject,
        createTask,
        updateTask,
        deleteTask,
        uploadTaskMedia,
        toggleClockInOut,
        toggleUserClockIn,
        isClockedIn,
        getProjectTasks,
        getUserAssignedTasks,
        getProjectTeamLead,
        getProjectManager,
        isUserTeamLead,
        getAllMedia,
        getProjectMedia,
        departments,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        addTeamMember,
        login,
        logout,
        rewardsLedger,
        awardRewardPoints
      }}
    >
      {children}
    </TeamFlowContext.Provider>
  );
}

export function useTeamFlow() {
  const context = useContext(TeamFlowContext);
  if (!context) {
    throw new Error("useTeamFlow must be used within a TeamFlowProvider");
  }
  return context;
}
