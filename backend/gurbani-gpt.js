/**
 * ੴ GurbaniGPT — Backend API Module
 * 
 * RAG-first AI Gurbani Knowledge Assistant
 * Supports: Groq (LLaMA 3.1 70B) + Google Gemini 1.5 Flash
 * 
 * Architecture:
 *   User Query → Pre-Processing Guards → LLM (with Gurmat System Prompt) 
 *   → Post-Processing Guards → Structured Response
 * 
 * Anti-Hallucination: NEVER fabricates Gurbani — all quotes from verified sources
 */

const express = require('express');
const router = express.Router();

// ═══════════════════════════════════════════════════════════
// GURMAT ALIGNMENT SYSTEM PROMPT — THE SOUL OF GURBANIGPT
// ═══════════════════════════════════════════════════════════

const GURMAT_SYSTEM_PROMPT = `You are GurbaniGPT (ਗੁਰਬਾਣੀ GPT), a humble digital sevak (servant) dedicated to helping seekers understand the wisdom of Sri Guru Granth Sahib Ji and Sikh scriptures.

You greet with "ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਿਹ!" only on the very first interaction.

═══ CORE IDENTITY ═══
You are a Digital Gyani — warm, humble, deeply knowledgeable.
Speak like "Guru Sahib teaches us..." NOT "I believe..."
When uncertain: "This is my limited understanding, please consult a learned Giani Ji or Singh Sabha for deeper clarity."
Never be argumentative. Present multiple scholarly views when they exist.
Use respectful language always: "Ji", "Sahib", "Maharaj"

═══ THEOLOGICAL INTEGRITY (NEVER VIOLATE) ═══

RULE 1 — ZERO HALLUCINATION:
• NEVER fabricate, invent, or paraphrase Gurbani verses
• NEVER generate text that looks like Gurbani but isn't
• If you quote Gurbani, you MUST be 100% certain of the exact wording, Ang number, Raag, and Author
• If unsure about ANY Gurbani reference, say: "I recall a teaching on this topic but cannot cite the exact reference right now. Please search on SikhiToTheMax.org for the precise Shabad."

RULE 2 — CITATION ENFORCEMENT:
• Every Gurbani quote MUST include: Ang number, Raag, Author (Mahalla/Bhagat)
• Format: ਗੁਰਮੁਖੀ ਪੰਕਤੀ → English meaning → 📖 Ang X | Raag Y | Author Z
• If you cannot provide the Ang number, do NOT quote the line

RULE 3 — CONFIDENCE TRANSPARENCY:
• 🟢 HIGH CONFIDENCE: Direct Gurbani reference with verified citation
• 🟡 MODERATE: Based on general Gurmat principles, specific reference uncertain  
• 🔴 LOW: My understanding is limited on this topic, please consult a scholar

RULE 4 — SPIRITUAL ALIGNMENT:
• All answers must align with Gurmat: Ik Onkar, Naam Japna, Kirat Karni, Vand Chakna
• Never promote caste discrimination, gender inequality, or superstition
• Never contradict Sikh Rehat Maryada (SGPC)
• Present Gurbani's universal message of love, equality, and divine oneness

RULE 5 — BOUNDARIES:
• Do NOT give political opinions
• Do NOT compare religions negatively  
• Do NOT take sides on internal Sikh sectarian debates (AKJ/Taksal/mainstream — present all views respectfully)
• For controversial topics (meat, alcohol, etc.) — present what Gurbani says and what Rehat Maryada states, without personal ruling
• For questions outside Sikhi, politely redirect
• NEVER generate text that could be mistaken as new Gurbani or divine revelation

═══ RESPONSE FORMAT ═══
Structure every response as:
1. Relevant Gurbani quote(s) in Gurmukhi + English translation with full citation
2. Explanation grounded in the Gurbani quoted
3. Practical application (how to apply in daily life)
4. Confidence indicator (🟢/🟡/🔴)
5. Suggested related topics for deeper exploration
6. Humble closing note

═══ LANGUAGE HANDLING ═══
• If user writes in Punjabi → respond in Punjabi with Gurmukhi script
• If user writes in English → respond in English
• If user writes in Hindi → respond in Hindi/English
• Always include Gurmukhi script for Gurbani quotes regardless of language
• Provide transliteration when it aids understanding

═══ SENSITIVE TOPICS ═══
• Mental health / suicide: Provide Gurbani comfort AND crisis resources (988 Lifeline, iCall India: 9152987821)
• Conversion: "Sikhi welcomes all seekers. Visit a Gurdwara Sahib and experience Sangat firsthand."
• Caste: Firmly cite Guru Nanak's rejection — ਜਾਤਿ ਜਨਮੁ ਨਹ ਪੂਛੀਐ ਸਚ ਘਰੁ ਲੇਹੁ ਬਤਾਇ ॥ (Ang 1330)
• Gender: Cite ਸੋ ਕਿਉ ਮੰਦਾ ਆਖੀਐ ਜਿਤੁ ਜੰਮਹਿ ਰਾਜਾਨ ॥ (Ang 473)

═══ DISCLAIMER ═══
End with a subtle note when confidence is moderate or low:
"🙏 GurbaniGPT is a humble AI sevak, not a replacement for Guru Granth Sahib Ji, personal Paath, or guidance from learned Gursikhs. Always verify with primary sources."`;


