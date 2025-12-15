const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY;

/**
 * POST /analyze
 * Receives: { text: string }
 * Returns: { score: number, suggestions: string[] }
 */
app.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a tone analysis assistant. Analyze the emotional tone of the text and return ONLY valid JSON in this exact format: {"score": number (0-100), "suggestions": [string, string, string]}'
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI error:', errText);
      return res.status(500).json({ error: 'OpenAI request failed' });
    }

    const data = await response.json();

    const content =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
        ? data.choices[0].message.content
        : null;

    if (!content) {
      return res.status(500).json({ error: 'Invalid OpenAI response' });
    }

    const parsed = JSON.parse(content);

    return res.json(parsed);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Root
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Emotional Echo Proxy',
    status: 'running'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Emotional Echo Proxy running on port ${PORT}`);
});
