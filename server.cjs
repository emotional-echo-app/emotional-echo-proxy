// server.cjs
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY;

// OpenAI proxy endpoint
app.post('/analyze', async (req, res) => {
  const text = req.body.text;
  if (!text) return res.status
