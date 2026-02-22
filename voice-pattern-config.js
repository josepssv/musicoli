// Voice-specific pattern selection configuration
// Each voice can have its own strategy and time scaling

const VoicePatternConfig = {
    // Configuration for each voice
    voices: {
        s: {
            name: 'Soprano',
            strategy: 'random',
            timeScale: 1.0  // Normal duration
        },
        a: {
            name: 'Alto/Contralto',
            strategy: 'random',
            timeScale: 0.5  // Half duration (descenso de tiempos)
        },
        t: {
            name: 'Tenor',
            strategy: 'phonetic',
            timeScale: 1.0  // Normal duration
        },
        b: {
            name: 'Bajo',
            strategy: 'phonetic',
            timeScale: 0.5  // Half duration (descenso de tiempos)
        }
    },

    /**
     * Get configuration for a specific voice
     */
    getVoiceConfig(voiceId) {
        const voice = voiceId ? voiceId.toLowerCase() : 's';
        return this.voices[voice] || this.voices.s;
    },

    /**
     * Get strategy for current active voice
     */
    getStrategyForCurrentVoice() {
        // Get current active voice from window.bdi or default to 's'
        const currentVoice = (typeof window !== 'undefined' && window.bdi && window.bdi.metadata)
            ? window.bdi.metadata.voici
            : 's';

        const config = this.getVoiceConfig(currentVoice);
        return config.strategy;
    },

    /**
     * Get time scale for current active voice
     */
    getTimeScaleForCurrentVoice() {
        const currentVoice = (typeof window !== 'undefined' && window.bdi && window.bdi.metadata)
            ? window.bdi.metadata.voici
            : 's';

        const config = this.getVoiceConfig(currentVoice);
        return config.timeScale;
    },

    /**
     * Apply time scaling to a pattern
     * Converts rhythm codes to scaled versions
     */
    scalePattern(pattern, scale) {
        if (scale === 1.0) return pattern; // No scaling needed

        // Map of rhythm codes and their scaled equivalents
        // When scale = 0.5 (half time), we go to the next faster duration
        const scaleMap = {
            // scale 0.5 (half duration) - positive codes (notes)
            0.5: {
                1: 2,    // whole → half
                2: 3,    // half → quarter
                25: 35,  // dotted half → dotted quarter
                3: 4,    // quarter → eighth
                35: 45,  // dotted quarter → dotted eighth
                4: 5,    // eighth → sixteenth
                45: 5,   // dotted eighth → sixteenth (approximate)
                5: 5,    // sixteenth → sixteenth (can't go smaller)
                // Negative codes (rests)
                '-1': -2,
                '-2': -3,
                '-25': -35,
                '-3': -4,
                '-35': -45,
                '-4': -5,
                '-45': -5,
                '-5': -5
            }
        };

        const map = scaleMap[scale];
        if (!map) return pattern; // Unknown scale, return original

        return pattern.map(code => {
            const absCode = Math.abs(code);
            const isNegative = code < 0;

            // For negative codes, use string key
            if (isNegative) {
                const key = String(code);
                return map[key] !== undefined ? map[key] : code;
            }

            // For positive codes, use number directly
            return map[absCode] !== undefined ? map[absCode] : code;
        });
    },

    /**
     * Get info text for current voice configuration
     */
    getCurrentVoiceInfo() {
        const currentVoice = (typeof window !== 'undefined' && window.bdi && window.bdi.metadata)
            ? window.bdi.metadata.voici
            : 's';

        const config = this.getVoiceConfig(currentVoice);

        let info = `Voz ${config.name} (${currentVoice.toUpperCase()}): `;
        info += `Estrategia ${config.strategy}`;

        if (config.timeScale !== 1.0) {
            info += ` + Descenso de tiempos (×${config.timeScale})`;
        }

        return info;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoicePatternConfig;
}
