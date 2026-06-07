/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
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
}

export default function TranslatorView({ uid, lang, darkMode, onSaveReport, plan }: TranslatorViewProps) {
  const t = locales[lang];
  
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [formatType, setFormatType] = useState("security"); // 'security' | 'corporate' | 'brief'
  const [inputLang, setInputLang] = useState("hi-IN"); // 'hi-IN' | 'or-IN' | 'ta-IN' | 'te-IN' | 'bn-IN' | 'en-US'
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState("");

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let rec: any = null;

    if (SpeechRecognition) {
      rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = inputLang;

      rec.onstart = () => {
        setListening(true);
      };

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInputText((prev) => prev + " " + finalTranscript);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (rec) {
        try {
          rec.abort();
        } catch (err) {
          console.error("Cleaned up web speech component", err);
        }
      }
    };
  }, [inputLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome/Safari.");
      return;
    }

    if (listening) {
      try {
        recognitionRef.current.abort();
      } catch (err) {
        console.error("Speech abort failed", err);
      }
      setListening(false);
    } else {
      setError("");
      try {
        recognitionRef.current.lang = inputLang;
        recognitionRef.current.start();
        setListening(true);
      } catch (err: any) {
        console.error("Speech start failed", err);
        if (err.name === "InvalidStateError" || (err.message && err.message.includes("already started"))) {
          setListening(true);
        } else {
          setListening(false);
        }
      }
    }
  };

  const handleConvert = async () => {
    if (!inputText.trim()) {
      setError("Please write or speak something first");
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
          format: formatType,
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
      {/* Visual Step-by-Step bilingual Guide Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 shadow-xs">
        <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
          💡 आसान गाइड / ସହଜ ଗାଇଡ୍ (How to use)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-blue-800 leading-relaxed font-sans">
          <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px] mr-1.5">1</span>
            <strong>भाषा चुनें (Select Language):</strong> नीचे से अपनी भाषा चुनें.
          </div>
          <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px] mr-1.5">2</span>
            <strong>मैसेज बोलें (Speak/Type):</strong> हरा बटन दबाकर बोलें या यहाँ लिखें.
          </div>
          <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px] mr-1.5">3</span>
            <strong>बटन दबाएं (AI Correct):</strong> नीले बटन से इंग्लिश सही करें.
          </div>
          <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full font-bold text-[10px] mr-1.5">4</span>
            <strong>WhatsApp Copy:</strong> कॉपी करें और सीधे WhatsApp पर भेजें!
          </div>
        </div>
      </div>

      {/* Title block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">✍️ {t.aiWriter} (English Correct Karein)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            अपनी भाषा में बोलें और उसे बहुत ही बढ़िया English में बदलें.
          </p>
        </div>

        {/* Input Language Configuration dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">🗣️ अपनी भाषा चुनें (Select Language):</span>
          <select
            value={inputLang}
            onChange={(e) => setInputLang(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold bg-white text-slate-800 cursor-pointer"
          >
            <option value="hi-IN">Hindi (हिंदी में बोलें)</option>
            <option value="or-IN">Odia (ଓଡ଼ିଆ ରେ କୁହନ୍ତୁ)</option>
            <option value="bn-IN">Bengali (বাংলায় বলুন)</option>
            <option value="ta-IN">Tamil (தமிழில் பேசுங்கள்)</option>
            <option value="te-IN">Telugu (తెలుగులో మాట్లాడండి)</option>
            <option value="en-IN">Indian English (Hinglish/Mix bhasha)</option>
            <option value="en-US">US/General English</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className={`lg:col-span-2 p-5 border rounded-xl space-y-4 shadow-sm flex flex-col justify-between ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1">
                💬 यहाँ संदेश बोलें या टाइप करें (Type or Speak here)
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all shadow-sm ${
                    listening 
                      ? "bg-rose-600 text-white animate-pulse" 
                      : "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105"
                  }`}
                >
                  {listening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      🎤 बंद करें (STOP Recording)
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      🎤 बोलकर लिखें (START Dictation)
                    </>
                  )}
                </button>
              </div>
            </div>

            {listening && (
              <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200 flex items-center gap-2 font-bold animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                <span>🎙️ रिकॉर्डिंग चालू है, कृपया बोलें... (Speak now, the writing will appear below)</span>
              </div>
            )}

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="यहाँ अपनी भाषा में कुछ भी लिखिए या ऊपर दिए गए '🎤 बोलकर लिखें' बटन को दबाकर बोलें... (जैसे: 'sir aaj ramesh fever ke wajah se duty nahi aaya')"
              rows={8}
              className={`block w-full border text-sm rounded-lg p-3 pt-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
            />
          </div>

          <div className="space-y-4 pt-4 border-t dark:border-slate-800">
            {/* Template Formatting choice buttons */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">🏢 कैसी इंग्लिश में चाहिए? (Choose Output Style):</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "security", label: "🛡️ Security/Guard Style (गार्ड ड्यूटी के लिए)" },
                  { value: "corporate", label: "💼 Executive Corporate (अधिकारी के लिए)" },
                  { value: "casual", label: "📱 Easy Chat Mode (दोस्तों या साधारण बात के लिए)" },
                  { value: "brief", label: "📝 Brief Summary (छोटा और सीधा संदेश)" }
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
              {loading ? "⚙️ इंग्लिश सही की जा रही है... (AI Processing...)" : "🚀 अंग्रेजी सही करें (Convert to Perfect English)"}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className={`p-5 border rounded-xl space-y-4 shadow-sm flex flex-col justify-between ${darkMode ? "bg-slate-900/65 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="space-y-3 flex-1 flex flex-col justify-start">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                ✅ सही की हुई इंग्लिश (Perfect English Output)
              </span>
              
              {outputText && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Sahi ho gaya!
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
                <span className="text-xs font-bold text-slate-700">आपकी सही इंग्लिश यहाँ दिखेगी</span>
                <span className="text-[11px] mt-1 text-slate-500">ऊपर अपनी भाषा में बोलने के बाद नीले बटन को दबाएं.</span>
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
                    नकल हो गया! (Copied)
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    📋 WhatsApp पर भेजें (COPY)
                  </>
                )}
              </button>

              <button
                onClick={handlePdfExport}
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
