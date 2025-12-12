const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY;

// OpenAI proxy endpoint
app.post("/analyze", async (req, res) => {
  const text = req.body.text;
  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a tone analysis assistant. Analyze the emotional tone of the text and return ONLY JSON in this format: {score: number (0-100), suggestions: [string, string, string]}",
        },
        { role: "user", content: text },
      ],
      max_tokens: 200,
    };

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + OPENAI_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "{}";

    res.json(JSON.parse(content));
  } catch (e) {
    console.error("Proxy error:", e);
    res.status(500).json({ error: "Proxy error" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Emotional Echo Proxy",
    status: "running",
    endpoints: ["POST /analyze", "GET /health"],
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Emotional Echo Proxy running on port", PORT);
});