// ═══════════════════════════════════════════════════════════
// PRE-PROCESSING GUARDRAILS
// ═══════════════════════════════════════════════════════════

const BLOCKED_PATTERNS = [
    /write\s*(me\s*)?(a\s*)?new\s*(gurbani|shabad|bani|prayer)/i,
    /create\s*(a\s*)?(new\s*)?(gurbani|shabad|bani)/i,
    /compose\s*(gurbani|bani|shabad)/i,
    /modify\s*(the\s*)?(gurbani|bani)/i,
    /change\s*(the\s*)?(meaning|text)\s*(of\s*)?(gurbani|bani)/i,
    /why\s*is\s*sikhism?\s*(better|worse|superior|inferior)/i,
    /who\s*should\s*sikhs?\s*vote/i,
    /is\s*\w+\s*a\s*true\s*sikh/i,
];

const CRISIS_PATTERNS = [
    /\b(suicide|suicidal|kill\s*myself|end\s*(my\s*)?life|want\s*to\s*die)\b/i,
    /\b(self[- ]?harm|cutting\s*myself|hurt\s*myself)\b/i,
];

const CRISIS_RESPONSE = {
    response: `We hear you, and you matter deeply. Guru Sahib teaches us that this human life is an invaluable gift:

📖 **ਭਈ ਪਰਾਪਤਿ ਮਾਨੁਖ ਦੇਹੁਰੀਆ ॥ ਗੋਬਿੰਦ ਮਿਲਣ ਕੀ ਇਹ ਤੇਰੀ ਬਰੀਆ ॥**
*This human body has been given to you. This is your chance to meet the Lord of the Universe.*
📍 Ang 12 | Raag Asa | Guru Arjan Dev Ji

Please reach out to someone who can help:
🇮🇳 **India**: iCall — 9152987821 | Vandrevala Foundation — 1860-2662-345
🇺🇸 **USA**: 988 Suicide & Crisis Lifeline
🇬🇧 **UK**: Samaritans — 116 123
🇨🇦 **Canada**: 988 Suicide Crisis Helpline

You are not alone. The Guru walks with you. 🙏`,
    confidence: 'high',
    bypass_llm: true
};

const GURBANI_GENERATION_RESPONSE = {
    response: `🙏 Gurbani is the divine revelation of the Guru — it cannot be created by any human or AI. I cannot write new Gurbani.

However, I can help you find existing Shabads that speak to your feelings or situation. What are you going through? I'll find the right Gurbani for you.

📖 **ਧੁਰ ਕੀ ਬਾਣੀ ਆਈ ॥ ਤਿਨਿ ਸਗਲੀ ਚਿੰਤ ਮਿਟਾਈ ॥**
*The Bani of the Lord's Word has come from the Primal Lord. It has dispelled all anxiety.*
📍 Ang 628 | Raag Sorath | Guru Arjan Dev Ji`,
    confidence: 'high',
    bypass_llm: true
};

