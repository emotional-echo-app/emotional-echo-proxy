const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

/* Middleware */
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/* Root check */
app.get('/', (req, res) => {
  res.json({
    service: 'Emotional Echo Proxy',
    status: 'running'
  });
});

/* Health check */
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

/* Analyze endpoint */
app.post('/analyze', async (req, res) => {
  try {
    const text = req.body?.text;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const openaiResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You analyze emotional tone. Respond ONLY with valid JSON: { "score": number, "suggestions": string[] }'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.4,
          max_tokens: 150
        })
      }
    );

    const data = await openaiResponse.json();

    if (
      !data ||
      !data.choices ||
      !data.choices[0] ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {
      console.error('Invalid OpenAI response:', data);
      return res.status(500).json({ error: 'Invalid AI response' });
    }

    let parsed;
    try {
      parsed = JSON.parse(data.choices[0].message.content);
    } catch (err) {
      console.error('JSON parse error:', data.choices[0].message.content);
      return res.status(500).json({ error: 'AI returned invalid JSON' });
    }

    res.json(parsed);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* Start server */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Emotional Echo Proxy running on port ${PORT}`);
});
