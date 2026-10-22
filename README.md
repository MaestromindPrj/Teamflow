# TeamFlow - Employee Portal (IT Company)

A clean, modern employee portal built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**, styled using the clean **Inter** font family with light weights, subtle borders, and precise pixel fidelity matching your screenshots.

---

## 🚀 Pages Included

1. **Dashboard** (`/`)
   - Welcome header: *"Good morning, Ajay"* + notification button
   - 4 Overview stat cards (*My Tasks: 8*, *In Progress: 3*, *Awaiting Review: 2*, *Completed: 3*)
   - **Today's Work Schedule** table with task names, projects, priority badges (High, Medium, Low), due dates, and status badges
   - **Today's Attendance** summary card with Clock In time (*09:12 AM*) and *"Workday in progress"*
   - **Upcoming Deadlines** widget with urgency indicators (*Today*, *Tomorrow*)

2. **My Tasks** (`/tasks`)
   - Header with status subtitle
   - Filter pills bar (*All*, *To Do*, *In Progress*, *Review*, *Completed*)
   - Full task table with progress bars, due dates, priority tags, and status pills
   - Clicking any task opens its comprehensive details view

3. **Task Details** (`/tasks/[id]`, e.g., `/tasks/website-homepage-redesign`)
   - Task header with *"← Back to My Tasks"* link
   - Description card with live progress bar (80%)
   - **Attachments (3)**: Figma (`.fig`), PDF (`.pdf`), and Archive (`.zip`) files with download buttons
   - **Discussion**: Interactive comment thread with Sarah Williams, Alex Johnson, and reply input box
   - **Task Properties**: Project, Assigned By, Priority, Status, Due Date, and *"Submit for Review"* action
   - **Task Activity**: Interactive timeline tracking creation, assignment, progress, and file uploads

4. **Attendance** (`/attendance`)
   - Today's Attendance card (*09:12 AM - 06:04 PM*, Duration: *8h 52m*)
   - Workday summary cards: *Present (18 Days)*, *Late Arrival (2 Days)*, *Approved Leave (1 Day)*, *Attendance Rate (94%)*
   - Detailed **September 2026 Log** table with Clock In, Clock Out, Duration, and status badges

5. **Rewards & Recognition** (`/rewards`)
   - **Current Balance**: *420 Points*, Level 4 progress to Level 5 (*420 / 500 points*)
   - **Appreciation Highlight**: Quote card with recognition from Sarah Williams
   - **My Badges & Milestones**: *Task Finisher*, *Early Submitter*, *Team Helper*, *Client Appreciation*
   - **September Leaderboard**: Top employees with Alex Johnson highlighted in solid blue pill
   - **History & Logs**: Reward point accruals and reason log

6. **My Profile** (`/profile`) & **Settings** (`/settings`)
   - Clean employee profile card, contact details, work preferences, and notification toggles

---

## 🛠️ Stack & Typography

- **Framework**: Next.js 16 (Turbopack, App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Font**: Inter (`weights: 400, 500, 600`), avoiding thick or bulky fonts for a crisp, minimal look
- **Icons**: Lucide React

---

## 🏃 Running the Project

```bash
# Start the development server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
# Build for production
npm run build
npm start
```