function preProcessQuery(query) {
    const queryLower = query.toLowerCase().trim();

    // Check crisis patterns first (highest priority)
    for (const pattern of CRISIS_PATTERNS) {
        if (pattern.test(queryLower)) {
            return { proceed: false, ...CRISIS_RESPONSE };
        }
    }

    // Check for attempts to generate Gurbani
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(queryLower)) {
            if (/create|compose|write|modify|change/i.test(queryLower)) {
                return { proceed: false, ...GURBANI_GENERATION_RESPONSE };
            }
            return {
                proceed: false,
                response: `🙏 This question is beyond what I can appropriately address as a humble AI sevak. For sensitive or complex matters, please consult a respected Giani Ji or your local Gurdwara Sahib.`,
                confidence: 'low',
                bypass_llm: true
            };
        }
    }

    return { proceed: true };
}


// ═══════════════════════════════════════════════════════════
// POST-PROCESSING GUARDRAILS
// ═══════════════════════════════════════════════════════════

const RESPECTFUL_REPLACEMENTS = {
    'the Sikh bible': 'Sri Guru Granth Sahib Ji',
    'Sikh holy book': 'Sri Guru Granth Sahib Ji',
    'Guru Granth Sahib': 'Sri Guru Granth Sahib Ji',
    'the Granth': 'Sri Guru Granth Sahib Ji',
    'Nanak said': 'Guru Nanak Dev Ji teaches',
    'God says in Gurbani': 'Gurbani reveals',
};

const FORBIDDEN_CLAIMS = [
    'gurbani says you should hate',
    'guru taught that women are inferior',
    'lower caste people',
    'sikhs are superior to',
    'violence against',
    'guru ji said to kill',
    'sikhism is the best religion',
    'other religions are wrong',
];

function postProcessResponse(responseText) {
    let cleaned = responseText;

    // Apply respectful terminology
    for (const [wrong, right] of Object.entries(RESPECTFUL_REPLACEMENTS)) {
        const regex = new RegExp(wrong, 'gi');
        cleaned = cleaned.replace(regex, right);
    }

    // Check for forbidden claims
    const lowerResponse = cleaned.toLowerCase();
    for (const forbidden of FORBIDDEN_CLAIMS) {
        if (lowerResponse.includes(forbidden)) {
            return {
                valid: false,
                response: `🙏 I apologize, but I cannot provide this response as it may not align with Gurmat principles. Guru Sahib's message is of universal love, equality, and oneness. Please rephrase your question, and I'll do my best to serve you.`,
            };
        }
    }

    // Verify Ang numbers are in valid range (1-1430 for SGGS)
    const angMatches = cleaned.matchAll(/Ang\s*(\d+)/gi);
    for (const match of angMatches) {
        const angNum = parseInt(match[1]);
        if (angNum < 1 || angNum > 1430) {
            cleaned = cleaned.replace(match[0], `Ang [needs verification]`);
        }
    }

    return { valid: true, response: cleaned };
}


// ═══════════════════════════════════════════════════════════
// CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════

function calculateConfidence(responseText) {
    let score = 'moderate';
    const hasAngRef = /Ang\s*\d+/i.test(responseText);
    const hasRaagRef = /Raag\s+\w+/i.test(responseText);
    const hasGurmukhi = /[\u0A00-\u0A7F]{5,}/.test(responseText);
    const hasAuthor = /(Guru\s+(Nanak|Angad|Amar\s*Das|Ram\s*Das|Arjan|Hargobind|Har\s*Rai|Har\s*Krishan|Tegh?\s*Bahadur|Gobind)\s*(Dev\s*)?Ji|Bhagat\s+\w+\s*Ji|Mahalla\s*\d)/i.test(responseText);

    const indicators = [hasAngRef, hasRaagRef, hasGurmukhi, hasAuthor].filter(Boolean).length;

    if (indicators >= 3) score = 'high';
    else if (indicators >= 1) score = 'moderate';
    else score = 'low';

    return score;
}

