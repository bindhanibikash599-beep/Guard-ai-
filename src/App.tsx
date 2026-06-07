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
  Instagram,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Plus,
  RefreshCcw
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
    freeDailyLimit: 5,
    premiumDailyLimit: 100,
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
  const [adminEmail, setAdminEmail] = useState<string>("bindhanibikash71@gmail.com");

  // Credit/Limit Calculation Helpers
  const getDailyRequestLimit = () => {
    if (userProfile?.chatLimit !== undefined && userProfile?.chatLimit !== null && userProfile?.chatLimit !== "") {
      return Number(userProfile.chatLimit);
    }
    const isPremium = userProfile?.plan === "premium";
    if (isPremium) {
      return Number(systSettings.premiumDailyLimit ?? 100);
    } else {
      return Number(systSettings.freeDailyLimit ?? 5);
    }
  };

  const getTodayRequestCount = () => {
    const todayStr = new Date().toDateString();
    return reports.filter(r => new Date(r.createdAt).toDateString() === todayStr).length;
  };

  const dailyLimit = getDailyRequestLimit();
  const todayRequestCount = getTodayRequestCount();
  const remainingCredits = Math.max(0, dailyLimit - todayRequestCount);
  const isLimitExceeded = todayRequestCount >= dailyLimit;

  const t = locales[lang];

  // Load dynamic safe configuration on mount
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.adminEmail) {
          setAdminEmail(data.adminEmail);
        }
      })
      .catch((err) => console.error("Failed to load admin config:", err));
  }, []);

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
          freeDailyLimit: data.freeDailyLimit !== undefined ? Number(data.freeDailyLimit) : 5,
          premiumDailyLimit: data.premiumDailyLimit !== undefined ? Number(data.premiumDailyLimit) : 100,
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
            const isDefaultAdmin = firebaseUser.email === adminEmail;
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
          
          // Go to workspace on successful load or deep routing to the requested page
          const path = window.location.pathname;
          const hash = window.location.hash;
          if ((path === "/admin" || path.endsWith("/admin") || hash === "#admin" || hash.endsWith("admin")) && data.role === "admin") {
            setCurrentView("admin");
          } else if (path === "/aiwriter" || hash === "#aiwriter") {
            setCurrentView("aiwriter");
          } else if (path === "/forms" || hash === "#forms") {
            setCurrentView("forms");
          } else if (path === "/history" || hash === "#history") {
            setCurrentView("history");
          } else if (path === "/favorites" || hash === "#favorites") {
            setCurrentView("favorites");
          } else if (path === "/profile" || hash === "#profile") {
            setCurrentView("profile");
          } else {
            setCurrentView("dashboard");
          }
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
        const path = window.location.pathname;
        const hash = window.location.hash;
        if (path === "/admin" || path.endsWith("/admin") || hash === "#admin" || hash.endsWith("admin")) {
          setCurrentView("auth");
        } else {
          setCurrentView("landing");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync URL address bar with currentView tab changes
  useEffect(() => {
    const path = window.location.pathname;
    if (currentView === "admin") {
      if (path !== "/admin") window.history.pushState(null, "", "/admin");
    } else if (currentView === "dashboard") {
      if (path !== "/" && path !== "/dashboard") window.history.pushState(null, "", "/");
    } else if (currentView === "landing") {
      if (path !== "/") window.history.pushState(null, "", "/");
    } else if (currentView === "auth") {
      if (path !== "/auth" && path !== "/admin") window.history.pushState(null, "", "/auth");
    } else {
      if (path !== `/${currentView}`) window.history.pushState(null, "", `/${currentView}`);
    }
  }, [currentView]);

  // Support native browser Back/Forward navigation buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/admin") {
        if (userProfile?.role === "admin") {
          setCurrentView("admin");
        } else {
          setCurrentView("auth");
        }
      } else if (path === "/auth") {
        setCurrentView(user ? "dashboard" : "auth");
      } else if (path === "/" || path === "") {
        setCurrentView(user ? "dashboard" : "landing");
      } else {
        const view = path.substring(1);
        const validViews = ["dashboard", "aiwriter", "forms", "history", "favorites", "profile"];
        if (validViews.includes(view)) {
          setCurrentView(user ? view : "landing");
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [user, userProfile]);

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
        adminEmail={adminEmail}
        freeDailyLimit={systSettings.freeDailyLimit}
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
        adminEmail={adminEmail}
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
              <img
                src="https://fat-azure-kkcyikqe.edgeone.app/file_00000000f60071fab8c19be6b3db0ab7.png"
                alt="Guard AI Logo"
                className="w-8 h-8 object-contain rounded-md"
                referrerPolicy="no-referrer"
              />
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
        <header className={`h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b sticky top-0 backdrop-blur-md z-40 ${darkMode ? "bg-[#111d38]/90 border-slate-900" : "bg-white border-slate-150"}`}>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-indigo-500 transition mr-2">
              <Menu className="w-5 h-5" />
            </button>

            {/* Custom Mockup Shield Brand Guard AI */}
            <div className="flex items-center gap-2">
              <img
                src="https://fat-azure-kkcyikqe.edgeone.app/file_00000000f60071fab8c19be6b3db0ab7.png"
                alt="Guard AI Logo"
                className="w-8 h-8 object-contain rounded-md shrink-0"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-800 dark:text-white uppercase font-sans">Guard AI</span>
              </div>
            </div>
          </div>

          {/* Right Header Controls (Bell and Signout buttons exactly like screenshots) */}
          <div className="flex items-center gap-3">

            {/* Notification Bell with simulated interaction */}
            <button 
              onClick={() => {
                alert("🔔 Guard AI: All systems online. No new alerts!");
              }}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            </button>

            {/* Exit/Logout Button as shown in the screenshot */}
            <button 
              onClick={executeLogout}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4 transform rotate-180" />
            </button>
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
              
              {/* Friendly Welcome Bar with high readability */}
              <div className="flex items-center justify-between px-1 py-1">
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                    Official Active Session
                  </p>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Officer:</span> 
                    <span className="text-blue-600 dark:text-blue-300 font-semibold">{userProfile?.displayName || "Officer"}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-slate-500 dark:text-slate-400">{userProfile?.designation || "Security Guard"}</span>
                  </h4>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold text-emerald-750 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    ACTIVE PORTAL
                  </span>
                </div>
              </div>

              {/* Personal usage metrics summary cards EXACTLY styled like mockup images */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                
                {/* 1. Attendance Card */}
                <div 
                  onClick={() => { setCurrentView("forms"); setFormSubTab("attendance"); }}
                  className="bg-white dark:bg-[#111d38] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all hover:border-emerald-400 cursor-pointer text-left"
                >
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 p-2 rounded-xl w-fit mb-3">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest font-mono">ATTENDANCE</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm mt-1 block">
                      {reports.filter(r => r.type === 'attendance').length || 14} Guards Present
                    </span>
                  </div>
                </div>

                {/* 2. Incidents Card */}
                <div 
                  onClick={() => { setCurrentView("forms"); setFormSubTab("incident"); }}
                  className="bg-white dark:bg-[#111d38] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all hover:border-blue-400 cursor-pointer text-left"
                >
                  <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 p-2 rounded-xl w-fit mb-3 font-extrabold text-xs">
                    🔔
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest font-mono">INCIDENTS</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm mt-1 block">
                      {reports.filter(r => r.type === 'incident').length || 0} New Alerts
                    </span>
                  </div>
                </div>

                {/* 3. Daily Logs Card */}
                <div 
                  onClick={() => { setCurrentView("forms"); setFormSubTab("dailylog"); }}
                  className="bg-white dark:bg-[#111d38] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all hover:border-purple-400 cursor-pointer text-left"
                >
                  <div className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 p-2 rounded-xl w-fit mb-3">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest font-mono">DAILY LOGS</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold text-xs sm:text-sm mt-1 block">
                      Shift C-3 Active
                    </span>
                  </div>
                </div>

                {/* 4. New Report Button (Solid Blue Card!) */}
                <div 
                  onClick={() => { localStorage.setItem("translator_format_type", "security"); setCurrentView("aiwriter"); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer text-left border-0"
                >
                  <div className="bg-white/20 text-white p-2 rounded-xl w-fit mb-3">
                    <Plus className="w-5 h-5 text-white font-extrabold" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold text-blue-200 uppercase tracking-widest font-mono">NEW REPORT</span>
                    <span className="text-white font-extrabold text-xs sm:text-sm mt-1 block">
                      Start Quick Draft
                    </span>
                  </div>
                </div>

              </div>

              {/* Daily Credit limits monitoring bar */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${darkMode ? "bg-[#111d38]/50 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="space-y-0.5">
                  <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-400 dark:text-slate-500 font-mono">My Daily Conversions Limit</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{remainingCredits}</span>
                    <span className="text-xs text-slate-400">/ {dailyLimit} generations left today</span>
                  </div>
                </div>
                <div>
                  {userProfile?.plan === "premium" ? (
                    <span className="px-2.5 py-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 rounded-full font-mono">
                      💎 PREMIUM ACCOUNT
                    </span>
                  ) : (
                    <button 
                      onClick={() => setCurrentView("profile")}
                      className="px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/2 transition rounded-lg"
                    >
                      🚀 Upgrade credits
                    </button>
                  )}
                </div>
              </div>

              {/* 8 GENERATION TOOLS SECTION WITH MATCHING STYLES AS SHOWN IN SCREENSHOTS */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-blue-500 font-bold text-xs">●</span>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                    ALL GENERATION TOOLS
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  
                  {/* Tool 1: AI Professional English Converter */}
                  <div 
                    onClick={() => {
                      localStorage.setItem("translator_format_type", "corporate");
                      setCurrentView("aiwriter");
                    }}
                    className="bg-white dark:bg-[#111d38] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md hover:border-violet-400 dark:hover:border-violet-600 transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-150">AI Professional English Converter</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Convert casual text to pro English (Ready for WhatsApp)</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-350 dark:text-slate-600 shrink-0" />
                  </div>

                  {/* Tool 2: AI Casual English Converter */}
                  <div 
                    onClick={() => {
                      localStorage.setItem("translator_format_type", "brief");
                      setCurrentView("aiwriter");
                    }}
                    className="bg-white dark:bg-[#111d38] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <MessageSquareCode className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-150">AI Casual English Converter</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Convert complex text to casual friendly English messages</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-350 dark:text-slate-600 shrink-0" />
                  </div>

                  {/* Tool 3: Late Reporting */}
                  <div 
                    onClick={() => {
                      setCurrentView("forms");
                      setFormSubTab("late");
                    }}
                    className="bg-white dark:bg-[#111d38] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition cursor-pointer text-left relative"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-150">Late Reporting</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Professional delay messages & official delay apologies</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-350 dark:text-slate-600 shrink-0" />
                  </div>

                  {/* Tool 4: Visitor Log */}
                  <div 
                    onClick={() => {
                      setCurrentView("forms");
                      setFormSubTab("visitor");
                    }}
                    className="bg-white dark:bg-[#111d38] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-150">Visitor Log</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Standardized guest entries & vehicle log templates</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-350 dark:text-slate-600 shrink-0" />
                  </div>

                  {/* Tool 5: Shift Handover */}
                  <div 
                    onClick={() => {
                      setCurrentView("forms");
                      setFormSubTab("handover");
                    }}
                    className="bg-white dark:bg-[#111d38] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md hover:border-purple-400 dark:hover:border-purple-600 transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <RefreshCcw className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-150">Shift Handover</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Detailed duty transitions & equipment checklist handover</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-350 dark:text-slate-600 shrink-0" />
                  </div>

                  {/* Tool 6: Attendance Report */}
                  <div 
                    onClick={() => {
                      setCurrentView("forms");
                      setFormSubTab("attendance");
                    }}
                    className="bg-white dark:bg-[#111d38] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-150">Attendance Report</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Generate daily attendance slips & shift timings report</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-350 dark:text-slate-600 shrink-0" />
                  </div>

                  {/* Tool 7: Incident Report */}
                  <div 
                    onClick={() => {
                      setCurrentView("forms");
                      setFormSubTab("incident");
                    }}
                    className="bg-white dark:bg-[#111d38] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md hover:border-rose-400 dark:hover:border-rose-600 transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <BadgeAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-150">Incident Report</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Secure security incident logs & action taken reports</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-350 dark:text-slate-600 shrink-0" />
                  </div>

                  {/* Tool 8: Leave Application */}
                  <div 
                    onClick={() => {
                      setCurrentView("forms");
                      setFormSubTab("leave");
                    }}
                    className="bg-white dark:bg-[#111d38] border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md hover:border-teal-400 dark:hover:border-teal-600 transition cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-950/45 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-150">Leave Application</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Formal leave request letters & sick leave drafts</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-350 dark:text-slate-600 shrink-0" />
                  </div>

                </div>
              </div>

              {/* GORGEOUS HIGH-FIDELITY FOOTER FROM SCREENSHOTS */}
              <div className="border-t border-slate-150 dark:border-slate-800 pt-5 mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                <div>
                  © 2024 Guard English AI. All rights reserved.
                </div>
                <div className="flex items-center gap-1">
                  <span>Built for Officers by</span>
                  <a 
                    href={systSettings.instagramId ? `https://www.instagram.com/${systSettings.instagramId}` : "#"} 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Bikash Bindhani</span>
                    {systSettings.instagramId && <span className="text-pink-500">📸</span>}
                  </a>
                </div>
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
              isLimitExceeded={isLimitExceeded}
              dailyLimit={dailyLimit}
              remainingCredits={remainingCredits}
              adminEmail={adminEmail}
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
              isLimitExceeded={isLimitExceeded}
              dailyLimit={dailyLimit}
              remainingCredits={remainingCredits}
              adminEmail={adminEmail}
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
              adminEmail={adminEmail}
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
