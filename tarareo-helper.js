// Simplified tarareo rhythm generation using trilipi patterns directly
// This replaces the complex phonetic weight system
// Multi-language ready: uses same algorithm for Spanish/English
// Language-specific settings are in tarareo-language-config.js

function processSyllablesWithTrilipi(word, silData, getDurationFromCode) {
    const events = [];

    if (silData && silData.silabas && silData.silabas.length > 0) {
        const syllables = silData.silabas.map((syl, idx) => ({
            text: syl.silaba,
            isTonic: (idx + 1) === silData.tonica
        }));

        const syllableCount = syllables.length;

        // Use trilipi rhythm patterns based on syllable count
        // Note: trilipi patterns work for both Spanish and English
        // The syllabification algorithm (silaba.js) is primarily Spanish-based,
        // but produces reasonable results for English as well
        if (syllableCount >= 1 && syllableCount <= 8 && typeof trilipi !== 'undefined' && trilipi[syllableCount]) {
            const patterns = trilipi[syllableCount];

            // Select pattern using voice-specific strategy
            // Each voice has its own strategy and time scaling:
            // - Soprano (S): random, normal time
            // - Alto (A): random, half time (descenso)
            // - Tenor (T): phonetic, normal time
            // - Bajo (B): phonetic, half time (descenso)
            let selectedPattern;

            if (typeof selectPattern === 'function') {
                // Get strategy for current voice
                let strategy = 'random'; // Default fallback
                let currentVoice = 's'; // Default
                let timeScale = 1.0; // Default

                if (typeof VoicePatternConfig !== 'undefined') {
                    strategy = VoicePatternConfig.getStrategyForCurrentVoice();
                    timeScale = VoicePatternConfig.getTimeScaleForCurrentVoice();

                    // Get current voice for logging
                    currentVoice = (typeof window !== 'undefined' && window.bdi && window.bdi.metadata)
                        ? window.bdi.metadata.voici
                        : 's';

                    // Debug logging
                    console.log(`🎵 Tarareo - Voz: ${currentVoice.toUpperCase()}, Estrategia: ${strategy}, Escala: ×${timeScale}, Palabra: "${word}"`);
                } else if (typeof ACTIVE_PATTERN_STRATEGY !== 'undefined') {
                    strategy = ACTIVE_PATTERN_STRATEGY;
                }

                selectedPattern = selectPattern(patterns, syllables, strategy);

                // Apply time scaling if configured for this voice
                if (typeof VoicePatternConfig !== 'undefined' && timeScale !== 1.0) {
                    const originalPattern = [...selectedPattern];
                    selectedPattern = VoicePatternConfig.scalePattern(selectedPattern, timeScale);
                    console.log(`  ⏱️ Descenso aplicado: [${originalPattern}] → [${selectedPattern}]`);
                }
            } else {
                // Fallback to simple random selection if pattern-selection.js not loaded
                selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
            }

            selectedPattern.forEach((rhythmCode, i) => {
                const syllable = syllables[i] || syllables[syllables.length - 1];
                const absCode = Math.abs(rhythmCode);

                events.push({
                    type: rhythmCode < 0 ? 'rest' : 'note',
                    code: absCode,
                    duration: getDurationFromCode(absCode),
                    text: rhythmCode < 0 ? '' : syllable.text,
                    accent: rhythmCode < 0 ? false : syllable.isTonic
                });
            });
        } else {
            // Fallback for words without trilipi patterns
            syllables.forEach(syl => {
                events.push({
                    type: 'note',
                    code: 3,
                    duration: 1,
                    text: syl.text,
                    accent: syl.isTonic
                });
            });
        }
    } else {
        // Fallback
        events.push({ type: 'note', duration: 1, code: 3, text: word, accent: false });
    }

    return events;
}
