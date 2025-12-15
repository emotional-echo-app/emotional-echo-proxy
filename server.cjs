const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  console.error('❌ OPENAI_API_KEY missing');
}

// Analyze endpoint
app.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: `Analyze the emotional tone of the following text.
Return ONLY valid JSON in this exact format:
{
  "score": number (0-100),
  "suggestions": ["string", "string", "string"]
}

Text:
"${text}"`
      })
    });

    const data = await response.json();

    const output =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text;

    if (!output) {
      console.error('❌ OpenAI bad response:', data);
      return res.status(500).json({ error: 'Invalid AI response' });
    }

    const parsed = JSON.parse(output);
    res.json(parsed);

  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server failure' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('✅ Emotional Echo Proxy running on port', PORT);
});
