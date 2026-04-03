/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LIVE KIRTAN TRACKER
 * Real-time Gurbani tracking with speech recognition
 * 
 * Features:
 * - 3-phase state machine: IDLE → IDENTIFYING → LOCKED
 * - Web Speech API with auto-restart (Chrome desktop best for pa-IN)
 * - Fuzzy matching with Levenshtein distance
 * - Rahao verse detection and highlighting
 * - API debouncing to prevent hammering BaniDB
 * 
 * Browser Note: Punjabi ASR (pa-IN) works best in Chrome Desktop.
 * Safari/Firefox may have degraded accuracy.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

(function() {
    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════

    const API_BASE = 'https://api.banidb.com/v2';
    const SAMPLE_INTERVAL = 3000; // 3 seconds
    const MAX_RESTARTS = 50; // Increased from 10 for longer sessions
    const SIMILARITY_THRESHOLD = 0.45; // Lowered from 0.65 for better matching
    const API_DEBOUNCE_CHANGE_THRESHOLD = 0.30; // 30% text change required
    const MAX_API_INTERVAL = 6000; // Max 6s between calls even if text similar
    const RAHAAO_PULSE_DURATION = 2500; // 2.5s pulse after verse
    const TRANSCRIPT_BUFFER_DURATION = 10000; // 10s rolling buffer

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════════

    const trackerState = {
        mode: 'idle', // 'idle' | 'identifying' | 'locked'
        lockedShabadId: null,
        verses: [],
        currentVerseIndex: -1,
        rahaoVerseIndices: [],
        isListening: false,
        transcriptBuffer: [], // Array of { text, timestamp }
        lastProcessedText: '',
        lastApiCallTime: 0,
        searchInterval: null,
        recognitionRestartCount: 0,
        recognition: null,
        autoScrollEnabled: true,
        isPaused: false
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GURMUKHI MATRAS (reuse from main file)
    // ═══════════════════════════════════════════════════════════════════════════

    const GURMUKHI_MATRAS = /[\u0A3E-\u0A4C\u0A3C\u0A4D\u0A70\u0A71]/g;

    // ═══════════════════════════════════════════════════════════════════════════
    // DOM REFERENCES
    // ═══════════════════════════════════════════════════════════════════════════

    const elements = {
        // Trigger
        liveKirtanCard: document.getElementById('liveKirtanCard'),
        
        // Overlay
        liveKirtanOverlay: document.getElementById('liveKirtanOverlay'),
        liveKirtanClose: document.getElementById('liveKirtanClose'),
        
        // Header
        micStatus: document.getElementById('micStatus'),
        micPulse: document.getElementById('micPulse'),
        micText: document.getElementById('micText'),
        
        // Transcript
        transcriptText: document.getElementById('transcriptText'),
        
        // States
        searchingState: document.getElementById('searchingState'),
        lockedState: document.getElementById('lockedState'),
        shabadInfo: document.getElementById('shabadInfo'),
        versesContainer: document.getElementById('versesContainer'),
        
        // Controls
        unlockBtn: document.getElementById('unlockBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        autoScrollBtn: document.getElementById('autoScrollBtn')
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        console.log('🎙️ Live Kirtan Tracker initializing...');

        // Check Web Speech API support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('[Live Kirtan] Web Speech API not supported');
            if (elements.liveKirtanCard) {
                elements.liveKirtanCard.style.opacity = '0.5';
                elements.liveKirtanCard.title = 'Speech recognition not supported in this browser. Chrome desktop recommended.';
            }
            return;
        }

        // Setup event listeners
        setupEventListeners();

        console.log('✅ Live Kirtan Tracker ready');
    }

    function setupEventListeners() {
        // Open panel
        elements.liveKirtanCard?.addEventListener('click', openPanel);
        
        // Close panel
        elements.liveKirtanClose?.addEventListener('click', closePanel);
        elements.liveKirtanOverlay?.querySelector('.live-kirtan-backdrop')?.addEventListener('click', closePanel);
        
        // Controls
        elements.unlockBtn?.addEventListener('click', unlockShabad);
        elements.pauseBtn?.addEventListener('click', togglePause);
        elements.autoScrollBtn?.addEventListener('click', toggleAutoScroll);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PANEL CONTROL
    // ═══════════════════════════════════════════════════════════════════════════

    function openPanel() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in this browser. Please use Chrome desktop for best Punjabi (pa-IN) support.');
            return;
        }

        console.log('[Live Kirtan] Opening panel...');
        
        // Show overlay
        elements.liveKirtanOverlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Reset state
        resetState();
        
        // Enter identifying mode
        enterIdentifyingMode();
    }

    function closePanel() {
        console.log('[Live Kirtan] Closing panel...');
        
        // Stop listening
        stopListening();
        
        // Hide overlay
        elements.liveKirtanOverlay?.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset state
        resetState();
    }

    function resetState() {
        trackerState.mode = 'idle';
        trackerState.lockedShabadId = null;
        trackerState.verses = [];
        trackerState.currentVerseIndex = -1;
        trackerState.rahaoVerseIndices = [];
        trackerState.transcriptBuffer = [];
        trackerState.lastProcessedText = '';
        trackerState.lastApiCallTime = 0;
        trackerState.recognitionRestartCount = 0;
        trackerState.isPaused = false;
        
        // Clear interval
        if (trackerState.searchInterval) {
            clearInterval(trackerState.searchInterval);
            trackerState.searchInterval = null;
        }
        
        // Reset UI
        elements.searchingState?.classList.remove('hidden');
        elements.lockedState?.classList.add('hidden');
        elements.transcriptText.textContent = '...';
        updateMicStatus('idle');
        updatePauseButton();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MODE TRANSITIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function enterIdentifyingMode() {
        console.log('[Live Kirtan] Entering IDENTIFYING mode');
        trackerState.mode = 'identifying';
        
        // Show searching state
        elements.searchingState?.classList.remove('hidden');
        elements.lockedState?.classList.add('hidden');
        
        // Start listening
        startListening();
        
        // Start processing loop
        trackerState.searchInterval = setInterval(processTranscript, SAMPLE_INTERVAL);
        
        updateMicStatus('listening');
    }

    function enterLockedMode(shabadId) {
        console.log('[Live Kirtan] Entering LOCKED mode for shabad:', shabadId);
        trackerState.mode = 'locked';
        trackerState.lockedShabadId = shabadId;
        trackerState.recognitionRestartCount = 0; // Reset restart count on successful lock
        
        // Fetch and display shabad
        fetchShabad(shabadId).then(() => {
            elements.searchingState?.classList.add('hidden');
            elements.lockedState?.classList.remove('hidden');
            updateMicStatus('tracking');
        });
    }

    function unlockShabad() {
        console.log('[Live Kirtan] Unlocking shabad...');
        trackerState.lockedShabadId = null;
        trackerState.verses = [];
        trackerState.currentVerseIndex = -1;
        trackerState.rahaoVerseIndices = [];
        
        // Clear verses display
        elements.versesContainer.innerHTML = '';
        elements.shabadInfo.innerHTML = '';
        
        // Back to identifying
        enterIdentifyingMode();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SPEECH RECOGNITION - Two Phase: 1) Shabad Detection 2) Live Verse Tracking
    // ═══════════════════════════════════════════════════════════════════════════

    let recognitionInstance = null;
    let transcriptBuffer = '';
    let lastProcessedBuffer = '';
    let verseTrackingMode = false;

    function startListening() {
        if (trackerState.isPaused) return;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        // Stop any existing recognition
        stopListening();

        recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true; // CRITICAL: For live caption feel
        recognitionInstance.lang = 'pa-IN';
        recognitionInstance.maxAlternatives = 1;

        recognitionInstance.onstart = () => {
            console.log('[Live Kirtan] Recognition started');
            trackerState.isListening = true;
            updateMicStatus(verseTrackingMode ? 'tracking' : 'listening');
        };

        recognitionInstance.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            // Combine final + interim for live feel
            const currentTranscript = (transcriptBuffer + finalTranscript + interimTranscript).trim();
            
            if (currentTranscript) {
                elements.transcriptText.textContent = currentTranscript;
                
                // PHASE 1: Shabad Detection - Use full Gurmukhi text
                if (!verseTrackingMode && trackerState.mode === 'identifying') {
                    handleShabadDetection(currentTranscript, finalTranscript);
                }
                // PHASE 2: Live Verse Tracking - Use first initials
                else if (verseTrackingMode && trackerState.mode === 'locked') {
                    handleLiveVerseTracking(currentTranscript);
                }
            }
        };

        recognitionInstance.onerror = (event) => {
            console.log('[Live Kirtan] Speech error:', event.error);
            if (event.error === 'not-allowed') {
                alert('Microphone access denied.');
                closePanel();
            }
            // Auto-restart on other errors
            if (trackerState.mode !== 'idle' && !trackerState.isPaused) {
                setTimeout(startListening, 500);
            }
        };

        recognitionInstance.onend = () => {
            console.log('[Live Kirtan] Recognition ended');
            trackerState.isListening = false;
            
            // Auto-restart if still active
            if (trackerState.mode !== 'idle' && !trackerState.isPaused) {
                setTimeout(startListening, 200);
            }
        };

        try {
            recognitionInstance.start();
        } catch (e) {
            console.error('[Live Kirtan] Start failed:', e);
            setTimeout(startListening, 1000);
        }
    }

    // PHASE 1: Detect Shabad from full Gurmukhi line
    async function handleShabadDetection(currentText, isFinal) {
        // Only search when we have enough text (6+ words) OR final result with 3+ words
        const wordCount = currentText.split(/\s+/).length;
        const hasEnoughWords = wordCount >= 6 || (isFinal && wordCount >= 3);
        
        // Debounce: don't search same text twice
        if (currentText === lastProcessedBuffer) return;
        
        if (hasEnoughWords) {
            lastProcessedBuffer = currentText;
            console.log('[Live Kirtan] Searching shabad with:', currentText);
            
            try {
                // Use Gurmukhi search (searchtype=1) for accurate results
                const url = `${API_BASE}/search/${encodeURIComponent(currentText)}?searchtype=1&source=G&results=10`;
                const response = await fetch(url);
                const data = await response.json();
                const verses = data.verses || [];
                
                if (verses.length > 0) {
                    const topResult = verses[0];
                    const gurmukhi = topResult.verse?.unicode || '';
                    
                    // Calculate similarity to ensure accuracy
                    const similarity = calculateSimilarity(currentText, gurmukhi);
                    console.log('[Live Kirtan] Top match similarity:', similarity.toFixed(3));
                    
                    // Only lock if similarity is good (0.5+) or it's the only result
                    if (similarity >= 0.5 || verses.length === 1) {
                        const shabadId = topResult.shabadId;
                        console.log('[Live Kirtan] ✓ LOCKING to shabad:', shabadId);
                        
                        elements.transcriptText.textContent = `🔒 ${gurmukhi.substring(0, 40)}...`;
                        
                        if (typeof showToast === 'function') {
                            showToast('🔒 Shabad Locked!');
                        }
                        
                        // Switch to verse tracking mode
                        verseTrackingMode = true;
                        transcriptBuffer = ''; // Clear buffer
                        lastProcessedBuffer = '';
                        
                        await enterLockedMode(shabadId);
                    }
                }
            } catch (error) {
                console.error('[Live Kirtan] Search error:', error);
            }
        }
    }

    // PHASE 2: Live caption-style verse tracking with first initials
    function handleLiveVerseTracking(currentText) {
        // Extract first 2-3 initials from each word
        const initials = extractWordInitials(currentText);
        
        if (initials.length < 2) return;
        
        console.log('[Live Kirtan] Live initials:', initials.join(' '));
        
        // Find matching verse in real-time
        let bestMatch = -1;
        let bestScore = 0;
        
        for (let i = 0; i < trackerState.verses.length; i++) {
            const verse = trackerState.verses[i];
            const verseInitials = verse.initials || extractWordInitials(verse.gurmukhi);
            
            // Cache initials for performance
            if (!verse.initials) {
                verse.initials = verseInitials;
            }
            
            // Calculate match score based on initials overlap
            let matchScore = 0;
            const minLen = Math.min(initials.length, verseInitials.length);
            
            for (let j = 0; j < minLen; j++) {
                if (initials[j] === verseInitials[j]) {
                    matchScore++;
                } else {
                    // Partial credit for similar sounds could be added here
                    break;
                }
            }
            
            // Weight by how much of the verse we matched
            const coverage = matchScore / verseInitials.length;
            const finalScore = matchScore * coverage;
            
            if (finalScore > bestScore && matchScore >= 2) {
                bestScore = finalScore;
                bestMatch = i;
            }
        }
        
        // Highlight if we found a match and it's different from current
        if (bestMatch >= 0 && bestMatch !== trackerState.currentVerseIndex) {
            highlightVerse(bestMatch);
            
            // Show initials match feedback
            const matchedInitials = trackerState.verses[bestMatch].initials?.slice(0, initials.length).join('') || '';
            elements.transcriptText.textContent = `${currentText} → ${matchedInitials} ✓`;
        }
    }

    // Extract first 2-3 letters from each word for matching
    function extractWordInitials(text) {
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const initials = [];
        
        for (const word of words) {
            const initial = extractFirstLetters(word);
            if (initial) {
                initials.push(initial);
            }
        }
        
        return initials;
    }

    function stopListening() {
        if (recognitionInstance) {
            try {
                recognitionInstance.stop();
            } catch (e) {}
            recognitionInstance = null;
        }
        trackerState.isListening = false;
        transcriptBuffer = '';
        verseTrackingMode = false;
    }

    function resetState() {
        trackerState.mode = 'idle';
        trackerState.lockedShabadId = null;
        trackerState.verses = [];
        trackerState.currentVerseIndex = -1;
        trackerState.rahaoVerseIndices = [];
        trackerState.isPaused = false;
        
        transcriptBuffer = '';
        lastProcessedBuffer = '';
        verseTrackingMode = false;
        
        // Clear interval if any
        if (trackerState.searchInterval) {
            clearInterval(trackerState.searchInterval);
            trackerState.searchInterval = null;
        }
        
        // Reset UI
        elements.searchingState?.classList.remove('hidden');
        elements.lockedState?.classList.add('hidden');
        elements.transcriptText.textContent = '...';
        updateMicStatus('idle');
        updatePauseButton();
    }

    function togglePause() {
        trackerState.isPaused = !trackerState.isPaused;
        
        if (trackerState.isPaused) {
            console.log('[Live Kirtan] Paused');
            if (trackerState.recognition) {
                try {
                    trackerState.recognition.stop();
                } catch (e) {}
            }
            updateMicStatus('paused');
        } else {
            console.log('[Live Kirtan] Resumed');
            startListening();
            updateMicStatus(trackerState.mode === 'locked' ? 'tracking' : 'listening');
        }
        
        updatePauseButton();
    }

    function updatePauseButton() {
        if (elements.pauseBtn) {
            elements.pauseBtn.textContent = trackerState.isPaused ? '▶ Resume' : '⏸ Pause';
        }
    }

    function toggleAutoScroll() {
        trackerState.autoScrollEnabled = !trackerState.autoScrollEnabled;
        if (elements.autoScrollBtn) {
            elements.autoScrollBtn.classList.toggle('active', trackerState.autoScrollEnabled);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TRANSCRIPT PROCESSING & API DEBOUNCING
    // ═══════════════════════════════════════════════════════════════════════════

    async function processTranscript() {
        if (trackerState.mode === 'idle' || trackerState.isPaused) {
            console.log('[Live Kirtan] Skipping - mode:', trackerState.mode, 'paused:', trackerState.isPaused);
            return;
        }
        
        // Get latest transcript from buffer
        if (trackerState.transcriptBuffer.length === 0) {
            console.log('[Live Kirtan] No transcript in buffer yet');
            return;
        }
        
        const latestEntry = trackerState.transcriptBuffer[trackerState.transcriptBuffer.length - 1];
        const currentText = latestEntry.text.trim();
        
        if (!currentText) {
            console.log('[Live Kirtan] Empty transcript');
            return;
        }
        
        console.log('[Live Kirtan] Processing transcript:', currentText);
        
        // For testing - just search immediately without debouncing
        // Update tracking
        trackerState.lastProcessedText = currentText;
        trackerState.lastApiCallTime = Date.now();
        
        // Process based on mode
        if (trackerState.mode === 'identifying') {
            console.log('[Live Kirtan] Searching for shabad...');
            await searchForShabad(currentText);
        } else if (trackerState.mode === 'locked') {
            console.log('[Live Kirtan] Tracking verse in shabad...');
            await trackVerseInShabad(currentText);
        }
    }

    function hasTextChangedMeaningfully(oldText, newText) {
        if (!oldText || !newText) return true;
        
        const normalizedOld = normalizeText(oldText);
        const normalizedNew = normalizeText(newText);
        
        if (normalizedOld === normalizedNew) return false;
        
        // Calculate similarity
        const similarity = calculateSimilarity(normalizedOld, normalizedNew);
        const changed = (1 - similarity) > API_DEBOUNCE_CHANGE_THRESHOLD;
        
        return changed;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHABAD IDENTIFICATION
    // ═══════════════════════════════════════════════════════════════════════════

    async function searchForShabad(transcript) {
        console.log('[Live Kirtan] Searching BaniDB for:', transcript);
        
        try {
            const encodedQuery = encodeURIComponent(transcript);
            const url = `${API_BASE}/search/${encodedQuery}?searchtype=1&source=G&results=20`;
            
            console.log('[Live Kirtan] API URL:', url);
            
            const response = await fetch(url);
            console.log('[Live Kirtan] API response status:', response.status);
            
            if (!response.ok) throw new Error(`API returned ${response.status}`);
            
            const data = await response.json();
            console.log('[Live Kirtan] API data:', data);
            
            const verses = data.verses || [];
            console.log('[Live Kirtan] Found verses:', verses.length);
            
            // Visual debug for raw API results
            let apiDebugEl = document.getElementById('apiDebugInfo');
            if (!apiDebugEl) {
                apiDebugEl = document.createElement('div');
                apiDebugEl.id = 'apiDebugInfo';
                apiDebugEl.style.cssText = 'font-size: 11px; color: #0066cc; margin-top: 4px; font-family: monospace;';
                elements.transcriptText.parentNode.appendChild(apiDebugEl);
            }
            
            if (verses.length === 0) {
                console.log('[Live Kirtan] No search results');
                apiDebugEl.textContent = 'API: No results found';
                return;
            }
            
            // Use BaniDB's top result directly - it's already ranked by relevance
            // Just verify it has some minimum relevance by checking if search terms appear
            const topResult = verses[0];
            const gurmukhi = topResult.verse?.unicode || topResult.gurmukhi || '';
            
            console.log('[Live Kirtan] Top result:', gurmukhi.substring(0, 50));
            apiDebugEl.innerHTML = `API: Found ${verses.length} results<br>Top: ${gurmukhi.substring(0, 40)}...`;
            
            // Simple check: does the result have any similarity at all?
            // Calculate similarity but be more lenient
            const similarity = calculateSimilarity(transcript, gurmukhi);
            console.log(`[Live Kirtan] Similarity to top result: ${similarity.toFixed(3)}`);
            
            // LOCK if we have ANY result from BaniDB (they're already filtered by the API)
            // OR if similarity is above threshold
            if (verses.length > 0 && (similarity >= 0.25 || verses.length === 1)) {
                const shabadId = topResult.shabadId;
                console.log('[Live Kirtan] ✓ LOCKING onto shabad:', shabadId, 'Similarity:', similarity.toFixed(3));
                
                // Show lock confirmation
                showLockToast(topResult, similarity);
                
                // Enter locked mode
                enterLockedMode(shabadId);
            } else {
                console.log('[Live Kirtan] No suitable match found');
            }
            
        } catch (error) {
            console.error('[Live Kirtan] Search error:', error);
        }
    }

    function showLockToast(verse, score) {
        const shabadName = verse.verse?.unicode?.substring(0, 30) + '...' || 'Unknown Shabad';
        const raag = verse.raag?.english || '';
        const writer = verse.writer?.english || '';
        
        const info = [raag, writer].filter(Boolean).join(' • ');
        
        // Use existing toast system if available
        if (typeof showToast === 'function') {
            showToast(`🔒 Locked: ${info} (${(score * 100).toFixed(0)}% match)`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHABAD FETCHING & DISPLAY
    // ═══════════════════════════════════════════════════════════════════════════

    async function fetchShabad(shabadId) {
        console.log('[Live Kirtan] Fetching shabad:', shabadId);
        
        try {
            const url = `${API_BASE}/shabads/${shabadId}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`API returned ${response.status}`);
            
            const data = await response.json();
            const verses = data.verses || [];
            
            // Process verses
            trackerState.verses = verses.map((verse, index) => ({
                id: verse.verseId,
                shabadId: verse.shabadId,
                gurmukhi: verse.verse?.unicode || '',
                transliteration: verse.transliteration?.english || '',
                translation: verse.translation?.en?.bdb || verse.translation?.en?.ms || '',
                pageNo: verse.pageNo,
                isRahao: detectRahao(verse),
                index: index
            }));
            
            // Detect rahao verses
            trackerState.rahaoVerseIndices = trackerState.verses
                .filter(v => v.isRahao)
                .map(v => v.index);
            
            // Display shabad info
            displayShabadInfo(data);
            
            // Display verses
            displayVerses();
            
        } catch (error) {
            console.error('[Live Kirtan] Fetch shabad error:', error);
        }
    }

    function detectRahao(verse) {
        const gurmukhi = verse.verse?.unicode || verse.gurmukhi || '';
        return gurmukhi.includes('ਰਹਾਉ');
    }

    function displayShabadInfo(data) {
        const firstVerse = data.verses?.[0];
        if (!firstVerse) return;
        
        const raag = firstVerse.raag?.unicode || firstVerse.raag?.english || '';
        const writer = firstVerse.writer?.unicode || firstVerse.writer?.english || '';
        const pageNo = firstVerse.pageNo || '';
        
        elements.shabadInfo.innerHTML = `
            <div class="shabad-meta">
                ${raag ? `<span class="meta-item">${raag}</span>` : ''}
                ${writer ? `<span class="meta-item">${writer}</span>` : ''}
                ${pageNo ? `<span class="meta-item">Ang ${pageNo}</span>` : ''}
            </div>
        `;
    }

    function displayVerses() {
        elements.versesContainer.innerHTML = trackerState.verses.map((verse, index) => `
            <div class="verse-item ${verse.isRahao ? 'verse--rahao' : ''}" data-index="${index}" id="verse-${index}">
                ${verse.isRahao ? '<span class="rahao-badge">ਰਹਾਉ</span>' : ''}
                <p class="verse-gurmukhi">${escapeHtml(verse.gurmukhi)}</p>
                ${verse.transliteration ? `<p class="verse-transliteration">${escapeHtml(verse.transliteration)}</p>` : ''}
            </div>
        `).join('');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VERSE TRACKING (LOCKED MODE)
    // ═══════════════════════════════════════════════════════════════════════════

    async function trackVerseInShabad(transcript) {
        if (trackerState.verses.length === 0) return;
        
        // Find best matching verse in locked shabad
        let bestMatch = null;
        let bestScore = 0;
        
        for (const verse of trackerState.verses) {
            const similarity = calculateSimilarity(transcript, verse.gurmukhi);
            
            if (similarity > bestScore) {
                bestScore = similarity;
                bestMatch = verse;
            }
        }
        
        // Only highlight if above threshold
        if (bestMatch && bestScore >= SIMILARITY_THRESHOLD * 0.85) { // Slightly lower threshold for locked mode
            if (bestMatch.index !== trackerState.currentVerseIndex) {
                highlightVerse(bestMatch.index);
            }
        }
    }

    function highlightVerse(index) {
        const previousIndex = trackerState.currentVerseIndex;
        trackerState.currentVerseIndex = index;
        
        // Remove active class from previous
        if (previousIndex >= 0) {
            const prevElement = document.getElementById(`verse-${previousIndex}`);
            prevElement?.classList.remove('verse--active');
        }
        
        // Add active class to current
        const currentElement = document.getElementById(`verse-${index}`);
        if (currentElement) {
            currentElement.classList.add('verse--active');
            
            // Auto-scroll if enabled
            if (trackerState.autoScrollEnabled) {
                currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        // Handle Rahao transition
        const verse = trackerState.verses[index];
        if (verse && !verse.isRahao && previousIndex >= 0) {
            handleRahaoTransition(previousIndex, index);
        }
    }

    function handleRahaoTransition(fromIndex, toIndex) {
        // Find the next rahao verse after the current position
        const nextRahaoIndex = trackerState.rahaoVerseIndices.find(idx => idx > toIndex);
        
        if (nextRahaoIndex !== undefined) {
            // Pulse the rahao verse briefly
            setTimeout(() => {
                const rahaoElement = document.getElementById(`verse-${nextRahaoIndex}`);
                if (rahaoElement) {
                    rahaoElement.classList.add('verse--pulse');
                    
                    // Briefly scroll to it
                    if (trackerState.autoScrollEnabled) {
                        rahaoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    
                    // Remove pulse after duration
                    setTimeout(() => {
                        rahaoElement.classList.remove('verse--pulse');
                    }, RAHAAO_PULSE_DURATION);
                }
            }, 500); // Small delay after verse highlight
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEXT SIMILARITY (Levenshtein Distance)
    // ═══════════════════════════════════════════════════════════════════════════

    function normalizeText(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .replace(/\s+/g, '') // Remove all spaces
            .replace(GURMUKHI_MATRAS, '') // Strip matras
            .replace(/[^\u0A00-\u0A7Fa-zA-Z0-9]/g, ''); // Keep only Gurmukhi and alphanumeric
    }

    function levenshteinDistance(a, b) {
        const matrix = [];
        
        // Initialize matrix
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        
        // Fill matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b[i - 1] === a[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // Substitution
                        matrix[i][j - 1] + 1,     // Insertion
                        matrix[i - 1][j] + 1      // Deletion
                    );
                }
            }
        }
        
        return matrix[b.length][a.length];
    }

    function calculateSimilarity(a, b) {
        const normalizedA = normalizeText(a);
        const normalizedB = normalizeText(b);
        
        console.log(`[Live Kirtan] Similarity calc: "${a}" -> "${normalizedA}" vs "${b}" -> "${normalizedB}"`);
        
        if (!normalizedA || !normalizedB) return 0;
        if (normalizedA === normalizedB) {
            console.log('[Live Kirtan] Perfect match!');
            return 1;
        }
        
        const distance = levenshteinDistance(normalizedA, normalizedB);
        const maxLen = Math.max(normalizedA.length, normalizedB.length);
        const similarity = maxLen === 0 ? 1 : 1 - (distance / maxLen);
        
        console.log(`[Live Kirtan] Distance: ${distance}, MaxLen: ${maxLen}, Similarity: ${similarity.toFixed(3)}`);
        
        return similarity;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UI HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    function updateMicStatus(status) {
        if (!elements.micStatus) return;
        
        const statusClasses = {
            idle: 'mic--idle',
            listening: 'mic--listening',
            tracking: 'mic--tracking',
            paused: 'mic--paused',
            error: 'mic--error'
        };
        
        // Remove all status classes
        Object.values(statusClasses).forEach(cls => {
            elements.micStatus.classList.remove(cls);
        });
        
        // Add current status class
        if (statusClasses[status]) {
            elements.micStatus.classList.add(statusClasses[status]);
        }
        
        // Update text
        const statusTexts = {
            idle: 'Ready',
            listening: 'Listening...',
            tracking: 'Tracking Shabad',
            paused: 'Paused',
            error: 'Mic Error'
        };
        
        if (elements.micText) {
            elements.micText.textContent = statusTexts[status] || status;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════════════════

    // Expose to global scope for integration with main file
    window.LiveKirtanTracker = {
        init,
        openPanel,
        closePanel
    };

    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
