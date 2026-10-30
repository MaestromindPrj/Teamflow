export interface User {
  id: string;
  name: string;
  fullName: string;
  email: string;
  role: "ceo" | "project_manager" | "employer";
  jobTitle: string;
  department: string;
  avatar: string;
  phone: string;
  location: string;
  employeeId: string;
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
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  projectManagerId: string;
  teamLeadId: string;
  teamMemberIds: string[];
  status: "Planning" | "In Progress" | "In Review" | "Completed";
  priority: "High" | "Medium" | "Low";
  startDate: string;
  deadline: string;
  category: string;
  budget: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: "ceo" | "project_manager" | "employer";
  department: string;
  date: string;
  clockIn: string;
  clockOut: string;
  duration: string;
  status: "Present" | "Late" | "Leave" | "Remote" | "Checked Out" | "Not Clocked In";
}

export const INITIAL_USERS: User[] = [
  {
    id: "u-ceo-1",
    name: "Elena",
    fullName: "Elena Rostova",
    email: "elena.rostova@maestrominds.co.in",
    role: "ceo",
    jobTitle: "Chief Executive Officer",
    department: "Executive Leadership",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 234-9811",
    location: "Global HQ - Executive Suite",
    employeeId: "TF-CEO-001"
  },
  {
    id: "u-pm-1",
    name: "Marcus",
    fullName: "Marcus Vance",
    email: "marcus.vance@maestrominds.co.in",
    role: "project_manager",
    jobTitle: "Project Manager",
    department: "Project Manager",
    avatar: "/avatars/marcus.jpg",
    phone: "+1 (555) 438-1209",
    location: "San Francisco Engineering Hub",
    employeeId: "TF-PM-101"
  },
  {
    id: "u-pm-2",
    name: "Sophia",
    fullName: "Sophia Chen",
    email: "sophia.chen@maestrominds.co.in",
    role: "project_manager",
    jobTitle: "Project Manager",
    department: "Project Manager",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 782-3401",
    location: "New York Innovation Center",
    employeeId: "TF-PM-102"
  },
  {
    id: "u-emp-1",
    name: "Ajay",
    fullName: "Ajay Shanmugam",
    email: "ajay@maestrominds.co.in",
    role: "employer",
    jobTitle: "UI/UX Designer",
    department: "UI/UX Designer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 890-4412",
    location: "San Francisco Tech Hub",
    employeeId: "TF-EMP-201"
  },
  {
    id: "u-emp-2",
    name: "Devon",
    fullName: "Devon Lane",
    email: "devon.lane@maestrominds.co.in",
    role: "employer",
    jobTitle: "Software Developer",
    department: "Software Developer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 912-8834",
    location: "Austin Tech Center",
    employeeId: "TF-EMP-202"
  },
  {
    id: "u-emp-3",
    name: "Priya",
    fullName: "Priya Sharma",
    email: "priya.sharma@maestrominds.co.in",
    role: "employer",
    jobTitle: "AI Engineer",
    department: "AI Engineer",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 674-1928",
    location: "Seattle Development Campus",
    employeeId: "TF-EMP-203"
  },
  {
    id: "u-emp-4",
    name: "Liam",
    fullName: "Liam Cooper",
    email: "liam.cooper@maestrominds.co.in",
    role: "employer",
    jobTitle: "Junior Software Developer",
    department: "Junior Software Developer",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 321-7788",
    location: "Chicago Regional Office",
    employeeId: "TF-EMP-204"
  },
  {
    id: "u-emp-5",
    name: "Maya",
    fullName: "Maya Lin",
    email: "maya.lin@maestrominds.co.in",
    role: "employer",
    jobTitle: "UI/UX Designer",
    department: "UI/UX Designer",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    phone: "+1 (555) 443-8821",
    location: "San Francisco Tech Hub",
    employeeId: "TF-EMP-205"
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "NextGen Web Experience Revamp",
    code: "REVAMP-01",
    description: "End-to-end overhaul of client customer portal with Next.js 16, enterprise security standards, micro-interactions, and real-time activity stream.",
    projectManagerId: "u-pm-1",
    teamLeadId: "u-emp-1",
    teamMemberIds: ["u-emp-1", "u-emp-2", "u-emp-3", "u-emp-4", "u-emp-5"],
    status: "In Progress",
    priority: "High",
    startDate: "2026-09-01",
    deadline: "2026-11-15",
    category: "Web Engineering",
    budget: "$85,000"
  },
  {
    id: "proj-2",
    name: "Enterprise Mobile Companion App",
    code: "MOBILE-02",
    description: "Cross-platform mobile client for field team operations featuring offline caching, instant push notifications, and cryptographic telemetry.",
    projectManagerId: "u-pm-1",
    teamLeadId: "u-emp-2",
    teamMemberIds: ["u-emp-1", "u-emp-2", "u-emp-3", "u-emp-4"],
    status: "In Progress",
    priority: "High",
    startDate: "2026-08-15",
    deadline: "2026-12-01",
    category: "Mobile Systems",
    budget: "$120,000"
  },
  {
    id: "proj-3",
    name: "Cloud Data Lake & Analytics Core",
    code: "DATA-03",
    description: "Scalable BigQuery data pipelines, streaming ingestion connectors, automated lineage tracking, and executive BI dashboard connectors.",
    projectManagerId: "u-pm-2",
    teamLeadId: "u-emp-1",
    teamMemberIds: ["u-emp-1", "u-emp-3", "u-emp-4"],
    status: "In Progress",
    priority: "Medium",
    startDate: "2026-09-10",
    deadline: "2026-10-30",
    category: "Cloud Infrastructure",
    budget: "$95,000"
  },
  {
    id: "proj-4",
    name: "Brand Design System & Token Engine",
    code: "DESIGN-04",
    description: "Unified design token repository linking Figma variables directly to modern frontend CSS modules and accessible component primitives.",
    projectManagerId: "u-pm-2",
    teamLeadId: "u-emp-2",
    teamMemberIds: ["u-emp-2", "u-emp-3", "u-emp-5"],
    status: "In Review",
    priority: "Medium",
    startDate: "2026-07-20",
    deadline: "2026-10-25",
    category: "Design System",
    budget: "$40,000"
  }
];

