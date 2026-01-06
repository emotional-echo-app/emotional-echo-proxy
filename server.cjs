// server.cjs
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// Check environment variables
const USE_AI = process.env.USE_AI === "true";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize OpenAI only if AI is enabled
let openai;
if (USE_AI && OPENAI_API_KEY
