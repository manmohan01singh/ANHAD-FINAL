# 🕊️ GURBANI GPT — COMPLETE UI/UX PROMPT + ARCHITECTURE
### Gemini-Level Design + RAG System + Fallback LLM Chain
---

## PART 1: GEMINI UI/UX DEEP ANALYSIS (From Screenshots)

### What I Observed in the Screenshots

| Screenshot | State | Gradient Color | Description |
|---|---|---|---|
| Image 1 | Idle/Home | Light Sky Blue | Star logo, greeting, input bar |
| Image 2 | Processing | Warm Yellow-Amber | "Initiating Conversation Analysis" |
| Image 3 | Deep Thinking | Teal-Cyan | Minimal dots only |
| Image 4 | Generating | Purple-Lavender | Dots + user bubble |
| Image 5 | Active | Royal Blue | Dots + user bubble |

### Color Gradient System (Exact Values)
```
IDLE:       #C8E6F5 → #E8F4FD → #FFFFFF  (Sky Blue)
PROCESSING: #FFD580 → #FFF0C0 → #FFFFFF  (Warm Amber)
THINKING:   #7ECFBE → #B5E8E0 → #FFFFFF  (Teal Cyan)
GENERATING: #C4A3E0 → #E2D0F5 → #FFFFFF  (Purple Lavender)
ACTIVE:     #5B91EF → #A8C8F8 → #FFFFFF  (Royal Blue)
```
The gradient covers top 45% of screen and soft-fades to pure white.

---

## PART 2: COMPLETE UI/UX PROMPT
### (Give this entire prompt to any AI to build the exact Gemini-style UI)

---

