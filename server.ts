/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// In-memory analytics counter for admin dashboard
let apiRequestCount = 0;
let totalTokensUsed = 0;
let defaultModel = "z-ai/glm-4.5-air:free";
let openRouterApiKey = process.env.OPENROUTER_API_KEY || "";

const DB_URL = "https://security-guard-91aff-default-rtdb.firebaseio.com";

// Helper for fetch with custom timeout to prevent backend routing lockups
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs: number = 2000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Synchronize system settings from Firebase REST URL with a short, resilient timeout
async function fetchSystemSettings() {
  try {
    const res = await fetchWithTimeout(`${DB_URL}/system/settings.json`, {}, 1200);
    if (res.ok) {
      const data = await res.json();
      if (data) {
        if (data.modelId) defaultModel = data.modelId;
        if (data.openRouterApiKey !== undefined) openRouterApiKey = data.openRouterApiKey;
        console.log(`[Firebase Sync] Synchronized model: ${defaultModel}`);
        return data;
      }
    }
  } catch (err: any) {
    console.warn("Firebase REST Sync Error (falling back to memory):", err?.message || err);
  }
  return null;
}

// Middleware for rate limits and security helpers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// App endpoint for system information & stats
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: Date.now() });
});

// App endpoint for dynamic safe configuration
app.get("/api/config", (req, res) => {
  res.json({
    adminEmail: process.env.ADMIN_EMAIL || "bindhanibikash71@gmail.com"
  });
});

// Get AI Analytics Stats for Admin Panel
app.get("/api/admin/stats", async (req, res) => {
  await fetchSystemSettings();
  const estimatedCost = (totalTokensUsed / 1000000) * 0.05; // openrouter estimate
  res.json({
    totalRequests: apiRequestCount,
    totalTokens: totalTokensUsed,
    estimatedCost: parseFloat(estimatedCost.toFixed(5)),
    currentModel: defaultModel,
    hasOpenRouterKey: !!openRouterApiKey,
  });
});

