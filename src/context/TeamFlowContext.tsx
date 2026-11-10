"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  User,
  Project,
  Task,
  TaskAttachment,
  TaskActivityItem,
  AttendanceRecord,
  PunchSession,
  LeaveRequest,
  MediaDeletionRequest,
  ProjectCategory,
  DEFAULT_PROJECT_CATEGORIES,
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_TASKS_DATA,
  INITIAL_ATTENDANCE_DATA,
  DEFAULT_JOB_ROLES,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES
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
  lastHeartbeat?: number | null;
  autoClockOutReason?: "sleep" | "tab_closed" | "heartbeat_timeout" | null;
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

export function isLateClockIn(timeOrDate?: Date | string | null): boolean {
  if (!timeOrDate || timeOrDate === "—") return false;
  if (timeOrDate instanceof Date) {
    return timeOrDate.getHours() > 9 || (timeOrDate.getHours() === 9 && timeOrDate.getMinutes() > 30);
  }
  const str = String(timeOrDate).trim();
  const match = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!match) return false;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours > 9 || (hours === 9 && minutes > 30);
}

const DEFAULT_CLOCK_IN_DATA: Record<string, UserClockInState> = {};

export interface OfficeLeave {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  declaredById?: string;
  declaredByName?: string;
  declaredByRole?: "ceo" | "project_manager" | string;
  createdAt?: string;
}

export interface TechStackItem {
  id: string;
  name: string;
  createdAt?: string;
}