export const INITIAL_TASKS_DATA: Task[] = [
  {
    id: "task-101",
    projectId: "proj-1",
    title: "Homepage Hero & High-Conversion Layout Design",
    description: "Design high-fidelity desktop and mobile layouts in Figma. Incorporate dynamic typography, optimized hero graphics, and interactive preview modals.",
    assignedTo: "u-emp-1",
    assignedBy: "u-pm-1",
    priority: "High",
    status: "In Progress",
    deadline: "2026-10-24",
    progress: 85,
    attachments: [
      {
        id: "att-1",
        name: "homepage-hero-v3.fig",
        size: "14.2 MB",
        type: "figma",
        url: "https://figma.com/file/teamflow-hero",
        uploadedBy: "u-emp-1",
        uploadedByName: "Ajay Shanmugam",
        uploadedAt: "Oct 18, 2026"
      },
      {
        id: "att-2",
        name: "hero-asset-bundle.zip",
        size: "34.5 MB",
        type: "zip",
        url: "/assets/hero-bundle.zip",
        uploadedBy: "u-emp-1",
        uploadedByName: "Ajay Shanmugam",
        uploadedAt: "Oct 19, 2026"
      }
    ],
    activity: [
      {
        id: "act-1",
        title: "Task assigned to Ajay Shanmugam",
        detail: "Assigned by Marcus Vance",
        date: "Oct 10, 2026"
      },
      {
        id: "act-2",
        title: "Progress updated to 85%",
        detail: "Ajay uploaded homepage-hero-v3.fig",
        date: "Oct 19, 2026"
      }
    ]
  },
  {
    id: "task-102",
    projectId: "proj-1",
    title: "API Authentication Middleware & Token Refresh",
    description: "Implement secure JWT rotation with HttpOnly secure cookies, token revocation lists, and redis-backed session stores.",
    assignedTo: "u-emp-2",
    assignedBy: "u-pm-1",
    priority: "High",
    status: "In Progress",
    deadline: "2026-10-26",
    progress: 60,
    attachments: [
      {
        id: "att-3",
        name: "auth-architecture-spec.pdf",
        size: "2.8 MB",
        type: "pdf",
        url: "/docs/auth-spec.pdf",
        uploadedBy: "u-emp-2",
        uploadedByName: "Devon Lane",
        uploadedAt: "Oct 15, 2026"
      }
    ],
    activity: [
      {
        id: "act-3",
        title: "Task created by Marcus Vance",
        detail: "Assigned to Devon Lane",
        date: "Oct 12, 2026"
      }
    ]
  },
  {
    id: "task-103",
    projectId: "proj-1",
    title: "Automated Cypress & Playwright E2E Test Suite",
    description: "Write end-to-end regression workflows covering user registration, payment checkout simulation, and project state hydration.",
    assignedTo: "u-emp-3",
    assignedBy: "u-pm-1",
    priority: "Medium",
    status: "To Do",
    deadline: "2026-10-31",
    progress: 25,
    attachments: [
      {
        id: "att-4",
        name: "test-matrix-v1.doc",
        size: "1.1 MB",
        type: "doc",
        url: "/docs/test-matrix.doc",
        uploadedBy: "u-emp-3",
        uploadedByName: "Priya Sharma",
        uploadedAt: "Oct 17, 2026"
      }
    ],
    activity: [
      {
        id: "act-4",
        title: "Test matrix approved",
        detail: "Priya scheduled execution run",
        date: "Oct 18, 2026"
      }
    ]
  },
  {
    id: "task-104",
    projectId: "proj-1",
    title: "Micro-interactions & Lottie Animation Pass",
    description: "Integrate ultra-smooth interactive SVG micro-animations for success triggers, loading states, and status badges.",
    assignedTo: "u-emp-1",
    assignedBy: "u-pm-1",
    priority: "Low",
    status: "Review",
    deadline: "2026-10-22",
    progress: 95,
    attachments: [
      {
        id: "att-5",
        name: "lottie-pack-revamp.zip",
        size: "12.4 MB",
        type: "zip",
        url: "/assets/lottie-pack.zip",
        uploadedBy: "u-emp-1",
        uploadedByName: "Ajay Shanmugam",
        uploadedAt: "Oct 20, 2026"
      }
    ],
    activity: [
      {
        id: "act-5",
        title: "Submitted for review",
        detail: "Ajay uploaded animation bundle",
        date: "Oct 20, 2026"
      }
    ]
  },
  {
    id: "task-201",
    projectId: "proj-2",
    title: "Offline Sync Engine Architecture & Local SQLite Store",
    description: "Build robust offline-first synchronization with vector clocks to handle concurrent edits when mobile technicians lose signal.",
    assignedTo: "u-emp-2",
    assignedBy: "u-pm-1",
    priority: "High",
    status: "In Progress",
    deadline: "2026-10-28",
    progress: 70,
    attachments: [
      {
        id: "att-6",
        name: "offline-sync-diagram.pdf",
        size: "4.1 MB",
        type: "pdf",
        url: "/docs/sync-diagram.pdf",
        uploadedBy: "u-emp-2",
        uploadedByName: "Devon Lane",
        uploadedAt: "Oct 14, 2026"
      }
    ],
    activity: [
      {
        id: "act-6",
        title: "Architecture validated",
        detail: "Devon benchmarked 10,000 offline events",
        date: "Oct 16, 2026"
      }
    ]
  },
  {
    id: "task-202",
    projectId: "proj-2",
    title: "Mobile Screen Navigation Flows & Gesture Controls",
    description: "Build bottom sheet interaction patterns, haptic feedback triggers, and responsive tab bar navigation for iOS and Android.",
    assignedTo: "u-emp-1",
    assignedBy: "u-pm-1",
    priority: "Medium",
    status: "In Progress",
    deadline: "2026-10-29",
    progress: 40,
    attachments: [
      {
        id: "att-7",
        name: "mobile-gesture-spec.fig",
        size: "8.6 MB",
        type: "figma",
        url: "https://figma.com/file/mobile-flows",
        uploadedBy: "u-emp-1",
        uploadedByName: "Ajay Shanmugam",
        uploadedAt: "Oct 17, 2026"
      }
    ],
    activity: [
      {
        id: "act-7",
        title: "Gestures prototype shared",
        detail: "Ajay uploaded prototype",
        date: "Oct 18, 2026"
      }
    ]
  },
  {
    id: "task-203",
    projectId: "proj-2",
    title: "Push Notification Gateway Integration",
    description: "Setup Apple APNs and Firebase Cloud Messaging pipelines with device token registration and payload encryption.",
    assignedTo: "u-emp-3",
    assignedBy: "u-pm-1",
    priority: "High",
    status: "To Do",
    deadline: "2026-11-05",
    progress: 10,
    attachments: [],
    activity: [
      {
        id: "act-8",
        title: "Credentials provisioned",
        detail: "Priya generated APNs auth keys",
        date: "Oct 19, 2026"
      }
    ]
  },
  {
    id: "task-301",
    projectId: "proj-3",
    title: "BigQuery Partitioning & Clustering Strategy",
    description: "Optimize high-volume telemetry tables with date partitioning and composite clustering to reduce query costs by 60%.",
    assignedTo: "u-emp-3",
    assignedBy: "u-pm-2",
    priority: "High",
    status: "Completed",
    deadline: "2026-10-18",
    progress: 100,
    attachments: [
      {
        id: "att-8",
        name: "bigquery-cost-reduction-report.pdf",
        size: "3.7 MB",
        type: "pdf",
        url: "/reports/bq-cost.pdf",
        uploadedBy: "u-emp-3",
        uploadedByName: "Priya Sharma",
        uploadedAt: "Oct 18, 2026"
      }
    ],
    activity: [
      {
        id: "act-9",
        title: "Task completed",
        detail: "Priya verified query cost reduction",
        date: "Oct 18, 2026"
      }
    ]
  },
  {
    id: "task-302",
    projectId: "proj-3",
    title: "Real-Time Ingestion Pipeline with Pub/Sub",
    description: "Configure streaming data ingestion with dead-letter queue routing, schema validation, and alert threshold notifications.",
    assignedTo: "u-emp-3",
    assignedBy: "u-pm-2",
    priority: "Medium",
    status: "In Progress",
    deadline: "2026-10-27",
    progress: 55,
    attachments: [
      {
        id: "att-9",
        name: "pipeline-architecture.image",
        size: "1.9 MB",
        type: "image",
        url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
        uploadedBy: "u-emp-3",
        uploadedByName: "Priya Sharma",
        uploadedAt: "Oct 19, 2026"
      }
    ],
    activity: [
      {
        id: "act-10",
        title: "Pipeline running in test environment",
        detail: "Priya streamed 50,000 sample records",
        date: "Oct 19, 2026"
      }
    ]
  },
  {
    id: "task-401",
    projectId: "proj-4",
    title: "Color Palette & Semantic Dark Mode Tokens",
    description: "Establish mathematical contrast tokens compliant with WCAG AAA, defining subtle hover states, focus rings, and surface depths.",
    assignedTo: "u-emp-2",
    assignedBy: "u-pm-2",
    priority: "Medium",
    status: "Completed",
    deadline: "2026-10-15",
    progress: 100,
    attachments: [
      {
        id: "att-10",
        name: "tokens-brand-spec.pdf",
        size: "5.4 MB",
        type: "pdf",
        url: "/tokens/spec.pdf",
        uploadedBy: "u-emp-2",
        uploadedByName: "Devon Lane",
        uploadedAt: "Oct 14, 2026"
      }
    ],
    activity: [
      {
        id: "act-11",
        title: "Approved by Sophia Chen",
        detail: "Tokens exported to repository",
        date: "Oct 15, 2026"
      }
    ]
  },
  {
    id: "task-402",
    projectId: "proj-4",
    title: "Design Tokens Sync GitHub Action",
    description: "Automate token transformation from Figma API into Tailwind and CSS variables using Style Dictionary.",
    assignedTo: "u-emp-1",
    assignedBy: "u-pm-2",
    priority: "High",
    status: "Review",
    deadline: "2026-10-23",
    progress: 90,
    attachments: [
      {
        id: "att-11",
        name: "tokens-ci-cd-workflow.zip",
        size: "3.2 MB",
        type: "zip",
        url: "/ci/workflow.zip",
        uploadedBy: "u-emp-1",
        uploadedByName: "Ajay Shanmugam",
        uploadedAt: "Oct 20, 2026"
      }
    ],
    activity: [
      {
        id: "act-12",
        title: "Workflow pull request opened",
        detail: "Ajay submitted for review",
        date: "Oct 20, 2026"
      }
    ]
  }
];