```
BUILD A MOBILE CHAT APPLICATION — "GURBANI GPT"
Exact Gemini-Style UI/UX Specification

==========================================================
SECTION A: VISUAL IDENTITY
==========================================================

DESIGN PHILOSOPHY:
- Ultra clean, minimal, breathable
- The color system is the personality — it breathes and shifts
- White canvas with living gradient at top
- Everything transitions fluidly — nothing is static
- Inspired by Google Gemini's mobile app (July 2025 version)

FONT STACK:
- Primary: "Google Sans", "DM Sans", "Inter", sans-serif
- Display heading: 30px, weight 400, letter-spacing -0.5px
- Message text: 15px, weight 400, line-height 1.5
- Status text: 13px, weight 400, color #5F6368
- UI labels: 13px, weight 500, tracking 0.1px

==========================================================
SECTION B: DYNAMIC GRADIENT COLOR SYSTEM
==========================================================

The ENTIRE BACKGROUND is a gradient that smoothly morphs
between these states. The gradient is NOT just a header —
it fills the full screen top to bottom, fading to white.

STATE 1 — IDLE / HOME:
  Start color: #C8E6F5 (soft sky blue)
  Mid color:   #D8EDF8
  End:         #FFFFFF
  Top: 0%, Full gradient height: 50% of screen

STATE 2 — SENT MESSAGE / PROCESSING:
  Start: #FFD580 (warm golden amber)
  Mid:   #FFF0C0
  End:   #FFFFFF
  Trigger: immediately when user hits send

STATE 3 — DEEP THINKING:
  Start: #7ECFBE (teal)
  Mid:   #B5E8E0
  End:   #FFFFFF
  Trigger: after 1.5s of processing

STATE 4 — GENERATING RESPONSE:
  Start: #C4A3E0 (soft purple)
  Mid:   #E2D0F5
  End:   #FFFFFF
  Trigger: when tokens start streaming

STATE 5 — RESPONSE COMPLETE:
  Start: #5B91EF (royal blue)
  Mid:   #A8C8F8
  End:   #FFFFFF
  Trigger: after response finishes

GRADIENT TRANSITION RULES:
- Duration: 2500ms ease-in-out
- Use CSS: transition: background 2.5s ease-in-out
- Add "breathing" animation: subtle oscillation ±3% opacity
  (keyframes: 0%→100% opacity 0.97→1.0, 4s infinite)
- The gradient should feel organic, alive, warm

CSS IMPLEMENTATION:
.app-background {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    180deg,
    var(--gradient-top) 0%,
    var(--gradient-mid) 30%,
    #ffffff 65%,
    #ffffff 100%
  );
  transition: --gradient-top 2.5s ease, --gradient-mid 2.5s ease;
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 1.0; }
  50% { opacity: 0.97; }
}

==========================================================
SECTION C: HEADER / NAVBAR
==========================================================

LAYOUT: Three sections — left | center | right
HEIGHT: 56px
BACKGROUND: transparent (floats over gradient)

LEFT: Hamburger menu (≡)
  - Three horizontal lines icon
  - Size: 20px, color: #202124
  - Tap → opens sidebar/drawer

CENTER: Model selector
  - Text: "Flash Extended ↓" or "Gemini Pro ↓"
  - Font: Google Sans Medium 15px
  - Color: #202124
  - Has dropdown arrow (↓ or chevron-down)
  - Tapping opens model selection modal

RIGHT: Two icon buttons
  1. Edit/Compose icon (pencil in circle)
  2. Three dots menu (⋯)
  - Both: 36px tap target, #5F6368 color

DO NOT add background color or shadow to header.
It must be translucent over the gradient.

==========================================================
SECTION D: HOME / EMPTY STATE
==========================================================

When no conversation is active, show:

1. LOGO — center of screen, slightly above middle:
   Google's 4-pointed star shape (✦)
   Colors: Multi-color gradient fill
     - Top point: #4285F4 (Google Blue)
     - Right point: #EA4335 (Google Red)  
     - Bottom point: #FBBC05 (Google Yellow)
     - Left point: #34A853 (Google Green)
   Size: 52px × 52px
   Animation: gentle 360° rotation, 8s linear infinite
   OR subtle pulse scale (1.0 → 1.03 → 1.0), 3s infinite

2. GREETING TEXT (below logo, 16px gap):
   "Your move, [Username]!"
   Font: 30px, weight 400, color: #1A1A2E
   Text-align: center
   Width: 80% of screen
   Line-height: 1.3

   If no username: "Your move!"

VERTICAL POSITION: Star + text block centered at 40% from top

==========================================================
SECTION E: INPUT BAR
==========================================================

POSITION: Fixed to bottom, above keyboard/safe-area
LAYOUT: Horizontal pill

STYLES:
  background: #FFFFFF
  border-radius: 28px
  padding: 14px 18px
  margin: 0 16px 16px 16px
  box-shadow: 0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)
  display: flex
  align-items: center
  gap: 12px

LEFT ELEMENT: "+" icon
  Size: 22px, color: #5F6368
  Tap → attachment options (image, file, camera)

CENTER: Text input
  Placeholder: "Ask Gemini" (or "Ask Gurbani GPT")
  Placeholder color: #9AA0A6
  Font: 15px Google Sans, weight 400
  Flex: 1 (takes all remaining space)
  No border, no background

RIGHT ELEMENTS (2 icons, 8px gap):
  1. Microphone icon: #5F6368, 22px
     → Long press for voice input
  2. Waveform/Equalizer icon (3 bars, ≡ style):
     #5F6368, 22px
     → Tap for audio mode
     → During generation: changes to STOP/SQUARE icon

DURING PROCESSING:
  Right icon becomes: ■ (square stop button)
  Color: #1A73E8 (Google Blue)
  Tap → cancel generation

INPUT BAR ANIMATION on focus:
  transform: translateY(-2px)
  box-shadow: 0 4px 20px rgba(0,0,0,0.12)
  transition: all 0.2s ease

==========================================================
SECTION F: MESSAGE DISPLAY
==========================================================

USER MESSAGES:
  Alignment: right
  Background: #EBEBEB (light gray)
  Border-radius: 18px 18px 4px 18px
  Padding: 10px 14px
  Max-width: 78% of screen width
  Font: 15px, #202124
  Margin-bottom: 8px
  
  Entrance animation:
    From: translateX(30px), opacity: 0, scale: 0.9
    To: translateX(0), opacity: 1, scale: 1
    Duration: 300ms cubic-bezier(0.34, 1.56, 0.64, 1)

AI RESPONSE AREA:
  Alignment: left, margin-left: 0
  No bubble background
  Font: 15px, #202124, line-height: 1.6
  Text streams in token by token
  
  Stream animation: cursor blink at end of text
  cursor: ▌ (blinking, #1A73E8 color)

==========================================================
SECTION G: LOADING / THINKING ANIMATION
==========================================================

THE DOTS ANIMATION — 3 dots in a row

STYLES:
  Each dot: 
    width: 7px, height: 7px
    border-radius: 50%
    background: #5F6368

ANIMATION PATTERN:
  @keyframes dotPulse {
    0%, 100% { transform: scale(0.5); opacity: 0.3; }
    50% { transform: scale(1.0); opacity: 1.0; }
  }
  
  Dot 1: animation-delay: 0ms
  Dot 2: animation-delay: 200ms
  Dot 3: animation-delay: 400ms
  Duration: 1200ms, infinite

LAYOUT:
  display: flex
  gap: 5px
  padding: 12px 4px
  align-items: center

STATUS TEXT BELOW DOTS:
  Show rotating status messages:
  - "Initiating Conversation Analysis"
  - "Thinking deeply..."
  - "Searching Gurbani..."
  - "Crafting response..."
  Font: 13px, #5F6368
  Fade in/out: 800ms opacity transition
  Change every: 2500ms

==========================================================
SECTION H: "ANSWER NOW" BUTTON (Optional)
==========================================================

Shown during extended thinking/processing:

  text: "Answer now"
  background: rgba(255,255,255,0.85)
  border: none
  border-radius: 20px
  padding: 10px 20px
  font: 14px Google Sans Medium
  color: #202124
  backdrop-filter: blur(8px)
  position: absolute, bottom 80px, centered
  
  Tap → stops thinking, forces immediate response

==========================================================
SECTION I: COMPLETE INTERACTION FLOW
==========================================================

1. USER OPENS APP:
   - Background: Sky blue gradient (STATE 1)
   - Shows: Logo + "Your move, [Name]!" greeting
   - Input bar at bottom

2. USER TYPES:
   - Input bar scales up slightly (lift effect)
   - No color change yet

3. USER HITS SEND:
   - Message bubble flies in from right (bouncy spring)
   - Gradient INSTANTLY starts transitioning → Amber (STATE 2)
   - Dots animation appears on left
   - Status: "Initiating Conversation Analysis"
   - Input right icon → STOP button

4. AFTER 1.5s:
   - Gradient transitions → Teal (STATE 3)
   - Status changes: "Thinking deeply..."

5. RESPONSE STARTS STREAMING:
   - Gradient → Purple (STATE 4)
   - Dots disappear, replaced by streaming text
   - Text appears token by token with cursor

6. RESPONSE COMPLETE:
   - Gradient → Royal Blue (STATE 5)
   - Cursor disappears
   - Input icon reverts to microphone/waveform
   - "Answer now" button disappears
   
7. IDLE AGAIN:
   - After 3s, gradient softly returns to Sky Blue (STATE 1)

==========================================================
SECTION J: SIDEBAR / DRAWER
==========================================================

Slide in from left, width 80% of screen:
  background: #FAFAFA
  Contains: conversation history list, settings, model info
  Each conversation: 
    - Title (first 40 chars of first message)
    - Timestamp
    - Tap to resume
  
  Bottom of drawer:
    - User profile picture + name
    - Settings gear icon

==========================================================
SECTION K: COMPLETE CSS VARIABLES
==========================================================

:root {
  --gradient-top-idle: #C8E6F5;
  --gradient-top-processing: #FFD580;
  --gradient-top-thinking: #7ECFBE;
  --gradient-top-generating: #C4A3E0;
  --gradient-top-complete: #5B91EF;
  
  --font-primary: 'Google Sans', 'DM Sans', 'Inter', sans-serif;
  --text-primary: #202124;
  --text-secondary: #5F6368;
  --text-placeholder: #9AA0A6;
  --bg-input: #FFFFFF;
  --bg-user-bubble: #EBEBEB;
  --accent-blue: #1A73E8;
  
  --radius-bubble: 18px;
  --radius-input: 28px;
  --spacing-base: 16px;
  --header-height: 56px;
  --input-height: 54px;
}
```

