import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const USE_AI = process.env.USE_AI === "true";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Health check
 */
app.get("/", (req, res) => {
  res.json({ ok: true, ai_enabled: USE_AI });
});

/**
 * Analyze endpoint
 */
app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Invalid input" });
    }

    // 🔁 FALLBACK RESPONSE (always works)
    const fallbackResponse = {
      score: Math.min(100, Math.max(0, text.length % 100)),
      suggestions: [
        "Acknowledge emotion clearly",
        "Keep tone supportive",
        "End with confidence"
      ],
      source: "fallback"
    };

    // 🚦 AI TOGGLE OFF
    if (!USE_AI || !OPENAI_API_KEY) {
      return res.json(fallbackResponse);
    }

    // 🤖 AI MODE
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You analyze emotional tone. Respond ONLY with valid JSON: { score: number, suggestions: string[] }"
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.2
      })
    });

    const data = await aiResponse.json();

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return res.json(fallbackResponse);
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.json(fallbackResponse);
    }

    res.json({
      score: parsed.score ?? fallbackResponse.score,
      suggestions: parsed.suggestions ?? fallbackResponse.suggestions,
      source: "ai"
    });

  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Emotional Echo Proxy running on port ${PORT}`);
});