export const INITIAL_ATTENDANCE_DATA: AttendanceRecord[] = [
  {
    id: "att-rec-1",
    userId: "u-pm-1",
    userName: "Marcus Vance",
    userRole: "project_manager",
    department: "Project Manager",
    date: "2026-10-20",
    clockIn: "08:45 AM",
    clockOut: "05:00 PM",
    duration: "8h 15m",
    status: "Checked Out"
  },
  {
    id: "att-rec-2",
    userId: "u-pm-2",
    userName: "Sophia Chen",
    userRole: "project_manager",
    department: "Project Manager",
    date: "2026-10-20",
    clockIn: "09:02 AM",
    clockOut: "05:00 PM",
    duration: "7h 58m",
    status: "Checked Out"
  },
  {
    id: "att-rec-3",
    userId: "u-emp-1",
    userName: "Ajay Shanmugam",
    userRole: "employer",
    department: "UI/UX Designer",
    date: "2026-10-20",
    clockIn: "09:12 AM",
    clockOut: "05:00 PM",
    duration: "7h 48m",
    status: "Checked Out"
  },
  {
    id: "att-rec-4",
    userId: "u-emp-2",
    userName: "Devon Lane",
    userRole: "employer",
    department: "Software Developer",
    date: "2026-10-20",
    clockIn: "09:05 AM",
    clockOut: "05:00 PM",
    duration: "7h 55m",
    status: "Checked Out"
  },
  {
    id: "att-rec-5",
    userId: "u-emp-3",
    userName: "Priya Sharma",
    userRole: "employer",
    department: "AI Engineer",
    date: "2026-10-20",
    clockIn: "08:30 AM",
    clockOut: "05:00 PM",
    duration: "8h 30m",
    status: "Checked Out"
  },
  {
    id: "att-rec-6",
    userId: "u-emp-4",
    userName: "Maya Lin",
    userRole: "employer",
    department: "UI/UX Designer",
    date: "2026-10-20",
    clockIn: "09:42 AM",
    clockOut: "05:00 PM",
    duration: "7h 18m",
    status: "Checked Out"
  },
  {
    id: "att-rec-7",
    userId: "u-emp-5",
    userName: "Liam Cooper",
    userRole: "employer",
    department: "Junior Software Developer",
    date: "2026-10-20",
    clockIn: "09:15 AM",
    clockOut: "05:00 PM",
    duration: "7h 45m",
    status: "Checked Out"
  }
];
