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
  VolumeX,
  Search,
  Lightbulb,
  Wifi
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
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showPhrases, setShowPhrases] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

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
        <div className={`p-4 sm:p-6 lg:p-8 flex-1 ${currentView === "dashboard" ? "max-w-5xl" : "max-w-2xl"} w-full mx-auto space-y-6`}>
          
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
              
              {/* Clean Minimal Header: Displays Designation / Active compliance beautifully without cluttering */}
              <div className={`p-4 rounded-2xl border ${
                darkMode ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200/80 shadow-xs"
              } flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all duration-300`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Officer:</span>
                      <span className="text-blue-600 dark:text-blue-300 font-semibold">{userProfile?.displayName || "Officer"}</span>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">{userProfile?.designation || "Security Officer"}</span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-extrabold text-emerald-800 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full select-none uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    ACTIVE PORTAL
                  </span>
                  {userProfile?.plan === "premium" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[8px] font-extrabold text-blue-800 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full uppercase tracking-wider font-mono">
                      💎 PREMIUM
                    </span>
                  )}
                </div>
              </div>

               {/* CORE OPERATIONAL & ENGLISH TOOLS GRID - PLACED PROMINENTLY AT THE VERY TOP */}
               {(() => {
                const allToolsList = [
                  {
                    id: "pro-eng",
                    title: "AI PRO ENGLISH CONVERTER",
                    description: "Hinglish/Regional casual text ko formal English me badlein",
                    hiDesc: "(हिंग्लिश से ऑफिसियल इंग्लिश अनुवाद)",
                    icon: <Sparkles className="w-5 h-5 animate-pulse" />,
                    action: () => {
                      localStorage.setItem("translator_format_type", "corporate");
                      setCurrentView("aiwriter");
                    },
                    bgColor: "bg-violet-100 dark:bg-[#111827] text-violet-600 dark:text-violet-400 border border-violet-500/10",
                    borderColor: "hover:border-violet-500/40 dark:hover:border-violet-500/40"
                  },
                  {
                    id: "casual-chat",
                    title: "AI CASUAL CHAT UPGRADER",
                    description: "Slightly friendly WhatsApp updates supervisors love",
                    hiDesc: "(सुपरवाइज़र व्हाट्सएप चैटिंग अपग्रेड)",
                    icon: <MessageSquareCode className="w-5 h-5" />,
                    action: () => {
                      localStorage.setItem("translator_format_type", "brief");
                      setCurrentView("aiwriter");
                    },
                    bgColor: "bg-indigo-50 dark:bg-[#111827] text-indigo-600 dark:text-indigo-400 border border-indigo-500/10",
                    borderColor: "hover:border-indigo-500/40 dark:hover:border-indigo-500/40"
                  },
                  {
                    id: "late-arrival",
                    title: "LATE ARRIVAL SLIPS",
                    description: "Professional delay apologies and late entry reasons",
                    hiDesc: "(देरी से आगमन स्पष्टीकरण पत्र)",
                    icon: <Clock className="w-5 h-5" />,
                    action: () => {
                      setCurrentView("forms");
                      setFormSubTab("late");
                    },
                    bgColor: "bg-amber-50 dark:bg-[#111827] text-amber-600 dark:text-amber-400 border border-amber-500/10",
                    borderColor: "hover:border-amber-500/40 dark:hover:border-amber-500/40"
                  },
                  {
                    id: "visitor-log",
                    title: "VISITOR LOG GUEST FORM",
                    description: "Official gate visitor registry and credentials details",
                    hiDesc: "(आगंतुक रजिस्टर और गेट विवरण फॉर्म)",
                    icon: <UserIcon className="w-5 h-5" />,
                    action: () => {
                      setCurrentView("forms");
                      setFormSubTab("visitor");
                    },
                    bgColor: "bg-sky-50 dark:bg-[#111827] text-sky-600 dark:text-sky-450 border border-sky-500/10",
                    borderColor: "hover:border-sky-500/40 dark:hover:border-sky-500/40"
                  },
                  {
                    id: "handover-slip",
                    title: "SHIFT HANDOVER SLIP",
                    description: "Duty shift handover checklists & supervisor signatures",
                    hiDesc: "(ड्यूटी शिफ्ट हैंडओवर रिपोर्ट)",
                    icon: <RefreshCcw className="w-4 h-4" />,
                    action: () => {
                      setCurrentView("forms");
                      setFormSubTab("handover");
                    },
                    bgColor: "bg-purple-50 dark:bg-[#111827] text-purple-600 dark:text-purple-400 border border-purple-500/10",
                    borderColor: "hover:border-purple-500/40 dark:hover:border-purple-500/40"
                  },
                  {
                    id: "attendance-summary",
                    title: "ATTENDANCE SUMMARY",
                    description: "Staff shift attendance registers and timings files",
                    hiDesc: "(कर्मचारी उपस्थिति और ड्यूटी समय दर्ज करें)",
                    icon: <UserCheck className="w-5 h-5" />,
                    action: () => {
                      setCurrentView("forms");
                      setFormSubTab("attendance");
                    },
                    bgColor: "bg-emerald-50 dark:bg-[#111827] text-emerald-600 dark:text-emerald-400 border border-emerald-500/10",
                    borderColor: "hover:border-emerald-500/40 dark:hover:border-emerald-500/40"
                  },
                  {
                    id: "incident-report",
                    title: "INCIDENT & EMERGENCY WRITER",
                    description: "Urgent event breakout records and actions logs",
                    hiDesc: "(गंभीर घटना या आपदा रिपोर्ट बुक)",
                    icon: <BadgeAlert className="w-5 h-5" />,
                    action: () => {
                      setCurrentView("forms");
                      setFormSubTab("incident");
                    },
                    bgColor: "bg-rose-50 dark:bg-[#111827] text-rose-600 dark:text-rose-400 border border-rose-500/10",
                    borderColor: "hover:border-rose-500/40 dark:hover:border-rose-500/40"
                  },
                  {
                    id: "leave-requests",
                    title: "LEAVE REQUESTS SENDER",
                    description: "Formal illness/vacation application documents",
                    hiDesc: "(छुट्टी की अर्ज़ी और ऑफिसियल प्रार्थना पत्र)",
                    icon: <FileText className="w-5 h-5" />,
                    action: () => {
                      setCurrentView("forms");
                      setFormSubTab("leave");
                    },
                    bgColor: "bg-teal-50 dark:bg-[#111827] text-teal-600 dark:text-teal-400 border border-teal-500/10",
                    borderColor: "hover:border-teal-500/40 dark:hover:border-teal-500/40"
                  }
                ];

                const filteredToolsList = allToolsList.filter(t => 
                  t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (t.hiDesc && t.hiDesc.toLowerCase().includes(searchTerm.toLowerCase()))
                );

                return (
                  <div className="space-y-4">
                    {/* Filter & Portal Header Status */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                        <h3 className="font-display font-extrabold text-xs sm:text-sm text-slate-850 dark:text-slate-200 uppercase tracking-widest font-mono">
                          Primary Command Tools (मुख्य रिपोर्टिंग बोर्ड)
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-teal-600 dark:text-teal-400 font-mono tracking-wider bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-xl uppercase">
                          <Wifi className="w-3 h-3 text-teal-500" /> Offline Sync
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-extrabold">
                          {filteredToolsList.length} / 8 Tools Active
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Search & Design Accent */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                      <div className="relative md:col-span-7">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        </span>
                        <input
                          type="text"
                          placeholder="Type to filter tools / रिपोर्ट खोजना शुरू करें (e.g. late slip, visitor, leave)..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl border placeholder-slate-400 transition-all duration-200 ${
                            darkMode 
                              ? "bg-[#111827]/75 border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-white" 
                              : "bg-white border-slate-250 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-slate-800"
                          }`}
                        />
                        {searchTerm && (
                          <button 
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-extrabold uppercase text-slate-400 hover:text-blue-500 transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 md:col-span-5 ${
                        darkMode ? "bg-slate-900/40 border-slate-800/80" : "bg-blue-50/45 border-blue-100"
                      }`}>
                        <Lightbulb className="w-4 h-4 text-blue-500 shrink-0" />
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                          <strong>Vigilance Tip:</strong> Check vehicles thoroughly and write down timings. Convert Hinglish to formal English below!
                        </p>
                      </div>
                    </div>

                    {/* Hinglish Predefined Duty Custom Situation Helper Clips */}
                    <div className={`p-3 rounded-2xl border ${
                      darkMode ? "bg-slate-900/35 border-slate-800/80" : "bg-slate-50 border-slate-200"
                    } space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-extrabold uppercase font-mono tracking-widest text-[#2563eb] dark:text-[#60a5fa]">
                          ⚡ Hinglish Duty Predefined Situations (कॉपी-पेस्ट और तुरंत उपयोग करें)
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {[
                          {
                            title: "🚚 Heavy Vehicle Entry",
                            hin: "Gate number 1 pe truck enter huwa, full details and driving license check kar liya hai.",
                            target: "corporate"
                          },
                          {
                            title: "🔑 Shift Handover Completed",
                            hin: "Agle duty card guard ko safalta-purvak shift charge aur saari keys handover kar dya hai.",
                            target: "corporate"
                          },
                          {
                            title: "🌧️ Rainy & Light Patrol",
                            hin: "Bahar tej baarish ho rahi hai, perimeter checking safe hai aur emergency light check kar li hai.",
                            target: "brief"
                          },
                          {
                            title: "👥 Visitor Approval Registry",
                            hin: "Guest gate par kade thhe, resident manager se call par approval lekar details update kar li hai.",
                            target: "corporate"
                          },
                          {
                            title: "💡 Power Cut Generator",
                            hin: "Camp me electricity shut down hua hai, generators successfully turned-on aur area normal hai.",
                            target: "brief"
                          },
                          {
                            title: "🚨 Parking space warning",
                            hin: "Gate ke samne no-parking me gadi khadi thi, usko call karke warning dekar immediate hata diya gaya.",
                            target: "corporate"
                          }
                        ].map((item, idx) => {
                          const isCopied = copiedIndex === idx + 100;
                          return (
                            <div 
                              key={idx}
                              onClick={() => {
                                navigator.clipboard.writeText(item.hin);
                                setCopiedIndex(idx + 100);
                                setTimeout(() => setCopiedIndex(null), 2000);
                                localStorage.setItem("translator_format_type", item.target);
                                setCurrentView("aiwriter");
                              }}
                              className={`p-2 rounded-xl border text-[11px] cursor-pointer hover:border-blue-500/50 hover:scale-[1.01] transition-all duration-150 relative text-left group ${
                                darkMode ? "bg-slate-950/45 border-slate-900" : "bg-white border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between font-extrabold text-[10px] text-blue-600 dark:text-blue-400 mb-1">
                                <span>{item.title}</span>
                                <span className="text-[8px] bg-blue-500/10 px-1 py-0.2 rounded font-mono uppercase group-hover:text-blue-500">
                                  {isCopied ? "✓ Copied" : "⚡ Copy & Open"}
                                </span>
                              </div>
                              <p className="text-slate-500 dark:text-slate-400 line-clamp-1 italic">"{item.hin}"</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dynamic Responsive Tools Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredToolsList.length > 0 ? (
                        filteredToolsList.map((tool) => (
                          <div 
                            key={tool.id}
                            onClick={tool.action}
                            className={`bg-white dark:bg-[#111827] border border-slate-200/50 dark:border-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-205 cursor-pointer text-left ${tool.borderColor}`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tool.bgColor}`}>
                                {tool.icon}
                              </div>
                              <div>
                                <h5 className="font-extrabold text-xs sm:text-sm text-slate-850 dark:text-slate-100 flex items-center gap-1">
                                  <span>{tool.title}</span>
                                </h5>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{tool.description}</p>
                                <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 italic block mt-0.5">{tool.hiDesc}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-405 dark:text-slate-500 shrink-0" />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-1 sm:col-span-2 text-center py-8 text-xs font-semibold text-slate-400 font-mono">
                          🔍 No tools matching "{searchTerm}". Clear search to find all 8 options!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* GORGEOUS HIGH-FIDELITY FOOTER */}
              <div className="border-t border-slate-150 dark:border-slate-900 pt-5 mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-medium font-mono">
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
                    {systSettings.instagramId && <span className="text-pink-500 font-sans">📸</span>}
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