---

## PART 3: GURBANI GPT — COMPLETE TECHNICAL ARCHITECTURE

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER (Mobile/Web)                     │
│              [Gemini-Style UI - React Native]            │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP / WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                   API GATEWAY / BACKEND                  │
│                  (Node.js + Express)                     │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Auth Layer │  │ Rate Limiter │  │  Session Mgmt  │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────▼──────────────┐
         │      RAG PIPELINE          │
         │                            │
         │  1. Query Processing       │
         │  2. Embedding Generation   │
         │  3. Vector Search          │
         │  4. Context Assembly       │
         │  5. LLM Prompt Building    │
         └─────────────┬──────────────┘
              ┌────────┴────────┐
              │                 │
    ┌─────────▼──────┐  ┌──────▼────────────┐
    │  VECTOR DB     │  │  LLM FALLBACK      │
    │  (ChromaDB /   │  │  CHAIN             │
    │   Pinecone)    │  │                    │
    │                │  │  1st: Gemini Flash │
    │  Gurbani       │  │  2nd: OpenRouter   │
    │  Embeddings    │  │  3rd: Groq LLaMA   │
    └────────────────┘  └───────────────────┘
```

---

### RAG System Architecture

#### Step 1: Document Ingestion Pipeline

```javascript
// FILE: ingestion/gurbanIngest.js

