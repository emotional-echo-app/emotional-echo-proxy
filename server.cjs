const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/analyze", (req, res) => {
  const text = (req.body.text || "").toLowerCase();

  if (!text.trim()) {
    return res.json({
      tone: "Unknown",
      score: 0,
      suggestion: "No text provided."
    });
  }

  let score = 100;
  let tone = "Neutral";
  let suggestion = "Tone is balanced.";

  const threats = [
    "there will be a problem",
    "or else",
    "you will regret",
    "this is unacceptable",
    "last warning"
  ];

  const aggressive = [
    "need this now",
    "right away",
    "immediately",
    "asap",
    "now"
  ];

  const commands = [
    "you need to",
    "you must",
    "do this",
    "send me",
    "i expect"
  ];

  // Threats override everything
  if (threats.some(p => text.includes(p))) {
    tone = "Aggressive";
    score -= 45;
    suggestion = "Message contains implied threat. Strongly soften language.";
  }

  // Commands + urgency escalate
  if (commands.some(p => text.includes(p)) && aggressive.some(p => text.includes(p))) {
    tone = tone === "Aggressive" ? tone : "Confrontational";
    score -= 30;
    suggestion = "Direct command combined with urgency. Consider a collaborative tone.";
  }

  // Urgency alone
  if (aggressive.some(p => text.includes(p)) && score > 60) {
    tone = "Direct";
    score -= 20;
    suggestion = "Urgency detected. Consider softening timing language.";
  }

  // Clamp score
  score = Math.max(15, Math.min(score, 95));

  res.json({ tone, score, suggestion });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Emotional Echo server running on port", PORT)
);
