// server.cjs
const express = require("express");
const cors = require("cors");

// If you're using node-fetch v2 (recommended for CJS):
const fetch = require("node-fetch");

// ---- App ----
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ---- Config ----
const USE_AI = String(process.env.USE_AI || "false").toLowerCase() === "true";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ---- Local fallback rewrite ----
function localRewrite(text) {
  // Minimal “soften” rewrite
  // You can expand this later
  const t = String(text || "").trim();
  if (!t) return "Please share the email text you want to rewrite.";

  // Quick softening patterns
  let out = t;

  out = out.replace(/\bright now\b/gi, "as soon as you can");
  out = out.replace(/\bimmediately\b/gi, "as soon as possible");
  out = out.replace(/\bor there will be trouble\b/gi, "as I’m concerned this may cause issues");
  out = out.replace(/\bor there will be consequences\b/gi, "as I’m concerned this may cause issues");
  out = out.replace(/\bor else\b/gi, "as I’m concerned this may cause issues");

  // If no change happened, add polite framing
  if (out === t) {
    out = `Please could you help with this when you can? ${t}`;
  } else {
    // Add a polite opener if it starts harshly
    if (!/^please\b/i.test(out)) out = `Please ${out}`;
  }

  // Clean double spaces
  out = out.replace(/\s{2,}/g, " ").trim();
  return out;
}

// ---- OpenAI rewrite ----
async function aiRewrite(text) {
  const payload = {
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "Rewrite the user's text to be professional, polite, and clear while keeping the meaning. Return ONLY the rewritten text (no quotes, no extra commentary).",
      },
      { role: "user", content: text },
    ],
    max_tokens: 200,
    temperature: 0.4,
  };

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await r.text();

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`OpenAI returned non-JSON: ${raw.slice(0, 200)}`);
  }

  if (!r.ok) {
    const msg = data?.error?.message || `HTTP ${r.status}`;
    throw new Error(`OpenAI error: ${msg}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("OpenAI returned empty content");
  }

  return content.trim();
}

// ---- Routes ----
app.get("/", (req, res) => {
  res.json({ service: "Emotional Echo Proxy", status: "running" });
});

app.get("/healthz", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Lets you verify env without looking at Render UI
app.get("/config", (req, res) => {
  res.json({
    ok: true,
    use_ai: USE_AI,
    has_key: Boolean(OPENAI_API_KEY),
    model: MODEL,
  });
});

// Rewrite endpoint (AI + failsafe)
app.post("/rewrite", async (req, res) => {
  const text = String(req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "No text provided" });

  // Always have a local rewrite ready
  const fallback = localRewrite(text);

  // If AI disabled, return fallback
  if (!USE_AI) {
    return res.json({ rewrite: fallback, mode: "local-fallback", ai_error: "USE_AI=false" });
  }

  // If AI enabled but no key
  if (!OPENAI_API_KEY) {
    return res.json({
      rewrite: fallback,
      mode: "local-fallback",
      ai_error: "Missing OPENAI_API_KEY",
    });
  }

  try {
    const rewritten = await aiRewrite(text);
    return res.json({ rewrite: rewritten, mode: "ai" });
  } catch (e) {
    return res.json({
      rewrite: fallback,
      mode: "local-fallback",
      ai_error: String(e?.message || e),
    });
  }
});

// (Optional) Analyze endpoint if you still use it
app.post("/analyze", async (req, res) => {
  const text = String(req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "No text provided" });

  // Keep your old behavior if needed; for now just confirm server is alive
  res.json({ ok: true, received: text.length });
});

// ---- Start ----
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Emotional Echo server running on port", PORT));
