import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post("/analyze", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OpenAI API key" });
    }

    const text = req.body.text;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Analyze the emotional tone of the text. Return ONLY valid JSON like: {\"score\": number (0-100), \"suggestions\": [string, string, string]}"
          },
          { role: "user", content: text }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    const data = await response.json();

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      return res.status(500).json({ error: "Invalid AI response" });
    }

    const parsed = JSON.parse(raw);
    res.json(parsed);

  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "AI processing failed" });
  }
});

app.get("/", (_, res) => {
  res.json({ service: "Emotional Echo Proxy", status: "running" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log("Emotional Echo Proxy running on port", PORT)
);
