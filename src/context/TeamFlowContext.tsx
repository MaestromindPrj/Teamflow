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

export interface UserClockInState {
  isClockedIn: boolean;
  clockInTimestamp: number | null;
  clockInTimeString: string | null;
  clockOutTimeString: string | null;
  elapsedSeconds?: number;
}

const DEFAULT_CLOCK_IN_DATA: Record<string, UserClockInState> = {
  "u-ceo-1": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0
  },
  "u-pm-1": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0
  },
  "u-pm-2": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0
  },
  "u-emp-1": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0
  },
  "u-emp-2": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0
  },
  "u-emp-3": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0
  },
  "u-emp-4": {
    isClockedIn: false,
    clockInTimestamp: null,
    clockInTimeString: null,
    clockOutTimeString: null,
    elapsedSeconds: 0
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
}

const TeamFlowContext = createContext<TeamFlowContextType | undefined>(undefined);

export function TeamFlowProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserIdState] = useState<string>("u-ceo-1");
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS_DATA);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_DATA);
  const [userClockInData, setUserClockInData] = useState<Record<string, UserClockInState>>(DEFAULT_CLOCK_IN_DATA);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Initial local hydration from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("teamflow_current_user");
      const savedProjects = localStorage.getItem("teamflow_projects");
      const savedTasks = localStorage.getItem("teamflow_tasks");
      const savedAttendance = localStorage.getItem("teamflow_attendance");
      localStorage.removeItem("teamflow_user_clock_in");
      const savedUserClockIn = localStorage.getItem("teamflow_user_clock_in_v2");

      const validUserIds = new Set(INITIAL_USERS.map((u) => u.id));

      if (savedUser && validUserIds.has(savedUser)) {
        setCurrentUserIdState(savedUser);
      } else {
        setCurrentUserIdState("u-ceo-1");
      }

      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        setProjects(parsed);
      }

      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        setTasks(parsed);
      }

      if (savedAttendance) {
        const parsed = JSON.parse(savedAttendance);
        setAttendance(parsed);
      }

      if (savedUserClockIn) {
        const parsed = JSON.parse(savedUserClockIn);
        setUserClockInData(parsed);
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
      const [usersRes, projectsRes, tasksRes, attendanceRes, clockInRes] = await Promise.all([
        fetch("/api/users").catch(() => null),
        fetch("/api/projects").catch(() => null),
        fetch("/api/tasks").catch(() => null),
        fetch("/api/attendance").catch(() => null),
        fetch("/api/clock-in").catch(() => null),
      ]);

      if (usersRes && usersRes.ok) {
        const data = await usersRes.json();
        if (Array.isArray(data.users) && data.users.length > 0) {
          setUsers(data.users);
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
      localStorage.setItem("teamflow_user_clock_in_v2", JSON.stringify(userClockInData));
    } catch {
      // ignore storage quota errors
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
      nextState = {
        isClockedIn: true,
        clockInTimestamp: Date.now(),
        clockInTimeString: timeString,
        clockOutTimeString: null,
        elapsedSeconds: newElapsed
      };
    } else {
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

    // Async persist clock-in status to Neon Postgres
    fetch("/api/clock-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        ...nextState,
      }),
    }).catch((err) => console.warn("Failed to persist clock-in to backend:", err));

    const hours = Math.floor(newElapsed / 3600);
    const minutes = Math.floor((newElapsed % 3600) / 60);
    const seconds = newElapsed % 60;
    const formattedDuration = `${hours}h ${minutes}m ${seconds}s`;

    setAttendance((prev) => {
      const existingToday = prev.find((r) => r.userId === userId && r.date === todayString);

      if (existingToday) {
        const updatedRecord: AttendanceRecord = {
          ...existingToday,
          clockIn: existingToday.clockIn && existingToday.clockIn !== "—" ? existingToday.clockIn : timeString,
          clockOut: nextClockedIn ? "—" : timeString,
          duration: nextClockedIn ? existingToday.duration : formattedDuration,
          status: nextClockedIn ? "Present" : existingToday.status
        };

        // Async persist to attendance API
        fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedRecord),
        }).catch((err) => console.warn("Failed to persist attendance update:", err));

        return prev.map((r) => (r.id === existingToday.id ? updatedRecord : r));
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

        // Async persist to attendance API
        fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRecord),
        }).catch((err) => console.warn("Failed to persist new attendance:", err));

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
