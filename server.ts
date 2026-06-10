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
let defaultModel = "openai/gpt-oss-20b:free";
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
        if (data.modelId) {
          const mId = data.modelId.trim();
          if (mId.toLowerCase().includes("glm-4.5-air")) {
            defaultModel = "openai/gpt-oss-20b:free";
          } else {
            defaultModel = mId;
          }
        }
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
    if (!model || model.trim() === "") {
      return "openai/gpt-oss-20b:free";
    }
    const cleaned = model.trim();
    if (cleaned.toLowerCase().includes("glm-4.5-air")) {
      return "openai/gpt-oss-20b:free";
    }
    return cleaned;
  }

  if (!apiKeyToUse || apiKeyToUse.trim() === "") {
    return res.json({
      success: false,
      error: "OpenRouter API Key has not been configured in setting panel or environment variables.",
      result: `[System Setup Requested]
Please provide an OpenRouter API Key in the System Administration Panel to enable English writing translation features.`
    });
  }

  // Multi-tier reliable OpenRouter fallback list to handle invalid or offline models seamlessly.
  const modelsToTry = [modelToUse];
  const commonFreeFallbacks = [
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "nvidia/llama-nemotron-rerank-vl-1b-v2:free",
    "nvidia/nemotron-3.5-content-safety:free",
    "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    "nex-agi/nex-n2-pro:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "poolside/laguna-xs.2:free",
    "poolside/laguna-m.1:free",
    "google/gemma-4-26b-a4b-it:free",
    "google/gemma-4-31b-it:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
    "openai/gpt-oss-120b:free",
    "openai/gpt-oss-20b:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "qwen/qwen3-coder:free",
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3-8b-instruct:free",
    "qwen/qwen-2.5-7b-instruct:free"
  ];

  for (const fallback of commonFreeFallbacks) {
    if (!modelsToTry.includes(fallback)) {
      modelsToTry.push(fallback);
    }
  }

  let lastErrorMsg = "";
  let finalResultData = null;
  let successfulModel = "";

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModelId = modelsToTry[i];
    try {
      console.log(`[OpenRouter Attempt ${i + 1}/${modelsToTry.length}] Querying model: ${currentModelId}...`);
      const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKeyToUse}`,
          "HTTP-Referer": "https://guard-english-ai.com",
          "X-Title": "Guard English AI",
        },
        body: JSON.stringify({
          model: currentModelId,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          temperature: 0.7,
        }),
      }, 15000);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const outputText = data.choices?.[0]?.message?.content;
      if (outputText) {
        finalResultData = outputText.trim();
        successfulModel = currentModelId;
        break; // Succeeded! Break loop.
      } else {
        throw new Error("Empty response payload choices structure.");
      }
    } catch (err: any) {
      console.warn(`[OpenRouter Attempt ${i + 1} Failed] Model ${currentModelId} failed:`, err.message || err);
      lastErrorMsg = err.message || JSON.stringify(err);
      // Fall through to try the next model in the chain
    }
  }

  if (finalResultData && successfulModel) {
    // Update token usage counts roughly
    const promptTokens = Math.ceil(systemPrompt.length / 4);
    const completionTokens = Math.ceil(finalResultData.length / 4);
    totalTokensUsed += (promptTokens + completionTokens);

    // Automatically make the successful working model the active defaultModel
    if (successfulModel !== modelToUse) {
      console.log(`[Auto-Switch] Activating working model fallback: ${successfulModel}`);
      defaultModel = successfulModel;
      
      // Attempt to persist the active working model to Firebase Realtime Database
      try {
        const backupRes = await fetchWithTimeout(`${DB_URL}/system/settings.json`, {}, 2000);
        let currentData = {};
        if (backupRes.ok) {
          currentData = (await backupRes.json()) || {};
        }
        const merged = {
          ...currentData,
          modelId: successfulModel,
          updatedAt: Date.now()
        };
        await fetchWithTimeout(`${DB_URL}/system/settings.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(merged)
        }, 1500);
      } catch (e: any) {
        console.warn("Could not save auto-switched active model to Firebase, kept in-memory:", e?.message);
      }
    }

    return res.json({
      success: true,
      provider: "openrouter",
      model: successfulModel,
      requestedModel: modelToUse,
      result: finalResultData,
    });
  } else {
    console.error("All fallback models exhausted. OpenRouter compilation failed completely.", lastErrorMsg);
    return res.status(500).json({
      error: "OpenRouter API request failed. Please check your API key, query model, or panel settings.",
      details: lastErrorMsg,
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
    
    // Serve static files
    app.use(express.static(resolvedDistPath));
    
    // Prevent serving index.html for missing assets
    app.use("/assets", (req, res) => {
      res.status(404).send("Asset not found");
    });
    
    // SPA fallback for HTML routes
    app.get("*", (req, res) => {
      const isPHPAdmin = req.path === "/admin.php" || req.path.endsWith("/admin.php");
      if ((req.path.includes(".") && !isPHPAdmin) || req.path.startsWith("/api/")) {
        return res.status(404).send("Not Found");
      }
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
