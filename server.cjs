// server.cjs — STABLE FINAL VERSION
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Emotional Echo API running");
});

// Core analyze endpoint
app.post("/analyze", async (req, res) => {
  try {
    const text = (req.body.text || "").trim();

    if (!text) {
      return res.json({
        tone: "Neutral",
        score: 50,
        suggestion: "No text provided."
      });
    }

    // VERY SIMPLE + RELIABLE LOGIC (NO AI DEPENDENCY)
    let score = 50;
    let tone = "Neutral";
    let suggestion = "Message tone looks balanced.";

    const aggressiveWords = [
      "immediately",
      "urgent",
      "now",
      "overdue",
      "asap",
      "must",
      "failure",
      "unacceptable"
    ];

    const upper = text.toUpperCase();
    const exclamations = (text.match(/!/g) || []).length;

    aggressiveWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score += 5;
    });

    if (upper === text && text.length > 10) score += 10;
    if (exclamations > 1) score += 5;

    if (score > 100) score = 100;

    if (score >= 70) {
      tone = "Aggressive";
      suggestion = "Consider softening urgency or pressure.";
    } else if (score >= 60) {
      tone = "Risky";
      suggestion = "Message may feel demanding to some readers.";
    }

    return res.json({
      tone,
      score,
      suggestion
    });

  } catch (err) {
    console.error("ANALYZE ERROR:", err);
    res.status(500).json({
      tone: "Error",
      score: 0,
      suggestion: "Server error."
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Emotional Echo server running on port ${PORT}`);
});
