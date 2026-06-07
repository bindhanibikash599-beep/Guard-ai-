/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDYwnuQSZXkzcihYMl6idlwHHRXjXqhU_s",
  authDomain: "security-guard-91aff.firebaseapp.com",
  databaseURL: "https://security-guard-91aff-default-rtdb.firebaseio.com",
  projectId: "security-guard-91aff",
  storageBucket: "security-guard-91aff.firebasestorage.app",
  messagingSenderId: "492756741883",
  appId: "1:492756741883:web:b287dfcac8d94abeef0a5e",
  measurementId: "G-6XXPH9C3RK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

// Google Auth Popup Helper
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google login failed", error);
    throw error;
  }
};

export const handleLogout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-out failed", error);
  }
};
