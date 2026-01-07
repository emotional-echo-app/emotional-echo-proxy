// server.cjs — Emotional Echo (SMART + STABLE)
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Emotional Echo API running");
});

app.post("/analyze", (req, res) => {
  try {
    const text = (req.body.text || "").trim();
    const lower = text.toLowerCase();

    if (!text) {
      return res.json({
        tone: "Neutral",
        score: 50,
        suggestion: "No message to analyze."
      });
    }

    let score = 50;
    let tone = "Neutral";
    let suggestion = "Tone appears balanced.";

    // Strong urgency / pressure phrases
    const highPressurePhrases = [
      "right away",
      "immediately",
      "as soon as possible",
      "asap",
      "this is overdue",
      "i need this now",
      "must be done"
    ];

    // Aggressive / commanding words
    const aggressiveWords = [
      "need",
      "must",
      "required",
      "unacceptable",
      "failure",
      "urgent"
    ];

    // Imperative sentence detection (starts with command)
    const imperativeStarters = [
      "send",
      "do",
      "provide",
      "respond",
      "fix",
      "complete"
    ];

    // Apply phrase weight (stronger than single words)
    highPressurePhrases.forEach(p => {
      if (lower.includes(p)) score += 15;
    });

    aggressiveWords.forEach(w => {
      if (lower.includes(w)) score += 5;
    });

    // Imperative opening
    const firstWord = lower.split(" ")[0];
    if (imperativeStarters.includes(firstWord)) {
      score += 10;
    }

    // Excess punctuation / shouting
    if ((text.match(/!/g) || []).length > 1) score += 5;
    if (text === text.toUpperCase() && text.length > 10) score += 10;

    if (score > 100) score = 100;

    // Tone mapping (STRICT & CONSISTENT)
    if (score >= 80) {
      tone = "Aggressive";
      suggestion = "Message feels forceful. Consider softening the request.";
    } else if (score >= 65) {
      tone = "Risky";
      suggestion = "Tone may feel demanding or pressuring.";
    } else if (score >= 55) {
      tone = "Direct";
      suggestion = "Clear but could sound warmer.";
    } else {
      tone = "Neutral";
      suggestion = "Tone is polite and balanced.";
    }

    res.json({ tone, score, suggestion });

  } catch (err) {
    console.error("ANALYSIS ERROR:", err);
    res.status(500).json({
      tone: "Error",
      score: 0,
      suggestion: "Analysis failed."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Emotional Echo running on port ${PORT}`);
});
