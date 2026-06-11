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
  RefreshCcw,
  ArrowLeft,
  Volume2,
  VolumeX
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
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [showPhrases, setShowPhrases] = useState<boolean>(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // PWA Add-To-Home Screen Installation Hooks
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState<boolean>(false);

  // Active Duty Patrol Countdown and Wake Alert states
  const [patrolActive, setPatrolActive] = useState<boolean>(false);
  const [patrolTimeLeft, setPatrolTimeLeft] = useState<number>(1800); // 30 minutes default
  const [patrolPreset, setPatrolPreset] = useState<number>(30); // 30 minutes preset

  // PWA Support detection
  useEffect(() => {
    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforePrompt);
    window.addEventListener("appinstalled", () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    });
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforePrompt);
    };
  }, []);

  const handleInstallAppClick = async () => {
    if (!deferredPrompt) {
      alert("💡 Install Guide (इंस्टॉल गाइड):\n\n1. Chrome browser par top-right corner par complete 3 dots (⋮) par click karein.\n2. 'Add to Home screen' ya 'Install App' ko select karein!\n3. Ab ye app ki tarah directly apke phone me chalega!");
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallBtn(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error("Installation error", err);
    }
  };

  // Safe Audio Context Instantiator
  const getSafeAudioCtx = (): AudioContext | null => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      return new AudioContextClass();
    } catch {
      return null;
    }
  };

  // Synthetic Whistle Sound Generator using Web Audio API nodes
  const playRefWhistle = () => {
    const ctx = getSafeAudioCtx();
    if (!ctx) {
      alert("⚠️ Audio synthesizer is not supported on this browser context.");
      return;
    }
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      // High frequency double chirp characteristic to real metal whistle
      osc.frequency.setValueAtTime(2300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2600, ctx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(2300, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(2700, ctx.currentTime + 0.45);
      osc.frequency.linearRampToValueAtTime(2200, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    } catch (err) {
      console.error("Whistle error", err);
    }
  };

  // Synthetic Security Siren Sound Generator
  const playSirensSound = () => {
    const ctx = getSafeAudioCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(550, ctx.currentTime);
      // Continuous oscillation sweep back and forth
      osc.frequency.linearRampToValueAtTime(950, ctx.currentTime + 0.4);
      osc.frequency.linearRampToValueAtTime(550, ctx.currentTime + 0.8);
      osc.frequency.linearRampToValueAtTime(950, ctx.currentTime + 1.2);
      osc.frequency.linearRampToValueAtTime(550, ctx.currentTime + 1.6);
      osc.frequency.linearRampToValueAtTime(950, ctx.currentTime + 2.0);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.3);
    } catch (err) {
      console.error("Siren error", err);
    }
  };

  // Dynamic Patrol Alert countdown interval effect
  useEffect(() => {
    let timerId: any = null;
    if (patrolActive) {
      timerId = setInterval(() => {
        setPatrolTimeLeft((prev) => {
          if (prev <= 1) {
            // Sound the alert instantly!
            playSirensSound();
            setTimeout(() => {
              playSirensSound();
            }, 2300);
            alert("⏰ PATROL TIME COMPLETED! (गश्त का समय समाप्त हुआ! चलिए राउंड लगाइये!)");
            setPatrolActive(false);
            return patrolPreset * 60;
          }
          // Periodic reminder pip sound every 2 minutes or when 10 seconds remain
          if ((prev - 1) % 120 === 0 && prev > 10) {
            // soft synthetic beep
            try {
              const ctx = getSafeAudioCtx();
              if (ctx) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.setValueAtTime(900, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
              }
            } catch {}
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [patrolActive, patrolPreset]);

  // Dynamic social handles and broadcast settings from Admin database
  const [systSettings, setSystSettings] = useState({
    modelId: "openai/gpt-oss-20b:free",
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
    // All users are gifted unlimited generations for now!
    return 99999999;
  };

  const getTodayRequestCount = () => {
    const todayStr = new Date().toDateString();
    return reports.filter(r => new Date(r.createdAt).toDateString() === todayStr).length;
  };

  const dailyLimit = getDailyRequestLimit();
  const todayRequestCount = getTodayRequestCount();
  const remainingCredits = 99999999;
  const isLimitExceeded = false;

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
          modelId: data.modelId || "openai/gpt-oss-20b:free",
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
          const checkIfAdmin = (emailStr: string | null | undefined) => {
            if (!emailStr) return false;
            const norm = emailStr.toLowerCase().trim();
            const list = ["bindhanibikash71@gmail.com", "bindhanibikash715@gmail.com"];
            if (adminEmail) list.push(adminEmail.toLowerCase().trim());
            return list.includes(norm);
          };
          const isDefaultAdmin = checkIfAdmin(firebaseUser.email);
          
          if (!data) {
            // Self-register profile if not present
            data = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "Officer Profile",
              role: isDefaultAdmin ? "admin" : "user",
              plan: isDefaultAdmin ? "premium" : "free",
              createdAt: Date.now()
            };
            await set(profileRef, data);
          } else if (isDefaultAdmin && (data.role !== "admin" || data.plan !== "premium")) {
            // Force role to admin if database is out of sync
            data.role = "admin";
            data.plan = "premium";
            await set(ref(rtdb, `users/${firebaseUser.uid}/role`), "admin");
            await set(ref(rtdb, `users/${firebaseUser.uid}/plan`), "premium");
          }
          setUserProfile(data);
          
          // Go to workspace on successful load or deep routing to the requested page
          const path = window.location.pathname;
          const hash = window.location.hash;
          const isAdminPath = (p: string, h: string) => {
            return p === "/admin" || p === "/admin.php" || p.endsWith("/admin") || p.endsWith("/admin.php") || h === "#admin" || h === "#admin.php" || h.endsWith("admin") || h.endsWith("admin.php");
          };

          if (isAdminPath(path, hash) && data.role === "admin") {
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
        const isAdminPath = (p: string, h: string) => {
          return p === "/admin" || p === "/admin.php" || p.endsWith("/admin") || p.endsWith("/admin.php") || h === "#admin" || h === "#admin.php" || h.endsWith("admin") || h.endsWith("admin.php");
        };
        if (isAdminPath(path, hash)) {
          setCurrentView("auth");
        } else {
          setCurrentView("landing");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [adminEmail]);

  // Sync URL address bar with currentView tab changes
  useEffect(() => {
    const path = window.location.pathname;
    if (currentView === "admin") {
      if (path !== "/admin" && path !== "/admin.php") window.history.pushState(null, "", "/admin.php");
    } else if (currentView === "dashboard") {
      if (path !== "/" && path !== "/dashboard") window.history.pushState(null, "", "/");
    } else if (currentView === "landing") {
      if (path !== "/") window.history.pushState(null, "", "/");
    } else if (currentView === "auth") {
      if (path !== "/auth" && path !== "/admin" && path !== "/admin.php") window.history.pushState(null, "", "/auth");
    } else {
      if (path !== `/${currentView}`) window.history.pushState(null, "", `/${currentView}`);
    }
  }, [currentView]);

  // Support native browser Back/Forward navigation buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/admin" || path === "/admin.php") {
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

  // C. Super-secure Standalone Full-screen Admin Panel (Separate Layout)
  if (currentView === "admin") {
    if (userProfile?.role !== "admin") {
      return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-slate-100 p-4">
          <p className="text-red-500 font-bold mb-2">ACCESS DENIED</p>
          <p className="text-sm text-slate-400 font-mono">You are not authorized to view the system dashboard.</p>
          <button 
            onClick={() => setCurrentView("dashboard")} 
            className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg text-xs font-bold font-mono transition-all hover:bg-indigo-700"
          >
            RETURN TO USER DASHBOARD
          </button>
        </div>
      );
    }
    
    return (
      <div className={`min-h-screen transition-colors duration-200 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
        <header className={`h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b sticky top-0 backdrop-blur-md z-40 ${darkMode ? "bg-[#111d38]/90 border-blue-950/60" : "bg-white border-slate-200"}`}>
          <div className="flex items-center gap-3">
            <img
              src="https://fat-azure-kkcyikqe.edgeone.app/file_00000000f60071fab8c19be6b3db0ab7.png"
              alt="Guard AI Logo"
              className="w-8 h-8 object-contain rounded-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight block uppercase text-blue-600 dark:text-blue-400 font-mono">GUARD AI SECURE ADMIN PORTAL</span>
              <span className="text-[9px] font-mono font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Authorized Operations Control</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition text-sm ${darkMode ? "bg-[#1a2948] border-blue-900/60 text-yellow-400" : "bg-slate-100 border-slate-200 text-slate-700"}`}
              title="Toggle Theme"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => setCurrentView("dashboard")}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK TO USER WORKSPACE
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className={`p-6 rounded-3xl border ${darkMode ? "bg-[#111d38]/40 border-blue-900/50" : "bg-white border-slate-200"} shadow-xl`}>
            <AdminDashboardView darkMode={darkMode} />
          </div>
        </main>
      </div>
    );
  }

  // C. Authenticated Main Layout
  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-300 ${darkMode ? "bg-[#090e1a] text-slate-100" : "bg-[#F4F7FA] text-slate-800"}`}>
      
      {/* Sidebar navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 border-r flex flex-col justify-between ${darkMode ? "bg-[#111827] border-slate-900/90 shadow-2xl" : "bg-[#1B2A4E] border-blue-900/50"} text-white`}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/25 rounded-lg blur-sm"></div>
                <img
                  src="https://fat-azure-kkcyikqe.edgeone.app/file_00000000f60071fab8c19be6b3db0ab7.png"
                  alt="Guard AI Logo"
                  className="w-8 h-8 object-contain rounded-md relative z-10"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-display font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">GUARD ENGLISH AI</span>
            </div>
            
            {/* Mobile close button */}
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="border-t border-slate-800/80"></div>

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
        <header className={`h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b sticky top-0 backdrop-blur-md z-40 ${darkMode ? "bg-[#090e1a]/85 border-slate-900/90" : "bg-white border-slate-150"}`}>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-indigo-400 transition mr-2">
              <Menu className="w-5 h-5" />
            </button>

            {/* Custom Mockup Shield Brand Guard AI */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-md blur-sm"></div>
                <img
                  src="https://fat-azure-kkcyikqe.edgeone.app/file_00000000f60071fab8c19be6b3db0ab7.png"
                  alt="Guard AI Logo"
                  className="w-7 h-7 object-contain rounded-md shrink-0 relative z-10"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-display font-bold text-base tracking-tight text-slate-800 dark:text-white uppercase">GUARD AI WORKSPACE</span>
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
              
              {/* PWA DYNAMIC INSTALLATION ACTION PROMPT CARD */}
              <div className={`p-4 rounded-2xl border bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl relative overflow-hidden transition-all duration-300`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 py-0.5 rounded bg-white/20 text-[9px] font-extrabold uppercase tracking-wide">📱 Install App Mode</span>
                      <span className="text-[11px] font-medium text-blue-100">Highly Recommended for Chrome & Android</span>
                    </div>
                    <h4 className="text-sm font-extrabold tracking-tight uppercase">
                      Install Guard AI App! (होम स्क्रीन पर जोड़ें)
                    </h4>
                    <p className="text-[11px] text-blue-100 leading-snug">
                      Apne mobile screen par asali app ki tarah behtar fullscreen experience aur instant use ke liye setup karein!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleInstallAppClick}
                    className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-slate-50 font-extrabold text-xs transition duration-150 active:scale-95 shrink-0 uppercase tracking-wider"
                  >
                    🚀 Install App / जोड़ें
                  </button>
                </div>
              </div>
              
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

              {/* BEGINNERS GUIDE TO USE THE PORTAL */}
              <div className={`p-4 rounded-2xl border transition-all duration-200 ${
                darkMode ? "bg-slate-900/40 border-slate-800/80" : "bg-indigo-50/70 border-indigo-100"
              }`}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                        kahan Click Karein? - Beginners Guide (बिगनर्स गाइड)
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Naye security guards is guide ko read karke aashani se log generate kar sakte hain!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-[10px] uppercase font-extrabold px-3 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-indigo-600 dark:text-indigo-400 rounded-lg border border-slate-200 dark:border-slate-800 transition"
                  >
                    {showGuide ? "Hide / छुपाएं" : "Show / दिखाएं"}
                  </button>
                </div>

                {showGuide && (
                  <div className="mt-4 space-y-4 border-t border-slate-200 dark:border-slate-800/80 pt-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-white/70 dark:bg-slate-950/40 rounded-xl space-y-1.5 border border-slate-200/50 dark:border-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white font-extrabold text-[10px]">1</span>
                          <h5 className="font-bold text-slate-800 dark:text-white">Tool Select Karein</h5>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Niche <strong>"ALL GENERATION TOOLS"</strong> section me se jis tarah ki report likhni h, us par click karein.
                        </p>
                      </div>

                      <div className="p-3 bg-white/70 dark:bg-slate-950/40 rounded-xl space-y-1.5 border border-slate-200/50 dark:border-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white font-extrabold text-[10px]">2</span>
                          <h5 className="font-bold text-slate-800 dark:text-white">Hindi/Mix Likhein</h5>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Apni normal aam bolchal ki bhasha me input likhein (Jaise: <em>"sir gate par ramesh check-in kiya"</em>)
                        </p>
                      </div>

                      <div className="p-3 bg-white/70 dark:bg-slate-950/40 rounded-xl space-y-1.5 border border-slate-200/50 dark:border-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white font-extrabold text-[10px]">3</span>
                          <h5 className="font-bold text-slate-800 dark:text-white">Copy ya WhatsApp</h5>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          <strong>"Convert"</strong> button dabakar pristine English log banayein, copy karein ya sidhe <strong>WhatsApp buttons</strong> se forward karein!
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[8px] font-extrabold text-blue-500 font-mono tracking-widest block uppercase">⚡ 1-Click Interactive Practice</span>
                        <p className="text-slate-700 dark:text-slate-350 font-bold text-[11px] mt-0.5">
                          Hinglish se English convert karna seekhein. Click karke check karein!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem("translator_format_type", "security");
                          setCurrentView("aiwriter");
                          alert("AI English Converter khul gaya hai! Chaliye apne simple shabdo me type karke trial kijiye!");
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-650 hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase shadow-md transition"
                      >
                        Try Demo Now! 🚀
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Personal usage metrics summary cards removed as requested */}

              {/* Daily Credit limits monitoring bar */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${darkMode ? "bg-[#111d38]/50 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="space-y-0.5">
                  <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-400 dark:text-slate-500 font-mono">My Daily Conversions Limit</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">UNLIMITED</span>
                    <span className="text-xs text-slate-400">generations left today (Gifted Mode Active)</span>
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

              {/* ACTIVE DUTY EMERGENCY & VIGILANCE TOOLKIT */}
              <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4 shadow-sm`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-850 dark:text-slate-100 uppercase tracking-tight">
                      Active Duty Security Toolkit (सुरक्षा & गश्त टूलकिट)
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Duty par alert rehne ke liye digital instruments (whistle, emergency siren aur night patrol alarm)!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  
                  {/* SOUND PANEL */}
                  <div className={`p-4 rounded-xl border flex flex-col justify-between ${darkMode ? "bg-slate-950/45 border-slate-900" : "bg-slate-50 border-slate-150"}`}>
                    <div>
                      <span className="text-[8px] font-extrabold uppercase font-mono tracking-widest text-[#2563eb] dark:text-[#60a5fa] block mb-1">
                        🔊 Sound Alarm Board (सायरन & सीटी)
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Apne browser se instant high-pitch whistle ya siren alert sound play karein!
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button
                        type="button"
                        onClick={playRefWhistle}
                        className="py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] sm:text-xs font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer uppercase"
                      >
                        <span>🔊 Blow Whistle</span>
                      </button>
                      <button
                        type="button"
                        onClick={playSirensSound}
                        className="py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] sm:text-xs font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer uppercase"
                      >
                        <span>🚨 Plays Siren</span>
                      </button>
                    </div>
                  </div>

                  {/* PATROL Countdown PANEL */}
                  <div className={`p-4 rounded-xl border flex flex-col justify-between ${darkMode ? "bg-slate-950/45 border-slate-900" : "bg-slate-50 border-slate-150"} ${patrolActive ? "ring-2 ring-blue-500/50" : ""}`}>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-extrabold uppercase font-mono tracking-widest text-emerald-600 dark:text-emerald-400 block">
                          ⏱️ Patrol Sleep-Check Alarm (ड्यूटी अलर्ट अलार्म)
                        </span>
                        {patrolActive && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Is alarm timer ko set karne se night duty par need nahi aayegi, timer finish hone par big alarm baje-ga.
                      </p>
                    </div>

                    <div className="mt-3 space-y-3">
                      {/* Timer Face */}
                      <div className="flex items-center justify-between bg-white dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-200/50 dark:border-slate-850">
                        <span className="text-xs font-extrabold text-slate-500 font-mono">COUNTDOWN</span>
                        <span className="text-lg font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                          {Math.floor(patrolTimeLeft / 60).toString().padStart(2, "0")} : {(patrolTimeLeft % 60).toString().padStart(2, "0")}
                        </span>
                      </div>

                      {/* Preset selector buttons */}
                      <div className="flex gap-1 overflow-x-auto pb-1">
                        {[1, 5, 15, 30, 45, 60].map((m) => (
                          <button
                            key={m}
                            disabled={patrolActive}
                            onClick={() => {
                              setPatrolPreset(m);
                              setPatrolTimeLeft(m * 60);
                            }}
                            className={`px-2 py-1 text-[9px] font-extrabold rounded-md transition border ${
                              patrolPreset === m 
                                ? "bg-blue-600 text-white border-blue-600" 
                                : "bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            {m}M
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPatrolActive(!patrolActive)}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all duration-150 ${
                            patrolActive 
                              ? "bg-amber-600 hover:bg-amber-700 text-white" 
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {patrolActive ? "⏸️ Pause Alarm" : "▶️ Start Awake Alarm"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPatrolActive(false);
                            setPatrolTimeLeft(patrolPreset * 60);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-250 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-extrabold uppercase transition"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                  </div>

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
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">AI Professional English Converter</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">Convert casual text to pro English (Ready for WhatsApp)</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-400 shrink-0" />
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
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">AI Casual English Converter</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">Convert complex text to casual friendly English messages</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-400 shrink-0" />
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
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">Late Reporting</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">Professional delay messages & official delay apologies</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-400 shrink-0" />
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
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">Visitor Log</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">Standardized guest entries & vehicle log templates</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-400 shrink-0" />
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
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">Shift Handover</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">Detailed duty transitions & equipment checklist handover</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-400 shrink-0" />
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
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">Attendance Report</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">Generate daily attendance slips & shift timings report</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-400 shrink-0" />
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
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">Incident Report</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">Secure security incident logs & action taken reports</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-400 shrink-0" />
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
                        <h5 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">Leave Application</h5>
                        <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">Formal leave request letters & sick leave drafts</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-400 shrink-0" />
                  </div>

                </div>
              </div>
              
              {/* INTERACTIVE DAILY PHRASES CHEAT-SHEET */}
              <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📖</span>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-850 dark:text-slate-100 uppercase tracking-tight">
                        Daily Quick English Phrases (रोज काम आने वाली अंग्रेजी बातें)
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        In ready-made sentences ko direct copy karke WhatsApp report me send kar sakte hain!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPhrases(!showPhrases)}
                    className="text-[10px] uppercase font-extrabold px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 rounded-lg text-slate-650 dark:text-slate-350 transition"
                  >
                    {showPhrases ? "Hide / छुपाएं" : "Show / दिखाएं"}
                  </button>
                </div>

                {showPhrases && (
                  <div className="space-y-3 pt-3 border-t border-slate-150 dark:border-slate-800/60 max-h-[400px] overflow-y-auto pr-1">
                    {[
                      {
                        cat: "🔄 Shift Handover",
                        hi: "गश्त पूरी हुई, सब ठीक पाया गया।",
                        en: "Patrol has been completed, and everything was found to be in order."
                      },
                      {
                        cat: "🚪 Gate Status",
                        hi: "सभी मुख्य गेट लॉक और पूरी तरह सुरक्षित हैं।",
                        en: "All main gates have been securely locked and verified."
                      },
                      {
                        cat: "👤 Visitor Entry",
                        hi: "विजिटर को बिना आईडी कार्ड के अंदर जाने की अनुमति नहीं है।",
                        en: "Visitors are strictly not permitted to enter the premises without a valid ID card."
                      },
                      {
                        cat: "🚗 Parking Alert",
                        hi: "अनधिकृत गाड़ी को नो-पार्किंग क्षेत्र से हटा दिया गया है।",
                        en: "The unauthorized vehicle has been cleared from the no-parking zone."
                      },
                      {
                        cat: "📅 Duty Report",
                        hi: "अगली शिफ्ट के गार्ड आ गए हैं, चार्ज सफलतापूर्वक दे दिया है।",
                        en: "The next shift guard has arrived, and duty charge has been successfully handed over."
                      },
                      {
                        cat: "🔥 Fire/Safety",
                        hi: "फायर सिलेंडर के प्रेशर चेक कर लिए गए हैं, सब वर्किंग हैं।",
                        en: "All fire extinguishers have been inspected, and the pressure levels are in the safe range."
                      },
                      {
                        cat: "⚠️ Incident Alert",
                        hi: "सर, गेट नंबर 2 के पास पानी का पाइप लीक हो रहा है, प्लंबर को बोल दिया है।",
                        en: "Sir, a water pipe leak has been reported near Gate No. 2. A plumber has been notified to resolve it."
                      }
                    ].map((item, idx) => {
                      const isCopied = copiedIndex === idx;
                      return (
                        <div 
                          key={idx}
                          className={`p-3 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                            darkMode ? "bg-slate-950/45 border-slate-900 hover:border-slate-800" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                              {item.cat}
                            </span>
                            <p className="text-[10px] text-slate-400 font-medium">🇮🇳 {item.hi}</p>
                            <p className="text-[11px] font-mono text-slate-800 dark:text-emerald-400 font-semibold italic">🇬🇧 "{item.en}"</p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(item.en);
                              setCopiedIndex(idx);
                              setTimeout(() => setCopiedIndex(null), 2000);
                            }}
                            className={`px-3 py-1.5 text-[9px] font-extrabold uppercase rounded-lg transition shrink-0 ${
                              isCopied 
                                ? "bg-emerald-600 text-white" 
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {isCopied ? "✓ Copied!" : "📋 Copy"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
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

          {/* 7. Super-secure Admin Dashboard Portal is rendered standalone separately */}

        </div>
      </main>
    </div>
  );
}
