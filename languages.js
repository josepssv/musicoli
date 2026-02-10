const LANGUAGES = {
    es: {
        "Ritmo": "Ritmo",
        "Melodía": "Melodía",
        "Dinámica": "Dinámica",
        "Instrumentación": "Instrumentación",
        "Composición": "Composición",
        "Lyrics": "Letras",
        "BPM": "BPM",
        "Compás": "Compás",
        "Frase": "Frase",
        "Empezar": "Empezar",
        "Tonalidad": "Tonalidad",
        "Borrar compás": "Borrar compás",
        "Deshacer": "Deshacer",
        "Rehacer": "Rehacer",
        "Soprano": "Soprano",
        "Contralto": "Contralto",
        "Tenor": "Tenor",
        "Bajo": "Bajo",
        "Loop OFF": "Repetir OFF",
        "Loop ON": "Repetir ON",
        "Resumen": "Resumen",
        "Editor de Paleta de Tonalidades": "Editor de Paleta de Tonalidades",
        "ZONA DE ARMONIZACIÓN": "ZONA DE ARMONIZACIÓN",
        "Armonizar desde esta voz": "Armonizar desde esta voz",
        "Ajustar a escala": "Ajustar a escala",
        "Onda (Modulación)": "Onda (Modulación)",
        "Aplicar": "Aplicar",
        "Editor de Lyrics": "Editor de Letras",
        "Configuración de lyrics próximamente...": "Configuración de letras próximamente...",
        "Mezclador de Volúmenes": "Mezclador de Volúmenes",
        "Volumen General": "Volumen General",
        "Mezcla por Pistas": "Mezcla por Pistas",
        "Configuración de Instrumentos": "Configuración de Instrumentos",
        "Instrumento General": "Instrumento General"
    },
    en: {
        "Ritmo": "Rhythm",
        "Melodía": "Melody",
        "Dinámica": "Dynamics",
        "Instrumentación": "Instruments",
        "Composición": "Composition",
        "Lyrics": "Lyrics",
        "BPM": "BPM",
        "Compás": "Measure",
        "Frase": "Phrase",
        "Empezar": "Start",
        "Tonalidad": "Tonality",
        "Borrar compás": "Delete measure",
        "Deshacer": "Undo",
        "Rehacer": "Redo",
        "Soprano": "Soprano",
        "Contralto": "Alto",
        "Tenor": "Tenor",
        "Bajo": "Bass",
        "Loop OFF": "Loop OFF",
        "Loop ON": "Loop ON",
        "Resumen": "Summary",
        "Editor de Paleta de Tonalidades": "Tonality Palette Editor",
        "ZONA DE ARMONIZACIÓN": "HARMONIZATION ZONE",
        "Armonizar desde esta voz": "Harmonize from this voice",
        "Ajustar a escala": "Snap to scale",
        "Onda (Modulación)": "Wave (Modulation)",
        "Aplicar": "Apply",
        "Editor de Lyrics": "Lyrics Editor",
        "Configuración de lyrics próximamente...": "Lyrics configuration coming soon...",
        "Mezclador de Volúmenes": "Volume Mixer",
        "Volumen General": "Master Volume",
        "Mezcla por Pistas": "Track Mix",
        "Configuración de Instrumentos": "Instrument Configuration",
        "Instrumento General": "General Instrument"
    }
};

let currentLanguage = 'es';

function setLanguage(lang) {
    if (LANGUAGES[lang]) {
        currentLanguage = lang;
        applyTranslations();
    }
}

function t(key) {
    return LANGUAGES[currentLanguage][key] || key;
}

function applyTranslations() {
    // Translate elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            el.textContent = t(key);
        }
    });

    // Translate specific buttons by ID (legacy support / if data-i18n not added yet)
    // We will add logic here or prefer using data-i18n in HTML

    // Example: Update Rhythm button text if it matches a key
    document.querySelectorAll('.mode-btn').forEach(btn => {
        const text = btn.textContent.trim();
        // This is a bit risky if text changes, better to use data-i18n
        // But for initial migration:
        if (LANGUAGES[currentLanguage][text]) {
            btn.textContent = t(text);
        }
    });

    console.log(`Language set to ${currentLanguage}`);
}

// Initial application if loaded
// applyTranslations(); 