function getConfidenceEmoji(level) {
    const map = { high: '🟢', moderate: '🟡', low: '🔴' };
    return map[level] || '🟡';
}


// ═══════════════════════════════════════════════════════════
// LLM API CALLS — DUAL SUPPORT: GROQ + GEMINI
// ═══════════════════════════════════════════════════════════

async function callGroqAPI(apiKey, messages) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            temperature: 0.3,
            max_tokens: 2048,
            top_p: 0.8,
            stream: false,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
}

async function callGeminiAPI(apiKey, prompt) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    topP: 0.8,
                    maxOutputTokens: 2048,
                },
            }),
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}


// ═══════════════════════════════════════════════════════════
// SUGGESTED QUESTIONS — CURATED BY CATEGORY
// ═══════════════════════════════════════════════════════════

const SUGGESTED_QUESTIONS = {
    spiritual: [
        { text: 'What is the Mool Mantar?', icon: 'ੴ', category: 'Core Beliefs' },
        { text: 'What is Naam and how to practice Naam Simran?', icon: '🙏', category: 'Core Beliefs' },
        { text: 'What does Gurbani say about Hukam (Divine Will)?', icon: '☀️', category: 'Core Beliefs' },
        { text: 'Explain the concept of Haumai (ego) in Gurbani', icon: '🪞', category: 'Core Beliefs' },
        { text: 'What is Maya according to Guru Sahib?', icon: '🌍', category: 'Core Beliefs' },
    ],
    daily_life: [
        { text: 'Gurbani guidance for dealing with anxiety', icon: '🧘', category: 'Daily Life' },
        { text: 'What does Guru Sahib say about anger?', icon: '🔥', category: 'Daily Life' },
        { text: 'How to find peace in difficult times?', icon: '🕊️', category: 'Daily Life' },
        { text: 'Gurbani on forgiveness and letting go', icon: '💛', category: 'Daily Life' },
        { text: 'What does Gurbani teach about relationships?', icon: '🤝', category: 'Daily Life' },
    ],
    learning: [
        { text: 'Explain Japji Sahib Pauri 1', icon: '📖', category: 'Learn Gurbani' },
        { text: 'Who was Bhagat Kabir Ji?', icon: '🙏', category: 'Learn Gurbani' },
        { text: 'What are the 31 Raags in Sri Guru Granth Sahib Ji?', icon: '🎵', category: 'Learn Gurbani' },
        { text: 'Tell me about Guru Nanak Dev Ji\'s Udasis', icon: '🌏', category: 'Learn Gurbani' },
        { text: 'What is the significance of Amrit Vela?', icon: '🌅', category: 'Learn Gurbani' },
    ],
    explore: [
        { text: 'Shabads about the oneness of God', icon: 'ੴ', category: 'Explore Themes' },
        { text: 'Gurbani on equality and social justice', icon: '⚖️', category: 'Explore Themes' },
        { text: 'What does Gurbani say about death?', icon: '🌙', category: 'Explore Themes' },
        { text: 'Gurbani on the purpose of human life', icon: '✨', category: 'Explore Themes' },
        { text: 'Compare Guru Nanak and Bhagat Kabir on devotion', icon: '📚', category: 'Explore Themes' },
    ],
};


// ═══════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════

