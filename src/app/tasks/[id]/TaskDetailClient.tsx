"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Archive,
  Download,
  Share2,
} from "lucide-react";
import Header from "@/components/Header";
import { TaskItem, RewardLog } from "@/data/mockData";
import { PriorityBadge, StatusBadge } from "@/components/Badges";

function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
      <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
      <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
      <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
      <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
    </svg>
  );
}

export default function TaskDetailClient({ task }: { task: TaskItem }) {
  const [taskStatus, setTaskStatus] = useState<TaskItem["status"]>(task.status);
  const [comments, setComments] = useState(task.discussion || []);
  const [replyText, setReplyText] = useState("");
  const [activities, setActivities] = useState(task.activity || []);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newComment = {
      id: `c_${Date.now()}`,
      author: "Ajay",
      avatar: "/avatars/ajay.jpg",
      timeAgo: "Just now",
      message: replyText.trim(),
    };

    setComments([...comments, newComment]);
    setReplyText("");
  };

  const handleSubmitForReview = () => {
    setTaskStatus("Review");
    const newActivity = {
      id: `act_${Date.now()}`,
      title: "Submitted for review",
      detail: "Ajay submitted task for approval",
      date: "Sep 20, 2026",
    };
    setActivities([newActivity, ...activities]);
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title={task.task}
        subtitle="Detailed overview of your current assignment."
      />

      <div className="px-7 py-6 space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-800 transition-colors font-normal"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2]" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* 2 Column Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Description Card */}
            <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                Description
              </h2>
              <p className="text-[13px] text-slate-600 leading-relaxed font-normal">
                {task.description ||
                  "Redesign the company homepage following the approved visual direction and improve the overall content hierarchy. Ensure proper visual balance, correct component state mappings, and responsive patterns in Figma."}
              </p>

              {/* Progress */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[13px] mb-2">
                  <span className="font-semibold text-slate-800 text-[13px]">
                    Current Progress
                  </span>
                  <span className="font-semibold text-[#0084d4] text-[13px]">
                    {task.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0084d4] h-full rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Attachments Card */}
            <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs">
              <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight mb-4">
                Attachments ({task.attachments ? task.attachments.length : 3})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {task.attachments?.map((file) => (
                  <div
                    key={file.id}
                    className="border border-slate-200/90 rounded-lg p-3 flex items-center justify-between bg-slate-50/40 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-1">
                      <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                        {file.type === "figma" ? (
                          <FigmaIcon className="w-4 h-4 text-slate-700" />
                        ) : file.type === "zip" ? (
                          <Archive className="w-4 h-4 stroke-[1.8]" />
                        ) : (
                          <FileText className="w-4 h-4 stroke-[1.8]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-slate-800 truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-normal">
                          {file.size}
                        </p>
                      </div>
                    </div>
                    <button
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors shrink-0"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[1.8]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Discussion Card */}
            <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                Discussion
              </h2>

              <div className="space-y-4 pt-1">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 mt-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={comment.avatar}
                        alt={comment.author}
                        width={28}
                        height={28}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-medium text-slate-900">
                          {comment.author}
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {comment.timeAgo}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-600 mt-0.5 font-normal">
                        {comment.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              <form
                onSubmit={handleSendComment}
                className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800 placeholder-slate-400 font-normal"
                />
                <button
                  type="submit"
                  className="bg-[#0084d4] hover:bg-[#0277bd] text-white px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Properties & Activity */}
          <div className="space-y-4">
            {/* Task Properties Card */}
            <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">
                Task Properties
              </h2>

              <div className="space-y-3 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-normal text-[12px]">Project</span>
                  <span className="font-semibold text-slate-800 text-[13px]">
                    {task.project}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-normal text-[12px]">Assigned By</span>
                  <span className="font-semibold text-slate-800 text-[13px]">
                    {task.assignedBy || "Sarah Williams"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-normal text-[12px]">Priority</span>
                  <PriorityBadge priority={task.priority} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-normal text-[12px]">Status</span>
                  <StatusBadge status={taskStatus} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-normal text-[12px]">Due Date</span>
                  <span className="font-semibold text-slate-800 text-[13px]">
                    {task.fullDueDate || "Sep 20, 2026"}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSubmitForReview}
                  className="w-full bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold py-2 rounded-lg transition-colors shadow-xs cursor-pointer text-center"
                >
                  Submit for Review
                </button>
              </div>
            </div>

            {/* Task Activity Card */}
            <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs">
              <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight mb-4">
                Task Activity
              </h2>

              <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200">
                {activities.map((act) => (
                  <div key={act.id} className="relative">
                    <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-slate-400 ring-4 ring-white" />
                    <p className="text-[13px] font-medium text-slate-800 leading-tight">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
                      {act.detail} &bull; {act.date}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
