
// --- Helper Functions for Tarareo Strategies ---

function analyzeSyllableWeight(text, isTonic) {
    let weight = 1.0;
    if (isTonic) weight *= 1.5; // Tonic tends to be longer
    if (text.length > 2) weight *= 1.1; // Closed/Complex tends to be longer
    if (/[aeiouáéíóúü]{2}/i.test(text)) weight *= 1.2; // Diphthongs
    return weight;
}

function selectSmartPattern(patterns, syllables) {
    if (!patterns || patterns.length === 0) return [];

    // Calculate syllable weight profile
    const sylWeights = syllables.map(s => analyzeSyllableWeight(s.text, s.isTonic));
    const totalWeight = sylWeights.reduce((a, b) => a + b, 0) || 1;
    const relativeSylWeights = sylWeights.map(w => w / totalWeight);

    const getDur = (c) => {
        const m = { 1: 4, 2: 2, 25: 3, 3: 1, 35: 1.5, 4: 0.5, 45: 0.75, 5: 0.25 };
        return m[Math.abs(c)] || 1;
    };

    let bestPattern = patterns[0];
    let minError = Infinity;

    patterns.forEach(pat => {
        const patDurs = pat.map(c => getDur(c));
        const totalDur = patDurs.reduce((a, b) => a + b, 0) || 1;
        const relativePatDurs = patDurs.map(d => d / totalDur);

        let error = 0;
        // Compare only up to the shorter length to avoid IndexOutOfBounds
        const len = Math.min(relativeSylWeights.length, relativePatDurs.length);

        for (let i = 0; i < len; i++) {
            error += Math.pow(relativePatDurs[i] - relativeSylWeights[i], 2);
        }
        // Penalty for length mismatch?
        error += Math.abs(relativeSylWeights.length - relativePatDurs.length) * 10;

        if (error < minError) {
            minError = error;
            bestPattern = pat;
        }
    });

    return bestPattern;
}

// -----------------------------------------------
