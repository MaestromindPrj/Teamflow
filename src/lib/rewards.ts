import { User, Task, Project } from "@/data/teamflowData";
import { RewardLedgerEntry } from "@/app/api/rewards/route";

export interface DynamicRewardProfile {
  currentBalance: number;
  currentPoints: number;
  maxPoints: number;
  level: number;
  nextLevel: number;
  nextTierPoints: number;
  progressPercent: number;
  appreciation: {
    count: number;
    quote: string;
    author: string;
    date: string;
    recent: Array<{
      from: string;
      message: string;
      date: string;
    }>;
  };
  history: Array<{
    date: string;
    action: string;
    points: string;
    reason: string;
  }>;
  badges: Array<{
    id: string;
    title: string;
    description: string;
    type: "check" | "zap" | "smile" | "award";
  }>;
}

export function computeUserRewards(
  user: User,
  tasks: Task[],
  projects: Project[],
  rewardsLedger: RewardLedgerEntry[] = []
): DynamicRewardProfile {
  const userTasks = tasks.filter((t) => t.assignedTo === user.id);
  const completedTasks = userTasks.filter((t) => t.status === "Completed");
  const inReviewTasks = userTasks.filter((t) => t.status === "Review");
  const inProgressTasks = userTasks.filter((t) => t.status === "In Progress");

  let points = 100 + completedTasks.length * 150 + inReviewTasks.length * 50 + inProgressTasks.length * 25;

  if (user.role === "project_manager") {
    const pmProjects = projects.filter((p) => p.projectManagerId === user.id);
    const pmTasks = tasks.filter((t) => pmProjects.some((p) => p.id === t.projectId));
    const pmCompleted = pmTasks.filter((t) => t.status === "Completed").length;
    points += pmCompleted * 40;
  }

  const userLedgerEntries = rewardsLedger.filter((r) => r.userId === user.id);
  const awardedPointsTotal = userLedgerEntries.reduce((sum, r) => sum + r.points, 0);
  points += awardedPointsTotal;

  const level = Math.max(1, Math.floor(points / 250) + 1);
  const nextTierPoints = level * 250;
  const progressPercent = Math.min(100, Math.round(((points % 250) / 250) * 100));

  const history: DynamicRewardProfile["history"] = [];

  userLedgerEntries.forEach((entry) => {
    history.push({
      date: entry.date,
      action: entry.action,
      points: `+${entry.points}`,
      reason: `${entry.reason}${entry.awardedByName ? ` — Awarded by ${entry.awardedByName}` : ""}`,
    });
  });

  completedTasks.forEach((t) => {
    history.push({
      date: t.deadline || "Oct 20, 2026",
      action: "Task Completed",
      points: "+150",
      reason: `Finished deliverable: ${t.title}`,
    });
  });

  inReviewTasks.forEach((t) => {
    history.push({
      date: t.deadline || "Oct 25, 2026",
      action: "Review Milestone",
      points: "+50",
      reason: `Delivered for quality review: ${t.title}`,
    });
  });

  if (user.role === "project_manager") {
    history.push({
      date: "Oct 28, 2026",
      action: "Portfolio Velocity",
      points: "+40",
      reason: "Managed team sprints on time with 0 blockers",
    });
  }

  history.push({
    date: "Oct 01, 2026",
    action: "Onboarding Bonus",
    points: "+100",
    reason: "Initial workspace activation and profile setup",
  });

  const badges: DynamicRewardProfile["badges"] = [
    {
      id: "b-welcome",
      title: "Team Member",
      description: "Active contributor in TeamFlow workspace",
      type: "smile",
    },
  ];

  if (completedTasks.length > 0 || user.role === "project_manager" || userLedgerEntries.length > 0) {
    badges.push({
      id: "b-deliverer",
      title: "Consistent Deliverer",
      description: "Successfully executed and delivered production tasks",
      type: "check",
    });
  }

  if (points >= 300) {
    badges.push({
      id: "b-speed",
      title: "Velocity Master",
      description: "Maintained outstanding sprint velocity across deliverables",
      type: "zap",
    });
  }

  if (points >= 450) {
    badges.push({
      id: "b-expert",
      title: "Domain Specialist",
      description: "Achieved Tier Level 2+ recognized operational expertise",
      type: "award",
    });
  }

  if (userLedgerEntries.some((e) => e.awardedById === "u-ceo-1")) {
    badges.push({
      id: "b-ceo-merit",
      title: "Executive Honoree",
      description: "Recipient of direct CEO Executive Merit Recognition",
      type: "award",
    });
  }

  return {
    currentBalance: points,
    currentPoints: points,
    maxPoints: nextTierPoints,
    level,
    nextLevel: level + 1,
    nextTierPoints,
    progressPercent,
    appreciation: {
      count: Math.max(1, completedTasks.length + userLedgerEntries.length),
      quote: userLedgerEntries.length > 0
        ? userLedgerEntries[0].reason
        : completedTasks.length > 0
        ? `Delivered ${completedTasks.length} production milestone(s) on target with high precision.`
        : "Proactively collaborating across workspace tasks and design objectives.",
      author: userLedgerEntries.length > 0 && userLedgerEntries[0].awardedByName
        ? userLedgerEntries[0].awardedByName
        : user.role === "project_manager"
        ? "Elena Rostova (CEO)"
        : "Marcus Vance (Project Manager)",
      date: userLedgerEntries.length > 0 ? userLedgerEntries[0].date : "Oct 28, 2026",
      recent: [
        {
          from: user.role === "project_manager" ? "Elena Rostova (CEO)" : "Sophia Chen (Project Manager)",
          message: "Exceptional engineering and timely deliverable completion.",
          date: "Yesterday",
        },
      ],
    },
    history,
    badges,
  };
}

export function computeLeaderboard(
  users: User[],
  tasks: Task[],
  projects: Project[],
  rewardsLedger: RewardLedgerEntry[] = []
) {
  const staff = users.filter((u) => u.role !== "ceo");
  return staff
    .map((u) => {
      const stats = computeUserRewards(u, tasks, projects, rewardsLedger);
      return {
        id: u.id,
        name: u.fullName,
        role: u.jobTitle || (u.role === "project_manager" ? "Project Manager" : u.department || "Employer"),
        points: stats.currentBalance,
        avatar: u.avatar,
        rank: 0,
      };
    })
    .sort((a, b) => b.points - a.points)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}
