/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Shield, 
  ArrowRight, 
  Sparkles, 
  Mic, 
  Copy, 
  FileCheck, 
  HelpCircle, 
  Instagram, 
  User, 
  ExternalLink,
  Smartphone,
  Zap,
  Globe
} from "lucide-react";
import { locales } from "../locale";

interface LandingPageProps {
  onStartFree: () => void;
  lang: "en" | "hi" | "or";
  setLang: (lang: "en" | "hi" | "or") => void;
  darkMode: boolean;
}

export default function LandingPage({ onStartFree, lang, setLang, darkMode }: LandingPageProps) {
  const t = locales[lang];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      {/* Top Banner/Navigation */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${darkMode ? "bg-slate-950/80 border-slate-900" : "bg-white/80 border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg">
              <Shield className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-500 to-sky-400 bg-clip-text text-transparent">
              GUARD ENGLISH AI
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Picker */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
              <button 
                onClick={() => setLang("en")} 
                className={`text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all ${lang === "en" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLang("hi")} 
                className={`text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all ${lang === "hi" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
              >
                हिंदी
              </button>
              <button 
                onClick={() => setLang("or")} 
                className={`text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all ${lang === "or" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
              >
                ଓଡ଼ିଆ
              </button>
            </div>

            <button
              onClick={onStartFree}
              className="hidden sm:inline-flex items-center gap-1 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-md shadow-indigo-600/10"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 max-w-7xl mx-auto pointer-events-none">
          <div className="absolute top-1/4 -left-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full filter blur-3xl"></div>
          <div className="absolute top-1/3 -right-10 w-96 h-96 bg-sky-500/10 dark:bg-sky-500/5 rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
            <Sparkles className="w-3.5 h-3.5" />
            Designed for Field Workers & Security Teams
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            <span className="block">{t.title}</span>
            <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-500 bg-clip-text text-transparent text-3xl sm:text-5xl font-bold">
              {t.subTitle}
            </span>
          </h1>

          <p className={`text-base sm:text-lg max-w-2xl mx-auto ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            {t.tagline}. Translate Hinglish, Hindi, Odia, Tamil, Telugu, and Bengali to Corporate English communication on WhatsApp and formal records.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartFree}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition shadow-lg shadow-indigo-600/25"
            >
              {t.startFree}
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#faq"
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl border transition ${darkMode ? "bg-slate-900/40 border-slate-800 hover:bg-slate-900" : "bg-white border-slate-200 hover:bg-slate-50"}`}
            >
              Learn More
            </a>
          </div>

          {/* Social Proof of Developer */}
          <div className={`mt-10 py-5 px-6 rounded-2xl inline-flex flex-col sm:flex-row items-center gap-3 border ${darkMode ? "bg-slate-900/30 border-slate-900" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400">
              <User className="w-4 h-4 text-indigo-500" />
              CREATED BY
            </div>
            <a 
              href="https://www.instagram.com/_noirvex1" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition"
            >
              Bikash Bindhani
              <Instagram className="w-4 h-4 text-pink-500" />
              <span className="text-xs font-normal text-slate-400">(@_noirvex1)</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Instant Converter Live Example Section */}
      <section className="py-12 max-w-7xl mx-auto px-4">
        <div className={`rounded-3xl border p-6 sm:p-10 ${darkMode ? "bg-slate-900/40 border-slate-900/80" : "bg-white border-slate-200"} shadow-xl`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Instantly Upgrade Local Messages
              </h3>
              <p className={darkMode ? "text-slate-400" : "text-slate-600"}>
                Tired of writing broken English on management WhatsApp groups? Our AI reads messages in Hindi, Odia, or regional phrasing and outputs elite business correspondence instantly.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Hinglish", "Hindi", "Odia", "Bengali", "Tamil", "Telugu"].map((l) => (
                  <span key={l} className="px-3 py-1 text-xs rounded-lg font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 relative">
                <span className="absolute top-3 right-3 text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  Input (Local Language)
                </span>
                <p className="font-medium text-slate-700 dark:text-slate-300 mt-2">
                  "sir aaj ramesh fever ke wajah se duty nahi aaya"
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 relative">
                <span className="absolute top-3 right-3 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  AI Output (Elite Professional English)
                </span>
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line font-mono leading-relaxed">
                  {`Good Morning Sir,

Mr. Ramesh is absent today due to health issues.

Kindly note the same. 

Regards,
Security Team`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Features Tailored For Field Operations
          </h2>
          <p className={`max-w-2xl mx-auto ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Every operational scenario is built into specialized templates to make log keeping and handovers effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className={`p-6 rounded-2xl border transition hover:shadow-lg ${darkMode ? "bg-slate-900/30 border-slate-900 hover:bg-slate-900/50" : "bg-white border-slate-100 hover:bg-slate-100/40"}`}>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-lg mb-2">Multilingual Converter</h4>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Translates and reformats messages instantly from Hinglish, Odia, Hindi, and several Indian local contexts into security & corporate styles.
            </p>
          </div>

          {/* Feature 2 */}
          <div className={`p-6 rounded-2xl border transition hover:shadow-lg ${darkMode ? "bg-slate-900/30 border-slate-900 hover:bg-slate-900/50" : "bg-white border-slate-100 hover:bg-slate-100/40"}`}>
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-4">
              <FileCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-lg mb-2">Report Generators</h4>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Comprehensive wizard tools generate immaculate Incident Log, Shift Handover records, Attendance summaries, and Visitor registers instantly.
            </p>
          </div>

          {/* Feature 3 */}
          <div className={`p-6 rounded-2xl border transition hover:shadow-lg ${darkMode ? "bg-slate-900/30 border-slate-900 hover:bg-slate-900/50" : "bg-white border-slate-100 hover:bg-slate-100/40"}`}>
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-4">
              <Mic className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-lg mb-2">Voice Recognition (Speech to Text)</h4>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Simply tap and dictate in Hindi, Odia, or broken English. The app captures voice inputs and directly sends them to our AI translator.
            </p>
          </div>

          {/* Feature 4 */}
          <div className={`p-6 rounded-2xl border transition hover:shadow-lg ${darkMode ? "bg-slate-900/30 border-slate-900 hover:bg-slate-900/50" : "bg-white border-slate-100 hover:bg-slate-100/40"}`}>
            <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-lg mb-2">PDF Document Export</h4>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Download summaries directly as structured PDF logs with clean formatting ready to email to clients or file in management archives.
            </p>
          </div>

          {/* Feature 5 */}
          <div className={`p-6 rounded-2xl border transition hover:shadow-lg ${darkMode ? "bg-slate-900/30 border-slate-900 hover:bg-slate-900/50" : "bg-white border-slate-100 hover:bg-slate-100/40"}`}>
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <Copy className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-lg mb-2">One-Click Clipboard copy</h4>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              No tiresome manual selections. Tap the single copy button to save elite texts for immediate posting to WhatsApp groups.
            </p>
          </div>

          {/* Feature 6 */}
          <div className={`p-6 rounded-2xl border transition hover:shadow-lg ${darkMode ? "bg-slate-900/30 border-slate-900 hover:bg-slate-900/50" : "bg-white border-slate-100 hover:bg-slate-100/40"}`}>
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-lg mb-2">Favorites & Saved Archives</h4>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Store important reports and bookmark standard repetitive drafts so you can reuse them every single day.
            </p>
          </div>
        </div>
      </section>

      {/* Core Pricing Plans */}
      <section id="pricing" className="py-20 bg-slate-900/10 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Pricing Plans Designed For All</h2>
            <p className={`max-w-xl mx-auto ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Unlock the massive benefits of Guard English AI to project total professionalism at the workplace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className={`p-8 rounded-3xl border ${darkMode ? "bg-slate-950 border-slate-900" : "bg-white border-slate-200"} space-y-6 flex flex-col justify-between`}>
              <div>
                <h4 className="text-xl font-bold text-slate-500">Free Tier</h4>
                <div className="text-4xl font-extrabold mt-4">
                  $0 <span className="text-sm font-normal text-slate-400">/ forever</span>
                </div>
                <p className="text-sm mt-2 text-slate-400">Perfect for getting started and occasional message checks.</p>
                <div className="border-t dark:border-slate-800 my-6"></div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">✓</span> 5 generations per day
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">✓</span> English translation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">✓</span> Standard reporting templates
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 dark:text-slate-600">
                    ✕ Unlimited generations
                  </li>
                </ul>
              </div>
              <button onClick={onStartFree} className="w-full mt-6 py-3 px-4 bg-slate-200 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-800 transition">
                Start Free
              </button>
            </div>

            {/* Premium Plan */}
            <div className={`p-8 rounded-3xl border-2 border-indigo-600 bg-white dark:bg-slate-950 relative space-y-6 flex flex-col justify-between shadow-xl`}>
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
              <div>
                <h4 className="text-xl font-bold text-indigo-600">Enterprise Standard (Premium)</h4>
                <div className="text-4xl font-extrabold mt-4">
                  $4.99 <span className="text-sm font-normal text-slate-400">/ month</span>
                </div>
                <p className="text-sm mt-2 text-slate-400">Special rate crafted to support our hard-working officers.</p>
                <div className="border-t dark:border-slate-800 my-6"></div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">✓</span> <strong>{t.unlimited}</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">✓</span> <strong>{t.fasterAi}</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">✓</span> <strong>{t.advancedTemplates}</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">✓</span> <strong>{t.prioritySupport}</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">✓</span> Unlimited direct conversions on WhatsApp formats
                  </li>
                </ul>
              </div>
              <button onClick={onStartFree} className="w-full mt-6 py-3 px-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/35">
                Go Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
          <p className={darkMode ? "text-slate-400" : "text-slate-600"}>
            Everything you need to know to get started with translating reports.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Does Guard English AI understand Hindi and Odia natively?",
              a: "Yes! Guard English AI is powered by z-ai/glm-4.5-air:free which natively translates Hindi, Odia, Bengali, Tamil, Telugu, and Hinglish messages into extremely professional, error-free corporate English logs in real time."
            },
            {
              q: "Can I use it on my mobile phone at the site?",
              a: "Absolutely. Guard English AI is fully responsive & optimized for mobile browsers. You can dictate using your microphone directly at your patrol post or supervisor desk."
            },
            {
              q: "How does the PDF export feature work?",
              a: "Once you input your report specifics, our system processes and displays the clean output. Press the 'Download PDF' button and a professional PDF with formal headers, date records, and formatting is downloaded instantly to your device."
            },
            {
              q: "Is my personal log history safe?",
              a: "Security is our highest priority. All generated log logs and user records are safely stored on the Firebase Auth & Realtime Database and are totally invisible to others."
            }
          ].map((item, idx) => (
            <div key={idx} className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-900/20 border-slate-900" : "bg-white border-slate-200"}`}>
              <h5 className="font-bold text-base flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                {item.q}
              </h5>
              <p className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-slate-600"} pl-7`}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Details */}
      <footer className={`py-12 border-t transition-colors ${darkMode ? "bg-slate-950 border-slate-900 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-indigo-600">
            <Shield className="w-5 h-5" />
            <span className="font-bold text-slate-800 dark:text-slate-200">GUARD ENGLISH AI</span>
          </div>
          <p className="text-sm max-w-sm mx-auto">
            Providing modern AI reporting tools for security squads and service professionals globally.
          </p>
          <div className="flex items-center justify-center gap-3 text-xs">
            <span>Developer: <strong>Bikash Bindhani</strong></span>
            <span>•</span>
            <a href="https://www.instagram.com/_noirvex1" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline inline-flex items-center gap-1">
              Instagram <Instagram className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-xs pt-4">
            &copy; {new Date().getFullYear()} Guard English AI. {t.allRightsReserved}
          </p>
        </div>
      </footer>
    </div>
  );
}
