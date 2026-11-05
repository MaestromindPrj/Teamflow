"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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

const DEFAULT_CLOCK_IN_DATA: Record<string, UserClockInState> = {
  "u-ceo-1": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0,
    clockInDate: undefined
  }
};

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
  updateUserProfile: (updates: Partial<User>) => void;
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
  ) => Promise<{ success: boolean; error?: string; isDuplicate?: boolean }>;
  uploadProjectMedia: (
    projectId: string,
    file: {
      name: string;
      size: string;
      type: "image" | "pdf" | "figma" | "zip" | "doc";
      url?: string;
      rawFile?: File | null;
    }
  ) => Promise<{ success: boolean; error?: string; isDuplicate?: boolean }>;
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
  }) => Promise<User & { emailSent?: boolean; emailError?: string }>;
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
}

const DEFAULT_OFFICE_LEAVES: OfficeLeave[] = [
  { id: "ol-diwali", title: "Diwali", date: "2026-11-07" },
  { id: "ol-christmas", title: "Christmas Day", date: "2026-12-25" },
  { id: "ol-newyear", title: "New Year's Day", date: "2027-01-01" }
];

const DEFAULT_TECH_STACKS: TechStackItem[] = [
  { id: "ts-nextjs", name: "Next.js" },
  { id: "ts-react", name: "React" },
  { id: "ts-typescript", name: "TypeScript" },
  { id: "ts-tailwind", name: "Tailwind CSS" },
  { id: "ts-nodejs", name: "Node.js" },
  { id: "ts-postgresql", name: "PostgreSQL" },
  { id: "ts-python", name: "Python" },
  { id: "ts-fastapi", name: "FastAPI" },
  { id: "ts-docker", name: "Docker" },
  { id: "ts-aws", name: "AWS" },
  { id: "ts-figma", name: "Figma" }
];

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

