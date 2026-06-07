/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { ref, onValue, set, push, remove, get } from "firebase/database";
import { auth, rtdb, handleLogout } from "./firebase";
import { UserProfile, GeneratedReport } from "./types";
import { locales } from "./locale";

// Icons 
import { 
  Shield, 
  Menu, 
  X, 
  Sparkles, 
  Zap, 
  FileCheck2, 
  UserCheck, 
  Bookmark, 
  LogOut, 
  Lock, 
  User as UserIcon, 
  Settings, 
  BarChart3, 
  History,
  Home,
  MessageSquareCode,
  FileText,
  BadgeAlert,
  Moon,
  Sun,
  ClipboardList,
  Fingerprint,
  TrendingDown,
  Clock,
  ExternalLink,
  Instagram
} from "lucide-react";

// Sub-views
import LandingPage from "./components/LandingPage";
import LoginRegister from "./components/LoginRegister";
import TranslatorView from "./components/TranslatorView";
import FormsView from "./components/FormsView";
import HistoryFavorites from "./components/HistoryFavorites";
import ProfileSettings from "./components/ProfileSettings";
import AdminDashboardView from "./components/AdminDashboardView";

export default function App() {
  // Navigation states
  // Authenticated views: 'dashboard' | 'aiwriter' | 'forms' | 'history' | 'favorites' | 'profile' | 'admin'
  // Unauthenticated views: 'landing' | 'auth'
  const [currentView, setCurrentView] = useState<string>("landing");
  const [formSubTab, setFormSubTab] = useState<string>("attendance");

  // Dynamic social handles and broadcast settings from Admin database
  const [systSettings, setSystSettings] = useState({
    modelId: "z-ai/glm-4.5-air:free",
    instagramId: "_noirvex1",
    telegramGroupLink: "https://t.me/+fPPluun0pE9lZjY1",
    announcement: "",
  });

  // Authentication & Users
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Database list states
  const [reports, setReports] = useState<GeneratedReport[]>([]);

  // Layout configs
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [lang, setLang] = useState<"en" | "hi" | "or">("en");

  const t = locales[lang];

  // Subscribe to dynamic settings
  useEffect(() => {
    const settingsRef = ref(rtdb, "system/settings");
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSystSettings({
          modelId: data.modelId || "z-ai/glm-4.5-air:free",
          instagramId: data.instagramId || "_noirvex1",
          telegramGroupLink: data.telegramGroupLink || "https://t.me/+fPPluun0pE9lZjY1",
          announcement: data.announcement || "",
        });
      }
    });
    return () => {
      unsubSettings();
    };
  }, []);

  // Monitor Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Load Profile from RTDB
        const profileRef = ref(rtdb, `users/${firebaseUser.uid}`);
        
        onValue(profileRef, async (snapshot) => {
          let data = snapshot.val();
          if (!data) {
            // Self-register profile if not present
            const isDefaultAdmin = firebaseUser.email === "bindhanibikash71@gmail.com";
            data = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "Officer Profile",
              role: isDefaultAdmin ? "admin" : "user",
              plan: "free",
              createdAt: Date.now()
            };
            await set(profileRef, data);
          }
          setUserProfile(data);
          
          // Go to workspace on successful load
          setCurrentView("dashboard");
        });

        // Load Personal Reports History
        const reportsRef = ref(rtdb, `reports/${firebaseUser.uid}`);
        onValue(reportsRef, (snapshot) => {
          const list = snapshot.val();
          if (list) {
            const arr = Object.keys(list).map((key) => ({
              id: key,
              ...list[key]
            }));
            setReports(arr.sort((a, b) => b.createdAt - a.createdAt));
          } else {
            setReports([]);
          }
        });

      } else {
        setUserProfile(null);
        setReports([]);
        setCurrentView("landing");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Dark Mode state to index.html HTML element classes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Auth logout triggers
  const executeLogout = async () => {
    await handleLogout();
    setCurrentView("landing");
  };

  // Helper: Save reports to DB
  const handleSaveReportToDb = async (reportData: { 
    title: string; 
    type: string; 
    originalInput: string; 
    formattedOutput: string 
  }) => {
    if (!user) return;
    const reportsRef = ref(rtdb, `reports/${user.uid}`);
    const newReportRef = push(reportsRef);
    await set(newReportRef, {
      ...reportData,
      id: newReportRef.key,
      uid: user.uid,
      favorite: false,
      createdAt: Date.now()
    });
  };

  // Toggle report bookmark favorite status 
  const handleToggleFavorite = async (id: string, current: boolean) => {
    if (!user) return;
    await set(ref(rtdb, `reports/${user.uid}/${id}/favorite`), !current);
  };

  // Delete personal report log
  const handleDeleteReport = async (id: string) => {
    if (!user) return;
    if (window.confirm("Delete this report from your archives?")) {
      await remove(ref(rtdb, `reports/${user.uid}/${id}`));
    }
  };

  // Update personalized metadata (Designation, Mobile, DisplayName, Plan, etc.)
  const handleUpdateProfile = async (updatedFields: Partial<UserProfile>) => {
    if (!user || !userProfile) return;
    await set(ref(rtdb, `users/${user.uid}`), {
      ...userProfile,
      ...updatedFields
    });
  };

  // Loading Screens Spinner Layout
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center font-sans text-slate-100 p-4">
        <div className="bg-indigo-600 p-4 rounded-3xl shadow-2xl animate-bounce mb-4 text-white">
          <Shield className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-sky-400 bg-clip-text text-transparent">
          GUARD ENGLISH AI
        </h3>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">Initializing Workspace logs...</p>
      </div>
    );
  }

  // A. Public Landing Page Display
  if (currentView === "landing" && !user) {
    return (
      <LandingPage 
        onStartFree={() => setCurrentView("auth")} 
        lang={lang} 
        setLang={setLang} 
        darkMode={darkMode} 
      />
    );
  }

  // B. Authentication Screen Display
  if (currentView === "auth" && !user) {
    return (
      <LoginRegister 
        onSuccess={() => setCurrentView("dashboard")} 
        onBackToLanding={() => setCurrentView("landing")}
        lang={lang}
        darkMode={darkMode}
      />
    );
  }

  // Compute stats helper
  const personalStats = {
    totalReports: reports.length,
    favorites: reports.filter((r) => r.favorite).length,
    convs: reports.filter((r) => r.type === "conv").length,
    forms: reports.filter((r) => r.type !== "conv").length,
  };

  // C. Authenticated Main Layout
  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-200 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-[#F4F7FA] text-slate-800"}`}>
      
      {/* Sidebar navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 border-r flex flex-col justify-between ${darkMode ? "bg-[#111d38] border-blue-950/60" : "bg-[#1B2A4E] border-blue-900/50"} text-white`}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">GUARD ENGLISH AI</span>
            </div>
            
            {/* Mobile close button */}
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="border-t border-blue-900/50"></div>

          {/* Menu Options links list */}
          <nav className="space-y-1">
            <button
              onClick={() => { setCurrentView("dashboard"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                currentView === "dashboard"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-blue-900/40"
              }`}
            >
              <Home className="w-4 h-4" />
              {t.dashboard}
            </button>

            <button
              onClick={() => { setCurrentView("aiwriter"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                currentView === "aiwriter"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-blue-900/40"
              }`}
            >
              <MessageSquareCode className="w-4 h-4" />
              {t.aiWriter}
            </button>

            <button
              onClick={() => { setCurrentView("forms"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                currentView === "forms"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-blue-900/40"
              }`}
            >
              <FileText className="w-4 h-4" />
              {t.attendance}
            </button>

            <button
              onClick={() => { setCurrentView("history"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                currentView === "history"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-blue-900/40"
              }`}
            >
              <History className="w-4 h-4" />
              {t.history}
            </button>

            <button
              onClick={() => { setCurrentView("favorites"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                currentView === "favorites"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-blue-900/40"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              {t.favorites}
            </button>

            <button
              onClick={() => { setCurrentView("profile"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                currentView === "profile"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-blue-900/40"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              {t.profile} & Settings
            </button>

            {/* SECURE ADMIN PANEL */}
            {userProfile?.role === "admin" && (
              <div className="pt-4 mt-4 border-t border-blue-900/50">
                <div className="px-3 py-1 text-slate-400 text-xs uppercase font-bold tracking-widest">
                  {t.adminPanel}
                </div>
                <button
                  onClick={() => { setCurrentView("admin"); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all mt-1 ${
                    currentView === "admin"
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-blue-900/40"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  System Management
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Footer Area with user profile card & sign out */}
        <div className="p-4 space-y-3 bg-blue-950/40 rounded-xl m-2 border border-blue-900/30">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">
            Developer / Community Update
          </div>
          <div className="min-w-0 leading-tight space-y-1.5">
            <p className="text-sm font-semibold text-white">Bikash Bindhani</p>
            {systSettings.instagramId && (
              <a 
                href={`https://www.instagram.com/${systSettings.instagramId}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-slate-300 hover:text-rose-400 text-xs flex items-center gap-1.5 transition-all"
              >
                <Instagram className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Instagram: <strong className="underline">@{systSettings.instagramId}</strong></span>
              </a>
            )}
            {systSettings.telegramGroupLink && (
              <a 
                href={systSettings.telegramGroupLink} 
                target="_blank" 
                rel="noreferrer"
                className="text-slate-300 hover:text-sky-400 text-xs flex items-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Join community updates: <strong className="underline">Telegram</strong></span>
              </a>
            )}
          </div>

          <div className="border-t border-blue-900/30 my-2"></div>

          <button
            onClick={executeLogout}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Container workspace */}
      <main className="flex-1 md:pl-64 flex flex-col justify-start">
        
        {/* Workspace Top Header Panel */}
        <header className={`h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b sticky top-0 backdrop-blur-md z-40 ${darkMode ? "bg-slate-950/80 border-slate-900" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-indigo-500 transition">
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex flex-col">
              <h1 className="text-sm sm:text-base font-bold leading-tight uppercase font-mono tracking-tight text-slate-900 dark:text-white">
                {currentView === "dashboard" && "Workspace Dashboard"}
                {currentView === "aiwriter" && "AI Writing Assistant"}
                {currentView === "forms" && "Structured Operations Forms"}
                {currentView === "history" && "System Logs & Archives"}
                {currentView === "favorites" && "Saved Bookmarks"}
                {currentView === "profile" && "Officer Profile & Settings"}
                {currentView === "admin" && "System Administration Panel"}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">Write Professional English Reports in Seconds</p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Quick Multi-Language selections toggle */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
              {(["en", "hi", "or"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-[10px] uppercase font-extrabold px-2 py-1 rounded transition-all ${lang === l ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Global Broadcast Announcement Alert from Admin Panel */}
        {systSettings.announcement && (
          <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/15 to-teal-600/10 border-b border-indigo-500/20 px-4 py-3 text-xs flex justify-between items-center gap-3 text-indigo-400">
            <div className="flex items-center gap-2">
              <span className="shrink-0 bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded text-[9px] uppercase animate-pulse">Broadcast Update</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{systSettings.announcement}</span>
            </div>
            {systSettings.telegramGroupLink && (
              <a 
                href={systSettings.telegramGroupLink} 
                target="_blank" 
                rel="noreferrer" 
                className="shrink-0 text-[10px] font-bold text-sky-400 hover:underline flex items-center gap-1 pr-2"
              >
                Discuss <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Dynamic active page render layout */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-2xl w-full mx-auto space-y-6">
          
          {/* Back to Dashboard Navigation Button at sub-features top */}
          {currentView !== "dashboard" && (
            <button 
              type="button"
              onClick={() => setCurrentView("dashboard")}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all cursor-pointer"
            >
              &larr; Back to Dashboard
            </button>
          )}
          
          {/* 1. Dashboard Landing View */}
          {currentView === "dashboard" && (
            <div className="space-y-6">
              
              {/* Profile welcome row */}
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 p-6 rounded-xl bg-gradient-to-br from-[#1B2A4E] to-[#121f3d] text-white shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {t.welcome}, {userProfile?.displayName || "Officer"}! 👮‍♂️
                  </h3>
                  <p className="text-xs text-blue-300 uppercase tracking-wider font-mono">
                    Official Duty Post: {userProfile?.designation || "Security Guard"} ({user?.email})
                  </p>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    Instantly translate and format regional language messages into professional English reports. Ready for WhatsApp groups, property managers, and clients.
                  </p>
                </div>

                <div className="flex flex-col items-center sm:items-end justify-center shrink-0 md:border-l border-white/10 md:pl-6">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plan Status</span>
                  <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">{userProfile?.plan?.toUpperCase()} CARD</span>
                  <button 
                    onClick={() => { setCurrentView("profile"); }}
                    className="text-[10px] font-bold underline text-slate-300 mt-2 hover:text-white transition"
                  >
                    Edit Profile Details &rarr;
                  </button>
                </div>
              </div>

              {/* Personal usage brief cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 border rounded-xl relative overflow-hidden shadow-sm ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Reports</span>
                  <span className="text-2xl font-bold mt-1 block text-blue-600 dark:text-blue-400">{personalStats.totalReports}</span>
                </div>
                <div className={`p-4 border rounded-xl relative overflow-hidden shadow-sm ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Bookmarks</span>
                  <span className="text-2xl font-bold mt-1 block text-amber-500">{personalStats.favorites}</span>
                </div>
                <div className={`p-4 border rounded-xl relative overflow-hidden shadow-sm ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">AI Conversions</span>
                  <span className="text-2xl font-bold mt-1 block text-teal-500">{personalStats.convs}</span>
                </div>
                <div className={`p-4 border rounded-xl relative overflow-hidden shadow-sm ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Structured Forms Logs</span>
                  <span className="text-2xl font-bold mt-1 block text-indigo-500 dark:text-indigo-400">{personalStats.forms}</span>
                </div>
              </div>

              {/* Quick Launchpad Buttons */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">👉 यहाँ क्लिक करें (Choose where to go):</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Option 1 */}
                  <div 
                    onClick={() => { setCurrentView("aiwriter"); }}
                    className="p-5 rounded-xl border cursor-pointer bg-white border-slate-200 hover:border-blue-400 hover:shadow-md transition duration-150"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-3">
                      <MessageSquareCode className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-sm text-slate-900">🎤 अंग्रेजी अनुवाद करें (Translate to English)</h5>
                    <p className="text-xs text-slate-600 mt-1">Hinglish, Hindi या Odia में बोलकर बढ़िया इंग्लिश मैसेज तैयार करें (Ready for WhatsApp).</p>
                  </div>

                  {/* Option 2 */}
                  <div 
                    onClick={() => { setCurrentView("forms"); setFormSubTab("attendance"); }}
                    className="p-5 rounded-xl border cursor-pointer bg-white border-slate-200 hover:border-blue-400 hover:shadow-md transition duration-150"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center mb-3">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <h5 className="font-extrabold text-sm text-slate-900">📋 सरकारी रिपोर्ट फॉर्म (Reports & Attendance)</h5>
                    <p className="text-xs text-slate-600 mt-1">हाजिरी, घटना की रिपोर्ट या शिफ्ट हैंडओवर जैसी रिपोर्ट्स के फॉर्म भरें (Print/Download PDF).</p>
                  </div>

                  {/* Option 3 */}
                  <div 
                    onClick={() => { setCurrentView("history"); }}
                    className="p-5 rounded-xl border cursor-pointer bg-white border-slate-200 hover:border-blue-400 hover:shadow-md transition duration-150"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-3">
                      <History className="w-4 h-4" />
                    </div>
                    <h5 className="font-extrabold text-sm text-slate-900">📁 पुरानी रिपोर्ट्स देखें (Review Saved Reports)</h5>
                    <p className="text-xs text-slate-600 mt-1">पहले से बनाई हुई सारी रिपोर्ट्स यहाँ देखें, कॉपी करें या दोबारा इस्तेमाल करें.</p>
                  </div>
                </div>
              </div>

               {/* Dev Profile Credit Footer section */}
              <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Fingerprint className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Platform Lead Developer: <strong className="text-slate-800 dark:text-white font-semibold">Bikash Bindhani</strong></span>
                </div>
                
                {systSettings.instagramId && (
                  <a 
                    href={`https://www.instagram.com/${systSettings.instagramId}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    <Instagram className="w-4 h-4 text-pink-500" />
                    Follow @{systSettings.instagramId} on Instagram
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

            </div>
          )}

          {/* 2. Translator View tab */}
          {currentView === "aiwriter" && (
            <TranslatorView 
              uid={user.uid} 
              lang={lang} 
              darkMode={darkMode} 
              onSaveReport={handleSaveReportToDb}
              plan={userProfile?.plan || "free"}
            />
          )}

          {/* 3. Forms Wizard tab */}
          {currentView === "forms" && (
            <FormsView 
              lang={lang} 
              darkMode={darkMode} 
              onSaveReport={handleSaveReportToDb}
              activeTab={formSubTab} 
              setActiveTab={setFormSubTab} 
            />
          )}

          {/* 4. History Logs View */}
          {currentView === "history" && (
            <HistoryFavorites 
              reports={reports} 
              onToggleFavorite={handleToggleFavorite} 
              onDeleteReport={handleDeleteReport} 
              darkMode={darkMode} 
            />
          )}

          {/* 5. Favorites Filtered View */}
          {currentView === "favorites" && (
            <HistoryFavorites 
              reports={reports} 
              onToggleFavorite={handleToggleFavorite} 
              onDeleteReport={handleDeleteReport} 
              onlyFavorites={true}
              darkMode={darkMode} 
            />
          )}

          {/* 6. Profiles & Toggles tab */}
          {currentView === "profile" && userProfile && (
            <ProfileSettings 
              userProfile={userProfile} 
              onUpdateProfile={handleUpdateProfile} 
              lang={lang} 
              setLang={setLang} 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
            />
          )}

          {/* 7. Super-secure Admin Dashboard Portal */}
          {currentView === "admin" && userProfile?.role === "admin" && (
            <AdminDashboardView darkMode={darkMode} />
          )}

        </div>
      </main>
    </div>
  );
}
