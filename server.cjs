// server.cjs
import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 10000;

// Environment variable to toggle AI
const USE_AI = process.env.USE_AI === "true";

// Middleware
app.use(cors());
app.use(express.json());

// Helper: List of words
const aggressiveWords = ["immediately", "now", "overdue", "urgent", "asap"];
const negativeWords = ["angry", "failure", "hate"];
const politeWords = ["please", "thank you", "consider"];

// Function to analyze text locally
function analyzeText(text) {
  let score = 70; // Start neutral

  const lowerText = text.toLowerCase();

  aggressiveWords.forEach(word => {
    if (lowerText.includes(word)) score -= 12;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 15;
  });

  politeWords.forEach(word => {
    if (lowerText.includes(word))
