import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
// Increase payload limit to handle base64 images (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini Client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API Key not found in environment variables');
  }
  return new GoogleGenAI({ apiKey });
};

// Helper for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' });
});

// Generate App Theme
app.post('/api/generate-theme', async (req, res) => {
  try {
    const ai = getAiClient();
    
    // Set strict title
    const title = "Brainstorm Nexus";

    // Generate background
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { 
        parts: [{ 
          text: 'Abstract digital art of glowing neural networks and colorful ideas connecting in a dark void, 8k resolution, futuristic style, vibrant colors, wide angle' 
        }] 
      },
      config: { responseModalities: [Modality.IMAGE] },
    });

    let backgroundUrl = '';
    const part = imageResponse.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
      backgroundUrl = `data:image/png;base64,${part.inlineData.data}`;
    }

    res.json({ title, backgroundUrl });
  } catch (error) {
    console.error('Error generating theme:', error);
    res.status(500).json({ 
      error: 'Failed to generate theme',
      message: error.message 
    });
  }
});

// Generate Image for Category
app.post('/api/generate-image', async (req, res) => {
  try {
    const { category } = req.body;
    
    console.log(`[IMAGE API] Received request for category: ${category}`);
    
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    const ai = getAiClient();
    const stylePrompt = "Realistic photographic style with natural lighting, detailed textures, and authentic colors, resembling high-quality professional photography with depth and clarity";
    
    const retries = 3;
    let attempt = 0;
    
    while (attempt < retries) {
      try {
        if (attempt > 0) {
          console.log(`[IMAGE API] Retry attempt ${attempt} for ${category}`);
          await delay(1000 * attempt);
        }

        console.log(`[IMAGE API] Calling Gemini API for ${category}...`);
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { 
            parts: [{ 
              text: `${stylePrompt}. Subject representing the category: ${category}. High quality, artistic.` 
            }] 
          },
          config: { responseModalities: [Modality.IMAGE] },
        });

        console.log(`[IMAGE API] Response received for ${category}`);
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part && part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          console.log(`[IMAGE API] ✓ Image generated successfully for ${category} (${imageUrl.length} chars)`);
          return res.json({ imageUrl });
        } else {
          console.warn(`[IMAGE API] No image data in response for ${category}`);
        }
      } catch (error) {
        console.warn(`[IMAGE API] Attempt ${attempt + 1} failed for category ${category}:`, error.message);
        attempt++;
      }
    }
    
    console.error(`[IMAGE API] ✗ Failed to generate image for ${category} after ${retries} attempts`);
    res.json({ imageUrl: undefined });
    
  } catch (error) {
    console.error('[IMAGE API] Error generating image:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      message: error.message 
    });
  }
});

// Group Words with Gemini
app.post('/api/group-words', async (req, res) => {
  try {
    const { words, groupCount } = req.body;
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Words array is required' });
    }
    
    if (!groupCount || groupCount < 1) {
      return res.status(400).json({ error: 'Valid groupCount is required' });
    }

    const ai = getAiClient();
    
    const prompt = `
    Act as an expert teacher. I have a list of concepts or words submitted by my students.
    Your task is to group these words into exactly ${groupCount} thematic groups.
    
    IMPORTANT: You must strictly follow this output format so my system can read it.
    Use the '$' symbol to surround the category name and the '#' symbol to surround each individual word.
    Do not add introductory text or conclusions. Only the formatted list.

    Example of desired format:
    $Vehicles$ #Car#, #Motorcycle#, #Truck#
    $Fruits$ #Apple#, #Pear#, #Banana#

    Here is the list of words to group:
    ${words.join(', ')}
  `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        temperature: 0.3, 
      }
    });

    const text = response.text;
    if (!text) {
      return res.json({ groups: [] });
    }

    const groups = parseCustomFormat(text);
    res.json({ groups });

  } catch (error) {
    console.error('Error grouping words:', error);
    res.status(500).json({ 
      error: 'Failed to group words',
      message: error.message 
    });
  }
});

// Parse custom format helper
const parseCustomFormat = (text) => {
  const results = [];
  const categoryRegex = /\$([^$]+)\$([^$]*)/g;
  
  let match;
  while ((match = categoryRegex.exec(text)) !== null) {
    const categoryName = match[1].trim();
    const content = match[2];

    const itemRegex = /#([^#]+)#/g;
    const items = [];
    let itemMatch;
    while ((itemMatch = itemRegex.exec(content)) !== null) {
      items.push(itemMatch[1].trim());
    }

    if (items.length > 0) {
      results.push({
        category: categoryName,
        items: items
      });
    }
  }

  return results;
};

// ===== SESSION MANAGEMENT =====
// In-memory storage for sessions (shared across devices)
const sessions = {};

// Generate session code
const generateSessionCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomStr = (length) => 
    Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `${randomStr(3)}-${randomStr(3)}`;
};

// Create session
app.post('/api/sessions', (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    let id = generateSessionCode();
    while (sessions[id]) {
      id = generateSessionCode();
    }

    const newSession = {
      id,
      createdAt: Date.now(),
      createdBy: username,
      status: 'OPEN',
      words: [],
      groups: null,
    };

    sessions[id] = newSession;
    res.json(newSession);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get all sessions for a user
app.get('/api/sessions/:username', (req, res) => {
  try {
    const { username } = req.params;
    const userSessions = Object.values(sessions)
      .filter(s => s.createdBy === username)
      .sort((a, b) => b.createdAt - a.createdAt);
    res.json(userSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get single session
app.get('/api/session/:id', (req, res) => {
  try {
    const { id } = req.params;
    const session = sessions[id];
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Delete session
app.delete('/api/session/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (sessions[id]) {
      delete sessions[id];
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Add word to session
app.post('/api/session/:id/word', (req, res) => {
  try {
    const { id } = req.params;
    const { word } = req.body;
    
    if (!sessions[id]) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (sessions[id].status !== 'OPEN') {
      return res.status(400).json({ error: 'Session is closed' });
    }

    if (!word || typeof word !== 'string') {
      return res.status(400).json({ error: 'Valid word is required' });
    }

    sessions[id].words.push(word);
    res.json(sessions[id]);
  } catch (error) {
    console.error('Error adding word:', error);
    res.status(500).json({ error: 'Failed to add word' });
  }
});

// Update session groups (and close session)
app.put('/api/session/:id/groups', (req, res) => {
  try {
    const { id } = req.params;
    const { groups } = req.body;
    
    if (!sessions[id]) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!groups || !Array.isArray(groups)) {
      return res.status(400).json({ error: 'Valid groups array is required' });
    }

    sessions[id].groups = groups;
    sessions[id].status = 'CLOSED';
    res.json(sessions[id]);
  } catch (error) {
    console.error('Error updating groups:', error);
    res.status(500).json({ error: 'Failed to update groups' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});
