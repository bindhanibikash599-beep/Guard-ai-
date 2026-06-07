/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, signInWithGoogle, rtdb } from "../firebase";
import { Shield, Mail, Lock, User, LogIn, UserPlus, Sparkles } from "lucide-react";
import { locales } from "../locale";

interface LoginRegisterProps {
  onSuccess: () => void;
  onBackToLanding: () => void;
  lang: "en" | "hi" | "or";
  darkMode: boolean;
  adminEmail: string;
}

export default function LoginRegister({ onSuccess, onBackToLanding, lang, darkMode, adminEmail }: LoginRegisterProps) {
  const t = locales[lang];
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Sign Up / Register
        if (!displayName) {
          throw new Error("Please enter your Full Name");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Set user profile
        await updateProfile(user, { displayName });

        // Seed to RTDB Realtime Database
        await set(ref(rtdb, `users/${user.uid}`), {
          uid: user.uid,
          email: user.email,
          displayName,
          role: "user",
          plan: "free",
          createdAt: Date.now()
        });
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An authentication error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      
      // Seed user record on Google login if it doesn't already exist.
      await set(ref(rtdb, `users/${user.uid}`), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "Google Officer",
        role: user.email === adminEmail ? "admin" : "user", // Dynamic Admin email bootstrap
        plan: "free",
        createdAt: Date.now()
      });

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google authentications failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button 
          onClick={onBackToLanding}
          className="mx-auto flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-indigo-500 mb-6 transition"
        >
          ← Go Back Home
        </button>

        <div className="flex items-center justify-center gap-2">
          <img
            src="https://fat-azure-kkcyikqe.edgeone.app/file_00000000f60071fab8c19be6b3db0ab7.png"
            alt="Guard AI Logo"
            className="w-12 h-12 object-contain rounded-2xl"
            referrerPolicy="no-referrer"
          />
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-500 to-sky-400 bg-clip-text text-transparent">
            GUARD ENGLISH AI
          </span>
        </div>

        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight">
          {isLogin ? `${t.login}` : `${t.register}`}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Simplify your security operations reports
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`py-8 px-4 border shadow-xl rounded-3xl sm:px-10 ${darkMode ? "bg-slate-900/60 border-slate-900" : "bg-white border-slate-200"}`}>
          {error && (
            <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-xl whitespace-pre-wrap leading-relaxed">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Full Name
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="s-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className={`block w-full pl-10 pr-3 py-3 border text-sm rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                {t.email}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="s-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={`block w-full pl-10 pr-3 py-3 border text-sm rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                {t.password}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="s-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-3 py-3 border text-sm rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition focus:outline-none disabled:opacity-50"
              >
                {loading ? "Please wait..." : isLogin ? (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    {t.register}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-extrabold">
                <span className={`px-2 ${darkMode ? "bg-slate-900 text-slate-500" : "bg-white text-slate-500"}`}>
                  Or Continue With
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-bold transition focus:outline-none disabled:opacity-50 ${darkMode ? "bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-200" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"}`}
              >
                <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign In with Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-indigo-500 hover:underline transition"
            >
              {isLogin ? "Need an account? Sign Up Free" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
