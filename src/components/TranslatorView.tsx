/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Copy, 
  Check, 
  Bookmark, 
  BookmarkCheck, 
  FileDown, 
  Sparkles, 
  Volume2, 
  RefreshCw,
  Send
} from "lucide-react";
import { locales } from "../locale";
import { downloadReportAsPdf } from "../utils";
import { query, ref, push, set } from "firebase/database";
import { rtdb } from "../firebase";

interface TranslatorViewProps {
  uid: string;
  lang: "en" | "hi" | "or";
  darkMode: boolean;
  onSaveReport: (report: { title: string; type: string; originalInput: string; formattedOutput: string }) => Promise<void>;
  plan: "free" | "premium";
  isLimitExceeded?: boolean;
  dailyLimit?: number;
  remainingCredits?: number;
  adminEmail?: string;
}

export default function TranslatorView({ 
  uid, 
  lang, 
  darkMode, 
  onSaveReport, 
  plan,
  isLimitExceeded = false,
  dailyLimit = 5,
  remainingCredits = 5,
  adminEmail = "bindhanibikash71@gmail.com"
}: TranslatorViewProps) {
  const t = locales[lang];
  
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [formatType, setFormatType] = useState(() => localStorage.getItem("translator_format_type") || "security"); // 'security' | 'corporate' | 'brief'
  const [inputLang, setInputLang] = useState("hi-IN"); // 'hi-IN' | 'or-IN' | 'ta-IN' | 'te-IN' | 'bn-IN' | 'en-US'
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState("");

  // Sync formatType from localStorage on render
  useEffect(() => {
    const savedType = localStorage.getItem("translator_format_type");
    if (savedType) {
      setFormatType(savedType);
    }
  }, []);

  const handleConvert = async () => {
    if (isLimitExceeded) {
      alert(`Daily request limit reached! Your daily limit is ${dailyLimit} conversions. To secure more request allowance or upgrade to UNLIMITED corporate tier, please contact our administrator directly on Email:\n\n👉  ${adminEmail}  👈`);
      setError(`Limit Exceeded: Please contact admin ${adminEmail} to upgrade!`);
      return;
    }

    if (!inputText.trim()) {
      setError("Please enter your message first");
      return;
    }

    setLoading(true);
    setError("");
    setOutputText("");
    setIsFavorite(false);

    try {
      const response = await fetch("/api/ai/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          type: "AI English Converter",
          format: formatType
        }),
      });

      const data = await response.json();
      if (data.success && data.result) {
        setOutputText(data.result);
        
        // Auto save to database history
        await onSaveReport({
          title: "AI Message Correction",
          type: "conv",
          originalInput: inputText,
          formattedOutput: data.result,
        });
      } else {
        throw new Error(data.error || "Failed static translation sequence");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to convert message with AI. Please check your key settings.");
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

  const handlePdfExport = () => {
    if (!outputText) return;
    downloadReportAsPdf("General AI Message Converter", inputText, outputText);
  };

  return (
    <div className="space-y-6">
      {/* Visual Step-by-Step Guide Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
          💡 Simple Guide (How to use)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-blue-800 leading-relaxed font-sans">
          <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px] mr-1.5">1</span>
            <strong>Select Language:</strong> Choose your speaking/regional language below.
          </div>
          <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px] mr-1.5">2</span>
            <strong>Speak or Type:</strong> Click the green button to speak, or type directly.
          </div>
          <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px] mr-1.5">3</span>
            <strong>Click Convert:</strong> Press the blue button to correct into professional English.
          </div>
          <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px] mr-1.5">4</span>
            <strong>Copy & Share:</strong> Copy the text to send on WhatsApp or download as PDF.
          </div>
        </div>
      </div>

      {/* Title block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">✍️ {t.aiWriter}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Type in your local language & convert to pristine professional English.
          </p>
        </div>

        {/* Input Language Configuration dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">🗣️ Select Language:</span>
          <select
            value={inputLang}
            onChange={(e) => setInputLang(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold bg-white text-slate-800 cursor-pointer"
          >
            <option value="hi-IN">Hindi</option>
            <option value="or-IN">Odia</option>
            <option value="bn-IN">Bengali</option>
            <option value="ta-IN">Tamil</option>
            <option value="te-IN">Telugu</option>
            <option value="en-IN">Indian English / Hinglish</option>
            <option value="en-US">US / General English</option>
          </select>
        </div>
      </div>

      {isLimitExceeded && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-900 px-4 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-semibold shadow-xs">
          <span>⚠️ Daily free generation quota has been exhausted. Enjoyed our app? Please contact Admin on email: <strong className="underline text-indigo-650">{adminEmail}</strong> for professional unlimited enterprise access!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className={`lg:col-span-2 p-5 border rounded-xl space-y-4 shadow-sm flex flex-col justify-between ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1">
                💬 Type your local language message
              </span>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your local language message here... (e.g. 'sir aaj ramesh fever ke wajah se duty nahi aaya')"
              rows={8}
              className={`block w-full border text-sm rounded-lg p-3 pt-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
            />
          </div>

          <div className="space-y-4 pt-4 border-t dark:border-slate-800">
            {/* Template Formatting choice buttons */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">🏢 Choose Output Style:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "security", label: "🛡️ Security/Guard Style" },
                  { value: "corporate", label: "💼 Executive Corporate" },
                  { value: "casual", label: "📱 Easy Chat Mode" },
                  { value: "brief", label: "📝 Brief Summary" }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormatType(opt.value)}
                    className={`text-xs px-3 py-2 rounded-lg border font-bold transition-all ${
                      formatType === opt.value
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

            <button
              onClick={handleConvert}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              {loading ? "⚙️ AI Processing..." : "🚀 Convert to Perfect English"}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className={`p-5 border rounded-xl space-y-4 shadow-sm flex flex-col justify-between ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="space-y-3 flex-1 flex flex-col justify-start">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                ✅ Perfect English Output
              </span>
              
              {outputText && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Corrected!
                  </span>
                </div>
              )}
            </div>

            {outputText ? (
              <div className="flex-1 p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/35 font-mono text-sm leading-relaxed text-slate-800 select-all">
                {outputText}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg border-slate-200 text-slate-500 bg-slate-50/50">
                <Volume2 className="w-8 h-8 text-slate-400 mb-2 animate-pulse" />
                <span className="text-xs font-bold text-slate-700">Perfect English will appear here</span>
                <span className="text-[11px] mt-1 text-slate-500">Speak or type in your language, then click Convert.</span>
              </div>
            )}
          </div>

          {outputText && (
            <div className="grid grid-cols-2 gap-3 pt-4 border-t dark:border-slate-800">
              <button
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-2 py-3 px-3 font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-md hover:scale-[1.03]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    📋 Copy for WhatsApp
                  </>
                )}
              </button>

              <button
                onClick={handlePdfExport}
                className="inline-flex items-center justify-center gap-2 py-3 px-3 font-bold text-xs border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-lg transition shadow-sm"
              >
                <FileDown className="w-4 h-4 text-blue-500" />
                📥 Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
