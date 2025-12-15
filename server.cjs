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

app.post('/analyze', async (req, res) => {
  const text = req.body.text;
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'system',
            content:
              'You are a tone analysis assistant. Respond ONLY with valid JSON. No markdown. No explanation.'
          },
          {
            role: 'user',
            content: `Analyze the emotional tone of this text and return ONLY JSON in this format:
{
  "score": number (0-100),
  "suggestions": ["string", "string", "string"]
}

Text:
"${text}"`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI error:', data);
      return res.status(500).json({ error: 'OpenAI request failed' });
    }

    const raw =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      '';

    // 🔐 Extract JSON safely
    const match = raw.match(/\{[\s\S]*\}/);

    if (!match) {
      console.error('Invalid AI response:', raw);
      return res.status(500).json({ error: 'Invalid AI response' });
    }

    const parsed = JSON.parse(match[0]);
    res.json(parsed);

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

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

if (!response.ok) {
  console.error('❌ OpenAI ERROR STATUS:', response.status);
  console.error('❌ OpenAI ERROR BODY:', JSON.stringify(data, null, 2));
  return res.status(500).json({ error: 'OpenAI request failed' });
}

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
