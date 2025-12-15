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

    console.log('Request received for text:', text.substring(0, 50) + '...');

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
    console.log('OpenAI raw response:', JSON.stringify(data, null, 2));
    
    // Clean way to get content without optional chaining
    let content = '{}';
    if (data.choices && data.choices<a href="" class="citation-link" target="_blank" style="vertical-align: super; font-size: 0.8em; margin-left: 3px;">[0]</a> && data.choices<a href="" class="citation-link" target="_blank" style="vertical-align: super; font-size: 0.8em; margin-left: 3px;">[0]</a>.message && data.choices<a href="" class="citation-link" target="_blank" style="vertical-align: super; font-size: 0.8em; margin-left: 3px;">[0]</a>.message.content) {
      content = data.choices<a href="" class="citation-link" target="_blank" style="vertical-align: super; font-size: 0.8em; margin-left: 3px;">[0]</a>.message.content;
    }
    
    console.log('OpenAI content:', content);

    // Try to parse the content
    try {
      const parsed = JSON.parse(content);
      console.log('Successfully parsed JSON');
      res.json(parsed);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Raw content that failed:', content);
      
      // Fallback response
      res.json({
        score: 50,
        suggestions: ["Check grammar", "Improve tone", "Add emotional appeal"]
      });
    }
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Proxy failed' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Emotional Echo Proxy is running',
    endpoints: ['POST /analyze', 'GET /health']
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('✅ Proxy running on port', PORT);
});
