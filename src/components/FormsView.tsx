/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  FileText, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  UserPlus, 
  RefreshCcw, 
  Mic, 
  MicOff, 
  Sparkles, 
  Copy, 
  Check, 
  FileDown,
  ChevronRight,
  ClipboardList,
  Flame,
  Frown,
  UserCheck
} from "lucide-react";
import { locales } from "../locale";
import { downloadReportAsPdf } from "../utils";

interface FormsViewProps {
  lang: "en" | "hi" | "or";
  darkMode: boolean;
  onSaveReport: (report: { title: string; type: string; originalInput: string; formattedOutput: string }) => Promise<void>;
  activeTab: string; // "attendance" | "incident" | "leave" | "late" | "visitor" | "handover" | "dailylog"
  setActiveTab: (tab: string) => void;
}

export default function FormsView({ lang, darkMode, onSaveReport, activeTab, setActiveTab }: FormsViewProps) {
  const t = locales[lang];

  // Common Form Loading indicator
  const [loading, setLoading] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // States for all 7 reports
  // 1. Attendance Report
  const [attendance, setAttendance] = useState({
    date: new Date().toISOString().split("T")[0],
    shift: "Morning (08:00 AM - 08:00 PM)",
    projectName: "",
    empName: "",
    empId: "",
    mobile: "",
    remarks: "Present on duty"
  });

  // 2. Incident Report
  const [incident, setIncident] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "",
    location: "",
    details: "",
    actionTaken: ""
  });

  // 3. Leave Generator
  const [leave, setLeave] = useState({
    empName: "",
    empId: "",
    designation: "Security Guard",
    startDate: "",
    endDate: "",
    leaveType: "Sick Leave",
    reason: ""
  });

  // 4. Late Reporting Message
  const [late, setLate] = useState({
    expectedTime: "",
    expectedArrival: "",
    delayReason: "",
    includeApology: "Yes"
  });

  // 5. Visitor Entry Report
  const [visitor, setVisitor] = useState({
    name: "",
    company: "",
    contact: "",
    vehicle: "",
    purpose: "",
    hostInfo: "",
    entryTime: ""
  });

  // 6. Shift Handover
  const [handover, setHandover] = useState({
    outgoingStaff: "",
    incomingStaff: "",
    keysHandedOver: "Yes",
    assetsStatus: "All equipment, walkie-talkies and logbooks checked & handed over.",
    outstandingIssues: "None. All perimeter points clear."
  });

  // 7. Daily Security Log
  const [dailyLog, setDailyLog] = useState({
    date: new Date().toISOString().split("T")[0],
    siteName: "",
    logDetails: "08:00 - Took over shift and patrolled compound\n12:00 - Lunch hour patrol, perimeter doors secured\n16:00 - Registered 4 visitor delivery trucks\n20:00 - Gate locks checked, handover completed."
  });

  // Global voice recognition callback
  const startSpeechRecognitionForField = (fieldName: string, currentVal: any, setValFn: any) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in your browser.");
      return;
    }

    if (listening && activeVoiceField === fieldName) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {
          console.error("Failed to abort speech recognition:", err);
        }
      }
      setListening(false);
      setActiveVoiceField(null);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) {
        console.error("Failed to abort speech recognition:", err);
      }
    }

    const startRecording = () => {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = lang === "hi" ? "hi-IN" : lang === "or" ? "or-IN" : "en-IN";

      rec.onstart = () => {
        setListening(true);
        setActiveVoiceField(fieldName);
      };

      rec.onresult = (evt: any) => {
        const transcript = evt.results[0][0].transcript;
        if (transcript) {
          setValFn((prev: any) => ({
            ...prev,
            [fieldName]: (prev[fieldName] ? prev[fieldName] + " " : "") + transcript
          }));
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setListening(false);
        setActiveVoiceField(null);
      };

      rec.onend = () => {
        setListening(false);
        setActiveVoiceField(null);
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (err: any) {
        console.error("Speech recognition start method failed:", err);
        if (err.name === "InvalidStateError" || (err.message && err.message.includes("already started"))) {
          setListening(true);
          setActiveVoiceField(fieldName);
        } else {
          setListening(false);
          setActiveVoiceField(null);
        }
      }
    };

    if (listening) {
      setTimeout(() => {
        startRecording();
      }, 150);
    } else {
      startRecording();
    }
  };

  const handleGenerateReport = async (type: string, payload: any) => {
    setLoading(true);
    setOutputText("");

    // Package details into a description string
    const inputSummary = Object.entries(payload)
      .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
      .join("\n");

    try {
      const res = await fetch("/api/ai/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Form inputs received:\n${inputSummary}`,
          type: `Official Report Form - ${type.toUpperCase()}`,
          format: "corporate",
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setOutputText(data.result);
        
        // Save to RTDB via callback
        await onSaveReport({
          title: `${type.toUpperCase()} Report`,
          type: activeTab as any,
          originalInput: inputSummary,
          formattedOutput: data.result,
        });
      } else {
        throw new Error(data.error || "Generation error");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to generate report with AI. Please configure OpenRouter or try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = () => {
    if (!outputText) return;
    let label = "Guard English AI - Operational Form Details";
    if (activeTab === "attendance") label = "Duty Attendance Log";
    if (activeTab === "incident") label = "Incident & Event Log";
    if (activeTab === "leave") label = "Formal Leave Application";
    if (activeTab === "visitor") label = "Visitor Entry Register";
    if (activeTab === "handover") label = "Shift Handover Summary";
    if (activeTab === "late") label = "Late Duty Notification";
    if (activeTab === "dailylog") label = "Daily Security Log Reports";

    downloadReportAsPdf(label, "Form Fields Populated Securing Database Record", outputText);
  };

  return (
    <div className="space-y-6">
      {/* Simple Bilingual Helper Guide */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        <h3 className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
          📋 सरकारी एवं कंपनी रिपोर्ट फॉर्म (Select & Fill Form)
        </h3>
        <p className="text-xs text-amber-800 leading-relaxed">
          नीचे दिए गए बटनों में से जो भी रिपोर्ट बनानी है उसे चुनें, खाली जगह भरें और सबसे नीचे <strong>"रिपोर्ट तैयार करें"</strong> दबाएं.
          (Choose any report below, fill fields, and press "Generate Report" at the bottom.)
        </p>
      </div>

      {/* Horizontal Sub Header */}
      <div className="border-b pb-4 dark:border-slate-800">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">✍️ Structured Operations Forms (रिपोर्ट फॉर्म)</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          गार्ड रिपोर्ट, हाजिरी रिपोर्ट और शिफ्ट हैंडओवर जैसी जरूरी रिपोर्ट्स यहाँ आसानी से बनायें.
        </p>
      </div>

      {/* Generator Tab buttons */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { key: "attendance", label: `${t.attendance} (हाजिरी)`, icon: UserCheck },
          { key: "incident", label: `${t.incident} (घटना)`, icon: ShieldAlert },
          { key: "leave", label: `${t.leave} (छुट्टी)`, icon: Calendar },
          { key: "late", label: `${t.lateReport} (लेट)`, icon: Clock },
          { key: "visitor", label: `${t.visitor} (विजिटर)`, icon: UserPlus },
          { key: "handover", label: `${t.handover} (हैंडओवर)`, icon: RefreshCcw },
          { key: "dailylog", label: `${t.dailyLog} (डेली लॉग)`, icon: ClipboardList }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key);
                setOutputText("");
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === item.key
                  ? "bg-blue-600 text-white shadow-sm scale-105"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form panel dynamically selected */}
        <div className={`p-5 border rounded-xl shadow-sm space-y-4 ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
          
          {/* A. Attendance Form */}
          {activeTab === "attendance" && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2"><UserCheck className="text-indigo-500" /> Attendance Entry Log</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={attendance.date}
                    onChange={(e) => setAttendance({ ...attendance, date: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Shift Type</label>
                  <select
                    value={attendance.shift}
                    onChange={(e) => setAttendance({ ...attendance, shift: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  >
                    <option>Morning (08:00 AM - 08:00 PM)</option>
                    <option>Night (08:00 PM - 08:00 AM)</option>
                    <option>Regular Corporate (09:00 AM - 06:00 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Project / Site Location Name</label>
                <input
                  type="text"
                  placeholder="e.g. DLF CyberCity Gate 1"
                  value={attendance.projectName}
                  onChange={(e) => setAttendance({ ...attendance, projectName: e.target.value })}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Employee Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={attendance.empName}
                    onChange={(e) => setAttendance({ ...attendance, empName: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. SG-449"
                    value={attendance.empId}
                    onChange={(e) => setAttendance({ ...attendance, empId: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={attendance.mobile}
                    onChange={(e) => setAttendance({ ...attendance, mobile: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status/Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Present on duty"
                    value={attendance.remarks}
                    onChange={(e) => setAttendance({ ...attendance, remarks: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleGenerateReport("Attendance", attendance)}
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Constructing Attendance..." : "Generate Attendance Report"}
              </button>
            </div>
          )}

          {/* B. Incident Form */}
          {activeTab === "incident" && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-rose-500"><ShieldAlert /> Security Incident Log</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={incident.date}
                    onChange={(e) => setIncident({ ...incident, date: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Incident Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 14:15 PM"
                    value={incident.time}
                    onChange={(e) => setIncident({ ...incident, time: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Location of Incident</label>
                <input
                  type="text"
                  placeholder="e.g. Basement Parking A-3 Area"
                  value={incident.location}
                  onChange={(e) => setIncident({ ...incident, location: e.target.value })}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase">What Happened? (Dictate possible)</label>
                  <button
                    type="button"
                    onClick={() => startSpeechRecognitionForField("details", incident, setIncident)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${activeVoiceField === "details" ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-950 text-slate-400 hover:text-slate-200"}`}
                  >
                    <Mic className="w-3 h-3" /> Voice
                  </button>
                </div>
                <textarea
                  placeholder="e.g. A small smoke trigger was noted on electrical DB board 2. We used CO2 fire extinguisher..."
                  value={incident.details}
                  onChange={(e) => setIncident({ ...incident, details: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100 animate-pulse-subtle" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Actions Taken</label>
                  <button
                    type="button"
                    onClick={() => startSpeechRecognitionForField("actionTaken", incident, setIncident)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${activeVoiceField === "actionTaken" ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-950 text-slate-400"}`}
                  >
                    <Mic className="w-3 h-3" /> Voice
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Electrician was summoned immediately, Site Supervisor informed at 14:20 PM"
                  value={incident.actionTaken}
                  onChange={(e) => setIncident({ ...incident, actionTaken: e.target.value })}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>

              <button
                type="button"
                onClick={() => handleGenerateReport("Incident", incident)}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Organizing Incident Report..." : "Generate Security Incident Report"}
              </button>
            </div>
          )}

          {/* C. Leave Form */}
          {activeTab === "leave" && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2"><Calendar className="text-pink-500" /> Formal Leave Application</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">My Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Bikash Bindhani"
                    value={leave.empName}
                    onChange={(e) => setLeave({ ...leave, empName: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. SUP-109"
                    value={leave.empId}
                    onChange={(e) => setLeave({ ...leave, empId: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Designation</label>
                  <input
                    type="text"
                    value={leave.designation}
                    onChange={(e) => setLeave({ ...leave, designation: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Leave Type</label>
                  <select
                    value={leave.leaveType}
                    onChange={(e) => setLeave({ ...leave, leaveType: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  >
                    <option>Sick Leave</option>
                    <option>Casual Leave</option>
                    <option>Privilege Leave</option>
                    <option>Maternity/Paternity Leave</option>
                    <option>Emergency Family Issue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leave.startDate}
                    onChange={(e) => setLeave({ ...leave, startDate: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    value={leave.endDate}
                    onChange={(e) => setLeave({ ...leave, endDate: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Reason for Leave Request</label>
                  <button
                    type="button"
                    onClick={() => startSpeechRecognitionForField("reason", leave, setLeave)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${activeVoiceField === "reason" ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-950 text-slate-400"}`}
                  >
                    <Mic className="w-3 h-3" /> Voice
                  </button>
                </div>
                <textarea
                  placeholder="Describe your reasoning. E.g. Urgent family emergency in my native village requiring me to travel."
                  value={leave.reason}
                  onChange={(e) => setLeave({ ...leave, reason: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>

              <button
                type="button"
                onClick={() => handleGenerateReport("Leave Application", leave)}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Writing Leave Application..." : "Generate Leave Application"}
              </button>
            </div>
          )}

          {/* D. Late Report */}
          {activeTab === "late" && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-amber-500"><Clock /> Late Arrival Notification</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Scheduled Duty Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 08:00 AM"
                    value={late.expectedTime}
                    onChange={(e) => setLate({ ...late, expectedTime: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Expected Arrival Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 08:35 AM"
                    value={late.expectedArrival}
                    onChange={(e) => setLate({ ...late, expectedArrival: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Reason for Delay</label>
                  <button
                    type="button"
                    onClick={() => startSpeechRecognitionForField("delayReason", late, setLate)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${activeVoiceField === "delayReason" ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-950 text-slate-400"}`}
                  >
                    <Mic className="w-3 h-3" /> Voice
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Heavy rainfall, massive traffic block at bypass, bus was delayed"
                  value={late.delayReason}
                  onChange={(e) => setLate({ ...late, delayReason: e.target.value })}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Include Formal Apology?</label>
                <select
                  value={late.includeApology}
                  onChange={(e) => setLate({ ...late, includeApology: e.target.value })}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                >
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleGenerateReport("Late Reporting", late)}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-2xl transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Writing Apology Note..." : "Generate Late Reporting Message"}
              </button>
            </div>
          )}

          {/* E. Visitor entry log */}
          {activeTab === "visitor" && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-teal-500"><UserPlus /> Visitor Log entry</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Visitor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sunil Sharma"
                    value={visitor.name}
                    onChange={(e) => setVisitor({ ...visitor, name: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Company/Source Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon Delivery"
                    value={visitor.company}
                    onChange={(e) => setVisitor({ ...visitor, company: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contact Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9112233445"
                    value={visitor.contact}
                    onChange={(e) => setVisitor({ ...visitor, contact: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Vehicle No. (if any)</label>
                  <input
                    type="text"
                    placeholder="e.g. MH-12-PQ-4530"
                    value={visitor.vehicle}
                    onChange={(e) => setVisitor({ ...visitor, vehicle: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Host Info / Flat No. </label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 302 Block C"
                    value={visitor.hostInfo}
                    onChange={(e) => setVisitor({ ...visitor, hostInfo: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Entry Timestamp</label>
                  <input
                    type="text"
                    placeholder="e.g. Today 10:15 AM"
                    value={visitor.entryTime}
                    onChange={(e) => setVisitor({ ...visitor, entryTime: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  placeholder="e.g. Delivery of parcel and signature collection"
                  value={visitor.purpose}
                  onChange={(e) => setVisitor({ ...visitor, purpose: e.target.value })}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>

              <button
                type="button"
                onClick={() => handleGenerateReport("Visitor", visitor)}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-2xl transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Formatting Visitor Details..." : "Generate Visitor Entry Report"}
              </button>
            </div>
          )}

          {/* F. Shift Handover */}
          {activeTab === "handover" && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-indigo-500"><RefreshCcw /> Shift Handover Summary</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Outgoing Staff Name/ID</label>
                  <input
                    type="text"
                    placeholder="e.g. Bikash Bindhani (G-90)"
                    value={handover.outgoingStaff}
                    onChange={(e) => setHandover({ ...handover, outgoingStaff: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Incoming Staff Name/ID</label>
                  <input
                    type="text"
                    placeholder="e.g. Manoj Kumar (G-11)"
                    value={handover.incomingStaff}
                    onChange={(e) => setHandover({ ...handover, incomingStaff: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Keys Handed Over?</label>
                <select
                  value={handover.keysHandedOver}
                  onChange={(e) => setHandover({ ...handover, keysHandedOver: e.target.value })}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                >
                  <option>Yes - All cabinet and gate keys handed over</option>
                  <option>No - Some keys held by supervisor</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Assets & Accessories Status</label>
                  <button
                    type="button"
                    onClick={() => startSpeechRecognitionForField("assetsStatus", handover, setHandover)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${activeVoiceField === "assetsStatus" ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-950 text-slate-400"}`}
                  >
                    <Mic className="w-3 h-3" /> Voice
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="E.g. All equipment, walkie-talkies and logbooks checked & handed over."
                  value={handover.assetsStatus}
                  onChange={(e) => setHandover({ ...handover, assetsStatus: e.target.value })}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Outstanding Operations / Messages</label>
                  <button
                    type="button"
                    onClick={() => startSpeechRecognitionForField("outstandingIssues", handover, setHandover)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${activeVoiceField === "outstandingIssues" ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-950 text-slate-400"}`}
                  >
                    <Mic className="w-3 h-3" /> Voice
                  </button>
                </div>
                <textarea
                  placeholder="e.g. CCTV monitor number 4 flickers slightly, supervisor was alerted."
                  value={handover.outstandingIssues}
                  onChange={(e) => setHandover({ ...handover, outstandingIssues: e.target.value })}
                  rows={2}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>

              <button
                type="button"
                onClick={() => handleGenerateReport("Handover", handover)}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Formatting Handover Report..." : "Generate Shift Handover Report"}
              </button>
            </div>
          )}

          {/* G. Daily Security Log */}
          {activeTab === "dailylog" && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-indigo-500"><ClipboardList /> Daily Security Log</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={dailyLog.date}
                    onChange={(e) => setDailyLog({ ...dailyLog, date: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Site / Shift Name</label>
                  <input
                    type="text"
                    placeholder="e.g. DLF CyberPark Tower B"
                    value={dailyLog.siteName}
                    onChange={(e) => setDailyLog({ ...dailyLog, siteName: e.target.value })}
                    className={`w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Hourly Logging Activities (Line-by-Line)</label>
                  <button
                    type="button"
                    onClick={() => startSpeechRecognitionForField("logDetails", dailyLog, setDailyLog)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition ${activeVoiceField === "logDetails" ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-950 text-slate-400"}`}
                  >
                    <Mic className="w-3 h-3" /> Voice
                  </button>
                </div>
                <textarea
                  placeholder="E.g.&#10;08:00 - Shift start, briefing completed&#10;12:00 - Perimeter locks check, all safe&#10;16:00 - Material entry logged"
                  value={dailyLog.logDetails}
                  onChange={(e) => setDailyLog({ ...dailyLog, logDetails: e.target.value })}
                  rows={6}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl border font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>

              <button
                type="button"
                onClick={() => handleGenerateReport("Daily Security Log", dailyLog)}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Revising daily log to corporate specs..." : "Generate Daily Security Log"}
              </button>
            </div>
          )}

        </div>

        {/* AI Output Presentation Panel */}
        <div className={`p-5 border rounded-xl space-y-4 shadow-sm flex flex-col justify-between ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="space-y-3 flex-1 flex flex-col justify-start">
            <span className="text-xs font-bold uppercase tracking-wide text-blue-600 flex items-center gap-1">
              ✅ तैयार की हुई रिपोर्ट (Your Formatted Report)
            </span>

            {outputText ? (
              <div className="flex-1 p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/20 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-all text-slate-800">
                {outputText}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg border-slate-200 text-slate-500 bg-slate-50/50">
                <FileText className="w-8 h-8 text-slate-400 mb-2 animate-pulse" />
                <span className="text-xs font-bold text-slate-700">आपकी रिपोर्ट यहाँ बनकर तैयार होगी</span>
                <span className="text-[11px] mt-1 text-slate-500">बाएं (left) तरफ फॉर्म भरें और नीचे "Generate" बटन दबाएं.</span>
              </div>
            )}
          </div>

          {outputText && (
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-2 py-3 px-3 font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-md hover:scale-[1.03]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    कॉपी हो गया! (Copied)
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    📋 WhatsApp के लिए कॉपी (Copy message)
                  </>
                )}
              </button>

              <button
                onClick={handleExportPdf}
                className="inline-flex items-center justify-center gap-2 py-3 px-3 font-bold text-xs border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-lg transition shadow-sm"
              >
                <FileDown className="w-4 h-4 text-blue-500" />
                📥 PDF डाउनलोड (PDF)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