const { ChromaClient } = require('chromadb');
const chroma = new ChromaClient();

// GURBANI DOCUMENT STRUCTURE
const GURBANI_COLLECTIONS = {
  'guru-granth-sahib': './data/gurbani/SGGS/',
  'nitnem': './data/gurbani/Nitnem/',
  'amrit-kirtan': './data/gurbani/AmritKirtan/',
  'sukhmani-sahib': './data/gurbani/Sukhmani/',
  'rehras-sahib': './data/gurbani/Rehras/',
};

// CHUNKING STRATEGY for Gurbani (MOST IMPORTANT)
// Each Shabad = 1 chunk (do NOT split mid-shabad)
function chunkGurbani(text) {
  const chunks = [];
  
  // Split by Shabad separator (||) or double newline
  const rawChunks = text.split(/\|\||\n\n/);
  
  for (const chunk of rawChunks) {
    if (chunk.trim().length > 10) {
      chunks.push({
        gurmukhi: chunk.trim(),
        transliteration: '',  // Add if available
        translation_en: '',   // English meaning
        translation_hi: '',   // Hindi meaning
        translation_pa: '',   // Punjabi meaning
        ang: '',              // Page number in SGGS
        raag: '',             // Raag name
        author: '',           // Guru/Bhagat name
      });
    }
  }
  return chunks;
}

// EMBEDDING using free multilingual model
async function generateEmbedding(text) {
  // Option A: Gemini Embedding API (Free)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] }
      })
    }
  );
  const data = await res.json();
  return data.embedding.values; // 768-dim vector
}

async function ingestGurbaniFiles() {
  const collection = await chroma.getOrCreateCollection({
    name: 'gurbani_knowledge',
    metadata: { 'hnsw:space': 'cosine' }
  });

  for (const [colName, folderPath] of Object.entries(GURBANI_COLLECTIONS)) {
    const files = fs.readdirSync(folderPath);
    
    for (const file of files) {
      const content = fs.readFileSync(`${folderPath}/${file}`, 'utf-8');
      const chunks = chunkGurbani(content);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const textToEmbed = `${chunk.gurmukhi} ${chunk.translation_en}`;
        const embedding = await generateEmbedding(textToEmbed);
        
        await collection.add({
          ids: [`${colName}_${file}_${i}`],
          embeddings: [embedding],
          documents: [chunk.gurmukhi],
          metadatas: [{
            collection: colName,
            ang: chunk.ang,
            raag: chunk.raag,
            author: chunk.author,
            translation_en: chunk.translation_en,
            translation_hi: chunk.translation_hi,
            translation_pa: chunk.translation_pa,
          }]
        });
      }
    }
  }
  console.log('✅ Gurbani ingestion complete!');
}
```

---

#### Step 2: RAG Query Pipeline

```javascript
// FILE: rag/gurbaniRAG.js

async function queryGurbani(userQuery, topK = 5) {
  const collection = await chroma.getCollection({ name: 'gurbani_knowledge' });
  
  // 1. Embed the user query
  const queryEmbedding = await generateEmbedding(userQuery);
  
  // 2. Search for similar shabads
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    include: ['documents', 'metadatas', 'distances']
  });
  
  // 3. Format retrieved context
  const context = results.documents[0].map((doc, i) => ({
    shabad: doc,
    metadata: results.metadatas[0][i],
    relevanceScore: 1 - results.distances[0][i], // cosine distance → similarity
  }));
  
  return context;
}

