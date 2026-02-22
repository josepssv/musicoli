
// ============================================
// MELODIC GENERATION HELPERS
// ============================================

/**
 * Analyzes the structure of a syllable to determine its melodic weight.
 * Splits into: Pre-Vowel (Onset), Nucleus (Vowel/Diphthong), Post-Vowel (Coda)
 * @param {string} text - The syllable text
 * @returns {Object} { pre: number, post: number, hasDiphthong: boolean }
 */
function analyzeSyllableMelodic(text) {
    if (!text) return { pre: 0, post: 0, hasDiphthong: false };

    // Regex for vowels (Spanish + u/i weak vowels)
    // We treat 'y' as vowel if it's at the end or acting as one?
    // For simplicity, let's use standard vowels.
    // 'u' in 'gue'/'que' is tricky. silaba.js handles phonetics internally but we only have text.
    // Hack: if 'gue', 'gui', 'que', 'qui', treat 'u' as consonant (part of digraph).
    // otherwise 'u' is vowel.

    let processedText = text.toLowerCase();

    // Replace digraphs to simplify vowel search
    // qu -> k (consonant)
    // gu -> g (consonant) ONLY before e/i ?
    // "guerra" -> gue -> g(consonant).
    // "bilingüe" -> ü is vowel.

    // We can just normalize 'qu' to 'k' and 'gu[ei]' to 'g[ei]'?
    // But 'gui' has 'u' silent. 'gua' has 'u' sounded.

    // Let's rely on standard regex for vowels and handle 'qu' specially.
    // If we replace 'qu' with 'k', 'que' -> 'ke'. Vowel 'e'. Pre 'k'(1). Post 0.
    // This matches: 'qu' is 2 letters but 1 phoneme. User said "consonant".
    // If user counts LETTERS: 'q', 'u'.
    // "consonante que haya posterior es la vocal" -> implies distinct consonants.
    // If strict phonetic: 'qu' = /k/. 1 consonant.
    // If orthographic: 'q', 'u'. 'u' is vowel letter but here silent.
    // Let's try to be orthographically smart.

    // Simple approach: vowels are aeiouáéíóúü.
    // But exclude 'u' if preceded by 'q' or 'g' and followed by 'e'/'i' (unless 'ü').

    // Find FIRST true vowel sound.

    const isVowel = (char, prev, next) => {
        const v = /[aeiouáéíóúü]/i.test(char);
        if (!v) return false;

        // Handle silent 'u'
        if (char === 'u' || char === 'U') {
            const p = prev ? prev.toLowerCase() : '';
            const n = next ? next.toLowerCase() : '';
            if ((p === 'q' || p === 'g') && (n === 'e' || n === 'i' || n === 'é' || n === 'í')) {
                return false; // Silent u
            }
        }
        return true;
    };

    let firstVowelIdx = -1;
    let lastVowelIdx = -1;
    let vowelCount = 0; // Contiguous block

    for (let i = 0; i < processedText.length; i++) {
        const char = processedText[i];
        const prev = i > 0 ? processedText[i - 1] : '';
        const next = i < processedText.length - 1 ? processedText[i + 1] : '';

        if (isVowel(char, prev, next)) {
            if (firstVowelIdx === -1) firstVowelIdx = i;
            lastVowelIdx = i;
            // Detect hiatus? silaba.js splits hiatus into syllables. 
            // So we assume contiguous vowels in one syllable are a diphthong/triptong.
        } else {
            // If we already found vowels and now hit a consonant, stop? 
            // No, find the Nucleus (main vowel block).
            // Usually valid syllables only have one nucleus block.
            // e.g. "buey" (u-e-y? y is semi-vowel).

            // If we found a block and now hit consonant, we consider nucleus closed.
            if (firstVowelIdx !== -1) {
                // If we hit a separator, we stop?
                // But we iterate full string.
                // Assuming simple structure C* V+ C*
            }
        }
    }

    // If no vowel found (e.g. "y" as conjunction, or onomatopoeia "pst")
    if (firstVowelIdx === -1) {
        // Check if 'y' acts as vowel
        if (processedText.includes('y')) {
            // Assume 'y' is the nucleus
            firstVowelIdx = processedText.indexOf('y');
            lastVowelIdx = firstVowelIdx;
        } else {
            // No vowel. Treat all as Pre? or pure consonants?
            return { pre: processedText.length, post: 0, hasDiphthong: false };
        }
    }

    // Re-scan nucleus to be precise about contiguous block
    // We assume the nucleus is the range [firstVowelIdx, lastVowelIdx] ??
    // "train" -> a, i. 
    // "poblado" -> o.
    // "miau" -> i, a, u.

    // Let's refine lastVowelIdx. It should be the end of the vowel CLUSTER starting at firstVowelIdx.
    let scanIdx = firstVowelIdx;
    while (scanIdx < processedText.length) {
        const char = processedText[scanIdx];
        const prev = scanIdx > 0 ? processedText[scanIdx - 1] : '';
        const next = scanIdx < processedText.length - 1 ? processedText[scanIdx + 1] : '';
        if (!isVowel(char, prev, next) && char !== 'y') { // 'y' in nucleus? "muy" -> u-y.
            break;
        }
        lastVowelIdx = scanIdx;
        scanIdx++;
    }

    // Pre-consonants: everything before firstVowelIdx
    // Post-consonants: everything after lastVowelIdx

    // Exception: silent 'u' in 'que' is Consonant or ignored?
    // User: "por cada consonante".
    // 'q', 'u'(silent), 'e'. 
    // If isVowel('u') returns false, it counts as consonant?
    // isVowel says false. So it is treated as non-vowel.
    // Does 'u' count as consonant? Orthographically yes.
    // So 'que': pre='qu' (2). e (nuc). post=0.
    // Change: 0 - 2 = -2.
    // 'gue': pre='gu' (2).

    const preStr = processedText.slice(0, firstVowelIdx); // Includes silent u ?
    // Wait, my loop above skipped silent u as vowel.

    let preCount = preStr.length;
    let postCount = processedText.length - 1 - lastVowelIdx;

    const nucleus = processedText.slice(firstVowelIdx, lastVowelIdx + 1);
    const hasDiphthong = nucleus.length > 1; // Simplistic

    return { pre: preCount, post: postCount, hasDiphthong, nucleus, full: processedText };
}

/**
 * Calculates melodic step shift based on user algorithm.
 * @param {string} text - Syllable text
 * @returns {number} - Steps to shift (e.g. +1, -1, 0)
 */
function calculateMelodicSteps(text) {
    const analysis = analyzeSyllableMelodic(text);
    const totalConsonants = analysis.pre + analysis.post;

    // Rule: "Si solo hay una consonante el tono no varía"
    if (totalConsonants <= 1) return 0;

    // Rule: +1 per post, -1 per pre
    let change = analysis.post - analysis.pre;

    // Rule: "cuando haya diptongo se suma o baja el doble"
    if (analysis.hasDiphthong) {
        change *= 2;
    }

    return change;
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.analyzeSyllableMelodic = analyzeSyllableMelodic;
    window.calculateMelodicSteps = calculateMelodicSteps;
}