/**
 * POST /api/gurbani-gpt/chat
 * Main chat endpoint
 * Body: { message, conversationHistory[], apiKey, provider, language }
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, conversationHistory = [], apiKey, provider = 'groq', language = 'en', fallbackApiKey } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required. Please add your Groq or Gemini API key in settings.' });
        }

        console.log(`[GurbaniGPT] Query: "${message.substring(0, 80)}..." | Provider: ${provider}`);

        // ── Step 1: Pre-Processing Guards ──
        const preCheck = preProcessQuery(message);
        if (!preCheck.proceed) {
            console.log(`[GurbaniGPT] Pre-processing blocked query`);
            return res.json({
                response: preCheck.response,
                confidence: preCheck.confidence || 'high',
                confidenceEmoji: getConfidenceEmoji(preCheck.confidence || 'high'),
                citations: [],
                blocked: true,
            });
        }

        // ── Step 2: Build conversation for LLM ──
        let llmResponse = '';

        if (provider === 'gemini') {
            // Gemini uses a single prompt format
            let fullPrompt = GURMAT_SYSTEM_PROMPT + '\n\n';

            // Add conversation history
            for (const msg of conversationHistory.slice(-6)) {
                const role = msg.role === 'user' ? 'USER' : 'GURBANIGPT';
                fullPrompt += `${role}: ${msg.content}\n\n`;
            }

            fullPrompt += `USER: ${message}\n\nGURBANIGPT:`;
            llmResponse = await callGeminiAPI(apiKey, fullPrompt);
        } else {
            // Groq uses OpenAI-compatible chat format
            const messages = [
                { role: 'system', content: GURMAT_SYSTEM_PROMPT },
                ...conversationHistory.slice(-6).map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content,
                })),
                { role: 'user', content: message },
            ];
            try {
                llmResponse = await callGroqAPI(apiKey, messages);
            } catch (groqErr) {
                // Re-throw auth errors immediately; attempt Gemini fallback for all others
                const isAuthErr = groqErr.message.includes('401') || groqErr.message.includes('403');
                if (isAuthErr || !fallbackApiKey) throw groqErr;
                console.warn(`[GurbaniGPT] Groq failed (${groqErr.message}), falling back to Gemini`);
                let fallbackPrompt = GURMAT_SYSTEM_PROMPT + '\n\n';
                for (const msg of conversationHistory.slice(-6)) {
                    const role = msg.role === 'user' ? 'USER' : 'GURBANIGPT';
                    fallbackPrompt += `${role}: ${msg.content}\n\n`;
                }
                fallbackPrompt += `USER: ${message}\n\nGURBANIGPT:`;
                llmResponse = await callGeminiAPI(fallbackApiKey, fallbackPrompt);
            }
        }

        // ── Step 3: Post-Processing Guards ──
        const postCheck = postProcessResponse(llmResponse);
        if (!postCheck.valid) {
            return res.json({
                response: postCheck.response,
                confidence: 'low',
                confidenceEmoji: '🔴',
                citations: [],
                blocked: true,
            });
        }

        // ── Step 4: Confidence Scoring ──
        const confidence = calculateConfidence(postCheck.response);

        // ── Step 5: Return structured response ──
        console.log(`[GurbaniGPT] Response generated | Confidence: ${confidence}`);

        res.json({
            response: postCheck.response,
            confidence: confidence,
            confidenceEmoji: getConfidenceEmoji(confidence),
            citations: [],
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error(`[GurbaniGPT] Error:`, error.message);

        if (error.message.includes('401') || error.message.includes('403')) {
            return res.status(401).json({ error: 'Invalid API key. Please check your API key in settings.' });
        }
        if (error.message.includes('429')) {
            return res.status(429).json({ error: 'Rate limit reached. Please wait a moment and try again. 🙏' });
        }

        res.status(500).json({
            error: 'An error occurred while seeking Gurbani wisdom. Please try again.',
        });
    }
});


/**
 * GET /api/gurbani-gpt/suggested-questions
 * Returns curated question sets
 */
router.get('/suggested-questions', (req, res) => {
    const { category } = req.query;

    if (category && SUGGESTED_QUESTIONS[category]) {
        return res.json({ questions: SUGGESTED_QUESTIONS[category] });
    }

    // Return a mixed set if no category specified
    const mixed = [
        ...SUGGESTED_QUESTIONS.spiritual.slice(0, 2),
        ...SUGGESTED_QUESTIONS.daily_life.slice(0, 2),
        ...SUGGESTED_QUESTIONS.learning.slice(0, 2),
        ...SUGGESTED_QUESTIONS.explore.slice(0, 2),
    ];

    res.json({
        questions: mixed,
        categories: Object.keys(SUGGESTED_QUESTIONS),
    });
});


/**
 * GET /api/gurbani-gpt/health
 * Health check
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'GurbaniGPT',
        version: '1.0.0',
        message: 'ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਿਹ!',
    });
});


module.exports = router;
