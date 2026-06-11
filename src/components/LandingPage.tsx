/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Shield, 
  ArrowRight, 
  Sparkles, 
  Copy, 
  FileCheck, 
  HelpCircle, 
  Instagram, 
  User, 
  ExternalLink,
  Smartphone,
  Zap,
  Globe,
  Star,
  CheckCircle2,
  Users,
  Award
} from "lucide-react";
import { locales } from "../locale";

interface LandingPageProps {
  onStartFree: () => void;
  lang: "en" | "hi" | "or";
  setLang: (lang: "en" | "hi" | "or") => void;
  darkMode: boolean;
  adminEmail?: string;
  freeDailyLimit?: number;
}

export default function LandingPage({ 
  onStartFree, 
  lang, 
  setLang, 
  darkMode, 
  adminEmail = "bindhanibikash71@gmail.com",
  freeDailyLimit = 5 
}: LandingPageProps) {
  const t = locales[lang];

  const handleGoPremiumClick = () => {
    alert(`⚡ PREMIUM UPGRADE ACTUATION:\n\nTo unlock completely unlimited AI generation and premium server priorities, please contact our Administrator directly on Email: ${adminEmail}.\n\nYour corporate account will be instant-activated!`);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      darkMode 
        ? "bg-[#090e1a] text-slate-100" 
        : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* Top Glass Navigation */}
      <nav id="landing-navbar" className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-305 ${
        darkMode 
          ? "bg-[#090e1a]/80 border-slate-900/85" 
          : "bg-white/80 border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md"></div>
              <img
                src="https://fat-azure-kkcyikqe.edgeone.app/file_00000000f60071fab8c19be6b3db0ab7.png"
                alt="Guard AI Logo"
                className="w-10 h-10 object-contain rounded-xl relative z-10 border border-white/10"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                GUARD ENGLISH AI
              </span>
              <span className="block text-[8px] tracking-widest font-mono uppercase text-slate-400 font-bold">
                MILITARY GRADE REPORTING
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Elegant Language Selectors */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/40 dark:border-slate-900">
              {(["en", "hi", "or"] as const).map((l) => (
                <button 
                  key={l}
                  onClick={() => setLang(l)} 
                  className={`text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg font-extrabold tracking-wide transition-all uppercase ${
                    lang === l 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/15" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {l === "en" ? "EN" : l === "hi" ? "HINDI" : "ODIA"}
                </button>
              ))}
            </div>

            <button
              onClick={onStartFree}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-xs font-display font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02]"
            >
              🚀 GET STARTED <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section Container */}
      <header className="relative pt-16 pb-20 overflow-hidden">
        {/* Dynamic Light Orbs */}
        <div className="absolute inset-0 max-w-7xl mx-auto pointer-events-none">
          <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full filter blur-[120px]"></div>
          <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full filter blur-[100px]"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center px-4 relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-extrabold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mx-auto animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI-POWERED REPORT UPGRADER FOR SQUADS</span>
          </div>

          <h1 className="text-4xl sm:text-7xl font-display font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
            <span className="block">{t.title}</span>
            <span className="block mt-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent italic">
              {t.subTitle}
            </span>
          </h1>

          <p className={`text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed ${
            darkMode ? "text-slate-400" : "text-slate-600"
          }`}>
            {t.tagline}. Apni raw Hinglish, Hindi, Odia ya casual operational text ko ek single tap me industry-grade corporate English security reporting me badlein. Keep flawless records automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
            <button
              onClick={onStartFree}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-xs font-display font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-xl shadow-blue-600/30 hover:scale-[1.02] cursor-pointer"
            >
              {t.startFree.toUpperCase()}
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-xs font-display font-extrabold rounded-2xl border transition-all ${
                darkMode 
                  ? "bg-slate-900/40 border-slate-800 hover:bg-slate-900 text-slate-350" 
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              EXPLORE CAPABILITIES
            </a>
          </div>

          {/* Developer Social Proof Badge with elegant glow */}
          <div className="pt-6">
            <div className={`inline-flex flex-col sm:flex-row items-center gap-4 py-3.5 px-6 rounded-2xl border ${
              darkMode 
                ? "bg-[#111827]/60 border-slate-800/80 shadow-md" 
                : "bg-white border-slate-200/60 shadow-sm"
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400">
                <Award className="w-4 h-4 text-emerald-500" />
                SYSTEM DEVELOPER
              </div>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-800 hidden sm:block"></div>
              <a 
                href="https://www.instagram.com/_noirvex1" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2 font-display font-extrabold text-blue-600 dark:text-blue-400 hover:underline transition"
              >
                Bikash Bindhani
                <Instagram className="w-4 h-4 text-pink-500" />
                <span className="text-[10px] font-mono text-slate-400">(@_noirvex1)</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Feature Transformation Preview Widget */}
      <section className="py-12 max-w-5xl mx-auto px-4">
        <div className={`rounded-3xl border p-6 sm:p-10 relative overflow-hidden ${
          darkMode 
            ? "bg-[#111827]/40 border-slate-900/90 animate-glow-indigo" 
            : "bg-white border-slate-200 shadow-lg"
        }`}>
          {/* Subtle decorative background grids */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-b from-blue-500/10 to-transparent rounded-full filter blur-xl"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
            <div className="space-y-4">
              <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-500 text-[10px] font-mono font-extrabold uppercase">
                BEFORE & AFTER (कल बनाम आज)
              </span>
              <h3 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
                Turn Local Messages into Corporate Excellence
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${
                darkMode ? "text-slate-400" : "text-slate-600"
              }`}>
                Corporate managers or clients on official WhatsApp groups often judge guards based on spelling or grammar. Simply describe what happened in your local tone, and our engine produces elite, high-integrity English reports instantly!
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Hinglish", "Hindi", "Odia", "Bengali", "Tamil", "Telugu"].map((l) => (
                  <span 
                    key={l} 
                    className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-900"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {/* Raw Input Box */}
              <div className="rounded-2xl bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20 p-4 relative">
                <span className="absolute top-3 right-3 text-[9px] font-mono font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-500/15 px-2 py-0.5 rounded">
                  RAW INPUT (गार्ड द्वारा टाइप किया गया)
                </span>
                <p className="font-mono text-xs text-slate-705 dark:text-slate-350 mt-4 leading-relaxed font-bold">
                  "sir gate number 2 pe aag laga tha par hum fire pipe se douse kar diyee ramesh ke sath, sab control me h abhi"
                </p>
              </div>

              {/* Polish High-Fidelity Output */}
              <div className="rounded-2xl bg-emerald-500/5 dark:bg-emerald-505/5 border border-emerald-500/20 p-4 relative">
                <span className="absolute top-3 right-3 text-[9px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/15 px-2 py-0.5 rounded">
                  ELITE SYSTEM REPORT (सच्चा प्रोफेशनल रूप)
                </span>
                <div className="mt-4 text-xs text-slate-800 dark:text-emerald-400 font-mono leading-relaxed whitespace-pre-line bg-slate-900/20 dark:bg-slate-950/20 p-2.5 rounded-lg">
                  {`[INCIDENT LOG REPORT]
DATE: 11-June-2026 | STATUS: RESOLVED

Sir, a minor fire breakout was reported near Gate No. 2. 
Officer Ramesh and I acted immediately and successfully extinguished the flames using the on-site fire hose. 

The situation has been fully controlled, and patrols have been intensified.

Regards,
Security Operations Unit`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid with Glass cards */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-mono tracking-widest font-extrabold text-blue-500 uppercase">
            OPERATIONAL INSTRUMENTS & UTILITIES
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
            Built For Real Security Officers
          </h2>
          <p className={`max-w-2xl mx-auto text-xs sm:text-sm ${
            darkMode ? "text-slate-400" : "text-slate-600"
          }`}>
            We didn't just build a translator. This is a secure operational system crafted alongside field supervisors to make daily site management smooth and foolproof.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className={`p-6 rounded-3xl border transition-all duration-200 hover:scale-[1.01] ${
            darkMode 
              ? "bg-[#111827]/40 border-slate-900 hover:border-slate-800" 
              : "bg-white border-slate-200 hover:shadow-md"
          }`}>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-base mb-1 text-slate-905 dark:text-white">Multilingual Converter</h4>
            <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Instantly converts files and spoken Hinglish, Odia, or Bengali inputs into precise, formal security terminology tailored for corporate groups.
            </p>
          </div>

          {/* Feature 2 */}
          <div className={`p-6 rounded-3xl border transition-all duration-200 hover:scale-[1.01] ${
            darkMode 
              ? "bg-[#111827]/40 border-slate-900 hover:border-slate-800" 
              : "bg-white border-slate-200 hover:shadow-md"
          }`}>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 font-mono font-bold text-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-base mb-1 text-slate-905 dark:text-white">Report Wizard Forms</h4>
            <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Select from specific structured layouts like Incident Reports, Shift Handovers, Attendance logs, or Visitor trackers for structured data input.
            </p>
          </div>

          {/* Feature 3 */}
          <div className={`p-6 rounded-3xl border transition-all duration-200 hover:scale-[1.01] ${
            darkMode 
              ? "bg-[#111827]/40 border-slate-900 hover:border-slate-800" 
              : "bg-white border-slate-200 hover:shadow-md"
          }`}>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-base mb-1 text-slate-905 dark:text-white">AI Tone Refinement</h4>
            <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Pick how your report sounds. Upgrade grammar seamlessly, or switch to concise security logs with single-click options.
            </p>
          </div>

          {/* Feature 4 */}
          <div className={`p-6 rounded-3xl border transition-all duration-200 hover:scale-[1.01] ${
            darkMode 
              ? "bg-[#111827]/40 border-slate-900 hover:border-slate-800" 
              : "bg-white border-slate-200 hover:shadow-md"
          }`}>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-base mb-1 text-slate-905 dark:text-white">Direct PDF Documents</h4>
            <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Direct PDF download supports clean corporate operational formatting so you can print or present logs to management teams any time.
            </p>
          </div>

          {/* Feature 5 */}
          <div className={`p-6 rounded-3xl border transition-all duration-200 hover:scale-[1.01] ${
            darkMode 
              ? "bg-[#111827]/40 border-slate-900 hover:border-slate-800" 
              : "bg-white border-slate-200 hover:shadow-md"
          }`}>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-505 mb-4">
              <Copy className="w-5 h-5 text-purple-500" />
            </div>
            <h4 className="font-display font-bold text-base mb-1 text-slate-905 dark:text-white">Easy Clipboard Copying</h4>
            <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Say goodbye to frustrating text selections. Simply click a single copy button, and paste directly into WhatsApp or text boxes.
            </p>
          </div>

          {/* Feature 6 */}
          <div className={`p-6 rounded-3xl border transition-all duration-200 hover:scale-[1.01] ${
            darkMode 
              ? "bg-[#111827]/40 border-slate-900 hover:border-slate-800" 
              : "bg-white border-slate-200 hover:shadow-md"
          }`}>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-505 mb-4">
              <Zap className="w-5 h-5 text-indigo-500" />
            </div>
            <h4 className="font-display font-bold text-base mb-1 text-slate-905 dark:text-white">Active Guardian Tools</h4>
            <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Built-in electronic security tools: trigger high-pitch alarms, patrol interval checklists, and quick help buttons to guarantee alertness.
            </p>
          </div>

        </div>
      </section>

      {/* Pricing Section with sleek glass dividers */}
      <section id="pricing" className={`py-20 transition-colors ${
        darkMode ? "bg-slate-950/40" : "bg-slate-100/60"
      }`}>
        <div className="max-w-7xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-mono tracking-widest font-extrabold text-indigo-500 uppercase">
              TRANSPARENT VALUATION
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
              Sleek Plans Built For Scale
            </h2>
            <p className={`max-w-xl mx-auto text-xs sm:text-sm ${
              darkMode ? "text-slate-400" : "text-slate-600"
            }`}>
              Projecting professional corporate presence at your post is an investment in your career. Select the option that matches your duty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className={`p-8 rounded-3xl border flex flex-col justify-between space-y-6 ${
              darkMode 
                ? "bg-[#090e1a]/85 border-slate-900" 
                : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div>
                <h4 className="font-display font-bold text-lg text-slate-400">STARTER SHIELD</h4>
                <div className="text-4xl font-display font-extrabold mt-4 text-slate-900 dark:text-white">
                  ₹0 <span className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400">/ PER MONTH</span>
                </div>
                <p className="text-xs mt-2 text-slate-500">Essential utilities to test out custom security formats.</p>
                <div className="border-t border-slate-200 dark:border-slate-900 my-6"></div>
                
                <ul className="space-y-3.5 text-xs">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span><strong>{freeDailyLimit}</strong> operational reports per day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Hinglish & Regional translation engines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Standard PDF layout exports</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 dark:text-slate-700">
                    <span className="font-extrabold">✕</span>
                    <span>No unlimited corporate license access</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={onStartFree} 
                className="w-full mt-6 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 font-display font-extrabold text-xs tracking-wider rounded-xl transition cursor-pointer"
              >
                START TESTING
              </button>
            </div>

            {/* Premium Plan */}
            <div className={`p-8 rounded-3xl border-2 border-blue-600 relative overflow-hidden flex flex-col justify-between space-y-6 shadow-xl ${
              darkMode 
                ? "bg-[#111827]/80" 
                : "bg-white"
            }`}>
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-mono font-extrabold px-3 py-1 uppercase tracking-widest rounded-bl-xl">
                MOST INSTALLED
              </div>
              <div>
                <h4 className="font-display font-extrabold text-lg text-blue-500">SUPERVISOR PRO</h4>
                <div className="text-4xl font-display font-extrabold mt-4 text-slate-900 dark:text-white">
                  ₹299 <span className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400">/ PER MONTH</span>
                </div>
                <p className="text-xs mt-2 text-slate-400">The corporate standard designed to empower professional squads.</p>
                <div className="border-t border-slate-200 dark:border-slate-800 my-6"></div>
                
                <ul className="space-y-3.5 text-xs">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span><strong>{t.unlimited}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span><strong>{t.fasterAi}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span><strong>{t.advancedTemplates}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span><strong>{t.prioritySupport}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <span>Complete WhatsApp Forward formatted outputs</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={handleGoPremiumClick} 
                className="w-full mt-6 py-3.5 px-4 bg-blue-650 hover:bg-blue-700 text-white font-display font-extrabold text-xs tracking-wider rounded-xl transition shadow-lg shadow-blue-500/20 hover:scale-[1.01] cursor-pointer"
              >
                UPGRADE TO ENTERPRISE
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ styled beautifully with subtle indicators */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-mono tracking-widest font-extrabold text-blue-500 uppercase">
            COMMON CONCERNS RESOLVED
          </span>
          <h2 className="text-3xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Does Guard English AI understand my local spoken languages natively?",
              a: "Absolutely! The system was designed from the ground up for guards in diverse regions. It flawlessly processes Hinglish, direct Hindi (हिंदी), and Odia (ଓଡ଼ିଆ) formulations into high-compliance corporate reports."
            },
            {
              q: "Can I run it on my smartphone during night patrol rounds?",
              a: "Yes! Guard English AI is a PWA (Progressive Web App). You can choose 'Add to Home Screen' via your browser settings to run it as a full-screen, fast, integrated native app on any brand of mobile phone."
            },
            {
              q: "How safe are my workplace logs and supervisor interactions?",
              a: "Extremely secure. All records are hosted strictly under password protection on private database nodes, ensuring complete confidentiality for your workplace team."
            }
          ].map((item, idx) => (
            <div key={idx} className={`p-6 rounded-2xl border ${
              darkMode 
                ? "bg-[#111827]/40 border-slate-900/95" 
                : "bg-white border-slate-200"
            }`}>
              <h5 className="font-display font-bold text-base flex items-start gap-3 text-slate-900 dark:text-white">
                <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                {item.q}
              </h5>
              <p className={`mt-2 text-xs leading-relaxed ${
                darkMode ? "text-slate-400" : "text-slate-600"
              } pl-8`}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Modern High contrast footer */}
      <footer className={`py-12 border-t transition-colors ${
        darkMode 
          ? "bg-[#090e1a] border-slate-900 text-slate-500" 
          : "bg-slate-100 border-slate-200 text-slate-600"
      }`}>
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2.5 text-blue-500">
            <Shield className="w-5 h-5" />
            <span className="font-display font-extrabold text-sm tracking-widest uppercase text-slate-800 dark:text-slate-200">
              GUARD ENGLISH AI OPERATIONS
            </span>
          </div>
          <p className="text-xs max-w-sm mx-auto leading-relaxed">
            Leading AI-driven translation tech engineered explicitly for high-compliance military, estate, and general corporate security guards directory.
          </p>
          <div className="flex items-center justify-center gap-3 text-xs pt-2">
            <span>System Creator: <strong>Bikash Bindhani</strong></span>
            <span className="text-slate-800">•</span>
            <a 
              href="https://www.instagram.com/_noirvex1" 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-400 hover:underline inline-flex items-center gap-1 font-bold"
            >
              Instagram <Instagram className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-[10px] text-slate-600 dark:text-slate-500 pt-3">
            &copy; {new Date().getFullYear()} Guard English AI. {t.allRightsReserved}
          </p>
        </div>
      </footer>
    </div>
  );
}
