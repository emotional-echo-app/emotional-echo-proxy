const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const USE_AI = process.env.USE_AI === "true";
const OPENAI_KEY = process.env.OPENAI_API_KEY;

/**
 * HEALTH CHECK
 */
app.get("/health", (req, res) => {
  res.json({
    service: "Emotional Echo Proxy",
    status: "running",
    aiEnabled: USE_AI
  });
});

/**
 * ANALYZE ENDPOINT
 */
app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.json({
      score: 0,
      suggestions: ["Please enter some text to analyze"]
    });
  }

  // 🔹 FALLBACK MODE (NO AI / FREE MODE)
  if (!USE_AI || !OPENAI_KEY) {
    return res.json({
      score: 55,
      suggestions: [
        "Acknowledge emotions clearly",
        "Balance honesty with professionalism",
        "End the message confidently"
      ]
    });
  }

  // 🔹 AI MODE
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You analyze emotional tone. Respond ONLY with valid JSON in this format: {\"score\": number, \"suggestions\": [string]}"
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 150
      })
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;

    if (!raw) {
      throw new Error("Empty AI response");
    }

    const parsed = JSON.parse(raw);

    res.json({
      score: parsed.score ?? 50,
      suggestions: parsed.suggestions ?? ["No suggestions returned"]
    });
  } catch (err) {
    console.error("AI ERROR:", err);

    // SAFE FAIL (never break UI)
    res.json({
      score: 50,
      suggestions: [
        "AI service unavailable",
        "Try again later",
        "Message tone appears neutral"
      ]
    });
  }
});

/**
 * ROOT
 */
app.get("/", (req, res) => {
  res.json({
    service: "Emotional Echo Proxy",
    status: "online"
  });
});

app.listen(PORT, () => {
  console.log(`Emotional Echo Proxy running on port ${PORT}`);
});
