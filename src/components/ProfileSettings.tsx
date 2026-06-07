/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserProfile } from "../types";
import { 
  User, 
  Smartphone, 
  Briefcase, 
  Mail, 
  Globe, 
  Moon, 
  Sun, 
  Sparkles, 
  ShieldCheck, 
  Lock,
  Instagram
} from "lucide-react";
import { locales } from "../locale";

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  lang: "en" | "hi" | "or";
  setLang: (lang: "en" | "hi" | "or") => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  adminEmail?: string;
}

export default function ProfileSettings({ 
  userProfile, 
  onUpdateProfile, 
  lang, 
  setLang, 
  darkMode, 
  setDarkMode,
  adminEmail = "bindhanibikash71@gmail.com"
}: ProfileSettingsProps) {
  const t = locales[lang];

  // Form states
  const [displayName, setDisplayName] = useState(userProfile.displayName || "");
  const [phoneNumber, setPhoneNumber] = useState(userProfile.phoneNumber || "");
  const [designation, setDesignation] = useState(userProfile.designation || "Security Guard");
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState("");



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setSuccess("");

    try {
      await onUpdateProfile({
        displayName,
        phoneNumber,
        designation
      });
      setSuccess(t.saveSuccess);
    } catch (err) {
      console.error(err);
      alert("Failed updating online credentials.");
    } finally {
      setUpdating(false);
    }
  };

  // Recommend contacting Administrator's email to get upgraded
  const togglePlanUpgrade = async () => {
    if (userProfile.plan === "premium") {
      if (window.confirm("Do you want to request downgrading your premium plan to free tier?")) {
        await onUpdateProfile({ plan: "free" });
        alert("Your account plan was changed to Free.");
      }
    } else {
      alert(`Premium features actuate instantly! To upgrade to Premium, please contact our administrator directly on Email:\n\n👉  ${adminEmail}  👈\n\nYour account will be upgraded immediately upon review.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 dark:border-slate-800">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t.profile} & Settings</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sync your field credentials, select system languages, and toggle lighting configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Edit Form */}
        <div className={`col-span-2 p-5 border rounded-xl shadow-sm space-y-4 ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
          <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200 flex items-center gap-2 border-b dark:border-slate-800 pb-3">
            <User className="text-blue-500 w-4 h-4" /> Operational Information
          </h3>

          {success && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className={`block w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Designation / Role Title</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className={`block w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-705"}`}
                  >
                    <option>Security Guard</option>
                    <option>Operations Supervisor</option>
                    <option>Housekeeping Staff</option>
                    <option>Shift Commander</option>
                    <option>Facility Manager</option>
                    <option>Site Commander</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mobile / Phone Contact</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 9812234509"
                    className={`block w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Connected Email</label>
                <div className="relative rounded-md shadow-sm opacity-60">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    disabled
                    value={userProfile.email}
                    className={`block w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border rounded-lg bg-slate-100 dark:bg-slate-950 ${darkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-xs shadow-sm"
            >
              {updating ? "Saving adjustments..." : "Save My Details"}
            </button>
          </form>
        </div>

        {/* Premium Upgrade callout card */}
        <div className={`p-5 border rounded-xl space-y-4 flex flex-col justify-between bg-slate-900 border-slate-800 text-white relative overflow-hidden shadow-sm`}>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-bold rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              SaaS Operational Bundle
            </div>

            <h3 className="font-bold text-base text-slate-100">Premium Upgrade</h3>
            <p className="text-xs text-slate-450 leading-relaxed text-slate-400">
              Ascend to a senior operations profile by utilizing unlimited reports with fast response structures, VIP client communication, and printable log handovers.
            </p>

            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-1.5 text-slate-300">
                <span className="text-blue-400 font-bold">✓</span> <span>Unlimited Report Generation</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <span className="text-blue-400 font-bold">✓</span> <span>Faster AI Response</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <span className="text-blue-400 font-bold">✓</span> <span>Advanced Templates Included</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <span className="text-blue-400 font-bold">✓</span> <span>Priority Supervisor Helpline</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Account Status:</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${userProfile.plan === "premium" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                {userProfile.plan === "premium" ? "PREMIUM MEMBERSHIP" : "FREE PLAN"}
              </span>
            </div>

            <button
              onClick={togglePlanUpgrade}
              className="w-full py-2 px-4 font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition text-xs shadow-sm"
            >
              {userProfile.plan === "premium" ? "Downgrade to Free" : "Upgrade to Premium Plan"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
