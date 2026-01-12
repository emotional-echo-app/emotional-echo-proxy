// server.cjs  (FULL REPLACE FILE)
// Emotional Echo Proxy — /analyze + /rewrite
// Requires env: OPENAI_API_KEY (optional if USE_AI=false), USE_AI=true/false, PORT (Render sets PORT)

const express = require("express");
const cors = require("cors");

// Node 18+ has global fetch. (Render uses Node 22). No node-fetch needed.
require("dotenv").config();

const app = express();

// --- CORS (allow extension + browsers) ---
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 10000;
const USE_AI = String(process.env.USE_AI || "false").toLowerCase() === "true";

// Accept either OPENAI_API_KEY or OPENAI_API_KEY (your older naming sometimes varied)
const OPENAI_KEY =
  process.env.OPENAI_API_KEY ||
  process.env.OPENAI_APIKEY ||
  process.env.OPENAI_KEY ||
  process.env.OPENAI_API_KEY;

// ----------------- Helpers -----------------
function safeJson(res, status, obj) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(obj));
}

function localAnalyze(text) {
  const lower = (text || "").toLowerCase();

  const threatPhrases = [
    "there will be trouble",
    "there will be consequences",
    "or else",
    "you will regret",
    "there will be a problem",
  ];

  const urgencyWords = ["right now", "immediately", "asap", "now", "must", "overdue"];

  const hasThreat = threatPhrases.some((p) => lower.includes(p));
  const hasUrgency = urgencyWords.some((w) => lower.includes(w));

  if (hasThreat) {
    return {
      tone: "Aggressive",
      score: 40,
      suggestion:
        "Message contains an implied or explicit threat. High risk — soften language immediately.",
    };
  }

  if (hasUrgency) {
    return {
      tone: "Risky",
      score: 65,
      suggestion: "Urgency detected. Consider softening timing language.",
    };
  }

  return {
    tone: "Neutral",
    score: 85,
    suggestion: "Tone is balanced.",
  };
}

function localSafeRewrite(text) {
  let t = text || "";

  // Remove/soften threats
  t = t.replace(/there will be trouble/gi, "I’m concerned this may cause issues");
  t = t.replace(/there will be consequences/gi, "this could have an impact");
  t = t.replace(/or else/gi, "");
  t = t.replace(/you will regret/gi, "I’d really appreciate your help");
  t = t.replace(/there will be a problem/gi, "it may create a problem");

  // Soften urgency
  t = t.replace(/right now/gi, "as soon as you can");
  t = t.replace(/immediately/gi, "as soon as possible");
  t = t.replace(/\basap\b/gi, "as soon as possible");

  // Add polite framing
  if (!/please/i.test(t)) t = "Please " + t;
  t = t.trim();
  if (!/[.!?]$/.test(t)) t += ".";
  return t;
}

async function callOpenAI({ prompt, system, maxTokens = 250 }) {
  if (!OPENAI_KEY) throw new Error("Missing OPENAI_API_KEY");

  // Using Chat Completions (works with your existing setup)
  const payload = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
  };

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await r.json();
  if (!r.ok) {
    const msg = data?.error?.message || "OpenAI request failed";
    const code = data?.error?.code;
    const type = data?.error?.type;
    const status = data?.error?.status || r.status;
    const err = new Error(msg);
    err.meta = { code, type, status, raw: data };
    throw err;
  }

  return data?.choices?.[0]?.message?.content || "";
}

// ----------------- Routes -----------------
app.get("/", (req, res) => {
  safeJson(res, 200, {
    service: "Emotional Echo Proxy",
    status: "running",
    use_ai: USE_AI,
    endpoints: ["POST /analyze", "POST /rewrite", "GET /health"],
  });
});

app.get("/health", (req, res) => {
  safeJson(res, 200, { ok: true, ts: new Date().toISOString() });
});

// Analyze: always returns local result; if USE_AI true, suggestion may be improved
app.post("/analyze", async (req, res) => {
  const text = (req.body?.text || "").trim();
  if (!text) return safeJson(res, 400, { error: "No text provided" });

  const base = localAnalyze(text);

  // If AI disabled -> return local immediately
  if (!USE_AI) return safeJson(res, 200, base);

  try {
    const system =
      "You are a tone analysis assistant for email drafts. Return ONLY strict JSON: " +
      "{tone:string, score:number, suggestion:string}. " +
      "Keep suggestion short and actionable. If you are unsure, still return valid JSON.";

    const prompt = `Analyze this email draft:\n\n${text}\n\nReturn JSON only.`;

    const content = await callOpenAI({ prompt, system, maxTokens: 180 });

    // Try parse AI JSON safely
    let ai;
    try {
      ai = JSON.parse(content);
    } catch {
      // If AI returns non-json, ignore AI
      return safeJson(res, 200, base);
    }

    // We DO NOT allow AI to increase risk score; we keep local as authoritative
    const merged = {
      tone: base.tone,
      score: base.score,
      suggestion:
        typeof ai?.suggestion === "string" && ai.suggestion.trim()
          ? ai.suggestion.trim()
          : base.suggestion,
    };

    return safeJson(res, 200, merged);
  } catch (err) {
    // Silent fallback to local
    return safeJson(res, 200, base);
  }
});

// Rewrite: returns a safer rewrite. Local always works, AI optional enhancement.
app.post("/rewrite", async (req, res) => {
  const text = (req.body?.text || "").trim();
  const goal =
    (req.body?.goal || "").trim() ||
    "Rewrite this email to be polite, professional, and non-threatening while keeping the same request. Keep it short.";

  if (!text) return safeJson(res, 400, { error: "No text provided" });

  const local = localSafeRewrite(text);

  // AI disabled -> return local rewrite
  if (!USE_AI) return safeJson(res, 200, { rewrite: local, mode: "local" });

  try {
    const system =
      "You rewrite email drafts to be polite, professional, and non-threatening. " +
      "Preserve the user's intent. Keep it short. Return ONLY strict JSON: {rewrite:string}.";

    const prompt = `GOAL: ${goal}\n\nTEXT:\n${text}\n\nReturn JSON only.`;

    const content = await callOpenAI({ prompt, system, maxTokens: 220 });

    let ai;
    try {
      ai = JSON.parse(content);
    } catch {
      return safeJson(res, 200, { rewrite: local, mode: "local-fallback" });
    }

    const rewrite =
      typeof ai?.rewrite === "string" && ai.rewrite.trim()
        ? ai.rewrite.trim()
        : local;

    return safeJson(res, 200, { rewrite, mode: "ai" });
  } catch (err) {
    return safeJson(res, 200, { rewrite: local, mode: "local-fallback" });
  }
});

// Render port binding
app.listen(PORT, () => {
  console.log("Emotional Echo server running on port", PORT, "| USE_AI=", USE_AI);
});
