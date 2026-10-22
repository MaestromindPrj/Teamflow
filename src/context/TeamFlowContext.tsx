"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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

export interface UserClockInState {
  isClockedIn: boolean;
  clockInTimestamp: number | null;
  clockInTimeString: string | null;
  clockOutTimeString: string | null;
  elapsedSeconds?: number;
}

const DEFAULT_CLOCK_IN_DATA: Record<string, UserClockInState> = {
  "u-pm-1": {
    isClockedIn: true,
    clockInTimestamp: null,
    clockInTimeString: "08:45 AM",
    clockOutTimeString: null,
    elapsedSeconds: 7 * 3600 + 15 * 60 + 24
  },
  "u-pm-2": {
    isClockedIn: true,
    clockInTimestamp: null,
    clockInTimeString: "09:02 AM",
    clockOutTimeString: null,
    elapsedSeconds: 6 * 3600 + 58 * 60 + 10
  },
  "u-emp-1": {
    isClockedIn: true,
    clockInTimestamp: null,
    clockInTimeString: "09:12 AM",
    clockOutTimeString: null,
    elapsedSeconds: 6 * 3600 + 48 * 60 + 45
  },
  "u-emp-2": {
    isClockedIn: true,
    clockInTimestamp: null,
    clockInTimeString: "09:05 AM",
    clockOutTimeString: null,
    elapsedSeconds: 6 * 3600 + 55 * 60 + 30
  },
  "u-emp-3": {
    isClockedIn: true,
    clockInTimestamp: null,
    clockInTimeString: "08:30 AM",
    clockOutTimeString: null,
    elapsedSeconds: 7 * 3600 + 30 * 60 + 15
  },
  "u-emp-4": {
    isClockedIn: true,
    clockInTimestamp: null,
    clockInTimeString: "09:42 AM",
    clockOutTimeString: null,
    elapsedSeconds: 6 * 3600 + 18 * 60 + 50
  },
  "u-emp-5": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0
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
}

const TeamFlowContext = createContext<TeamFlowContextType | undefined>(undefined);

