"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useTeamFlow } from "@/context/TeamFlowContext";
import {
  Mail,
  Briefcase,
  Calendar,
  ShieldCheck,
  Building,
  Award,
  Pencil,
  Check,
  X,
  Phone,
  MapPin
} from "lucide-react";

export default function ProfilePage() {
  const { currentUser } = useTeamFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [formData, setFormData] = useState({
    name: currentUser.name,
    fullName: currentUser.fullName,
    email: currentUser.email,
    role: currentUser.jobTitle,
    department: currentUser.department,
    employeeId: currentUser.employeeId,
    phone: currentUser.phone,
    location: currentUser.location,
    bio: "Passionate about building scalable applications, team synchronization, and agile engineering workflows."
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Header
        title="Personal Profile"
        subtitle="Manage personal identification, work credentials, and organization contact info"
      />

      <div className="px-7 py-6 space-y-6">
        {showSuccessToast && (
          <div className="p-3 bg-[#4ade1d]/15 border border-[#4ade1d]/30 text-[#4ade1d] rounded-lg text-[12px] font-medium flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#4ade1d] shrink-0" />
              <span>Profile details updated successfully.</span>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="text-[#4ade1d] hover:opacity-80 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200/80 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border-2 border-[#0084d4]/30 shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
                    {currentUser.fullName}
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-sky-100 text-[#0084d4]">
                    {currentUser.role.replace("_", " ")}
                  </span>
                </div>
                <p className="text-[13px] text-slate-500 font-medium mt-0.5">
                  {currentUser.jobTitle}
                </p>
                <p className="text-[12px] text-slate-400 font-normal mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {currentUser.location}
                </p>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-[12px] font-medium transition-colors shadow-2xs shrink-0 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[13px] text-slate-600 font-normal leading-relaxed">
              {formData.bio}
            </p>
          </div>
        </div>

        {isEditing ? (
          <form
            onSubmit={handleSave}
            className="bg-white rounded-lg border border-slate-200/80 p-6 shadow-2xs space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
                Update Information
              </h3>
              <span className="text-[11px] text-slate-400">Make changes and click save</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Professional Bio
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0084d4] text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[12px] font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0084d4] hover:bg-[#0277bd] text-white text-[12px] font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
                Employment Credentials
              </h3>

              <div className="space-y-3 text-[13px]">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-normal flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    Employee ID
                  </span>
                  <span className="font-semibold text-slate-800">{currentUser.employeeId}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-normal flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    Department
                  </span>
                  <span className="font-semibold text-slate-800">{currentUser.department}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 font-normal flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    System Role
                  </span>
                  <span className="font-semibold text-purple-700 capitalize">
                    {currentUser.role.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">
                Contact Information
              </h3>

              <div className="space-y-3 text-[13px]">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-normal flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    Work Email
                  </span>
                  <span className="font-semibold text-slate-800">{currentUser.email}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-normal flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    Phone Number
                  </span>
                  <span className="font-semibold text-slate-800">{currentUser.phone}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 font-normal flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Office Hub
                  </span>
                  <span className="font-semibold text-slate-800">{currentUser.location}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