// BUILD THE FINAL PROMPT with retrieved context
function buildGurbaniPrompt(userQuery, retrievedContext, language = 'hi') {
  const contextText = retrievedContext
    .map((item, i) => `
      [Shabad ${i + 1}]
      Gurmukhi: ${item.shabad}
      Meaning (EN): ${item.metadata.translation_en}
      Ang/Page: ${item.metadata.ang}
      Author: ${item.metadata.author}
    `)
    .join('\n\n');

  return `
You are Gurbani GPT — a knowledgeable and compassionate guide to Sikh scripture (Gurbani).
You speak in ${language === 'pa' ? 'Punjabi' : language === 'hi' ? 'Hindi' : 'English'}.
You are respectful, accurate, and rooted in the teachings of the Guru Granth Sahib Ji.

RELEVANT GURBANI (Retrieved for this query):
${contextText}

USER QUESTION: ${userQuery}

INSTRUCTIONS:
- Answer based on the retrieved Gurbani above
- Quote the relevant Gurmukhi shabad when appropriate
- Give the meaning in simple terms
- Be warm, compassionate, and spiritually grounded
- If the question is not in Gurbani, say so humbly
- Respond in the same language the user wrote in

RESPONSE:
  `.trim();
}
```

---

#### Step 3: LLM Fallback Chain (Gemini → OpenRouter → Groq)

```javascript
// FILE: llm/fallbackChain.js

const LLM_CONFIG = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.0-flash',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    dailyLimit: 1500,
    used: 0,
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: 'qwen/qwen-2.5-72b-instruct:free',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    dailyLimit: 200,
    used: 0,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    dailyLimit: 14400,
    used: 0,
  }
};

async function callGemini(prompt) {
  const cfg = LLM_CONFIG.gemini;
  const res = await fetch(`${cfg.url}?key=${cfg.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gemini: ${data.error?.message}`);
  return data.candidates[0].content.parts[0].text;
}

async function callOpenRouter(prompt) {
  const cfg = LLM_CONFIG.openrouter;
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://gurbanigpt.app',
      'X-Title': 'Gurbani GPT',
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OpenRouter: ${data.error?.message}`);
  return data.choices[0].message.content;
}

async function callGroq(prompt) {
  const cfg = LLM_CONFIG.groq;
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Groq: ${data.error?.message}`);
  return data.choices[0].message.content;
}

