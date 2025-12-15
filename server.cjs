const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

// IMPORTANT: allow Chrome extension + browsers
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY;

// Analyze endpoint
app.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Analyze the emotional tone of the text. Respond ONLY with valid JSON: { "score": number, "suggestions": [string, string, string] }'
          },
          { role: 'user', content: text }
        ],
        max_tokens: 200
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    res.json(JSON.parse(content));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Proxy failed' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