export function sanitizeTaskAttachments(t: Task): Task {
  if (!Array.isArray(t.attachments)) return t;
  const seenNames = new Set<string>();
  const deduped = t.attachments.filter((att) => {
    const key = (att.name || "").trim().toLowerCase();
    if (!key) return true;
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });
  return { ...t, attachments: deduped };
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
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_DATA);
  const [userClockInData, setUserClockInData] = useState<Record<string, UserClockInState>>(DEFAULT_CLOCK_IN_DATA);
  const [sleepNotice, setSleepNotice] = useState<{ time: string; duration: string; reason: string } | null>(null);
  const dismissSleepNotice = useCallback(() => setSleepNotice(null), []);

  const userClockInDataRef = useRef(userClockInData);
  userClockInDataRef.current = userClockInData;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;
  const [jobRoles, setJobRoles] = useState<{ id: string; name: string }[]>(DEFAULT_JOB_ROLES);
  const departments = jobRoles;
  const setDepartments = setJobRoles;
  const [categories, setCategories] = useState<ProjectCategory[]>(DEFAULT_PROJECT_CATEGORIES);
  const [rewardsLedger, setRewardsLedger] = useState<RewardLedgerEntry[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [mediaDeletionRequests, setMediaDeletionRequests] = useState<MediaDeletionRequest[]>([]);
  const [officeLeaves, setOfficeLeaves] = useState<OfficeLeave[]>(DEFAULT_OFFICE_LEAVES);
  const [techStacks, setTechStacks] = useState<TechStackItem[]>(DEFAULT_TECH_STACKS);
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
          if (Array.isArray(parsed)) setProjects(parsed.map(ensureProjectTechStack));
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
          if (Array.isArray(parsed) && parsed.length > 0) setLeaveRequests(parsed);
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
          setProjects(data.projects.map(ensureProjectTechStack));
        }
      }

      if (tasksRes && tasksRes.ok) {
        const data = await tasksRes.json();
        if (Array.isArray(data.tasks)) {
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
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      }

      if (officeLeavesRes && officeLeavesRes.ok) {
        const data = await officeLeavesRes.json();
        if (Array.isArray(data.officeLeaves)) {
          setOfficeLeaves(data.officeLeaves);
        }
      }

      if (techStacksRes && techStacksRes.ok) {
        const data = await techStacksRes.json();
        if (Array.isArray(data.techStacks)) {
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
      localStorage.setItem("teamflow_media_deletion_requests_v1", JSON.stringify(mediaDeletionRequests));
      localStorage.setItem("teamflow_leave_requests", JSON.stringify(leaveRequests));
      localStorage.setItem("teamflow_office_leaves", JSON.stringify(officeLeaves));
      localStorage.setItem("teamflow_tech_stacks", JSON.stringify(techStacks));
    } catch {}
  }, [currentUserId, projects, tasks, attendance, userClockInData, categories, mediaDeletionRequests, leaveRequests, officeLeaves, techStacks, hasHydrated]);

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
  }): Promise<User & { emailSent?: boolean; emailError?: string }> => {
    const normalizedEmail = memberData.email.trim().toLowerCase();
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
    const fallbackCode = `PRJ-${String(projects.length + 1).padStart(2, "0")}`;
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
      progress:
        taskData.status === "Completed"
          ? 100
          : taskData.status === "Review"
          ? 90
          : taskData.status === "In Progress"
          ? 50
          : 0,
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

    const nextTasks = [newTask, ...tasks];
    setTasks(nextTasks);

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
  ): Promise<{ success: boolean; error?: string; isDuplicate?: boolean }> => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) {
      return { success: false, error: "Task not found." };
    }

    const targetProject = projects.find((p) => p.id === targetTask.projectId);
    const projectTasks = tasks.filter((t) => t.projectId === targetTask.projectId);
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

    const attachmentId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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
          return { success: true };
        } else {
          const errData = await uploadRes.json().catch(() => ({}));
          if (errData?.isDuplicate) {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === taskId
                  ? { ...t, attachments: t.attachments.filter((a) => a.id !== attachmentId) }
                  : t
              )
            );
            return { success: false, isDuplicate: true, error: errData.error };
          }
          return { success: true };
        }
      } catch (uploadErr) {
        console.warn("Could not upload to backend:", uploadErr);
        return { success: true };
      }
    } else {
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
  ): Promise<{ success: boolean; error?: string; isDuplicate?: boolean }> => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) {
      return { success: false, error: "Project not found." };
    }

    const projectTasks = tasks.filter((t) => t.projectId === projectId);
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

    const attachmentId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const curAtts = p.attachments || [];
          return {
            ...p,
            attachments: [newAttachment, ...curAtts]
          };
        }
        return p;
      })
    );

    if (file.rawFile) {
      try {
        const formData = new FormData();
        formData.append("file", file.rawFile);
        formData.append("projectId", projectId);
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
            setProjects((prev) =>
              prev.map((p) => {
                if (p.id === projectId) {
                  return {
                    ...p,
                    attachments: (p.attachments || []).map((att) =>
                      att.id === attachmentId ? { ...att, url: finalUrl } : att
                    ),
                  };
                }
                return p;
              })
            );
          }
          return { success: true };
        } else {
          const errData = await uploadRes.json().catch(() => ({}));
          if (errData?.isDuplicate) {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === projectId
                  ? { ...p, attachments: (p.attachments || []).filter((a) => a.id !== attachmentId) }
                  : p
              )
            );
            return { success: false, isDuplicate: true, error: errData.error };
          }
          return { success: true };
        }
      } catch (uploadErr) {
        console.warn("Could not upload project media to backend:", uploadErr);
        return { success: true };
      }
    } else {
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
                clockOut: "12:00 AM",
                duration: day1Duration,
                status: existingYesterday.status === "Late" || isLateClockIn(existingYesterday.clockIn) ? "Late" : "Checked Out",
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
          const isLate = existing.status === "Late" || isLateClockIn(existing.clockIn);
          const updatedRecord: AttendanceRecord = {
            ...existing,
            clockOut: clockOutTimeStr,
            duration: formattedDuration,
            status: isLate ? "Late" : "Checked Out",
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
          const isLate = isLateClockIn(checkInPunch);
          const newRecord: AttendanceRecord = {
            id: `att-${userId}-${clockInDate}`,
            userId: targetUser.id,
            userName: targetUser.fullName,
            userRole: targetUser.role,
            date: clockInDate,
            clockIn: checkInPunch,
            clockOut: clockOutTimeStr,
            duration: formattedDuration,
            status: isLate ? "Late" : "Checked Out",
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

    // Sleep Detection Engine (Web Worker avoids background tab throttling)
    let worker: Worker | null = null;
    let lastLocalTick = Date.now();

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
          setInterval(function() {
            var now = Date.now();
            var diff = now - last;
            if (diff > 10000) {
              postMessage({ type: 'SLEEP_DETECTED', sleepStartedAt: last, diff: diff });
            }
            last = now;
          }, 2000);
          `
        ],
        { type: "application/javascript" }
      );
      const workerUrl = URL.createObjectURL(workerBlob);
      worker = new Worker(workerUrl);
      worker.onmessage = (e) => {
        if (e.data?.type === "SLEEP_DETECTED") {
          onSleepDetected(e.data.sleepStartedAt, e.data.diff);
        }
      };
    } catch (e) {
      console.warn("[TeamFlow] Web Worker unavailable for sleep detection, falling back to window events", e);
    }

    // Window events fallback for sleep detection
    const checkGap = () => {
      const now = Date.now();
      const diff = now - lastLocalTick;
      if (diff > 10000) {
        onSleepDetected(lastLocalTick, diff);
      }
      lastLocalTick = now;
    };

    const windowInterval = setInterval(checkGap, 2000);
    window.addEventListener("focus", checkGap);
    window.addEventListener("pageshow", checkGap);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkGap();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Periodic Heartbeat to backend (every 15s) while clocked in
    const heartbeatInterval = setInterval(() => {
      const curUserId = currentUserIdRef.current;
      const curState = userClockInDataRef.current[curUserId];
      if (curState && curState.isClockedIn) {
        fetch("/api/clock-in/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: curUserId }),
        }).catch(() => null);
      }
    }, 15000);

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
      clearInterval(heartbeatInterval);
      window.removeEventListener("focus", checkGap);
      window.removeEventListener("pageshow", checkGap);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
      if (worker) {
        worker.terminate();
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
          const isLate = existingToday.status === "Late" || isLateClockIn(firstPunch);
          const updatedRecord: AttendanceRecord = {
            ...existingToday,
            clockIn: firstPunch,
            clockOut: "—",
            status: isLate ? "Late" : "Present",
            sessions: updatedSessions,
          };
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedRecord),
          }).catch(() => null);
          return prev.map((r) => (r.id === existingToday.id ? updatedRecord : r));
        } else {
          const isLate = isLateClockIn(now);
          const newRecord: AttendanceRecord = {
            id: `att-${userId}-${todayString}`,
            userId: targetUser.id,
            userName: targetUser.fullName,
            userRole: targetUser.role,
            date: todayString,
            clockIn: timeString,
            clockOut: "—",
            duration: "00h 00m 01s",
            status: isLate ? "Late" : "Present",
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
            const isLate = prevRec.status === "Late" || isLateClockIn(prevRec.clockIn);
            const closedPrev: AttendanceRecord = {
              ...prevRec,
              clockOut: "12:00 AM",
              duration: day1Duration,
              status: isLate ? "Late" : "Checked Out",
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
          const isLate = existingToday?.status === "Late" || isLateClockIn(existingToday?.clockIn);
          const closedToday: AttendanceRecord = {
            id: existingToday ? existingToday.id : `att-rec-${Date.now()}-${userId}`,
            userId: targetUser.id,
            userName: targetUser.fullName,
            userRole: targetUser.role,
            date: todayString,
            clockIn: existingToday?.clockIn || "12:00 AM",
            clockOut: timeString,
            duration: todayDuration,
            status: isLate ? "Late" : "Checked Out",
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
            const firstPunch = existingToday.clockIn && existingToday.clockIn !== "—" ? existingToday.clockIn : (userState.clockInTimeString || timeString);
            const isLate = existingToday.status === "Late" || isLateClockIn(firstPunch);
            const updatedRecord: AttendanceRecord = {
              ...existingToday,
              clockOut: timeString,
              duration: formattedDuration,
              status: isLate ? "Late" : "Checked Out",
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
            const isLate = isLateClockIn(firstPunch);
            const newRecord: AttendanceRecord = {
              id: `att-${userId}-${todayString}`,
              userId: targetUser.id,
              userName: targetUser.fullName,
              userRole: targetUser.role,
              date: todayString,
              clockIn: firstPunch,
              clockOut: timeString,
              duration: formattedDuration,
              status: isLate ? "Late" : "Checked Out",
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
    projects.forEach((proj) => {
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
        t.attachments.forEach((att) => {
          list.push({
            ...att,
            taskTitle: t.title
          });
        });
      });
    return list;
  };

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
        deleteTechStack
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
