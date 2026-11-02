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

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: "website-homepage-redesign",
    task: "Website Homepage Redesign",
    project: "Website Revamp",
    priority: "High",
    dueDate: "Sep 20",
    progress: 80,
    status: "In Progress",
    description:
      "Redesign the company homepage following the approved visual direction and improve the overall content hierarchy. Ensure proper visual balance, correct component state mappings, and responsive patterns in Figma.",
    assignedBy: "Sarah Williams",
    fullDueDate: "Sep 20, 2026",
    attachments: [
      { id: "1", name: "homepage-final.fig", size: "14.2 MB", type: "figma" },
      { id: "2", name: "design-reference.pdf", size: "4.8 MB", type: "pdf" },
      { id: "3", name: "homepage-assets.zip", size: "88.5 MB", type: "zip" },
    ],
    discussion: [
      {
        id: "c1",
        author: "Sarah Williams",
        avatar: "/avatars/sarah.svg",
        timeAgo: "2 hours ago",
        message: "Please refine the spacing around the hero section.",
      },
      {
        id: "c2",
        author: "Alex Johnson",
        avatar: "/avatars/alex.svg",
        timeAgo: "1 hour ago",
        message: "Updated the spacing and uploaded the revised version.",
      },
    ],
    activity: [
      {
        id: "a1",
        title: "Task created",
        detail: "System generated",
        date: "Sep 15, 2026",
      },
      {
        id: "a2",
        title: "Task assigned",
        detail: "Assigned by Sarah Williams",
        date: "Sep 15, 2026",
      },
      {
        id: "a3",
        title: "Work started",
        detail: "Alex marked as In Progress",
        date: "Sep 16, 2026",
      },
      {
        id: "a4",
        title: "Progress updated",
        detail: "Progress changed to 80%",
        date: "Sep 18, 2026",
      },
      {
        id: "a5",
        title: "File uploaded",
        detail: "homepage-final.fig added",
        date: "Sep 19, 2026",
      },
    ],
  },
  {
    id: "mobile-app-wireframes",
    task: "Mobile App Wireframes",
    project: "Mobile App",
    priority: "Medium",
    dueDate: "Sep 21",
    progress: 45,
    status: "In Progress",
    description:
      "Create low-fidelity and mid-fidelity wireframes for the upcoming mobile companion app. Target iOS guidelines first.",
    assignedBy: "Michael Chang",
    fullDueDate: "Sep 21, 2026",
    attachments: [
      { id: "m1", name: "app-flows-spec.pdf", size: "3.2 MB", type: "pdf" },
    ],
    discussion: [
      {
        id: "mc1",
        author: "Michael Chang",
        avatar: "/avatars/john.svg",
        timeAgo: "1 day ago",
        message: "Check the authentication flows on smaller screen sizes.",
      },
    ],
    activity: [
      {
        id: "ma1",
        title: "Task created",
        detail: "System generated",
        date: "Sep 17, 2026",
      },
      {
        id: "ma2",
        title: "Work started",
        detail: "In Progress",
        date: "Sep 18, 2026",
      },
    ],
  },
  {
    id: "client-presentation",
    task: "Client Presentation",
    project: "Marketing Project",
    priority: "High",
    dueDate: "Sep 19",
    progress: 100,
    status: "Review",
    description:
      "Prepare slide deck and demo prototype for quarterly business review with enterprise partners.",
    assignedBy: "Sarah Williams",
    fullDueDate: "Sep 19, 2026",
    attachments: [
      { id: "cp1", name: "deck-q3-presentation.pdf", size: "18.5 MB", type: "pdf" },
    ],
    discussion: [
      {
        id: "cpc1",
        author: "Sarah Williams",
        avatar: "/avatars/sarah.svg",
        timeAgo: "4 hours ago",
        message: "Deck is under final review. Great work on the metrics slides!",
      },
    ],
    activity: [
      {
        id: "cpa1",
        title: "Task created",
        detail: "System generated",
        date: "Sep 14, 2026",
      },
      {
        id: "cpa2",
        title: "Submitted for review",
        detail: "Alex submitted deck",
        date: "Sep 19, 2026",
      },
    ],
  },
  {
    id: "user-research-report",
    task: "User Research Report",
    project: "Research",
    priority: "Low",
    dueDate: "Sep 23",
    progress: 20,
    status: "To Do",
    description:
      "Synthesize feedback collected from 15 qualitative customer interviews into key UX insights and persona updates.",
    assignedBy: "David Miller",
    fullDueDate: "Sep 23, 2026",
    attachments: [
      { id: "ur1", name: "interview-transcripts.zip", size: "45.0 MB", type: "zip" },
    ],
    discussion: [],
    activity: [
      {
        id: "ura1",
        title: "Task created",
        detail: "System generated",
        date: "Sep 18, 2026",
      },
    ],
  },
];

