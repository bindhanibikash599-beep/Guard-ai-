/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "user" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  blocked?: boolean;
  createdAt: number;
  plan?: "free" | "premium";
  phoneNumber?: string;
  designation?: string;
}

export type ReportType = 
  | "conv" 
  | "attendance" 
  | "incident" 
  | "leave" 
  | "late" 
  | "visitor" 
  | "handover" 
  | "dailylog";

export interface GeneratedReport {
  id: string;
  uid: string;
  title: string;
  type: ReportType;
  originalInput: string;
  formattedOutput: string;
  favorite: boolean;
  createdAt: number;
  // Dynamic fields saved
  fields?: Record<string, string>;
}

export type AppUiLang = "en" | "hi" | "or";

export interface AdminSystemSettings {
  aiModel: string;
  openRouterApiKey: string;
  featuresEnabled: {
    unlimited: boolean;
    voiceToText: boolean;
    pdfExport: boolean;
  };
}

export interface AdminAnalytics {
  totalRequests: number;
  totalTokens: number;
  estimatedCost: number;
}
