// Language configuration for Tarareo system
// Prepares the system for multi-language support (Spanish/English)

const TarareoLanguageConfig = {
    // Current active language
    currentLanguage: 'es', // 'es' or 'en'

    // Language-specific configurations
    languages: {
        es: {
            name: 'Español',

            // Function words that should be grouped with adjacent words
            functionWords: new Set([
                // Artículos
                'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
                // Preposiciones
                'de', 'del', 'al', 'a', 'en', 'con', 'por', 'para', 'sin',
                // Pronombres
                'mi', 'tu', 'su', 'mis', 'tus', 'sus',
                'me', 'te', 'se', 'le', 'lo', 'les', 'nos',
                // Conjunciones
                'y', 'e', 'o', 'u', 'ni',
                // Otros
                'que', 'si', 'no', 'es'
            ]),

            // Syllable mapping for tarareo (rhythm syllables)
            rhythmSyllables: {
                1: 'daaaa',     // whole note
                2: 'daaa',      // half note
                25: 'daaaa',    // dotted half
                3: 'da',        // quarter note
                35: 'daa',      // dotted quarter
                4: 'ti',        // eighth note
                45: 'tii',      // dotted eighth
                5: 'di'         // sixteenth note
            },

            // Rest markers
            restMarkers: {
                explicit: ['(silencio)', '.'],
                punctuation: {
                    ',': 1,   // quarter rest
                    '.': 1,   // quarter rest
                    ';': 1,   // quarter rest
                    ':': 1,   // quarter rest
                    '!': 2,   // half rest
                    '?': 1    // quarter rest
                }
            },

            // UI labels
            ui: {
                placeholder: 'Escribe tu ritmo... (ej: ta ta ta ta)',
                buttonLabel: '→',
                sectionTitle: '🎤 Tarareo (Ritmo)'
            }
        },

        en: {
            name: 'English',

            // Function words that should be grouped with adjacent words
            functionWords: new Set([
                // Articles
                'the', 'a', 'an',
                // Prepositions
                'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
                // Pronouns
                'i', 'you', 'he', 'she', 'it', 'we', 'they',
                'me', 'him', 'her', 'us', 'them',
                'my', 'your', 'his', 'her', 'its', 'our', 'their',
                // Conjunctions
                'and', 'or', 'but', 'nor',
                // Others
                'is', 'am', 'are', 'was', 'were', 'be', 'been',
                'have', 'has', 'had', 'do', 'does', 'did',
                'will', 'would', 'can', 'could', 'may', 'might',
                'not', 'no'
            ]),

            // Syllable mapping for tarareo (same rhythm syllables work for English)
            rhythmSyllables: {
                1: 'daaaa',     // whole note
                2: 'daaa',      // half note
                25: 'daaaa',    // dotted half
                3: 'da',        // quarter note
                35: 'daa',      // dotted quarter
                4: 'ti',        // eighth note
                45: 'tii',      // dotted eighth
                5: 'di'         // sixteenth note
            },

            // Rest markers
            restMarkers: {
                explicit: ['(silence)', '.'],
                punctuation: {
                    ',': 1,   // quarter rest
                    '.': 1,   // quarter rest
                    ';': 1,   // quarter rest
                    ':': 1,   // quarter rest
                    '!': 2,   // half rest
                    '?': 1    // quarter rest
                }
            },

            // UI labels
            ui: {
                placeholder: 'Type your rhythm... (e.g., ta ta ta ta)',
                buttonLabel: '→',
                sectionTitle: '🎤 Hum (Rhythm)'
            }
        }
    },

    // Get current language configuration
    getCurrentConfig() {
        return this.languages[this.currentLanguage];
    },

    // Set active language
    setLanguage(langCode) {
        if (this.languages[langCode]) {
            this.currentLanguage = langCode;
            this.updateUI();
            return true;
        }
        return false;
    },

    // Update UI elements with current language
    updateUI() {
        const config = this.getCurrentConfig();

        const tarareoInput = document.getElementById('tarareo-input');
        if (tarareoInput) {
            tarareoInput.placeholder = config.ui.placeholder;
        }

        // Update other UI elements as needed
        // This can be expanded when implementing full i18n
    },

    // Get function words for current language
    getFunctionWords() {
        return this.getCurrentConfig().functionWords;
    },

    // Get rhythm syllables for current language
    getRhythmSyllables() {
        return this.getCurrentConfig().rhythmSyllables;
    },

    // Get rest markers for current language
    getRestMarkers() {
        return this.getCurrentConfig().restMarkers;
    },

    // Check if a word is a function word in current language
    isFunctionWord(word) {
        const cleanWord = word.toLowerCase().replace(/[.,;:!?¿¡]+$/, '');
        return this.getFunctionWords().has(cleanWord);
    },

    // Get rest duration from punctuation
    getRestFromPunctuation(char) {
        const markers = this.getRestMarkers().punctuation;
        return markers[char] || 0;
    },

    // Check if text is an explicit rest marker
    isExplicitRest(text) {
        const markers = this.getRestMarkers().explicit;
        return markers.includes(text.toLowerCase());
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TarareoLanguageConfig;
}