// MAIN FUNCTION — tries all 3 in order
async function getGurbaniResponse(userMessage, language = 'auto') {
  // Step 1: RAG retrieval
  const retrievedContext = await queryGurbani(userMessage, 5);
  
  // Step 2: Build prompt
  const prompt = buildGurbaniPrompt(userMessage, retrievedContext, language);
  
  // Step 3: Try LLMs in fallback order
  const providers = [
    { name: 'Gemini Flash (Primary)', fn: callGemini },
    { name: 'OpenRouter Qwen (Secondary)', fn: callOpenRouter },
    { name: 'Groq LLaMA (Tertiary)', fn: callGroq },
  ];

  for (const provider of providers) {
    try {
      console.log(`🔄 Trying ${provider.name}...`);
      const response = await Promise.race([
        provider.fn(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 12000))
      ]);
      console.log(`✅ Success: ${provider.name}`);
      return {
        response,
        provider: provider.name,
        context: retrievedContext,
      };
    } catch (err) {
      console.warn(`⚠️ ${provider.name} failed: ${err.message}`);
    }
  }

  return {
    response: 'ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ। Sorry, all AI services are unavailable. Please try again.',
    provider: null,
    context: [],
  };
}
```

---

#### Step 4: Express API Routes

```javascript
// FILE: server.js

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// CHAT ENDPOINT
app.post('/api/chat', async (req, res) => {
  const { message, sessionId, language } = req.body;
  
  if (!message) return res.status(400).json({ error: 'Message required' });
  
  try {
    // Set streaming headers for real-time feel
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send "thinking" status
    res.write(`data: ${JSON.stringify({ type: 'status', text: 'Initiating Conversation Analysis' })}\n\n`);
    
    // Get RAG + LLM response
    const result = await getGurbaniResponse(message, language || 'auto');
    
    // Send retrieved sources
    res.write(`data: ${JSON.stringify({ type: 'sources', sources: result.context })}\n\n`);
    
    // Stream the response word by word (simulate streaming)
    const words = result.response.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ type: 'token', text: word + ' ' })}\n\n`);
      await new Promise(r => setTimeout(r, 30)); // 30ms per word
    }
    
    res.write(`data: ${JSON.stringify({ type: 'done', provider: result.provider })}\n\n`);
    res.end();
    
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', text: err.message })}\n\n`);
    res.end();
  }
});

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(3001, () => console.log('🕊️ Gurbani GPT Backend running on port 3001'));
```

---

## PART 4: FOLDER STRUCTURE (Complete Project)

```
gurbani-gpt/
│
├── 📁 frontend/                    # React Native / React app
│   ├── App.js
│   ├── components/
│   │   ├── ChatScreen.jsx          # Main Gemini-style UI
│   │   ├── GradientBackground.jsx  # Dynamic color system
│   │   ├── MessageBubble.jsx       # User + AI bubbles
│   │   ├── ThinkingDots.jsx        # Animated dots
│   │   ├── InputBar.jsx            # Bottom input
│   │   └── Sidebar.jsx             # Chat history drawer
│   └── styles/
│       └── tokens.js               # CSS variables / theme
│
├── 📁 backend/
│   ├── server.js                   # Express API
│   ├── llm/
│   │   └── fallbackChain.js        # Gemini→OpenRouter→Groq
│   ├── rag/
│   │   ├── gurbaniRAG.js           # Query + retrieval
│   │   └── buildPrompt.js          # Prompt assembly
│   └── ingestion/
│       └── gurbaniIngest.js        # One-time file ingest
│
├── 📁 data/
│   └── gurbani/
│       ├── SGGS/                   # Guru Granth Sahib Ji files
│       ├── Nitnem/                 # Daily prayers
│       ├── Sukhmani/
│       ├── Rehras/
│       └── AmritKirtan/
│
├── 📁 vectordb/
│   └── chroma/                     # ChromaDB local storage
│
├── .env                            # API keys (NEVER commit)
├── package.json
└── README.md
```

---

## PART 5: .ENV FILE TEMPLATE

```bash
# PRIMARY - Gemini
GEMINI_API_KEY=AIzaSy_YOUR_GEMINI_KEY_HERE

# SECONDARY - OpenRouter
OPENROUTER_API_KEY=sk-or-v1-YOUR_OPENROUTER_KEY

# TERTIARY - Groq
GROQ_API_KEY=gsk_YOUR_GROQ_KEY

# Backend
PORT=3001
NODE_ENV=production

# Frontend
REACT_APP_API_URL=http://localhost:3001
```

---

## PART 6: STEP-BY-STEP SETUP GUIDE

```
STEP 1: Get API Keys
  ✅ Gemini:      aistudio.google.com → Get API Key
  ✅ OpenRouter:  openrouter.ai/keys → Create Key
  ✅ Groq:        console.groq.com → API Keys

STEP 2: Set up Backend
  cd backend
  npm install express cors chromadb node-fetch dotenv
  cp .env.example .env  (add your keys)
  npm start

STEP 3: Ingest Gurbani Files
  - Add your Gurbani text files to /data/gurbani/
  - node ingestion/gurbaniIngest.js
  - Wait for: ✅ Gurbani ingestion complete!

STEP 4: Set up Frontend
  cd frontend
  npm install
  npm start (or expo start for mobile)

STEP 5: Test
  - Open app
  - Ask: "ਵਾਹਿਗੁਰੂ ਦਾ ਪਿਆਰ ਕੀ ਹੈ?" (What is Waheguru's love?)
  - Should retrieve relevant shabads and respond in Punjabi
```

---

## PART 7: DAILY LIMIT TRACKER (Smart Rotation Logic)

```javascript
// Automatically rotates when limits are hit
const DAILY_LIMITS = {
  gemini: 1500,      // Resets at midnight UTC
  openrouter: 200,    // Check their dashboard
  groq: 14400,        // Resets at midnight UTC
};

// Use Redis or in-memory counter
let usageCount = { gemini: 0, openrouter: 0, groq: 0 };

function getLLMProvider() {
  if (usageCount.gemini < DAILY_LIMITS.gemini) return 'gemini';
  if (usageCount.openrouter < DAILY_LIMITS.openrouter) return 'openrouter';
  if (usageCount.groq < DAILY_LIMITS.groq) return 'groq';
  return null; // All exhausted
}
```

---

*Built for Gurbani GPT — Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh 🙏*
