/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, GeneratedReport } from "../types";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Settings2, 
  Search, 
  Lock, 
  Unlock, 
  Trash2, 
  Cpu, 
  Coins, 
  Database,
  ArrowRightLeft,
  CircleAlert,
  Save,
  Activity,
  Heart
} from "lucide-react";
import { ref, onValue, set, remove, get } from "firebase/database";
import { rtdb } from "../firebase";

interface AdminDashboardViewProps {
  darkMode: boolean;
}

export default function AdminDashboardView({ darkMode }: AdminDashboardViewProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Search terms
  const [userSearch, setUserSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Social handles and System Announcement State
  const [instagramId, setInstagramId] = useState("_noirvex1");
  const [telegramGroupLink, setTelegramGroupLink] = useState("https://t.me/+fPPluun0pE9lZjY1");
  const [announcement, setAnnouncement] = useState("");
  const [freeDailyLimit, setFreeDailyLimit] = useState(5);
  const [premiumDailyLimit, setPremiumDailyLimit] = useState(100);

  // Server stats state
  const [serverStats, setServerStats] = useState({
    totalRequests: 0,
    totalTokens: 0,
    estimatedCost: 0,
    currentModel: "openai/gpt-oss-20b:free",
    hasOpenRouterKey: false,
  });

  // Admin Model overrides
  const [customModel, setCustomModel] = useState("openai/gpt-oss-20b:free");
  const [tabIndex, setTabIndex] = useState<"control" | "deploy" | "stats">("control");

  // Retrieve users, reports, and system settings from RTDB
  useEffect(() => {
    const usersRef = ref(rtdb, "users");
    const reportsRef = ref(rtdb, "reports");
    const settingsRef = ref(rtdb, "system/settings");

    const unsubUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(Object.values(data));
      } else {
        setUsers([]);
      }
    });

    const unsubReports = onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allReports: GeneratedReport[] = [];
        Object.keys(data).forEach((uid) => {
          Object.keys(data[uid]).forEach((repId) => {
            allReports.push({ id: repId, uid: uid, userId: uid, ...data[uid][repId] });
          });
        });
        setReports(allReports.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setReports([]);
      }
      setLoading(false);
    });

    const unsubSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.instagramId !== undefined) setInstagramId(data.instagramId);
        if (data.telegramGroupLink !== undefined) setTelegramGroupLink(data.telegramGroupLink);
        if (data.announcement !== undefined) setAnnouncement(data.announcement);
        if (data.modelId !== undefined) setCustomModel(data.modelId);
        if (data.freeDailyLimit !== undefined) setFreeDailyLimit(Number(data.freeDailyLimit));
        if (data.premiumDailyLimit !== undefined) setPremiumDailyLimit(Number(data.premiumDailyLimit));
      }
    });

    fetchStats();

    return () => {
      unsubUsers();
      unsubReports();
      unsubSettings();
    };
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setServerStats({
        totalRequests: data.totalRequests,
        totalTokens: data.totalTokens,
        estimatedCost: data.estimatedCost,
        currentModel: data.currentModel,
        hasOpenRouterKey: data.hasOpenRouterKey,
      });
    } catch (err) {
      console.error("Failed to load server stats", err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // 1. Save settings persistently to Firebase RTDB for user app view
      await set(ref(rtdb, "system/settings"), {
        modelId: customModel,
        instagramId,
        telegramGroupLink,
        announcement,
        freeDailyLimit: Number(freeDailyLimit),
        premiumDailyLimit: Number(premiumDailyLimit),
        updatedAt: Date.now()
      });

      // 2. Sync to Express Node server in parallel
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: customModel,
          instagramId,
          telegramGroupLink,
          announcement,
          freeDailyLimit: Number(freeDailyLimit),
          premiumDailyLimit: Number(premiumDailyLimit)
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Success! System configuration, model parameters, free/premium credits & developer updates saved globally!");
        fetchStats();
      }
    } catch (e) {
      console.error(e);
      alert("Error saving settings.");
    }
  };

  // Block/Unblock user
  const handleToggleBlock = async (uid: string, currentBlocked: boolean) => {
    try {
      await set(ref(rtdb, `users/${uid}/blocked`), !currentBlocked);
    } catch (err) {
      console.error(err);
      alert("Failed updating user block attribute.");
    }
  };

  // Toggle user premium plan directly
  const handleTogglePremium = async (uid: string, currentPlan: string) => {
    try {
      const nextPlan = currentPlan === "premium" ? "free" : "premium";
      await set(ref(rtdb, `users/${uid}/plan`), nextPlan);
    } catch (err) {
      console.error(err);
      alert("Failed updating user plan attribute.");
    }
  };

  // Delete User
  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("Are you sure you want to delete this user permanently?")) return;
    try {
      await remove(ref(rtdb, `users/${uid}`));
      await remove(ref(rtdb, `reports/${uid}`));
    } catch (err) {
      console.error(err);
    }
  };

  // Delete single report logs
  const handleDeleteReport = async (uid: string, reportId: string) => {
    if (!window.confirm("Are you sure you want to purge this report?")) return;
    try {
      await remove(ref(rtdb, `reports/${uid}/${reportId}`));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter((u) => 
    u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.designation?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredReports = reports.filter((r) => 
    r.title?.toLowerCase().includes(reportSearch.toLowerCase()) ||
    r.originalInput?.toLowerCase().includes(reportSearch.toLowerCase()) ||
    r.formattedOutput?.toLowerCase().includes(reportSearch.toLowerCase())
  );

  // Statistics summaries
  const totalUsersCount = users.length;
  const reportsCount = reports.length;
  const convCount = reports.filter(r => r.type === "conv").length;
  const attendanceCount = reports.filter(r => r.type === "attendance").length;
  const incidentCount = reports.filter(r => r.type === "incident").length;
  const visitorCount = reports.filter(r => r.type === "visitor").length;
  const handoverCount = reports.filter(r => r.type === "handover").length;

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="border-b pb-4 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono uppercase">System Administration Panel</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dynamically configure OpenRouter endpoints, select active LLMs, sync support channels, and oversee guard log registries.
          </p>
        </div>

        {/* View mode buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg self-start shrink-0 border border-slate-200 dark:border-slate-800">
          <button 
            type="button"
            onClick={() => setTabIndex("control")}
            className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded transition ${tabIndex === "control" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            Terminal Dashboard
          </button>
          <button 
            type="button"
            onClick={() => setTabIndex("deploy")}
            className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded transition ${tabIndex === "deploy" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            Deployment Guide
          </button>
        </div>
      </div>

      {tabIndex === "deploy" ? (
        /* Deployment documentation section */
        <div className={`p-6 border rounded-xl shadow-sm space-y-4 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
          <div className="border-b pb-2 dark:border-slate-800">
            <h3 className="font-bold text-base text-blue-500 flex items-center gap-2 font-mono">
              <Database className="w-5 h-5 text-blue-500" /> CLI Deploy Blueprint / deployment guid
            </h3>
            <p className="text-xs text-slate-400">Learn how to compile and spin up this elite full-stack app into server cloud hosting environments.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Step 1 */}
            <div className={`p-4 rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"} space-y-2`}>
              <h5 className="font-bold uppercase tracking-wider text-[11px] text-blue-400">1. Local Setup & Variables</h5>
              <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-relaxed">
                Configure your environment variables file <span className="text-slate-300">.env</span> with your actual secret API keys:
              </p>
              <pre className="p-2 text-[10px] bg-slate-900/50 text-emerald-400 rounded-md overflow-x-auto select-all">
{`# Platform secret credentials:
GEMINI_API_KEY=AIzaSyD...

# Optional OpenRouter proxy:
OPENROUTER_API_KEY=sk-or-v1...`}
              </pre>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"} space-y-2`}>
              <h5 className="font-bold uppercase tracking-wider text-[11px] text-blue-400">2. Production Build Sequence</h5>
              <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-relaxed">
                Compile both the React client assets & bundle the modern Express server using the unified production build script:
              </p>
              <pre className="p-2 text-[11px] bg-slate-900/50 text-emerald-400 rounded-md overflow-x-auto select-all">
{`npm run build
# Outputs index.html, assets list to /dist
# Compiles server.ts to dist/server.cjs`}
              </pre>
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"} space-y-2`}>
              <h5 className="font-bold uppercase tracking-wider text-[11px] text-blue-400">3. Google Cloud Run Deployment</h5>
              <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-relaxed">
                Deploy containerized onto Google Cloud Run. Run via CLI or connect your Git repo for automatic triggers:
              </p>
              <pre className="p-2 text-[11px] bg-slate-900/50 text-emerald-300 rounded-md overflow-x-auto select-all">
{`# Register service & deploy container
gcloud run deploy guard-english-ai \\
  --source . \\
  --port 3000 \\
  --env-vars-file .env`}
              </pre>
            </div>

            {/* Step 4 */}
            <div className={`p-4 rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"} space-y-2`}>
              <h5 className="font-bold uppercase tracking-wider text-[11px] text-blue-400">4. Run Standalone Server</h5>
              <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-relaxed">
                To launch the application locally in full production mode, run the unified start command:
              </p>
              <pre className="p-2 text-[11px] bg-slate-900/50 text-emerald-300 rounded-md overflow-x-auto select-all">
{`npm run start
# Runs default production file dist/server.cjs`}
              </pre>
            </div>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs leading-relaxed text-blue-400">
            <strong>Protip for Developers:</strong> All static content is served directly from the compiled <code className="bg-slate-950 px-1 py-0.5 rounded text-[10px]">dist/</code> directory. Dynamic queries get processed beautifully inside our Express routes on port 3000.
          </div>
        </div>
      ) : (
        <>
          {/* Grid Stats Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric Card */}
            <div className={`p-4 rounded-xl border shadow-sm ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide">Total Registers</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{totalUsersCount}</span>
              <div className="text-[10px] text-slate-400 mt-1">Guards registered in database</div>
            </div>

            {/* Metric Card */}
            <div className={`p-4 rounded-xl border shadow-sm ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide">Reports Logged</span>
                <FileText className="w-4 h-4 text-teal-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{reportsCount}</span>
              <div className="text-[10px] text-slate-400 mt-1">Total documents stored</div>
            </div>

            {/* Metric Card */}
            <div className={`p-4 rounded-xl border shadow-sm ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide">API Translations</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{serverStats.totalRequests}</span>
              <div className="text-[10px] text-slate-400 mt-1">Total translations made</div>
            </div>

            {/* Metric Card */}
            <div className={`p-4 rounded-xl border shadow-sm ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide">Model cost (est.)</span>
                <Coins className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">${serverStats.estimatedCost}</span>
              <div className="text-[10px] text-slate-400 mt-1">At standard token conversion rates</div>
            </div>
          </div>

          {/* Report Distribution breakdown charts indicator list */}
          <div className={`p-5 border rounded-xl shadow-sm ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block font-mono">Document Categories Distribution Breakdown</h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
              {[
                { label: "AI Translation Logs", count: convCount, color: "bg-blue-500" },
                { label: "Attendance Entries", count: attendanceCount, color: "bg-teal-500" },
                { label: "Incident Briefings", count: incidentCount, color: "bg-rose-500" },
                { label: "Visitor Registries", count: visitorCount, color: "bg-amber-500" },
                { label: "Shift Handovers", count: handoverCount, color: "bg-indigo-500" }
              ].map((c) => {
                const percentage = reportsCount > 0 ? Math.round((c.count / reportsCount) * 100) : 0;
                return (
                  <div key={c.label} className="p-3 border rounded-lg bg-slate-950/20 dark:border-slate-800/80">
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                      <span>{c.label}</span>
                      <span className="font-mono text-blue-400">{c.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
                      <div className={`h-full ${c.color}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Configuration Controls section */}
          <section className={`p-5 border rounded-xl shadow-sm ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"} space-y-4`}>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b dark:border-slate-800 pb-2">
              <Settings2 className="text-blue-500 w-4 h-4" /> Endpoint Override Parameters & Social Integrations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Default Model Endpoint</label>
                <select
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                >
                  <option value="openai/gpt-oss-20b:free">openai/gpt-oss-20b:free (Active Model Choice)</option>
                  <option value="google/gemini-2.5-flash">google/gemini-2.5-flash (Fast & Premium)</option>
                  <option value="google/gemini-2.5-pro">google/gemini-2.5-pro (Elite Intelligence)</option>
                  <option value="deepseek/deepseek-chat">deepseek/deepseek-chat (Economic Coder)</option>
                  <option value="meta-llama/llama-3.3-70b-instruct">meta-llama/llama-3.3-70b-instruct (Llama 3)</option>
                </select>
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="Or enter custom model tag..."
                  className={`w-full mt-2 px-3 py-1 text-xs rounded-lg border font-mono ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Server Setup Mode</label>
                <div className={`p-2.5 rounded-lg border flex flex-col text-xs justify-center ${darkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-705"}`}>
                  <span className="font-semibold text-slate-405 dark:text-slate-450">API Key Source:</span>
                  <span className="font-mono text-emerald-500 font-bold text-[11px] truncate flex items-center gap-1">
                    🟢 AI Studio Environment Secret
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Current Active Model Status</label>
                <div className={`p-2.5 rounded-lg border flex flex-col text-xs justify-center ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <span className="font-semibold text-slate-405 dark:text-slate-450">Active running model ID:</span>
                  <span className="font-mono text-blue-500 font-bold text-[11px] truncate">{serverStats.currentModel}</span>
                </div>
              </div>
            </div>

            <div className="border-t dark:border-slate-800 my-4"></div>

            {/* Social Links & Announcement Banner Updates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Developer Instagram Handle</label>
                <input 
                  type="text"
                  value={instagramId}
                  onChange={(e) => setInstagramId(e.target.value)}
                  placeholder="e.g. _noirvex1"
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Telegram Update Group Link</label>
                <input 
                  type="text"
                  value={telegramGroupLink}
                  onChange={(e) => setTelegramGroupLink(e.target.value)}
                  placeholder="Telegram invite URL..."
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Broadcast Notification Banner Text</label>
                <input 
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="Display informational updates to all users..."
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
              </div>
            </div>

            <div className="border-t dark:border-slate-800 my-4"></div>

            {/* Dynamic Credits Limits Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">🛡️ Daily Free Account Credit Limit (Generations)</label>
                <input 
                  type="number"
                  value={freeDailyLimit}
                  onChange={(e) => setFreeDailyLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  placeholder="e.g. 5"
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
                <span className="text-[9px] text-slate-400 block mt-1">Default allowance given daily to standard free security accounts.</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">💎 Daily Premium Account Credit Limit (Generations)</label>
                <input 
                  type="number"
                  value={premiumDailyLimit}
                  onChange={(e) => setPremiumDailyLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  placeholder="e.g. 100"
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
                <span className="text-[9px] text-slate-400 block mt-1">Default allowance given daily to upgraded/Premium officers.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
              >
                <Save className="w-3.5 h-3.5" /> Save Configuration Settings
              </button>
            </div>

            <div className="mt-2 p-3 rounded-lg border bg-blue-500/5 dark:border-slate-800 border-blue-500/10 text-xs text-blue-500 flex items-start gap-2 leading-relaxed">
              <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Saving overrides changes the database settings in real-time. Registered users' dashboards will render handles dynamically!</span>
            </div>
          </section>
        </>
      )}

      {/* Two Column Layout: Users vs Reports Purge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* User Management Section */}
        <section className={`p-5 border rounded-xl shadow-sm ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3 mb-4 gap-4 col-span-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 font-mono">
              <Users className="text-teal-500 w-4 h-4" /> Profile Directory ({filteredUsers.length})
            </h3>

            <div className="relative max-w-xs flex-1">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="Search guards..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className={`block w-full pl-8 pr-2 py-1.5 text-[11px] border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
              />
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No users found on platform</p>
            ) : (
              filteredUsers.map((u) => (
                <div 
                  key={u.uid}
                  className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${darkMode ? "bg-slate-950/40 border-slate-900" : "bg-slate-50 border-slate-200"}`}
                >
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{u.displayName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                    <div className="flex flex-wrap gap-1.5 items-center mt-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-400">{u.designation || "Officer"}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${u.plan === "premium" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-slate-600/10 text-slate-400"}`}>{u.plan || "free"}</span>
                    </div>

                    {/* Per-user custom daily credit limit override input */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[9px] text-slate-400 font-mono">Custom Daily Limit:</span>
                      <input 
                        type="number"
                        value={u.chatLimit !== undefined && u.chatLimit !== null ? u.chatLimit : ""}
                        onChange={async (e) => {
                          const val = e.target.value === "" ? null : Math.max(1, parseInt(e.target.value, 10));
                          await set(ref(rtdb, `users/${u.uid}/chatLimit`), val);
                        }}
                        placeholder="Default"
                        className={`w-16 px-1.5 py-0.5 rounded text-[10px] text-center border focus:outline-none font-mono ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}
                      />
                      <span className="text-[9px] text-slate-500">(Overrides default)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Grant / Revoke Premium Toggle */}
                    <button
                      type="button"
                      onClick={() => handleTogglePremium(u.uid, u.plan || "free")}
                      className={`p-2 rounded-lg transition ${u.plan === "premium" ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20" : "text-slate-400 hover:text-rose-500"}`}
                      title={u.plan === "premium" ? "Downgrade to Free Tier" : "Upgrade to Premium Tier"}
                    >
                      <Heart className={`w-4 h-4 ${u.plan === "premium" ? "fill-current" : ""}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleBlock(u.uid, !!u.blocked)}
                      className={`p-2 rounded-lg transition ${u.blocked ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20" : "text-slate-400 hover:text-blue-500"}`}
                      title={u.blocked ? "Unblock user log access" : "Block user from logging in"}
                    >
                      {u.blocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.uid)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                      title="Purge user forever"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Global Reports PURGE section */}
        <section className={`p-5 border rounded-xl shadow-sm ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3 mb-4 gap-4 col-span-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 font-mono">
              <FileText className="text-blue-500 w-4 h-4" /> Complete Logs Ledger ({filteredReports.length})
            </h3>

            <div className="relative max-w-xs flex-1">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="Search across text..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className={`block w-full pl-8 pr-2 py-1.5 text-[11px] border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredReports.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No report logs exist</p>
            ) : (
              filteredReports.map((r) => {
                const creator = users.find((u) => u.uid === r.uid || u.uid === r.userId);
                const isExpanded = expandedReportId === r.id;

                return (
                  <div 
                    key={r.id}
                    className={`p-3 rounded-lg border flex flex-col gap-2 text-xs transition-all ${
                      darkMode ? "bg-slate-950/40 border-slate-900 hover:border-slate-800" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div 
                        className="space-y-1 min-w-0 flex-1 cursor-pointer"
                        onClick={() => setExpandedReportId(isExpanded ? null : r.id)}
                      >
                        <p className="font-bold flex flex-wrap items-center gap-1.5 text-[11px] text-slate-900 dark:text-slate-100">
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold">
                            {r.type?.toUpperCase() || "LOG"}
                          </span>
                          {r.title || "Untitled Translation"}
                        </p>
                        
                        {/* Guard who requested translation */}
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          👤 Guard: {creator ? `${creator.displayName} (${creator.designation || "Officer"})` : "Unknown Guard"}
                        </p>

                        {!isExpanded && (
                          <p className="text-[10px] text-slate-400 truncate max-w-md">
                            {r.formattedOutput || r.originalInput}
                          </p>
                        )}
                        <p className="text-[9px] text-slate-500 font-mono">
                          Date: {r.createdAt ? new Date(r.createdAt).toLocaleString() : "N/A"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedReportId(isExpanded ? null : r.id)}
                          className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition ${
                            isExpanded 
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-705 dark:text-slate-200" 
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {isExpanded ? "Hide" : "Review"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(r.uid || r.userId, r.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                          title="Purge record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={`mt-2 p-3 rounded-lg space-y-3 border text-xs leading-relaxed ${
                        darkMode ? "bg-slate-950/80 border-slate-900" : "bg-white border-slate-150"
                      }`}>
                        {/* Original Text */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            Original Dialect / Casual Input Text
                          </span>
                          <div className="font-sans whitespace-pre-wrap text-slate-650 dark:text-slate-300 select-all bg-slate-100/40 dark:bg-slate-900/40 p-2 rounded border border-slate-200 dark:border-slate-800">
                            {r.originalInput || "No input text record"}
                          </div>
                        </div>

                        {/* Translated Text */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest block">
                            Translated Perfect English Output
                          </span>
                          <div className="font-mono whitespace-pre-wrap text-slate-800 dark:text-emerald-400 bg-emerald-500/5 p-2 rounded border border-emerald-505/10 dark:border-emerald-500/10 select-all">
                            {r.formattedOutput || "No output text record"}
                          </div>
                        </div>

                        {/* Guard Profile Context */}
                        {creator && (
                          <div className="pt-2 border-t border-slate-150 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] text-slate-450">
                            <div>
                              <strong className="text-slate-500 dark:text-slate-400 font-mono">Email:</strong> {creator.email || "N/A"}
                            </div>
                            <div>
                              <strong className="text-slate-500 dark:text-slate-400 font-mono">Role/Designation:</strong> {creator.designation || "Guard"}
                            </div>
                            <div>
                              <strong className="text-slate-500 dark:text-slate-400 font-mono">Plan status:</strong> {creator.plan || "free"}
                            </div>
                            <div>
                              <strong className="text-slate-500 dark:text-slate-400 font-mono">UID:</strong> {creator.uid}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