export const ATTENDANCE_DATA = {
  today: {
    date: "September 19, 2026",
    timeRange: "09:12 AM - 06:04 PM",
    duration: "8h 52m",
    status: "Present" as const,
  },
  stats: {
    presentDays: 18,
    lateDays: 2,
    approvedLeaveDays: 1,
    attendanceRate: "94%",
  },
  logs: [
    {
      date: "Sep 19, 2026",
      clockIn: "09:12 AM",
      clockOut: "06:04 PM",
      duration: "8h 52m",
      status: "Present" as const,
    },
    {
      date: "Sep 18, 2026",
      clockIn: "09:08 AM",
      clockOut: "06:12 PM",
      duration: "9h 04m",
      status: "Present" as const,
    },
    {
      date: "Sep 17, 2026",
      clockIn: "09:34 AM",
      clockOut: "06:02 PM",
      duration: "8h 28m",
      status: "Late" as const,
    },
    {
      date: "Sep 16, 2026",
      clockIn: "—",
      clockOut: "—",
      duration: "—",
      status: "Leave" as const,
    },
  ] as AttendanceRecord[],
};

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

export const USER_REWARDS_DATA: Record<string, UserRewardProfile> = {
  "u-pm-1": {
    userId: "u-pm-1",
    currentBalance: 580,
    level: 5,
    currentPoints: 580,
    maxPoints: 700,
    nextLevel: 6,
    appreciation: {
      quote:
        "“Marcus did an outstanding job orchestrating the cloud migration across 3 cross-functional teams with zero client downtime.”",
      author: "Elena Rostova, CEO",
      date: "Oct 12, 2026",
    },
    badges: [
      {
        id: "b-pm1-1",
        title: "Portfolio Milestone Champion",
        description: "Delivered 4 cross-functional projects on schedule",
        type: "award",
      },
      {
        id: "b-pm1-2",
        title: "Zero Escalations",
        description: "100% on-time delivery across portfolio sprints",
        type: "check",
      },
      {
        id: "b-pm1-3",
        title: "Resource Optimizer",
        description: "Kept portfolio burn rate within targeted budget",
        type: "zap",
      },
      {
        id: "b-pm1-4",
        title: "Cross-Team Mentor",
        description: "Trained and unblocked multiple engineering leads",
        type: "smile",
      },
    ],
    history: [
      {
        date: "Oct 18, 2026",
        action: "Portfolio Milestone Reached",
        points: "+50",
        reason: "Approved final security sign-off for Payment Gateway Integration",
      },
      {
        date: "Oct 10, 2026",
        action: "Early Sprint Delivery",
        points: "+40",
        reason: "Completed Sprint 14 deliverables 3 days ahead of client deadline",
      },
      {
        date: "Sep 28, 2026",
        action: "Stakeholder Excellence",
        points: "+35",
        reason: "Received 5-star executive review during quarterly client governance sync",
      },
      {
        date: "Sep 15, 2026",
        action: "Cross-Functional Unblocking",
        points: "+30",
        reason: "Resolved critical dependency blocker between Design and Platform teams",
      },
      {
        date: "Sep 02, 2026",
        action: "Budget Performance",
        points: "+45",
        reason: "Saved 14% on AWS cloud staging cluster infrastructure allocation",
      },
    ],
  },
  "u-pm-2": {
    userId: "u-pm-2",
    currentBalance: 520,
    level: 5,
    currentPoints: 520,
    maxPoints: 700,
    nextLevel: 6,
    appreciation: {
      quote:
        "“Sophia's rigor in defining specifications and tracking milestones has been key to our design system adoption.”",
      author: "Marcus Vance, Project Manager",
      date: "Oct 05, 2026",
    },
    badges: [
      {
        id: "b-pm2-1",
        title: "Roadmap Visionary",
        description: "Delivered Design System overhaul and mobile initiative",
        type: "award",
      },
      {
        id: "b-pm2-2",
        title: "Rapid Delivery Ace",
        description: "Reduced cycle time for sprint review approvals",
        type: "zap",
      },
      {
        id: "b-pm2-3",
        title: "Team Catalyst",
        description: "Consistently high peer collaboration ratings",
        type: "smile",
      },
      {
        id: "b-pm2-4",
        title: "Quality Gatekeeper",
        description: "Zero critical regressions in production releases",
        type: "check",
      },
    ],
    history: [
      {
        date: "Oct 19, 2026",
        action: "Design System Milestone",
        points: "+45",
        reason: "Led rollout of enterprise design tokens and Figma-to-code sync",
      },
      {
        date: "Oct 08, 2026",
        action: "Zero Regression Sprint",
        points: "+35",
        reason: "Mobile Banking sprint completed with 100% test pass rate",
      },
      {
        date: "Sep 22, 2026",
        action: "Customer Journey Mapping",
        points: "+40",
        reason: "Authored end-to-end user story matrix for client authentication overhaul",
      },
      {
        date: "Sep 11, 2026",
        action: "Process Innovation",
        points: "+30",
        reason: "Implemented automated async standup workflow saving 4 team hours weekly",
      },
    ],
  },
  "u-emp-1": {
    userId: "u-emp-1",
    currentBalance: 460,
    level: 4,
    currentPoints: 460,
    maxPoints: 500,
    nextLevel: 5,
    appreciation: {
      quote:
        "“Ajay's frontend architecture and sleek design components elevated our entire product experience to enterprise tier.”",
      author: "Sophia Chen, PM",
      date: "Oct 14, 2026",
    },
    badges: [
      {
        id: "b-emp1-1",
        title: "Design Virtuoso",
        description: "Crafted design token system and 40+ atomic components",
        type: "award",
      },
      {
        id: "b-emp1-2",
        title: "Task Finisher",
        description: "Completed 15 consecutive sprint tasks on time",
        type: "check",
      },
      {
        id: "b-emp1-3",
        title: "Speed Demon",
        description: "Delivered responsive UI revamp 2 days early",
        type: "zap",
      },
      {
        id: "b-emp1-4",
        title: "Team Helper",
        description: "Mentored Maya Lin on motion UI and interactive Figma components",
        type: "smile",
      },
    ],
    history: [
      {
        date: "Oct 16, 2026",
        action: "Design Tokens Integration",
        points: "+40",
        reason: "Completed Tailwind design tokens export and CI sync workflow",
      },
      {
        date: "Oct 04, 2026",
        action: "Homepage Revamp Delivery",
        points: "+35",
        reason: "Delivered interactive responsive prototype ahead of schedule",
      },
      {
        date: "Sep 25, 2026",
        action: "UI Peer Review & Fixes",
        points: "+25",
        reason: "Reviewed and improved accessibility for 12 core dashboard views",
      },
      {
        date: "Sep 12, 2026",
        action: "Micro-Animation Showcase",
        points: "+30",
        reason: "Created glassmorphism and smooth transition components for client app",
      },
    ],
  },
  "u-emp-2": {
    userId: "u-emp-2",
    currentBalance: 410,
    level: 4,
    currentPoints: 410,
    maxPoints: 500,
    nextLevel: 5,
    appreciation: {
      quote:
        "“Devon resolved the payment gateway webhook latency issue in record time. Phenomenal technical execution!”",
      author: "Marcus Vance, Project Manager",
      date: "Sep 30, 2026",
    },
    badges: [
      {
        id: "b-emp2-1",
        title: "API Architect",
        description: "Built high-performance GraphQL and REST endpoints",
        type: "award",
      },
      {
        id: "b-emp2-2",
        title: "Clean Code Craftsman",
        description: "Passed strict automated security and lint checks",
        type: "check",
      },
      {
        id: "b-emp2-3",
        title: "Night Owl Deployer",
        description: "Executed critical server migrations seamlessly",
        type: "zap",
      },
    ],
    history: [
      {
        date: "Oct 15, 2026",
        action: "Backend API Optimization",
        points: "+35",
        reason: "Reduced SQL query latency by 45% on task indexing queries",
      },
      {
        date: "Oct 02, 2026",
        action: "Webhook Security Hardening",
        points: "+40",
        reason: "Implemented HMAC signature verification for Stripe integration",
      },
      {
        date: "Sep 18, 2026",
        action: "Pair Programming Support",
        points: "+25",
        reason: "Assisted Priya with Docker container build caching configurations",
      },
    ],
  },
  "u-emp-3": {
    userId: "u-emp-3",
    currentBalance: 480,
    level: 4,
    currentPoints: 480,
    maxPoints: 500,
    nextLevel: 5,
    appreciation: {
      quote:
        "“Priya's Terraform modules made rolling out the multi-region staging environment effortless and bulletproof.”",
      author: "Marcus Vance, Project Manager",
      date: "Oct 11, 2026",
    },
    badges: [
      {
        id: "b-emp3-1",
        title: "Infrastructure Titan",
        description: "Maintained 99.99% staging and production uptime",
        type: "award",
      },
      {
        id: "b-emp3-2",
        title: "Automation Wizard",
        description: "Built automated CI/CD pipeline cutting deployment times by 60%",
        type: "zap",
      },
      {
        id: "b-emp3-3",
        title: "Security Guardian",
        description: "Completed quarterly zero-vulnerability container scan",
        type: "check",
      },
    ],
    history: [
      {
        date: "Oct 17, 2026",
        action: "Kubernetes Cluster Auto-scaling",
        points: "+50",
        reason: "Configured KEDA autoscalers reducing staging cloud compute spend",
      },
      {
        date: "Oct 05, 2026",
        action: "CI Pipeline Acceleration",
        points: "+35",
        reason: "Optimized Turbopack build caches in GitHub Actions runner",
      },
      {
        date: "Sep 20, 2026",
        action: "Disaster Recovery Drill",
        points: "+40",
        reason: "Successfully validated multi-zone automated database failover in 45s",
      },
    ],
  },
  "u-emp-4": {
    userId: "u-emp-4",
    currentBalance: 350,
    level: 3,
    currentPoints: 350,
    maxPoints: 400,
    nextLevel: 4,
    appreciation: {
      quote:
        "“Liam's attention to detail prevented two high-severity payment regression bugs from reaching production.”",
      author: "Sophia Chen, PM",
      date: "Sep 26, 2026",
    },
    badges: [
      {
        id: "b-emp4-1",
        title: "Bug Hunter",
        description: "Caught 24 edge-case defects before staging deployment",
        type: "check",
      },
      {
        id: "b-emp4-2",
        title: "E2E Coverage Master",
        description: "Authored comprehensive Playwright test suite",
        type: "award",
      },
      {
        id: "b-emp4-3",
        title: "Team Helper",
        description: "Assisted developers in writing automated unit tests",
        type: "smile",
      },
    ],
    history: [
      {
        date: "Oct 14, 2026",
        action: "End-to-End Suite Expansion",
        points: "+35",
        reason: "Automated user signup and role-based permissions test flows",
      },
      {
        date: "Oct 01, 2026",
        action: "Critical Defect Discovery",
        points: "+40",
        reason: "Identified race condition in concurrent task status update requests",
      },
      {
        date: "Sep 15, 2026",
        action: "Performance Benchmarking",
        points: "+25",
        reason: "Created load test report simulating 5,000 concurrent active users",
      },
    ],
  },
  "u-emp-5": {
    userId: "u-emp-5",
    currentBalance: 380,
    level: 3,
    currentPoints: 380,
    maxPoints: 400,
    nextLevel: 4,
    appreciation: {
      quote:
        "“Maya's brand graphics and clean animations brought the client onboarding deck to life. Incredible work!”",
      author: "Ajay Shanmugam, UI Lead",
      date: "Oct 09, 2026",
    },
    badges: [
      {
        id: "b-emp5-1",
        title: "Creative Visionary",
        description: "Delivered brand motion guidelines and SVG vector library",
        type: "award",
      },
      {
        id: "b-emp5-2",
        title: "Rapid Iteration Star",
        description: "Provided 3 distinct prototype directions within 24 hours",
        type: "zap",
      },
      {
        id: "b-emp5-3",
        title: "Culture Booster",
        description: "Organized team design show-and-tell workshops",
        type: "smile",
      },
    ],
    history: [
      {
        date: "Oct 18, 2026",
        action: "Brand Asset Package Finalized",
        points: "+35",
        reason: "Delivered SVG icon library, brand color palettes, and social assets",
      },
      {
        date: "Oct 06, 2026",
        action: "Interactive Lottie Animations",
        points: "+40",
        reason: "Created micro-animations for task completion and praise notifications",
      },
      {
        date: "Sep 22, 2026",
        action: "Pitch Deck Visual Design",
        points: "+30",
        reason: "Designed 35 executive slides for client quarterly presentation",
      },
    ],
  },
};