interface TeamFlowContextType {
  currentUser: User;
  users: User[];
  projects: Project[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  userClockInData: Record<string, UserClockInState>;
  currentUserClockIn: UserClockInState;
  setCurrentUserId: (id: string) => void;
  updateUserProfile: (updates: Partial<User>) => Promise<boolean>;
  updateTeamMember: (id: string, updates: Partial<User> & { password?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => Promise<boolean>;
  createProject: (projectData: {
    name: string;
    code?: string;
    description?: string;
    projectManagerId: string;
    teamLeadId: string;
    teamMemberIds: string[];
    priority: "High" | "Medium" | "Low";
    startDate?: string;
    deadline: string;
    category: string;
    budget?: string;
    status?: "Planning" | "In Progress" | "In Review" | "Completed";
    techStack?: string[];
  }) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createTask: (
    taskData: {
      projectId: string;
      title: string;
      description: string;
      assignedTo: string;
      priority: "High" | "Medium" | "Low";
      startDate?: string;
      deadline: string;
      status?: "To Do" | "In Progress" | "Review" | "Completed";
    },
    initialFile?: {
      name: string;
      size: string;
      type: "image" | "pdf" | "figma" | "zip" | "doc";
      url?: string;
      rawFile?: File | null;
    }
  ) => Task;
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
  ) => Promise<{ success: boolean; error?: string; isDuplicate?: boolean; isSizeExceeded?: boolean }>;
  uploadProjectMedia: (
    projectId: string,
    file: {
      name: string;
      size: string;
      type: "image" | "pdf" | "figma" | "zip" | "doc";
      url?: string;
      rawFile?: File | null;
    }
  ) => Promise<{ success: boolean; error?: string; isDuplicate?: boolean; isSizeExceeded?: boolean }>;
  deleteProjectMedia: (projectId: string, attachmentId: string) => Promise<boolean>;
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
  createCategory: (name: string) => Promise<boolean>;
  updateCategory: (id: string, name: string, oldName?: string) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  departments: { id: string; name: string }[];
  createDepartment: (name: string) => Promise<boolean>;
  updateDepartment: (id: string, name: string, oldName?: string) => Promise<boolean>;
  deleteDepartment: (id: string) => Promise<boolean>;
  addTeamMember: (userData: {
    fullName: string;
    email: string;
    role: "employee" | "project_manager";
    jobTitle?: string;
    department?: string;
    initialPassword?: string;
  }) => Promise<User & { emailSent?: boolean; emailError?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  rewardsLedger: RewardLedgerEntry[];
  hasHydrated: boolean;
  jobRolesLoaded: boolean;
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
  deleteTaskMedia: (taskId: string, attachmentId: string) => Promise<boolean>;
  canUserDeleteMedia: (projectId: string) => boolean;
  mediaDeletionRequests: MediaDeletionRequest[];
  requestMediaDeletion: (params: {
    taskId?: string;
    projectId?: string;
    attachmentId: string;
    reason: string;
  }) => Promise<boolean>;
  resolveMediaDeletionRequest: (
    requestId: string,
    action: "approve" | "reject",
    notes?: string
  ) => Promise<boolean>;
  sleepNotice: { time: string; duration: string; reason: string } | null;
  dismissSleepNotice: () => void;
  officeLeaves: OfficeLeave[];
  createOfficeLeave: (data: { title: string; date: string; endDate?: string }) => Promise<boolean>;
  deleteOfficeLeave: (id: string) => Promise<boolean>;
  techStacks: TechStackItem[];
  createTechStack: (name: string) => Promise<boolean>;
  updateTechStack: (id: string, name: string) => Promise<boolean>;
  deleteTechStack: (id: string) => Promise<boolean>;
  notificationPreferences: NotificationPreferences;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
}

const DEFAULT_OFFICE_LEAVES: OfficeLeave[] = [];
const DEFAULT_TECH_STACKS: TechStackItem[] = [];

const TeamFlowContext = createContext<TeamFlowContextType | undefined>(undefined);

const EMPTY_FALLBACK_USER: User = {
  id: "",
  name: "",
  fullName: "",
  email: "",
  role: "employee",
  jobTitle: "",
  avatar: "",
  phone: "",
  employeeId: "",
};

const DEFAULT_INACTIVE_CLOCK_IN_STATE: UserClockInState = {
  isClockedIn: false,
  clockInTimestamp: null,
  clockInTimeString: null,
  clockOutTimeString: null,
  elapsedSeconds: 0,
};

export function sanitizeUserData(u: User): User {
  const hasDummyAvatar =
    u.avatar &&
    (u.avatar.includes("images.unsplash.com") ||
     u.avatar.includes("/avatars/marcus.jpg") ||
     u.avatar.includes("/avatars/ajay.jpg"));

  const bestName = (u.fullName && u.fullName.trim()) || (u.name && u.name.trim()) || "";

  return {
    ...u,
    name: bestName,
    fullName: bestName,
    avatar: hasDummyAvatar ? "" : (u.avatar || ""),
    phone: u.phone || "",
    bio: u.bio || "",
  };
}

export function ensureProjectTechStack(p: Project): Project {
  if (Array.isArray(p.techStack) && p.techStack.length > 0) {
    return p;
  }
  const cat = (p.category || "").toLowerCase();
  let defaultStack = ["React", "TypeScript", "Node.js", "PostgreSQL"];
  if (cat.includes("web")) defaultStack = ["React", "Next.js", "TypeScript", "Tailwind CSS"];
  else if (cat.includes("mobile")) defaultStack = ["Flutter", "Node.js", "PostgreSQL", "Docker"];
  else if (cat.includes("cloud") || cat.includes("data")) defaultStack = ["Python", "AWS", "PostgreSQL", "Docker"];
  else if (cat.includes("design")) defaultStack = ["Figma", "React", "TypeScript", "Tailwind CSS"];
  return { ...p, techStack: defaultStack };
}

export function generateCategoryPrefix(categoryName: string): string {
  const trimmed = (categoryName || "").trim();
  if (!trimmed) return "PRJ";

  const lower = trimmed.toLowerCase();
  if (lower.includes("mobile")) return "MOB";
  if (lower.includes("web") || lower.includes("site")) return "WEB";
  if (lower.includes("cloud")) return "CLD";
  if (lower.includes("security")) return "SEC";
  if (lower.includes("ui") || lower.includes("ux")) return "UIX";
  if (lower.includes("design")) return "DES";
  if (lower.includes("ai") || lower.includes("artificial") || lower.includes("intelligence")) return "AI";
  if (lower.includes("data") || lower.includes("analytics")) return "DAT";
  if (lower.includes("devops") || lower.includes("infra")) return "DEV";
  if (lower.includes("backend")) return "BE";
  if (lower.includes("frontend")) return "FE";
  if (lower.includes("qa") || lower.includes("test")) return "QA";

  const stopWords = new Set(["a", "an", "the", "and", "for", "of", "in", "on", "with", "to", "at", "by", "from", "&"]);
  const words = trimmed
    .split(/[\s\-_/&]+/)
    .filter((w) => w.length > 0 && !stopWords.has(w.toLowerCase()));

  if (words.length >= 3) {
    return words.slice(0, 3).map((w) => w[0].toUpperCase()).join("");
  }
  if (words.length === 2) {
    if (words[0].length >= 3) {
      return words[0].substring(0, 3).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase() || "PRJ";
  }
  return "PRJ";
}

export function generateProjectCodeFromCategory(
  categoryName: string,
  existingProjects: { id?: string; code: string }[],
  currentProjectId?: string
): string {
  const existingCodes = new Set(
    existingProjects
      .filter((p) => !currentProjectId || p.id !== currentProjectId)
      .map((p) => (p.code || "").toUpperCase())
  );

  const prefix = generateCategoryPrefix(categoryName);

  let num = 1;
  let candidate = `${prefix}-${String(num).padStart(2, "0")}`;
  while (existingCodes.has(candidate)) {
    num++;
    candidate = `${prefix}-${String(num).padStart(2, "0")}`;
  }

  return candidate;
}

export function sanitizeTaskAttachments(t: Task): Task {
  if (!Array.isArray(t.attachments)) return t;
  const seenNames = new Set<string>();
  const deduped = t.attachments.filter((att) => {
    if (!att || !att.url || att.url.startsWith("blob:")) return false;
    const key = (att.name || "").trim().toLowerCase();
    if (!key) return true;
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });
  return { ...t, attachments: deduped };
}

export function sanitizeProjectAttachments(p: Project): Project {
  if (!Array.isArray(p.attachments)) return p;
  const seenNames = new Set<string>();
  const deduped = p.attachments.filter((att) => {
    if (!att || !att.url || att.url.startsWith("blob:")) return false;
    const key = (att.name || "").trim().toLowerCase();
    if (!key) return true;
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });
  return { ...p, attachments: deduped };
}

export function computeAutoProjectStatus(
  projectTasks: Task[],
  currentStatus: Project["status"]
): Project["status"] {
  const activeTasks = projectTasks.filter(
    (t) =>
      t.title !== "Project Assets & Deliverables" &&
      t.title !== "Project Deliverables & Assets"
  );

  if (activeTasks.length === 0) {
    return currentStatus || "Planning";
  }

  const total = activeTasks.length;
  const completed = activeTasks.filter((t) => t.status === "Completed").length;
  const review = activeTasks.filter((t) => t.status === "Review").length;
  const inProgress = activeTasks.filter(
    (t) => t.status === "In Progress" || (t.progress > 0 && t.status !== "Completed")
  ).length;
  const toDo = activeTasks.filter((t) => t.status === "To Do" && (t.progress === 0 || !t.progress)).length;

  if (completed === total) {
    return "Completed";
  }

  if (completed + review === total && review > 0) {
    return "In Review";
  }

  if (inProgress > 0 || completed > 0 || review > 0) {
    return "In Progress";
  }

  if (toDo === total) {
    return "Planning";
  }

  return currentStatus || "Planning";
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
  const tasksRef = useRef<Task[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_DATA);
  const [userClockInData, setUserClockInData] = useState<Record<string, UserClockInState>>(DEFAULT_CLOCK_IN_DATA);
  const [sleepNotice, setSleepNotice] = useState<{ time: string; duration: string; reason: string } | null>(null);
  const dismissSleepNotice = useCallback(() => setSleepNotice(null), []);

  const userClockInDataRef = useRef(userClockInData);
  userClockInDataRef.current = userClockInData;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;
  const [jobRoles, setJobRoles] = useState<{ id: string; name: string }[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("teamflow_job_roles");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return DEFAULT_JOB_ROLES;
  });
  const departments = jobRoles;
  const setDepartments = setJobRoles;
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [rewardsLedger, setRewardsLedger] = useState<RewardLedgerEntry[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [mediaDeletionRequests, setMediaDeletionRequests] = useState<MediaDeletionRequest[]>([]);
  const [officeLeaves, setOfficeLeaves] = useState<OfficeLeave[]>([]);
  const [techStacks, setTechStacks] = useState<TechStackItem[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [jobRolesLoaded, setJobRolesLoaded] = useState(false);

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(() => {
    if (typeof window !== "undefined") {
      try {
        const activeUser = localStorage.getItem("teamflow_current_user") || "";
        const key = activeUser ? `teamflow_notif_prefs_${activeUser}` : "teamflow_notif_prefs";
        const saved = localStorage.getItem(key) || localStorage.getItem("teamflow_notif_prefs");
        if (saved) {
          return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(saved) };
        }
      } catch {}
    }
    return DEFAULT_NOTIFICATION_PREFERENCES;
  });

  useEffect(() => {
    if (!currentUserId || typeof window === "undefined") return;
    try {
      const key = `teamflow_notif_prefs_${currentUserId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setNotificationPreferences({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(saved) });
      } else {
        const globalSaved = localStorage.getItem("teamflow_notif_prefs");
        if (globalSaved) {
          setNotificationPreferences({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(globalSaved) });
        } else {
          setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
        }
      }
    } catch {}
  }, [currentUserId]);

  const updateNotificationPreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
    setNotificationPreferences((prev) => {
      const updated = { ...prev, ...prefs };
      if (typeof window !== "undefined") {
        try {
          const activeUser = currentUserIdRef.current;
          if (activeUser) {
            localStorage.setItem(`teamflow_notif_prefs_${activeUser}`, JSON.stringify(updated));
          }
          localStorage.setItem("teamflow_notif_prefs", JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent("teamflow_notif_prefs_updated", { detail: updated }));
        } catch {}
      }
      return updated;
    });
  }, []);

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
          if (Array.isArray(parsed)) {
            const migrated = parsed.map((p: Project) => {
              if (p.code === "GRE-01") return { ...p, code: "MOB-01" };
              return p;
            });
            setProjects(migrated.map(ensureProjectTechStack).map(sanitizeProjectAttachments));
          }
        } catch {}
      }

      if (savedTasks) {
        try {
          const parsed = JSON.parse(savedTasks);
          if (Array.isArray(parsed)) {
            const dummyTasks = parsed.filter(
              (t: Task) => t.title === "Project Assets & Deliverables" || t.title === "Project Deliverables & Assets"
            );
            if (dummyTasks.length > 0) {
              setProjects((prev) =>
                prev.map((p) => {
                  const matchingDummy = dummyTasks.find((dt: Task) => dt.projectId === p.id);
                  if (matchingDummy && Array.isArray(matchingDummy.attachments) && matchingDummy.attachments.length > 0) {
                    const existingNames = new Set((p.attachments || []).map((a) => a.name.trim().toLowerCase()));
                    const newAtts = matchingDummy.attachments.filter((a: TaskAttachment) => !existingNames.has(a.name.trim().toLowerCase()));
                    return { ...p, attachments: [...(p.attachments || []), ...newAtts] };
                  }
                  return p;
                })
              );
            }
            const cleanTasks = parsed
              .filter(
                (t: Task) => t.title !== "Project Assets & Deliverables" && t.title !== "Project Deliverables & Assets"
              )
              .map(sanitizeTaskAttachments);
            setTasks(cleanTasks);
          }
        } catch {}
      }

      const savedCategories = localStorage.getItem("teamflow_categories");
      if (savedCategories) {
        try {
          const parsed = JSON.parse(savedCategories);
          if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
        } catch {}
      }

      const hasAttendanceCleaned = localStorage.getItem("teamflow_attendance_v6_reset");
      if (!hasAttendanceCleaned) {
        localStorage.removeItem("teamflow_attendance");
        localStorage.setItem("teamflow_attendance_v6_reset", "true");
      } else if (savedAttendance) {
        try {
          const parsed = JSON.parse(savedAttendance);
          if (Array.isArray(parsed)) {
            const seen = new Set<string>();
            const deduped = parsed.filter((r: AttendanceRecord) => {
              if (r.userId === "u-emp-1793956721315" && r.status === "Leave") return false;
              const k = `${r.userId}-${r.date}`;
              if (seen.has(k)) return false;
              seen.add(k);
              return true;
            });
            setAttendance(deduped);
          }
        } catch {}
      }

      const savedMediaRequests = localStorage.getItem("teamflow_media_deletion_requests_v1");
      if (savedMediaRequests) {
        try {
          const parsed = JSON.parse(savedMediaRequests);
          if (Array.isArray(parsed)) setMediaDeletionRequests(parsed);
        } catch {}
      }

      const savedLeaveRequests = localStorage.getItem("teamflow_leave_requests");
      if (savedLeaveRequests) {
        try {
          const parsed = JSON.parse(savedLeaveRequests);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLeaveRequests(
              parsed.filter(
                (l: LeaveRequest) =>
                  l.id !== "leave-1793958337968-u-emp-1793956721315" &&
                  !(l.userId === "u-emp-1793956721315" && l.endDate === "2028-02-05")
              )
            );
          }
        } catch {}
      }

      const savedOfficeLeaves = localStorage.getItem("teamflow_office_leaves");
      if (savedOfficeLeaves) {
        try {
          const parsed = JSON.parse(savedOfficeLeaves);
          if (Array.isArray(parsed) && parsed.length > 0) setOfficeLeaves(parsed);
        } catch {}
      }

      const savedTechStacks = localStorage.getItem("teamflow_tech_stacks");
      if (savedTechStacks) {
        try {
          const parsed = JSON.parse(savedTechStacks);
          if (Array.isArray(parsed) && parsed.length > 0) setTechStacks(parsed);
        } catch {}
      }

      const savedJobRoles = localStorage.getItem("teamflow_job_roles");
      if (savedJobRoles) {
        try {
          const parsed = JSON.parse(savedJobRoles);
          if (Array.isArray(parsed) && parsed.length > 0) setJobRoles(parsed);
        } catch {}
      }

      const savedRewardsLedger = localStorage.getItem("teamflow_rewards_ledger");
      if (savedRewardsLedger) {
        try {
          const parsed = JSON.parse(savedRewardsLedger);
          if (Array.isArray(parsed)) setRewardsLedger(parsed);
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
      const [usersRes, projectsRes, tasksRes, attendanceRes, clockInRes, deptsRes, rewardsRes, meRes, leavesRes, categoriesRes, officeLeavesRes, techStacksRes] = await Promise.all([
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
        fetch("/api/office-leaves").catch(() => null),
        fetch("/api/tech-stacks").catch(() => null),
      ]);

      let freshUsers = users;
      if (usersRes && usersRes.ok) {
        const data = await usersRes.json();
        if (Array.isArray(data.users) && data.source !== "error" && data.source !== "fallback_error") {
          const sanitized = data.users.map(sanitizeUserData);
          freshUsers = sanitized;
          setUsers(sanitized);
          try {
            localStorage.setItem("teamflow_users", JSON.stringify(sanitized));
          } catch {}
        }
      }

      if (projectsRes && projectsRes.ok) {
        const data = await projectsRes.json();
        if (Array.isArray(data.projects) && data.source !== "error" && data.source !== "fallback_error") {
          setProjects(data.projects.map(ensureProjectTechStack).map(sanitizeProjectAttachments));
        }
      }

      if (tasksRes && tasksRes.ok) {
        const data = await tasksRes.json();
        if (Array.isArray(data.tasks) && data.source !== "error" && data.source !== "fallback_error") {
          const dummyTasks = data.tasks.filter(
            (t: Task) => t.title === "Project Assets & Deliverables" || t.title === "Project Deliverables & Assets"
          );
          if (dummyTasks.length > 0) {
            setProjects((prev) =>
              prev.map((p) => {
                const matchingDummy = dummyTasks.find((dt: Task) => dt.projectId === p.id);
                if (matchingDummy && Array.isArray(matchingDummy.attachments) && matchingDummy.attachments.length > 0) {
                  const existingNames = new Set((p.attachments || []).map((a) => a.name.trim().toLowerCase()));
                  const newAtts = matchingDummy.attachments.filter((a: TaskAttachment) => !existingNames.has(a.name.trim().toLowerCase()));
                  return { ...p, attachments: [...(p.attachments || []), ...newAtts] };
                }
                return p;
              })
            );
          }
          const cleanTasks = data.tasks
            .filter(
              (t: Task) => t.title !== "Project Assets & Deliverables" && t.title !== "Project Deliverables & Assets"
            )
            .map(sanitizeTaskAttachments);
          setTasks(cleanTasks);
        }
      }

      if (attendanceRes && attendanceRes.ok) {
        const data = await attendanceRes.json();
        if (Array.isArray(data.attendance) && data.source !== "error" && data.source !== "fallback_error") {
          const rawAtt: AttendanceRecord[] = data.attendance;
          const userMap = new Map(freshUsers.map((u) => [u.id, u]));
          const syncedAtt = rawAtt.map((rec) => {
            const u = userMap.get(rec.userId);
            if (!u) return rec;
            return {
              ...rec,
              userName: u.fullName || u.name || rec.userName,
              userRole: u.role || rec.userRole,
            };
          });
          setAttendance(syncedAtt);
        }
      }

      if (clockInRes && clockInRes.ok) {
        const data = await clockInRes.json();
        if (data.clockInData && data.source !== "error" && data.source !== "fallback_error") {
          setUserClockInData(data.clockInData);
        }
      }

      if (deptsRes && deptsRes.ok) {
        const data = await deptsRes.json();
        const list = data.jobRoles || data.departments;
        if (Array.isArray(list) && data.source !== "error" && data.source !== "fallback_error") {
          const finalRoles = list.length > 0 ? list : DEFAULT_JOB_ROLES;
          setJobRoles(finalRoles);
          try {
            localStorage.setItem("teamflow_job_roles", JSON.stringify(finalRoles));
          } catch {}
        }
      }

      if (rewardsRes && rewardsRes.ok) {
        const data = await rewardsRes.json();
        if (Array.isArray(data.ledger) && data.source !== "error" && data.source !== "fallback_error") {
          const userMap = new Map(freshUsers.map((u) => [u.id, u]));
          const syncedLedger = (data.ledger as RewardLedgerEntry[]).map((entry) => {
            const awarder = entry.awardedById ? userMap.get(entry.awardedById) : undefined;
            return {
              ...entry,
              ...(awarder ? { awardedByName: awarder.fullName || awarder.name } : {}),
            };
          });
          setRewardsLedger(syncedLedger);
          try {
            localStorage.setItem("teamflow_rewards_ledger", JSON.stringify(syncedLedger));
          } catch {}
        }
      }

      if (leavesRes && leavesRes.ok) {
        const data = await leavesRes.json();
        if (Array.isArray(data.leaveRequests) && data.source !== "error" && data.source !== "fallback_error") {
          const userMap = new Map(freshUsers.map((u) => [u.id, u]));
          const syncedLeaves = (data.leaveRequests as LeaveRequest[]).map((lr) => {
            const u = userMap.get(lr.userId);
            const app = userMap.get(lr.appliedById);
            const rev = lr.reviewedById ? userMap.get(lr.reviewedById) : undefined;
            return {
              ...lr,
              userName: u?.fullName || u?.name || lr.userName,
              userRole: u?.role || lr.userRole,
              appliedByName: app?.fullName || app?.name || lr.appliedByName,
              reviewedByName: rev ? (rev.fullName || rev.name) : lr.reviewedByName,
            };
          });
          setLeaveRequests(syncedLeaves);
        }
      }

      if (categoriesRes && categoriesRes.ok) {
        const data = await categoriesRes.json();
        if (Array.isArray(data.categories) && data.source !== "error" && data.source !== "fallback_error") {
          setCategories(data.categories);
        }
      }

      if (officeLeavesRes && officeLeavesRes.ok) {
        const data = await officeLeavesRes.json();
        if (Array.isArray(data.officeLeaves) && data.source !== "error" && data.source !== "fallback_error") {
          setOfficeLeaves(data.officeLeaves);
        }
      }

      if (techStacksRes && techStacksRes.ok) {
        const data = await techStacksRes.json();
        if (Array.isArray(data.techStacks) && data.source !== "error" && data.source !== "fallback_error") {
          setTechStacks(data.techStacks);
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
        } else {
          // No active user session from server
          setCurrentUserIdState("");
          try {
            localStorage.removeItem("teamflow_current_user");
          } catch {}
          if (typeof window !== "undefined" && window.location.pathname !== "/login") {
            window.location.replace("/login");
          }
        }
      } else if (meRes && (meRes.status === 401 || meRes.status === 403)) {
        setCurrentUserIdState("");
        try {
          localStorage.removeItem("teamflow_current_user");
        } catch {}
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }
    } catch (err) {
      console.warn("Backend sync notice (using local state):", err);
    } finally {
      setJobRolesLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshFromBackend();
  }, [refreshFromBackend]);

  // Fine-grained state persistence: only stringify the specific slice that changed
  useEffect(() => {
    if (!hasHydrated || !currentUserId) return;
    try {
      localStorage.setItem("teamflow_current_user", currentUserId);
    } catch {}
  }, [currentUserId, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem("teamflow_projects", JSON.stringify(projects));
    } catch {}
  }, [projects, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem("teamflow_tasks", JSON.stringify(tasks));
    } catch {}
  }, [tasks, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem("teamflow_attendance", JSON.stringify(attendance));
    } catch {}
  }, [attendance, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem("teamflow_user_clock_in_v3", JSON.stringify(userClockInData));
    } catch {}
  }, [userClockInData, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem("teamflow_categories", JSON.stringify(categories));
    } catch {}
  }, [categories, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem("teamflow_media_deletion_requests_v1", JSON.stringify(mediaDeletionRequests));
    } catch {}
  }, [mediaDeletionRequests, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem("teamflow_leave_requests", JSON.stringify(leaveRequests));
    } catch {}
  }, [leaveRequests, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem("teamflow_office_leaves", JSON.stringify(officeLeaves));
    } catch {}
  }, [officeLeaves, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem("teamflow_tech_stacks", JSON.stringify(techStacks));
    } catch {}
  }, [techStacks, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem("teamflow_rewards_ledger", JSON.stringify(rewardsLedger));
    } catch {}
  }, [rewardsLedger, hasHydrated]);

  const currentUser: User = useMemo(() => {
    if (!currentUserId) {
      return EMPTY_FALLBACK_USER;
    }
    return (
      users.find((u) => u.id === currentUserId) ||
      { ...EMPTY_FALLBACK_USER, id: currentUserId }
    );
  }, [users, currentUserId]);

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
    refreshFromBackend();
  };

  const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
    const effectiveUserId = currentUserId;
    if (!effectiveUserId) return false;

    const resolvedName = updates.fullName || updates.name;
    const patchData: Partial<User> = {
      ...updates,
      ...(resolvedName ? { name: resolvedName, fullName: resolvedName } : {}),
    };

    setUsers((prev) => {
      const nextUsers = prev.map((u) => {
        if (u.id === effectiveUserId) {
          return { ...u, ...patchData };
        }
        return u;
      });
      try {
        localStorage.setItem("teamflow_users", JSON.stringify(nextUsers));
      } catch {}
      return nextUsers;
    });

    if (patchData.fullName) {
      const cleanNewName = patchData.fullName.trim();
      setAttendance((prev) =>
        prev.map((rec) =>
          rec.userId === effectiveUserId
            ? { ...rec, userName: cleanNewName }
            : rec
        )
      );
      setLeaveRequests((prev) =>
        prev.map((lr) => ({
          ...lr,
          ...(lr.userId === effectiveUserId ? { userName: cleanNewName } : {}),
          ...(lr.appliedById === effectiveUserId ? { appliedByName: cleanNewName } : {}),
          ...(lr.reviewedById === effectiveUserId ? { reviewedByName: cleanNewName } : {}),
        }))
      );
    }

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: effectiveUserId, ...patchData }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUsers((prev) =>
            prev.map((u) => (u.id === effectiveUserId ? { ...u, ...data.user } : u))
          );
        }
        return true;
      } else {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: effectiveUserId, ...patchData }),
        });
        return true;
      }
    } catch (err) {
      console.warn("Failed to persist user profile:", err);
      return false;
    }
  };

  const updateTeamMember = async (
    id: string,
    updates: Partial<User> & { password?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (updates.email) {
      const normalized = updates.email.trim().toLowerCase();
      if (!normalized.endsWith("@maestrominds.co.in")) {
        return { success: false, error: "Only @maestrominds.co.in email addresses are accepted." };
      }
    }
    if (updates.role === "project_manager") {
      updates.jobTitle = "Project Manager";
    }

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to update team member" };
      }

      const updatedUser: User = data.user;
      setUsers((prev) => {
        const nextUsers = prev.map((u) => (u.id === id ? { ...u, ...updatedUser } : u));
        try {
          localStorage.setItem("teamflow_users", JSON.stringify(nextUsers));
        } catch {}
        return nextUsers;
      });

      if (updates.fullName || updates.role) {
        const cleanName = updates.fullName?.trim();
        setAttendance((prev) =>
          prev.map((rec) =>
            rec.userId === id
              ? {
                  ...rec,
                  userName: cleanName || rec.userName,
                  userRole: updates.role || rec.userRole,
                }
              : rec
          )
        );
        setLeaveRequests((prev) =>
          prev.map((lr) => ({
            ...lr,
            ...(lr.userId === id ? { userName: cleanName || lr.userName, userRole: updates.role || lr.userRole } : {}),
            ...(lr.appliedById === id ? { appliedByName: cleanName || lr.appliedByName } : {}),
            ...(lr.reviewedById === id ? { reviewedByName: cleanName || lr.reviewedByName } : {}),
          }))
        );
      }

      return { success: true };
    } catch (err) {
      console.error("Failed to update team member:", err);
      return { success: false, error: "Network error while updating team member" };
    }
  };

  const createJobRole = async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const newRole = {
      id: `role-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      name: trimmed,
    };
    setJobRoles((prev) => {
      const updated = [...prev, newRole];
      try {
        localStorage.setItem("teamflow_job_roles", JSON.stringify(updated));
      } catch {}
      return updated;
    });

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

    setJobRoles((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, name: trimmed } : r));
      try {
        localStorage.setItem("teamflow_job_roles", JSON.stringify(updated));
      } catch {}
      return updated;
    });

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
    setJobRoles((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem("teamflow_job_roles", JSON.stringify(updated));
      } catch {}
      return updated;
    });
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

  const createCategory = async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const newCat: ProjectCategory = {
      id: `cat-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      name: trimmed,
      projectCount: 0,
    };
    setCategories((prev) => [...prev, newCat]);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newCat.id, name: trimmed }),
      });
      if (!res.ok) {
        console.warn("POST /api/categories failed:", res.status);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Failed to create category on backend:", err);
      return false;
    }
  };

  const updateCategory = async (id: string, name: string, oldName?: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
    );

    if (oldName && oldName !== trimmed) {
      setProjects((prev) =>
        prev.map((p) => (p.category.toLowerCase() === oldName.toLowerCase() ? { ...p, category: trimmed } : p))
      );
    }

    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: trimmed, oldName }),
      });
      if (!res.ok) {
        console.warn("PUT /api/categories failed:", res.status);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Failed to update category on backend:", err);
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.warn("DELETE /api/categories failed:", res.status);
        return false;
      }
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
    role: "employee" | "project_manager";
    department?: string;
    jobTitle?: string;
    initialPassword?: string;
  }): Promise<User & { emailSent?: boolean; emailError?: string }> => {
    const normalizedEmail = memberData.email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@maestrominds.co.in")) {
      throw new Error("Only @maestrominds.co.in email addresses are accepted.");
    }
    const existingInState = users.find(
      (u) => u.email.trim().toLowerCase() === normalizedEmail
    );
    if (existingInState) {
      throw new Error("User already exists with this email address.");
    }

    const isPm = memberData.role === "project_manager";
    const timestamp = Date.now();
    const id = isPm ? `u-pm-${timestamp}` : `u-emp-${timestamp}`;
    const employeeId = isPm
      ? `TF-PM-${Math.floor(100 + Math.random() * 900)}`
      : `TF-EMP-${Math.floor(200 + Math.random() * 800)}`;
    const trimmedFullName = memberData.fullName.trim();
    const title = isPm ? "Project Manager" : (memberData.jobTitle || memberData.department || "Software Developer");

    const newUser: User = {
      id,
      name: trimmedFullName,
      fullName: trimmedFullName,
      email: memberData.email.trim(),
      role: memberData.role,
      jobTitle: title,
      avatar: "",
      phone: "",
      employeeId,
      bio: "",
    };

    let emailSent = false;
    let emailError: string | undefined;

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newUser,
        initialPassword: memberData.initialPassword,
        sendWelcomeEmail: true,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || "Failed to add team member.");
    }

    if (data) {
      emailSent = Boolean(data.emailSent);
      emailError = data.emailError;
    }

    setUsers((prev) => {
      const nextUsers = [...prev, newUser];
      try {
        localStorage.setItem("teamflow_users", JSON.stringify(nextUsers));
      } catch {}
      return nextUsers;
    });

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

    return { ...newUser, emailSent, emailError };
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
    setCurrentUserIdState("");
    try {
      localStorage.removeItem("teamflow_current_user");
      localStorage.removeItem("teamflow_attendance");
      localStorage.removeItem("teamflow_users");
    } catch {}
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.warn("Logout fetch failed:", err);
    }
    if (typeof window !== "undefined") {
      window.location.replace("/login");
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
    description?: string;
    projectManagerId: string;
    teamLeadId: string;
    teamMemberIds: string[];
    priority: "High" | "Medium" | "Low";
    startDate?: string;
    deadline: string;
    category: string;
    budget?: string;
    status?: "Planning" | "In Progress" | "In Review" | "Completed";
    techStack?: string[];
  }): Project => {
    const fallbackCode = generateProjectCodeFromCategory(projectData.category || "General", projects);
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectData.name,
      code: (projectData.code || fallbackCode).toUpperCase(),
      description: projectData.description || "",
      projectManagerId: projectData.projectManagerId,
      teamLeadId: projectData.teamLeadId,
      teamMemberIds: Array.from(new Set([...projectData.teamMemberIds, projectData.teamLeadId])),
      status: projectData.status || "In Progress",
      priority: projectData.priority,
      startDate: projectData.startDate || new Date().toISOString().split("T")[0],
      deadline: projectData.deadline,
      category: projectData.category || "General",
      budget: projectData.budget || "₹50,000",
      techStack:
        projectData.techStack && projectData.techStack.length > 0
          ? projectData.techStack
          : ensureProjectTechStack({ category: projectData.category || "General" } as Project).techStack || ["React", "TypeScript", "Node.js", "PostgreSQL"],
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

  const createTask = (
    taskData: {
      projectId: string;
      title: string;
      description: string;
      assignedTo: string;
      priority: "High" | "Medium" | "Low";
      startDate?: string;
      deadline: string;
      status?: "To Do" | "In Progress" | "Review" | "Completed";
    },
    initialFile?: {
      name: string;
      size: string;
      type: "image" | "pdf" | "figma" | "zip" | "doc";
      url?: string;
      rawFile?: File | null;
    }
  ): Task => {
    const attachmentId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const initialUrl =
      initialFile?.url && !initialFile.url.startsWith("blob:")
        ? initialFile.url
        : (initialFile?.type === "image"
        ? "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80"
        : "");

    const initialAttachments: TaskAttachment[] = initialFile
      ? [
          {
            id: attachmentId,
            name: initialFile.name,
            size: initialFile.size,
            type: initialFile.type,
            url: initialUrl,
            uploadedBy: currentUser.id,
            uploadedByName: currentUser.fullName,
            uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          },
        ]
      : [];

    const initialActivity: TaskActivityItem[] = [
      ...(initialFile
        ? [
            {
              id: `act-${Date.now()}-att`,
              title: `Deliverable uploaded: ${initialFile.name}`,
              detail: `Uploaded by ${currentUser.fullName}`,
              date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            },
          ]
        : []),
      {
        id: `act-${Date.now()}`,
        title: `Task created by ${currentUser.fullName}`,
        detail: `Assigned to ${users.find((u) => u.id === taskData.assignedTo)?.fullName || "Team Member"}`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
    ];

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
      progress:
        taskData.status === "Completed"
          ? 100
          : taskData.status === "Review"
          ? 90
          : taskData.status === "In Progress"
          ? 50
          : 0,
      attachments: initialAttachments,
      activity: initialActivity,
    };

    const nextTasks = [newTask, ...tasks];
    setTasks(nextTasks);
    tasksRef.current = nextTasks;

    const targetProject = projects.find((p) => p.id === taskData.projectId);
    if (targetProject) {
      const projectTasks = nextTasks.filter((t) => t.projectId === targetProject.id);
      const computedStatus = computeAutoProjectStatus(projectTasks, targetProject.status);
      if (computedStatus !== targetProject.status) {
        newTask.activity.unshift({
          id: `act-${Date.now()}-proj`,
          title: `Project status automatically changed to ${computedStatus}`,
          detail: `Triggered by new task "${taskData.title}".`,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        });
        setProjects((prev) =>
          prev.map((p) => (p.id === targetProject.id ? { ...p, status: computedStatus } : p))
        );
        fetch(`/api/projects/${targetProject.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: computedStatus }),
        }).catch((err) => console.warn("Failed to auto-update project status on backend:", err));
      }
    }

    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    }).catch((err) => console.warn("Failed to persist task to backend:", err));

    if (initialFile?.rawFile && initialFile.rawFile.size <= 100 * 1024 * 1024) {
      (async () => {
        let finalUrl = "";
        try {
          const signRes = await fetch("/api/upload/sign");
          if (signRes.ok) {
            const signData = await signRes.json();
            if (signData.configured && signData.signature && signData.apiKey && signData.cloudName) {
              const ext = initialFile.name.split(".").pop()?.toLowerCase() || "";
              const isImage = ["png", "jpg", "jpeg", "webp"].includes(ext) || initialFile.type === "image" || (initialFile.rawFile?.type || "").startsWith("image/");
              const endpointType = isImage ? "image" : "raw";

              const cloudFormData = new FormData();
              cloudFormData.append("file", initialFile.rawFile!);
              cloudFormData.append("api_key", signData.apiKey);
              cloudFormData.append("timestamp", signData.timestamp.toString());
              cloudFormData.append("signature", signData.signature);
              cloudFormData.append("folder", signData.folder);

              const cloudRes = await fetch(
                `https://api.cloudinary.com/v1_1/${signData.cloudName}/${endpointType}/upload`,
                { method: "POST", body: cloudFormData }
              );

              if (cloudRes.ok) {
                const cloudJson = await cloudRes.json();
                finalUrl = cloudJson.secure_url || cloudJson.url || "";
              }
            }
          }
        } catch (err) {
          console.warn("Direct upload in createTask error:", err);
        }

        if (finalUrl) {
          fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directUrl: finalUrl,
              name: initialFile.name,
              size: initialFile.size,
              type: initialFile.type,
              taskId: newTask.id,
              projectId: taskData.projectId,
              uploadedBy: currentUser.id,
              uploadedByName: currentUser.fullName,
            }),
          }).catch((err) => console.warn("Failed to sync initial task deliverable JSON:", err));

          setTasks((prev) => {
            const updated = prev.map((t) => {
              if (t.id === newTask.id) {
                return {
                  ...t,
                  attachments: t.attachments.map((att) =>
                    att.id === attachmentId ? { ...att, url: finalUrl } : att
                  ),
                };
              }
              return t;
            });
            tasksRef.current = updated;
            try {
              localStorage.setItem("teamflow_tasks", JSON.stringify(updated));
            } catch {}
            return updated;
          });
        } else {
          const formData = new FormData();
          formData.append("file", initialFile.rawFile!);
          formData.append("taskId", newTask.id);
          formData.append("projectId", taskData.projectId);
          formData.append("name", initialFile.name);
          formData.append("uploadedBy", currentUser.id);
          formData.append("uploadedByName", currentUser.fullName);

          fetch("/api/upload", {
            method: "POST",
            body: formData,
          })
            .then((res) => res.json())
            .then((data) => {
              const url = data?.attachment?.url || data?.url;
              if (url && !url.startsWith("blob:")) {
                setTasks((prev) => {
                  const updated = prev.map((t) => {
                    if (t.id === newTask.id) {
                      return {
                        ...t,
                        attachments: t.attachments.map((att) =>
                          att.id === attachmentId ? { ...att, url } : att
                        ),
                      };
                    }
                    return t;
                  });
                  tasksRef.current = updated;
                  try {
                    localStorage.setItem("teamflow_tasks", JSON.stringify(updated));
                  } catch {}
                  return updated;
                });
              }
            })
            .catch((err) => console.warn("Failed to upload initial task deliverable:", err));
        }
      })();
    }

    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    let targetProjectId: string | undefined;
    let autoProjectStatusUpdate: Project["status"] | undefined;
    let autoActivityItem: TaskActivityItem | undefined;
    let computedProgress: number | undefined;

    setTasks((prev) => {
      const nextTasks = prev.map((t) => {
        if (t.id === id) {
          targetProjectId = t.projectId;
          const updated = { ...t, ...updates };

          if (updates.status !== undefined) {
            if (updates.progress !== undefined) {
              updated.progress = updates.progress;
            } else if (updates.status === "To Do") {
              updated.progress = 0;
            } else if (updates.status === "In Progress") {
              if (t.status === "Review" || t.status === "Completed" || t.status === "To Do" || t.progress >= 90 || t.progress === 0 || !t.progress) {
                updated.progress = 50;
              }
            } else if (updates.status === "Review") {
              updated.progress = 90;
            } else if (updates.status === "Completed") {
              updated.progress = 100;
            }
          } else if (updates.progress !== undefined) {
            updated.progress = updates.progress;
            if (updates.progress === 100) {
              updated.status = "Completed";
            } else if (updates.progress === 0 && t.status === "Completed") {
              updated.status = "To Do";
            }
          }

          computedProgress = updated.progress;

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
      });

      if (targetProjectId) {
        const targetProj = projects.find((p) => p.id === targetProjectId);
        if (targetProj) {
          const projectTasks = nextTasks.filter((t) => t.projectId === targetProjectId);
          const computedStatus = computeAutoProjectStatus(projectTasks, targetProj.status);
          if (computedStatus !== targetProj.status) {
            autoProjectStatusUpdate = computedStatus;
            autoActivityItem = {
              id: `act-${Date.now()}-proj`,
              title: `Project status automatically changed to ${computedStatus}`,
              detail: `Triggered by task status change to ${updates.status || 'updated state'}.`,
              date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            };
            return nextTasks.map((t) =>
              t.id === id ? { ...t, activity: [autoActivityItem!, ...t.activity] } : t
            );
          }
        }
      }

      return nextTasks;
    });

    if (targetProjectId && autoProjectStatusUpdate) {
      setProjects((prev) =>
        prev.map((p) => (p.id === targetProjectId ? { ...p, status: autoProjectStatusUpdate! } : p))
      );
      fetch(`/api/projects/${targetProjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: autoProjectStatusUpdate }),
      }).catch((err) => console.warn("Failed to auto-update project status on backend:", err));
    }

    fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updates,
        ...(computedProgress !== undefined ? { progress: computedProgress } : {}),
        updatedByName: currentUser.fullName,
      }),
    }).catch((err) => console.warn("Failed to update task on backend:", err));
  };

  const deleteTask = (id: string) => {
    const targetTask = tasks.find((t) => t.id === id);
    const targetProjectId = targetTask?.projectId;

    const remainingTasks = tasks.filter((t) => t.id !== id);
    setTasks(remainingTasks);

    if (targetProjectId) {
      const targetProj = projects.find((p) => p.id === targetProjectId);
      if (targetProj) {
        const projectTasks = remainingTasks.filter((t) => t.projectId === targetProjectId);
        const computedStatus = computeAutoProjectStatus(projectTasks, targetProj.status);
        if (computedStatus !== targetProj.status) {
          setProjects((prev) =>
            prev.map((p) => (p.id === targetProjectId ? { ...p, status: computedStatus } : p))
          );
          fetch(`/api/projects/${targetProjectId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: computedStatus }),
          }).catch((err) => console.warn("Failed to auto-update project status on backend:", err));
        }
      }
    }

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
  ): Promise<{ success: boolean; error?: string; isDuplicate?: boolean; isSizeExceeded?: boolean }> => {
    const targetTask = tasksRef.current.find((t) => t.id === taskId) || tasks.find((t) => t.id === taskId);
    if (!targetTask) {
      return { success: false, error: "Task not found." };
    }

    const targetProject = projects.find((p) => p.id === targetTask.projectId);
    const projectTasks = (tasksRef.current.length > 0 ? tasksRef.current : tasks).filter((t) => t.projectId === targetTask.projectId);
    const existingFile = [
      ...(targetProject?.attachments || []),
      ...projectTasks.flatMap((t) => t.attachments || [])
    ].find((att) => att.name.trim().toLowerCase() === file.name.trim().toLowerCase());

    if (existingFile) {
      return {
        success: false,
        isDuplicate: true,
        error: `A file named "${file.name}" is already uploaded to this project. Duplicate uploads are blocked.`
      };
    }

    const MAX_UPLOAD_FILE_BYTES = 100 * 1024 * 1024; // 100 MB limit
    if (file.rawFile && file.rawFile.size > MAX_UPLOAD_FILE_BYTES) {
      return {
        success: false,
        isSizeExceeded: true,
        error: `File size exceeds limit: "${file.name}" (${file.size}) exceeds the maximum upload limit of 100 MB. Please choose a smaller file or attach an external deliverable link.`,
      };
    }

    if (file.rawFile) {
      try {
        let uploadRes: Response;
        let directCloudSuccess = false;
        let cloudUrl = "";
        let cloudPublicId = "";

        // Attempt direct signed upload to Cloudinary to bypass Vercel serverless request body limits (4.5 MB)
        try {
          const signRes = await fetch("/api/upload/sign");
          if (signRes.ok) {
            const signData = await signRes.json();
            if (signData.configured && signData.signature && signData.apiKey && signData.cloudName) {
              const cloudFormData = new FormData();
              cloudFormData.append("file", file.rawFile);
              cloudFormData.append("api_key", signData.apiKey);
              cloudFormData.append("timestamp", signData.timestamp.toString());
              cloudFormData.append("signature", signData.signature);
              cloudFormData.append("folder", signData.folder);

              const ext = file.name.split(".").pop()?.toLowerCase() || "";
              const isImage = ["png", "jpg", "jpeg", "webp"].includes(ext) || file.type === "image" || (file.rawFile.type || "").startsWith("image/");
              const endpointType = isImage ? "image" : "raw";

              const cloudRes = await fetch(
                `https://api.cloudinary.com/v1_1/${signData.cloudName}/${endpointType}/upload`,
                {
                  method: "POST",
                  body: cloudFormData,
                }
              );

              if (cloudRes.ok) {
                const cloudJson = await cloudRes.json();
                cloudUrl = cloudJson.secure_url || cloudJson.url || "";
                cloudPublicId = cloudJson.public_id || "";
                directCloudSuccess = !!cloudUrl;
              }
            }
          }
        } catch (signErr) {
          console.warn("Direct Cloudinary upload attempt fallback:", signErr);
        }

        if (directCloudSuccess && cloudUrl) {
          uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directUrl: cloudUrl,
              publicId: cloudPublicId,
              name: file.name,
              size: file.size,
              type: file.type,
              taskId,
              uploadedBy: currentUser.id,
              uploadedByName: currentUser.fullName,
            }),
          });
        } else {
          const formData = new FormData();
          formData.append("file", file.rawFile);
          formData.append("taskId", taskId);
          formData.append("name", file.name);
          formData.append("uploadedBy", currentUser.id);
          formData.append("uploadedByName", currentUser.fullName);

          uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
        }

        if (!uploadRes.ok) {
          let errData: any = null;
          try {
            errData = await uploadRes.json();
          } catch {
            errData = null;
          }
          let errorMessage = errData?.error;
          if (!errorMessage) {
            if (uploadRes.status === 413) {
              errorMessage = `File size exceeds the allowable limit (100 MB). Please choose a smaller file or attach an external deliverable link.`;
            } else {
              errorMessage = "Unable to complete file upload. Please verify the file and try again.";
            }
          }
          return {
            success: false,
            isDuplicate: Boolean(errData?.isDuplicate),
            isSizeExceeded: Boolean(errData?.isSizeExceeded || uploadRes.status === 413),
            error: errorMessage,
          };
        }

        const uploadData = await uploadRes.json();
        const finalUrl = uploadData?.attachment?.url || uploadData?.url;
        if (!finalUrl || finalUrl.startsWith("blob:")) {
          return {
            success: false,
            error: "Uploaded file URL is invalid. Please try again.",
          };
        }

        const attachmentId = uploadData?.attachment?.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const finalAttachment: TaskAttachment = {
          id: attachmentId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: finalUrl,
          uploadedBy: currentUser.id,
          uploadedByName: currentUser.fullName,
          uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };

        const newActivityItem = {
          id: `act-${Date.now()}`,
          title: `Deliverable uploaded: ${file.name}`,
          detail: `Uploaded by ${currentUser.fullName}`,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };

        setTasks((prev) => {
          const updated = prev.map((t) => {
            if (t.id === taskId) {
              const currentAtts = (t.attachments || []).filter(
                (a) => a.name.trim().toLowerCase() !== file.name.trim().toLowerCase()
              );
              return {
                ...t,
                attachments: [finalAttachment, ...currentAtts],
                activity: [newActivityItem, ...(t.activity || [])],
              };
            }
            return t;
          });
          tasksRef.current = updated;
          try {
            localStorage.setItem("teamflow_tasks", JSON.stringify(updated));
          } catch {}
          return updated;
        });

        return { success: true };
      } catch (uploadErr: unknown) {
        console.error("Could not upload to backend:", uploadErr);
        return { success: false, error: "A network error occurred while uploading. Please check your connection and try again." };
      }
    } else {
      if (!file.url || file.url.startsWith("blob:")) {
        return { success: false, error: "Please provide a valid file or external URL." };
      }

      const attachmentId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newAttachment: TaskAttachment = {
        id: attachmentId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url,
        uploadedBy: currentUser.id,
        uploadedByName: currentUser.fullName,
        uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };

      const newActivityItem = {
        id: `act-${Date.now()}`,
        title: `Deliverable uploaded: ${file.name}`,
        detail: `Uploaded by ${currentUser.fullName}`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };

      setTasks((prev) => {
        const updated = prev.map((t) => {
          if (t.id === taskId) {
            const currentAtts = (t.attachments || []).filter(
              (a) => a.name.trim().toLowerCase() !== file.name.trim().toLowerCase()
            );
            return {
              ...t,
              attachments: [newAttachment, ...currentAtts],
              activity: [newActivityItem, ...(t.activity || [])],
            };
          }
          return t;
        });
        tasksRef.current = updated;
        try {
          localStorage.setItem("teamflow_tasks", JSON.stringify(updated));
        } catch {}
        return updated;
      });

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
      return { success: true };
    }
  };

  const uploadProjectMedia = async (
    projectId: string,
    file: {
      name: string;
      size: string;
      type: "image" | "pdf" | "figma" | "zip" | "doc";
      url?: string;
      rawFile?: File | null;
    }
  ): Promise<{ success: boolean; error?: string; isDuplicate?: boolean; isSizeExceeded?: boolean }> => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) {
      return { success: false, error: "Project not found." };
    }

    const projectTasks = (tasksRef.current.length > 0 ? tasksRef.current : tasks).filter((t) => t.projectId === projectId);
    const existingFileNames = new Set<string>();
    (targetProject.attachments || []).forEach((a) => existingFileNames.add(a.name.trim().toLowerCase()));
    projectTasks.forEach((t) => (t.attachments || []).forEach((a) => existingFileNames.add(a.name.trim().toLowerCase())));

    if (existingFileNames.has(file.name.trim().toLowerCase())) {
      return {
        success: false,
        isDuplicate: true,
        error: `A file named "${file.name}" is already uploaded to this project. Duplicate uploads are blocked.`
      };
    }

    const MAX_UPLOAD_FILE_BYTES = 100 * 1024 * 1024; // 100 MB limit
    if (file.rawFile && file.rawFile.size > MAX_UPLOAD_FILE_BYTES) {
      return {
        success: false,
        isSizeExceeded: true,
        error: `File size exceeds limit: "${file.name}" (${file.size}) exceeds the maximum upload limit of 100 MB. Please choose a smaller file or attach an external deliverable link.`,
      };
    }

    if (file.rawFile) {
      try {
        let uploadRes: Response;
        let directCloudSuccess = false;
        let cloudUrl = "";
        let cloudPublicId = "";

        // Attempt direct signed upload to Cloudinary to bypass Vercel serverless request body limits (4.5 MB)
        try {
          const signRes = await fetch("/api/upload/sign");
          if (signRes.ok) {
            const signData = await signRes.json();
            if (signData.configured && signData.signature && signData.apiKey && signData.cloudName) {
              const cloudFormData = new FormData();
              cloudFormData.append("file", file.rawFile);
              cloudFormData.append("api_key", signData.apiKey);
              cloudFormData.append("timestamp", signData.timestamp.toString());
              cloudFormData.append("signature", signData.signature);
              cloudFormData.append("folder", signData.folder);

              const ext = file.name.split(".").pop()?.toLowerCase() || "";
              const isImage = ["png", "jpg", "jpeg", "webp"].includes(ext) || file.type === "image" || (file.rawFile.type || "").startsWith("image/");
              const endpointType = isImage ? "image" : "raw";

              const cloudRes = await fetch(
                `https://api.cloudinary.com/v1_1/${signData.cloudName}/${endpointType}/upload`,
                {
                  method: "POST",
                  body: cloudFormData,
                }
              );

              if (cloudRes.ok) {
                const cloudJson = await cloudRes.json();
                cloudUrl = cloudJson.secure_url || cloudJson.url || "";
                cloudPublicId = cloudJson.public_id || "";
                directCloudSuccess = !!cloudUrl;
              }
            }
          }
        } catch (signErr) {
          console.warn("Direct Cloudinary upload attempt fallback:", signErr);
        }

        if (directCloudSuccess && cloudUrl) {
          uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directUrl: cloudUrl,
              publicId: cloudPublicId,
              name: file.name,
              size: file.size,
              type: file.type,
              projectId,
              uploadedBy: currentUser.id,
              uploadedByName: currentUser.fullName,
            }),
          });
        } else {
          const formData = new FormData();
          formData.append("file", file.rawFile);
          formData.append("projectId", projectId);
          formData.append("name", file.name);
          formData.append("uploadedBy", currentUser.id);
          formData.append("uploadedByName", currentUser.fullName);

          uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
        }

        if (!uploadRes.ok) {
          let errData: any = null;
          try {
            errData = await uploadRes.json();
          } catch {
            errData = null;
          }
          let errorMessage = errData?.error;
          if (!errorMessage) {
            if (uploadRes.status === 413) {
              errorMessage = `File size exceeds the allowable limit (100 MB). Please choose a smaller file or attach an external deliverable link.`;
            } else {
              errorMessage = "Unable to complete file upload. Please verify the file and try again.";
            }
          }
          return {
            success: false,
            isDuplicate: Boolean(errData?.isDuplicate),
            isSizeExceeded: Boolean(errData?.isSizeExceeded || uploadRes.status === 413),
            error: errorMessage,
          };
        }

        const uploadData = await uploadRes.json();
        const finalUrl = uploadData?.attachment?.url || uploadData?.url;
        if (!finalUrl || finalUrl.startsWith("blob:")) {
          return {
            success: false,
            error: "Uploaded file URL is invalid. Please try again.",
          };
        }

        const attachmentId = uploadData?.attachment?.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const finalAttachment: TaskAttachment = {
          id: attachmentId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: finalUrl,
          uploadedBy: currentUser.id,
          uploadedByName: currentUser.fullName,
          uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };

        setProjects((prev) => {
          const updated = prev.map((p) => {
            if (p.id === projectId) {
              const curAtts = (p.attachments || []).filter(
                (a) => a.name.trim().toLowerCase() !== file.name.trim().toLowerCase()
              );
              return {
                ...p,
                attachments: [finalAttachment, ...curAtts],
              };
            }
            return p;
          });
          try {
            localStorage.setItem("teamflow_projects", JSON.stringify(updated));
          } catch {}
          return updated;
        });

        return { success: true };
      } catch (uploadErr: unknown) {
        console.error("Could not upload project media to backend:", uploadErr);
        return { success: false, error: "A network error occurred while uploading. Please check your connection and try again." };
      }
    } else {
      if (!file.url || file.url.startsWith("blob:")) {
        return { success: false, error: "Please provide a valid file or external URL." };
      }

      const attachmentId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newAttachment: TaskAttachment = {
        id: attachmentId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url,
        uploadedBy: currentUser.id,
        uploadedByName: currentUser.fullName,
        uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };

      setProjects((prev) => {
        const updated = prev.map((p) => {
          if (p.id === projectId) {
            const curAtts = (p.attachments || []).filter(
              (a) => a.name.trim().toLowerCase() !== file.name.trim().toLowerCase()
            );
            return {
              ...p,
              attachments: [newAttachment, ...curAtts],
            };
          }
          return p;
        });
        try {
          localStorage.setItem("teamflow_projects", JSON.stringify(updated));
        } catch {}
        return updated;
      });

      fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachments: [newAttachment, ...(targetProject.attachments || [])]
        }),
      }).catch((err) => console.warn("Failed to sync project media to backend:", err));

      return { success: true };
    }
  };

  const deleteProjectMedia = async (projectId: string, attachmentId: string): Promise<boolean> => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return false;

    const updatedAttachments = (targetProject.attachments || []).filter((att) => att.id !== attachmentId);

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            attachments: updatedAttachments
          };
        }
        return p;
      })
    );

    setMediaDeletionRequests((prev) =>
      prev.filter((r) => r.attachmentId !== attachmentId)
    );

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachments: updatedAttachments
        }),
      });
    } catch (err) {
      console.warn("Failed to persist project media deletion:", err);
    }

    return true;
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
                userName: targetUser?.fullName || targetUser?.name || existingYesterday.userName,
                userRole: targetUser?.role || existingYesterday.userRole,
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
    const interval = setInterval(checkAndHandleMidnightRollover, 60000);
    return () => clearInterval(interval);
  }, [checkAndHandleMidnightRollover]);

  const handleAutoClockOut = useCallback((userId: string, targetTimestamp: number, reason: "sleep" | "tab_closed" | "heartbeat_timeout") => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    setUserClockInData((prev) => {
      const userState = prev[userId];
      if (!userState || !userState.isClockedIn) return prev;

      const clockInTs = userState.clockInTimestamp || targetTimestamp;
      const effectiveTargetTs = Math.max(clockInTs, targetTimestamp);
      const sessionSeconds = Math.max(1, Math.floor((effectiveTargetTs - clockInTs) / 1000));
      const totalElapsed = (userState.elapsedSeconds || 0) + sessionSeconds;
      const targetDateObj = new Date(effectiveTargetTs);
      const clockOutTimeStr = targetDateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const formattedDuration = formatSecondsToDuration(totalElapsed);
      const sessionDuration = formatSecondsToDuration(sessionSeconds);
      const clockInDate = userState.clockInDate || getLocalDateString(targetDateObj);

      const existingSessions = userState.sessions ? [...userState.sessions] : [];
      let updatedSessions: PunchSession[];
      if (existingSessions.length > 0) {
        updatedSessions = existingSessions.map((s, idx) => {
          if (idx === existingSessions.length - 1) {
            return {
              ...s,
              clockOut: clockOutTimeStr,
              duration: sessionDuration,
              elapsedSeconds: sessionSeconds,
            };
          }
          return s;
        });
      } else {
        updatedSessions = [
          {
            sessionNumber: 1,
            clockIn: userState.clockInTimeString || clockOutTimeStr,
            clockOut: clockOutTimeStr,
            duration: formattedDuration,
            elapsedSeconds: totalElapsed,
          },
        ];
      }

      const nextState: UserClockInState = {
        isClockedIn: false,
        clockInTimestamp: null,
        clockInTimeString: userState.clockInTimeString || clockOutTimeStr,
        clockOutTimeString: clockOutTimeStr,
        elapsedSeconds: totalElapsed,
        clockInDate,
        sessions: updatedSessions,
        lastHeartbeat: null,
        autoClockOutReason: reason,
      };

      setAttendance((prevAtt) => {
        const existing = prevAtt.find((r) => r.userId === userId && r.date === clockInDate);
        if (existing) {
          const updatedRecord: AttendanceRecord = {
            ...existing,
            userName: targetUser.fullName || targetUser.name || existing.userName,
            userRole: targetUser.role || existing.userRole,
            clockOut: clockOutTimeStr,
            duration: formattedDuration,
            status: "Checked Out",
            sessions: updatedSessions,
          };
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedRecord),
          }).catch(() => null);
          return prevAtt.map((r) => (r.id === existing.id ? updatedRecord : r));
        } else {
          const checkInPunch = userState.clockInTimeString || clockOutTimeStr;
          const newRecord: AttendanceRecord = {
            id: `att-${userId}-${clockInDate}`,
            userId: targetUser.id,
            userName: targetUser.fullName,
            userRole: targetUser.role,
            date: clockInDate,
            clockIn: checkInPunch,
            clockOut: clockOutTimeStr,
            duration: formattedDuration,
            status: "Checked Out",
            sessions: updatedSessions,
          };
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRecord),
          }).catch(() => null);
          return [newRecord, ...prevAtt];
        }
      });

      fetch("/api/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...nextState }),
      }).catch(() => null);

      if (userId === currentUserIdRef.current && reason === "sleep") {
        setSleepNotice({
          time: clockOutTimeStr,
          duration: formattedDuration,
          reason: "Device sleep detected",
        });
      }

      return {
        ...prev,
        [userId]: nextState,
      };
    });
  }, [users]);

  // Active Application & Sleep Detection Lifecycle
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Multi-tab tracking key
    const TAB_ID = "tab_" + Math.random().toString(36).substring(2, 9);
    const TAB_STORAGE_KEY = "teamflow_open_tabs_v1";

    const registerTab = () => {
      try {
        const raw = localStorage.getItem(TAB_STORAGE_KEY);
        const tabs = raw ? JSON.parse(raw) : {};
        tabs[TAB_ID] = Date.now();
        localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(tabs));
      } catch {}
    };

    const unregisterTab = (): number => {
      try {
        const raw = localStorage.getItem(TAB_STORAGE_KEY);
        if (!raw) return 0;
        const tabs = JSON.parse(raw);
        delete tabs[TAB_ID];
        const now = Date.now();
        const active = Object.entries(tabs).filter(([, ts]) => now - Number(ts) < 8000);
        const updated = Object.fromEntries(active);
        localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(updated));
        return Object.keys(updated).length;
      } catch {
        return 0;
      }
    };

    registerTab();
    const tabHeartbeat = setInterval(registerTab, 3000);

    // Reload grace period restoration check
    try {
      const navEntries = typeof performance !== "undefined" && performance.getEntriesByType
        ? performance.getEntriesByType("navigation")
        : [];
      const isReload = navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === "reload";
      const rawUnload = sessionStorage.getItem("teamflow_unload_state");
      if (isReload && rawUnload) {
        const unloadData = JSON.parse(rawUnload);
        if (
          unloadData.userId === currentUserIdRef.current &&
          unloadData.state?.isClockedIn &&
          Date.now() - unloadData.time < 5000
        ) {
          // Restore active clock-in session across quick reload
          setUserClockInData((prev) => ({
            ...prev,
            [unloadData.userId]: unloadData.state,
          }));
          fetch("/api/clock-in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: unloadData.userId, ...unloadData.state }),
          }).catch(() => null);
        }
      }
      sessionStorage.removeItem("teamflow_unload_state");
    } catch {}

    // Sleep Detection & Heartbeat Engine (Web Worker maintains heartbeat in background tabs)
    let worker: Worker | null = null;
    let workerUrl: string | null = null;
    let lastLocalTick = Date.now();

    const sendHeartbeat = () => {
      const curUserId = currentUserIdRef.current;
      const curState = userClockInDataRef.current[curUserId];
      if (curState && curState.isClockedIn) {
        fetch("/api/clock-in/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: curUserId }),
        }).catch(() => null);
      }
    };

    const onSleepDetected = (sleepStartedAt: number, gapMs: number) => {
      const curUserId = currentUserIdRef.current;
      const curState = userClockInDataRef.current[curUserId];
      if (curState && curState.isClockedIn) {
        console.warn(
          `[TeamFlow] Device sleep detected (${Math.round(gapMs / 1000)}s gap). Clocking out at ${new Date(sleepStartedAt).toLocaleTimeString()}`
        );
        handleAutoClockOut(curUserId, sleepStartedAt, "sleep");
      }
    };

    try {
      const workerBlob = new Blob(
        [
          `
          let last = Date.now();
          let lastHeartbeat = Date.now();
          setInterval(function() {
            var now = Date.now();
            var diff = now - last;
            last = now;

            // Genuine OS/laptop sleep: CPU thread completely halted for > 35 seconds
            if (diff > 35000) {
              postMessage({ type: 'SLEEP_DETECTED', sleepStartedAt: now - diff, diff: diff });
            }

            // Periodic heartbeat ping every 15s (Web Workers stay active in background tabs)
            if (now - lastHeartbeat >= 15000) {
              lastHeartbeat = now;
              postMessage({ type: 'HEARTBEAT_TICK' });
            }
          }, 2000);
          `
        ],
        { type: "application/javascript" }
      );
      workerUrl = URL.createObjectURL(workerBlob);
      worker = new Worker(workerUrl);
      worker.onmessage = (e) => {
        if (e.data?.type === "SLEEP_DETECTED") {
          onSleepDetected(e.data.sleepStartedAt, e.data.diff);
        } else if (e.data?.type === "HEARTBEAT_TICK") {
          sendHeartbeat();
        }
      };
    } catch (e) {
      console.warn("[TeamFlow] Web Worker unavailable for sleep detection, falling back to window events", e);
    }

    // Window events fallback for sleep detection
    const checkGap = () => {
      const now = Date.now();
      const diff = now - lastLocalTick;
      lastLocalTick = now;

      // DO NOT clock out when returning to an inactive tab!
      // Only clock out if Web Worker is unavailable, diff > 45s, and tab is currently visible
      if (!worker && diff > 45000 && document.visibilityState === "visible") {
        onSleepDetected(now - diff, diff);
      }
    };

    const windowInterval = setInterval(checkGap, 3000);
    // When tab becomes active or focused, only refresh lastLocalTick so it never triggers false sleep
    const onTabRevisit = () => {
      lastLocalTick = Date.now();
    };
    window.addEventListener("focus", onTabRevisit);
    window.addEventListener("pageshow", onTabRevisit);
    document.addEventListener("visibilitychange", onTabRevisit);

    // Fallback Periodic Heartbeat only if Web Worker is unavailable
    const heartbeatInterval = !worker ? setInterval(sendHeartbeat, 15000) : null;

    // Page Unload / Application Close Auto Clock-Out
    const handleUnload = () => {
      const remainingTabs = unregisterTab();
      if (remainingTabs > 0) return; // Keep clock-in active if other tabs of TeamFlow are still open

      const curUserId = currentUserIdRef.current;
      const curState = userClockInDataRef.current[curUserId];
      if (curState && curState.isClockedIn) {
        const now = Date.now();
        const payload = JSON.stringify({
          userId: curUserId,
          timestamp: now,
          reason: "tab_closed",
        });

        try {
          sessionStorage.setItem(
            "teamflow_unload_state",
            JSON.stringify({ userId: curUserId, state: curState, time: now })
          );
        } catch {}

        try {
          fetch("/api/clock-in/auto-out", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          });
        } catch {
          if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: "application/json" });
            navigator.sendBeacon("/api/clock-in/auto-out", blob);
          }
        }
      }
    };

    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(tabHeartbeat);
      clearInterval(windowInterval);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      window.removeEventListener("focus", onTabRevisit);
      window.removeEventListener("pageshow", onTabRevisit);
      document.removeEventListener("visibilitychange", onTabRevisit);
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
      if (worker) {
        worker.terminate();
      }
      if (workerUrl) {
        URL.revokeObjectURL(workerUrl);
      }
      unregisterTab();
    };
  }, [handleAutoClockOut]);

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
      setSleepNotice(null);
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
          const firstPunch = existingToday.clockIn && existingToday.clockIn !== "—" ? existingToday.clockIn : timeString;
          const updatedRecord: AttendanceRecord = {
            ...existingToday,
            userName: targetUser.fullName || targetUser.name || existingToday.userName,
            userRole: targetUser.role || existingToday.userRole,
            clockIn: firstPunch,
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
              userName: targetUser.fullName || targetUser.name || prevRec.userName,
              userRole: targetUser.role || prevRec.userRole,
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
            clockIn: existingToday?.clockIn || "12:00 AM",
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
              userName: targetUser.fullName || targetUser.name || existingToday.userName,
              userRole: targetUser.role || existingToday.userRole,
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
            const firstPunch = userState.clockInTimeString || timeString;
            const newRecord: AttendanceRecord = {
              id: `att-${userId}-${todayString}`,
              userId: targetUser.id,
              userName: targetUser.fullName,
              userRole: targetUser.role,
              date: todayString,
              clockIn: firstPunch,
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

  const currentUserClockIn: UserClockInState = useMemo(() => {
    return userClockInData[currentUserId] || DEFAULT_INACTIVE_CLOCK_IN_STATE;
  }, [userClockInData, currentUserId]);

  const isClockedIn = currentUserClockIn.isClockedIn;

  const toggleClockInOut = useCallback(() => {
    toggleUserClockIn(currentUserId);
  }, [toggleUserClockIn, currentUserId]);

  const getProjectTasks = useCallback((projectId: string) => {
    return tasks.filter((t) => t.projectId === projectId);
  }, [tasks]);

  const getUserAssignedTasks = useCallback((userId: string, projectId?: string) => {
    return tasks.filter((t) => {
      const matchesUser = t.assignedTo === userId;
      if (projectId) return matchesUser && t.projectId === projectId;
      return matchesUser;
    });
  }, [tasks]);

  const getProjectTeamLead = useCallback((projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return undefined;
    return users.find((u) => u.id === project.teamLeadId);
  }, [projects, users]);

  const getProjectManager = useCallback((projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return undefined;
    return users.find((u) => u.id === project.projectManagerId);
  }, [projects, users]);

  const isUserTeamLead = useCallback((userId: string, projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return false;
    return project.teamLeadId === userId;
  }, [projects]);

  const getAllMedia = useCallback(() => {
    const list: Array<TaskAttachment & { projectTitle: string; taskTitle: string; projectId: string }> = [];
    const projectMap = new Map<string, Project>();
    projects.forEach((proj) => {
      projectMap.set(proj.id, proj);
      (proj.attachments || []).forEach((att) => {
        list.push({
          ...att,
          projectTitle: proj.name,
          taskTitle: "Project Deliverable",
          projectId: proj.id,
        });
      });
    });
    tasks.forEach((t) => {
      const proj = projectMap.get(t.projectId);
      (t.attachments || []).forEach((att) => {
        list.push({
          ...att,
          projectTitle: proj ? proj.name : "Unknown Project",
          taskTitle: t.title,
          projectId: t.projectId
        });
      });
    });
    return list;
  }, [projects, tasks]);

  const getProjectMedia = useCallback((projectId: string) => {
    const list: Array<TaskAttachment & { taskTitle: string }> = [];
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      (proj.attachments || []).forEach((att) => {
        list.push({
          ...att,
          taskTitle: "Project Deliverable",
        });
      });
    }
    tasks
      .filter((t) => t.projectId === projectId)
      .forEach((t) => {
        (t.attachments || []).forEach((att) => {
          list.push({
            ...att,
            taskTitle: t.title
          });
        });
      });
    return list;
  }, [projects, tasks]);

  const canUserDeleteMedia = (projectId: string): boolean => {
    if (currentUser.role === "ceo") return true;
    if (currentUser.role === "project_manager") return true;
    return isUserTeamLead(currentUser.id, projectId);
  };

  const deleteTaskMedia = async (taskId: string, attachmentId: string): Promise<boolean> => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) {
      for (const p of projects) {
        if ((p.attachments || []).some((a) => a.id === attachmentId)) {
          return deleteProjectMedia(p.id, attachmentId);
        }
      }
      return false;
    }

    const targetAtt = targetTask.attachments.find((att) => att.id === attachmentId);
    const fileName = targetAtt?.name || "Media asset";

    const roleLabel =
      currentUser.role === "ceo"
        ? "CEO"
        : currentUser.role === "project_manager"
        ? "Project Manager"
        : "Team Lead";

    const deleteActivityItem = {
      id: `act-${Date.now()}`,
      title: `Deliverable deleted: ${fileName}`,
      detail: `Deleted by ${currentUser.fullName} (${roleLabel})`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    const updatedAttachments = targetTask.attachments.filter((att) => att.id !== attachmentId);
    const updatedActivity = [deleteActivityItem, ...targetTask.activity];

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            attachments: updatedAttachments,
            activity: updatedActivity,
          };
        }
        return t;
      })
    );

    setMediaDeletionRequests((prev) =>
      prev.filter((r) => r.attachmentId !== attachmentId)
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachments: updatedAttachments,
          activity: updatedActivity,
          updatedByName: currentUser.fullName,
        }),
      });
    } catch (err) {
      console.warn("Failed to persist media deletion to backend:", err);
    }

    return true;
  };

  const requestMediaDeletion = async ({
    taskId,
    projectId,
    attachmentId,
    reason,
  }: {
    taskId?: string;
    projectId?: string;
    attachmentId: string;
    reason: string;
  }): Promise<boolean> => {
    let targetAtt: TaskAttachment | undefined;
    let project: Project | undefined;
    let taskTitle = "Project Deliverable";

    const targetTask = taskId ? tasks.find((t) => t.id === taskId) : undefined;
    if (targetTask) {
      targetAtt = targetTask.attachments.find((att) => att.id === attachmentId);
      project = projects.find((p) => p.id === targetTask.projectId);
      taskTitle = targetTask.title;
    } else {
      const pId = projectId;
      if (pId) {
        project = projects.find((p) => p.id === pId);
        targetAtt = (project?.attachments || []).find((att) => att.id === attachmentId);
      }
      if (!targetAtt) {
        for (const p of projects) {
          const found = (p.attachments || []).find((att) => att.id === attachmentId);
          if (found) {
            targetAtt = found;
            project = p;
            break;
          }
        }
      }
    }

    if (!targetAtt || !project) return false;

    const teamLead = users.find((u) => u.id === project?.teamLeadId);

    const newRequest: MediaDeletionRequest = {
      id: `del-req-${Date.now()}`,
      attachmentId: targetAtt.id,
      attachmentName: targetAtt.name,
      attachmentUrl: targetAtt.url,
      attachmentType: targetAtt.type,
      attachmentSize: targetAtt.size,
      taskId: targetTask?.id || "",
      taskTitle,
      projectId: project.id,
      projectName: project.name,
      projectCode: project.code,
      teamLeadId: project.teamLeadId || "",
      teamLeadName: teamLead?.fullName || "Team Lead",
      requestedBy: currentUser.id,
      requestedByName: currentUser.fullName,
      requestedByRole: currentUser.role,
      requestedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      reason: reason.trim() || "No specific reason provided.",
      status: "Pending",
    };

    setMediaDeletionRequests((prev) => [newRequest, ...prev]);

    if (targetTask) {
      const newActivityItem = {
        id: `act-${Date.now()}`,
        title: `Deletion requested: ${targetAtt.name}`,
        detail: `Requested by ${currentUser.fullName} to Team Lead ${teamLead?.fullName || "Project Lead"}. Reason: ${newRequest.reason}`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === targetTask.id) {
            return {
              ...t,
              activity: [newActivityItem, ...t.activity],
            };
          }
          return t;
        })
      );

      try {
        await fetch(`/api/tasks/${targetTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activity: [newActivityItem, ...targetTask.activity],
            updatedByName: currentUser.fullName,
          }),
        });
      } catch {}
    }

    return true;
  };

  const resolveMediaDeletionRequest = async (
    requestId: string,
    action: "approve" | "reject",
    notes?: string
  ): Promise<boolean> => {
    const req = mediaDeletionRequests.find((r) => r.id === requestId);
    if (!req) return false;

    const reviewerRole =
      currentUser.role === "ceo"
        ? "CEO"
        : currentUser.role === "project_manager"
        ? "Project Manager"
        : "Team Lead";
    const reviewedAt = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const nextStatus = action === "approve" ? "Approved" : "Rejected";

    if (action === "approve") {
      if (req.taskId) {
        await deleteTaskMedia(req.taskId, req.attachmentId);
      }
      await deleteProjectMedia(req.projectId, req.attachmentId);
    } else {
      if (req.taskId) {
        const targetTask = tasks.find((t) => t.id === req.taskId);
        if (targetTask) {
          const rejectActivity = {
            id: `act-${Date.now()}`,
            title: `Deletion request declined: ${req.attachmentName}`,
            detail: `Declined by ${currentUser.fullName} (${reviewerRole}). Notes: ${notes || "Declined by project authority."}`,
            date: reviewedAt,
          };
          setTasks((prev) =>
            prev.map((t) => (t.id === req.taskId ? { ...t, activity: [rejectActivity, ...t.activity] } : t))
          );
          fetch(`/api/tasks/${req.taskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              activity: [rejectActivity, ...targetTask.activity],
              updatedByName: currentUser.fullName,
            }),
          }).catch(() => null);
        }
      }
    }

    setMediaDeletionRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: nextStatus,
              reviewedBy: currentUser.id,
              reviewedByName: currentUser.fullName,
              reviewedByRole: reviewerRole,
              reviewedAt,
              notes: notes || undefined,
            }
          : r
      )
    );

    return true;
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
      currentUser.role === "project_manager";
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
      reviewedByRole: isDirectApproval ? currentUser.role : undefined,
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

      const newLeaveReq: LeaveRequest = data.leaveRequest || {
        id: `leave-${Date.now()}`,
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
        reviewedByRole: isDirectApproval ? (currentUser.role as "ceo" | "project_manager") : undefined,
        createdAt: new Date().toISOString(),
      };
      setLeaveRequests((prev) => [newLeaveReq, ...prev.filter((r) => r.id !== newLeaveReq.id)]);

      if (finalStatus === "Approved") {
        const dates = getDatesInRange(params.startDate, params.endDate || params.startDate);
        const todayStr = getLocalDateString(new Date());

        setAttendance((prev) => {
          const updated = [...prev];
          for (const d of dates) {
            const isSunday = new Date(d + "T00:00:00").getDay() === 0;
            const isOfficeLeave = officeLeaves.some((ol) => {
              const olEnd = ol.endDate || ol.date;
              return d >= ol.date && d <= olEnd;
            });
            if (isSunday || isOfficeLeave) {
              continue;
            }

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
          reviewedByRole: currentUser.role,
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
                reviewedByRole: currentUser.role as "ceo" | "project_manager",
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
              const isSunday = new Date(d + "T00:00:00").getDay() === 0;
              const isOfficeLeave = officeLeaves.some((ol) => {
                const olEnd = ol.endDate || ol.date;
                return d >= ol.date && d <= olEnd;
              });
              if (isSunday || isOfficeLeave) {
                continue;
              }

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

  const createOfficeLeave = async (data: { title: string; date: string; endDate?: string }): Promise<boolean> => {
    const payload = {
      title: data.title,
      date: data.date,
      endDate: data.endDate,
      declaredById: currentUser.id,
      declaredByName: currentUser.fullName,
      declaredByRole: currentUser.role,
    };
    try {
      const res = await fetch("/api/office-leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.officeLeave) {
          setOfficeLeaves((prev) => [json.officeLeave, ...prev.filter((l) => l.id !== json.officeLeave.id)]);
          return true;
        }
      }
      const newLeave: OfficeLeave = {
        id: `ol-${Date.now()}`,
        title: data.title,
        date: data.date,
        endDate: data.endDate || data.date,
        declaredById: currentUser.id,
        declaredByName: currentUser.fullName,
        declaredByRole: currentUser.role,
        createdAt: new Date().toISOString(),
      };
      setOfficeLeaves((prev) => [newLeave, ...prev]);
      return true;
    } catch {
      const newLeave: OfficeLeave = {
        id: `ol-${Date.now()}`,
        title: data.title,
        date: data.date,
        endDate: data.endDate || data.date,
        declaredById: currentUser.id,
        declaredByName: currentUser.fullName,
        declaredByRole: currentUser.role,
        createdAt: new Date().toISOString(),
      };
      setOfficeLeaves((prev) => [newLeave, ...prev]);
      return true;
    }
  };

  const deleteOfficeLeave = async (id: string): Promise<boolean> => {
    try {
      await fetch(`/api/office-leaves?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setOfficeLeaves((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch {
      setOfficeLeaves((prev) => prev.filter((l) => l.id !== id));
      return true;
    }
  };

  const createTechStack = async (name: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/tech-stacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.techStack) {
          setTechStacks((prev) => [...prev, json.techStack]);
          return true;
        }
      }
      const newItem: TechStackItem = {
        id: `ts-${Date.now()}`,
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };
      setTechStacks((prev) => [...prev, newItem]);
      return true;
    } catch {
      const newItem: TechStackItem = {
        id: `ts-${Date.now()}`,
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };
      setTechStacks((prev) => [...prev, newItem]);
      return true;
    }
  };

  const updateTechStack = async (id: string, name: string): Promise<boolean> => {
    try {
      await fetch("/api/tech-stacks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      setTechStacks((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
      return true;
    } catch {
      setTechStacks((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
      return true;
    }
  };

  const deleteTechStack = async (id: string): Promise<boolean> => {
    try {
      await fetch(`/api/tech-stacks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setTechStacks((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch {
      setTechStacks((prev) => prev.filter((t) => t.id !== id));
      return true;
    }
  };

  const contextValue: TeamFlowContextType = useMemo(
    () => ({
      hasHydrated,
      jobRolesLoaded,
      currentUser,
      users,
      projects,
      tasks,
      attendance,
      userClockInData,
      currentUserClockIn,
      setCurrentUserId,
      updateUserProfile,
      updateTeamMember,
      deleteUser,
      createProject,
      updateProject,
      deleteProject,
      createTask,
      updateTask,
      deleteTask,
      uploadTaskMedia,
      uploadProjectMedia,
      deleteProjectMedia,
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
      reviewLeaveRequest,
      deleteTaskMedia,
      canUserDeleteMedia,
      mediaDeletionRequests,
      requestMediaDeletion,
      resolveMediaDeletionRequest,
      sleepNotice,
      dismissSleepNotice,
      officeLeaves,
      createOfficeLeave,
      deleteOfficeLeave,
      techStacks,
      createTechStack,
      updateTechStack,
      deleteTechStack,
      notificationPreferences,
      updateNotificationPreferences,
    }),
    [
      hasHydrated,
      jobRolesLoaded,
      currentUser,
      users,
      projects,
      tasks,
      attendance,
      userClockInData,
      currentUserClockIn,
      setCurrentUserId,
      updateUserProfile,
      updateTeamMember,
      deleteUser,
      createProject,
      updateProject,
      deleteProject,
      createTask,
      updateTask,
      deleteTask,
      uploadTaskMedia,
      uploadProjectMedia,
      deleteProjectMedia,
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
      reviewLeaveRequest,
      deleteTaskMedia,
      canUserDeleteMedia,
      mediaDeletionRequests,
      requestMediaDeletion,
      resolveMediaDeletionRequest,
      sleepNotice,
      dismissSleepNotice,
      officeLeaves,
      createOfficeLeave,
      deleteOfficeLeave,
      techStacks,
      createTechStack,
      updateTechStack,
      deleteTechStack,
      notificationPreferences,
      updateNotificationPreferences,
    ]
  );

  return (
    <TeamFlowContext.Provider value={contextValue}>
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
