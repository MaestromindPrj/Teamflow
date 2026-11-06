export interface User {
  id: string;
  name: string;
  fullName: string;
  email: string;
  role: "ceo" | "project_manager" | "employer";
  jobTitle: string;
  avatar: string;
  phone: string;
  employeeId: string;
  bio?: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type: "image" | "pdf" | "figma" | "zip" | "doc";
  url: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

export interface TaskActivityItem {
  id: string;
  title: string;
  detail: string;
  date: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Review" | "Completed";
  deadline: string;
  progress: number;
  attachments: TaskAttachment[];
  activity: TaskActivityItem[];
  discussion?: Array<{ id: string; author: string; avatar: string; timeAgo: string; message: string }>;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  projectManagerId: string;
  teamLeadId: string;
  teamMemberIds: string[];
  status: "Planning" | "In Progress" | "In Review" | "Completed";
  priority: "High" | "Medium" | "Low";
  startDate: string;
  deadline: string;
  category: string;
  budget: string;
  techStack?: string[];
  attachments?: TaskAttachment[];
}

export interface PunchSession {
  sessionNumber: number;
  clockIn: string;
  clockOut: string | null;
  duration?: string;
  elapsedSeconds?: number;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: "ceo" | "project_manager" | "employer";
  date: string;
  clockIn: string;
  clockOut: string;
  duration: string;
  status: "Present" | "Late" | "Leave" | "Remote" | "Checked Out" | "Not Clocked In";
  sessions?: PunchSession[];
  leaveType?: string;
  leaveReason?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: "ceo" | "project_manager" | "employer";
  startDate: string;
  endDate: string;
  leaveType: string;
  reason?: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedById: string;
  appliedByName: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedByRole?: "ceo" | "project_manager";
  createdAt?: string;
}

export interface MediaDeletionRequest {
  id: string;
  attachmentId: string;
  attachmentName: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentSize?: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  teamLeadId: string;
  teamLeadName: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
  requestedAt: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedByRole?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  description?: string;
  projectCount?: number;
}

export const DEFAULT_PROJECT_CATEGORIES: ProjectCategory[] = [];

export const INITIAL_USERS: User[] = [
  {
    id: "u-ceo-1",
    name: "CEO",
    fullName: "Chief Executive Officer",
    email: "ceo@maestrominds.co.in",
    role: "ceo",
    jobTitle: "Chief Executive Officer",
    avatar: "",
    phone: "",
    employeeId: "TF-CEO-001"
  }
];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_TASKS_DATA: Task[] = [];

export const INITIAL_ATTENDANCE_DATA: AttendanceRecord[] = [];
