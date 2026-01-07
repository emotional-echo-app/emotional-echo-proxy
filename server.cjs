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
    "last warning",
    "unacceptable",
    "you will regret"
  ];

  const commands = [
    "you need to",
    "you must",
    "i expect",
    "send me",
    "do this"
  ];

  const urgency = [
    "now",
    "right away",
    "immediately",
    "asap"
  ];

  // RULE 1: Threats override everything
  if (threats.some(p => text.includes(p))) {
    tone = "Aggressive";
    score -= 50;
    suggestion = "Message contains implied threat. High risk — soften language.";
  }

  // RULE 2: Commands + urgency escalate
  if (
    commands.some(p => text.includes(p)) &&
    urgency.some(p => text.includes(p)) &&
    tone !== "Aggressive"
  ) {
    tone = "Confrontational";
    score -= 30;
    suggestion = "Direct command combined with urgency. Consider a collaborative tone.";
  }

  // RULE 3: Urgency alone
  if (urgency.some(p => text.includes(p)) && score > 60) {
    tone = "Direct";
    score -= 20;
    suggestion = "Urgency detected. Consider softening timing language.";
  }

  score = Math.max(15, Math.min(score, 95));

  res.json({ tone, score, suggestion });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Emotional Echo server running on port", PORT);
});
