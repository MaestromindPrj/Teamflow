export interface TaskItem {
  id: string;
  task: string;
  project: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  progress: number;
  status: "In Progress" | "Review" | "To Do" | "Completed";
  description?: string;
  assignedBy?: string;
  fullDueDate?: string;
  attachments?: {
    id: string;
    name: string;
    size: string;
    type: "figma" | "pdf" | "zip";
  }[];
  discussion?: {
    id: string;
    author: string;
    avatar: string;
    timeAgo: string;
    message: string;
  }[];
  activity?: {
    id: string;
    title: string;
    detail: string;
    date: string;
  }[];
}

export interface AttendanceRecord {
  date: string;
  clockIn: string;
  clockOut: string;
  duration: string;
  status: "Present" | "Late" | "Leave";
}

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  type: "check" | "zap" | "smile" | "award";
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  role?: string;
  points: number;
  avatar: string;
  isCurrentUser?: boolean;
}

export interface RewardLog {
  date: string;
  action: string;
  points: string;
  reason: string;
}

export interface UserRewardProfile {
  userId: string;
  currentBalance: number;
  level: number;
  currentPoints: number;
  maxPoints: number;
  nextLevel: number;
  appreciation: {
    quote: string;
    author: string;
    date: string;
  };
  badges: BadgeItem[];
  history: RewardLog[];
}

export const INITIAL_TASKS: TaskItem[] = [];

export const ATTENDANCE_DATA = {
  today: {
    date: "",
    timeRange: "",
    duration: "0h 0m",
    status: "Present" as const,
  },
  stats: {
    presentDays: 0,
    lateDays: 0,
    approvedLeaveDays: 0,
    attendanceRate: "100%",
  },
  logs: [] as AttendanceRecord[],
};

export const USER_REWARDS_DATA: Record<string, UserRewardProfile> = {};

export const REWARDS_DATA = {
  currentBalance: 0,
  level: 1,
  currentPoints: 0,
  maxPoints: 100,
  nextLevel: 2,
  badges: [] as BadgeItem[],
  leaderboard: [] as LeaderboardUser[],
  history: [] as RewardLog[],
};

export const CURRENT_USER = {
  name: "CEO",
  fullName: "Chief Executive Officer",
  email: "ceo@maestrominds.co.in",
  role: "ceo",
  jobTitle: "Chief Executive Officer",
  employeeId: "TF-CEO-001",
  joinDate: "January 1, 2026",
  avatar: "",
};