export function TeamFlowProvider({ children }: { children: React.ReactNode }) {
  const [users] = useState<User[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserIdState] = useState<string>("u-ceo-1");
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS_DATA);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_DATA);
  const [userClockInData, setUserClockInData] = useState<Record<string, UserClockInState>>(DEFAULT_CLOCK_IN_DATA);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("teamflow_current_user");
      const savedProjects = localStorage.getItem("teamflow_projects");
      const savedTasks = localStorage.getItem("teamflow_tasks");
      const savedAttendance = localStorage.getItem("teamflow_attendance");
      const savedUserClockIn = localStorage.getItem("teamflow_user_clock_in");

      const validUserIds = new Set(INITIAL_USERS.map((u) => u.id));

      if (savedUser && validUserIds.has(savedUser)) {
        setCurrentUserIdState(savedUser);
      } else {
        setCurrentUserIdState("u-ceo-1");
      }

      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        const sanitized = parsed.map((p: Project) => {
          const validMembers = (p.teamMemberIds || []).filter((id: string) => validUserIds.has(id));
          let leadId = p.teamLeadId;
          if (p.id === "proj-1") leadId = "u-emp-1";
          else if (p.id === "proj-2") leadId = "u-emp-2";
          else if (!validUserIds.has(leadId) || leadId === "u-emp-3") {
            leadId = validMembers.find((id: string) => id !== "u-emp-3" && id.startsWith("u-emp")) || "u-emp-1";
          }
          const finalMembers = Array.from(new Set([...validMembers, leadId, "u-emp-1", "u-emp-2", "u-emp-3"]));
          return {
            ...p,
            teamLeadId: leadId,
            teamMemberIds: finalMembers
          };
        });
        setProjects(sanitized);
      }

      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        const sanitized = parsed.map((t: Task) => ({
          ...t,
          assignedTo: validUserIds.has(t.assignedTo) ? t.assignedTo : "u-emp-1"
        }));
        setTasks(sanitized);
      }

      if (savedAttendance) {
        const parsed = JSON.parse(savedAttendance);
        setAttendance(parsed.filter((a: AttendanceRecord) => validUserIds.has(a.userId)));
      }

      const now = Date.now();
      if (savedUserClockIn) {
        const parsed = JSON.parse(savedUserClockIn);
        const filteredClockIn: Record<string, UserClockInState> = {};
        Object.entries(parsed).forEach(([k, v]) => {
          if (validUserIds.has(k)) {
            filteredClockIn[k] = v as UserClockInState;
          }
        });
        setUserClockInData(filteredClockIn);
      } else {
        setUserClockInData((prev) => {
          const updated: Record<string, UserClockInState> = {};
          Object.entries(prev).forEach(([k, v]) => {
            updated[k] = {
              ...v,
              clockInTimestamp:
                v.isClockedIn && !v.clockInTimestamp
                  ? now - (v.elapsedSeconds || 0) * 1000
                  : v.clockInTimestamp
            };
          });
          return updated;
        });
      }
    } catch {
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem("teamflow_current_user", currentUserId);
      localStorage.setItem("teamflow_projects", JSON.stringify(projects));
      localStorage.setItem("teamflow_tasks", JSON.stringify(tasks));
      localStorage.setItem("teamflow_attendance", JSON.stringify(attendance));
      localStorage.setItem("teamflow_user_clock_in", JSON.stringify(userClockInData));
    } catch {
    }
  }, [currentUserId, projects, tasks, attendance, userClockInData, hasHydrated]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
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
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    // Project code is immutable like a unique serial number or system ID and cannot be edited
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
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
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
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const uploadTaskMedia = (
    taskId: string,
    file: {
      name: string;
      size: string;
      type: "image" | "pdf" | "figma" | "zip" | "doc";
      url?: string;
    }
  ) => {
    const newAttachment: TaskAttachment = {
      id: `att-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: file.url || (file.type === "image" ? "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80" : "#"),
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.fullName,
      uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            attachments: [newAttachment, ...t.attachments],
            activity: [
              {
                id: `act-${Date.now()}`,
                title: `Deliverable uploaded: ${file.name}`,
                detail: `Uploaded by ${currentUser.fullName}`,
                date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              },
              ...t.activity
            ]
          };
        }
        return t;
      })
    );
  };

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
    const todayString = now.toISOString().split("T")[0];

    let newElapsed = userState.elapsedSeconds || 0;
    let nextState: UserClockInState;

    if (nextClockedIn) {
      // Clock in: start session ticker now
      nextState = {
        isClockedIn: true,
        clockInTimestamp: Date.now(),
        clockInTimeString: timeString,
        clockOutTimeString: null,
        elapsedSeconds: newElapsed
      };
    } else {
      // Clock out: stop ticker, accumulate elapsed session
      const sessionSeconds = userState.clockInTimestamp
        ? Math.max(1, Math.floor((Date.now() - userState.clockInTimestamp) / 1000))
        : 0;
      newElapsed += sessionSeconds;
      nextState = {
        isClockedIn: false,
        clockInTimestamp: null,
        clockInTimeString: userState.clockInTimeString,
        clockOutTimeString: timeString,
        elapsedSeconds: newElapsed
      };
    }

    setUserClockInData((prev) => ({
      ...prev,
      [userId]: nextState
    }));

    // Update attendance record for this user
    setAttendance((prev) => {
      const existingToday = prev.find((r) => r.userId === userId && r.date === todayString);
      const hours = Math.floor(newElapsed / 3600);
      const minutes = Math.floor((newElapsed % 3600) / 60);
      const seconds = newElapsed % 60;
      const formattedDuration = `${hours}h ${minutes}m ${seconds}s`;

      if (existingToday) {
        return prev.map((r) => {
          if (r.id === existingToday.id) {
            return {
              ...r,
              clockIn: r.clockIn && r.clockIn !== "—" ? r.clockIn : timeString,
              clockOut: nextClockedIn ? "—" : timeString,
              duration: nextClockedIn ? r.duration : formattedDuration,
              status: nextClockedIn ? "Present" : r.status
            };
          }
          return r;
        });
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-rec-${Date.now()}`,
          userId: targetUser.id,
          userName: targetUser.fullName,
          userRole: targetUser.role,
          department: targetUser.department,
          date: todayString,
          clockIn: timeString,
          clockOut: nextClockedIn ? "—" : timeString,
          duration: nextClockedIn ? "00h 00m 01s" : formattedDuration,
          status: "Present"
        };
        return [newRecord, ...prev];
      }
    });
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
        getProjectMedia
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
