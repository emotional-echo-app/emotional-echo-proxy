const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const USE_AI = process.env.USE_AI === "true";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/* Health check */
app.get("/", (req, res) => {
  res.json({ ok: true, service: "Emotional Echo Proxy", ai: USE_AI });
});

/* Analyze endpoint */
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.json({ score: 0, suggestions: ["No text provided"] });
    }

    /* ---- AI OFF (safe fallback) ---- */
    if (!USE_AI) {
      return res.json({
        score: Math.min(100, Math.max(0, text.length)),
        suggestions: [
          "Acknowledge emotions",
          "Balance tone",
          "End confidently"
        ]
      });
    }

    /* ---- AI ON ---- */
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You analyze the emotional tone of text. Respond ONLY with valid JSON."
          },
          {
            role: "user",
            content: `Analyze this text and return JSON in this format:
{
  "score": number between 0 and 100,
  "suggestions": ["string", "string", "string"]
}

Text:
${text}`
          }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: "Invalid AI response" });
    }

    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Emotional Echo Proxy running on port ${PORT}`);
});
