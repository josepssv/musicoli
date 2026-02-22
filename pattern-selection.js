// Pattern selection strategies for Tarareo
// Makes it easy to switch between different selection algorithms

const PatternSelectionStrategies = {

    /**
     * STRATEGY 1: Random Selection (current default)
     * Selects a random pattern from available options
     */
    random: function (patterns, syllables) {
        return patterns[Math.floor(Math.random() * patterns.length)];
    },

    /**
     * STRATEGY 2: Phonetic-Based Selection
     * Selects pattern based on syllable characteristics:
     * - Longer consonant clusters → longer notes
     * - Longer vowels → longer notes
     */
    phonetic: function (patterns, syllables) {
        if (!patterns || patterns.length === 0) return null;
        if (patterns.length === 1) return patterns[0]; // No choice, return the only option

        // Calculate phonetic weights for each syllable
        const weights = syllables.map(syl => calculatePhoneticWeight(syl.text));

        // Score each pattern based on how well it matches the phonetic weights
        const scoredPatterns = patterns.map(pattern => ({
            pattern: pattern,
            score: scorePatternMatch(pattern, weights)
        }));

        // Sort by score (higher is better match)
        scoredPatterns.sort((a, b) => b.score - a.score);

        // Select from top 3 patterns (adds some variety while staying phonetically appropriate)
        const topPatterns = scoredPatterns.slice(0, Math.min(3, scoredPatterns.length));
        const selected = topPatterns[Math.floor(Math.random() * topPatterns.length)];

        return selected.pattern;
    },

    /**
     * STRATEGY 3: Hybrid (Phonetic with Fallback)
     * Uses phonetic selection when there are multiple options,
     * falls back to random when there's limited choice
     */
    hybrid: function (patterns, syllables) {
        if (!patterns || patterns.length === 0) return null;
        if (patterns.length <= 2) {
            // Limited options, use random
            return PatternSelectionStrategies.random(patterns, syllables);
        }
        // Multiple options, use phonetic
        return PatternSelectionStrategies.phonetic(patterns, syllables);
    }
};

/**
 * Calculate phonetic weight of a syllable
 * Higher weight = should use longer note duration
 * 
 * Factors:
 * - Consonant cluster length (more consonants = heavier)
 * - Vowel length (diphthongs, long vowels = heavier)
 * - Syllable complexity
 */
function calculatePhoneticWeight(syllableText) {
    if (!syllableText) return 1;

    const text = syllableText.toLowerCase();
    let weight = 1; // Base weight

    // 1. Count consonants at the beginning (onset)
    const onsetConsonants = text.match(/^[^aeiouáéíóúü]+/);
    if (onsetConsonants) {
        const consonantCount = onsetConsonants[0].length;
        weight += consonantCount * 0.3; // Each consonant adds weight
    }

    // 2. Detect vowel type
    const vowels = text.match(/[aeiouáéíóúü]+/g);
    if (vowels) {
        vowels.forEach(vowelGroup => {
            if (vowelGroup.length >= 2) {
                // Diphthong or long vowel
                weight += 0.5;
            }
            // Stressed vowels (with accent) add weight
            if (/[áéíóú]/.test(vowelGroup)) {
                weight += 0.3;
            }
        });
    }

    // 3. Count consonants at the end (coda)
    const codaConsonants = text.match(/[^aeiouáéíóúü]+$/);
    if (codaConsonants) {
        const consonantCount = codaConsonants[0].length;
        weight += consonantCount * 0.2; // End consonants add less weight
    }

    // 4. Total syllable length factor
    if (text.length >= 4) {
        weight += 0.3; // Long syllables tend to need longer notes
    }

    return weight;
}

/**
 * Score how well a pattern matches the phonetic weights
 * Higher score = better match
 */
function scorePatternMatch(pattern, weights) {
    if (pattern.length !== weights.length) return 0;

    let score = 0;

    // Convert pattern codes to relative durations
    const patternDurations = pattern.map(code => {
        const absCode = Math.abs(code);
        // Map codes to relative duration values
        const durationMap = {
            1: 4,    // whole note
            2: 2,    // half note
            25: 3,   // dotted half
            3: 1,    // quarter note
            35: 1.5, // dotted quarter
            4: 0.5,  // eighth note
            45: 0.75,// dotted eighth
            5: 0.25  // sixteenth note
        };
        return durationMap[absCode] || 1;
    });

    // Normalize weights to similar scale as durations
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const weightRange = maxWeight - minWeight || 1;

    const maxDuration = Math.max(...patternDurations);
    const minDuration = Math.min(...patternDurations);
    const durationRange = maxDuration - minDuration || 1;

    // Calculate correlation between weights and durations
    for (let i = 0; i < weights.length; i++) {
        // Normalize weight to 0-1 range
        const normalizedWeight = (weights[i] - minWeight) / weightRange;
        // Normalize duration to 0-1 range
        const normalizedDuration = (patternDurations[i] - minDuration) / durationRange;

        // Calculate how close they are (inverse of difference)
        const difference = Math.abs(normalizedWeight - normalizedDuration);
        const similarity = 1 - difference;

        score += similarity;
    }

    // Average similarity across all syllables
    return score / weights.length;
}

/**
 * Main function to select a pattern using the active strategy
 */
function selectPattern(patterns, syllables, strategy = 'random') {
    const strategyFunc = PatternSelectionStrategies[strategy];

    if (!strategyFunc) {
        console.warn(`Unknown pattern selection strategy: ${strategy}, falling back to random`);
        return PatternSelectionStrategies.random(patterns, syllables);
    }

    return strategyFunc(patterns, syllables);
}

/**
 * Configuration: Active strategy
 * Change this to switch between strategies globally
 */
const ACTIVE_PATTERN_STRATEGY = 'random'; // Options: 'random', 'phonetic', 'hybrid'

/**
 * Helper function for easy strategy switching
 */
function setPatternStrategy(strategy) {
    if (PatternSelectionStrategies[strategy]) {
        window.ACTIVE_PATTERN_STRATEGY = strategy;
        console.log(`✓ Pattern selection strategy changed to: ${strategy}`);
        return true;
    }
    console.error(`✗ Unknown strategy: ${strategy}`);
    return false;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PatternSelectionStrategies,
        selectPattern,
        setPatternStrategy,
        calculatePhoneticWeight,
        scorePatternMatch
    };
}
