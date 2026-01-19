// El objeto de clasificación de percusión en INGLÉS
const perci = {
    "percussion_classification_primes_octaves": {
        "prime_categories": [
            { "prime": 2, "category_name": "Fundamental", "instruments": [{ "name": "Acoustic Bass Drum", "midi_note": 35, "conceptual_octave": 1 }, { "name": "Bass Drum 1", "midi_note": 36, "conceptual_octave": 1 }] },
            { "prime": 3, "category_name": "Rhythmic", "instruments": [{ "name": "Acoustic Snare", "midi_note": 38, "conceptual_octave": 2 }, { "name": "Electric Snare", "midi_note": 40, "conceptual_octave": 2 }, { "name": "Hand Clap", "midi_note": 39, "conceptual_octave": 2 }] },
            { "prime": 5, "category_name": "Subdivider", "instruments": [{ "name": "Closed Hi-Hat", "midi_note": 42, "conceptual_octave": 3 }, { "name": "Pedal Hi-Hat", "midi_note": 44, "conceptual_octave": 3 }, { "name": "Open Hi-Hat", "midi_note": 46, "conceptual_octave": 3 }] },
            { "prime": 7, "category_name": "Structural", "instruments": [{ "name": "High Floor Tom", "midi_note": 43, "conceptual_octave": 1 }, { "name": "Low Tom", "midi_note": 45, "conceptual_octave": 2 }, { "name": "Low-Mid Tom", "midi_note": 47, "conceptual_octave": 2 }, { "name": "Hi-Mid Tom", "midi_note": 48, "conceptual_octave": 2 }, { "name": "Low Floor Tom", "midi_note": 41, "conceptual_octave": 1 }] },
            { "prime": 11, "category_name": "Explosive", "instruments": [{ "name": "Crash Cymbal 1", "midi_note": 49, "conceptual_octave": 3 }, { "name": "Ride Cymbal 1", "midi_note": 51, "conceptual_octave": 3 }, { "name": "Crash Cymbal 2", "midi_note": 57, "conceptual_octave": 3 }, { "name": "Chinese Cymbal", "midi_note": 52, "conceptual_octave": 3 }] },
            { "prime": 13, "category_name": "Textural", "instruments": [{ "name": "Ride Bell", "midi_note": 53, "conceptual_octave": 3 }, { "name": "Tambourine", "midi_note": 54, "conceptual_octave": 3 }, { "name": "Splash Cymbal", "midi_note": 55, "conceptual_octave": 3 }, { "name": "Cowbell", "midi_note": 56, "conceptual_octave": 2 }, { "name": "High Bongo", "midi_note": 60, "conceptual_octave": 2 }, { "name": "Low Bongo", "midi_note": 59, "conceptual_octave": 2 }] }
        ]
    }
};


/**
 * Traduce una matriz de notas MIDI a una matriz de notas de percusión.
 * Utiliza la posición de la nota para seleccionar una categoría (número primo)
 * y su altura para seleccionar el instrumento final (octava conceptual).
 * @param {Array<number>} midiNotes - La matriz de notas MIDI a traducir.
 * @returns {Array<number>} - Una nueva matriz con los números de nota MIDI de percusión.
 */
function perciprimi(midiNotes) {
    const ritmoNumerico = [];
    const primes = [2, 3, 5, 7, 11, 13];
    const categorias = perci.percussion_classification_primes_octaves.prime_categories;

    // Creamos un mapa para buscar categorías por su número primo de forma eficiente
    const mapaCategorias = new Map();
    categorias.forEach(cat => {
        mapaCategorias.set(cat.prime, cat);
    });

    // Recorremos cada nota con su índice (posición)
    midiNotes.forEach((notaMidi, indice) => {
        // 1. Seleccionar la Categoría Prima basada en la POSICIÓN de la nota
        const primoSeleccionado = primes[indice % primes.length];
        const categoriaSeleccionada = mapaCategorias.get(primoSeleccionado);

        if (!categoriaSeleccionada) {
            ritmoNumerico.push(null);
            return;
        }

        // 2. Determinar la Octava Conceptual basada en la ALTURA de la nota
        let octavaConceptual;
        if (notaMidi <= 50) {
            octavaConceptual = 1;
        } else if (notaMidi <= 79) {
            octavaConceptual = 2;
        } else {
            octavaConceptual = 3;
        }

        // 3. Filtrar los instrumentos que coinciden con la categoría Y la octava
        const instrumentosCandidatos = categoriaSeleccionada.instruments.filter(
            instrumento => instrumento.conceptual_octave === octavaConceptual
        );

        // 4. Elegir un instrumento al azar y añadir su número de nota al resultado
        if (instrumentosCandidatos.length > 0) {
            const indiceAleatorio = Math.floor(Math.random() * instrumentosCandidatos.length);
            const instrumentoElegido = instrumentosCandidatos[indiceAleatorio];
            ritmoNumerico.push(instrumentoElegido.midi_note);
        } else {
            ritmoNumerico.push(null);
        }
    });

    return ritmoNumerico;
}

// Patrones de percusión predefinidos organizados por número de notas
// IMPORTANTE: Estos patrones son COPIAS EXACTAS de trilipi de metrica.js
// Usan valores de DURACIÓN (1=redonda, 2=blanca, 3=negra, 4=corchea, 35=negra puntillo, etc.)
let triliPerci = [];
let triliniPerci = [];

