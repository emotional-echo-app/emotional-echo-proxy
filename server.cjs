const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY;

app.post('/analyze', async (req, res) => {
  const text = req.body.text;

  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  try {
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a tone analysis assistant. Return JSON only: {score:number, suggestions:[strings]}'
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 200
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();

    const content =
      data?.choices?.[0]?.message?.content || '{}';

    let json;
    try {
      json = JSON.parse(content);
    } catch (err) {
      console.error('Failed to parse JSON returned by model:', content);
      json = { error: 'Invalid response from model' };
    }

    res.json(json);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