export const REWARDS_DATA = {
  currentBalance: 460,
  level: 4,
  currentPoints: 460,
  maxPoints: 500,
  nextLevel: 5,
  appreciation: {
    quote:
      "“Ajay's frontend architecture and sleek design components elevated our entire product experience to enterprise tier.”",
    author: "Sophia Chen, PM",
    date: "Oct 14, 2026",
  },
  badges: USER_REWARDS_DATA["u-emp-1"].badges,
  leaderboard: [
    {
      rank: 1,
      name: "Marcus Vance",
      role: "Project Manager",
      points: 580,
      avatar: "",
    },
    {
      rank: 2,
      name: "Sophia Chen",
      role: "Project Manager",
      points: 520,
      avatar: "",
    },
    {
      rank: 3,
      name: "Priya Sharma",
      role: "Employer",
      points: 480,
      avatar: "",
    },
    {
      rank: 4,
      name: "Ajay Shanmugam",
      role: "Employer",
      points: 460,
      avatar: "",
    },
    {
      rank: 5,
      name: "Devon Lane",
      role: "Employer",
      points: 410,
      avatar: "",
    },
    {
      rank: 6,
      name: "Maya Lin",
      role: "Employer",
      points: 380,
      avatar: "",
    },
    {
      rank: 7,
      name: "Liam Cooper",
      role: "Employer",
      points: 350,
      avatar: "",
    },
  ] as LeaderboardUser[],
  history: USER_REWARDS_DATA["u-emp-1"].history,
};

export const CURRENT_USER = {
  name: "Ajay",
  fullName: "Ajay Shanmugam",
  email: "ajay@maestrominds.co.in",
  role: "employer",
  jobTitle: "UI/UX Designer",
  employeeId: "TF-8402",
  joinDate: "March 15, 2023",
  avatar: "",
};
