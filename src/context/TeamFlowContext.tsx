"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  User,
  Project,
  Task,
  TaskAttachment,
  AttendanceRecord,
  PunchSession,
  LeaveRequest,
  ProjectCategory,
  DEFAULT_PROJECT_CATEGORIES,
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
  sessions?: PunchSession[];
}

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const curr = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, "0");
    const d = String(curr.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates.length > 0 ? dates : [startStr];
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
  deleteUser: (id: string) => Promise<boolean>;
  createProject: (projectData: {
    name: string;
    code?: string;
    description: string;
    projectManagerId: string;
    teamLeadId: string;
    teamMemberIds: string[];
    priority: "High" | "Medium" | "Low";
    startDate?: string;
    deadline: string;
    category: string;
    budget?: string;
    status?: "Planning" | "In Progress" | "In Review" | "Completed";
  }) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createTask: (taskData: {
    projectId: string;
    title: string;
    description: string;
    assignedTo: string;
    priority: "High" | "Medium" | "Low";
    startDate?: string;
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
  jobRoles: { id: string; name: string }[];
  createJobRole: (name: string) => Promise<boolean>;
  updateJobRole: (id: string, name: string, oldName?: string) => Promise<boolean>;
  deleteJobRole: (id: string) => Promise<boolean>;
  categories: ProjectCategory[];
  createCategory: (name: string, description?: string) => Promise<boolean>;
  updateCategory: (id: string, name: string, oldName?: string, description?: string) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  departments: { id: string; name: string }[];
  createDepartment: (name: string) => Promise<boolean>;
  updateDepartment: (id: string, name: string, oldName?: string) => Promise<boolean>;
  deleteDepartment: (id: string) => Promise<boolean>;
  addTeamMember: (userData: {
    fullName: string;
    email: string;
    role: "employer" | "project_manager";
    jobTitle?: string;
    department?: string;
    initialPassword?: string;
  }) => Promise<User>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  rewardsLedger: RewardLedgerEntry[];
  hasHydrated: boolean;
  awardRewardPoints: (params: {
    userId: string;
    points: number;
    action: string;
    reason: string;
  }) => Promise<boolean>;
  leaveRequests: LeaveRequest[];
  applyLeave: (params: {
    userId: string;
    startDate: string;
    endDate?: string;
    leaveType: string;
    reason?: string;
    status?: "Pending" | "Approved";
  }) => Promise<{ success: boolean; error?: string }>;
  reviewLeaveRequest: (id: string, status: "Approved" | "Rejected") => Promise<boolean>;
}

const TeamFlowContext = createContext<TeamFlowContextType | undefined>(undefined);

const DEFAULT_JOB_ROLES: { id: string; name: string }[] = [
  { id: "role-ui-ux-designer", name: "UI/UX Designer" },
  { id: "role-software-developer", name: "Software Developer" },
  { id: "role-junior-software-developer", name: "Junior Software Developer" },
  { id: "role-ai-engineer", name: "AI Engineer" },
  { id: "role-project-manager", name: "Project Manager" },
];

const EMPTY_FALLBACK_USER: User = {
  id: "",
  name: "",
  fullName: "",
  email: "",
  role: "employer",
  jobTitle: "",
  avatar: "",
  phone: "",
  employeeId: "",
};

export function sanitizeUserData(u: User): User {
  const hasDummyAvatar =
    u.avatar &&
    (u.avatar.includes("images.unsplash.com") ||
     u.avatar.includes("/avatars/marcus.jpg") ||
     u.avatar.includes("/avatars/ajay.jpg"));
  const hasDummyPhone =
    u.phone &&
    (u.phone.includes("555") ||
     u.phone === "+91 9834724461");
  const hasDummyBio =
    u.bio &&
    (u.bio.toLowerCase().includes("dummy") ||
     u.bio.toLowerCase().includes("lorem ipsum"));

  return {
    ...u,
    avatar: hasDummyAvatar ? "" : (u.avatar || ""),
    phone: hasDummyPhone ? "" : (u.phone || ""),
    bio: hasDummyBio ? "" : (u.bio || ""),
  };
}

export function TeamFlowProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedUsers = localStorage.getItem("teamflow_users");
        if (savedUsers) {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(sanitizeUserData);
          }
        }
      } catch {}
    }
    return INITIAL_USERS;
  });
  const [currentUserId, setCurrentUserIdState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("teamflow_current_user") || "";
      } catch {}
    }
    return "";
  });
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS_DATA);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_DATA);
  const [userClockInData, setUserClockInData] = useState<Record<string, UserClockInState>>(DEFAULT_CLOCK_IN_DATA);
  const [jobRoles, setJobRoles] = useState<{ id: string; name: string }[]>(DEFAULT_JOB_ROLES);
  const departments = jobRoles;
  const setDepartments = setJobRoles;
  const [categories, setCategories] = useState<ProjectCategory[]>(DEFAULT_PROJECT_CATEGORIES);
  const [rewardsLedger, setRewardsLedger] = useState<RewardLedgerEntry[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("teamflow_current_user");
      const savedProjects = localStorage.getItem("teamflow_projects");
      const savedTasks = localStorage.getItem("teamflow_tasks");
      const savedAttendance = localStorage.getItem("teamflow_attendance");

      if (savedUser) {
        setCurrentUserIdState(savedUser);
      }

      const savedUsers = localStorage.getItem("teamflow_users");
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUsers(parsed.map(sanitizeUserData));
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

      const savedCategories = localStorage.getItem("teamflow_categories");
      if (savedCategories) {
        try {
          const parsed = JSON.parse(savedCategories);
          if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
        } catch {}
      }

      const hasAttendanceCleaned = localStorage.getItem("teamflow_attendance_v4_reset");
      if (!hasAttendanceCleaned) {
        localStorage.removeItem("teamflow_attendance");
        localStorage.setItem("teamflow_attendance_v4_reset", "true");
      } else if (savedAttendance) {
        try {
          const parsed = JSON.parse(savedAttendance);
          if (Array.isArray(parsed)) {
            const seen = new Set<string>();
            const deduped = parsed.filter((r: AttendanceRecord) => {
              const k = `${r.userId}-${r.date}`;
              if (seen.has(k)) return false;
              seen.add(k);
              return true;
            });
            setAttendance(deduped);
          }
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

  const refreshFromBackend = useCallback(async () => {
    try {
      const [usersRes, projectsRes, tasksRes, attendanceRes, clockInRes, deptsRes, rewardsRes, meRes, leavesRes, categoriesRes] = await Promise.all([
        fetch("/api/users").catch(() => null),
        fetch("/api/projects").catch(() => null),
        fetch("/api/tasks").catch(() => null),
        fetch("/api/attendance").catch(() => null),
        fetch("/api/clock-in").catch(() => null),
        fetch("/api/job-roles").catch(() => null),
        fetch("/api/rewards").catch(() => null),
        fetch("/api/auth/me").catch(() => null),
        fetch("/api/leaves").catch(() => null),
        fetch("/api/categories").catch(() => null),
      ]);

      if (usersRes && usersRes.ok) {
        const data = await usersRes.json();
        if (Array.isArray(data.users)) {
          const sanitized = data.users.map(sanitizeUserData);
          setUsers(sanitized);
          try {
            localStorage.setItem("teamflow_users", JSON.stringify(sanitized));
          } catch {}
        }
      }

      if (projectsRes && projectsRes.ok) {
        const data = await projectsRes.json();
        if (Array.isArray(data.projects)) {
          setProjects(data.projects);
        }
      }

      if (tasksRes && tasksRes.ok) {
        const data = await tasksRes.json();
        if (Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        }
      }

      if (attendanceRes && attendanceRes.ok) {
        const data = await attendanceRes.json();
        if (Array.isArray(data.attendance)) {
          setAttendance(data.attendance);
        }
      }

      if (clockInRes && clockInRes.ok) {
        const data = await clockInRes.json();
        if (data.clockInData) {
          setUserClockInData(data.clockInData);
        }
      }

      if (deptsRes && deptsRes.ok) {
        const data = await deptsRes.json();
        const list = data.jobRoles || data.departments;
        if (Array.isArray(list) && list.length > 0) {
          setJobRoles(list);
        }
      }

      if (rewardsRes && rewardsRes.ok) {
        const data = await rewardsRes.json();
        if (Array.isArray(data.ledger)) {
          setRewardsLedger(data.ledger);
        }
      }

      if (leavesRes && leavesRes.ok) {
        const data = await leavesRes.json();
        if (Array.isArray(data.leaveRequests)) {
          setLeaveRequests(data.leaveRequests);
        }
      }

      if (categoriesRes && categoriesRes.ok) {
        const data = await categoriesRes.json();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      }

      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        if (meData?.user?.id) {
          const sanitized = sanitizeUserData(meData.user);
          setCurrentUserIdState(sanitized.id);
          try {
            localStorage.setItem("teamflow_current_user", sanitized.id);
          } catch {}
          setUsers((prev) => {
            const exists = prev.some((u) => u.id === sanitized.id);
            return exists
              ? prev.map((u) => (u.id === sanitized.id ? { ...u, ...sanitized } : u))
              : [sanitized, ...prev];
          });
        }
      }
    } catch (err) {
      console.warn("Backend sync notice (using local state):", err);
    }
  }, []);

  useEffect(() => {
    refreshFromBackend();
  }, [refreshFromBackend]);

  useEffect(() => {
    if (!hasHydrated || !currentUserId) return;
    try {
      localStorage.setItem("teamflow_current_user", currentUserId);
      localStorage.setItem("teamflow_projects", JSON.stringify(projects));
      localStorage.setItem("teamflow_tasks", JSON.stringify(tasks));
      localStorage.setItem("teamflow_attendance", JSON.stringify(attendance));
      localStorage.setItem("teamflow_user_clock_in_v3", JSON.stringify(userClockInData));
      localStorage.setItem("teamflow_categories", JSON.stringify(categories));
    } catch {}
  }, [currentUserId, projects, tasks, attendance, userClockInData, categories, hasHydrated]);

  const currentUser: User =
    users.find((u) => u.id === currentUserId) ||
    (currentUserId
      ? { ...EMPTY_FALLBACK_USER, id: currentUserId }
      : users[0] || INITIAL_USERS[0] || EMPTY_FALLBACK_USER);

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

  const createJobRole = async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const newRole = {
      id: `role-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      name: trimmed,
    };
    setJobRoles((prev) => [...prev, newRole]);

    try {
      await fetch("/api/job-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole),
      });
      return true;
    } catch (err) {
      console.warn("Failed to create job role on backend:", err);
      return false;
    }
  };

  const updateJobRole = async (id: string, name: string, oldName?: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    setJobRoles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: trimmed } : r))
    );

    if (oldName && oldName !== trimmed) {
      setUsers((prev) =>
        prev.map((u) => (u.jobTitle === oldName ? { ...u, jobTitle: trimmed } : u))
      );
    }

    try {
      await fetch("/api/job-roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: trimmed, oldName }),
      });
      return true;
    } catch (err) {
      console.warn("Failed to update job role on backend:", err);
      return false;
    }
  };

  const deleteJobRole = async (id: string): Promise<boolean> => {
    setJobRoles((prev) => prev.filter((r) => r.id !== id));
    try {
      await fetch(`/api/job-roles?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return true;
    } catch (err) {
      console.warn("Failed to delete job role on backend:", err);
      return false;
    }
  };

  const createCategory = async (name: string, description?: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const newCat: ProjectCategory = {
      id: `cat-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      name: trimmed,
      description: description?.trim() || "",
      projectCount: 0,
    };
    setCategories((prev) => [...prev, newCat]);

    try {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCat),
      });
      return true;
    } catch (err) {
      console.warn("Failed to create category on backend:", err);
      return false;
    }
  };

  const updateCategory = async (id: string, name: string, oldName?: string, description?: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: trimmed, description: description !== undefined ? description : c.description } : c))
    );

    if (oldName && oldName !== trimmed) {
      setProjects((prev) =>
        prev.map((p) => (p.category.toLowerCase() === oldName.toLowerCase() ? { ...p, category: trimmed } : p))
      );
    }

    try {
      await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: trimmed, oldName, description }),
      });
      return true;
    } catch (err) {
      console.warn("Failed to update category on backend:", err);
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return true;
    } catch (err) {
      console.warn("Failed to delete category on backend:", err);
      return false;
    }
  };

  const createDepartment = createJobRole;
  const updateDepartment = updateJobRole;
  const deleteDepartment = deleteJobRole;

  const deleteUser = async (id: string): Promise<boolean> => {
    if (id === "u-ceo-1") return false;
    setUsers((prev) => {
      const nextUsers = prev.filter((u) => u.id !== id);
      try {
        localStorage.setItem("teamflow_users", JSON.stringify(nextUsers));
      } catch {}
      return nextUsers;
    });

    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (err) {
      console.warn("Failed to delete user on backend:", err);
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
    const title = memberData.jobTitle || memberData.department || (isPm ? "Project Manager" : "Software Developer");

    const newUser: User = {
      id,
      name: firstName,
      fullName: memberData.fullName.trim(),
      email: memberData.email.trim(),
      role: memberData.role,
      jobTitle: title,
      avatar: "",
      phone: "",
      employeeId,
      bio: "",
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
    } catch {}
    try {
      localStorage.removeItem("teamflow_current_user");
    } catch {}
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
    startDate?: string;
    deadline: string;
    category: string;
    budget?: string;
    status?: "Planning" | "In Progress" | "In Review" | "Completed";
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
      status: projectData.status || "In Progress",
      priority: projectData.priority,
      startDate: projectData.startDate || new Date().toISOString().split("T")[0],
      deadline: projectData.deadline,
      category: projectData.category || "General",
      budget: projectData.budget || "$50,000"
    };

    setProjects((prev) => [newProject, ...prev]);

    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProject),
    }).catch((err) => console.warn("Failed to persist project to backend:", err));

    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    if (updates.status === "Planning") {
      const hasCompleted = tasks.some((t) => t.projectId === id && t.status === "Completed");
      if (hasCompleted) {
        console.warn("Cannot change project status to Planning because one or more tasks have already been completed.");
        return;
      }
    }
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

    fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(safeUpdates),
    }).catch((err) => console.warn("Failed to update project on backend:", err));
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));

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
    startDate?: string;
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

            const existingToday = updatedList.find((r) => r.userId === userId && r.date === todayString);
            const initialTodaySessions: PunchSession[] = [
              {
                sessionNumber: 1,
                clockIn: "12:00 AM",
                clockOut: null,
                duration: undefined,
                elapsedSeconds: 0,
              },
            ];

            if (!existingToday && targetUser) {
              const newTodayRecord: AttendanceRecord = {
                id: `att-rec-${Date.now()}-${userId}`,
                userId: targetUser.id,
                userName: targetUser.fullName,
                userRole: targetUser.role,
                date: todayString,
                clockIn: "12:00 AM",
                clockOut: "—",
                duration: "00h 00m 01s",
                status: "Present",
                sessions: initialTodaySessions,
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

          const rolledState: UserClockInState = {
            isClockedIn: true,
            clockInTimestamp: midnightTimestamp,
            clockInTimeString: "12:00 AM",
            clockOutTimeString: null,
            elapsedSeconds: 0,
            clockInDate: todayString,
            sessions: [
              {
                sessionNumber: 1,
                clockIn: "12:00 AM",
                clockOut: null,
                duration: undefined,
                elapsedSeconds: 0,
              },
            ],
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
      const isSameDay = userState.clockInDate === todayString;
      const prevElapsedToday = isSameDay ? (userState.elapsedSeconds || 0) : 0;
      const existingSessions: PunchSession[] = (isSameDay && userState.sessions) ? [...userState.sessions] : [];
      const newSession: PunchSession = {
        sessionNumber: existingSessions.length + 1,
        clockIn: timeString,
        clockOut: null,
        duration: undefined,
        elapsedSeconds: 0,
      };
      const updatedSessions = [...existingSessions, newSession];

      nextState = {
        isClockedIn: true,
        clockInTimestamp: Date.now(),
        clockInTimeString: isSameDay && userState.clockInTimeString ? userState.clockInTimeString : timeString,
        clockOutTimeString: null,
        elapsedSeconds: prevElapsedToday,
        clockInDate: todayString,
        sessions: updatedSessions,
      };

      setAttendance((prev) => {
        const existingToday = prev.find((r) => r.userId === userId && r.date === todayString);
        if (existingToday) {
          const updatedRecord: AttendanceRecord = {
            ...existingToday,
            clockIn: existingToday.clockIn && existingToday.clockIn !== "—" ? existingToday.clockIn : timeString,
            clockOut: "—",
            status: "Present",
            sessions: updatedSessions,
          };
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedRecord),
          }).catch(() => null);
          return prev.map((r) => (r.id === existingToday.id ? updatedRecord : r));
        } else {
          const newRecord: AttendanceRecord = {
            id: `att-${userId}-${todayString}`,
            userId: targetUser.id,
            userName: targetUser.fullName,
            userRole: targetUser.role,
            date: todayString,
            clockIn: timeString,
            clockOut: "—",
            duration: "00h 00m 01s",
            status: "Present",
            sessions: updatedSessions,
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
      const clockInDate = userState.clockInDate || todayString;
      if (clockInDate !== todayString && userState.clockInTimestamp) {
        const midnightToday = getStartOfTodayTimestamp(now);
        const day1Seconds = Math.max(0, Math.floor((midnightToday - userState.clockInTimestamp) / 1000));
        const totalDay1Seconds = (userState.elapsedSeconds || 0) + day1Seconds;
        const day1Duration = formatSecondsToDuration(totalDay1Seconds);

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
        const todaySessions: PunchSession[] = [
          {
            sessionNumber: 1,
            clockIn: "12:00 AM",
            clockOut: timeString,
            duration: todayDuration,
            elapsedSeconds: todaySeconds,
          },
        ];

        nextState = {
          isClockedIn: false,
          clockInTimestamp: null,
          clockInTimeString: "12:00 AM",
          clockOutTimeString: timeString,
          elapsedSeconds: todaySeconds,
          clockInDate: todayString,
          sessions: todaySessions,
        };

        setAttendance((prev) => {
          const existingToday = prev.find((r) => r.userId === userId && r.date === todayString);
          const closedToday: AttendanceRecord = {
            id: existingToday ? existingToday.id : `att-rec-${Date.now()}-${userId}`,
            userId: targetUser.id,
            userName: targetUser.fullName,
            userRole: targetUser.role,
            date: todayString,
            clockIn: "12:00 AM",
            clockOut: timeString,
            duration: todayDuration,
            status: "Checked Out",
            sessions: todaySessions,
          };
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(closedToday),
          }).catch(() => null);
          return existingToday ? prev.map((r) => (r.id === existingToday.id ? closedToday : r)) : [closedToday, ...prev];
        });
      } else {
        const sessionSeconds = userState.clockInTimestamp
          ? Math.max(1, Math.floor((Date.now() - userState.clockInTimestamp) / 1000))
          : 0;
        const totalElapsed = (userState.elapsedSeconds || 0) + sessionSeconds;
        const formattedDuration = formatSecondsToDuration(totalElapsed);

        const currentSessions: PunchSession[] = (userState.sessions && userState.sessions.length > 0)
          ? userState.sessions.map((s, idx) => {
              if (idx === userState.sessions!.length - 1) {
                return {
                  ...s,
                  clockOut: timeString,
                  duration: formatSecondsToDuration(sessionSeconds),
                  elapsedSeconds: sessionSeconds,
                };
              }
              return s;
            })
          : [
              {
                sessionNumber: 1,
                clockIn: userState.clockInTimeString || timeString,
                clockOut: timeString,
                duration: formattedDuration,
                elapsedSeconds: totalElapsed,
              },
            ];

        nextState = {
          isClockedIn: false,
          clockInTimestamp: null,
          clockInTimeString: userState.clockInTimeString || timeString,
          clockOutTimeString: timeString,
          elapsedSeconds: totalElapsed,
          clockInDate: todayString,
          sessions: currentSessions,
        };

        setAttendance((prev) => {
          const existingToday = prev.find((r) => r.userId === userId && r.date === todayString);
          if (existingToday) {
            const updatedRecord: AttendanceRecord = {
              ...existingToday,
              clockOut: timeString,
              duration: formattedDuration,
              status: "Checked Out",
              sessions: currentSessions,
            };
            fetch("/api/attendance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedRecord),
            }).catch(() => null);
            return prev.map((r) => (r.id === existingToday.id ? updatedRecord : r));
          } else {
            const newRecord: AttendanceRecord = {
              id: `att-${userId}-${todayString}`,
              userId: targetUser.id,
              userName: targetUser.fullName,
              userRole: targetUser.role,
              date: todayString,
              clockIn: userState.clockInTimeString || timeString,
              clockOut: timeString,
              duration: formattedDuration,
              status: "Checked Out",
              sessions: currentSessions,
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

  const applyLeave = async (params: {
    userId: string;
    startDate: string;
    endDate?: string;
    leaveType: string;
    reason?: string;
    status?: "Pending" | "Approved";
  }): Promise<{ success: boolean; error?: string }> => {
    const targetUser = users.find((u) => u.id === params.userId) || currentUser;
    const isDirectApproval =
      params.status === "Approved" ||
      currentUser.role === "ceo" ||
      (currentUser.role === "project_manager" && params.userId !== currentUser.id);
    const finalStatus = isDirectApproval ? "Approved" : "Pending";

    const payload = {
      userId: targetUser.id,
      userName: targetUser.fullName,
      userRole: targetUser.role,
      startDate: params.startDate,
      endDate: params.endDate || params.startDate,
      leaveType: params.leaveType,
      reason: params.reason || "",
      status: finalStatus,
      appliedById: currentUser.id,
      appliedByName: currentUser.fullName,
      reviewedById: isDirectApproval ? currentUser.id : undefined,
      reviewedByName: isDirectApproval ? currentUser.fullName : undefined,
    };

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to submit leave application" };
      }

      if (data.leaveRequest) {
        setLeaveRequests((prev) => [data.leaveRequest, ...prev]);
      }

      if (finalStatus === "Approved") {
        const dates = getDatesInRange(params.startDate, params.endDate || params.startDate);
        const todayStr = getLocalDateString(new Date());

        setAttendance((prev) => {
          const updated = [...prev];
          for (const d of dates) {
            const recId = `att-${targetUser.id}-${d}`;
            const existingIdx = updated.findIndex((r) => r.userId === targetUser.id && r.date === d);
            const leaveRec: AttendanceRecord = {
              id: existingIdx >= 0 ? updated[existingIdx].id : recId,
              userId: targetUser.id,
              userName: targetUser.fullName,
              userRole: targetUser.role,
              date: d,
              clockIn: "—",
              clockOut: "—",
              duration: "—",
              status: "Leave",
              sessions: [],
              leaveType: params.leaveType,
              leaveReason: params.reason || "",
            };
            if (existingIdx >= 0) {
              updated[existingIdx] = leaveRec;
            } else {
              updated.unshift(leaveRec);
            }
          }
          return updated;
        });

        if (dates.includes(todayStr)) {
          setUserClockInData((prev) => ({
            ...prev,
            [targetUser.id]: {
              isClockedIn: false,
              clockInTimestamp: null,
              clockInTimeString: null,
              clockOutTimeString: null,
              elapsedSeconds: 0,
              clockInDate: todayStr,
              sessions: [],
            },
          }));
        }
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error applying leave";
      return { success: false, error: msg };
    }
  };

  const reviewLeaveRequest = async (id: string, status: "Approved" | "Rejected"): Promise<boolean> => {
    try {
      const res = await fetch("/api/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          reviewedById: currentUser.id,
          reviewedByName: currentUser.fullName,
        }),
      });
      if (!res.ok) return false;

      setLeaveRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                reviewedById: currentUser.id,
                reviewedByName: currentUser.fullName,
              }
            : r
        )
      );

      if (status === "Approved") {
        const reqItem = leaveRequests.find((r) => r.id === id);
        if (reqItem) {
          const dates = getDatesInRange(reqItem.startDate, reqItem.endDate);
          const todayStr = getLocalDateString(new Date());

          setAttendance((prev) => {
            const updated = [...prev];
            for (const d of dates) {
              const recId = `att-${reqItem.userId}-${d}`;
              const existingIdx = updated.findIndex((r) => r.userId === reqItem.userId && r.date === d);
              const leaveRec: AttendanceRecord = {
                id: existingIdx >= 0 ? updated[existingIdx].id : recId,
                userId: reqItem.userId,
                userName: reqItem.userName,
                userRole: reqItem.userRole,
                date: d,
                clockIn: "—",
                clockOut: "—",
                duration: "—",
                status: "Leave",
                sessions: [],
                leaveType: reqItem.leaveType,
                leaveReason: reqItem.reason || "",
              };
              if (existingIdx >= 0) {
                updated[existingIdx] = leaveRec;
              } else {
                updated.unshift(leaveRec);
              }
            }
            return updated;
          });

          if (dates.includes(todayStr)) {
            setUserClockInData((prev) => ({
              ...prev,
              [reqItem.userId]: {
                isClockedIn: false,
                clockInTimestamp: null,
                clockInTimeString: null,
                clockOutTimeString: null,
                elapsedSeconds: 0,
                clockInDate: todayStr,
                sessions: [],
              },
            }));
          }
        }
      }

      return true;
    } catch (err) {
      console.error("reviewLeaveRequest error:", err);
      return false;
    }
  };

  return (
    <TeamFlowContext.Provider
      value={{
        hasHydrated,
        currentUser,
        users,
        projects,
        tasks,
        attendance,
        userClockInData,
        currentUserClockIn,
        setCurrentUserId,
        updateUserProfile,
        deleteUser,
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
        jobRoles,
        createJobRole,
        updateJobRole,
        deleteJobRole,
        categories,
        createCategory,
        updateCategory,
        deleteCategory,
        departments,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        addTeamMember,
        login,
        logout,
        rewardsLedger,
        awardRewardPoints,
        leaveRequests,
        applyLeave,
        reviewLeaveRequest
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