// Inicializar patrones de percusión para compás 4/4
function initPercussionPatterns() {
    triliPerci = [];
    triliniPerci = [];

    triliPerci[0] = [];
    triliniPerci[0] = [];

    // Copiados exactamente de metrica.js trili[] para compás 4/4
    triliPerci[1] = [[1]];

    triliPerci[2] = [
        [25, 3],
        [2, 2],
        [3, 25],
    ];

    triliPerci[3] = [
        [25, 4, 4],
        [2, 35, 4],
        [2, 3, 3],
        [2, 4, 35],
        [35, 2, 4],
        [35, 35, 3],
        [35, 3, 35],
        [35, 4, 2],
        [3, 2, 3],
        [3, 35, 35],
        [3, 3, 2],
        [4, 25, 4],
        [4, 2, 35],
        [4, 35, 2],
        [4, 4, 25],
    ];

    triliPerci[4] = [
        [2, 3, 4, 4],
        [2, 4, 3, 4],
        [2, 4, 4, 3],
        [35, 35, 4, 4],
        [35, 3, 3, 4],
        [35, 3, 4, 3],
        [35, 4, 35, 4],
        [35, 4, 3, 3],
        [35, 4, 4, 35],
        [3, 2, 4, 4],
        [3, 35, 3, 4],
        [3, 35, 4, 3],
        [3, 3, 35, 4],
        [3, 3, 3, 3],
        [3, 3, 4, 35],
        [3, 4, 2, 4],
        [3, 4, 35, 3],
        [3, 4, 3, 35],
        [3, 4, 4, 2],
        [4, 2, 3, 4],
        [4, 2, 4, 3],
        [4, 35, 35, 4],
        [4, 35, 3, 3],
        [4, 35, 4, 35],
        [4, 3, 2, 4],
        [4, 3, 35, 3],
        [4, 3, 3, 35],
        [4, 3, 4, 2],
        [4, 4, 2, 3],
        [4, 4, 35, 35],
        [4, 4, 3, 2],
    ];

    triliPerci[5] = [
        [2, 4, 4, 4, 4],
        [3, 3, 3, 4, 4],
        [3, 3, 4, 3, 4],
        [3, 3, 4, 4, 3],
        [3, 4, 3, 3, 4],
        [3, 4, 3, 4, 3],
        [3, 4, 4, 3, 3],
        [4, 2, 4, 4, 4],
        [4, 3, 3, 3, 4],
        [4, 3, 3, 4, 3],
        [4, 3, 4, 3, 3],
        [4, 4, 2, 4, 4],
        [4, 4, 3, 3, 3],
        [4, 4, 4, 2, 4],
        [4, 4, 4, 4, 2],
    ];

    triliPerci[6] = [
        [3, 3, 4, 4, 4, 4],
        [3, 4, 3, 4, 4, 4],
        [3, 4, 4, 3, 4, 4],
        [3, 4, 4, 4, 3, 4],
        [3, 4, 4, 4, 4, 3],
        [4, 3, 3, 4, 4, 4],
        [4, 3, 4, 3, 4, 4],
        [4, 3, 4, 4, 3, 4],
        [4, 3, 4, 4, 4, 3],
        [4, 4, 3, 3, 4, 4],
        [4, 4, 3, 4, 3, 4],
        [4, 4, 3, 4, 4, 3],
        [4, 4, 4, 3, 3, 4],
        [4, 4, 4, 3, 4, 3],
        [4, 4, 4, 4, 3, 3],
    ];

    triliPerci[7] = [
        [3, 4, 4, 4, 4, 4, 4],
        [4, 3, 4, 4, 4, 4, 4],
        [4, 4, 3, 4, 4, 4, 4],
        [4, 4, 4, 3, 4, 4, 4],
        [4, 4, 4, 4, 3, 4, 4],
        [4, 4, 4, 4, 4, 3, 4],
        [4, 4, 4, 4, 4, 4, 3],
    ];

    triliPerci[8] = [[4, 4, 4, 4, 4, 4, 4, 4]];

    // Convertir a silencios (restini equivalente para percusión)
    for (let a = 1; a < triliPerci.length; a++) {
        triliniPerci[a] = triliPerci[a].map(pattern =>
            pattern.map(note => {
                // Convertir duraciones a silencios usando la misma lógica que restini
                if (note >= 10) {
                    let decenas = Math.floor(note / 10);
                    let unidades = note % 10;
                    return -((decenas - 1) * 10 + unidades);
                } else {
                    return -(note - 1);
                }
            })
        );
    }
}

// Inicializar patrones de percusión
initPercussionPatterns();

/**
 * Obtiene el array de patrones activo según si la voz actual usa percusión
 * @returns {Array} triliPerci si la voz usa percusión, trilipi en caso contrario
 */
function getActiveTrili() {
    // Verificar si existe el objeto bdi y la voz seleccionada
    if (typeof window.bdi !== 'undefined' && window.bdi.metadata && window.bdi.metadata.voices) {
        const voiceSelector = document.getElementById('voice-selector');
        if (voiceSelector) {
            const selectedVoice = voiceSelector.value;
            const voiceMeta = window.bdi.metadata.voices[selectedVoice];

            if (voiceMeta && voiceMeta.percussion === true) {
                console.log('🥁 Usando patrones de percusión (triliPerci)');
                return triliPerci;
            }
        }
    }

    // Por defecto, usar patrones melódicos
    if (typeof trilipi !== 'undefined') {
        return trilipi;
    }

    return [];
}

/**
 * Verifica si la voz actual está en modo percusión
 * @returns {boolean} true si la voz usa percusión
 */
function isPercussionMode() {
    if (typeof window.bdi !== 'undefined' && window.bdi.metadata && window.bdi.metadata.voices) {
        const voiceSelector = document.getElementById('voice-selector');
        if (voiceSelector) {
            const selectedVoice = voiceSelector.value;
            const voiceMeta = window.bdi.metadata.voices[selectedVoice];
            return voiceMeta && voiceMeta.percussion === true;
        }
    }
    return false;
}
