const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const USE_AI = process.env.USE_AI === "true";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// Health check
app.get("/", (req, res) => {
  res.json({ service: "Emotional Echo Proxy", status: "running" });
});

app.post("/analyze", async (req, res) => {
  const text = (req.body.text || "").trim();

  if (!text) {
    return res.json({
      score: 0,
      suggestions: ["No text provided"]
    });
  }

  // 🔹 FALLBACK MODE (always works)
  if (!USE_AI || !OPENAI_API_KEY) {
    return res.json({
      score: 55,
      suggestions: [
        "Acknowledge emotions",
        "Balance tone",
        "End confidently"
      ]
    });
  }

  // 🔹 AI MODE
  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
              "You analyze emotional tone. Respond ONLY in JSON with keys score (0-100) and suggestions (array of strings)."
          },
          { role: "user", content: text }
        ],
        temperature: 0.3
      })
    });

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) throw new Error("Invalid AI response");

    const parsed = JSON.parse(content);
    res.json(parsed);

  } catch (err) {
    console.error("AI error:", err.message);
    res.json({
      score: 55,
      suggestions: ["AI error – fallback response used"]
    });
  }
});

app.listen(PORT, () => {
  console.log(`Emotional Echo Proxy running on port ${PORT}`);
});
