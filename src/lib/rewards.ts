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
    all: Array<{
      id: string;
      reason: string;
      author: string;
      date: string;
      action: string;
      points: number;
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

  const userLedgerEntries = rewardsLedger.filter((r) => r.userId === user.id);
  const awardedPointsTotal = userLedgerEntries.reduce((sum, r) => sum + r.points, 0);

  let pmBonusPoints = 0;
  if (user.role === "project_manager") {
    const pmProjects = projects.filter((p) => p.projectManagerId === user.id);
    const pmTasks = tasks.filter((t) => pmProjects.some((p) => p.id === t.projectId));
    const pmCompleted = pmTasks.filter((t) => t.status === "Completed").length;
    pmBonusPoints = pmCompleted * 40;
  }

  const points =
    completedTasks.length * 150 +
    inReviewTasks.length * 50 +
    inProgressTasks.length * 25 +
    awardedPointsTotal +
    pmBonusPoints;

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

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  completedTasks.forEach((t) => {
    history.push({
      date: t.deadline || todayStr,
      action: "Task Completed",
      points: "+150",
      reason: `Finished deliverable: ${t.title}`,
    });
  });

  inReviewTasks.forEach((t) => {
    history.push({
      date: t.deadline || todayStr,
      action: "Review Milestone",
      points: "+50",
      reason: `Delivered for quality review: ${t.title}`,
    });
  });

  if (user.role === "project_manager" && pmBonusPoints > 0) {
    history.push({
      date: todayStr,
      action: "Portfolio Velocity",
      points: `+${pmBonusPoints}`,
      reason: "Managed team project deliverables completed on schedule",
    });
  }

  const badges: DynamicRewardProfile["badges"] = [
    {
      id: "b-welcome",
      title: "Team Member",
      description: "Active contributor in TeamFlow workspace",
      type: "smile",
    },
  ];

  if (completedTasks.length > 0 || (user.role === "project_manager" && pmBonusPoints > 0) || userLedgerEntries.length > 0) {
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

  if (
    userLedgerEntries.some(
      (e) =>
        e.awardedByName?.toLowerCase().includes("ceo") ||
        e.action.toLowerCase().includes("executive")
    )
  ) {
    badges.push({
      id: "b-ceo-merit",
      title: "Executive Honoree",
      description: "Recipient of direct CEO Executive Merit Recognition",
      type: "award",
    });
  }

  const latestAward = userLedgerEntries.length > 0 ? userLedgerEntries[0] : null;

  const allAppreciations = userLedgerEntries.map((e) => ({
    id: e.id,
    reason: e.reason,
    author: e.awardedByName || "Manager",
    date: e.date,
    action: e.action,
    points: e.points,
  }));

  return {
    currentBalance: points,
    currentPoints: points,
    maxPoints: nextTierPoints,
    level,
    nextLevel: level + 1,
    nextTierPoints,
    progressPercent,
    appreciation: {
      count: allAppreciations.length,
      quote: latestAward
        ? latestAward.reason
        : "No executive or peer appreciation notes awarded yet. Recognitions and praise notes awarded by the CEO or Project Managers will appear here when points are awarded.",
      author: latestAward?.awardedByName || "",
      date: latestAward?.date || "",
      recent: userLedgerEntries.slice(0, 3).map((e) => ({
        from: e.awardedByName || "Manager",
        message: e.reason,
        date: e.date,
      })),
      all: allAppreciations,
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
        role: u.jobTitle || (u.role === "project_manager" ? "Project Manager" : "Employer"),
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