// Admin endpoint to override settings and save to Firebase Realtime Database
app.post("/api/admin/settings", async (req, res) => {
  const { model, apiKey, instagramId, telegramGroupLink, announcement, freeDailyLimit, premiumDailyLimit } = req.body;
  
  if (model) defaultModel = model;
  if (apiKey !== undefined) openRouterApiKey = apiKey;

  try {
    const backupRes = await fetchWithTimeout(`${DB_URL}/system/settings.json`, {}, 2000);
    let currentData = {};
    if (backupRes.ok) {
      currentData = (await backupRes.json()) || {};
    }
    const merged = {
      ...currentData,
      modelId: defaultModel,
      openRouterApiKey: openRouterApiKey,
      ...(instagramId !== undefined && { instagramId }),
      ...(telegramGroupLink !== undefined && { telegramGroupLink }),
      ...(announcement !== undefined && { announcement }),
      ...(freeDailyLimit !== undefined && { freeDailyLimit }),
      ...(premiumDailyLimit !== undefined && { premiumDailyLimit }),
      updatedAt: Date.now()
    };
    await fetchWithTimeout(`${DB_URL}/system/settings.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged)
    }, 2500);
    console.log("[Firebase Write] Configuration saved persistently!");
  } catch (err: any) {
    console.warn("Firebase settings put failure (timeout/offline):", err?.message || err);
  }

  res.json({ success: true, model: defaultModel, hasKey: !!openRouterApiKey });
});

// Principal translation endpoint supporting OpenRouter exclusively
app.post("/api/ai/convert", async (req, res) => {
  const { text, type, format, customModel, customApiKey } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Input text is required" });
  }

  apiRequestCount++;

  // Sync settings first to use stored database keys/models if not passed on request
  const storedConfig = await fetchSystemSettings();
  const selectedModel = customModel || (storedConfig && storedConfig.modelId) || defaultModel;
  const selectedKey = customApiKey || (storedConfig && storedConfig.openRouterApiKey) || openRouterApiKey || process.env.OPENROUTER_API_KEY || "";

  // Structure system prompt based on security format, casual layout or specific form types.
  let systemPrompt = "";
  if (format === "casual") {
    systemPrompt = `You are a friendly, natural English conversational assistant for security guard staff, operations supervisors, and onsite employees.
Convert the client's local language message (which may be in Hinglish, Hindi, Odia, Bengali, Tamil, Telugu, or broken English) into natural, polite, clear, and casual everyday Conversational English. This message is intended for friendly chat messages (e.g. WhatsApp chats, personal team updates, or quick conversational chats with residents, clients, or coworkers). Keep the sentence structure grammatically perfect and highly natural, but friendly and casual.

Output ONLY the final translated friendly English message ready to copy. Do not write any explanations, preambles, or intro notes.`;
  } else {
    systemPrompt = `You are a professional English writing assistant for security guards, supervisors, facility managers, site managers, and field staff.
Convert the client's local language message (which may be in Hinglish, Hindi, Odia, Bengali, Tamil, Telugu, or simple broken English) into professional, elite, clear, and perfectly structured workplace English suitable for sharing in WhatsApp groups, formal employee logs, or sending to management/clients.

Context: 
- Document/Communication Type: ${type || "General Converter"}
- Tone & Sizing: ${format === "corporate" ? "Formal Elite Corporate Format" : "Standard Security & Operations Industry Format"}

Always maintain:
- Extremely Professional Tone
- Immaculate English Grammar and spelling
- Respectful Workplace Language
- Standard spacing, greeting and closing format when appropriate

Output ONLY the final converted message ready to copy and paste. Do not write any explanations, preambles, intros, or notes like "Here is your output". Return ONLY the corrected elegant workplace English.`;
  }

  // Determine key & model to use
  const modelToUse = modelToUseValue(selectedModel);
  const apiKeyToUse = selectedKey;

  function modelToUseValue(model: string) {
    return model && model.trim() !== "" ? model : "z-ai/glm-4.5-air:free";
  }

  if (!apiKeyToUse || apiKeyToUse.trim() === "") {
    return res.json({
      success: false,
      error: "OpenRouter API Key has not been configured in setting panel or environment variables.",
      result: `[System Setup Requested]
Please provide an OpenRouter API Key in the System Administration Panel to enable English writing translation features.`
    });
  }

  try {
    console.log(`Using OpenRouter API with model ${modelToUse}...`);
    const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKeyToUse}`,
        "HTTP-Referer": "https://guard-english-ai.com",
        "X-Title": "Guard English AI",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.7,
      }),
    }, 15000);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const outputText = data.choices?.[0]?.message?.content;
    
    // Update token usage counts roughly
    const promptTokens = Math.ceil(systemPrompt.length / 4);
    const completionTokens = Math.ceil((outputText || "").length / 4);
    totalTokensUsed += (promptTokens + completionTokens);

    if (outputText) {
      return res.json({
        success: true,
        provider: "openrouter",
        model: modelToUse,
        result: outputText.trim(),
      });
    } else {
      throw new Error("Empty response received from OpenRouter API.");
    }
  } catch (e: any) {
    console.error("OpenRouter request failed:", e.message);
    return res.status(500).json({
      error: "OpenRouter API request failed. Please check your API key, query model, or panel settings.",
      details: e.message,
    });
  }
});

// Configure Vite middleware or serve static static build
async function setupVite() {
  const distPath = path.join(process.cwd(), "dist");
  // Check if we are running in production mode (production env or running compiled server inside dist)
  const isProductionMode = 
    process.env.NODE_ENV === "production" || 
    __dirname.endsWith("dist") || 
    __dirname.includes("dist");

  if (!isProductionMode) {
    console.log("Extending dev environment with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production build from dist...");
    let resolvedDistPath = distPath;
    if (__dirname.endsWith("dist") || __dirname.includes("dist")) {
      resolvedDistPath = __dirname;
    }
    app.use(express.static(resolvedDistPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(resolvedDistPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Guard English AI server running on http://localhost:${PORT}`);
  });
}

setupVite().catch((error) => {
  console.error("Vite setup failed", error);
});
