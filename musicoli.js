const alfabeto = "abcdefghijklmnopqrstuvwxyz1234567890".split("");
const keyin = "C C# D D# E F F# G G# A A# B".split(" ");
const tonicain = "Do Do# Re Re# Mi Fa Fa# Sol Sol# La La# Si Si#".split(" ");
let keyinselecti = 0;
const escalas = ['mayor', 'menor', 'cromatica'];
let scali = 0;//menor, cromatica

let newInsti;
let ac = new AudioContext();
window.masterGain = ac.createGain();
window.masterGain.gain.value = 0.5; // Default 50%
window.masterGain.connect(ac.destination);

Soundfont.instrument(ac, "acoustic_grand_piano", { destination: window.masterGain })
    .then((nI) => (newInsti = nI));

window.setMasterVolume = function (val) {
    if (window.masterGain) {
        window.masterGain.gain.value = val / 100;
        console.log('🔊 Volume set to:', val);
    }
};

let tiwi = [4000, 2000, 1000, 500, 250];
const durai = [1, 2, 4, 8, 16, 32, 64];
const durai5 = [[1, 2], [2, 4], [4, 8], [8, 16], [16, 32], [32, 64]];

const durations = [1, 2, 4, 8, 16, 32, 64];


const duris4 = [4, 4 / 2, 4 / 4, 4 / 8, 4 / 16, 4 / 32, 4 / 64];
const duris45 = [4 + 4 / 2, 4 / 2 + 4 / 4, 4 / 4 + 4 / 8, 4 / 8 + 4 / 16, 4 / 16 + 4 / 32, 4 / 32, 4 / 64 + 4 / 128];
const duris = [[], [], [], [], duris4];
const noteMap = {
    1: '&#xE1D2;',  // noteWhole
    2: '&#xE1D3;',  // noteHalfUp
    25: '&#xE1D3; &#xE1E7;', // noteHalfUp dot
    3: '&#xE1D5;',  // noteQuarterUp
    35: '&#xE1D5; &#xE1E7;', // noteQuarterUp dot
    4: '&#xE1D7;',  // note8thUp
    45: '&#xE1D7; &#xE1E7;', // note8thUp dot
    5: '&#xE1D9;',   // note16thUp
    '-1': '&#xE4E3;', // restWhole
    '-2': '&#xE4E4;', // restHalf
    '-25': '&#xE4E4; &#xE1E7;', // restHalf dot
    '-3': '&#xE4E5;', // restQuarter
    '-35': '&#xE4E5; &#xE1E7;', // restQuarter dot
    '-4': '&#xE4E6;',  // rest8th
    '-45': '&#xE4E6; &#xE1E7;',   // rest8th dot
    '-5': '&#xE4E7;',   // rest16th
    '-55': '&#xE4E7; &#xE1E7;'   // rest16th dot
};

let bdi = {}
bdi.metadata =
{
    "type": "metadata",
    "title": "emotion",
    "bpm": 120,
    "timeSignature": [4, 4],
    "voici": 's',
    "voices": {
        "s": { "instrument": 1, "percussion": false },
        "a": { "instrument": 1, "percussion": false },
        "t": { "instrument": 1, "percussion": false },
        "b": { "instrument": 1, "percussion": false }
    }
}
bdi.bar = []
//let bdi = []
//let bdi = [{ "idi": 5345507.300786394, "numi": 0, "nami": "Perla Negra", "coli": [3, 10, 14, 255], "hexi": "#030A0E", "pinti": { "c": 1, "m": 1, "y": 1, "k": 0.868, "w": 0 }, "nimidi": [84, 84, 84, 79, 48], "timis": [3, 2, 2, 3, 2], "tipis": [4, 3, 3, 4, 3], "dinami": [64,64,64,64,64],"chordi": false }]
///////////////////////////////////////
let bpmValue = 60 * 2;
let traki = [];
let compi = [4, 4];
let tempi = bpmValue
let currentVoice = bdi.metadata.voici || 's'; // Initialize currentVoice
let instri = [['p', 44], ["p", 48]]
//////////////////////////////////////
let player;
let playi;
let vstaff;
let divi; // Notepad container

// Selected measure index for deletion
let currentGroup = 1;
let paterni = 1
let selectedMeasureIndex = -1;
let currentEditMode = 'ritmo'; // 'ritmo', 'tonalidad', or 'lyrics'
let voiceEditMode = 'dependent'; // 'dependent' | 'independent' - Mode for voice editing
let currentPattern = trilipi[currentGroup] ? trilipi[currentGroup][paterni] : null; // [3, 3, 3, 3] - Four quarter notes
let lastSelectedGrayMidi = null; // Store last selected gray tone MIDI for saturated buttons synchronization

// History system for undo/redo
let bdiHistory = [];
let bdiHistoryIndex = -1;
const MAX_HISTORY_SIZE = 50;
const escalasNotas = {
    mayor: [0, 2, 4, 5, 7, 9, 11],        // Do Mayor: C D E F G A B
    menor: [0, 2, 3, 5, 7, 8, 10],        // Do Menor: C D Eb F G Ab Bb
    cromatica: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]  // Todas las notas
};
const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Function to validate measure index
function isValidMeasureIndex(index) {
    return window.bdi.bar && index >= 0 && index < window.bdi.bar.length;
}

// Helper function to clean objects for JSON serialization
function cleanForJSON(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        // Remove undefined values
        if (value === undefined) {
            return null; // Convert undefined to null for JSON compatibility
        }
        return value;
    }));
}

// History management functions
function saveBdiState() {
    // Create a deep copy of current bdi state
    try {
        // Check if bdi exists
        if (!window.bdi || !window.bdi.bar) {
            console.warn('⚠️ BDI not initialized yet, skipping state save');
            return false;
        }

        const cleanedBdi = cleanForJSON(window.bdi.bar);
        const currentState = cleanedBdi;

        // Remove old future history if we're not at the end
        if (bdiHistoryIndex < bdiHistory.length - 1) {
            bdiHistory = bdiHistory.slice(0, bdiHistoryIndex + 1);
        }

        // Add new state
        bdiHistory.push(currentState);
        bdiHistoryIndex = bdiHistory.length - 1;

        // Limit history size
        if (bdiHistory.length > MAX_HISTORY_SIZE) {
            bdiHistory.shift();
            bdiHistoryIndex--;
        }

        console.log('💾 BDI state saved. History size:', bdiHistory.length, 'Current index:', bdiHistoryIndex);
        return true;
    } catch (error) {
        console.error('❌ Error saving BDI state:', error);
        return false;
    }
}

function undoBdi() {
    if (bdiHistoryIndex > 0) {
        bdiHistoryIndex--;
        window.bdi.bar = JSON.parse(JSON.stringify(bdiHistory[bdiHistoryIndex]));
        console.log('↶ Undo performed. Restored to history index:', bdiHistoryIndex);
        return true;
    }
    console.log('↶ Undo not possible - at beginning of history');
    return false;
}

function redoBdi() {
    if (bdiHistoryIndex < bdiHistory.length - 1) {
        bdiHistoryIndex++;
        window.bdi.bar = JSON.parse(JSON.stringify(bdiHistory[bdiHistoryIndex]));
        console.log('↷ Redo performed. Restored to history index:', bdiHistoryIndex);
        return true;
    }
    console.log('↷ Redo not possible - at end of history');
    return false;
}



// ========================================
// MIDI TO COLOR FUNCTION
// ========================================

/**
 * Converts MIDI note(s) to a color or gradient.
 * @param {number|number[]} midiInput - Single MIDI number or array of MIDI numbers.
 * @returns {string} - CSS color string (hsl) or linear-gradient string.
 */
function midiToColor(midiInput) {
    // Adapter to use the new global algorithm
    if (typeof window.midiNotesToScaleColor === 'function') {
        const notes = Array.isArray(midiInput) ? midiInput : [midiInput];
        // Filter valid notes
        const validNotes = notes.filter(n => typeof n === 'number' && n > 0);

        if (validNotes.length === 0) return '#cccccc';

        return window.midiNotesToScaleColor(validNotes);
    }

    // Fallback if new function not found (keep basic legacy gray)
    return '#cccccc';
}


// ========================================
// MIDI TO COLOR FUNCTION
// ========================================

/**
 * Gets the color for a specific measure and voice based on its MIDI content.
 * Uses an algorithm that creates:
 * - Neutral (gray) colors when MIDI notes are the same
 * - Red/Orange colors when notes descend (bajada)
 * - Green/Blue colors when notes ascend (subida)
 * - Dark colors for low pitches (bajos)
 * - Bright colors for high pitches (altos)
 * 
 * @param {number} measureIndex - Index of the measure
 * @param {string} voiceKey - Voice key ('s', 'a', 't', 'b')
 * @returns {string} - CSS color string
 */
function getMeasureVoiceColor(measureIndex, voiceKey) {
    const measures = window.bdi && window.bdi.bar ? window.bdi.bar : [];
    if (measureIndex >= measures.length) return 'transparent';
    const measure = measures[measureIndex];
    if (!measure) return '#cccccc';

    // 1. Find the specific voice data
    let voiceData;
    if (measure.voci && Array.isArray(measure.voci)) {
        // Standard structure: voci is an array of objects {nami: 's', nimidi: [...], ...}
        voiceData = measure.voci.find(v => v.nami === voiceKey);
    } else if (measure.voci) {
        // Legacy/Alternative structure: voci is an object { 's': {...}, ... }
        voiceData = measure.voci[voiceKey];
    }

    // 2. If no voice data or no notes, return gray
    if (!voiceData || !voiceData.nimidi || voiceData.nimidi.length === 0) {
        return '#cccccc';
    }

    // 3. Calculate color from MIDI notes using scale-based algorithm
    // Filter out 0 or negative values (rests/placeholders)
    const notes = voiceData.nimidi.filter(n => typeof n === 'number' && n > 0);

    if (notes.length === 0) return '#cccccc';

    return midiNotesToScaleColor(notes);
}

/**
 * Helper: Get color for a single note based on its pitch and movement from previous note
 * @param {number} note - MIDI note number
 * @param {number|null} prevNote - Previous MIDI note number (null for first note)
 * @returns {string} - HSL color string
 */
function getSingleNoteColor(note, prevNote = null) {
    // Map MIDI range ~36 (C2) to ~84 (C6) to lightness 20%-80%
    const lightness = Math.max(20, Math.min(80, 20 + ((note - 36) / 48) * 60));

    // If no previous note, return neutral gray
    if (prevNote === null) {
        return `hsl(0, 0%, ${Math.round(lightness)}%)`;
    }

    // Calculate interval movement
    const interval = note - prevNote;
    let hue, saturation;

    if (Math.abs(interval) < 1) {
        // Static/repeated note - neutral
        hue = 30;
        saturation = 5;
    } else if (interval < 0) {
        // Descending - warm colors (red/orange)
        const intensity = Math.min(Math.abs(interval), 12) / 12;
        hue = 0 + (intensity * 30); // 0° to 30°
        saturation = 40 + (intensity * 40);
    } else {
        // Ascending - cool colors (green/blue)
        const intensity = Math.min(interval, 12) / 12;
        hue = 120 + (intensity * 90); // 120° to 210°
        saturation = 40 + (intensity * 40);
    }

    return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

/**
 * Converts MIDI notes to color based on melodic movement, pitch, and note count.
 * Uses gradient structure: 1-3 notes = solid, 4+ notes = gradients
 * Color logic:
 * - Neutral (gray/brown) for static melodies
 * - Warm (red/orange) for descending melodies  
 * - Cool (green/blue) for ascending melodies
 * - Dark for low pitches, bright for high pitches
 * 
 * @param {number[]} notes - Array of MIDI note numbers (filtered, positive only)
 * @returns {string} - CSS color string (solid or gradient)
 */
function midiNotesToScaleColor(notes) {
    if (notes.length === 0) return 'hsl(0, 0%, 50%)'; // Neutral gray

    // Calculate average pitch (for lightness)
    const avgPitch = notes.reduce((sum, n) => sum + n, 0) / notes.length;

    // Map MIDI range ~36 (C2) to ~84 (C6) to lightness 20%-80%
    // Lower notes = darker, higher notes = brighter
    const lightness = Math.max(20, Math.min(80, 20 + ((avgPitch - 36) / 48) * 60));

    // If only one note, return neutral gray with appropriate lightness
    if (notes.length === 1) {
        return `hsl(0, 0%, ${lightness}%)`;
    }

    // Calculate melodic movement (sum of intervals)
    let totalMovement = 0;
    let movementCount = 0;

    for (let i = 1; i < notes.length; i++) {
        const interval = notes[i] - notes[i - 1];
        totalMovement += interval;
        movementCount++;
    }

    const avgMovement = movementCount > 0 ? totalMovement / movementCount : 0;

    // Determine hue and saturation based on movement
    let hue, saturation;

    if (Math.abs(avgMovement) < 0.5) {
        // Nearly static melody - neutral gray/brown
        hue = 30; // Warm neutral
        saturation = 5; // Very low saturation
    } else if (avgMovement < 0) {
        // Descending melody - warm colors (red/orange)
        // More descending = more red, less descending = more orange
        const descendIntensity = Math.min(Math.abs(avgMovement), 12) / 12; // Normalize to 0-1
        hue = 0 + (descendIntensity * 30); // 0° (red) to 30° (orange)
        saturation = 40 + (descendIntensity * 40); // 40%-80% saturation
    } else {
        // Ascending melody - cool colors (green/blue)
        // More ascending = more blue, less ascending = more green
        const ascendIntensity = Math.min(avgMovement, 12) / 12; // Normalize to 0-1
        hue = 120 + (ascendIntensity * 90); // 120° (green) to 210° (blue)
        saturation = 40 + (ascendIntensity * 40); // 40%-80% saturation
    }

    return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

/**
 * Applies the MIDI coloring logic to the global Notepad instance (np6/notepi6)
 */
function applyNotepadColoring() {
    if (!window.np6) return;

    // Get current voice from selector or global variable
    const voiceSelector = document.getElementById('voice-selector');
    const currentVoice = voiceSelector ? voiceSelector.value : (window.currentVoice || 's');

    // console.log(`🎨 applyNotepadColoring for voice: ${currentVoice}`);

    // Set the color function on the Notepad
    window.np6.setColorFunc((char, index) => {
        // Notepad index corresponds to measure index in this context (one span per measure)
        return getMeasureVoiceColor(index, currentVoice);
    });

    // Force a recolor
    window.np6.recolor();
}

// ========================================
// VISUAL TRACK MATRIX FUNCTIONS (NEW LAYOUT)
// ========================================

/**
 * Updates the DOM layout to place the Notepad in the current voice's row
 * and show visual tracks for other voices.
 * @param {string} currentVoice code ('s', 'a', 't', 'b')
 */
function updateTrackLayout(currentVoice) {
    const voiceMap = {
        's': { rowId: 'voiceline-s', visualId: 'visual-track-s' },
        'a': { rowId: 'voiceline-a', visualId: 'visual-track-a' },
        't': { rowId: 'voiceline-t', visualId: 'visual-track-t' },
        'b': { rowId: 'voiceline-b', visualId: 'visual-track-b' }
    };

    const notepad = document.getElementById('notepi6');
    if (!notepad) return;

    // 1. Move Notepad to target row
    const target = voiceMap[currentVoice] || voiceMap['s']; // Default to soprano
    // Get row element (parent of the label)
    const labelEl = document.getElementById(target.rowId);
    if (labelEl && labelEl.parentNode) {
        // Append notepad to this row
        // Note: appendChild moves it from previous location
        labelEl.parentNode.appendChild(notepad);
        notepad.style.display = 'flex'; // Ensure visible
    }

    // 2. Toggle visibility of visual tracks
    Object.keys(voiceMap).forEach(key => {
        const visualContainer = document.getElementById(voiceMap[key].visualId);
        if (visualContainer) {
            if (key === currentVoice) {
                visualContainer.style.display = 'none'; // Hide visual track for active voice
            } else {
                visualContainer.style.display = 'flex'; // Show visual track for others
            }
        }
    });

    // 3. Update Notepad coloring to match new voice
    applyNotepadColoring();
}

/**
 * Render the visual tracks for ALL non-active voices
 * synchronizing width with Notepad
 */
function renderVisualTracks() {
    // console.log('🎨 renderVisualTracks CALLED');

    // Get current voice to exclude it
    const voiceSelector = document.getElementById('voice-selector');
    const currentVoice = voiceSelector ? voiceSelector.value : 's';
    // console.log(`   -> Current Voice: ${currentVoice}`);

    // Ensure layout is correct (idempotent)
    updateTrackLayout(currentVoice);

    // Update voice label styles based on playback status
    if (typeof updateVoiceLabelStyles === 'function') {
        updateVoiceLabelStyles();
    }

    // Get containers
    const containers = {
        's': document.getElementById('visual-track-s'),
        'a': document.getElementById('visual-track-a'),
        't': document.getElementById('visual-track-t'),
        'b': document.getElementById('visual-track-b')
    };

    // Sanity check
    if (!containers['s']) {
        console.warn('⚠️ Visual track containers not found!');
        return;
    }

    // Reset styles for ALL containers
    Object.values(containers).forEach(c => {
        if (!c) return;
        c.innerHTML = '';
        c.style.marginTop = '0px';
        c.style.marginBottom = '0px';
        c.style.paddingTop = '0px';
        c.style.paddingBottom = '0px';
        c.style.lineHeight = '0';
        c.style.fontSize = '0px';
        // Explicitly ensure display is flex unless hidden by updateTrackLayout logic (which sets display: none for active)
        // updateTrackLayout already handles showing/hiding.
    });

    // Check if np6/BDI ready
    if (!window.np6 || !window.np6.letterNodes || window.np6.letterNodes.length === 0) {
        //console.warn('⚠️ Notepad (np6) not ready or empty. Retrying in 100ms...');
        setTimeout(renderVisualTracks, 100);
        return;
    }
    // console.log(`   -> Notepad Ready. LetterNodes: ${window.np6.letterNodes.length}`);

    const measures = window.bdi && window.bdi.bar ? window.bdi.bar : [];


    // Get widths from Notepad
    const spanWidths = window.np6.getSpanWidths();
    const nodes = window.np6.letterNodes.filter(n => n.tagName !== 'BR');

    // Helper: Get Color (Calculates from MIDI notes using algorithm)
    // NOW USING GLOBAL FUNCTION getMeasureVoiceColor
    const getVoiceColor = (measureIndex, voiceKey) => {
        return getMeasureVoiceColor(measureIndex, voiceKey);
    };

    // Iterate measures/nodes
    nodes.forEach((node, index) => {
        const width = spanWidths[index];
        const style = window.getComputedStyle(node);
        const marginLeft = style.marginLeft;
        const marginRight = style.marginRight;

        // Iterate voices
        Object.keys(containers).forEach(key => {
            // Skip the active voice (it's the notepad)
            if (key === currentVoice) return;

            const container = containers[key];
            if (!container) return;

            const span = document.createElement('span');
            // Ensure box-sizing is border-box so padding/border doesn't add width
            span.style.boxSizing = 'border-box';

            span.style.width = width + 'px';
            span.style.minWidth = width + 'px';
            span.style.height = '100%';

            // Remove lateral margins to compress tracks
            span.style.marginLeft = '0px';
            span.style.marginRight = '0px';

            span.style.marginTop = '0px';
            span.style.marginBottom = '0px';
            span.style.display = 'inline-block';
            span.style.verticalAlign = 'top';
            span.style.borderRadius = '2px';

            // Apply color (now supports gradients via background)
            const colorValue = getVoiceColor(index, key);

            // Check if it's a gradient or solid color
            if (colorValue.startsWith('linear-gradient')) {
                span.style.background = colorValue;
            } else {
                span.style.backgroundColor = colorValue;
            }

            span.style.border = '1px solid rgba(0,0,0,0.1)';
            span.title = `Measure ${index + 1} - ${key.toUpperCase()}`;
            span.style.pointerEvents = 'auto';
            span.style.cursor = 'pointer';

            span.onclick = () => {
                // Switch voice logic
                if (voiceSelector && voiceSelector.value !== key) {
                    voiceSelector.value = key;
                    const event = new Event('change');
                    voiceSelector.dispatchEvent(event);
                    if (typeof window.currentVoice !== 'undefined') window.currentVoice = key;
                }
                // Select measure
                selectedMeasureIndex = index;
                if (typeof window.openMidiEditor === 'function') {
                    window.openMidiEditor(index);
                }
            };

            container.appendChild(span);
        });
    });
}

// Helper function to update all systems after bdi change
function updateAfterBdiChange() {
    // Rebuild recordi with all bdi entries
    if (typeof window.rebuildRecordi === 'function') {
        window.rebuildRecordi();
        console.log('Rebuilt recordi after bdi change');
    }

    // Update BDI display
    const bdiDisplay = document.getElementById('bdi-display');
    if (bdiDisplay) {
        if (window.bdi.bar.length > 0) {
            bdiDisplay.value = JSON.stringify(window.bdi.bar, null, 2);
        } else {
            bdiDisplay.value = '';
        }
    }

    // Update Notepad Visuals
    console.log('🔍 [DIAGNOSTIC] Checking if window.applyTextLayer exists:', typeof window.applyTextLayer);
    if (typeof window.applyTextLayer === 'function') {
        console.log('🎯 [DIAGNOSTIC] Calling window.applyTextLayer...');
        window.applyTextLayer();
        console.log('✅ Applied text layer to notepad');
    } else {
        console.error('❌ [DIAGNOSTIC] window.applyTextLayer function not found!');
    }

    // Update Notepad Coloring
    applyNotepadColoring();

    // Update MIDI player with new data
    if (typeof window.traki !== 'undefined' && window.traki.length > 0) {
        window.escribi = new MidiWriter.Writer(window.traki[0]);
        if (typeof window.playi !== 'undefined') {
            window.playi.src = '';
            setTimeout(() => {
                const dataUri = window.escribi.dataUri();
                window.playi.src = dataUri + '?t=' + Date.now();
            }, 100);
        }
    }

    // Update visual track matrix
    setTimeout(renderVisualTracks, 50);


    // Reset selection
    selectedMeasureIndex = -1;
}






// Función para generar colores tipo arcoíris (desaturados, casi grises)
function generateRainbowColors(steps) {
    const rainbowColors = [];
    for (let i = 0; i < steps; i++) {
        const hue = (i / steps) * 360;
        // Saturación muy baja (20%) para colores casi grises
        // Luminosidad al 50% para mantener un tono medio
        rainbowColors.push(`hsl(${hue}, 20%, 50%)`);
    }
    return rainbowColors;
}


function generateSimilarColors(h, s, l, num) {
    //console.log(`🎨 TRACE: generateSimilarColors(h:${h}, s:${s}, l:${l}, num:${num})`);
    let colors = [];
    const variation = 7;
    let currentH = h * 0.8;
    let currentS = s * 0.2; // Bajando saturación inicial
    let currentL = l * 0.99; // Bajando tono (luminosidad) inicial

    for (let i = 0; i < num; i++) {
        currentH = (currentH + (Math.random() * variation - variation / 2) + 360) % 360;
        currentS = Math.max(5, currentS - Math.random() * 2); // Tendencia a bajar saturación
        currentL = Math.max(10, currentL - Math.random() * 2); // Tendencia a bajar tono

        //for (let i = 0; i < num; i++) {
        //    currentH = (currentH + (Math.random() * 8 - 4) + 360) % 360;
        //    currentS = Math.max(5, Math.min(100, currentS + (Math.random() * 6 - 3)));
        //    currentL = Math.max(10, Math.min(90, currentL + (Math.random() * 4 - 2)));

        const sArr = currentS / 100, lArr = currentL / 100, a = sArr * Math.min(lArr, 1 - lArr);
        const f = (n, k = (n + currentH / 30) % 12) => Math.round(255 * (lArr - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)));
        colors.push(`rgb(${f(0)}, ${f(8)}, ${f(4)})`);
    }
    //console.log(`✅ TRACE: Generated colors:`, colors);
    return colors;
}

// Función para generar colores aleatorios
function generateRandomColors(steps) {
    const randomColors = [];
    for (let i = 0; i < steps; i++) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        randomColors.push(`rgb(${r}, ${g}, ${b})`);
    }
    return randomColors;
}

// Asignar colores arcoíris a cada letra con 8 sabores aleatorios pregenerados
function assignRainbowColors(letters) {
    console.log('🌈 TRACE: assignRainbowColors called for letters:', letters.slice(0, 5).join(', ') + '...');
    const rainbowColors = generateRainbowColors(letters.length);
    let colorMap = {};
    letters.forEach((letter, index) => {
        colorMap[letter] = rainbowColors[index];
        const baseHue = (index / letters.length) * 360;
        const flavors = generateSimilarColors(baseHue, 20, 50, 4);
        colorMap[letter + '_flavors'] = flavors;
    });
    return colorMap;
}

// Asignar colores aleatorios a cada letra con 8 sabores aleatorios pregenerados
function assignRandomColors(letters) {
    console.log('🎲 TRACE: assignRandomColors called for letters:', letters.slice(0, 5).join(', ') + '...');
    const randomColors = generateRandomColors(letters.length);
    let colorMap = {};
    letters.forEach((letter, index) => {
        const color = randomColors[index];
        colorMap[letter] = color;
        const rgbMatch = color.match(/\d+/g);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[0]), g = parseInt(rgbMatch[1]), b = parseInt(rgbMatch[2]);
            const hsl = rgbToHsl(r, g, b);
            const flavors = generateSimilarColors(hsl.h, hsl.s, hsl.l, 4);
            colorMap[letter + '_flavors'] = flavors;
        } else {
            colorMap[letter + '_flavors'] = generateSimilarColors(0, 50, 50, 4);
        }
    });
    return colorMap;
}

function getContrastColor(colorString) {
    if (!colorString || colorString === 'transparent') return '#000000';
    let r = 0, g = 0, b = 0;
    if (colorString.startsWith('#')) {
        const hex = colorString.slice(1);
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.slice(0, 2), 16);
            g = parseInt(hex.slice(2, 4), 16);
            b = parseInt(hex.slice(4, 6), 16);
        }
    } else if (colorString.startsWith('rgb')) {
        const match = colorString.match(/\d+/g);
        if (match && match.length >= 3) {
            r = parseInt(match[0]);
            g = parseInt(match[1]);
            b = parseInt(match[2]);
        }
    } else if (colorString.startsWith('hsl')) {
        // Simple approximation for HSL: if L > 50% -> black, else white
        const match = colorString.match(/hsl\(\s*\d+\s*,\s*\d+%\s*,\s*(\d+)%\s*\)/);
        if (match) {
            return parseInt(match[1]) > 50 ? '#000000' : '#ffffff';
        }
        return '#000000';
    }

    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

function getComplementaryColor(colorString) {
    if (!colorString || colorString === 'transparent') return '#000000';

    // Handle HSL
    const hslMatch = colorString.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
    if (hslMatch) {
        const h = parseInt(hslMatch[1]);
        const s = parseInt(hslMatch[2]);
        const l = parseInt(hslMatch[3]);
        const newH = (h + 180) % 360;
        return `hsl(${newH}, ${s}%, ${l}%)`;
    }

    // Fallback for other formats (simple inversion or default)
    // For this example, we primarily use HSL, but let's add basic hex inversion
    if (colorString.startsWith('#')) {
        const hex = colorString.slice(1);
        const num = parseInt(hex, 16);
        const inverted = 0xFFFFFF ^ num;
        return '#' + inverted.toString(16).padStart(6, '0');
    }

    return '#000000';
}

// Convert any color format to hex for color input
function colorToHex(colorString) {
    if (!colorString || colorString === 'transparent') return '#000000';

    // Already hex
    if (colorString.startsWith('#')) return colorString;

    // Handle RGB
    const rgbMatch = colorString.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
        const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
        const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    // Handle HSL - convert to RGB first
    const hslMatch = colorString.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
    if (hslMatch) {
        const h = parseInt(hslMatch[1]) / 360;
        const s = parseInt(hslMatch[2]) / 100;
        const l = parseInt(hslMatch[3]) / 100;

        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        const rHex = Math.round(r * 255).toString(16).padStart(2, '0');
        const gHex = Math.round(g * 255).toString(16).padStart(2, '0');
        const bHex = Math.round(b * 255).toString(16).padStart(2, '0');
        return `#${rHex}${gHex}${bHex}`;
    }

    return '#000000';
}

// Color mode conversion functions
function rgbToGreyscale(r, g, b) {
    const grey = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    return { grey };
}

function rgbToHSB(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
        if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / delta + 2) / 6;
        else h = ((r - g) / delta + 4) / 6;
    }

    const s = max === 0 ? 0 : delta / max;
    const br = max;

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        b: Math.round(br * 100)
    };
}

function rgbToCMYK(r, g, b) {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, m, y);

    if (k < 1) {
        c = (c - k) / (1 - k);
        m = (m - k) / (1 - k);
        y = (y - k) / (1 - k);
    } else {
        c = m = y = 0;
    }

    return {
        c: Math.round(c * 100),
        m: Math.round(m * 100),
        y: Math.round(y * 100),
        k: Math.round(k * 100)
    };
}

function rgbToCMYKB(r, g, b) {
    const cmyk = rgbToCMYK(r, g, b);
    const brightness = Math.max(r, g, b);
    return {
        ...cmyk,
        br: Math.round((brightness / 255) * 100)
    };
}

function formatColorValue(r, g, b, mode) {
    switch (mode) {
        case 'GREY_SCALE': {
            const { grey } = rgbToGreyscale(r, g, b);
            return `Grey: ${grey}`;
        }
        case 'HSB': {
            const { h, s, b: br } = rgbToHSB(r, g, b);
            return `H:${h}° S:${s}% B:${br}%`;
        }
        case 'RGB': {
            return `R:${r} G:${g} B:${b}`;
        }
        case 'CMYK': {
            const { c, m, y, k } = rgbToCMYK(r, g, b);
            return `C:${c} M:${m} Y:${y} K:${k}`;
        }
        case 'CMYKB': {
            const { c, m, y, k, br } = rgbToCMYKB(r, g, b);
            return `C:${c} M:${m} Y:${y} K:${k} B:${br}`;
        }
        default:
            return `R:${r} G:${g} B:${b}`;
    }
}

// Create Tonalidad palette editor UI with color names
async function createTonalidadEditor(notepadInstance, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Header with title and mode selector
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';

    const title = document.createElement('h3');
    title.textContent = 'Editor de Paleta de Tonalidades';
    title.style.margin = '0';
    title.style.fontFamily = 'monospace';

    const modeSelector = document.createElement('select');
    modeSelector.style.padding = '5px 10px';
    modeSelector.style.fontFamily = 'monospace';
    modeSelector.style.fontSize = '14px';
    modeSelector.style.border = '1px solid #ccc';
    modeSelector.style.borderRadius = '4px';
    modeSelector.style.cursor = 'pointer';

    const modes = ['RGB', 'GREY_SCALE', 'HSB', 'CMYK', 'CMYKB'];
    modes.forEach(mode => {
        const option = document.createElement('option');
        option.value = mode;
        option.textContent = mode;
        modeSelector.appendChild(option);
    });

    header.appendChild(title);
    header.appendChild(modeSelector);
    container.innerHTML = '';
    container.appendChild(header);

    const colorMap = notepadInstance.noteColorMap || {};
    const characters = Object.keys(colorMap).filter(k => k.length === 1 || !k.endsWith('_flavors')).sort((a, b) => {
        // Letters first, then numbers
        const aIsLetter = /[A-Za-z]/.test(a);
        const bIsLetter = /[A-Za-z]/.test(b);

        if (aIsLetter && !bIsLetter) return -1; // a is letter, b is number -> a comes first
        if (!aIsLetter && bIsLetter) return 1;  // a is number, b is letter -> b comes first

        // Both are same type, sort alphabetically/numerically
        return a.localeCompare(b);
    });

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
    grid.style.gap = '10px';

    // Create all items first, then fetch color names asynchronously
    for (const char of characters) {
        const itemDiv = document.createElement('div');
        itemDiv.style.display = 'flex';
        itemDiv.style.flexDirection = 'column';
        itemDiv.style.alignItems = 'center';
        itemDiv.style.padding = '8px';
        itemDiv.style.background = 'white';
        itemDiv.style.borderRadius = '4px';
        itemDiv.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';

        const label = document.createElement('div');
        label.textContent = char;
        label.style.fontFamily = 'monospace';
        label.style.fontSize = '18px';
        label.style.fontWeight = 'bold';
        label.style.marginBottom = '5px';

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = colorToHex(colorMap[char]);
        colorInput.style.width = '50px';
        colorInput.style.height = '30px';
        colorInput.style.border = 'none';
        colorInput.style.cursor = 'pointer';
        // Color value label (mode-dependent)
        const colorValueLabel = document.createElement('div');
        colorValueLabel.className = 'color-value-label';
        colorValueLabel.style.fontSize = '9px';
        colorValueLabel.style.textAlign = 'center';
        colorValueLabel.style.color = '#999';
        colorValueLabel.style.fontFamily = 'monospace';
        colorValueLabel.style.minHeight = '12px';
        colorValueLabel.style.lineHeight = '12px';
        colorValueLabel.style.marginBottom = '3px';

        // Function to update color value display
        const updateColorValue = (hexColor) => {
            const rgb = hexToRgb(hexColor);
            if (rgb) {
                const mode = modeSelector.value;
                colorValueLabel.textContent = formatColorValue(rgb.r, rgb.g, rgb.b, mode);
            }
        };

        // Initial color value
        updateColorValue(colorInput.value);

        // Color name label
        const colorNameLabel = document.createElement('div');
        colorNameLabel.style.fontSize = '10px';
        colorNameLabel.style.textAlign = 'center';
        colorNameLabel.style.color = '#666';
        colorNameLabel.style.fontFamily = 'sans-serif';
        colorNameLabel.style.minHeight = '24px';
        colorNameLabel.style.lineHeight = '12px';
        colorNameLabel.textContent = 'Cargando...';

        // Function to update color name
        const updateColorName = async (hexColor) => {
            const rgb = hexToRgb(hexColor);
            if (rgb) {
                const colorInfo = await consulti(rgb.r, rgb.g, rgb.b);
                if (colorInfo) {
                    // Translate the color name to Spanish
                    const translatedName = await traducirOnline(colorInfo.nombre);
                    colorNameLabel.textContent = translatedName;
                } else {
                    colorNameLabel.textContent = 'Desconocido';
                }
            }
        };

        // Fetch initial color name
        updateColorName(colorInput.value);

        colorInput.addEventListener('change', async (e) => {
            notepadInstance.setNoteColor(char, e.target.value);
            await updateColorName(e.target.value);
            updateColorValue(e.target.value);
        });

        itemDiv.appendChild(label);
        itemDiv.appendChild(colorInput);
        itemDiv.appendChild(colorValueLabel);
        itemDiv.appendChild(colorNameLabel);
        grid.appendChild(itemDiv);
    }

    container.appendChild(grid);

    // Update all color values when mode changes
    modeSelector.addEventListener('change', () => {
        const allValueLabels = container.querySelectorAll('.color-value-label');
        const allInputs = container.querySelectorAll('input[type="color"]');
        allInputs.forEach((input, index) => {
            const rgb = hexToRgb(input.value);
            if (rgb) {
                allValueLabels[index].textContent = formatColorValue(rgb.r, rgb.g, rgb.b, modeSelector.value);
            }
        });
    });
}
// Helper: Convert RGB to HSL
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

// Add all interval scales to the ladder (0-7, Ascending & Descending)
function addAllIntervalsToLadder() {
    const { scaleNotesInRange, vocalRange, scaleName } = ininoti(); // Use scaleNotesInRange
    const ladder = document.getElementById('editor-tonalidad-ladder');
    if (!ladder) return;

    // Interval 0: Only Ascending (Green)
    addScaleWithInterval(scaleNotesInRange, vocalRange, scaleName, 0, 'ascending', null, false);

    // Spacer after Interval 0
    const spacer0 = document.createElement('span');
    spacer0.style.display = 'inline-block';
    spacer0.style.width = '10px';
    ladder.appendChild(spacer0);

    // Intervals 1-7: Ascending and Descending
    for (let i = 1; i <= 7; i++) {
        // Ascending (Green)
        addScaleWithInterval(scaleNotesInRange, vocalRange, scaleName, i, 'ascending', null, false);

        // Small gap between Asc/Desc
        const spacer = document.createElement('span');
        spacer.style.display = 'inline-block';
        spacer.style.width = '5px';
        ladder.appendChild(spacer);

        // Descending (Red)
        addScaleWithInterval(scaleNotesInRange, vocalRange, scaleName, i, 'descending', null, false);

        // Gap between intervals
        const gap = document.createElement('span');
        gap.style.display = 'inline-block';
        gap.style.width = '10px';
        ladder.appendChild(gap);
    }
}

// Add monochromatic intervals (interval 0 only) to the ladder
function addMonochromaticIntervalsToLadder() {
    const { scaleNotesInRange, vocalRange, scaleName } = ininoti();
    const ladder = document.getElementById('editor-tonalidad-ladder');
    if (!ladder) return;

    // MUSICOLI: Note Count Selector (Moved here per user request)
    // MUSICOLI: Note Count Selector (Moved here per user request)
    const selectorContainer = document.createElement('div');
    selectorContainer.id = 'note-count-selector';
    selectorContainer.style.display = 'inline-block';
    selectorContainer.style.marginRight = '15px';
    selectorContainer.style.verticalAlign = 'middle';
    selectorContainer.style.border = '2px solid #FF5722'; // Strong orange/red border for visibility
    selectorContainer.style.backgroundColor = '#FFF3E0'; // Light orange background
    selectorContainer.style.padding = '5px';
    selectorContainer.style.borderRadius = '6px';

    // Add Label
    const label = document.createElement('span');
    label.textContent = 'Notas: ';
    label.style.fontWeight = 'bold';
    label.style.fontSize = '12px';
    label.style.marginRight = '5px';
    label.style.color = '#E64A19';
    selectorContainer.appendChild(label);

    if (typeof trilipi !== 'undefined') {
        // Limit to 8 or actual length, typical trilipi has index 0 unused, 1-8 used
        const maxLimit = Math.min(trilipi.length, 9);
        for (let i = 1; i < maxLimit; i++) {
            if (!trilipi[i]) continue;

            const btn = document.createElement('span');
            btn.textContent = i.toString();
            btn.title = `Seleccionar ${i} nota(s)`;
            btn.style.display = 'inline-block';
            btn.style.width = '20px';
            btn.style.height = '20px';
            btn.style.textAlign = 'center';
            btn.style.lineHeight = '20px';
            btn.style.margin = '0 2px';
            btn.style.cursor = 'pointer';
            btn.style.borderRadius = '3px';
            btn.style.fontSize = '12px';
            btn.style.fontFamily = 'monospace';

            if (currentGroup === i) {
                btn.style.backgroundColor = '#2196F3'; // Blue active
                btn.style.color = 'white';
                btn.style.fontWeight = 'bold';
            } else {
                btn.style.backgroundColor = '#f0f0f0';
                btn.style.color = '#333';
            }

            btn.onmouseenter = () => { if (currentGroup !== i) btn.style.backgroundColor = '#e0e0e0'; };
            btn.onmouseleave = () => { if (currentGroup !== i) btn.style.backgroundColor = '#f0f0f0'; };

            btn.onclick = () => {
                currentGroup = i;
                // Update global state and refresh
                makeladi();
            };

            selectorContainer.appendChild(btn);
        }

        // MUSICOLI: Add "S" button for silence variations (only visible when currentGroup === 8)
        const btnS = document.createElement('span');
        btnS.id = 'silence-variations-btn';
        btnS.textContent = '\uD834\uDD3D'; // Quarter rest symbol (𝄽)
        btnS.title = 'Ver variaciones de silencios para 8 notas';
        btnS.style.display = currentGroup === 8 ? 'inline-block' : 'none';
        btnS.style.width = '20px'; // Matched to other note selectors
        btnS.style.height = '20px';
        btnS.style.textAlign = 'center';
        btnS.style.lineHeight = '20px'; // Center vertically
        btnS.style.margin = '0 2px 0 8px'; // Extra left margin to separate from number buttons
        btnS.style.cursor = 'pointer';
        btnS.style.borderRadius = '3px';
        btnS.style.fontSize = '16px'; // Larger font for the symbol visibility
        btnS.style.fontFamily = '"Bravura", "Bravura Text", monospace'; // Ensure font stack
        btnS.style.backgroundColor = '#FF9800'; // Orange background
        btnS.style.color = 'white';
        btnS.style.fontWeight = 'normal';

        btnS.onmouseenter = () => { btnS.style.backgroundColor = '#F57C00'; };
        btnS.onmouseleave = () => { btnS.style.backgroundColor = '#FF9800'; };

        btnS.onclick = () => {
            openSilenceVariationsModal();
        };

        selectorContainer.appendChild(btnS);
    }
    ladder.appendChild(selectorContainer);

    // Button 0 (Negative/Rest)
    const btnZero = document.createElement('span');
    btnZero.textContent = '0';
    btnZero.style.display = 'inline-block';
    btnZero.style.width = '25px';
    btnZero.style.height = '25px';
    btnZero.style.textAlign = 'center';
    btnZero.style.lineHeight = '25px';
    btnZero.style.border = '1px solid #999';
    btnZero.style.borderRadius = '50%';
    btnZero.style.marginRight = '10px';
    btnZero.style.cursor = 'pointer';
    btnZero.style.backgroundColor = '#fae1e1';
    btnZero.style.fontWeight = 'bold';
    btnZero.style.color = '#d32f2f';

    btnZero.onmouseenter = () => { btnZero.style.backgroundColor = '#ffcdd2'; };
    btnZero.onmouseleave = () => { btnZero.style.backgroundColor = '#fae1e1'; };

    btnZero.onclick = () => {
        if (currentPattern) {
            let negativePattern = [];
            if (typeof restini === 'function') {
                const result = restini([currentPattern]);
                if (result && result.length > 0) {
                    negativePattern = result[0];
                }
            }
            if (negativePattern.length === 0) {
                negativePattern = currentPattern.map(t => -Math.abs(t));
            }

            const colorInput = document.querySelector('#rhythm-color-info-div input[type="color"]') ||
                document.querySelector('#editor-ritmo input[type="color"]');
            const colorVal = colorInput ? colorInput.value : '#000000';

            if (typeof window.bdi !== 'undefined' && window.bdi.bar) {
                const newItem = {
                    "idi": Date.now(),
                    "numi": 0,
                    "nami": "Rest",
                    "col": colorVal,
                    "coli": [128, 128, 128, 255],
                    "hexi": colorVal,
                    "pinti": { "c": 0, "m": 0, "y": 0, "k": 0, "w": 0 },
                    "nimidi": [],
                    "nimidiColors": [],
                    "tipis": negativePattern,
                    "timis": [1],
                    "dinami": currentPattern.map(() => 0),
                    "tarari": "",
                    "liri": "",
                    "chordi": false,
                    "voci": ['s', 'a', 't', 'b'].map(v => ({
                        "nami": v, "nimidi": [], "timis": [], "tipis": [...negativePattern],
                        "dinami": currentPattern.map(() => 0), "nimidiColors": [], "tarari": ""
                    }))
                };

                const bdiRef = window.bdi.bar;
                let insertIndex = (typeof selectedMeasureIndex !== 'undefined' && selectedMeasureIndex >= 0)
                    ? selectedMeasureIndex
                    : bdiRef.length;

                if (insertIndex >= bdiRef.length) {
                    bdiRef.push(newItem);
                } else {
                    bdiRef.splice(insertIndex, 0, newItem);
                }

                if (typeof window.applyTextLayer === 'function') window.applyTextLayer();
                if (typeof window.rebuildRecordi === 'function') window.rebuildRecordi();
            }
        }
    };
    ladder.appendChild(btnZero);

    // Interval 0: Only Ascending (monochromatic single notes)
    addScaleWithInterval3(scaleNotesInRange, vocalRange, scaleName, 0, 'ascending', null, false);

    // Spacer after monochromatic section
    const spacer0 = document.createElement('span');
    spacer0.style.display = 'inline-block';
    spacer0.style.width = '10px';
    spacer0.style.paddingLeft = '222px';
    ladder.appendChild(spacer0);
}



// MUSICOLI: Open modal with silence variations for 8-note pattern
function openSilenceVariationsModal() {
    // Check if modal already exists, if so, just show it
    let modal = document.getElementById('silence-variations-modal');
    if (modal) {
        modal.style.display = 'flex';
        return;
    }

    // Detect current edit mode to apply appropriate color scheme
    const isRhythmMode = (typeof editMode !== 'undefined' && editMode === 'text');

    // Define color schemes based on mode
    const colors = isRhythmMode ? {
        // Rhythm mode - Gray tones
        modalBg: 'rgba(60, 60, 60, 0.90)',
        headerBg: '#4a4a4a',
        headerBorder: '#6b6b6b',
        sectionTitle: '#d0d0d0',
        buttonBg: '#555555',
        buttonBorder: '#777777',
        buttonHover: '#666666'
    } : {
        // Other modes - Original colors (orange/dark)
        modalBg: 'rgba(40, 40, 40, 0.85)',
        headerBg: '#333333',
        headerBorder: '#FF9800',
        sectionTitle: '#FF9800',
        buttonBg: '#555',
        buttonBorder: '#777',
        buttonHover: '#666'
    };

    // Create modal overlay
    modal = document.createElement('div');
    modal.id = 'silence-variations-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '10000';

    // Create modal content container (draggable)
    const modalContent = document.createElement('div');
    modalContent.id = 'silence-modal-content';
    modalContent.style.backgroundColor = colors.modalBg;
    modalContent.style.color = '#eeeeee';
    modalContent.style.borderRadius = '8px';
    modalContent.style.padding = '0'; // Remove padding for full-width header
    modalContent.style.maxWidth = '90%';
    modalContent.style.maxHeight = '80%';
    modalContent.style.overflow = 'auto'; // Scrollable
    modalContent.style.position = 'relative';
    modalContent.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
    modalContent.style.cursor = 'move';

    // Create header with title and close button
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '15px 20px'; // Padding inside header
    header.style.borderBottom = '2px solid ' + colors.headerBorder;
    header.style.backgroundColor = colors.headerBg;
    header.style.position = 'sticky'; // Fixed header
    header.style.top = '0';
    header.style.zIndex = '100';
    header.style.borderRadius = '8px 8px 0 0'; // Round top corners
    header.style.cursor = 'move'; // Indicate draggable area

    const title = document.createElement('h3');
    title.textContent = 'Variaciones de Silencios - Patrón de 8 Notas';
    title.style.margin = '0';
    title.style.fontFamily = 'monospace';
    title.style.fontSize = '16px';
    title.style.color = '#ffffff'; // White text

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '28px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#cccccc'; // Light gray
    closeBtn.style.padding = '0';
    closeBtn.style.width = '30px';
    closeBtn.style.height = '30px';
    closeBtn.style.lineHeight = '30px';
    closeBtn.style.textAlign = 'center';
    closeBtn.title = 'Cerrar';

    closeBtn.onmouseenter = () => { closeBtn.style.color = '#ffffff'; }; // White on hover
    closeBtn.onmouseleave = () => { closeBtn.style.color = '#cccccc'; };
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    header.appendChild(title);
    header.appendChild(closeBtn);
    modalContent.appendChild(header);

    // Generate silence variations for the 8-note pattern [4, 4, 4, 4, 4, 4, 4, 4]
    const basePattern = [4, 4, 4, 4, 4, 4, 4, 4];

    // Create container for all variations
    const variationsContainer = document.createElement('div');
    variationsContainer.style.padding = '20px'; // Add padding here since we removed it from modalContent
    variationsContainer.style.display = 'flex';
    variationsContainer.style.flexDirection = 'column';
    variationsContainer.style.gap = '15px';

    // Generate variations for 1 to 7 silences
    for (let silenceCount = 1; silenceCount <= 7; silenceCount++) {
        const sectionTitle = document.createElement('h4');
        sectionTitle.textContent = `${silenceCount} Silencio${silenceCount > 1 ? 's' : ''}`;
        sectionTitle.style.fontFamily = 'monospace';
        sectionTitle.style.fontSize = '14px';
        sectionTitle.style.color = colors.sectionTitle;
        sectionTitle.style.marginBottom = '8px';
        sectionTitle.style.marginTop = '0';
        variationsContainer.appendChild(sectionTitle);

        // Generate variations using the function from metrica.js
        let variations = [];
        if (typeof generateSilenceVariations === 'function') {
            variations = generateSilenceVariations(basePattern, silenceCount);
        }

        // Create grid for this silence count
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        grid.style.gap = '8px';

        // Create button for each variation (NO LISTENERS - just visual)
        variations.forEach((variation, idx) => {
            const btn = document.createElement('button');
            btn.style.padding = '4px 5px';
            btn.style.height = 'auto'; // Auto height to fit the Bravura font glyphs
            btn.style.lineHeight = 'normal';
            btn.style.border = '1px solid ' + colors.buttonBorder;
            btn.style.borderRadius = '4px';
            btn.style.backgroundColor = colors.buttonBg;
            btn.style.color = '#000'; // MUSICOLI FIX: Black text for Bravura notation legibility
            btn.style.fontFamily = 'Bravura, monospace';
            btn.style.fontSize = '16px';
            btn.style.cursor = 'pointer'; // Pointer cursor
            btn.style.textAlign = 'center';
            btn.style.transition = 'background-color 0.2s';

            // Display the pattern using Bravura notation (inline logic)
            let patternText = '';
            if (typeof noteMap !== 'undefined') {
                patternText = variation.map(val => noteMap[val] || val).join('');
            } else {
                patternText = variation.join(' ');
            }
            btn.innerHTML = patternText;

            // NO onclick listener - just visual display
            // Hover effect for visual feedback only
            btn.onmouseenter = () => { btn.style.backgroundColor = colors.buttonHover; };
            btn.onmouseleave = () => { btn.style.backgroundColor = colors.buttonBg; };

            btn.onclick = () => {
                modal.style.display = 'none';

                // MUSICOLI: Logic to add this variation as a new option
                const content = window.rhythmEditorContent;
                if (content) {
                    // Update: Check for duplicates or generate ID based on existing items
                    // We assume "A" is the base.
                    const existingPatterns = content.querySelectorAll('div[data-pattern]');
                    // If we have A (0), A1 (1), A2 (2)... index will be count.
                    // But if A is 0, then next is 1 = A1.
                    const nextIndex = existingPatterns.length;
                    const labelText = "A" + nextIndex;

                    const cell = document.createElement('div');
                    cell.classList.add('silence-variation'); // Mark as silence variation
                    cell.style.border = '1px solid #444'; // Dark border
                    cell.style.borderRadius = '3px';
                    cell.style.padding = '0px'; // REMOVED PADDING entirely to reduce height
                    cell.style.background = '#222'; // Dark background
                    cell.style.cursor = 'pointer';
                    cell.style.display = 'flex';
                    cell.style.flexDirection = 'column';
                    cell.style.alignItems = 'center';
                    cell.style.minWidth = '35px';
                    cell.style.transition = 'all 0.15s';
                    cell.style.position = 'relative';
                    cell.dataset.pattern = JSON.stringify(variation);

                    // Label
                    const label = document.createElement('div');
                    label.textContent = labelText;
                    label.style.fontSize = '7px';
                    label.style.color = '#90CAF9';
                    label.style.fontWeight = 'bold';
                    label.style.position = 'absolute';
                    label.style.top = '0px'; // Top align
                    label.style.left = '2px';
                    label.style.zIndex = '1';

                    // Notation
                    const notation = document.createElement('div');
                    notation.style.fontFamily = 'Bravura';
                    notation.style.fontSize = '16px';
                    notation.style.color = '#000'; // MUSICOLI FIX: Black notes for legibility
                    notation.style.lineHeight = '0.7'; // Very compact line height
                    notation.style.paddingTop = '6px'; // Reduced padding
                    notation.style.paddingBottom = '0px';
                    notation.style.paddingLeft = '8px'; // Slightly less left padding
                    notation.style.display = 'block'; // Ensure block for height control

                    if (typeof renderPattern === 'function' && typeof noteMap !== 'undefined') {
                        notation.innerHTML = renderPattern(noteMap, variation);
                    } else {
                        notation.textContent = variation.join(' ');
                    }

                    cell.appendChild(label);
                    cell.appendChild(notation);

                    // Add listeners
                    cell.addEventListener('mouseenter', () => {
                        cell.style.borderColor = '#64B5F6'; // Brighter blue on hover
                        cell.style.background = '#333'; // Slightly lighter hover
                        cell.style.transform = 'translateY(-1px)';
                        cell.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
                    });

                    cell.addEventListener('mouseleave', () => {
                        if (!cell.classList.contains('selected')) {
                            cell.style.borderColor = '#444';
                            cell.style.background = '#222';
                            cell.style.transform = 'translateY(0)';
                            cell.style.boxShadow = 'none';
                        }
                    });

                    cell.addEventListener('click', () => {
                        // Store pattern for playback
                        currentPattern = variation;

                        // Clear selection
                        content.querySelectorAll('div').forEach(c => {
                            // Reset styling based on type
                            if (c.parentNode === content || c.parentElement === content) {
                                c.classList.remove('selected');
                                if (c.classList.contains('silence-variation')) {
                                    c.style.borderColor = '#444';
                                    c.style.background = '#222';
                                } else {
                                    c.style.borderColor = '#ddd';
                                    c.style.background = '#fff';
                                }
                            }
                        });

                        // Select
                        cell.classList.add('selected');
                        cell.style.borderColor = '#42A5F5';
                        cell.style.borderWidth = '2px';
                        cell.style.background = '#1565C0'; // Darker blue selection

                        // Update display
                        const display = document.getElementById('rhythm-notation-display');
                        if (display) {
                            const labelSpan = `<span style="font-family: monospace; font-size: 10px; color: #1976D2; font-weight: bold; position: absolute; top: 2px; left: 4px;">${labelText}</span>`;
                            const notesSpan = `<span style="margin-left: 12px; padding-top: 8px; display: inline-block;">${notation.innerHTML}</span>`;
                            display.innerHTML = labelSpan + notesSpan;
                        }

                        // Show accept button
                        if (typeof acceptBtn !== 'undefined' && acceptBtn) {
                            acceptBtn.style.display = 'block';
                        } else {
                            const btn = document.getElementById('rhythm-notation-button');
                            if (btn) btn.style.display = 'block';
                        }

                        // Update color preview
                        if (typeof window.updateRhythmColorPreview === 'function') {
                            window.updateRhythmColorPreview();
                        }
                    });

                    // Append to content
                    content.appendChild(cell);

                    // Trigger selection
                    cell.click();
                }
            };

            grid.appendChild(btn);
        });

        variationsContainer.appendChild(grid);
    }

    modalContent.appendChild(variationsContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Make modal draggable
    makeDraggable(modalContent, header);

    // Close modal when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Helper function to make an element draggable
function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + 'px';
        element.style.left = (element.offsetLeft - pos1) + 'px';
        element.style.position = 'absolute';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Add ternary intervals (3-note patterns, intervals 1-7) to the ladder
function addAllIntervalsToLadder3() {

    const { scaleNotesInRange, vocalRange, scaleName } = ininoti();
    const ladder = document.getElementById('editor-tonalidad-ladder');
    if (!ladder) return;

    // Create or Select Trituplets Container
    let container = document.getElementById('trituplets-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'trituplets-container';
        // MUSICOLI: Display inline to avoid large block spacing when collapsed
        container.style.display = 'inline';
        ladder.appendChild(container);
    }
    container.innerHTML = ''; // Clear ONLY trituplets

    // Global state for toggle (initially hidden)
    if (typeof window.showTritupletRests === 'undefined') {
        window.showTritupletRests = false;
    }

    // MUSICOLI: Note count indicator - shows current number of notes being displayed
    const noteCountIndicator = document.createElement('span');
    noteCountIndicator.textContent = currentGroup.toString();
    noteCountIndicator.style.display = 'inline-block';
    noteCountIndicator.style.width = '20px';
    noteCountIndicator.style.height = '20px';
    noteCountIndicator.style.textAlign = 'center';
    noteCountIndicator.style.lineHeight = '20px';
    noteCountIndicator.style.marginRight = '5px';
    noteCountIndicator.style.verticalAlign = 'middle';
    noteCountIndicator.style.backgroundColor = '#4CAF50'; // Green background
    noteCountIndicator.style.color = '#ffffff';
    noteCountIndicator.style.fontWeight = 'bold';
    noteCountIndicator.style.fontSize = '12px';
    noteCountIndicator.style.fontFamily = 'monospace';
    noteCountIndicator.style.border = '2px solid #2E7D32'; // Darker green border
    noteCountIndicator.style.borderRadius = '3px';
    noteCountIndicator.title = `Número de notas actualmente seleccionadas: ${currentGroup}`;
    container.appendChild(noteCountIndicator);

    // Toggle Button (Inline Icon)
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-trituplet-rests-btn';
    toggleBtn.textContent = '\uD834\uDD3D'; // Symbol for silence (𝄽)
    toggleBtn.title = 'Mostrar/Ocultar Silencios (3)';
    toggleBtn.style.fontSize = '14px';
    toggleBtn.style.lineHeight = '1';
    toggleBtn.style.padding = '2px 6px';
    toggleBtn.style.cursor = 'pointer';
    // MUSICOLI: Visible background as requested
    toggleBtn.style.backgroundColor = '#f0f0f0';
    toggleBtn.style.border = '1px solid #ccc';
    toggleBtn.style.borderRadius = '3px';
    toggleBtn.style.color = window.showTritupletRests ? '#000' : '#888';
    toggleBtn.style.display = 'inline-block';
    toggleBtn.style.verticalAlign = 'middle';
    toggleBtn.style.marginRight = '8px';

    toggleBtn.onclick = () => {
        window.showTritupletRests = !window.showTritupletRests;
        toggleBtn.style.color = window.showTritupletRests ? '#000' : '#888';
        toggleBtn.style.backgroundColor = window.showTritupletRests ? '#fff' : '#f0f0f0'; // Visual feedback

        // Scope to container to be safe
        const restButtons = container.querySelectorAll('[data-has-silence="true"]');
        restButtons.forEach(btn => {
            btn.style.display = window.showTritupletRests ? 'inline-block' : 'none';
        });
    };

    // Append button to the dedicated container
    container.appendChild(toggleBtn);

    // Intervals 1-7: Ascending and Descending (ternary 3-note patterns)
    for (let i = 1; i <= 7; i++) {
        // MUSICOLI: Wrap each interval pair in a container for atomic line breaking
        const intervalWrapper = document.createElement('span');
        intervalWrapper.style.display = 'inline-block';
        intervalWrapper.style.whiteSpace = 'nowrap';
        // Add margin for spacing between groups effectively replacing the old 'gap'
        intervalWrapper.style.marginRight = '10px';
        intervalWrapper.style.verticalAlign = 'top';

        // Ascending (Green)
        addScaleWithInterval3(scaleNotesInRange, vocalRange, scaleName, i, 'ascending', intervalWrapper, false);

        // Small gap between Asc/Desc
        const spacer = document.createElement('span');
        spacer.style.display = 'inline-block';
        spacer.style.width = '5px';
        intervalWrapper.appendChild(spacer);

        // Descending (Red)
        addScaleWithInterval3(scaleNotesInRange, vocalRange, scaleName, i, 'descending', intervalWrapper, false);

        // Append wrapper to main container
        container.appendChild(intervalWrapper);
    }
}

// Add quaternary intervals (4-note patterns with gradient) to the ladder
function addQuaternaryIntervalsToLadder() {
    const { scaleNotesInRange, vocalRange, scaleName } = ininoti();
    const ladder = document.getElementById('editor-tonalidad-ladder');
    if (!ladder) return;

    // Intervals 1-7: Ascending and Descending (quaternary 4-note patterns with gradient)
    for (let i = 1; i <= 7; i++) {
        // Ascending (Green border)
        addScaleWithInterval4(scaleNotesInRange, vocalRange, scaleName, i, 'ascending', null, false);

        // Small gap between Asc/Desc
        const spacer = document.createElement('span');
        spacer.style.display = 'inline-block';
        spacer.style.width = '5px';
        ladder.appendChild(spacer);

        // Descending (Red border)
        addScaleWithInterval4(scaleNotesInRange, vocalRange, scaleName, i, 'descending', null, false);

        // Gap between intervals
        const gap = document.createElement('span');
        gap.style.display = 'inline-block';
        gap.style.width = '10px';
        ladder.appendChild(gap);
    }
}

// Función para crear spans con intervalo específico y dirección para 4 notas con gradiente
function addScaleWithInterval4(allNotesInRange, vocalRange, scaleName, interval, direction, targetElement = null, clearExisting = true) {
    // Validar parámetros
    if (interval < 0) interval = 0;

    // Determinar contenedor padre
    let ladderElement = targetElement;
    if (!ladderElement) {
        ladderElement = document.getElementById('editor-tonalidad-ladder');
        if (ladderElement && clearExisting) {
            const borderColorToRemove = direction === 'ascending' ? '#2E7D32' : '#C62828';
            const children = Array.from(ladderElement.children);
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (child.style && child.style.border === `1px solid ${borderColorToRemove}`) {
                    ladderElement.removeChild(child);
                }
            }
        }
    }

    if (!ladderElement) return;

    // Calcular rango MIDI real
    const midiMin = Math.min(...allNotesInRange.map(n => n.midi));
    const midiMax = Math.max(...allNotesInRange.map(n => n.midi));

    // Función para mapear MIDI a RGB
    const midiToRgb = (midi) => Math.round(50 + ((midi - midiMin) / (midiMax - midiMin)) * (255 - 50));

    // Paso para evitar solapamiento
    let step = 4 * interval;
    if (interval === 0) {
        step = 1;
    }

    // Calcular Skew dinámico
    const skewAngle = interval * 5;

    // Crear spans según dirección
    if (direction === 'ascending') {
        for (let i = 0; i < allNotesInRange.length; i += step) {
            // Check if fourth note index is within bounds
            if (i + (3 * interval) >= allNotesInRange.length) break;

            const firstNote = allNotesInRange[i];
            const secondNote = allNotesInRange[i + interval];
            const thirdNote = allNotesInRange[i + interval + interval];
            const fourthNote = allNotesInRange[i + interval + interval + interval];

            // Color 1 (RGB): Primeras 3 notas
            const color1R = midiToRgb(firstNote.midi);
            const color1G = midiToRgb(secondNote.midi);
            const color1B = midiToRgb(thirdNote.midi);
            const color1 = `rgb(${color1R}, ${color1G}, ${color1B})`;

            // Color 2 (Gris): Cuarta nota
            const color2Gray = midiToRgb(fourthNote.midi);
            const color2 = `rgb(${color2Gray}, ${color2Gray}, ${color2Gray})`;

            // Crear span con gradiente
            const span = document.createElement('span');
            span.dataset.quaternaryElement = 'true';
            span.style.width = '15px';
            span.style.height = '15px';
            span.style.display = 'inline-block';
            span.style.cursor = 'pointer';
            span.style.background = `linear-gradient(to right, ${color1}, ${color2})`;
            span.style.border = '1px solid #2E7D32'; // Verde para ascendente
            span.style.color = getContrastColor(color1);
            span.style.fontSize = '10px';
            span.style.transform = `skewY(-${skewAngle}deg)`;

            span.textContent = '';
            span.title = `4 notas (gradiente) RGB: (${color1R}, ${color1G}, ${color1B}) + Gris: ${color2Gray} MIDI: [${firstNote.midi}, ${secondNote.midi}, ${thirdNote.midi}, ${fourthNote.midi}] Verde ascendente (intervalo ${interval})`;

            // Añadir manejador de clic
            addClickHandler4(span, color1R, color1G, color1B, color2Gray, firstNote, secondNote, thirdNote, fourthNote, [firstNote.midi, secondNote.midi, thirdNote.midi, fourthNote.midi], direction, interval);

            ladderElement.appendChild(span);
        }
    } else if (direction === 'descending') {
        let startIndex = allNotesInRange.length - 1;
        for (let i = startIndex; i >= interval * 3; i -= step) {
            if (i - (3 * interval) < 0) break;

            const firstNote = allNotesInRange[i];
            const secondNote = allNotesInRange[i - interval];
            const thirdNote = allNotesInRange[i - interval - interval];
            const fourthNote = allNotesInRange[i - interval - interval - interval];

            // Color 1 (RGB): Primeras 3 notas
            const color1R = midiToRgb(firstNote.midi);
            const color1G = midiToRgb(secondNote.midi);
            const color1B = midiToRgb(thirdNote.midi);
            const color1 = `rgb(${color1R}, ${color1G}, ${color1B})`;

            // Color 2 (Gris): Cuarta nota
            const color2Gray = midiToRgb(fourthNote.midi);
            const color2 = `rgb(${color2Gray}, ${color2Gray}, ${color2Gray})`;

            // Crear span con gradiente
            const span = document.createElement('span');
            span.dataset.quaternaryElement = 'true';
            span.style.width = '15px';
            span.style.height = '15px';
            span.style.display = 'inline-block';
            span.style.cursor = 'pointer';
            span.style.background = `linear-gradient(to right, ${color1}, ${color2})`;
            span.style.border = '1px solid #C62828'; // Rojo para descendente
            span.style.color = getContrastColor(color1);
            span.style.fontSize = '10px';
            span.style.transform = `skewY(${skewAngle}deg)`;

            span.textContent = '';
            span.title = `4 notas (gradiente) RGB: (${color1R}, ${color1G}, ${color1B}) + Gris: ${color2Gray} MIDI: [${firstNote.midi}, ${secondNote.midi}, ${thirdNote.midi}, ${fourthNote.midi}] Rojo descendente (intervalo ${interval})`;

            // Añadir manejador de clic
            addClickHandler4(span, color1R, color1G, color1B, color2Gray, firstNote, secondNote, thirdNote, fourthNote, [firstNote.midi, secondNote.midi, thirdNote.midi, fourthNote.midi], direction, interval);

            ladderElement.appendChild(span);
        }
    }
}

function addClickHandler4(span, color1R, color1G, color1B, color2Gray, firstNote, secondNote, thirdNote, fourthNote, midiPattern, direction, interval) {
    span.addEventListener('click', () => {
        const container = document.getElementById('selected-tones-container');
        if (!container) return;

        // Color 1 (RGB)
        const hexColor1 = '#' +
            color1R.toString(16).padStart(2, '0') +
            color1G.toString(16).padStart(2, '0') +
            color1B.toString(16).padStart(2, '0');

        // Color 2 (Gris)
        const hexColor2 = '#' +
            color2Gray.toString(16).padStart(2, '0') +
            color2Gray.toString(16).padStart(2, '0') +
            color2Gray.toString(16).padStart(2, '0');

        const MAX_TONES = 8;

        // Añadir PRIMERO el color gris (color 2)
        if (container.children.length >= MAX_TONES) {
            removeLastTone(container);
        }

        const toneSpan2 = document.createElement('span');
        toneSpan2.style.width = '25px';
        toneSpan2.style.height = '25px';
        toneSpan2.style.display = 'inline-block';
        toneSpan2.style.marginRight = '0px';
        toneSpan2.style.cursor = 'pointer';
        toneSpan2.style.backgroundColor = `rgb(${color2Gray}, ${color2Gray}, ${color2Gray})`;
        toneSpan2.style.border = 'none';
        toneSpan2.dataset.midiValues = JSON.stringify([fourthNote.midi]);
        toneSpan2.title = `Gris: ${color2Gray} - MIDI: ${fourthNote.midi}`;

        addToneSpanEventHandlers(toneSpan2, container, hexColor2);
        container.insertBefore(toneSpan2, container.firstChild);

        if (!window.selectedTones) window.selectedTones = [];
        window.selectedTones.unshift({
            hex: hexColor2,
            rgb: { r: color2Gray, g: color2Gray, b: color2Gray },
            midiValues: [fourthNote.midi]
        });

        // Añadir DESPUÉS el color RGB (color 1)
        if (container.children.length >= MAX_TONES) {
            removeLastTone(container);
        }

        const toneSpan1 = document.createElement('span');
        toneSpan1.style.width = '25px';
        toneSpan1.style.height = '25px';
        toneSpan1.style.display = 'inline-block';
        toneSpan1.style.marginRight = '0px';
        toneSpan1.style.cursor = 'pointer';
        toneSpan1.style.backgroundColor = `rgb(${color1R}, ${color1G}, ${color1B})`;
        toneSpan1.style.border = 'none';
        toneSpan1.dataset.midiValues = JSON.stringify([firstNote.midi, secondNote.midi, thirdNote.midi]);
        toneSpan1.title = `RGB: (${color1R}, ${color1G}, ${color1B}) - MIDI: [${firstNote.midi}, ${secondNote.midi}, ${thirdNote.midi}]`;

        addToneSpanEventHandlers(toneSpan1, container, hexColor1);
        container.insertBefore(toneSpan1, container.firstChild);

        window.selectedTones.unshift({
            hex: hexColor1,
            rgb: { r: color1R, g: color1G, b: color1B },
            midiValues: [firstNote.midi, secondNote.midi, thirdNote.midi]
        });

        // Actualizar vista
        if (typeof window.updateRhythmColorPreview === 'function') {
            window.updateRhythmColorPreview();
        }

        if (typeof window.triggerAcceptRhythm === 'function') {
            window.triggerAcceptRhythm();
        }
    });
}

// Globally available helper for contrast
function getContrastColor(color) {
    let r, g, b;
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else {
            r = parseInt(hex.slice(0, 2), 16);
            g = parseInt(hex.slice(2, 4), 16);
            b = parseInt(hex.slice(4, 6), 16);
        }
    } else if (color.startsWith('rgb')) {
        const values = color.substring(color.indexOf('(') + 1, color.indexOf(')')).split(',');
        r = parseInt(values[0]);
        g = parseInt(values[1]);
        b = parseInt(values[2]);
    } else {
        return 'black'; // Fallback
    }

    // YIQ equation
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}

// Add six-interval scales (6-note patterns with gradient of 2 colors) to the ladder
function addSixIntervalsToLadder() {
    const { scaleNotesInRange, vocalRange, scaleName } = ininoti();
    const ladder = document.getElementById('editor-tonalidad-ladder');
    if (!ladder) return;

    // Clear existing content to avoid duplication
    // ladder.innerHTML = ''; // REMOVED to prevent wiping other scales

    // Create or Select Sextuplets Container
    let container = document.getElementById('sextuplets-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'sextuplets-container';
        // Insert at the beginning if we want it top-left, or append? 
        // User wanted button at start of line. 
        // If other scales (Quaternary) are already there, appending might put it after.
        // But usually Sextuplets are 6 intervals, maybe distinct form 4.
        // Let's append for now, or check desired order.
        // MUSICOLI: Display inline to avoid large block spacing when collapsed
        container.style.display = 'inline';
        ladder.appendChild(container);
    }
    container.innerHTML = ''; // Clear ONLY sextuplets

    // Global state for toggle (initially hidden)
    if (typeof window.showSextupletRests === 'undefined') {
        window.showSextupletRests = false;
    }

    // MUSICOLI: Note count indicator - shows current number of notes being displayed
    const noteCountIndicator = document.createElement('span');
    noteCountIndicator.textContent = currentGroup.toString();
    noteCountIndicator.style.display = 'inline-block';
    noteCountIndicator.style.width = '20px';
    noteCountIndicator.style.height = '20px';
    noteCountIndicator.style.textAlign = 'center';
    noteCountIndicator.style.lineHeight = '20px';
    noteCountIndicator.style.marginRight = '5px';
    noteCountIndicator.style.verticalAlign = 'middle';
    noteCountIndicator.style.backgroundColor = '#4CAF50'; // Green background
    noteCountIndicator.style.color = '#ffffff';
    noteCountIndicator.style.fontWeight = 'bold';
    noteCountIndicator.style.fontSize = '12px';
    noteCountIndicator.style.fontFamily = 'monospace';
    noteCountIndicator.style.border = '2px solid #2E7D32'; // Darker green border
    noteCountIndicator.style.borderRadius = '3px';
    noteCountIndicator.title = `Número de notas actualmente seleccionadas: ${currentGroup}`;
    container.appendChild(noteCountIndicator);

    // Toggle Button (Inline Icon)
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-sextuplet-rests-btn';
    toggleBtn.textContent = '\uD834\uDD3D'; // Symbol for silence (𝄽) - Explicit unicode
    // Fallback if font doesn't support it well, maybe use 'R' or 'Sil' if user complains again.
    // toggleBtn.textContent = 'R'; 
    toggleBtn.title = 'Mostrar/Ocultar Silencios';
    toggleBtn.style.fontSize = '14px';
    toggleBtn.style.lineHeight = '1';
    toggleBtn.style.padding = '2px 6px';
    toggleBtn.style.cursor = 'pointer';
    // MUSICOLI: Visible background as requested
    toggleBtn.style.backgroundColor = '#f0f0f0';
    toggleBtn.style.border = '1px solid #ccc';
    toggleBtn.style.borderRadius = '3px';
    toggleBtn.style.color = window.showSextupletRests ? '#000' : '#888';
    toggleBtn.style.display = 'inline-block';
    toggleBtn.style.verticalAlign = 'middle';
    toggleBtn.style.marginRight = '8px';
    // toggleBtn.style.marginBottom = '2px';

    toggleBtn.onclick = () => {
        window.showSextupletRests = !window.showSextupletRests;
        toggleBtn.style.color = window.showSextupletRests ? '#000' : '#888';
        toggleBtn.style.backgroundColor = window.showSextupletRests ? '#fff' : '#f0f0f0'; // Visual feedback

        // MUSICOLI: Efficient toggle using DOM selection instead of regeneration
        // Scope to container to be safe
        const restButtons = container.querySelectorAll('[data-has-silence="true"]');
        restButtons.forEach(btn => {
            btn.style.display = window.showSextupletRests ? 'inline-block' : 'none';
        });
    };

    // Append button to the dedicated container
    container.appendChild(toggleBtn);


    // Global patterns set for deduplication across all intervals/directions
    const sharedPatterns = new Set();

    // Intervals 1-7: Ascending and Descending
    for (let i = 1; i <= 7; i++) {
        // MUSICOLI: Wrap each interval pair in a container for atomic line breaking
        const intervalWrapper = document.createElement('span');
        intervalWrapper.style.display = 'inline-block';
        intervalWrapper.style.whiteSpace = 'nowrap';
        intervalWrapper.style.marginRight = '10px';
        intervalWrapper.style.verticalAlign = 'top';

        // Ascending (Green border)
        // Pass 'intervalWrapper' as targetElement
        addScaleWithInterval6_Fixed(scaleNotesInRange, vocalRange, scaleName, i, 'ascending', intervalWrapper, false, sharedPatterns);

        // Small gap between Asc/Desc
        const spacer = document.createElement('span');
        spacer.style.display = 'inline-block';
        spacer.style.width = '5px';
        intervalWrapper.appendChild(spacer);

        // Descending (Red border)
        addScaleWithInterval6_Fixed(scaleNotesInRange, vocalRange, scaleName, i, 'descending', intervalWrapper, false, sharedPatterns);

        // Append wrapper to main container
        container.appendChild(intervalWrapper);
    }
}

// Función para crear spans con intervalo específico y dirección para 6 notas con gradiente (2 colores)
function addScaleWithInterval6_Fixed(allNotesInRange, vocalRange, scaleName, interval, direction, targetElement = null, clearExisting = true, sharedPatterns = null) {
    const generatedPatterns = sharedPatterns || new Set();
    // Validar parámetros
    if (interval < 0) interval = 0;

    // Determinar contenedor padre
    let ladderElement = targetElement;
    if (!ladderElement) {
        ladderElement = document.getElementById('editor-tonalidad-ladder');
        if (ladderElement && clearExisting) {
            const borderColorToRemove = direction === 'ascending' ? '#2E7D32' : '#C62828';
            const children = Array.from(ladderElement.children);
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (child.style && child.style.border === `1px solid ${borderColorToRemove}`) {
                    ladderElement.removeChild(child);
                }
            }
        }
    }

    if (!ladderElement) return;

    // Calcular rango MIDI real
    const midiMin = Math.min(...allNotesInRange.map(n => n.midi));
    const midiMax = Math.max(...allNotesInRange.map(n => n.midi));

    // Función para mapear MIDI a RGB
    const midiToRgb = (midi) => Math.round(50 + ((midi - midiMin) / (midiMax - midiMin)) * (255 - 50));

    // Paso para evitar solapamiento (6 notas)
    // MUSICOLI: Changed to 1 to allow sliding window (all variations: 123456, 234567...)
    let step = 1;

    // Calcular Skew dinámico
    const skewAngle = interval * 5;

    // Crear spans según dirección
    if (direction === 'ascending') {
        for (let i = 0; i < allNotesInRange.length; i += step) {
            // MUSICOLI: Removed break condition to allow partial groups with padding
            // if (i + (5 * interval) >= allNotesInRange.length) break;

            const notes = [];
            for (let k = 0; k < 6; k++) {
                const noteIndex = i + k * interval;
                if (noteIndex < allNotesInRange.length) {
                    notes.push(allNotesInRange[noteIndex]);
                } else {
                    // Padding with silence zero
                    notes.push({ midi: 0 });
                }
            }

            // Check for duplication
            const patternKey = notes.map(n => n.midi).join(',');
            if (generatedPatterns.has(patternKey)) {
                continue; // Skip if already generated
            }
            generatedPatterns.add(patternKey);

            // Color 1 (RGB): Primeras 3 notas
            const color1R = midiToRgb(notes[0].midi);
            const color1G = midiToRgb(notes[1].midi);
            const color1B = midiToRgb(notes[2].midi);
            const color1 = `rgb(${color1R}, ${color1G}, ${color1B})`;

            // Color 2 (RGB): Últimas 3 notas (en vez de gris)
            const color2R = midiToRgb(notes[3].midi);
            const color2G = midiToRgb(notes[4].midi);
            const color2B = midiToRgb(notes[5].midi);
            const color2 = `rgb(${color2R}, ${color2G}, ${color2B})`;


            // Crear span con gradiente
            const span = document.createElement('span');
            span.dataset.quaternaryElement = 'true'; // Reutilizamos el dataset o creamos uno nuevo
            span.style.width = 'auto'; // Quizás un poco más ancho?
            span.style.padding = '0 2px';
            span.style.height = '15px';
            span.style.padding = '0 2px';
            span.style.height = '15px';

            // MUSICOLI: Hide buttons with silences based on toggle
            const hasSilence = notes.some(n => n.midi === 0);

            // Store status for efficient toggling
            span.dataset.hasSilence = hasSilence ? 'true' : 'false';

            if (hasSilence && !window.showSextupletRests) {
                span.style.display = 'none';
            } else {
                span.style.display = 'inline-block';
            }

            span.style.cursor = 'pointer';
            span.style.background = `linear-gradient(to right, ${color1}, ${color2})`;
            span.style.border = '1px solid #2E7D32'; // Verde para ascendente
            span.style.color = getContrastColor(color2); // Use last color for contrast
            span.style.fontSize = '10px';
            span.style.transform = `skewY(-${skewAngle}deg)`;

            const midiList = notes.map(n => n.midi);

            // MUSICOLI: Generate label text
            let label = notes[0].midi > 0 ? notes[0].midi.toString() : "";

            if (hasSilence) {
                // Show condensed rhythm pattern for silences: FirstMidi + Pattern (.=Rest, |=Note)
                const firstMidi = notes[0].midi > 0 || notes[0].midi === 0 ? notes.find(n => n.midi > 0)?.midi || 0 : 0;
                // Actually, per request: "el primer midi a constinuación la serie de puntos o barras"
                // If the first note is silence (0), finding the first actual midi might make more sense, 
                // but user said "primer midi", usually meaning the start, or maybe the anchor note.
                // Let's use the first non-zero midi if available, or 0 if all silence.
                const validMidi = notes.find(n => n.midi > 0)?.midi || notes[0].midi;

                const rhythmPattern = notes.map(n => n.midi === 0 ? '.' : '|').join('');
                label = `${validMidi} ${rhythmPattern}`;
            }
            span.textContent = label;

            span.title = `6 notas (gradiente) RGB1: [${midiList.slice(0, 3)}] RGB2: [${midiList.slice(3, 6)}] Verde scendente (intervalo ${interval})`;

            // Añadir manejador de clic
            addClickHandler6(span, { r: color1R, g: color1G, b: color1B }, { r: color2R, g: color2G, b: color2B }, notes, interval);

            ladderElement.appendChild(span);
        }
    } else if (direction === 'descending') {
        let startIndex = allNotesInRange.length - 1;
        // MUSICOLI: Changed step to 1 for sliding window
        for (let i = startIndex; i >= 0; i -= step) { // Changed condition to i >= 0
            // MUSICOLI: Removed break condition
            // if (i - (5 * interval) < 0) break;

            const notes = [];
            for (let k = 0; k < 6; k++) {
                const noteIndex = i - k * interval; // Descending goes backwards
                if (noteIndex >= 0) {
                    notes.push(allNotesInRange[noteIndex]);
                } else {
                    // Padding with silence zero
                    notes.push({ midi: 0 });
                }
            }

            // Check for duplication
            const patternKey = notes.map(n => n.midi).join(',');
            if (generatedPatterns.has(patternKey)) {
                continue; // Skip if already generated
            }
            generatedPatterns.add(patternKey);
            // Note: In descending, notes[0] is high, notes[5] is low.

            // Color 1 (RGB): Primeras 3 notas
            const color1R = midiToRgb(notes[0].midi);
            const color1G = midiToRgb(notes[1].midi);
            const color1B = midiToRgb(notes[2].midi);
            const color1 = `rgb(${color1R}, ${color1G}, ${color1B})`;

            // Color 2 (RGB): Últimas 3 notas
            const color2R = midiToRgb(notes[3].midi);
            const color2G = midiToRgb(notes[4].midi);
            const color2B = midiToRgb(notes[5].midi);
            const color2 = `rgb(${color2R}, ${color2G}, ${color2B})`;


            // Crear span con gradiente
            const span = document.createElement('span');
            span.dataset.quaternaryElement = 'true';
            span.style.width = 'auto';
            span.style.padding = '0 2px';
            span.style.height = '15px';

            // MUSICOLI: Hide buttons with silences based on toggle
            const hasSilence = notes.some(n => n.midi === 0);

            // Store status for efficient toggling
            span.dataset.hasSilence = hasSilence ? 'true' : 'false';

            if (hasSilence && !window.showSextupletRests) {
                span.style.display = 'none';
            } else {
                span.style.display = 'inline-block';
            }

            span.style.cursor = 'pointer';
            span.style.background = `linear-gradient(to right, ${color1}, ${color2})`;
            span.style.border = '1px solid #C62828'; // Rojo para descendente
            span.style.color = getContrastColor(color2); // Use last color for contrast
            span.style.fontSize = '10px';
            span.style.transform = `skewY(${skewAngle}deg)`;

            const midiList = notes.map(n => n.midi);

            // MUSICOLI: Generate label text
            let label = notes[0].midi > 0 ? notes[0].midi.toString() : "";

            if (hasSilence) {
                // Show condensed rhythm pattern for silences: FirstMidi + Pattern (.=Rest, |=Note)
                const validMidi = notes.find(n => n.midi > 0)?.midi || notes[0].midi;
                const rhythmPattern = notes.map(n => n.midi === 0 ? '.' : '|').join('');
                label = `${validMidi} ${rhythmPattern}`;
            }
            span.textContent = label;

            span.title = `6 notas (gradiente) RGB1: [${midiList.slice(0, 3)}] RGB2: [${midiList.slice(3, 6)}] Rojo descendente (intervalo ${interval})`;

            // Añadir manejador de clic
            addClickHandler6(span, { r: color1R, g: color1G, b: color1B }, { r: color2R, g: color2G, b: color2B }, notes, interval);

            ladderElement.appendChild(span);
        }
    }
}

function addClickHandler6(span, rgb1, rgb2, notes, interval) {
    span.addEventListener('click', () => {
        const container = document.getElementById('selected-tones-container');
        if (!container) return;

        // Color 1 (RGB) Hex
        const hexColor1 = '#' +
            rgb1.r.toString(16).padStart(2, '0') +
            rgb1.g.toString(16).padStart(2, '0') +
            rgb1.b.toString(16).padStart(2, '0');

        // Color 2 (RGB) Hex
        const hexColor2 = '#' +
            rgb2.r.toString(16).padStart(2, '0') +
            rgb2.g.toString(16).padStart(2, '0') +
            rgb2.b.toString(16).padStart(2, '0');

        const MAX_TONES = 8; // Adjust if needed

        // Añadir PRIMERO el color 2 (para que quede a la derecha si usamos unshift/insertBeforeFirst)
        // Wait, logic is: insertBefore(firstChild) -> adds to LEFT.
        // We want visual: [Color1] [Color2]
        // Step 1: Add C2. List: [C2]
        // Step 2: Add C1. List: [C1, C2]
        // Check `removeLastTone` logic... usually keeps recent ones.

        if (container.children.length >= MAX_TONES) removeLastTone(container);

        const toneSpan2 = document.createElement('span');
        toneSpan2.style.width = '25px';
        toneSpan2.style.height = '25px';
        toneSpan2.style.display = 'inline-block';
        toneSpan2.style.marginRight = '0px';
        toneSpan2.style.cursor = 'pointer';
        toneSpan2.style.backgroundColor = `rgb(${rgb2.r}, ${rgb2.g}, ${rgb2.b})`;
        toneSpan2.style.border = 'none';

        // Notes 3,4,5
        const midis2 = notes.slice(3, 6).map(n => n.midi);
        toneSpan2.dataset.midiValues = JSON.stringify(midis2);
        toneSpan2.title = `RGB2: (${rgb2.r},${rgb2.g},${rgb2.b}) - MIDI: [${midis2}]`;

        addToneSpanEventHandlers(toneSpan2, container, hexColor2);
        container.insertBefore(toneSpan2, container.firstChild);

        // Add to window global (if needed by other logic)
        if (!window.selectedTones) window.selectedTones = [];
        window.selectedTones.unshift({
            hex: hexColor2,
            rgb: rgb2,
            midiValues: midis2
        });


        // Añadir DESPUÉS el color 1 (para que quede a la izquierda)
        if (container.children.length >= MAX_TONES) removeLastTone(container);

        const toneSpan1 = document.createElement('span');
        toneSpan1.style.width = '25px';
        toneSpan1.style.height = '25px';
        toneSpan1.style.display = 'inline-block';
        toneSpan1.style.marginRight = '0px';
        toneSpan1.style.cursor = 'pointer';
        toneSpan1.style.backgroundColor = `rgb(${rgb1.r}, ${rgb1.g}, ${rgb1.b})`;
        toneSpan1.style.border = 'none';

        // Notes 0,1,2
        const midis1 = notes.slice(0, 3).map(n => n.midi);
        toneSpan1.dataset.midiValues = JSON.stringify(midis1);
        toneSpan1.title = `RGB1: (${rgb1.r},${rgb1.g},${rgb1.b}) - MIDI: [${midis1}]`;

        addToneSpanEventHandlers(toneSpan1, container, hexColor1);
        container.insertBefore(toneSpan1, container.firstChild);

        window.selectedTones.unshift({
            hex: hexColor1,
            rgb: rgb1,
            midiValues: midis1
        });

        // Actualizar vista
        if (typeof window.updateRhythmColorPreview === 'function') {
            window.updateRhythmColorPreview();
        }

        if (typeof window.triggerAcceptRhythm === 'function') {
            window.triggerAcceptRhythm();
        }
    });
}





// Add six-interval scales (6-note patterns with gradient of 2 colors) to the ladder
// Add nine-interval scales (9-note patterns with gradient of 3 colors) to the ladder
function addNineIntervalsToLadder() {
    const { scaleNotesInRange, vocalRange, scaleName } = ininoti();
    const ladder = document.getElementById('editor-tonalidad-ladder');
    if (!ladder) return;

    // Create or Select Ninetuplets Container
    let container = document.getElementById('ninetuplets-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ninetuplets-container';
        // MUSICOLI: Display inline to avoid large block spacing when collapsed
        container.style.display = 'inline';
        ladder.appendChild(container);
    }
    container.innerHTML = ''; // Clear ONLY ninetuplets

    // Global state for toggle (initially hidden)
    if (typeof window.showNinetupletRests === 'undefined') {
        window.showNinetupletRests = false;
    }

    // MUSICOLI: Note count indicator - shows current number of notes being displayed
    const noteCountIndicator = document.createElement('span');
    noteCountIndicator.textContent = currentGroup.toString();
    noteCountIndicator.style.display = 'inline-block';
    noteCountIndicator.style.width = '20px';
    noteCountIndicator.style.height = '20px';
    noteCountIndicator.style.textAlign = 'center';
    noteCountIndicator.style.lineHeight = '20px';
    noteCountIndicator.style.marginRight = '5px';
    noteCountIndicator.style.verticalAlign = 'middle';
    noteCountIndicator.style.backgroundColor = '#4CAF50'; // Green background
    noteCountIndicator.style.color = '#ffffff';
    noteCountIndicator.style.fontWeight = 'bold';
    noteCountIndicator.style.fontSize = '12px';
    noteCountIndicator.style.fontFamily = 'monospace';
    noteCountIndicator.style.border = '2px solid #2E7D32'; // Darker green border
    noteCountIndicator.style.borderRadius = '3px';
    noteCountIndicator.title = `Número de notas actualmente seleccionadas: ${currentGroup}`;
    container.appendChild(noteCountIndicator);

    // Toggle Button (Inline Icon)
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-ninetuplet-rests-btn';
    toggleBtn.textContent = '\uD834\uDD3D'; // Symbol for silence (𝄽)
    toggleBtn.title = 'Mostrar/Ocultar Silencios (9)';
    toggleBtn.style.fontSize = '14px';
    toggleBtn.style.lineHeight = '1';
    toggleBtn.style.padding = '2px 6px';
    toggleBtn.style.cursor = 'pointer';
    // MUSICOLI: Visible background as requested
    toggleBtn.style.backgroundColor = '#f0f0f0';
    toggleBtn.style.border = '1px solid #ccc';
    toggleBtn.style.borderRadius = '3px';
    toggleBtn.style.color = window.showNinetupletRests ? '#000' : '#888';
    toggleBtn.style.display = 'inline-block';
    toggleBtn.style.verticalAlign = 'middle';
    toggleBtn.style.marginRight = '8px';

    toggleBtn.onclick = () => {
        window.showNinetupletRests = !window.showNinetupletRests;
        toggleBtn.style.color = window.showNinetupletRests ? '#000' : '#888';
        toggleBtn.style.backgroundColor = window.showNinetupletRests ? '#fff' : '#f0f0f0'; // Visual feedback

        // Scope to container to be safe
        const restButtons = container.querySelectorAll('[data-has-silence="true"]');
        restButtons.forEach(btn => {
            btn.style.display = window.showNinetupletRests ? 'inline-block' : 'none';
        });
    };

    // Append button to the dedicated container
    container.appendChild(toggleBtn);


    // Global patterns set for deduplication across all intervals/directions
    const sharedPatterns = new Set();

    // Intervals 1-7: Ascending and Descending
    for (let i = 1; i <= 7; i++) {
        // MUSICOLI: Wrap each interval pair in a container for atomic line breaking
        const intervalWrapper = document.createElement('span');
        intervalWrapper.style.display = 'inline-block';
        intervalWrapper.style.whiteSpace = 'nowrap';
        intervalWrapper.style.marginRight = '10px';
        intervalWrapper.style.verticalAlign = 'top';

        // Ascending (Green border)
        addScaleWithInterval9_Fixed(scaleNotesInRange, vocalRange, scaleName, i, 'ascending', intervalWrapper, false, sharedPatterns);

        // Small gap between Asc/Desc
        const spacer = document.createElement('span');
        spacer.style.display = 'inline-block';
        spacer.style.width = '5px';
        intervalWrapper.appendChild(spacer);

        // Descending (Red border)
        addScaleWithInterval9_Fixed(scaleNotesInRange, vocalRange, scaleName, i, 'descending', intervalWrapper, false, sharedPatterns);

        // Append wrapper to main container
        container.appendChild(intervalWrapper);
    }
}

// Función para crear spans con intervalo específico y dirección para 6 notas con gradiente (2 colores)
function addScaleWithInterval9_Fixed(allNotesInRange, vocalRange, scaleName, interval, direction, targetElement = null, clearExisting = true, sharedPatterns = null) {
    const generatedPatterns = sharedPatterns || new Set();
    // Validar parámetros
    if (interval < 0) interval = 0;

    // Determinar contenedor padre
    let ladderElement = targetElement;
    if (!ladderElement) {
        ladderElement = document.getElementById('editor-tonalidad-ladder');
        if (ladderElement && clearExisting) {
            const borderColorToRemove = direction === 'ascending' ? '#2E7D32' : '#C62828';
            const children = Array.from(ladderElement.children);
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (child.style && child.style.border === `1px solid ${borderColorToRemove}`) {
                    ladderElement.removeChild(child);
                }
            }
        }
    }

    if (!ladderElement) return;

    // Calcular rango MIDI real
    const midiMin = Math.min(...allNotesInRange.map(n => n.midi));
    const midiMax = Math.max(...allNotesInRange.map(n => n.midi));

    // Función para mapear MIDI a RGB
    const midiToRgb = (midi) => Math.round(50 + ((midi - midiMin) / (midiMax - midiMin)) * (255 - 50));

    // Paso para evitar solapamiento (6 notas)
    // MUSICOLI: Changed to 1 to allow sliding window (all variations: 123456, 234567...)
    let step = 1;

    // Calcular Skew dinámico
    const skewAngle = interval * 5;

    // Crear spans según dirección
    if (direction === 'ascending') {
        for (let i = 0; i < allNotesInRange.length; i += step) {
            // MUSICOLI: Removed break condition to allow partial groups with padding
            // if (i + (5 * interval) >= allNotesInRange.length) break;

            const notes = [];
            for (let k = 0; k < 9; k++) {
                const noteIndex = i + k * interval;
                if (noteIndex < allNotesInRange.length) {
                    notes.push(allNotesInRange[noteIndex]);
                } else {
                    // Padding with silence zero
                    notes.push({ midi: 0 });
                }
            }

            // Check for duplication
            const patternKey = notes.map(n => n.midi).join(',');
            if (generatedPatterns.has(patternKey)) {
                continue; // Skip if already generated
            }
            generatedPatterns.add(patternKey);

            // Color 1 (RGB): Primeras 3 notas
            const color1R = midiToRgb(notes[0].midi);
            const color1G = midiToRgb(notes[1].midi);
            const color1B = midiToRgb(notes[2].midi);
            const color1 = `rgb(${color1R}, ${color1G}, ${color1B})`;

            // Color 2 (RGB): Notas 4-6
            const color2R = midiToRgb(notes[3].midi);
            const color2G = midiToRgb(notes[4].midi);
            const color2B = midiToRgb(notes[5].midi);
            const color2 = `rgb(${color2R}, ${color2G}, ${color2B})`;

            // Color 3 (RGB): Notas 7-9
            const color3R = midiToRgb(notes[6].midi);
            const color3G = midiToRgb(notes[7].midi);
            const color3B = midiToRgb(notes[8].midi);
            const color3 = `rgb(${color3R}, ${color3G}, ${color3B})`;

            // Crear span con gradiente
            const span = document.createElement('span');
            span.dataset.quaternaryElement = 'true'; // Reutilizamos el dataset o creamos uno nuevo
            span.style.width = 'auto'; // Quizás un poco más ancho?
            span.style.padding = '0 2px';
            span.style.height = '15px';
            span.style.padding = '0 2px';
            span.style.height = '15px';

            // MUSICOLI: Hide buttons with silences based on toggle
            const hasSilence = notes.some(n => n.midi === 0);

            // Store status for efficient toggling
            span.dataset.hasSilence = hasSilence ? 'true' : 'false';

            if (hasSilence && !window.showNinetupletRests) {
                span.style.display = 'none';
            } else {
                span.style.display = 'inline-block';
            }

            span.style.cursor = 'pointer';
            span.style.background = `linear-gradient(to right, ${color1}, ${color2}, ${color3})`;
            span.style.border = '1px solid #2E7D32'; // Verde para ascendente
            // MUSICOLI: User requested to use contrast of the LAST color (color3) for the text
            span.style.color = getContrastColor(color3);
            span.style.fontSize = '10px';
            span.style.transform = `skewY(-${skewAngle}deg)`;

            const midiList = notes.map(n => n.midi);

            // MUSICOLI: Generate label text
            let label = notes[0].midi > 0 ? notes[0].midi.toString() : "";

            if (hasSilence) {
                // Show condensed rhythm pattern for silences: FirstMidi + Pattern (.=Rest, |=Note)
                const validMidi = notes.find(n => n.midi > 0)?.midi || notes[0].midi;
                const rhythmPattern = notes.map(n => n.midi === 0 ? '.' : '|').join('');
                label = `${validMidi} ${rhythmPattern}`;
            }
            span.textContent = label;

            span.title = `9 notas (gradiente) RGB1: [${midiList.slice(0, 3)}] RGB2: [${midiList.slice(3, 6)}] RGB3: [${midiList.slice(6, 9)}] Verde ascendente (intervalo ${interval})`;

            // Añadir manejador de clic
            addClickHandler9(span, { r: color1R, g: color1G, b: color1B }, { r: color2R, g: color2G, b: color2B }, { r: color3R, g: color3G, b: color3B }, notes, interval);

            ladderElement.appendChild(span);
        }
    } else if (direction === 'descending') {
        let startIndex = allNotesInRange.length - 1;
        // MUSICOLI: Changed step to 1 for sliding window
        for (let i = startIndex; i >= 0; i -= step) { // Changed condition to i >= 0
            // MUSICOLI: Removed break condition
            // if (i - (5 * interval) < 0) break;

            const notes = [];
            for (let k = 0; k < 9; k++) {
                const noteIndex = i - k * interval; // Descending goes backwards
                if (noteIndex >= 0) {
                    notes.push(allNotesInRange[noteIndex]);
                } else {
                    // Padding with silence zero
                    notes.push({ midi: 0 });
                }
            }
            // Note: In descending, notes[0] is high, notes[5] is low.

            // Check for duplication
            const patternKey = notes.map(n => n.midi).join(',');
            if (generatedPatterns.has(patternKey)) {
                continue; // Skip if already generated
            }
            generatedPatterns.add(patternKey);

            // Color 1 (RGB): Primeras 3 notas
            const color1R = midiToRgb(notes[0].midi);
            const color1G = midiToRgb(notes[1].midi);
            const color1B = midiToRgb(notes[2].midi);
            const color1 = `rgb(${color1R}, ${color1G}, ${color1B})`;

            // Color 2 (RGB): Notas 4-6
            const color2R = midiToRgb(notes[3].midi);
            const color2G = midiToRgb(notes[4].midi);
            const color2B = midiToRgb(notes[5].midi);
            const color2 = `rgb(${color2R}, ${color2G}, ${color2B})`;

            // Color 3 (RGB): Notas 7-9
            const color3R = midiToRgb(notes[6].midi);
            const color3G = midiToRgb(notes[7].midi);
            const color3B = midiToRgb(notes[8].midi);
            const color3 = `rgb(${color3R}, ${color3G}, ${color3B})`;


            // Crear span con gradiente
            const span = document.createElement('span');
            span.dataset.quaternaryElement = 'true';
            span.style.width = 'auto';
            span.style.padding = '0 2px';
            span.style.height = '15px';

            // MUSICOLI: Hide buttons with silences based on toggle
            const hasSilence = notes.some(n => n.midi === 0);

            // Store status for efficient toggling
            span.dataset.hasSilence = hasSilence ? 'true' : 'false';

            if (hasSilence && !window.showNinetupletRests) {
                span.style.display = 'none';
            } else {
                span.style.display = 'inline-block';
            }

            span.style.cursor = 'pointer';
            span.style.background = `linear-gradient(to right, ${color1}, ${color2}, ${color3})`;
            span.style.border = '1px solid #C62828'; // Rojo para descendente
            // MUSICOLI: User requested to use contrast of the LAST color (color3) for the text
            span.style.color = getContrastColor(color3);
            span.style.fontSize = '10px';
            span.style.transform = `skewY(${skewAngle}deg)`;

            const midiList = notes.map(n => n.midi);

            // MUSICOLI: Generate label text
            let label = notes[0].midi > 0 ? notes[0].midi.toString() : "";

            if (hasSilence) {
                // Show condensed rhythm pattern for silences: FirstMidi + Pattern (.=Rest, |=Note)
                const validMidi = notes.find(n => n.midi > 0)?.midi || notes[0].midi;
                const rhythmPattern = notes.map(n => n.midi === 0 ? '.' : '|').join('');
                label = `${validMidi} ${rhythmPattern}`;
            }
            span.textContent = label;

            span.title = `9 notas (gradiente) RGB1: [${midiList.slice(0, 3)}] RGB2: [${midiList.slice(3, 6)}] RGB3: [${midiList.slice(6, 9)}] Rojo descendente (intervalo ${interval})`;

            // Añadir manejador de clic
            addClickHandler9(span, { r: color1R, g: color1G, b: color1B }, { r: color2R, g: color2G, b: color2B }, { r: color3R, g: color3G, b: color3B }, notes, interval);

            ladderElement.appendChild(span);
        }
    }
}

function addClickHandler9(span, rgb1, rgb2, rgb3, notes, interval) {
    span.addEventListener('click', () => {
        const container = document.getElementById('selected-tones-container');
        if (!container) return;

        // Color 1 (RGB) Hex
        const hexColor1 = '#' +
            rgb1.r.toString(16).padStart(2, '0') +
            rgb1.g.toString(16).padStart(2, '0') +
            rgb1.b.toString(16).padStart(2, '0');

        // Color 2 (RGB) Hex
        const hexColor2 = '#' +
            rgb2.r.toString(16).padStart(2, '0') +
            rgb2.g.toString(16).padStart(2, '0') +
            rgb2.b.toString(16).padStart(2, '0');

        // Color 3 (RGB) Hex
        const hexColor3 = '#' +
            rgb3.r.toString(16).padStart(2, '0') +
            rgb3.g.toString(16).padStart(2, '0') +
            rgb3.b.toString(16).padStart(2, '0');


        const MAX_TONES = 12; // Increased for 9-tuples

        // Order of insertion: Last inserted appears FIRST (Left)
        // We want visual: [Color1] [Color2] [Color3]
        // So we insert C3, then C2, then C1.

        // 1. Color 3 (Rightmost)
        if (container.children.length >= MAX_TONES) removeLastTone(container);

        const toneSpan3 = document.createElement('span');
        toneSpan3.style.width = '25px';
        toneSpan3.style.height = '25px';
        toneSpan3.style.display = 'inline-block';
        toneSpan3.style.marginRight = '0px';
        toneSpan3.style.cursor = 'pointer';
        toneSpan3.style.backgroundColor = `rgb(${rgb3.r}, ${rgb3.g}, ${rgb3.b})`;
        toneSpan3.style.border = 'none';

        // Notes 6,7,8
        const midis3 = notes.slice(6, 9).map(n => n.midi);
        toneSpan3.dataset.midiValues = JSON.stringify(midis3);
        toneSpan3.title = `RGB3: (${rgb3.r},${rgb3.g},${rgb3.b}) - MIDI: [${midis3}]`;

        addToneSpanEventHandlers(toneSpan3, container, hexColor3);
        container.insertBefore(toneSpan3, container.firstChild);

        if (!window.selectedTones) window.selectedTones = [];
        window.selectedTones.unshift({
            hex: hexColor3,
            rgb: rgb3,
            midiValues: midis3
        });

        // 2. Color 2 (Middle)
        if (container.children.length >= MAX_TONES) removeLastTone(container);

        const toneSpan2 = document.createElement('span');
        toneSpan2.style.width = '25px';
        toneSpan2.style.height = '25px';
        toneSpan2.style.display = 'inline-block';
        toneSpan2.style.marginRight = '0px';
        toneSpan2.style.cursor = 'pointer';
        toneSpan2.style.backgroundColor = `rgb(${rgb2.r}, ${rgb2.g}, ${rgb2.b})`;
        toneSpan2.style.border = 'none';

        // Notes 3,4,5
        const midis2 = notes.slice(3, 6).map(n => n.midi);
        toneSpan2.dataset.midiValues = JSON.stringify(midis2);
        toneSpan2.title = `RGB2: (${rgb2.r},${rgb2.g},${rgb2.b}) - MIDI: [${midis2}]`;

        addToneSpanEventHandlers(toneSpan2, container, hexColor2);
        container.insertBefore(toneSpan2, container.firstChild);

        window.selectedTones.unshift({
            hex: hexColor2,
            rgb: rgb2,
            midiValues: midis2
        });

        // 3. Color 1 (Leftmost)
        if (container.children.length >= MAX_TONES) removeLastTone(container);

        const toneSpan1 = document.createElement('span');
        toneSpan1.style.width = '25px';
        toneSpan1.style.height = '25px';
        toneSpan1.style.display = 'inline-block';
        toneSpan1.style.marginRight = '0px';
        toneSpan1.style.cursor = 'pointer';
        toneSpan1.style.backgroundColor = `rgb(${rgb1.r}, ${rgb1.g}, ${rgb1.b})`;
        toneSpan1.style.border = 'none';

        // Notes 0,1,2
        const midis1 = notes.slice(0, 3).map(n => n.midi);
        toneSpan1.dataset.midiValues = JSON.stringify(midis1);
        toneSpan1.title = `RGB1: (${rgb1.r},${rgb1.g},${rgb1.b}) - MIDI: [${midis1}]`;

        addToneSpanEventHandlers(toneSpan1, container, hexColor1);
        container.insertBefore(toneSpan1, container.firstChild);

        window.selectedTones.unshift({
            hex: hexColor1,
            rgb: rgb1,
            midiValues: midis1
        });

        // Actualizar vista
        if (typeof window.updateRhythmColorPreview === 'function') {
            window.updateRhythmColorPreview();
        }

        if (typeof window.triggerAcceptRhythm === 'function') {
            window.triggerAcceptRhythm();
        }
    });
}


// Helper: Convert HSL to RGB
function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function geniladi(start, step, numColores) {
    if (start < 0 || start > 255 || numColores < 1) {
        // throw new Error("Parámetros inválidos");
    }
    const totalValores = numColores * 3;  // cada color tiene R, G, B
    const secuencia = [];

    // Si empezamos en 60 (Do central), forzamos escala de Do Mayor
    // Intervalos de escala mayor: T, T, S, T, T, T, S (2, 2, 1, 2, 2, 2, 1)
    const intervalos = (start === 60)
        ? [2, 2, 1, 2, 2, 2, 1]
        : [step, step, step, step, step, step, step]; // Si no, usamos el step genérico

    let notaActual = start;

    for (let i = 0; i < totalValores; i++) {
        secuencia.push(notaActual);
        // Sumar el intervalo correspondiente
        // Si es Do Mayor, usamos el array de intervalos cíclico
        // Si no, usamos el step fijo
        if (start === 60) {
            notaActual += intervalos[i % 7];
        } else {
            notaActual += step;
        }
    }

    const colores = [];
    for (let i = 0; i < numColores; i++) {
        const r = secuencia[i * 3];
        const g = secuencia[i * 3 + 1];
        const b = secuencia[i * 3 + 2];
        colores.push({
            r, g, b,
            rgb: `rgb(${r},${g},${b})`
        });
    }
    return { colores, secuencia };
}

//  old  funtion updateChromaticSemitones()
function makeladi01(hexi = '#999') {
    const { scaleNotesInRange, vocalRange, scaleName } = ininoti();
    const ladderElement = document.getElementById('editor-tonalidad-ladder');
    if (!ladderElement) return;

    // Clear everything first
    ladderElement.innerHTML = '';

    if (currentGroup == 1) {
        // Sección 1: Intervalos Monocromáticos (interval 0, single notes)
        //addMonochromaticIntervalsToLadder();
        //addScaleWithInterval3(scaleNotesInRange, vocalRange, scaleName, 0, 'ascending', null, false);
        monocromati()
    }
    if (currentGroup == 2) {
        // Sección 2: Intervalos Binarios (2-note patterns, intervals 1-7)
        addBinaryIntervalsToLadder();
    }
    if (currentGroup == 3) {
        // Sección 3: Intervalos Ternarios (3-note patterns, intervals 1-7)
        //addAllIntervalsToLadder3();
        addScaleWithInterval3(scaleNotesInRange, vocalRange, scaleName, 3, 'ascending', null, false);
    }
    // Line break after monochromatic
    const br1 = document.createElement('br');
    ladderElement.appendChild(br1);

    // Sección 2: Intervalos Binarios (2-note patterns, intervals 1-7)
    addBinaryIntervalsToLadder();

    // Line break after binary
    const br2 = document.createElement('br');
    ladderElement.appendChild(br2);

    // Sección 3: Intervalos Ternarios (3-note patterns, intervals 1-7)
    addAllIntervalsToLadder3();
}


function makeladi02(hexi) {
    document.getElementById('editor-tonalidad-ladder').innerHTML = '';

    // Sección: Intervalos Ternarios (Monocromáticos)
    addMonochromaticIntervalsToLadder();
    // Sección: Intervalos Binarios
    addBinaryIntervalsToLadder();
    // Sección: Intervalos Ternarios (Ternarios)
    addAllIntervalsToLadder3();


}


// Update chromatic semitones in the tonalidad ladder
function makeladi(hexi = '#ff0000') {
    const ladderElement = document.getElementById('editor-tonalidad-ladder');
    if (!ladderElement) return;
    const { allNotesInRange, scaleNotesInRange, scaleIntervals, vocalRange, scaleName } = ininoti()
    // Clear everything first
    ladderElement.innerHTML = '';

    // ========== LINE 1: Number Selector ==========
    const selectorContainer = document.createElement('div');
    selectorContainer.id = 'note-count-selector';
    selectorContainer.style.display = 'block';
    selectorContainer.style.marginBottom = '5px';
    selectorContainer.title = 'Número de notas del compás';
    selectorContainer.style.padding = '5px';
    selectorContainer.style.borderRadius = '6px';

    // Add Label
    const label = document.createElement('span');
    label.textContent = 'Notas: ';
    label.style.fontWeight = 'bold';
    label.style.fontSize = '12px';
    label.style.marginRight = '5px';
    label.style.color = '#333';
    selectorContainer.appendChild(label);

    if (typeof trilipi !== 'undefined') {
        const maxLimit = Math.min(trilipi.length, 9);
        for (let i = 1; i < maxLimit; i++) {
            if (!trilipi[i]) continue;
            const btn = document.createElement('span');
            btn.textContent = i.toString();
            btn.title = `Seleccionar ${i} nota(s)`;
            btn.style.display = 'inline-block';
            btn.style.width = '20px';
            btn.style.height = '20px';
            btn.style.textAlign = 'center';
            btn.style.lineHeight = '20px';
            btn.style.margin = '0 2px';
            btn.style.cursor = 'pointer';
            btn.style.borderRadius = '3px';
            btn.style.fontSize = '12px';
            btn.style.fontFamily = 'monospace';

            if (currentGroup === i) {
                btn.style.backgroundColor = '#666';
                btn.style.color = 'white';
                btn.style.fontWeight = 'bold';
            } else {
                btn.style.backgroundColor = '#f0f0f0';
                btn.style.color = '#333';
            }

            btn.onmouseenter = () => { if (currentGroup !== i) btn.style.backgroundColor = '#e0e0e0'; };
            btn.onmouseleave = () => { if (currentGroup !== i) btn.style.backgroundColor = '#f0f0f0'; };

            btn.onclick = () => {
                if (typeof window.updateSelect === 'function') {
                    window.updateSelect(i);
                } else {
                    currentGroup = i;
                }
                makeladi();
            };
            selectorContainer.appendChild(btn);
        }
    }
    ladderElement.appendChild(selectorContainer);

    // ========== LINE 2: Rhythm Patterns ==========
    const rhythmSlot = document.createElement('div');
    rhythmSlot.id = 'rhythm-patterns-slot';
    rhythmSlot.style.display = 'block';
    rhythmSlot.style.width = '100%';
    rhythmSlot.style.marginTop = '2px';
    rhythmSlot.style.marginBottom = '5px';

    // Check if rhythm content already exists and re-attach (persistence fix)
    if (window.rhythmEditorContent) {
        rhythmSlot.appendChild(window.rhythmEditorContent);
    }
    ladderElement.appendChild(rhythmSlot);

    // ========== LINE 3: Monochromatic Scale (always visible) ==========
    monocromati()

    // Add line break after monochromatic scale
    const br = document.createElement('br');
    br.style.lineHeight = '0.5';
    br.style.fontSize = '8px';
    ladderElement.appendChild(br);

    // ========== LINE 4: Generated scale based on note count ==========
    if (currentGroup == 1) {
        // 1 note selected: Only monochromatic scale visible (no additional scales)
    }
    else if (currentGroup == 2 || currentGroup == 3) {
        // 2-3 notes selected: Add 3-note scale
        addAllIntervalsToLadder3();
    }
    else if (currentGroup >= 4 && currentGroup <= 6) {
        // 4-6 notes selected: Add 6-note scale
        addSixIntervalsToLadder();
    }
    else if (currentGroup >= 7 && currentGroup <= 8) {
        // 7-8 notes selected: Add 9-note scale
        addNineIntervalsToLadder();
    }

    wrifuti(allNotesInRange, scaleNotesInRange, scaleIntervals, vocalRange, scaleName)
}

// Get vocal range for the selected voice
function getVocalRange() {
    const voiceSelector = document.getElementById('voice-selector');
    let voice = voiceSelector ? voiceSelector.value : 'soprano'; // Default to soprano implies 'soprano' is selected in dropdown

    // MUSICOLI: Map short codes to full names if necessary
    const codeMap = { 's': 'soprano', 'a': 'contralto', 't': 'tenor', 'b': 'bajo' };
    if (codeMap[voice]) voice = codeMap[voice];

    // Standard vocal ranges (MIDI notes)
    const vocalRanges = {
        soprano: { min: 60, max: 81 },    // C4 to A5
        contralto: { min: 53, max: 76 },  // F3 to E5
        tenor: { min: 48, max: 69 },      // C3 to A4
        bajo: { min: 40, max: 64 },       // E2 to E4
        todos: { min: 40, max: 81 }       // Combined range
    };

    return vocalRanges[voice] || vocalRanges.soprano;
}

// Convert MIDI note to scientific notation
function midiToScientific(midiNote) {
    const noteNames = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
    const octave = Math.floor(midiNote / 12) - 1; // MIDI 60 = C4, so octave = floor(60/12) - 1 = 4
    const noteName = noteNames[midiNote % 12];
    return `${noteName}${octave}`;
}


// Función para mapear MIDI a RGB
function midiToRgb(midi, midiMin, midiMax) { return Math.round(50 + ((midi - midiMin) / (midiMax - midiMin)) * (255 - 50)) }

function monocromati() {

    const { allNotesInRange, scaleNotesInRange, scaleIntervals, vocalRange, scaleName } = ininoti()
    const currentIntervals = scaleIntervals[scaleName] || scaleIntervals.mayor;
    // Find MIDI notes in extended vocal range that belong to the selected scale
    // Include one note below vocal range for complete coverage
    const extendedMin = vocalRange.min // - 1;
    const extendedMax = vocalRange.max;

    // NOTE: Redundant loop removed here to avoid duplication. 
    // ininoti() already populates scaleNotesInRange correctly based on the scale.

    // Use direct calls to addScaleWithInterval with clearExisting=false to prevent wiping previous intervals
    // Interval 1
    //addScaleWithInterval(scaleNotesInRange, vocalRange, scaleName, 0, 'ascending', null, false);

    let interval = 0;
    let step = 1;

    // MUSICOLI: Use fixed absolute range for color limits to differentiate voices visually
    const colorMidiMin = 36; // C2 (Low Bass anchor)
    const colorMidiMax = 84; // C6 (High Soprano anchor)
    /* 
    Legacy dynamic calculation (removed to allow visual distinction between voices)
    const midiMin = Math.min(...allNotesInRange.map(n => n.midi));
    const midiMax = Math.max(...allNotesInRange.map(n => n.midi));
    */

    let skewAngle = 0;
    let direction = 'ascending'

    let ladderElement = document.getElementById('editor-tonalidad-ladder');

    // MUSICOLI: Instead of clearing everything, only remove monochromatic elements
    // Remove existing monochromatic elements (button 0, saturated buttons, and gray spans)
    let firstNonMonoElement = null;
    if (ladderElement) {
        const children = Array.from(ladderElement.children);
        children.forEach(child => {
            // Only remove elements explicitly marked as monochromatic
            // This preserves BR elements between binary/ternary sections
            if (child.dataset.monoElement === 'true') {
                ladderElement.removeChild(child);
            } else if (!firstNonMonoElement) {
                // Store first non-monochromatic element for insertion point
                firstNonMonoElement = child;
            }
        });
    }

    // MUSICOLI: Mode Toggle Button (Dependent/Independent)
    const modeToggleBtn = document.createElement('span');
    modeToggleBtn.dataset.monoElement = 'true'; // Mark as monochromatic
    modeToggleBtn.textContent = window.voiceEditMode === 'independent' ? 'I' : 'D';
    modeToggleBtn.style.display = 'inline-block';
    modeToggleBtn.style.width = '20px';
    modeToggleBtn.style.height = '20px';
    modeToggleBtn.style.textAlign = 'center';
    modeToggleBtn.style.lineHeight = '20px';
    modeToggleBtn.style.marginRight = '5px';
    modeToggleBtn.style.verticalAlign = 'middle';
    modeToggleBtn.style.cursor = 'pointer';
    modeToggleBtn.style.fontWeight = 'bold';
    modeToggleBtn.style.fontSize = '12px';
    modeToggleBtn.style.fontFamily = 'monospace';
    modeToggleBtn.style.border = '2px solid #666';
    modeToggleBtn.style.borderRadius = '3px';

    // Color based on mode
    if (window.voiceEditMode === 'independent') {
        modeToggleBtn.style.backgroundColor = '#FF9800'; // Orange for independent
        modeToggleBtn.style.color = '#ffffff';
        modeToggleBtn.title = 'Modo: Independiente (solo voz seleccionada). Click para cambiar a Dependiente';
    } else {
        modeToggleBtn.style.backgroundColor = '#4CAF50'; // Green for dependent
        modeToggleBtn.style.color = '#ffffff';
        modeToggleBtn.title = 'Modo: Dependiente (armonía automática). Click para cambiar a Independiente';
    }

    /* MUSICOLI: Mode Toggle Button moved to HTML after Lyrics button
    modeToggleBtn.onclick = () => {
        // Toggle mode
        window.voiceEditMode = window.voiceEditMode === 'dependent' ? 'independent' : 'dependent';
        // Rebuild ladder to update button
        if (typeof makeladi === 'function') makeladi();
    };

    ladderElement.appendChild(modeToggleBtn);
    */

    // Button 0 (Negative/Rest)
    // Selector moved to end of function per user request

    const btnZero = document.createElement('span');
    btnZero.dataset.monoElement = 'true'; // Mark as monochromatic
    btnZero.textContent = '0';
    btnZero.style.display = 'inline-block';
    btnZero.style.width = '15px';
    btnZero.style.height = '15px';
    btnZero.style.textAlign = 'center';
    btnZero.style.lineHeight = '15px';
    btnZero.style.border = '1px solid #000';
    //btnZero.style.borderRadius = '50%'; // Removed
    btnZero.style.marginRight = '2px';
    btnZero.style.verticalAlign = 'middle';
    btnZero.style.cursor = 'pointer';
    btnZero.style.backgroundColor = '#000000';
    btnZero.style.fontWeight = 'bold';
    btnZero.style.fontSize = '10px';
    btnZero.style.color = '#ffffff';

    btnZero.onmouseenter = () => { btnZero.style.backgroundColor = '#333333'; };
    btnZero.onmouseleave = () => { btnZero.style.backgroundColor = '#000000'; };

    btnZero.onclick = () => {
        const container = document.getElementById('selected-tones-container');
        if (!container) return; // Should exist if createRitmoEditor ran

        // Create span similar to addClickHandler3
        const toneSpan = document.createElement('span');
        toneSpan.style.width = '25px';
        toneSpan.style.height = '25px';
        toneSpan.style.display = 'inline-block';
        toneSpan.style.marginRight = '0px';
        toneSpan.style.cursor = 'pointer';
        toneSpan.style.backgroundColor = '#000000'; // Black for rest
        toneSpan.style.border = '1px solid #fff'; // Visible border
        toneSpan.textContent = '0'; // Visual indicator
        toneSpan.style.color = '#fff';
        toneSpan.style.fontSize = '12px';
        toneSpan.style.textAlign = 'center';
        toneSpan.style.lineHeight = '25px';

        // Set metadata - Essential for acceptBtn to detect it logic
        toneSpan.dataset.isRest = 'true';
        toneSpan.dataset.midiValues = JSON.stringify([60, 60, 60]); // Rest Triad (3 distinct dummy notes)

        // Handlers
        addToneSpanEventHandlers(toneSpan, container, '#000000');

        // Add to container (Load first!)
        container.insertBefore(toneSpan, container.firstChild);

        // Update global
        if (!window.selectedTones) window.selectedTones = [];
        window.selectedTones.unshift({
            hex: '#000000',
            rgb: { r: 0, g: 0, b: 0 },
            midiValues: [60, 60, 60],
            isRest: true
        });

        // Trigger updates (Parity with other buttons)
        if (typeof window.updateRhythmColorPreview === 'function') window.updateRhythmColorPreview();
        if (typeof window.triggerAcceptRhythm === 'function') window.triggerAcceptRhythm();
    };
    ladderElement.appendChild(btnZero);

    // MUSICOLI: Saturated color buttons for polyphonic patterns (Length > 1) - REMOVED per user request
    // These basic silence colors are no longer necessary.


    for (let i = 0; i < scaleNotesInRange.length; i++) {
        //// Check if third note index is within bounds
        //if (i + (2 * interval) >= scaleNotesInRange.length) break;
        const firstNote = scaleNotesInRange[i]; // Nota más grave
        const secondNote = scaleNotesInRange[i]; // Nota más aguda
        const thirdNote = scaleNotesInRange[i]; // Nota más aguda
        // Para ascendente: [nota_grave, nota_aguda, nota_mas_grave]
        // Use FIXED limits for color calculation
        const redValue = midiToRgb(firstNote.midi, colorMidiMin, colorMidiMax);     // R = nota grave
        const greenValue = midiToRgb(secondNote.midi, colorMidiMin, colorMidiMax);  // G = nota aguda
        const blueValue = midiToRgb(thirdNote.midi, colorMidiMin, colorMidiMax);    // B = nota mas aguda

        // Crear span
        const span = document.createElement('span');
        span.dataset.monoElement = 'true'; // Mark as monochromatic
        span.style.width = '15px'; // Smaller size
        span.style.height = '15px'; // Smaller size
        span.style.display = 'inline-block';
        span.style.cursor = 'pointer';
        span.style.backgroundColor = `rgb(${redValue}, ${greenValue}, ${blueValue})`;
        span.style.border = '1px solid #000';
        span.style.color = getContrastColor(`rgb(${redValue}, ${greenValue}, ${blueValue})`);
        span.style.fontSize = '10px'; // Smaller text

        // Apply dynamic skew
        span.style.transform = `skewY(-${skewAngle}deg)`;

        //span.textContent = '';
        span.title = `3notasConsecutivas RGB: (${redValue}, ${greenValue}, ${blueValue}) MIDI: [${firstNote.midi}, ${secondNote.midi}, ${firstNote.midi}] Verde ascendente (intervalo ${interval}): ${firstNote.scientific}-${secondNote.scientific}`;
        let octi = ' '
        if (firstNote.midi == 48 || firstNote.midi == 60 || thirdNote.midi == 72 || firstNote.midi == 84) {
            octi = '.';
        }
        if (secondNote.midi == 48 || secondNote.midi == 60 || thirdNote.midi == 72 || secondNote.midi == 84) {
            octi = '-';
        }
        if (thirdNote.midi == 48 || thirdNote.midi == 60 || thirdNote.midi == 72 || thirdNote.midi == 84) {
            octi = '-';
        }

        span.textContent = octi + firstNote.midi;
        span.title = `3notasConsecutivas RGB: (${redValue}, ${greenValue}, ${blueValue}) MIDI: [${firstNote.midi}, ${secondNote.midi}, ${thirdNote.midi}] Rojo descendente (intervalo ${interval}): ${firstNote.scientific}-${secondNote.scientific}`;

        // Añadir manejador de clic
        addClickHandlerScale(span, redValue, greenValue, blueValue, [firstNote, secondNote, thirdNote], [firstNote.midi, secondNote.midi, thirdNote.midi], direction, interval);

        ladderElement.appendChild(span);
    }

    return ladderElement
}

// Función modificada para soportar padding de silencios y toggle
function addScaleWithInterval3(allNotesInRange, vocalRange, scaleName, interval, direction, targetElement = null, clearExisting = true) {
    // Validar parámetros
    if (interval < 0) interval = 0;

    // Determinar contenedor padre
    let ladderElement = targetElement;
    if (!ladderElement) {
        ladderElement = document.getElementById('editor-tonalidad-ladder');
        if (ladderElement && clearExisting) {
            const borderColorToRemove = direction === 'ascending' ? '#2E7D32' : '#C62828';
            const children = Array.from(ladderElement.children);
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (child.style && child.style.border === `1px solid ${borderColorToRemove}`) {
                    ladderElement.removeChild(child);
                }
            }
        }
    }

    if (!ladderElement) return;

    // Calcular rango MIDI real
    const midiMin = Math.min(...allNotesInRange.map(n => n.midi));
    const midiMax = Math.max(...allNotesInRange.map(n => n.midi));

    // Función para mapear MIDI a RGB
    const midiToRgb = (midi) => Math.round(50 + ((midi - midiMin) / (midiMax - midiMin)) * (255 - 50));

    // Paso para evitar solapamiento - CAMBIADO A 1 para sliding window (como en sextuplos)
    let step = 1;

    // Calcular Skew dinámico
    const skewAngle = interval * 5;

    // Crear spans según dirección
    if (direction === 'ascending') {
        // Configuración para ascendente (verde)
        for (let i = 0; i < allNotesInRange.length; i += step) {

            const notes = [];
            for (let k = 0; k < 3; k++) {
                const noteIndex = i + k * interval;
                if (noteIndex < allNotesInRange.length) {
                    notes.push(allNotesInRange[noteIndex]);
                } else {
                    // Padding with silence
                    notes.push({ midi: 0, scientific: '.' });
                }
            }

            const firstNote = notes[0];
            const secondNote = notes[1];
            const thirdNote = notes[2];

            // Para ascendente: [nota_grave, nota_aguda, nota_mas_muda]
            const redValue = midiToRgb(firstNote.midi);
            const greenValue = midiToRgb(secondNote.midi);
            const blueValue = midiToRgb(thirdNote.midi);

            // Crear span
            const span = document.createElement('span');
            span.style.width = '15px';
            span.style.height = '15px';

            // MUSICOLI: Hide buttons with silences based on toggle
            const hasSilence = notes.some(n => n.midi === 0);
            span.dataset.hasSilence = hasSilence ? 'true' : 'false';

            if (hasSilence && !window.showTritupletRests) {
                span.style.display = 'none';
            } else {
                span.style.display = 'inline-block';
            }

            span.style.cursor = 'pointer';
            span.style.backgroundColor = `rgb(${redValue}, ${greenValue}, ${blueValue})`;
            span.style.border = '1px solid #2E7D32'; // Verde
            span.style.color = getContrastColor(`rgb(${redValue}, ${greenValue}, ${blueValue})`);
            span.style.fontSize = '10px';
            span.style.transform = `skewY(-${skewAngle}deg)`;

            span.textContent = ''; // Limpiar previo si hubiera

            // Generar etiqueta texto
            let labelText = "";
            if (hasSilence) {
                notes.forEach(n => {
                    labelText += (n.midi === 0 ? "." : "|");
                });
                span.textContent = labelText;
            } else {
                let octi = ' '
                if (secondNote.midi == 48 || secondNote.midi == 60 || thirdNote.midi == 72 || secondNote.midi == 84) octi = '-';
                if (thirdNote.midi == 48 || thirdNote.midi == 60 || thirdNote.midi == 72 || thirdNote.midi == 84) octi = '-';
                span.textContent = octi + firstNote.midi;
            }

            span.title = `3notasConsecutivas RGB: (${redValue}, ${greenValue}, ${blueValue}) MIDI: [${firstNote.midi}, ${secondNote.midi}, ${thirdNote.midi}] Verde ascendente (intervalo ${interval}): ${firstNote.scientific}-${secondNote.scientific}`;

            // Añadir manejador de clic
            addClickHandlerScale(span, redValue, greenValue, blueValue, notes, [firstNote.midi, secondNote.midi, thirdNote.midi], direction, interval);

            ladderElement.appendChild(span);
        }
    } else if (direction === 'descending') {
        // Configuración para descendente (rojo)
        let startIndex = allNotesInRange.length - 1;
        // Sliding window backwards
        for (let i = startIndex; i >= 0; i -= step) {

            const notes = [];
            for (let k = 0; k < 3; k++) {
                const noteIndex = i - k * interval;
                if (noteIndex >= 0) {
                    notes.push(allNotesInRange[noteIndex]);
                } else {
                    notes.push({ midi: 0, scientific: '.' });
                }
            }

            const firstNote = notes[0]; // Nota más aguda (inicio)
            const secondNote = notes[1]; // Nota más grave (objetivo)
            const thirdNote = notes[2];

            // Para descendente: [nota_aguda, nota_grave, nota_mas_grave]
            const redValue = midiToRgb(firstNote.midi);
            const greenValue = midiToRgb(secondNote.midi);
            const blueValue = midiToRgb(thirdNote.midi);

            // Crear span
            const span = document.createElement('span');
            span.style.width = '15px';
            span.style.height = '15px';

            // MUSICOLI: Silences logic
            const hasSilence = notes.some(n => n.midi === 0);
            span.dataset.hasSilence = hasSilence ? 'true' : 'false';

            if (hasSilence && !window.showTritupletRests) {
                span.style.display = 'none';
            } else {
                span.style.display = 'inline-block';
            }

            span.style.cursor = 'pointer';
            span.style.backgroundColor = `rgb(${redValue}, ${greenValue}, ${blueValue})`;
            span.style.border = '1px solid #C62828'; // Rojo
            span.style.color = getContrastColor(`rgb(${redValue}, ${greenValue}, ${blueValue})`);
            span.style.fontSize = '10px';

            span.style.transform = `skewY(${skewAngle}deg)`;

            // Generar etiqueta texto
            let labelText = "";
            if (hasSilence) {
                notes.forEach(n => {
                    labelText += (n.midi === 0 ? "." : "|");
                });
                span.textContent = labelText;
            } else {
                // Logic preserved but safer
                let octi = ' '
                if (firstNote.midi == 48 || firstNote.midi == 60 || firstNote.midi == 84) octi = '.';
                if (secondNote.midi == 48 || secondNote.midi == 60 || secondNote.midi == 84) octi = '-';
                if (thirdNote.midi == 48 || thirdNote.midi == 60 || thirdNote.midi == 72 || thirdNote.midi == 84) octi = '-';

                span.textContent = octi + firstNote.midi;
            }

            span.title = `3notasConsecutivas RGB: (${redValue}, ${greenValue}, ${blueValue}) MIDI: [${firstNote.midi}, ${secondNote.midi}, ${thirdNote.midi}] Rojo descendente (intervalo ${interval}): ${firstNote.scientific}-${secondNote.scientific}`;

            // Añadir manejador de clic
            addClickHandlerScale(span, redValue, greenValue, blueValue, notes, [firstNote.midi, secondNote.midi, thirdNote.midi], direction, interval);

            ladderElement.appendChild(span);
        }
    }
}

function addClickHandlerScale(span, redValue, greenValue, blueValue, notes, midiPattern, direction, interval) {
    span.addEventListener('click', () => {
        // NEW: Check if modal is open in rhythm mode
        if (typeof window.isModalOpenInRhythmMode === 'function' && window.isModalOpenInRhythmMode()) {
            // Load data into modal input instead of bdi/player
            const singleInput = document.getElementById('midi-single-input');
            if (singleInput) {
                // Adjust MIDI pattern to match currentGroup (selected note count)
                let finalMidiPattern = [...midiPattern]; // Start with the provided notes

                // If currentGroup is defined and greater than pattern length, repeat notes
                if (typeof currentGroup !== 'undefined' && currentGroup > midiPattern.length) {
                    // Repeat the pattern until we have enough notes
                    while (finalMidiPattern.length < currentGroup) {
                        // Add notes from the pattern, cycling through them
                        const index = finalMidiPattern.length % midiPattern.length;
                        finalMidiPattern.push(midiPattern[index]);
                    }
                    // Trim to exact count if we went over
                    finalMidiPattern = finalMidiPattern.slice(0, currentGroup);
                } else if (typeof currentGroup !== 'undefined' && currentGroup < midiPattern.length) {
                    // If currentGroup is less than pattern, trim the pattern
                    finalMidiPattern = midiPattern.slice(0, currentGroup);
                }

                // Set the MIDI notes in the input
                singleInput.value = finalMidiPattern.join(' ');

                // Trigger input event to update the preview
                singleInput.dispatchEvent(new Event('input'));

                // Store rhythm data for when user clicks "Aplicar"
                // The rhythm pattern should match the number of notes
                if (typeof window.currentEditingRhythmValues !== 'undefined') {
                    // Update the rhythm values to match the final MIDI pattern length
                    window.currentEditingRhythmValues = finalMidiPattern.map(() => 3); // Default to quarter notes
                }

                console.log('🎹 Loaded MIDI notes into modal:', finalMidiPattern, `(${midiPattern.length} notes, currentGroup: ${currentGroup})`);
            }

            // Exit early - don't execute the normal behavior
            return;
        }

        // EXISTING CODE: Normal behavior when modal is not open in rhythm mode
        // MUSICOLI: Update global selected gray tone MIDI for saturated buttons sync
        if (notes && notes.length > 0 && notes[0].midi) {
            window.lastSelectedGrayMidi = notes[0].midi;
            // Rebuild entire ladder for consistency (includes all sections with proper line breaks)
            setTimeout(() => { if (typeof makeladi === 'function') makeladi(); }, 10);
        }

        const hexColor = '#' +
            redValue.toString(16).padStart(2, '0') +
            greenValue.toString(16).padStart(2, '0') +
            blueValue.toString(16).padStart(2, '0');

        const container = document.getElementById('selected-tones-container');
        if (!container) return;

        // MUSICOLI: Determine how many copies to add based on currentGroup
        // Each color represents multiple notes, so:
        // 1-3 notes = 1 color
        // 4-6 notes = 2 colors
        // 7-8 notes = 3 colors
        const isMonochromatic = (redValue === greenValue && greenValue === blueValue);
        let copiesToAdd = 1;
        if (isMonochromatic) {
            if (currentGroup >= 1 && currentGroup <= 3) {
                copiesToAdd = 1;
            } else if (currentGroup >= 4 && currentGroup <= 6) {
                copiesToAdd = 2;
            } else if (currentGroup >= 7 && currentGroup <= 8) {
                copiesToAdd = 3;
            }
        }

        const colorCount = Array.from(container.children).filter(child => {
            return child.style.backgroundColor === span.style.backgroundColor;
        }).length;

        const MAX_REPETITIONS = 6;
        if (colorCount >= MAX_REPETITIONS) return;

        const MAX_TONES = 8;

        // Add multiple copies of the same color
        for (let copy = 0; copy < copiesToAdd; copy++) {
            if (container.children.length >= MAX_TONES) {
                removeLastTone(container);
            }

            // Crear nuevo span para el contenedor seleccionado
            const toneSpan = document.createElement('span');
            toneSpan.style.width = '25px';
            toneSpan.style.height = '25px';
            toneSpan.style.display = 'inline-block';
            toneSpan.style.marginRight = '0px';
            toneSpan.style.cursor = 'pointer';
            toneSpan.style.backgroundColor = span.style.backgroundColor;
            toneSpan.style.border = 'none';

            // Almacenar valores MIDI
            toneSpan.dataset.midiValues = JSON.stringify(midiPattern);

            // Crear título según dirección y número de notas
            let title;
            const noteCount = midiPattern.length;
            const noteList = notes.map(n => n.scientific).join('-');
            if (direction === 'ascending') {
                title = `${noteCount} notas consecutivas RGB: (${redValue}, ${greenValue}, ${blueValue})\n` +
                    `MIDI: [${midiPattern.join(', ')}]\n` +
                    `Verde ascendente (intervalo ${interval}): ${noteList}`;
            } else {
                title = `${noteCount} notas consecutivas RGB: (${redValue}, ${greenValue}, ${blueValue})\n` +
                    `MIDI: [${midiPattern.join(', ')}]\n` +
                    `Rojo descendente (intervalo ${interval}): ${noteList}`;
            }
            toneSpan.title = title;
            // Manejadores de eventos
            addToneSpanEventHandlers(toneSpan, container, hexColor);

            // Añadir al contenedor
            container.insertBefore(toneSpan, container.firstChild);

            // Actualizar estado global
            if (!window.selectedTones) window.selectedTones = [];
            window.selectedTones.unshift({
                hex: hexColor,
                rgb: { r: redValue, g: greenValue, b: blueValue },
                midiValues: midiPattern,
                direction: direction,
                interval: interval,
                notes: notes
            });
        } // End of for loop

        // Actualizar vista si es necesario (after all copies are added)
        if (typeof window.updateRhythmColorPreview === 'function') {
            window.updateRhythmColorPreview();
        }

        // Trigger the "Aceptar" logic from the rhythm editor if it's available
        if (typeof window.triggerAcceptRhythm === 'function') {
            window.triggerAcceptRhythm();
        }

        // IMPORTANT: Actually save the measure data to bdi.bar
        // This ensures the notepad and player are updated with the new measure
        if (typeof window.currentPattern !== 'undefined' && window.currentPattern) {
            // Create measure data structure
            const measureData = {
                nimidi: midiPattern, // All MIDI notes
                tipis: window.currentPattern, // Use the current rhythm pattern
                chordi: false // Play sequentially (not as chord)
            };

            // Add to bdi.bar (append new measure)
            if (window.bdi && window.bdi.bar) {
                window.bdi.bar.push(measureData);

                // Save state for undo/redo
                if (typeof saveBdiState === 'function') {
                    saveBdiState();
                }

                // Update all systems (notepad, player, visual tracks)
                if (typeof updateAfterBdiChange === 'function') {
                    updateAfterBdiChange();
                }
            }
        }

        // Play the sound preview
        if (typeof tuci === 'function') {
            // Create a rhythm pattern for the notes
            const basi = [{
                nimidi: midiPattern, // All MIDI notes
                tipis: midiPattern.map(() => 3), // Quarter notes for each
                chordi: false // Play sequentially (not as chord)
            }];

            tuci(basi, 0);
        }
    });
}



// Función para crear spans con intervalo específico y dirección  tono1, tono2, tono1
function addScaleWithInterval(allNotesInRange, vocalRange, scaleName, interval, direction, targetElement = null, clearExisting = true) {
    // Validar parámetros
    if (interval < 0) interval = 0;

    // Determinar contenedor padre
    let ladderElement = targetElement;
    if (!ladderElement) {
        ladderElement = document.getElementById('editor-tonalidad-ladder');
        // Solo limpiar si se solicita explícitamente (default true para compatibilidad, false para batch)
        if (ladderElement && clearExisting) {
            const borderColorToRemove = direction === 'ascending' ? '#2E7D32' : '#C62828';
            const children = Array.from(ladderElement.children);
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (child.style && child.style.border === `1px solid ${borderColorToRemove}`) {
                    ladderElement.removeChild(child);
                }
            }
        }
    }

    if (!ladderElement) return;

    // Calcular rango MIDI real
    const midiMin = Math.min(...allNotesInRange.map(n => n.midi));
    const midiMax = Math.max(...allNotesInRange.map(n => n.midi));


    // Paso para evitar solapamiento: 2 * interval
    let step = 2 * interval;
    if (interval === 0) {
        step = 1;
    }

    // Calcular Skew dinámico
    const skewAngle = interval * 5;

    // Crear spans según dirección
    if (direction === 'ascending') {
        // Configuración para ascendente (verde)
        for (let i = 0; i < allNotesInRange.length - interval; i += step) {
            const firstNote = allNotesInRange[i]; // Nota más grave
            const secondNote = allNotesInRange[i + interval]; // Nota más aguda

            // Para ascendente: [nota_grave, nota_aguda, nota_grave]
            // Los dos primeros MIDI: menor → mayor
            const redValue = midiToRgb(firstNote.midi, midiMin, midiMax);     // R = nota grave
            const greenValue = midiToRgb(secondNote.midi, midiMin, midiMax);  // G = nota aguda
            const blueValue = midiToRgb(firstNote.midi, midiMin, midiMax);    // B = nota grave

            // Crear span
            const span = document.createElement('span');
            span.style.width = '15px'; // Smaller size
            span.style.height = '15px'; // Smaller size
            span.style.display = 'inline-block';
            span.style.cursor = 'pointer';
            span.style.backgroundColor = `rgb(${redValue}, ${greenValue}, ${blueValue})`;
            span.style.border = '1px solid #2E7D32'; // Verde
            span.style.color = getContrastColor(`rgb(${redValue}, ${greenValue}, ${blueValue})`);
            span.style.fontSize = '10px'; // Smaller text

            // Apply dynamic skew
            span.style.transform = `skewY(-${skewAngle}deg)`;

            span.textContent = '';
            span.title = `RGB: (${redValue}, ${greenValue}, ${blueValue}) MIDI: [${firstNote.midi}, ${secondNote.midi}, ${firstNote.midi}] Verde ascendente (intervalo ${interval}): ${firstNote.scientific}-${secondNote.scientific}`;
            let octi = ' '
            if (firstNote.midi == 48 || firstNote.midi == 60 || firstNote.midi == 72 || firstNote.midi == 84) {
                octi = '.';
            }
            if (secondNote.midi == 48 || secondNote.midi == 60 || secondNote.midi == 72 || secondNote.midi == 84) {
                octi = '-';
            }
            span.textContent = octi + firstNote.midi;
            // Añadir manejador de clic
            addClickHandler(span, redValue, greenValue, blueValue, firstNote, secondNote, [firstNote.midi, secondNote.midi, firstNote.midi], direction, interval);

            ladderElement.appendChild(span);
        }
    } else if (direction === 'descending') {
        // Configuración para descendente (rojo)
        // Empezamos desde el índice más alto que pueda tener un intervalo descendente válido
        // y vamos restando el paso (step) para evitar solapamiento.
        let startIndex = allNotesInRange.length - 1;
        // Ajustamos startIndex para que sea congruente con el paso, pero no es estrictamente necesario.
        // Simplemente empezamos en el máximo y restamos step hasta que i < interval.
        for (let i = startIndex; i >= interval; i -= step) {
            const firstNote = allNotesInRange[i]; // Nota más aguda (inicio)
            const secondNote = allNotesInRange[i - interval]; // Nota más grave (objetivo)

            // Para descendente: [nota_aguda, nota_grave, nota_aguda]
            // Los dos primeros MIDI: mayor → menor
            const redValue = midiToRgb(firstNote.midi, midiMin, midiMax);     // R = nota aguda
            const greenValue = midiToRgb(secondNote.midi, midiMin, midiMax);  // G = nota grave
            const blueValue = midiToRgb(firstNote.midi, midiMin, midiMax);    // B = nota aguda

            // Crear span
            const span = document.createElement('span');
            span.style.width = '15px'; // Smaller size
            span.style.height = '15px'; // Smaller size
            span.style.display = 'inline-block';
            span.style.cursor = 'pointer';
            span.style.backgroundColor = `rgb(${redValue}, ${greenValue}, ${blueValue})`;
            span.style.border = '1px solid #C62828'; // Rojo
            span.style.color = getContrastColor(`rgb(${redValue}, ${greenValue}, ${blueValue})`);
            span.style.fontSize = '10px'; // Smaller text

            // Apply dynamic skew
            span.style.transform = `skewY(${skewAngle}deg)`;

            let octi = ' '
            if (firstNote.midi == 48 || firstNote.midi == 60 || firstNote.midi == 72 || firstNote.midi == 84) {
                octi = '.';
            }
            if (secondNote.midi == 48 || secondNote.midi == 60 || secondNote.midi == 72 || secondNote.midi == 84) {
                octi = '-';
            }
            span.textContent = octi + firstNote.midi;
            span.title = `RGB: (${redValue}, ${greenValue}, ${blueValue}) MIDI: [${firstNote.midi}, ${secondNote.midi}, ${firstNote.midi}] Rojo descendente (intervalo ${interval}): ${firstNote.scientific}-${secondNote.scientific}`;

            // Añadir manejador de clic
            addClickHandler(span, redValue, greenValue, blueValue, firstNote, secondNote, [firstNote.midi, secondNote.midi, firstNote.midi], direction, interval);

            ladderElement.appendChild(span);
        }
    }
}

// Explicación del patrón:

// Para intervalo 1: step = 2
//   Ascendente: [0,1], [2,3], [4,5], ... → [Do4,Re4], [Mi4,Fa4], [Sol4,La4], ...
//   Descendente: [12,11], [10,9], [8,7], ... → [La5,Sol5], [Fa5,Mi5], [Re5,Do5], ...

// Para intervalo 2: step = 4
//   Ascendente: [0,2], [4,6], [8,10], ... → [Do4,Mi4], [Sol4,Si4], [Re5,Fa5], ...
//   Descendente: [12,10], [8,6], [4,2], ... → [La5,Sol5], [Re5,Si4], [Sol4,Mi4], ...

// Para intervalo 3: step = 6
//   Ascendente: [0,3], [6,9], ... → [Do4,Fa4], [Si4,Mi5], ...
//   Descendente: [12,9], [6,3], ... → [La5,Mi5], [Si4,Fa4], ...

// Para cualquier intervalo 'n': step = 2 * n
// Esto garantiza que no haya superposición entre los pares y que la distribución sea uniforme.

// Función auxiliar para manejar clics (se mantiene igual)
function addClickHandler(span, redValue, greenValue, blueValue, firstNote, secondNote, midiPattern, direction, interval) {
    span.addEventListener('click', () => {
        const hexColor = '#' +
            redValue.toString(16).padStart(2, '0') +
            greenValue.toString(16).padStart(2, '0') +
            blueValue.toString(16).padStart(2, '0');

        const container = document.getElementById('selected-tones-container');
        if (!container) return;

        const colorCount = Array.from(container.children).filter(child => {
            return child.style.backgroundColor === span.style.backgroundColor;
        }).length;

        const MAX_REPETITIONS = 6;
        if (colorCount >= MAX_REPETITIONS) return;

        const MAX_TONES = 8;
        if (container.children.length >= MAX_TONES) {
            removeLastTone(container);
        }

        // Crear nuevo span para el contenedor seleccionado
        const toneSpan = document.createElement('span');
        toneSpan.style.width = '25px';
        toneSpan.style.height = '25px';
        toneSpan.style.display = 'inline-block';
        toneSpan.style.marginRight = '0px';
        toneSpan.style.cursor = 'pointer';
        toneSpan.style.backgroundColor = span.style.backgroundColor;
        toneSpan.style.border = 'none';

        // Almacenar valores MIDI
        toneSpan.dataset.midiValues = JSON.stringify(midiPattern);

        // Crear título según dirección
        let title;
        if (direction === 'ascending') {
            title = `RGB: (${redValue}, ${greenValue}, ${blueValue})\n` +
                `MIDI: [${midiPattern.join(', ')}]\n` +
                `Verde ascendente (intervalo ${interval}): ${firstNote.scientific}-${secondNote.scientific}`;
        } else {
            title = `RGB: (${redValue}, ${greenValue}, ${blueValue})\n` +
                `MIDI: [${midiPattern.join(', ')}]\n` +
                `Rojo descendente (intervalo ${interval}): ${firstNote.scientific}-${secondNote.scientific}`;
        }
        toneSpan.title = title;
        // Manejadores de eventos
        addToneSpanEventHandlers(toneSpan, container, hexColor);

        // Añadir al contenedor
        container.insertBefore(toneSpan, container.firstChild);

        // Actualizar estado global
        if (!window.selectedTones) window.selectedTones = [];
        window.selectedTones.unshift({
            hex: hexColor,
            rgb: { r: redValue, g: greenValue, b: blueValue },
            midiValues: midiPattern,
            direction: direction,
            interval: interval,
            notes: [firstNote, secondNote]
        });

        // Actualizar vista si es necesario
        if (typeof window.updateRhythmColorPreview === 'function') {
            window.updateRhythmColorPreview();
        }

        // Trigger the "Aceptar" logic from the rhythm editor if it's available
        if (typeof window.triggerAcceptRhythm === 'function') {
            window.triggerAcceptRhythm();
        }

        // IMPORTANT: Actually save the measure data to bdi.bar
        // This ensures the notepad and player are updated with the new measure
        if (typeof window.currentPattern !== 'undefined' && window.currentPattern) {
            // Create measure data structure
            const measureData = {
                nimidi: midiPattern, // All MIDI notes
                tipis: window.currentPattern, // Use the current rhythm pattern
                chordi: false // Play sequentially (not as chord)
            };

            // Add to bdi.bar (append new measure)
            if (window.bdi && window.bdi.bar) {
                window.bdi.bar.push(measureData);

                // Save state for undo/redo
                if (typeof saveBdiState === 'function') {
                    saveBdiState();
                }

                // Update all systems (notepad, player, visual tracks)
                if (typeof updateAfterBdiChange === 'function') {
                    updateAfterBdiChange();
                }
            }
        }

        // Play the sound preview
        if (typeof tuci === 'function') {
            // Create a simple rhythm pattern (3 quarter notes for the 3 RGB notes)
            const basi = [{
                nimidi: [midiPattern[0], midiPattern[1], midiPattern[3]], // Two MIDI notes from R, G
                tipis: [3, 3, 3], // 
                chordi: false // Play sequentially (not as chord)
            }];

            tuci(basi, 0);
        }
    });
}

// Funciones auxiliares (manteniendo las originales)
function removeLastTone(container) {
    const lastSpan = container.lastElementChild;
    if (!lastSpan) return;

    const lastBgColor = lastSpan.style.backgroundColor;
    const rgbMatch = lastBgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        const lastHex = '#' +
            r.toString(16).padStart(2, '0') +
            g.toString(16).padStart(2, '0') +
            b.toString(16).padStart(2, '0');

        const lastIdx = window.selectedTones.findIndex(t => t.hex === lastHex);
        if (lastIdx > -1) {
            window.selectedTones.splice(lastIdx, 1);
        }
    }
    lastSpan.remove();
}

function addToneSpanEventHandlers(toneSpan, container, hexColor) {
    // Click: mover al frente
    toneSpan.addEventListener('click', () => {
        container.insertBefore(toneSpan, container.firstChild);
        const idx = window.selectedTones.findIndex(t => t.hex === hexColor);
        if (idx > -1) {
            const tone = window.selectedTones.splice(idx, 1)[0];
            window.selectedTones.unshift(tone);
        }
        if (typeof window.updateRhythmColorPreview === 'function') {
            window.updateRhythmColorPreview();
        }
    });

    // Doble click: eliminar
    toneSpan.addEventListener('dblclick', () => {
        toneSpan.remove();
        const idx = window.selectedTones.findIndex(t => t.hex === hexColor);
        if (idx > -1) {
            window.selectedTones.splice(idx, 1);
        }
        if (typeof window.updateRhythmColorPreview === 'function') {
            window.updateRhythmColorPreview();
        }
    });
}
//////////////////

// Funciones de conveniencia para mantener compatibilidad

function addDescendingRedScaleInterval1(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 1, 'descending');
}

function addAscendingGreenScaleInterval1(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 1, 'ascending');
}

function addAscendingGreenScaleInterval2(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 2, 'ascending');
}

function addDescendingRedScaleInterval2(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 2, 'descending');
}

function addAscendingGreenScaleInterval3(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 3, 'ascending');
}

function addDescendingRedScaleInterval3(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 3, 'descending');
}
function addAscendingGreenScaleInterval4(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 4, 'ascending');
}
function addDescendingRedScaleInterval4(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 4, 'descending');
}
function addAscendingGreenScaleInterval5(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 5, 'ascending');
}
function addDescendingRedScaleInterval5(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 5, 'descending');
}
function addAscendingGreenScaleInterval6(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 6, 'ascending');
}
function addDescendingRedScaleInterval6(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 6, 'descending');
}
function addAscendingGreenScaleInterval7(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 7, 'ascending');
}
function addDescendingRedScaleInterval7(allNotesInRange, vocalRange, scaleName) {
    addScaleWithInterval(allNotesInRange, vocalRange, scaleName, 7, 'descending');
}

function atuci(nn, notes) {
    //alert(window.currentPattern)
    if (window.currentPattern) {
        //const currentColor = rgb;
        //const mari = rgbToMidiInterval(currentColor.r, currentColor.g, currentColor.b)
        let nimidi, tipis;
        if (nn == 1) {
            // nimidi = [notes];
            //tipis = nimidi.map(() => 3);
            tipis = currentPattern;
            nimidi = tipis.map(() => notes);
        }
        const basi = [{
            nimidi: nimidi,
            tipis: tipis,
            chordi: false
        }];
        tuci(basi, 0);
    }
}

function buildimaji01(key, range, mayorIntervals, allNotesInRange) {
    const scale = [];
    let octave = 0;
    while (true) {
        let added = false;
        for (const interval of mayorIntervals) {
            const note = key + interval + (octave * 12);
            if (note > range.max) return scale;          // <- salida rápida
            if (note >= range.min) {
                scale.push(note);
                added = true;
            }
        }
        if (!added) return scale; // seguridad: si ya no hay notas válidas
        octave++;
    }
}

function buildimaji(keyNoteSemitone, allNotesInRange, majorScaleIntervals) {
    const scaleNotesInRange = [];
    for (const note of allNotesInRange) {
        // Calcula la posición de la nota en la escala mayor
        const relativePosition = (note.semitone - keyNoteSemitone + 12) % 12;
        // Verifica si la posición relativa está en los intervalos de la escala mayor
        if (majorScaleIntervals.includes(relativePosition)) {
            scaleNotesInRange.push(note);
        }
    }
    return scaleNotesInRange;
}
function ininoti() {
    const currentScale = scali;
    const scaleName = escalas[currentScale];

    // Get vocal range for the selected voice
    const vocalRange = getVocalRange();

    // Generate ALL notes in the vocal range for transitions (green/red scales)
    const allNotesInRange = [];

    // Find all MIDI notes in vocal range
    for (let midi = vocalRange.min; midi <= vocalRange.max; midi++) {
        allNotesInRange.push({
            midi: midi,
            semitone: midi % 12,
            scientific: midiToScientific(midi)
        });
    }

    // Generate SCALE notes in the vocal range for info display
    const scaleIntervals = escalasNotas

    // Determine current scale intervals
    const currentIntervals = scaleIntervals[scaleName] || scaleIntervals['cromatica'];
    let scaleNotesInRange = [];
    // Filter notes that belong to the current scale
    if (currentScale == 0) {
        //scaleNotesInRange = buildimaji(keyinselecti, vocalRange, currentIntervals, allNotesInRange);
        scaleNotesInRange = buildimaji(keyinselecti, allNotesInRange, currentIntervals);
    } else {
        for (const note of allNotesInRange) {
            if (currentIntervals.includes(note.semitone)) {
                scaleNotesInRange.push(note);
            }
        }
    }

    return {
        allNotesInRange,
        scaleNotesInRange,
        scaleIntervals,
        vocalRange,
        scaleName
    }
}


// Add scale tones as graduated grays to the tonalidad ladder
// Helper to get ABC name (e.g., C4, D#4)
function midiToABC(midi) {
    const semitone = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    return noteNames[semitone] + octave;
}

// Add scale tones as graduated grays to the tonalidad ladder
function addBinaryIntervalsToLadder() {
    try {
        const { allNotesInRange, scaleNotesInRange, scaleIntervals, vocalRange, scaleName } = ininoti()
        const currentIntervals = scaleIntervals[scaleName] || scaleIntervals.mayor;

        const ladder = document.getElementById('editor-tonalidad-ladder');
        if (!ladder) return;

        // Create or Select Duplets Container
        let container = document.getElementById('duplets-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'duplets-container';
            container.style.display = 'inline';
            ladder.appendChild(container);
        }
        container.innerHTML = ''; // Clear ONLY duplets

        // Global state for toggle (initially hidden)
        if (typeof window.showDupletRests === 'undefined') {
            window.showDupletRests = false;
        }

        // Toggle Button (Inline Icon)
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'toggle-duplet-rests-btn';
        toggleBtn.textContent = '\uD834\uDD3D'; // Symbol for silence (𝄽)
        toggleBtn.title = 'Mostrar/Ocultar Silencios (2)';
        toggleBtn.style.fontSize = '14px';
        toggleBtn.style.lineHeight = '1';
        toggleBtn.style.padding = '2px 6px';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.backgroundColor = '#f0f0f0';
        toggleBtn.style.border = '1px solid #ccc';
        toggleBtn.style.borderRadius = '3px';
        toggleBtn.style.color = window.showDupletRests ? '#000' : '#888';
        toggleBtn.style.display = 'inline-block';
        toggleBtn.style.verticalAlign = 'middle';
        toggleBtn.style.marginRight = '8px';

        toggleBtn.onclick = () => {
            window.showDupletRests = !window.showDupletRests;
            toggleBtn.style.color = window.showDupletRests ? '#000' : '#888';
            toggleBtn.style.backgroundColor = window.showDupletRests ? '#fff' : '#f0f0f0';

            const restButtons = container.querySelectorAll('[data-has-silence="true"]');
            restButtons.forEach(btn => {
                btn.style.display = window.showDupletRests ? 'inline-block' : 'none';
            });
        };

        container.appendChild(toggleBtn);

        // Loop through intervals 1 to 7
        for (let i = 1; i <= 7; i++) {
            // Container for this interval (Asc + Desc)
            const intervalWrapper = document.createElement('span');
            intervalWrapper.style.display = 'inline-block';
            intervalWrapper.style.whiteSpace = 'nowrap';
            intervalWrapper.style.marginRight = '10px';
            intervalWrapper.style.verticalAlign = 'top';

            // Ascending
            addScaleWithInterval2(scaleNotesInRange, vocalRange, scaleName, i, 'ascending', intervalWrapper, false);

            // Spacer
            const spacer = document.createElement('span');
            spacer.style.display = 'inline-block';
            spacer.style.width = '5px';
            intervalWrapper.appendChild(spacer);

            // Descending
            addScaleWithInterval2(scaleNotesInRange, vocalRange, scaleName, i, 'descending', intervalWrapper, false);

            container.appendChild(intervalWrapper);
        }

    } catch (e) {
        console.error("Error in addBinaryIntervalsToLadder:", e);
        alert("Error al actualizar escala binaria: " + e.message);
    }
}

// Function for 2-note scales (Duplets) with sliding window search
function addScaleWithInterval2(allNotesInRange, vocalRange, scaleName, interval, direction, targetElement = null, clearExisting = true) {
    if (interval < 0) interval = 0;

    let ladderElement = targetElement || document.getElementById('editor-tonalidad-ladder');
    if (!ladderElement) return;

    if (clearExisting && !targetElement) {
        // Fallback cleanup if not using wrappers
        const borderColorToRemove = direction === 'ascending' ? '#2E7D32' : '#C62828';
        const children = Array.from(ladderElement.children);
        children.forEach(child => {
            if (child.style && child.style.border === `1px solid ${borderColorToRemove}`) {
                ladderElement.removeChild(child);
            }
        });
    }

    const midiMin = Math.min(...allNotesInRange.map(n => n.midi));
    const midiMax = Math.max(...allNotesInRange.map(n => n.midi));
    const midiToRgb = (midi) => Math.round(50 + ((midi - midiMin) / (midiMax - midiMin)) * (255 - 50));

    // Sliding window step = 1 (to show all connections: 1-3, 2-4, 3-5...)
    let step = 1;
    const skewAngle = interval * 5;

    // Set to track generated patterns and check for duplicates
    const generatedPatterns = new Set();

    if (direction === 'ascending') {
        for (let i = 0; i < allNotesInRange.length; i += step) {
            const notes = [];

            // Note 1
            notes.push(allNotesInRange[i]);

            // Note 2
            const noteIndex2 = i + interval;
            if (noteIndex2 < allNotesInRange.length) {
                notes.push(allNotesInRange[noteIndex2]);
            } else {
                notes.push({ midi: 0, scientific: '.' }); // Padding
            }

            const firstNote = notes[0];
            const secondNote = notes[1];

            // Check for duplication
            const patternKey = `${firstNote.midi},${secondNote.midi}`;
            if (generatedPatterns.has(patternKey)) {
                continue; // Skip if already generated
            }
            generatedPatterns.add(patternKey);

            // Colors
            const color1 = midiToRgb(firstNote.midi);
            const color2 = secondNote.midi > 0 ? midiToRgb(secondNote.midi) : color1; // Fallback to avoid black if logic dictates

            const hasSilence = notes.some(n => n.midi === 0);

            const span = document.createElement('span');
            span.style.width = '15px';
            span.style.height = '15px';
            span.dataset.hasSilence = hasSilence ? 'true' : 'false';

            if (hasSilence && !window.showDupletRests) {
                span.style.display = 'none';
            } else {
                span.style.display = 'inline-block';
            }

            span.style.cursor = 'pointer';
            span.style.backgroundColor = `rgb(${color1}, ${color2}, ${color1})`; // Trying to mimic logic of 3 colors for gradient? Or just mix?
            // User used rgb(R, G, B) mapping first, second, first for Ascending generally in prev function.
            // Let's stick to simple logic or gradient? 
            // Previous addScaleWithInterval used: R=first, G=second, B=first for Ascending.
            span.style.backgroundColor = `rgb(${color1}, ${color2}, ${color1})`;

            span.style.border = '1px solid #2E7D32';
            span.style.fontSize = '10px';
            span.style.transform = `skewY(-${skewAngle}deg)`;
            span.style.color = getContrastColor(span.style.backgroundColor);


            let labelText = "";
            if (hasSilence) {
                notes.forEach(n => labelText += (n.midi === 0 ? "." : "|"));
                span.textContent = labelText;
            } else {
                let octi = ' ';
                if (firstNote.midi == 48 || firstNote.midi == 60 || firstNote.midi == 72 || firstNote.midi == 84) octi = '.';
                if (secondNote.midi == 48 || secondNote.midi == 60 || secondNote.midi == 72 || secondNote.midi == 84) octi = '-';
                span.textContent = octi + firstNote.midi;
            }

            span.title = `Dupla (2) MIDI: [${firstNote.midi}, ${secondNote.midi}] Ascendente (Int ${interval})`;

            addClickHandler2(span, firstNote, secondNote, direction, interval);
            ladderElement.appendChild(span);
        }
    } else if (direction === 'descending') {
        let startIndex = allNotesInRange.length - 1;
        for (let i = startIndex; i >= 0; i -= step) {
            const notes = [];
            // Note 1 (High)
            notes.push(allNotesInRange[i]);
            // Note 2 (Low - target)
            const noteIndex2 = i - interval;
            if (noteIndex2 >= 0) {
                notes.push(allNotesInRange[noteIndex2]);
            } else {
                notes.push({ midi: 0, scientific: '.' });
            }

            const firstNote = notes[0];
            const secondNote = notes[1];

            // Check for duplication
            const patternKey = `${firstNote.midi},${secondNote.midi}`;
            if (generatedPatterns.has(patternKey)) {
                continue; // Skip if already generated
            }
            generatedPatterns.add(patternKey);

            const color1 = midiToRgb(firstNote.midi);
            const color2 = secondNote.midi > 0 ? midiToRgb(secondNote.midi) : color1;

            const hasSilence = notes.some(n => n.midi === 0);

            const span = document.createElement('span');
            span.style.width = '15px';
            span.style.height = '15px';
            span.dataset.hasSilence = hasSilence ? 'true' : 'false';

            if (hasSilence && !window.showDupletRests) {
                span.style.display = 'none';
            } else {
                span.style.display = 'inline-block';
            }

            span.style.cursor = 'pointer';
            // Descending: R=first(high), G=second(low), B=first(high)
            span.style.backgroundColor = `rgb(${color1}, ${color2}, ${color1})`;
            span.style.border = '1px solid #C62828';
            span.style.fontSize = '10px';
            span.style.transform = `skewY(${skewAngle}deg)`;
            span.style.color = getContrastColor(span.style.backgroundColor);

            let labelText = "";
            if (hasSilence) {
                notes.forEach(n => labelText += (n.midi === 0 ? "." : "|"));
                span.textContent = labelText;
            } else {
                let octi = ' ';
                if (firstNote.midi == 48 || firstNote.midi == 60 || firstNote.midi == 72 || firstNote.midi == 84) octi = '.';
                if (secondNote.midi == 48 || secondNote.midi == 60 || secondNote.midi == 72 || secondNote.midi == 84) octi = '-';
                span.textContent = octi + firstNote.midi;
            }
            span.title = `Dupla (2) MIDI: [${firstNote.midi}, ${secondNote.midi}] Descendente (Int ${interval})`;

            addClickHandler2(span, firstNote, secondNote, direction, interval);
            ladderElement.appendChild(span);
        }
    }
}

function addClickHandler2(span, firstNote, secondNote, direction, interval) {
    span.addEventListener('click', () => {
        if (firstNote && firstNote.midi && firstNote.midi > 0) {
            window.lastSelectedGrayMidi = firstNote.midi;
            // setTimeout(() => { if (typeof makeladi === 'function') makeladi(); }, 10);
        }

        const container = document.getElementById('selected-tones-container');
        if (!container) return;

        const rgb = span.style.backgroundColor; // e.g., "rgb(100, 150, 100)"
        // Extract RGB
        const match = rgb.match(/\d+/g);
        let hexColor = '#000000';
        if (match) {
            const [r, g, b] = match.map(Number);
            hexColor = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        }

        const MAX_TONES = 8;
        if (container.children.length >= MAX_TONES) removeLastTone(container);

        const toneSpan = document.createElement('span');
        toneSpan.style.width = '25px';
        toneSpan.style.height = '25px';
        toneSpan.style.display = 'inline-block';
        toneSpan.style.cursor = 'pointer';
        toneSpan.style.backgroundColor = rgb;
        toneSpan.style.border = 'none';

        const midiPattern = [firstNote.midi, secondNote.midi];
        toneSpan.dataset.midiValues = JSON.stringify(midiPattern);
        toneSpan.title = span.title;

        addToneSpanEventHandlers(toneSpan, container, hexColor);
        container.insertBefore(toneSpan, container.firstChild);

        if (!window.selectedTones) window.selectedTones = [];
        window.selectedTones.unshift({
            hex: hexColor,
            rgb: { r: match ? Number(match[0]) : 0, g: match ? Number(match[1]) : 0, b: match ? Number(match[2]) : 0 },
            midiValues: midiPattern,
            direction: direction,
            interval: interval
        });

        if (typeof window.updateRhythmColorPreview === 'function') window.updateRhythmColorPreview();
        if (typeof window.triggerAcceptRhythm === 'function') window.triggerAcceptRhythm();
    });
}

function wrifuti(allNotesInRange, scaleNotesInRange, scaleIntervals, vocalRange, scaleName) {
    // Add scale and vocal range info to the fixed footer
    const voiceSelector = document.getElementById('voice-selector');
    const voice = voiceSelector ? voiceSelector.value : 'soprano';

    const footerDiv = document.getElementById('scale-info-text');
    if (footerDiv) {
        // Clear existing content to avoid duplication
        footerDiv.innerHTML = '';
        const infoContent = `
              Escala ${tonicain[keyinselecti]} ${scaleName.charAt(0).toUpperCase() + scaleName.slice(1)}: ${scaleNotesInRange.map(n => `${n.scientific}(${midiToABC(n.midi)})(${n.midi})`).join(' ')}<br>
                Voz: ${voice.charAt(0).toUpperCase() + voice.slice(1)} (MIDI ${vocalRange.min}-${vocalRange.max}) | ${scaleNotesInRange.length} notas de escala, ${allNotesInRange.length} notas cromáticas totales
            `;
        footerDiv.innerHTML = infoContent;
    }
}

// Helper to render pattern to Bravura HTML
function renderPattern(noteMap, pattern) {
    return pattern.map(num => noteMap[num] || '').join(' ');
}

// Helper to convert index to letters
function getColumnLabel(index) {
    if (index <= 25) return String.fromCharCode(65 + index);
    return (index - 26).toString();
}

function updatidi(n, pattern) {
    // Update display with label in top-left corner
    const notationDisplay = document.getElementById('notation-display');
    const labelSpan = `<span style="font-family: monospace; font-size: 10px; color: #1976D2; font-weight: bold; position: absolute; top: 2px; left: 4px;">${getColumnLabel(n)}</span>`;
    const notesSpan = `<span style="margin-left: 12px; padding-top: 8px; display: inline-block;">${renderPattern(noteMap, pattern)}</span>`;
    notationDisplay.innerHTML = labelSpan + notesSpan;

}
// Create Rhythm palette editor UI - Compact tab-based design
function createRitmoEditor(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    document.getElementById('nnoti').innerHTML = currentGroup;
    // Header
    const header = document.createElement('div');
    header.style.marginBottom = '2px';

    /*  const title = document.createElement('h3');
     title.textContent = 'Ritmos';
     title.style.margin = '0 0 8px 0';
     title.style.fontFamily = 'monospace';
     title.style.fontSize = '14px';
     header.appendChild(title); */

    // Color A info and control
    const colorInfoDiv = document.createElement('div');
    colorInfoDiv.id = 'rhythm-color-info-div'; // ✅ Added ID
    colorInfoDiv.style.display = 'flex';
    colorInfoDiv.style.alignItems = 'center';
    colorInfoDiv.style.gap = '1px';
    colorInfoDiv.style.margin = '0px';
    colorInfoDiv.style.fontSize = '11px';
    colorInfoDiv.style.fontFamily = 'monospace';
    colorInfoDiv.style.background = '#333';
    colorInfoDiv.style.padding = '1px';
    colorInfoDiv.style.borderRadius = '4px';
    colorInfoDiv.style.border = 'none';

    const charSelector = document.createElement('select');
    charSelector.id = 'rhythm-char-selector'; // ✅ Added ID
    charSelector.style.width = '30px';
    charSelector.style.height = '30px';
    charSelector.style.color = '#ffffff';
    charSelector.style.fontSize = '14px';
    charSelector.style.fontFamily = 'monospace';
    charSelector.style.border = 'none';
    charSelector.style.padding = '2px 2px';
    charSelector.style.cursor = 'pointer';
    charSelector.style.background = 'transparent'; // Will be set dynamically

    const colorInput = document.createElement('input');
    colorInput.id = 'rhythm-color-input'; // ✅ Added ID
    colorInput.type = 'color';
    colorInput.textContent = 'a';
    colorInput.style.width = '30px';
    colorInput.style.height = '30px';
    colorInput.style.border = 'none';
    colorInput.style.padding = '0';
    colorInput.style.background = 'transparent';

    // 🖼️ Image Picker Button (P5.js)
    const pickerBtn = document.createElement('button');
    pickerBtn.id = 'rhythm-image-picker-btn';
    pickerBtn.textContent = '🖼️';
    pickerBtn.title = 'Extraer 8 colores de imagen';
    pickerBtn.style.width = '30px';
    pickerBtn.style.height = '30px';
    pickerBtn.style.padding = '0';
    pickerBtn.style.fontSize = '18px';
    pickerBtn.style.cursor = 'pointer';
    pickerBtn.style.border = '0px solid #ccc';
    pickerBtn.style.borderRadius = '4px';
    pickerBtn.style.background = '#fff';
    pickerBtn.style.margin = '0';
    pickerBtn.style.marginLeft = '2px';
    pickerBtn.style.display = 'inline-block';
    pickerBtn.style.alignItems = 'center';
    pickerBtn.style.justifyContent = 'center';

    // Helper for Image Picker Modal (Robust version)
    const openImagePicker = (onSelect) => {
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.backgroundColor = 'rgba(0,0,0,0.92)';
        modal.style.zIndex = '20000';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.color = '#fff';
        modal.style.fontFamily = 'monospace';

        const title = document.createElement('div');
        title.innerHTML = '<b>Selector de Colores de Imagen</b><br>Haz clic en un punto para extraer 8 colores seguidos.';
        title.style.marginBottom = '10px';
        title.style.textAlign = 'center';
        modal.appendChild(title);

        const statusMsg = document.createElement('div');
        statusMsg.style.margin = '5px';
        statusMsg.style.color = '#ffeb3b';
        statusMsg.style.fontSize = '12px';
        statusMsg.textContent = 'Iniciando...';
        modal.appendChild(statusMsg);

        const fallbackContainer = document.createElement('div');
        fallbackContainer.style.margin = '10px';
        fallbackContainer.innerHTML = '<label style="font-size:12px; cursor:pointer; background:#444; padding:5px; border-radius:3px;">Cargar imagen local: <input type="file" accept="image/*" style="display:none"></label>';
        const fileInput = fallbackContainer.querySelector('input');
        modal.appendChild(fallbackContainer);

        const canvasContainer = document.createElement('div');
        canvasContainer.id = 'p5-picker-container';
        canvasContainer.style.backgroundColor = '#222';
        canvasContainer.style.border = '1px solid #555';
        canvasContainer.style.overflow = 'auto';
        canvasContainer.style.maxWidth = '90vw';
        canvasContainer.style.maxHeight = '70vh';
        modal.appendChild(canvasContainer);

        const controls = document.createElement('div');
        controls.style.marginTop = '15px';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Cerrar';
        closeBtn.style.padding = '8px 25px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.backgroundColor = '#e91e63';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '4px';
        closeBtn.addEventListener('click', () => {
            if (p5Instance) p5Instance.remove();
            modal.remove();
        });
        controls.appendChild(closeBtn);
        modal.appendChild(controls);

        document.body.appendChild(modal);

        let p5Instance = new p5((s) => {
            let img;
            let imgUrl = '001.png';

            s.preload = () => {
                console.log('🖼️ P5: Intentando cargar', imgUrl);
                statusMsg.textContent = 'Cargando ' + imgUrl + '...';
                img = s.loadImage(imgUrl,
                    () => {
                        console.log('✅ P5: Imagen cargada con éxito');
                        statusMsg.textContent = 'Imagen cargada. Haz clic en la imagen.';
                    },
                    (err) => {
                        console.error('❌ P5: Error al cargar:', err);
                        statusMsg.textContent = 'Error al cargar 001.png (CORS o archivo no encontrado). Prueba cargando un archivo local.';
                    }
                );
            };

            s.setup = () => {
                const canvas = s.createCanvas(img.width, img.height);
                canvas.parent('p5-picker-container');
                s.image(img, 0, 0);
                s.cursor(s.CROSS);
            };

            s.mousePressed = () => {
                if (s.mouseX >= 0 && s.mouseX < s.width && s.mouseY >= 0 && s.mouseY < s.height) {
                    const pixels = [];
                    const N = 4;
                    for (let i = 0; i < N; i++) {
                        const x = Math.min(s.width - 1, Math.floor(s.mouseX + i));
                        const c = s.get(x, s.mouseY);
                        pixels.push(`rgb(${c[0]}, ${c[1]}, ${c[2]})`);
                    }
                    console.log('🖼️ TRACE: Extracted colors from image:', pixels);
                    onSelect(pixels);
                    p5Instance.remove();
                    modal.remove();
                }
            };
        }, canvasContainer);
    };

    pickerBtn.addEventListener('click', () => {
        openImagePicker((colors) => {
            const char = window.intervalReferenceChar;
            if (colors.length > 0 && typeof np6 !== 'undefined') {
                const baseColor = colors[0];
                //console.log(`🎨 TRACE: Picker selected ${colors.length} colors. Base:`, baseColor);

                // 1. Update character base color
                //-->np6.setNoteColor(char, baseColor);

                // 2. Update character flavors with extracted sequence
                np6.noteColorMap[char + '_flavors'] = colors;

                // 3. Update UI consistency
                const hex = colorToHex(baseColor);
                colorInput.value = hex;
                charSelector.style.backgroundColor = baseColor;
                if (charSelector._getContrastColor) {
                    charSelector.style.color = charSelector._getContrastColor(baseColor);
                }

                // 4. Refresh display
                populateFlavors(char);
                //-->if (typeof makeladi === 'function') makeladi(baseColor);
            }
        });
    });

    // Initialize global reference char if not set
    if (typeof window.intervalReferenceChar === 'undefined') {
        window.intervalReferenceChar = 'a';
    }

    // Function to populate selector with color squares
    const populateCharSelector = () => {
        if (typeof np6 !== 'undefined' && np6.noteColorMap) {
            charSelector.innerHTML = '';

            // Helper to get contrasting text color
            const getContrastColor = (color) => {
                let r, g, b;
                // Parse color to RGB
                if (color.startsWith('#')) {
                    const hex = color.slice(1);
                    r = parseInt(hex.slice(0, 2), 16);
                    g = parseInt(hex.slice(2, 4), 16);
                    b = parseInt(hex.slice(4, 6), 16);
                } else if (color.startsWith('rgb')) {
                    const match = color.match(/\d+/g);
                    if (match && match.length >= 3) {
                        r = parseInt(match[0]);
                        g = parseInt(match[1]);
                        b = parseInt(match[2]);
                    }
                } else if (color.startsWith('hsl')) {
                    const hslMatch = color.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
                    if (hslMatch) {
                        const h = parseInt(hslMatch[1]) / 360;
                        const s = parseInt(hslMatch[2]) / 100;
                        const l = parseInt(hslMatch[3]) / 100;
                        if (s === 0) {
                            r = g = b = l * 255;
                        } else {
                            const hue2rgb = (p, q, t) => {
                                if (t < 0) t += 1;
                                if (t > 1) t -= 1;
                                if (t < 1 / 6) return p + (q - p) * 6 * t;
                                if (t < 1 / 2) return q;
                                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                                return p;
                            };
                            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                            const p = 2 * l - q;
                            r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
                            g = Math.round(hue2rgb(p, q, h) * 255);
                            b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
                        }
                    }
                }

                if (r !== undefined && g !== undefined && b !== undefined) {
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    return brightness > 128 ? '#000000' : '#ffffff';
                }
                return '#ffffff'; // Fallback
            };

            //console.log('📊 Populating Rhythm Char Selector. noteColorMap keys:', Object.keys(np6.noteColorMap).length);
            const chars = Object.keys(np6.noteColorMap)
                .filter(k => k.length === 1 || !k.endsWith('_flavors'))
                .sort();
            chars.forEach(char => {
                const option = document.createElement('option');
                option.value = char;
                option.textContent = char;

                const color = np6.noteColorMap[char];
                if (color) {
                    option.style.setProperty('background-color', color, 'important');
                    option.style.setProperty('color', getContrastColor(color), 'important');
                }

                if (char === window.intervalReferenceChar) {
                    option.selected = true;
                }
                charSelector.appendChild(option);
            });

            // Update select background color and text color to match selected option
            const selectedColor = np6.noteColorMap[window.intervalReferenceChar];
            if (selectedColor) {
                charSelector.style.backgroundColor = selectedColor;
                charSelector.style.color = getContrastColor(selectedColor);
                charSelector.style.fontSize = '14px'; // Restore font size
                // Store the helper for the event listener to use (hacky but works in this scope)
                charSelector._getContrastColor = getContrastColor;
            }
        }
    };

    // Function to update color input based on selected char
    const updateColorInput = () => {
        if (typeof np6 !== 'undefined' && np6.noteColorMap) {
            const char = window.intervalReferenceChar;
            const currentColor = np6.noteColorMap[char] || '#ff0000';
            if (typeof colorToHex === 'function') {
                colorInput.value = colorToHex(currentColor);
            } else {
                colorInput.value = currentColor.startsWith('#') ? currentColor : '#ff0000';
            }
        }
    };

    // MUSICOLI: Populate flavors from pre-generated character flavors
    const populateFlavors = (char) => {

        if (typeof np6 === 'undefined' || !np6.noteColorMap) {
            console.warn(`⚠️ TRACE: np6 or np6.noteColorMap is undefined, cannot populate flavors for "${char}".`);
            return;
        }
        const flavors = np6.noteColorMap[char + '_flavors'];
        if (!flavors) {
            console.warn(`⚠️ TRACE: No flavors found for character "${char}" in np6.noteColorMap!`);
        } else {
            console.log(`✨ TRACE: Found ${flavors.length} flavors for "${char}"`);
        }

        if (flavors && Array.isArray(flavors)) {
            selectedTonesContainer.innerHTML = '';
            window.selectedTones = [];

            flavors.forEach(color => {
                // Parse RGB from "rgb(r, g, b)"
                const rgbMatch = color.match(/\d+/g);
                if (!rgbMatch || rgbMatch.length < 3) return;
                const r = parseInt(rgbMatch[0]);
                const g = parseInt(rgbMatch[1]);
                const b = parseInt(rgbMatch[2]);

                const hexColor = colorToHex(color);

                const toneSpan = document.createElement('span');
                toneSpan.style.width = '25px';
                toneSpan.style.height = '25px';
                toneSpan.style.display = 'inline-block';
                toneSpan.style.marginRight = '0px';
                toneSpan.style.cursor = 'pointer';
                toneSpan.style.backgroundColor = color;
                toneSpan.style.border = 'none';

                // Relate MIDI values to color
                let midiNotes = [60, 64]; // Fallback
                if (typeof rgbToMidiInterval === 'function') {
                    midiNotes = rgbToMidiInterval(r, g, b);
                }
                toneSpan.dataset.midiValues = JSON.stringify(midiNotes);

                // Add standard event handlers
                addToneSpanEventHandlers(toneSpan, selectedTonesContainer, hexColor);

                // Update global state
                window.selectedTones.push({ hex: hexColor, rgb: { r, g, b } });

                selectedTonesContainer.appendChild(toneSpan);
            });

            // Update preview if available
            if (typeof window.updateRhythmColorPreview === 'function') {
                window.updateRhythmColorPreview();
            }
        }
    };

    // Initialize
    setTimeout(() => {
        populateCharSelector();
        updateColorInput();
        // Initialize color ladder with default color
        if (colorInput.value) {
            makeladi(colorInput.value);
        }
        // Initialize flavors for default char
        populateFlavors(window.intervalReferenceChar);
    }, 100);

    charSelector.addEventListener('change', (e) => {
        const char = e.target.value;
        window.intervalReferenceChar = char;
        updateColorInput();

        // Update select background color to match selected option
        const selectedColor = np6.noteColorMap[char];
        if (selectedColor) {
            charSelector.style.backgroundColor = selectedColor;

            // Update text color for visibility
            if (typeof charSelector._getContrastColor === 'function') {
                charSelector.style.color = charSelector._getContrastColor(selectedColor);
            } else {
                // Fallback simple logic if helper not available
                charSelector.style.color = '#ffffff';
            }
            charSelector.style.fontSize = '14px';
        }

        // Update color ladder when changing character
        if (colorInput.value) {
            makeladi(colorInput.value);
        }

        // Populate flavors for the new character
        populateFlavors(char);
    });

    colorInput.addEventListener('change', (e) => {
        if (typeof np6 !== 'undefined') {
            const newColor = e.target.value;
            const char = window.intervalReferenceChar;
            np6.setNoteColor(char, newColor);

            // MUSICOLI: Regenerate flavors based on the new color's hue
            const rgb = hexToRgb(newColor);
            if (rgb) {
                const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                const newFlavors = generateSimilarColors(hsl.h, hsl.s, hsl.l, 4);
                np6.noteColorMap[char + '_flavors'] = newFlavors;
                console.log(`🎨 Regenerated 8 similar flavors for ${char} based on HSL(${hsl.h.toFixed(1)}, ${hsl.s.toFixed(1)}%, ${hsl.l.toFixed(1)}%)`);

                // Refresh the flavor spans in the UI
                populateFlavors(char);
            }

            console.log(`Color for ${char} updated from Rhythm Editor:`, newColor);
            makeladi(newColor)
        }
    });

    colorInfoDiv.appendChild(charSelector);
    colorInfoDiv.appendChild(colorInput);
    colorInfoDiv.appendChild(pickerBtn);



    // Container for selected tones (nimidi)
    const selectedTonesContainer = document.createElement('div');
    selectedTonesContainer.id = 'selected-tones-container';
    selectedTonesContainer.style.display = 'inline-flex';
    selectedTonesContainer.style.gap = '0px';
    selectedTonesContainer.style.marginLeft = '0px';
    selectedTonesContainer.style.alignItems = 'center';

    // Array to store selected tones (colors) for nimidi
    window.selectedTones = window.selectedTones || [];

    colorInfoDiv.appendChild(selectedTonesContainer);

    const toplayi = document.createElement('button');
    toplayi.textContent = 'play';
    toplayi.id = 'button-to-play';
    toplayi.style.display = 'inline-flex';
    toplayi.style.padding = '4px 12px';
    toplayi.style.fontSize = '11px';
    toplayi.style.fontFamily = 'sans-serif';
    toplayi.style.background = '#4CAF50';
    toplayi.style.color = 'white';
    toplayi.style.border = 'none';
    toplayi.style.borderRadius = '3px';
    toplayi.style.cursor = 'pointer';
    toplayi.addEventListener('click', (e) => {
        //alert(currentPattern)
        if (currentPattern) {

            const spans = document.querySelectorAll('#selected-tones-container span[data-midi-values]');

            let accumulatedMidi = [];
            let accumulatedTipis = [];

            spans.forEach(span => {
                // MUSICOLI: Use all MIDI values, not just first 2 (for quaternary patterns)
                const midiVals = JSON.parse(span.dataset.midiValues);
                let pat = currentPattern; // Default
                if (span.dataset.customPattern) {
                    pat = JSON.parse(span.dataset.customPattern);
                } else if (span.dataset.isRest === 'true') {
                    pat = currentPattern.map(t => -Math.abs(t));
                }

                // We need to match pattern length to midi length? 
                // Usually currentPattern length matches the 'notes' count logic or we repeat it.
                // The original code calculated 'nimidi' length and repeated currentPattern.
                // logic: for each MIDI note in this span, we assign a rhythm value?
                // Or does typical logic imply 1:1?
                // The logic: nimidi is flat list of midis. tipis is flat list of durations.
                // If we have 2 midi notes per span, we need 2 dur values per span?
                // If the pattern has more notes than midi values, what happens?
                // Original code: nimidi was flatMap of slices(0,2). 
                // Then repeti was length of nimidi, cycling currentPattern.
                // So if currentPattern is [4,4] (2 notes) and we have 2 midi notes, it matches perfectly.

                accumulatedMidi.push(...midiVals);

                // Add pattern values corresponding to the midi values count
                for (let k = 0; k < midiVals.length; k++) {
                    accumulatedTipis.push(pat[k % pat.length]);
                }
            });

            const basi = [{
                nimidi: accumulatedMidi,
                tipis: accumulatedTipis,
                chordi: false,
                dinami: new Array(accumulatedMidi.length).fill(127)
            }];

            tuci(basi, 0);
        }
    });
    colorInfoDiv.appendChild(toplayi);


    const toescori = document.createElement('button');
    toescori.textContent = 'A partitura';
    toescori.id = 'button-to-score';
    toescori.style.display = 'inline-flex';
    toescori.style.padding = '4px 12px';
    toescori.style.fontSize = '11px';
    toescori.style.fontFamily = 'sans-serif';
    toescori.style.background = '#4CAF50';
    toescori.style.color = 'white';
    toescori.style.border = 'none';
    toescori.style.borderRadius = '3px';
    toescori.style.cursor = 'pointer';
    toescori.addEventListener('click', (e) => {
        if (currentPattern) {

            const spans = document.querySelectorAll('#selected-tones-container span[data-midi-values]');
            const spanCount = spans.length;
            for (let a = 0; a < spanCount; a++) {
                // MUSICOLI: Use all MIDI values, not just first 2 (for quaternary patterns)
                let nimidi = JSON.parse(spans[a].dataset.midiValues);
                let tipis = currentPattern;

                // MUSICOLI: Check for custom pattern (mixed rest/sound) first
                if (spans[a].dataset.customPattern) {
                    tipis = JSON.parse(spans[a].dataset.customPattern);
                }
                // If it is a rest span, negate the pattern (only if no custom pattern)
                else if (spans[a].dataset.isRest === 'true') {
                    tipis = currentPattern.map(t => -Math.abs(t));
                }

                let hexi = colorToHex(spans[a].style.backgroundColor);
                /*  
"idi": 1765781520201,
 "numi": 0,
 "nami": "Rosa rubor",
 "coli": [
   255,
   138,
   255,
   255
 ],
 "hexi": "#ff8aff",
 "pinti": {
   "c": 0,
   "m": 0,
   "y": 0,
   "k": 0.6,
   "w": 0
 },
 "nimidi": [
   81,
   69
 ],
 "nimidiColors": [
   [[
     255,
     206,
     255,
     255
   ]
 ],
 "timis": [
   15,
   2
 ],
 "tipis": [
   25,
   3
 ],
 "dinami": [
   64,
   64
 ],
 "tarari": "daaaa da",
 "liri": "",
 "chordi": false
}
 */
                //bdi.push({
                bdi.bar.splice((selectedMeasureIndex + a), 0, {
                    idi: a,
                    numi: spans[a].dataset.noteNumber,
                    nami: spans[a].dataset.noteName,
                    pinti: { c: 111, m: 111, y: 111, k: 111, w: 111 },
                    coli: spans[a].style.backgroundColor,
                    nimidi: JSON.parse(spans[a].dataset.midiValues),
                    tipis: tipis,
                    timis: [1, 1],
                    dinami: [64, 64],
                    chordi: false,
                    tarari: tarareoInput.value,
                    hexi: hexi

                });
            }
            window.applyTextLayer();
            window.rebuildRecordi();

        }
    });
    colorInfoDiv.appendChild(toescori);

    // Group selector and notation display - inline layout
    const controlRow = document.createElement('div');
    controlRow.style.display = 'flex';
    controlRow.style.alignItems = 'center';
    controlRow.style.gap = '8px';
    controlRow.style.marginBottom = '8px';
    controlRow.style.flexWrap = 'wrap';

    const groupSelector = document.createElement('div');
    groupSelector.style.display = 'flex';
    groupSelector.style.gap = '4px';
    groupSelector.style.flexWrap = 'wrap';

    // Container for notation display and accept button
    const notationContainer = document.createElement('div');
    notationContainer.style.display = 'inline-flex'; // MUSICOLI: Change to inline-flex
    notationContainer.style.flexDirection = 'row';   // MUSICOLI: Change to row for compactness
    notationContainer.style.alignItems = 'center';
    notationContainer.style.gap = '4px';
    notationContainer.style.padding = '0px';        // MUSICOLI: Remove padding
    notationContainer.style.background = 'transparent'; // MUSICOLI: Remove heavy background
    notationContainer.style.marginLeft = '4px';     // MUSICOLI: Small spacing from previous button
    // notationContainer.style.border = '1px solid #999'; // MUSICOLI: Remove border for "reduced" look

    // Color preview container (shows colors for the notes)
    const colorPreviewContainer = document.createElement('div');
    colorPreviewContainer.id = 'rhythm-color-preview';
    colorPreviewContainer.style.display = 'flex';
    colorPreviewContainer.style.gap = '2px';
    colorPreviewContainer.style.padding = '4px';
    colorPreviewContainer.style.justifyContent = 'center';
    colorPreviewContainer.style.minHeight = '30px';

    // Musical notation display - inline and compact
    const notationDisplay = document.createElement('div');
    notationDisplay.id = 'rhythm-notation-display';
    notationDisplay.style.padding = '8px 8px 1px 3px';
    notationDisplay.style.background = '#dddddd';
    notationDisplay.style.color = '#000';
    notationDisplay.style.borderRadius = '3px';
    notationDisplay.style.fontFamily = 'Bravura';
    notationDisplay.style.fontSize = '20px';
    notationDisplay.style.display = 'flex';
    notationDisplay.style.alignItems = 'flex-start';
    notationDisplay.style.gap = '1px';
    notationDisplay.style.position = 'relative';
    notationDisplay.style.cursor = 'pointer';
    notationDisplay.style.transition = 'background 0.2s';
    notationDisplay.style.lineHeight = '1';
    notationDisplay.innerHTML = '';

    // Store current pattern for playback
    currentPattern = null;

    // Hover effect
    notationDisplay.addEventListener('mouseenter', () => {
        if (currentPattern) {
            notationDisplay.style.background = '#ffe0b2';
        }
    });

    notationDisplay.addEventListener('mouseleave', () => {
        notationDisplay.style.background = '#fff3e0';
    });

    // Click to play
    notationDisplay.addEventListener('click', (e) => {
        // Prevent playing if clicking a button (like the accept button if it somehow bubbles here)
        //let a = 0
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

        if (currentPattern && typeof tuci === 'function') {
            // if (a == 0) {
            // Create basi structure for tuci
            const currentColor = hexToRgb(colorInput.value)
            const mari = rgbToMidiInterval(currentColor.r, currentColor.g, currentColor.b)
            console.log('mari: ', mari)
            const basi = [{
                //nimidi: currentPattern.map(() => 60), // Middle C for all notes
                nimidi: mari,
                tipis: currentPattern,
                chordi: false
            }];

            tuci(basi, 0);
        }
    });

    // Accept button for single rhythm selection
    const acceptBtn = document.createElement('button');
    acceptBtn.textContent = 'Aceptar';
    acceptBtn.id = 'rhythm-notation-button';
    acceptBtn.style.padding = '4px 12px';
    acceptBtn.style.fontSize = '11px';
    acceptBtn.style.fontFamily = 'sans-serif';
    acceptBtn.style.background = '#4CAF50';
    acceptBtn.style.color = 'white';
    acceptBtn.style.border = 'none';
    acceptBtn.style.borderRadius = '3px';
    acceptBtn.style.cursor = 'pointer';
    acceptBtn.style.display = 'none'; // Hidden by default, shown when pattern is selected
    acceptBtn.style.position = 'relative';
    acceptBtn.style.zIndex = '10';

    acceptBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentPattern) {
            return;
        }

        // Ensure we have access to global variables
        const bdiRef = (typeof window.bdi.bar !== 'undefined') ? window.bdi.bar : ((typeof bdi.bar !== 'undefined') ? bdi.bar : []);
        const recordiRef = (typeof window.recordi === 'function') ? window.recordi : ((typeof recordi === 'function') ? recordi : null);

        if (bdiRef && recordiRef) {
            let calculatedTimis = [];
            if (typeof restini === 'function') {
                calculatedTimis = restini([currentPattern])[0];
            } else {
                calculatedTimis = currentPattern.map(elemento => {
                    if (elemento >= 10) {
                        let decenas = Math.floor(elemento / 10);
                        let unidades = elemento % 10;
                        return (decenas - 1) * 10 + unidades;
                    } else if (elemento < 0) {
                        return elemento - 1;
                    } else {
                        return elemento - 1;
                    }
                });
            }

            // Generate default dynamics (all 64, no accents for palette patterns)
            const defaultDynamics = currentPattern.map(() => 64);

            // Calculate color and MIDI notes BEFORE creating the item
            // Priority: 1) First selected tone, 2) Color input (intervalReferenceChar)
            let colorA;
            let useSelectedTone = window.selectedTones && window.selectedTones.length > 0;

            if (useSelectedTone) {
                // Use the first selected tone's color
                colorA = window.selectedTones[0].hex;
                console.log('🎨 Using first selected tone color:', colorA);
            } else {
                // Fall back to the color input
                const refChar = (typeof window.intervalReferenceChar !== 'undefined') ? window.intervalReferenceChar : 'a';
                colorA = (typeof np6 !== 'undefined' && np6.noteColorMap && np6.noteColorMap[refChar])
                    ? np6.noteColorMap[refChar]
                    : 'hsl(0, 100%, 50%)';
                console.log('🎨 Using color input:', colorA);
            }

            // Get current voice selection
            const voiceSelector = document.getElementById('voice-selector');
            const selectedVoiceName = voiceSelector ? voiceSelector.value : 'soprano';

            // Parse color for storage
            let r = 100, g = 100, b = 100;
            let hexColor = "#646464";

            if (typeof colorToHex === 'function') {
                hexColor = colorToHex(colorA);
                const rgb = hexToRgb(hexColor);
                if (rgb) { r = rgb.r; g = rgb.g; b = rgb.b; }
            } else {
                // Basic parsing fallback
                if (colorA.startsWith('#')) {
                    hexColor = colorA;
                    const hex = colorA.slice(1);
                    if (hex.length === 6) {
                        r = parseInt(hex.slice(0, 2), 16);
                        g = parseInt(hex.slice(2, 4), 16);
                        b = parseInt(hex.slice(4, 6), 16);
                    }
                } else if (colorA.startsWith('rgb')) {
                    const match = colorA.match(/\d+/g);
                    if (match) {
                        r = parseInt(match[0]); g = parseInt(match[1]); b = parseInt(match[2]);
                        hexColor = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                    }
                }
            }

            // Get color name in Spanish
            let colorName = "Ritmo " + (bdiRef.length + 1);
            try {
                const colorInfo = await consulti(r, g, b);
                if (colorInfo && colorInfo.nombre) {
                    const translated = await traducirOnline(colorInfo.nombre);
                    colorName = translated;
                }
            } catch (err) {
                console.log("Error fetching color name:", err);
            }

            // Calculate MIDI notes, source colors, AND rest status
            let midiNotes = [60];
            let sourceColors = []; // Array of [r,g,b,a]
            let restStatus = [];   // Array of booleans: true = isRest

            try {
                if (useSelectedTone) {
                    // Re-extract everything from DOM to ensure sync
                    // This allows mix of Rest Triads and Note Triads
                    midiNotes = [];
                    sourceColors = [];
                    restStatus = [];

                    const container = document.getElementById('selected-tones-container');
                    if (container && container.children.length > 0) {
                        const toneSpans = Array.from(container.children);
                        toneSpans.forEach(span => {
                            // 1. Get MIDI Values
                            let spanMidi = [];
                            try {
                                spanMidi = JSON.parse(span.dataset.midiValues || "[]");
                            } catch (e) { spanMidi = [60]; }
                            if (spanMidi.length === 0) spanMidi = [60];

                            midiNotes.push(...spanMidi);

                            // 2. Get Rest Status
                            const isSpanRest = span.dataset.isRest === 'true';
                            const isMixed = span.dataset.isRest === 'mixed';
                            let mixedRestPattern = [];

                            if (isMixed) {
                                try {
                                    mixedRestPattern = JSON.parse(span.dataset.customPattern || "[]");
                                } catch (e) { mixedRestPattern = []; }
                            }

                            // Push status for EACH note in the span (e.g. 3 times for a triad)
                            for (let k = 0; k < spanMidi.length; k++) {
                                // MUSICOLI: Check if the MIDI value itself is 0 (silence)
                                const isMidiSilence = (spanMidi[k] === 0);

                                if (isMixed && mixedRestPattern.length > k) {
                                    // Negative value means rest
                                    restStatus.push(mixedRestPattern[k] < 0 || isMidiSilence);
                                } else {
                                    restStatus.push(isSpanRest || isMidiSilence);
                                }
                            }

                            // 3. Get Color
                            const bgColor = span.style.backgroundColor;
                            let colorArr = [100, 100, 100, 255];
                            const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                            if (rgbMatch) {
                                const r_val = parseInt(rgbMatch[1]);
                                const g_val = parseInt(rgbMatch[2]);
                                const b_val = parseInt(rgbMatch[3]);
                                colorArr = [r_val, g_val, b_val, 255];
                            }
                            // Store source color once per span (or repeat? let's repeat to match notes)
                            // Actually, standard logic usually repeats colors to match notes?
                            // Let's just push it once per span and handle index modulo later?
                            // Better: Push parallel to notes for perfect 1:1 mapping if possible.
                            // But usually colors are 1 per Chord/Triad?
                            // Let's keep sourceColors per Span for now as per original logic implies
                            sourceColors.push(colorArr);
                        });
                    }
                    console.log('🎵 Mapped MIDI:', midiNotes);
                    console.log('😴 Rest Status:', restStatus);

                } else if (typeof rgbToMidiInterval === 'function') {
                    // Fallback for single color input (no queue)
                    // ... existing logic ...
                    let r_mid = r, g_mid = g, b_mid = b;
                    if (colorA.startsWith('hsl')) {
                        // ... (keep short for simplicity in this replacement, assume valid RGB/HSL parsing logic exists above or is handled)
                        // Actually we can reuse 'r','g','b' from above if we trust them?
                        // Let's re-run precision HSL logic just in case? 
                        // To avoid code bloat, let's trust r,g,b computed at lines 2728-2738 if valid
                    }
                    // But we need safe HSL conversion if it was HSL string...
                    // Let's re-implement the block to be safe since we are replacing it.
                    const hslMatch = colorA.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
                    if (hslMatch) {
                        const h = parseInt(hslMatch[1]) / 360;
                        const s = parseInt(hslMatch[2]) / 100;
                        const l = parseInt(hslMatch[3]) / 100;
                        if (s === 0) { r_mid = g_mid = b_mid = l * 255; } else {
                            const hue2rgb = (p, q, t) => {
                                if (t < 0) t += 1; if (t > 1) t -= 1;
                                if (t < 1 / 6) return p + (q - p) * 6 * t;
                                if (t < 1 / 2) return q;
                                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                                return p;
                            };
                            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                            const p = 2 * l - q;
                            r_mid = hue2rgb(p, q, h + 1 / 3) * 255;
                            g_mid = hue2rgb(p, q, h) * 255;
                            b_mid = hue2rgb(p, q, h - 1 / 3) * 255;
                        }
                    }

                    midiNotes = rgbToMidiInterval(r_mid, g_mid, b_mid, 60);
                    sourceColors.push([r, g, b, 255]);
                    // No rests in default mode
                    midiNotes.forEach(() => restStatus.push(false));
                }
            } catch (e) {
                console.log("Error calculating MIDI/Colors:", e);
                midiNotes = [60];
                sourceColors = [[r, g, b, 255]];
                restStatus = [false];
            }

            // Generate nimidi and nimidiColors arrays
            const finalNimidi = currentPattern.map((_, idx) => midiNotes[idx % midiNotes.length]);

            // Calculate TIPIS with REST STATUS
            // If we have restStatus, use it to negate specific elements.
            // If restStatus is missing (legacy path), assume all positive.
            const finalTipis = currentPattern.map((val, idx) => {
                const isPatternRest = val < 0;
                const isNoteRest = restStatus[idx % restStatus.length];
                return (isPatternRest || isNoteRest) ? -Math.abs(val) : Math.abs(val);
            });

            // Just use sourceColors directly as palette
            let finalNimidiColors = sourceColors;

            // MUSICOLI: Match background to rhythm-color-preview (1 color per 3 notes)
            const noteCount = currentPattern.filter(n => n > 0).length;
            const colorsNeeded = Math.ceil(noteCount / 3);
            const selectedTones = window.selectedTones || [];

            if (colorsNeeded > 1) {
                const gradientColors = [];
                for (let i = 0; i < colorsNeeded; i++) {
                    let col;
                    if (selectedTones.length > 0) {
                        col = selectedTones[i % selectedTones.length].hex;
                    } else {
                        col = colorInput.value;
                    }
                    gradientColors.push(col);
                }
                // Construct linear gradient
                hexColor = `linear-gradient(to right, ${gradientColors.join(', ')})`;
                console.log('🌈 Applying multi-color gradient background:', hexColor);
            } else {
                // Solid color (already set to the first color/input above, but ensuring consistency)
                if (selectedTones.length > 0) {
                    hexColor = selectedTones[0].hex;
                } else {
                    hexColor = colorInput.value;
                }
            }

            // Fix: Map short codes to full names to ensure matching
            const codeMap = { 's': 'soprano', 'a': 'contralto', 't': 'tenor', 'b': 'bajo' };
            let normalizedVoiceName = selectedVoiceName;
            if (codeMap[selectedVoiceName]) normalizedVoiceName = codeMap[selectedVoiceName];

            const newItem = {
                "idi": Date.now(),
                "numi": bdiRef.length,
                "nami": colorName,
                "coli": [r, g, b, 255],
                "hexi": hexColor,
                "pinti": { "c": 0, "m": 0, "y": 0, "k": 0.6, "w": 0 },
                "nimidi": finalNimidi,
                "nimidiColors": finalNimidiColors,
                "timis": calculatedTimis,
                "tipis": finalTipis,
                "dinami": defaultDynamics,
                "tarari": patternToTarareo(currentPattern, defaultDynamics), // Add tarari with dynamics
                "liri": "", // Add lyrics field (empty by default)
                "chordi": false,
                "voci": (() => {
                    // Helper to create voice data based on mode
                    const createVoiceData = (voiceName, voiceCode) => {
                        const isSelectedVoice = (normalizedVoiceName === voiceName);

                        // In INDEPENDENT mode, only selected voice gets content
                        if (voiceEditMode === 'independent' && !isSelectedVoice) {
                            // Create silence for non-selected voices
                            return {
                                "nami": voiceCode,
                                "nimidi": currentPattern.map(() => 0),
                                "timis": [...calculatedTimis],
                                "tipis": currentPattern.map(t => -Math.abs(t)),  // NEGATIVE for silence
                                "dinami": [...defaultDynamics],
                                "nimidiColors": currentPattern.map(() => [128, 128, 128, 255]),
                                "tarari": ""
                            };
                        }

                        // In DEPENDENT mode OR selected voice in INDEPENDENT mode
                        return {
                            "nami": voiceCode,
                            "nimidi": (useSelectedTone && isSelectedVoice) ? finalNimidi : currentPattern.map((_, idx) => {
                                const notes = rgbToMidiInterval(r, g, b, 60, voiceName);
                                return notes[idx % notes.length];
                            }),
                            "timis": [...calculatedTimis],
                            "tipis": [...finalTipis],
                            "dinami": [...defaultDynamics],
                            "nimidiColors": [...finalNimidiColors],
                            "tarari": patternToTarareo(currentPattern, defaultDynamics)
                        };
                    };

                    console.log('🔍 CREATE MEASURE - Mode:', voiceEditMode, 'Voice:', normalizedVoiceName);

                    return [
                        createVoiceData('soprano', 's'),
                        createVoiceData('contralto', 'a'),
                        createVoiceData('tenor', 't'),
                        createVoiceData('bajo', 'b')
                    ];
                })()
            };

            const cursorMeasureIndex = (typeof np6 !== 'undefined' && np6.getCursorMeasureIndex)
                ? np6.getCursorMeasureIndex()
                : bdiRef.length;

            console.log(`📍 Inserting measure at cursor position: ${cursorMeasureIndex}`);
            bdiRef.splice(cursorMeasureIndex, 0, newItem);
            console.log("Inserted in bdi at index:", cursorMeasureIndex, newItem);

            // Clear redo stack when adding new entry
            if (window.bdiRedoStack) {
                window.bdiRedoStack = []
                    ;
                console.log('Redo stack cleared after adding new entry');
            }

            // Initialize traki if it doesn't exist (needed for first measure)
            if (typeof window.traki === 'undefined' || !window.traki || window.traki.length === 0) {
                console.log('⚠️ traki not initialized, initializing now...');
                window.traki = [];
                for (let i = 0; i < 4; i++) {
                    window.traki.push(new MidiWriter.Track());
                }
                window.tempi = 120;
                console.log('✅ traki initialized with 4 tracks');
            }

            recordiRef(bdiRef, cursorMeasureIndex);

            // Update Notepad and Player - copied from tarareo options accept button (line 4340)
            if (typeof updateAfterBdiChange === 'function') {
                updateAfterBdiChange();
                console.log('🎨 updateAfterBdiChange() called after adding measure');

                // Restore and advance cursor
                if (typeof np6 !== 'undefined') {
                    np6.cursorPos = cursorMeasureIndex + 1;
                    np6._render();
                    if (typeof np6.focus === 'function') np6.focus();
                    if (typeof np6.scrollToCursor === 'function') np6.scrollToCursor();
                }
            } else {
                console.error('❌ updateAfterBdiChange function not found - notepad will not update');
                // Fallback: at least update cursor
                if (typeof np6 !== 'undefined') {
                    np6.cursorPos = cursorMeasureIndex + 1;
                    np6._render();
                    if (typeof np6.focus === 'function') np6.focus();
                    if (typeof np6.scrollToCursor === 'function') np6.scrollToCursor();
                }
            }

            acceptBtn.textContent = '✓';
            acceptBtn.style.background = '#45a049';
            setTimeout(() => {
                acceptBtn.textContent = 'Aceptar';
                acceptBtn.style.background = '#4CAF50';
            }, 1000);
        }
    };

    // Expose the acceptance logic globally so ladder spans can trigger it
    window.triggerAcceptRhythm = () => {
        if (typeof acceptBtn !== 'undefined' && acceptBtn) {
            // Only trigger if the button is visible (meaning a pattern is selected)
            if (acceptBtn.style.display !== 'none') {
                acceptBtn.click();
            }
        }
    };

    // Create Dinámica editor UI for editing MIDI velocity values
    function createDinamicaEditor() {
        const slidersContainer = document.getElementById('dinamica-sliders-container');
        if (!slidersContainer) return;

        // Clear existing sliders
        slidersContainer.innerHTML = '';

        // Get current measure data
        if (selectedMeasureIndex < 0 || !window.bdi.bar || selectedMeasureIndex >= window.bdi.bar.length) {
            slidersContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666; font-family: monospace;">Selecciona un compás para editar sus dinámicas</div>';
            return;
        }

        const measure = window.bdi.bar[selectedMeasureIndex];
        const voiceSelector = document.getElementById('voice-selector');
        const selectedVoiceName = voiceSelector ? voiceSelector.value : 's';

        // Get voice data
        let voiceData = measure;
        if (measure.voci && Array.isArray(measure.voci)) {
            const voiceMap = { 's': 's', 'a': 'a', 't': 't', 'b': 'b' };
            const targetNami = voiceMap[selectedVoiceName] || 's';
            const foundVoice = measure.voci.find(v => v.nami === targetNami);
            if (foundVoice) {
                voiceData = foundVoice;
            }
        }

        const nimidi = voiceData.nimidi || [];
        const dinami = voiceData.dinami || [];

        // Ensure dinami array exists and matches nimidi length
        while (dinami.length < nimidi.length) {
            dinami.push(64); // Default to mezzo-forte
        }
        voiceData.dinami = dinami;

        // Create header
        const header = document.createElement('div');
        header.style.cssText = 'margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 4px; font-family: monospace; font-size: 13px; color: #1565c0;';
        header.innerHTML = `<strong>Compás ${selectedMeasureIndex + 1}</strong> - ${nimidi.length} nota(s)`;
        slidersContainer.appendChild(header);

        // Create slider for each note
        nimidi.forEach((midiNote, index) => {
            const sliderRow = document.createElement('div');
            sliderRow.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 8px; background: #f5f5f5; border-radius: 3px;';

            // Note label
            const noteLabel = document.createElement('span');
            noteLabel.style.cssText = 'min-width: 80px; font-family: monospace; font-size: 12px; color: #333; font-weight: bold;';
            const noteName = (typeof midiToScientific === 'function') ? midiToScientific(midiNote) : `MIDI ${midiNote}`;
            noteLabel.textContent = `${noteName}:`;

            // Velocity slider
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '127';
            slider.value = dinami[index] || 64;
            slider.style.cssText = 'flex: 1; cursor: pointer;';

            // Velocity value display
            const valueDisplay = document.createElement('span');
            valueDisplay.style.cssText = 'min-width: 40px; font-family: monospace; font-size: 12px; color: #1565c0; font-weight: bold; text-align: right;';
            valueDisplay.textContent = slider.value;

            // Update on slider change
            slider.addEventListener('input', (e) => {
                const newValue = parseInt(e.target.value);
                valueDisplay.textContent = newValue;
                dinami[index] = newValue;

                // Update BDI
                if (typeof rebuildRecordi === 'function') {
                    rebuildRecordi();
                }
            });

            sliderRow.appendChild(noteLabel);
            sliderRow.appendChild(slider);
            sliderRow.appendChild(valueDisplay);
            slidersContainer.appendChild(sliderRow);
        });

        // Add preset button handlers
        const presetButtons = document.querySelectorAll('.dinamica-preset');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const presetValue = parseInt(btn.dataset.value);

                // Apply preset to all notes in current measure
                dinami.forEach((_, index) => {
                    dinami[index] = presetValue;
                });

                // Refresh the editor to show new values
                createDinamicaEditor();

                // Update BDI
                if (typeof rebuildRecordi === 'function') {
                    rebuildRecordi();
                }
            });
        });
    }

    // Expose globally
    window.createDinamicaEditor = createDinamicaEditor;

    // Function to update color preview based on pattern
    const updateColorPreview = (pattern) => {
        colorPreviewContainer.innerHTML = '';

        if (!pattern || pattern.length === 0) {
            return;
        }

        // Count non-rest notes (exclude negative values)
        const noteCount = pattern.filter(n => n > 0).length;

        // Calculate how many color spans we need (each span = 3 notes)
        const spansNeeded = Math.ceil(noteCount / 3);

        // Get selected tones or use default
        const selectedTones = window.selectedTones || [];

        for (let i = 0; i < spansNeeded; i++) {
            const colorSpan = document.createElement('span');
            colorSpan.style.width = '25px';
            colorSpan.style.height = '25px';
            colorSpan.style.display = 'inline-block';
            colorSpan.style.borderRadius = '3px';
            colorSpan.style.cursor = 'pointer';

            // Get color from selectedTones, cycling if needed
            let bgColor;
            if (selectedTones.length > 0) {
                const toneIndex = i % selectedTones.length;
                const tone = selectedTones[toneIndex];
                bgColor = tone.hex;
            } else {
                // Default to current color input
                bgColor = colorInput.value;
            }

            colorSpan.style.backgroundColor = bgColor;

            // Add click handler to play this color's notes
            colorSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof tuci === 'function' && typeof rgbToMidiInterval === 'function') {
                    const rgb = hexToRgb(bgColor);
                    if (rgb) {
                        const midiNotes = rgbToMidiInterval(rgb.r, rgb.g, rgb.b);
                        const basi = [{
                            nimidi: midiNotes,
                            tipis: [3, 3, 3],
                            chordi: false
                        }];
                        tuci(basi, 0);
                    }
                }
            });

            colorPreviewContainer.appendChild(colorSpan);
        }
    };

    // Global wrapper to update color preview with current pattern
    window.updateRhythmColorPreview = () => {
        if (currentPattern) {
            updateColorPreview(currentPattern);
        }
    };

    notationContainer.appendChild(colorPreviewContainer);
    notationContainer.appendChild(notationDisplay);
    notationContainer.appendChild(acceptBtn);

    // controlRow.appendChild(groupSelector); // Removed per user request (relocated to monocromati)
    // controlRow.appendChild(notationContainer); // RELOCATED to colorInfoDiv per user request
    // header.appendChild(controlRow); // MUSICOLI: Removed empty row to avoid gap

    // MUSICOLI: Move Rhythm Notation group to the end of Rhythm Color info div
    if (colorInfoDiv) {
        colorInfoDiv.appendChild(notationContainer);
    }

    container.innerHTML = '';
    container.appendChild(header);

    // Content area (rhythm pattern palette)
    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexWrap = 'wrap';
    content.style.marginTop = '0px'; // MUSICOLI: No top margin
    content.style.paddingTop = '0px'; // MUSICOLI: No top padding
    content.style.gap = '3px';

    // MUSICOLI: Expose content globally for re-attachment
    window.rhythmEditorContent = content;

    // MUSICOLI: Relocate content to the dedicated slot below buttons if available
    const rhythmSlot = document.getElementById('rhythm-patterns-slot');
    if (rhythmSlot) {
        // Ensure content is strictly relative
        content.style.position = 'relative';
        content.style.marginLeft = '15px';   // align with selector
        rhythmSlot.innerHTML = ''; // Clear previous content if any
        rhythmSlot.appendChild(content);
    } else {
        // Fallback: regular append to editor container
        container.appendChild(content);
    }

    // Legacy append check removed to prevent duplication
    // container.appendChild(content);

    // State
    window.rhythmEditorState = window.rhythmEditorState || {};
    window.rhythmEditorState.currentGroupIndex = 0;


    // Build group selector buttons
    const buildGroupButtons = () => {
        const activeTrili = typeof getActiveTrili === 'function' ? getActiveTrili() : (typeof trilipi !== 'undefined' ? trilipi : []);
        if (!activeTrili || activeTrili.length === 0) return;

        groupSelector.innerHTML = '';

        for (let i = 1; i < activeTrili.length; i++) {
            if (!activeTrili[i] || activeTrili[i].length === 0) continue;

            const btn = document.createElement('button');
            btn.textContent = `${i}`;
            btn.style.padding = '4px 10px';
            btn.style.fontFamily = 'monospace';
            btn.style.fontSize = '12px';
            btn.style.border = '1px solid #ccc';
            btn.style.borderRadius = '3px';
            btn.style.cursor = 'pointer';
            btn.style.background = i === currentGroup ? '#4caf50' : '#fff';
            btn.style.color = i === currentGroup ? '#fff' : '#333';
            btn.style.fontWeight = i === currentGroup ? 'bold' : 'normal';

            btn.addEventListener('click', () => {

                currentGroup = i;
                document.getElementById('nnoti').innerHTML = currentGroup;

                buildGroupButtons();
                buildPatternGrid(i);

                makeladi()
            });

            groupSelector.appendChild(btn);

        }

    };
    function newritmi(cugi = 0) {
        setTimeout(() => {
            const cells = content.querySelectorAll('div[data-pattern]');
            if (cells.length > 0) {
                const randomIndex = Math.floor(Math.random() * cells.length);
                cells[randomIndex].click();
                console.log('🎲 newritmi: Random pattern selected:', randomIndex);
            }
        }, 100);
    }
    function newritmi01(cugi = 0) {
        setTimeout(() => {
            const activeTrili = typeof getActiveTrili === 'function' ? getActiveTrili() : (typeof trilipi !== 'undefined' ? trilipi : []);
            if (activeTrili[currentGroup]) {
                const patterns = activeTrili[currentGroup];
                // Find the pattern [3, 3, 3, 3] (four quarter notes)
                const targetPatternIndex = patterns.findIndex(p =>
                    p.length === currentGroup && p.every(note => note === currentGroup)
                );
                if (targetPatternIndex !== -1) {
                    // Find the corresponding cell and trigger click
                    const cells = content.querySelectorAll('div[data-pattern]');
                    if (cells[targetPatternIndex]) {
                        cells[targetPatternIndex].click();
                    }
                }
            }
        }, 100);
    }
    // MUSICOLI: Helper function to apply pattern (extracted/duplicated for reuse in modal)
    const applyPatternToApp = (pattern, labelText) => {
        // Store pattern for playback
        currentPattern = pattern;
        if (currentPattern && typeof tuci === 'function') {
            const currentColor = hexToRgb(colorInput.value) || { r: 0, g: 0, b: 0 };
            // rgbToMidiInterval is global?
            if (typeof rgbToMidiInterval === 'function') {
                const mari = rgbToMidiInterval(currentColor.r, currentColor.g, currentColor.b);
                const basi = [{
                    nimidi: mari,
                    tipis: currentPattern,
                    chordi: false
                }];
                tuci(basi, 0);
            }
        }

        // Update display
        //const display = document.getElementById('rhythm-notation-display');
        // notationDisplay variable is available in closure
        if (notationDisplay) {
            const labelSpan = `<span style="font-family: monospace; font-size: 10px; color: #1976D2; font-weight: bold; position: absolute; top: 2px; left: 4px;">${labelText}</span>`;
            const notesSpan = `<span style="margin-left: 12px; padding-top: 8px; display: inline-block;">${renderPattern(noteMap, pattern)}</span>`;
            notationDisplay.innerHTML = labelSpan + notesSpan;
        }

        // Update color preview
        if (typeof window.updateRhythmColorPreview === 'function') {
            window.updateRhythmColorPreview();
        } else if (typeof updateColorPreview === 'function') {
            updateColorPreview(pattern);
        }

        // Show accept button
        if (acceptBtn) acceptBtn.style.display = 'block';

        // Update tarareo
        const tarareoInput = document.getElementById('tarareo-input');
        if (tarareoInput && typeof patternToTarareo === 'function') {
            const defaultDynamics = pattern.map(() => 64);
            const tarareoText = patternToTarareo(pattern, defaultDynamics);
            tarareoInput.value = tarareoText;
        }

        // Update textarea layers
        const textarea = document.getElementById('text-layer-6');
        const lyricsTextarea = document.getElementById('lyrics-layer-6');

        if (textarea && lyricsTextarea) {
            const lyricsGroups = lyricsTextarea.value.split(',');
            const currentTokens = textarea.value.trim().split(/\s+/).filter(t => t);

            while (currentTokens.length < lyricsGroups.length) {
                currentTokens.push('4n');
            }

            const targetIndex = window.rhythmEditorState.currentGroupIndex || 0;

            if (targetIndex < currentTokens.length) {
                const patternNotation = pattern.join(' ');
                currentTokens[targetIndex] = patternNotation;
                textarea.value = currentTokens.join(' ');
                textarea.dispatchEvent(new Event('input'));
            }
        }
    };

    // MUSICOLI: Show Silence Variations in Middle Column (replaces modal)
    const showSilenceVariationsColumn = (initialPattern) => {
        // Ensure resti is available
        if (typeof resti !== 'function') {
            console.error('resti() function not found');
            return;
        }

        const column = document.getElementById('silence-variations-column');
        const content = document.getElementById('silence-variations-content');

        if (!column || !content) {
            console.error('Silence variations column not found in DOM');
            return;
        }

        // Generate variations - Prepend original pattern
        const variations = [initialPattern, ...resti(initialPattern)];
        console.log('Generating variations for middle column:', initialPattern, variations);

        // Clear previous content
        content.innerHTML = '';

        // Show column
        column.style.display = 'flex';

        // Create variation buttons
        variations.forEach((variation, index) => {
            const btn = document.createElement('div');
            btn.style.cssText = `
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 5px 3px;
                cursor: pointer;
                text-align: center;
                background-color: #fff;
                transition: all 0.2s;
                min-height: 35px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            // Dark style for patterns with silences
            if (variation.some(n => n < 0)) {
                btn.style.backgroundColor = '#222';
                btn.style.color = '#fff';
                btn.style.borderColor = '#444';
            }

            // Render musical notation
            const notation = document.createElement('div');
            notation.style.fontFamily = 'Bravura';
            notation.style.fontSize = '16px';
            notation.style.lineHeight = '1';

            // Set color based on whether pattern has silences
            if (variation.some(n => n < 0)) {
                notation.style.color = '#fff'; // White text for dark background
            } else {
                notation.style.color = '#333'; // Dark text for light background
            }

            if (typeof renderPattern === 'function' && typeof noteMap !== 'undefined') {
                notation.innerHTML = renderPattern(noteMap, variation);
            } else {
                notation.textContent = variation.join(' ');
            }

            btn.appendChild(notation);

            // Hover effects
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.05)';
                btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                btn.style.borderColor = '#1976D2';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = 'none';
                if (variation.some(n => n < 0)) {
                    btn.style.borderColor = '#444';
                } else {
                    btn.style.borderColor = '#ddd';
                }
            });

            // Click handler
            btn.addEventListener('click', () => {
                console.log('Silence variation clicked:', variation);

                // Send to MIDI Editor if active
                if (window.currentEditingMeasureIndex >= 0) {
                    const rhythmInput = document.getElementById('rhythm-values-input');
                    if (rhythmInput && variation && Array.isArray(variation)) {
                        rhythmInput.value = variation.join(' ');
                        rhythmInput.dispatchEvent(new Event('input'));
                        console.log('🎼 Sent variation to rhythm input:', variation);
                    }
                }

                // Apply pattern to app
                if (typeof applyPatternToApp === 'function') {
                    applyPatternToApp(variation, `V${index + 1}`);
                }

                // Optional: hide column after selection
                // column.style.display = 'none';
            });

            content.appendChild(btn);
        });
    };


    // Build pattern grid for selected group
    const buildPatternGrid = (groupIndex) => {
        content.innerHTML = '';

        // Hide accept button and clear notation display when switching groups
        acceptBtn.style.display = 'none';
        notationDisplay.innerHTML = '';
        colorPreviewContainer.innerHTML = '';
        currentPattern = null;

        const activeTrili = typeof getActiveTrili === 'function' ? getActiveTrili() : (typeof trilipi !== 'undefined' ? trilipi : []);
        if (!activeTrili || !activeTrili[groupIndex]) {
            content.textContent = 'No hay patrones';
            return;
        }

        const patterns = activeTrili[groupIndex];

        patterns.forEach((pattern, n) => {
            const cell = document.createElement('div');
            cell.style.border = '1px solid #ddd';
            cell.style.borderRadius = '3px';
            cell.style.padding = '2px';
            cell.style.background = '#fff';
            cell.style.cursor = 'pointer';
            cell.style.display = 'flex';
            cell.style.flexDirection = 'column';
            cell.style.alignItems = 'center';
            cell.style.minWidth = '35px';
            cell.style.transition = 'all 0.15s';
            cell.style.position = 'relative';
            cell.dataset.pattern = JSON.stringify(pattern);

            // Label - positioned in top-left corner
            const label = document.createElement('div');
            label.textContent = `${getColumnLabel(n)}`;
            label.style.fontSize = '7px';
            label.style.color = '#1976D2';
            label.style.fontWeight = 'bold';
            label.style.position = 'absolute';
            label.style.top = '0px';
            label.style.left = '2px';
            label.style.zIndex = '1';

            // Notation
            const notation = document.createElement('div');
            notation.style.fontFamily = 'Bravura';
            notation.style.fontSize = '16px';
            notation.style.color = '#333';
            notation.style.lineHeight = '0.7'; // Compact
            notation.style.paddingTop = '6px'; // Reduced
            notation.style.paddingBottom = '0px';
            notation.style.paddingLeft = '8px';
            notation.innerHTML = renderPattern(noteMap, pattern);

            cell.appendChild(label);
            cell.appendChild(notation);

            // Hover
            cell.addEventListener('mouseenter', () => {
                cell.style.borderColor = '#1976D2';
                cell.style.transform = 'translateY(-1px)';
                cell.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            });

            cell.addEventListener('mouseleave', () => {
                if (!cell.classList.contains('selected')) {
                    cell.style.borderColor = '#ddd';
                    cell.style.transform = 'translateY(0)';
                    cell.style.boxShadow = 'none';
                }
            });

            // Click
            cell.addEventListener('click', (e) => {
                console.log('Click on pattern:', pattern, 'Group:', groupIndex, 'Trusted:', e.isTrusted);

                // MUSICOLI: Check if MIDI Editor is actively editing and send rhythm values to it
                if (window.currentEditingMeasureIndex >= 0) {
                    const rhythmInput = document.getElementById('rhythm-values-input');
                    if (rhythmInput && pattern && Array.isArray(pattern)) {
                        // Send the rhythm pattern times to the rhythm input
                        rhythmInput.value = pattern.join(' ');
                        // Trigger input event to update the preview
                        rhythmInput.dispatchEvent(new Event('input'));
                        console.log('🎼 Sent rhythm pattern to rhythm input:', pattern);
                    }
                }

                // MUSICOLI: Show Silence Variations in Middle Column for Groups 3-7
                // Try to show variations, but DONT return - let standard selection proceed
                if ((Number(groupIndex) >= 3 && Number(groupIndex) <= 7) && e.isTrusted) {
                    try {
                        console.log('Showing silence variations in middle column for group', groupIndex);
                        showSilenceVariationsColumn(pattern);
                    } catch (err) {
                        console.error("Failed to show silence variations:", err);
                    }
                    // Fall through to allow standard selection/playback logic below
                }

                // Store pattern for playback
                currentPattern = pattern;
                if (currentPattern && typeof tuci === 'function') {
                    // Get current color and convert to MIDI notes
                    const currentColor = hexToRgb(colorInput.value);
                    const mari = rgbToMidiInterval(currentColor.r, currentColor.g, currentColor.b);
                    console.log('🎵 Playing pattern with RGB MIDI notes:', mari);

                    // Create basi structure for tuci with 3 RGB-derived notes
                    const basi = [{
                        nimidi: mari, // Three MIDI notes from R, G, B components
                        tipis: currentPattern,
                        chordi: false
                    }];
                    tuci(basi, 0);
                }

                // Clear selection
                // Clear selection
                content.querySelectorAll('div[data-pattern]').forEach(c => {
                    c.classList.remove('selected');
                    // Check if it's a silence variation to restore dark theme
                    if (c.classList.contains('silence-variation')) {
                        c.style.borderColor = '#444';
                        c.style.background = '#222';
                    } else {
                        c.style.borderColor = '#ddd';
                        c.style.background = '#fff';
                    }
                });

                // Select
                cell.classList.add('selected');
                cell.style.borderColor = '#1976D2';
                cell.style.borderWidth = '2px';
                cell.style.background = '#e3f2fd';

                // Update display with label in top-left corner
                const labelSpan = `<span style="font-family: monospace; font-size: 10px; color: #1976D2; font-weight: bold; position: absolute; top: 2px; left: 4px;">${getColumnLabel(n)}</span>`;
                const notesSpan = `<span style="margin-left: 12px; padding-top: 8px; display: inline-block;">${renderPattern(noteMap, pattern)}</span>`;
                notationDisplay.innerHTML = labelSpan + notesSpan;
                //updatidi(n, pattern)

                // Update color preview
                updateColorPreview(pattern);

                // Show accept button
                acceptBtn.style.display = 'block';

                // Update tarareo input with syllable representation
                const tarareoInput = document.getElementById('tarareo-input');
                if (tarareoInput && typeof patternToTarareo === 'function') {
                    const defaultDynamics = pattern.map(() => 64); // No accents by default
                    const tarareoText = patternToTarareo(pattern, defaultDynamics);
                    tarareoInput.value = tarareoText;
                    console.log('Pattern to tarareo:', pattern, '→', tarareoText);
                }

                // Apply to textarea
                const textarea = document.getElementById('text-layer-6');
                const lyricsTextarea = document.getElementById('lyrics-layer-6');

                if (textarea && lyricsTextarea) {
                    const lyricsGroups = lyricsTextarea.value.split(',');
                    const currentTokens = textarea.value.trim().split(/\s+/).filter(t => t);

                    while (currentTokens.length < lyricsGroups.length) {
                        currentTokens.push('4n');
                    }

                    const targetIndex = window.rhythmEditorState.currentGroupIndex || 0;

                    if (targetIndex < currentTokens.length) {
                        const patternNotation = pattern.join(' '); // Use literal tipis
                        currentTokens[targetIndex] = patternNotation;
                        textarea.value = currentTokens.join(' ');
                        textarea.dispatchEvent(new Event('input'));
                    }
                }

            });

            content.appendChild(cell);
            newritmi(0)
        });

        // MUSICOLI: Add "S" button for silence variations (only for 8-note group)
        // Check loosely for 8 to catch string/number mismatches
        // MUSICOLI: Auto-generate silence variations for the 2-note group (User request)
        if (groupIndex == 2) {
            console.log('[DEBUG] Inserting silence variations for group 2');
            // Use explicit silence variations provided by user that fill 4/4 measure
            let variations = [];
            if (typeof generateSilenceVariations === 'function') {
                variations = [
                    [25, -3],  // Dotted Half + Quarter Rest
                    [-25, 3],  // Dotted Half Rest + Quarter 
                    [-2, 2],   // Half Rest + Half
                    [2, -2],   // Half + Half Rest
                    [3, -25],  // Quarter + Dotted Half Rest
                    [-3, 25]   // Quarter Rest + Dotted Half
                ];
            }

            variations.forEach((variation, idx) => {
                // Determine label (e.g., S1, S2...) because strict A-Z might be taken
                // Or just continue visually
                const labelText = "S" + (idx + 1);

                const cell = document.createElement('div');
                cell.classList.add('silence-variation');
                cell.style.border = '1px solid #444';
                cell.style.borderRadius = '3px';
                cell.style.padding = '0px'; // Compact
                cell.style.background = '#222'; // Dark
                cell.style.cursor = 'pointer';
                cell.style.display = 'flex';
                cell.style.flexDirection = 'column';
                cell.style.alignItems = 'center';
                cell.style.justifyContent = 'center';
                cell.style.minWidth = '35px';
                cell.style.height = 'auto';
                cell.style.transition = 'all 0.15s';
                cell.style.position = 'relative';
                cell.dataset.pattern = JSON.stringify(variation);

                // Label
                const label = document.createElement('div');
                label.textContent = labelText;
                label.style.fontSize = '7px';
                label.style.color = '#90CAF9';
                label.style.fontWeight = 'bold';
                label.style.position = 'absolute';
                label.style.top = '0px';
                label.style.left = '2px';
                label.style.zIndex = '1';

                // Notation
                const notation = document.createElement('div');
                notation.style.fontFamily = 'Bravura';
                notation.style.fontSize = '16px';
                notation.style.color = '#fff';
                notation.style.lineHeight = '0.7'; // Compact
                notation.style.paddingTop = '6px';
                notation.style.paddingBottom = '0px';
                notation.style.paddingLeft = '8px';
                notation.style.display = 'block';

                if (typeof renderPattern === 'function' && typeof noteMap !== 'undefined') {
                    notation.innerHTML = renderPattern(noteMap, variation);
                } else {
                    notation.textContent = variation.join(' ');
                }

                cell.appendChild(label);
                cell.appendChild(notation);

                // Hover
                cell.addEventListener('mouseenter', () => {
                    cell.style.borderColor = '#64B5F6';
                    cell.style.background = '#333';
                    cell.style.transform = 'translateY(-1px)';
                    cell.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
                });

                cell.addEventListener('mouseleave', () => {
                    if (!cell.classList.contains('selected')) {
                        cell.style.borderColor = '#444';
                        cell.style.background = '#222';
                        cell.style.transform = 'translateY(0)';
                        cell.style.boxShadow = 'none';
                    }
                });

                // Click
                cell.addEventListener('click', () => {
                    // MUSICOLI: Check if MIDI Editor is actively editing and send notes to it
                    if (window.currentEditingMeasureIndex >= 0) {
                        const rhythmInput = document.getElementById('rhythm-values-input');
                        if (rhythmInput && variation && Array.isArray(variation)) {
                            // Send the rhythm pattern times to the rhythm input
                            rhythmInput.value = variation.join(' ');
                            // Trigger input event to update the preview
                            rhythmInput.dispatchEvent(new Event('input'));
                            console.log('🎼 Sent silence variation to rhythm input:', variation);
                        }
                    }

                    currentPattern = variation;
                    // Clear selection
                    content.querySelectorAll('div[data-pattern]').forEach(c => {
                        c.classList.remove('selected');
                        if (c.classList.contains('silence-variation')) {
                            c.style.borderColor = '#444';
                            c.style.background = '#222';
                        } else {
                            c.style.borderColor = '#ddd';
                            c.style.background = '#fff';
                        }
                    });

                    // Select
                    cell.classList.add('selected');
                    cell.style.borderColor = '#42A5F5';
                    cell.style.borderWidth = '2px';
                    cell.style.background = '#1565C0';

                    // Update display
                    // updatidi equivalent
                    const display = document.getElementById('rhythm-notation-display');
                    if (display) {
                        const labelSpan = `<span style="font-family: monospace; font-size: 10px; color: #1976D2; font-weight: bold; position: absolute; top: 2px; left: 4px;">${labelText}</span>`;
                        const notesSpan = `<span style="margin-left: 12px; padding-top: 8px; display: inline-block;">${renderPattern(noteMap, variation)}</span>`;
                        display.innerHTML = labelSpan + notesSpan;
                    }

                    // Update color preview
                    if (typeof window.updateRhythmColorPreview === 'function') {
                        window.updateRhythmColorPreview();
                    }
                    // Show accept button
                    if (typeof acceptBtn !== 'undefined' && acceptBtn) acceptBtn.style.display = 'block';
                });

                content.appendChild(cell);
            });
        }

        if (groupIndex == 8) {
            console.log('[DEBUG] Inserting S button for group 8');
            const sCell = document.createElement('div');
            sCell.style.border = '1px solid #FF9800'; // Orange border
            sCell.style.borderRadius = '3px';
            sCell.style.padding = '0px'; // No padding
            sCell.style.background = '#FFF3E0'; // Light orange bg
            sCell.style.cursor = 'pointer';
            sCell.style.display = 'flex';
            sCell.style.flexDirection = 'column';
            sCell.style.alignItems = 'center';
            sCell.style.justifyContent = 'center'; // Center content
            sCell.style.minWidth = '15px';
            sCell.style.height = 'auto'; // Let content dictate or match others
            sCell.style.transition = 'all 0.15s';
            sCell.style.position = 'relative';
            sCell.style.marginTop = '2px'; // Ensure some spacing if wrapping
            sCell.title = 'Ver variaciones de silencios';

            // Big S symbol
            const symbol = document.createElement('div');
            symbol.textContent = 'S';
            symbol.style.fontFamily = 'bravura';
            symbol.style.fontSize = '12px';
            symbol.style.lineHeight = '1'; // Compact
            symbol.style.marginTop = '2px'; // Align visually with notes
            symbol.style.color = '#BF360C'; // Very dark orange
            symbol.style.fontWeight = 'bold';



            sCell.appendChild(symbol);

            sCell.onmouseenter = () => {
                sCell.style.backgroundColor = '#FFE0B2';
                sCell.style.transform = 'translateY(-1px)';
                sCell.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            };
            sCell.onmouseleave = () => {
                sCell.style.backgroundColor = '#FFF3E0';
                sCell.style.transform = 'translateY(0)';
                sCell.style.boxShadow = 'none';
            };

            sCell.onclick = () => {
                console.log('[DEBUG] S button clicked');
                if (typeof openSilenceVariationsModal === 'function') {
                    openSilenceVariationsModal();
                } else {
                    console.error('[DEBUG] openSilenceVariationsModal function is missing!');
                }
            };

            content.appendChild(sCell);

            // Log for verification
            console.log('[DEBUG] S button appended to content');
        } else {
            console.log('[DEBUG] Not group 8, skipping S button');
        }
    };

    // Initialize
    buildGroupButtons();
    buildPatternGrid(currentGroup);

    // Auto-select the "4 N" pattern [3, 3, 3, 3] after initialization
    newritmi(0)

    // Move colorInfoDiv to appear after #editor-tonalidad-ladder
    const ladderElement = document.getElementById('editor-tonalidad-ladder');
    if (ladderElement && colorInfoDiv) {
        // Insert colorInfoDiv after the ladder element
        ladderElement.parentNode.insertBefore(colorInfoDiv, ladderElement.nextSibling);
        // Add some spacing
        //colorInfoDiv.style.marginTop = '0px';
        colorInfoDiv.style.display = 'block'; // Change from flex to block for full width
    }

    // Global update function
    window.updateSelect = function (index) {
        if (index >= 1 && index < trilipi.length) {
            currentGroup = index;
            buildGroupButtons();
            buildPatternGrid(index);

            // Select a random pattern from the list
            setTimeout(() => {
                const cells = content.querySelectorAll('div[data-pattern]');
                if (cells.length > 0) {
                    const randomIndex = Math.floor(Math.random() * cells.length);
                    cells[randomIndex].click();
                    console.log('🎲 updateSelect: Random pattern selected:', randomIndex);
                } else {
                    console.log('⚠️ updateSelect: No cells found for group', index);
                }
            }, 100);
        }
    };
}

// Create Lyrics palette editor UI (Placeholder)
function createLyricsEditor(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    // Header
    const header = document.createElement('div');
    header.style.marginBottom = '15px';

    const title = document.createElement('h3');
    title.textContent = 'Editor de Paleta de Lyrics';
    title.style.margin = '0';
    title.style.fontFamily = 'monospace';

    header.appendChild(title);
    container.innerHTML = '';
    container.appendChild(header);

    // Placeholder content
    const content = document.createElement('div');
    content.style.padding = '20px';
    content.style.textAlign = 'center';
    content.style.color = '#666';
    content.style.fontFamily = 'monospace';
    content.textContent = 'Configuración de lyrics próximamente...';

    container.appendChild(content);
}

// Convert rhythm pattern to tarareo (syllables)
function patternToTarareo(pattern, dynamics = null) {
    const syllableMap = {
        1: 'daaaa',     // whole note (4 beats)
        2: 'daaa',      // half note (2 beats) - 3 a's
        25: 'daaaa',    // dotted half (3 beats)
        3: 'da',        // quarter note (1 beat)
        35: 'daa',      // dotted quarter (1.5 beats) - 2 a's
        4: 'ti',        // eighth note (0.5 beat)
        45: 'tii',      // dotted eighth (0.75 beat)
        5: 'di',        // sixteenth note (0.25 beat)
    };

    // Map rests to their corresponding note syllables
    const restToNoteSyllable = {
        '-1': 'daaaa',   // whole rest -> whole note syllable
        '-2': 'daaa',    // half rest -> half note syllable
        '-25': 'daaaa',  // dotted half rest
        '-3': 'da',      // quarter rest -> quarter note syllable
        '-35': 'daa',    // dotted quarter rest
        '-4': 'ti',      // eighth rest -> eighth note syllable
        '-45': 'tii',    // dotted eighth rest
        '-5': 'di'       // sixteenth rest -> sixteenth note syllable
    };

    // Function to add accent to syllable (only first vowel in sequence)
    const addAccent = (syllable) => {
        // Only accent the first occurrence of each vowel
        return syllable
            .replace(/a/, 'á')  // First 'a' only
            .replace(/e/, 'é')  // First 'e' only
            .replace(/i/, 'í')  // First 'i' only
            .replace(/o/, 'ó')  // First 'o' only
            .replace(/u/, 'ú'); // First 'u' only
    };

    let tarareo = [];

    pattern.forEach((code, index) => {
        if (code < 0) {
            // Handle rests: use '-' + corresponding syllable
            const restSyllable = restToNoteSyllable[code] || 'da';
            tarareo.push('-' + restSyllable);
        } else {
            // Handle notes
            let syllable = syllableMap[code] || 'ta';

            // Check if this note is accented
            const isAccented = dynamics && dynamics[index] && dynamics[index] > 64;

            if (isAccented) {
                syllable = addAccent(syllable);
            }

            tarareo.push(syllable);
        }
    });

    return tarareo.join(' ').replace(/\\s+/g, ' ').trim();
}
// Generate 3 rhythm variations from syllable data
function generateRhythmVariations(wordsData, hasRests) {
    // wordsData = [{word: "tarida", syllables: 3}, ...]
    const variations = [];

    // VARIATION 1: All uniform - based on average syllable density
    let pattern1 = [];
    let duration1 = 0;
    wordsData.forEach((wordData, idx) => {
        // 1 syllable = half note, 2 syllables = quarter notes, 3+ = eighth notes
        let noteCode;
        if (wordData.syllables === 1) {
            noteCode = 2; // half note (blanca)
            duration1 += 2;
        } else if (wordData.syllables === 2) {
            noteCode = 3; // quarter note (negra)
            duration1 += 1;
        } else {
            noteCode = 4; // eighth note (corchea)
            duration1 += 0.5;
        }

        for (let i = 0; i < wordData.syllables; i++) {
            pattern1.push(noteCode);
        }

        if (hasRests && idx < wordsData.length - 1) {
            pattern1.push(-3); // quarter rest
            duration1 += 1;
        }
    });
    variations.push({
        name: "Opción 1: Uniforme",
        pattern: pattern1,
        duration: duration1,
        description: "Según sílabas"
    });

    // VARIATION 2: Proportional - same as variation 1 for now
    let pattern2 = [];
    let duration2 = 0;
    wordsData.forEach((wordData, idx) => {
        let noteCode;
        if (wordData.syllables === 1) {
            noteCode = 2; // half note
            duration2 += 2;
        } else if (wordData.syllables === 2) {
            noteCode = 3; // quarter note
            duration2 += 1;
        } else if (wordData.syllables === 3) {
            noteCode = 4; // eighth note
            duration2 += 0.5;
        } else {
            noteCode = 5; // sixteenth note
            duration2 += 0.25;
        }

        for (let i = 0; i < wordData.syllables; i++) {
            pattern2.push(noteCode);
        }

        if (hasRests && idx < wordsData.length - 1) {
            pattern2.push(-3); // quarter rest
            duration2 += 1;
        }
    });
    variations.push({
        name: "Opción 2: Proporcional",
        pattern: pattern2,
        duration: duration2,
        description: "Según sílabas"
    });

    // VARIATION 3: Mixed - first syllable longer
    let pattern3 = [];
    let duration3 = 0;
    wordsData.forEach((wordData, idx) => {
        if (wordData.syllables === 1) {
            pattern3.push(2); // half note
            duration3 += 2;
        } else if (wordData.syllables === 2) {
            // First quarter, second eighth
            pattern3.push(3); // quarter
            pattern3.push(4); // eighth + eighth rest to fill
            pattern3.push(-4); // eighth rest
            duration3 += 2;
        } else {
            // First syllable quarter, rest eighth
            for (let i = 0; i < wordData.syllables; i++) {
                if (i === 0) {
                    pattern3.push(3); // first syllable quarter
                    duration3 += 1;
                } else {
                    pattern3.push(4); // rest eighth
                    duration3 += 0.5;
                }
            }
        }

        if (hasRests && idx < wordsData.length - 1) {
            pattern3.push(-3); // quarter rest
            duration3 += 1;
        }
    });
    variations.push({
        name: "Opción 3: Mixta",
        pattern: pattern3,
        duration: duration3,
        description: "Acentuada"
    });

    return variations;
}

// Global function to update BDI display
function updateBdiDisplay() {
    const bdiDisplay = document.getElementById('bdi-display');
    if (bdiDisplay && typeof window.bdi.bar !== 'undefined') {
        bdiDisplay.value = JSON.stringify(window.bdi.bar, null, 2);
    }
}

function tarareoAritmo() {
    const tarareoInput = document.getElementById('tarareo-input');
    if (!tarareoInput) return;

    let input = tarareoInput.value.trim();
    if (!input) return;

    // Initialize bdi structure if it doesn't exist
    if (typeof window.bdi === 'undefined') {
        window.bdi = {};
    }
    if (typeof window.bdi.bar === 'undefined') {
        window.bdi.bar = [];
    }
    if (typeof window.bdi.metadata === 'undefined') {
        window.bdi.metadata = {
            "bpm": 120,
            "timeSignature": "4/4",
            "title": "emotion",
            "voici": "s",
            "voices": {
                "s": { "instrument": 1, "percussion": false },
                "a": { "instrument": 1, "percussion": false },
                "t": { "instrument": 1, "percussion": false },
                "b": { "instrument": 1, "percussion": false }
            }
        };
    }

    console.log("Tarareo input:", input);

    // Split by comma to detect explicit measures
    const measures = input.split(',');
    let allWordsData = [];

    measures.forEach((measureInput, measureIndex) => {
        // Split by 2+ spaces to detect rests within measure
        const segments = measureInput.trim().split(/\s{2,}/);

        segments.forEach((segment, segmentIndex) => {
            const words = segment.split(/\s+/).filter(w => w.length > 0);

            words.forEach(word => {
                // Check if word starts with minus sign (rest marker)
                const isRestMarker = word.startsWith('-');
                const cleanWord = isRestMarker ? word.substring(1) : word;

                // If it's a rest marker and has no content after -, skip
                if (isRestMarker && cleanWord.length === 0) {
                    console.log('Empty rest marker, skipping');
                    return;
                }

                // Split word into syllables based on vowel groups
                const vowelPattern = /[aeiouàáâãäåèéêëìíîïòóôõöùúûüýÿAEIOUÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ]+/gi;
                const syllables = [];
                let lastIndex = 0;
                let match;

                // Find all vowel groups and extract syllables
                const vowelMatches = [];
                while ((match = vowelPattern.exec(cleanWord)) !== null) {
                    vowelMatches.push({
                        vowels: match[0],
                        index: match.index,
                        length: match[0].length
                    });
                }

                // If no vowels found, skip this word
                if (vowelMatches.length === 0) {
                    console.log(`Word "${cleanWord}" has no vowels, skipping`);
                    return;
                }

                // Extract syllables (consonants before vowel + vowel group)
                vowelMatches.forEach((vm, i) => {
                    let syllableStart = lastIndex;
                    let syllableEnd = vm.index + vm.length;

                    // Include consonants after this vowel until next vowel (or end)
                    if (i < vowelMatches.length - 1) {
                        // Split consonants between vowels
                        const nextVowelIndex = vowelMatches[i + 1].index;
                        const consonantsBetween = cleanWord.substring(syllableEnd, nextVowelIndex);
                        // Simple rule: give half consonants to this syllable
                        const splitPoint = Math.ceil(consonantsBetween.length / 2);
                        syllableEnd += splitPoint;
                    } else {
                        // Last syllable gets all remaining characters
                        syllableEnd = cleanWord.length;
                    }

                    const syllableText = cleanWord.substring(syllableStart, syllableEnd);
                    const hasAccent = /[àáâãäåèéêëìíîïòóôõöùúûüýÿÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝ]/.test(syllableText);

                    syllables.push({
                        text: syllableText,
                        vowelCount: vm.length,
                        hasAccent: hasAccent
                    });

                    lastIndex = syllableEnd;
                });

                console.log(`Word: "${word}", Clean: "${cleanWord}", IsRest: ${isRestMarker}, Syllables:`, syllables);

                // Convert syllables to notes or rests
                if (syllables.length === 1) {
                    // Single syllable - use vowel count logic
                    const vowelCount = syllables[0].vowelCount;
                    let noteCode, duration;

                    if (vowelCount >= 5) {
                        noteCode = isRestMarker ? -1 : 1; duration = 4; // Whole note/rest
                    } else if (vowelCount === 4) {
                        noteCode = isRestMarker ? -25 : 25; duration = 3; // Dotted half
                    } else if (vowelCount === 3) {
                        noteCode = isRestMarker ? -2 : 2; duration = 2; // Half note/rest
                    } else if (vowelCount === 2) {
                        noteCode = isRestMarker ? -35 : 35; duration = 1.5; // Dotted quarter
                    } else {

                        // Single vowel - check for specific patterns
                        if (cleanWord.length <= 2) {
                            if (cleanWord.match(/^[td][iíîï]$/i)) {
                                // ti/di -> eighth note
                                noteCode = isRestMarker ? -4 : 4; duration = 0.5;
                            } else if (cleanWord.match(/^[r][aeiouàáâãäåèéêëìíîïòóôõöùúûüýÿ]$/i)) {
                                // ra/re/ri/ro/ru -> sixteenth note
                                noteCode = isRestMarker ? -5 : 5; duration = 0.25;
                            } else {
                                // default -> quarter note
                                noteCode = isRestMarker ? -3 : 3; duration = 1;
                            }
                        } else {
                            noteCode = isRestMarker ? -3 : 3; duration = 1; // Quarter note/rest
                        }
                    }

                    allWordsData.push({
                        word: word,
                        syllable: syllables[0].text,
                        noteCode: noteCode,
                        duration: duration,
                        isRest: isRestMarker,
                        isAccented: syllables[0].hasAccent
                    });
                } else {
                    // Multi-syllable word
                    syllables.forEach((syllable, syllableIndex) => {
                        let noteCode, duration;

                        if (syllableIndex === 0) {
                            // First syllable: quarter note (negra)
                            noteCode = isRestMarker ? -3 : 3;
                            duration = 1;
                        } else {
                            // Subsequent syllables: eighth note (corchea)
                            noteCode = isRestMarker ? -4 : 4;
                            duration = 0.5;
                        }

                        allWordsData.push({
                            word: word,
                            syllable: syllable.text,
                            noteCode: noteCode,
                            duration: duration,
                            isRest: isRestMarker,
                            isAccented: syllable.hasAccent
                        });
                    });
                }
            });

            // Add rest if segment had trailing spaces (if not last segment in measure)
            if (segmentIndex < segments.length - 1) {
                // Add a rest marker?
                // For now, let's just add a rest note code directly or handle it in variations
                // Let's add a rest object
                allWordsData.push({
                    isRest: true,
                    noteCode: -3, // Quarter rest default
                    duration: 1,
                    isAccented: false
                });
            }
        });

        // Add explicit bar line if not the last measure
        if (measureIndex < measures.length - 1) {
            allWordsData.push({ isBarLine: true });
        }
    });

    // Generate variations based on the parsed data
    const variations = [];

    // VARIATION 1: Literal (respecting explicit bar lines and overflow)
    let pattern1 = [];
    let dynamics1 = [];
    let currentMeasureDur = 0;

    allWordsData.forEach(item => {
        if (item.isBarLine) {
            pattern1.push(100); // Bar line code
            dynamics1.push(64);
            currentMeasureDur = 0;
        } else if (item.isRest) {
            pattern1.push(item.noteCode);
            dynamics1.push(64);
            currentMeasureDur += item.duration;
        } else {
            // Check for overflow
            if (currentMeasureDur + item.duration > 4) {
                // Overflow! Insert bar line
                pattern1.push(100);
                dynamics1.push(64);
                currentMeasureDur = 0;
            }
            pattern1.push(item.noteCode);
            dynamics1.push(item.isAccented ? 80 : 64);
            currentMeasureDur += item.duration;
        }
    });

    variations.push({
        name: "Opción 1: Literal",
        pattern: pattern1,
        dynamics: dynamics1,
        description: "Tal cual se escribió"
    });

    // VARIATION 2: Auto-fill (fill measures with rests)
    let pattern2 = [];
    let dynamics2 = [];
    currentMeasureDur = 0;

    allWordsData.forEach(item => {
        if (item.isBarLine) {
            // Fill previous measure if needed
            while (currentMeasureDur < 4) {
                if (4 - currentMeasureDur >= 1) {
                    pattern2.push(-3);
                    dynamics2.push(64);
                    currentMeasureDur += 1;
                }
                else {
                    pattern2.push(-4);
                    dynamics2.push(64);
                    currentMeasureDur += 0.5;
                }
            }
            pattern2.push(100);
            dynamics2.push(64);
            currentMeasureDur = 0;
        } else if (item.isRest) {
            pattern2.push(item.noteCode);
            dynamics2.push(64);
            currentMeasureDur += item.duration;
        } else {
            if (currentMeasureDur + item.duration > 4) {
                pattern2.push(100);
                dynamics2.push(64);
                currentMeasureDur = 0;
            }
            pattern2.push(item.noteCode);
            dynamics2.push(item.isAccented ? 80 : 64);
            currentMeasureDur += item.duration;
        }
    });
    // Fill last measure
    if (currentMeasureDur < 4 && currentMeasureDur > 0) {
        while (currentMeasureDur < 4) {
            if (4 - currentMeasureDur >= 1) {
                pattern2.push(-3);
                dynamics2.push(64);
                currentMeasureDur += 1;
            }
            else {
                pattern2.push(-4);
                dynamics2.push(64);
                currentMeasureDur += 0.5;
            }
        }
    }

    variations.push({
        name: "Opción 2: Relleno",
        pattern: pattern2,
        dynamics: dynamics2,
        description: "Completa compases"
    });

    // VARIATION 3: Double Time (Repeated to fill measure)
    let pattern3 = [];
    let dynamics3 = [];

    // 1. Generate base sequence with doubled speed
    let baseSequence = [];
    let baseDuration = 0;

    allWordsData.forEach(item => {
        if (item.isBarLine) return; // Ignore input bar lines

        let newCode = item.noteCode;
        let newDur = item.duration;

        // Halve durations
        if (item.isRest) {
            if (item.noteCode === -1) { newCode = -2; newDur = 2; }
            else if (item.noteCode === -2) { newCode = -3; newDur = 1; }
            else if (item.noteCode === -3) { newCode = -4; newDur = 0.5; }
            else if (item.noteCode === -25) { newCode = -35; newDur = 1.5; }
            else { newCode = -4; newDur = 0.5; }
        } else {
            if (item.noteCode === 1) { newCode = 2; newDur = 2; }
            else if (item.noteCode === 2) { newCode = 3; newDur = 1; }
            else if (item.noteCode === 25) { newCode = 35; newDur = 1.5; }
            else if (item.noteCode === 3) { newCode = 4; newDur = 0.5; }
            else if (item.noteCode === 35) { newCode = 45; newDur = 0.75; }
            else { newCode = 5; newDur = 0.25; }
        }

        baseSequence.push({
            code: newCode,
            duration: newDur,
            dynamic: item.isAccented ? 80 : 64
        });
        baseDuration += newDur;
    });

    // 2. Repeat sequence if total duration < 4
    if (baseSequence.length > 0) {
        let fullSequence = [...baseSequence];
        let totalDuration = baseDuration;

        // Repeat until we have at least 4 beats
        let loopGuard = 0;
        while (totalDuration < 4 && loopGuard < 10) {
            fullSequence = fullSequence.concat(baseSequence);
            totalDuration += baseDuration;
            loopGuard++;
        }

        // 3. Construct pattern with bar lines
        let currentMeasureDur = 0;

        fullSequence.forEach((note, i) => {
            // If adding this note exceeds 4 beats, add bar line first
            // (Simple logic: if we are at 0, don't add bar line. If we cross 4, add bar line)
            // Actually, if we are at 4, we should have added bar line previously.
            // But if this note makes it > 4?
            // We'll just let it flow for now, or split? Splitting is hard.
            // Let's assume we just wrap.

            if (currentMeasureDur >= 4) {
                pattern3.push(100);
                dynamics3.push(64);
                currentMeasureDur = 0;
            }

            pattern3.push(note.code);
            dynamics3.push(note.dynamic);
            currentMeasureDur += note.duration;
        });

        // 4. Fill remaining space in last measure
        if (currentMeasureDur > 0 && currentMeasureDur < 4) {
            while (currentMeasureDur < 4) {
                if (4 - currentMeasureDur >= 1) {
                    pattern3.push(-3); // Quarter rest
                    dynamics3.push(64);
                    currentMeasureDur += 1;
                } else {
                    pattern3.push(-4); // Eighth rest
                    dynamics3.push(64);
                    currentMeasureDur += 0.5;
                }
            }
        }
    }

    variations.push({
        name: "Opción 3: Doble velocidad",
        pattern: pattern3,
        dynamics: dynamics3,
        description: "Más rápido (bucle)"
    });

    // Switch to Ritmo mode
    if (typeof setMode === 'function') {
        setMode('text');
    }

    // Update notepad to show the new measures
    if (typeof updateAfterBdiChange === 'function') {
        updateAfterBdiChange();
    } else if (typeof window.applyTextLayer === 'function') {
        window.applyTextLayer();
    }

    // Display all 3 options
    const notationDisplay = document.getElementById('rhythm-notation-display');

    // Hide the single rhythm accept button since we're showing tarareo options
    const singleAcceptBtn = notationDisplay?.parentElement?.querySelector('button');
    if (singleAcceptBtn && singleAcceptBtn.textContent.includes('Aceptar')) {
        singleAcceptBtn.style.display = 'none';
    }

    if (notationDisplay) {
        notationDisplay.innerHTML = '';
        notationDisplay.style.background = '#777';
        notationDisplay.style.flexDirection = 'row'; // Horizontal layout
        notationDisplay.style.gap = '4px';
        notationDisplay.style.padding = '4px';
        notationDisplay.style.flexWrap = 'wrap';

        const noteMap = {
            1: '&#xE1D2;', 2: '&#xE1D3;', 25: '&#xE1D3; &#xE1E7;',
            3: '&#xE1D5;', 35: '&#xE1D5; &#xE1E7;',
            4: '&#xE1D7;', 45: '&#xE1D7; &#xE1E7;', 5: '&#xE1D9;',
            '-1': '&#xE4E3;', '-2': '&#xE4E4;', '-3': '&#xE4E5;', '-4': '&#xE4E6;', '-5': '&#xE4E7;',
            100: '&nbsp;&#xE030;&nbsp;' // Bar line with spacing
        };

        variations.forEach((variation, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.style.display = 'flex';
            optionDiv.style.flexDirection = 'column'; // Vertical inside each option
            optionDiv.style.alignItems = 'center';
            optionDiv.style.gap = '3px';
            optionDiv.style.padding = '4px';
            optionDiv.style.background = '#fff';
            optionDiv.style.borderRadius = '4px';
            optionDiv.style.border = '1px solid #ddd';
            optionDiv.style.flex = '1';
            optionDiv.style.minWidth = '150px';

            // Label
            const label = document.createElement('div');
            label.textContent = variation.name;
            label.style.fontFamily = 'monospace';
            label.style.fontSize = '10px';
            label.style.fontWeight = 'bold';
            label.style.color = '#666';
            label.style.textAlign = 'center';
            label.style.marginBottom = '4px';

            // Notation
            const notation = document.createElement('div');
            notation.style.fontFamily = 'Bravura';
            notation.style.fontSize = '18px';
            notation.style.cursor = 'pointer';
            notation.style.padding = '8px 4px 2px 4px';
            notation.style.background = '#fff3e0';
            notation.style.borderRadius = '3px';
            notation.style.textAlign = 'center';
            notation.style.lineHeight = '1';

            // Build notation with accents
            const notationHTML = variation.pattern.map((num, idx) => {
                const noteSymbol = noteMap[num] || '';
                if (!noteSymbol) return '';

                // Check if this note is accented (skip bar lines)
                const isAccented = variation.dynamics && variation.dynamics[idx] > 64;

                if (isAccented && num !== 100) {
                    // Wrap note with accent symbol above the stem
                    return `<span style="position: relative; display: inline-block; padding-top: 12px;">
                                <span style="position: absolute; top: 0px; left: 50%; transform: translateX(-50%); font-size: 14px;">&#xE4A0;</span>
                                <span style="display: inline-block;">${noteSymbol}</span>
                            </span>`;
                }
                // Non-accented notes also need padding to align with accented ones
                return `<span style="display: inline-block; padding-top: 12px;">${noteSymbol}</span>`;
            }).join(' ');

            notation.innerHTML = notationHTML;

            // Play on click
            notation.onclick = () => {
                // Play the sound
                if (typeof tuci === 'function') {
                    const basi = [{
                        nimidi: variation.pattern.filter(n => n !== 100).map(() => 60),
                        tipis: variation.pattern.filter(n => n !== 100),
                        dinami: variation.dynamics.filter((_, i) => variation.pattern[i] !== 100),
                        chordi: false
                    }];
                    tuci(basi, 0);
                }

                // Update tarareo input with the generated tarareo
                const tarareoInputEl = document.getElementById('tarareo-input');
                if (tarareoInputEl && typeof patternToTarareo === 'function') {
                    // Split pattern by bar lines to get measures
                    const measures = [];
                    const dynamicsMeasures = [];
                    let currentMeasure = [];
                    let currentDynamics = [];

                    variation.pattern.forEach((code, idx) => {
                        if (code === 100) {
                            if (currentMeasure.length > 0) {
                                measures.push(currentMeasure);
                                dynamicsMeasures.push(currentDynamics);
                                currentMeasure = [];
                                currentDynamics = [];
                            }
                        } else {
                            currentMeasure.push(code);
                            currentDynamics.push(variation.dynamics[idx]);
                        }
                    });

                    // Don't forget the last measure
                    if (currentMeasure.length > 0) {
                        measures.push(currentMeasure);
                        dynamicsMeasures.push(currentDynamics);
                    }

                    // If no bar lines, treat as single measure
                    if (measures.length === 0 && variation.pattern.length > 0) {
                        measures.push(variation.pattern.filter(n => n !== 100));
                        dynamicsMeasures.push(variation.dynamics.filter((_, i) => variation.pattern[i] !== 100));
                    }

                    // Generate tarareo for each measure
                    const tarareos = measures.map((measure, idx) => {
                        return patternToTarareo(measure, dynamicsMeasures[idx]);
                    });

                    // Update input with comma-separated tarareos
                    tarareoInputEl.value = tarareos.join(', ');
                }
            };

            notation.onmouseenter = () => {
                notation.style.background = '#ffe0b2';
            };

            notation.onmouseleave = () => {
                notation.style.background = '#fff3e0';
            };

            // Accept button
            const acceptBtn = document.createElement('button');
            acceptBtn.textContent = 'Aceptar';
            acceptBtn.style.padding = '4px 12px';
            acceptBtn.style.fontSize = '11px';
            acceptBtn.style.fontFamily = 'sans-serif';
            acceptBtn.style.background = '#4CAF50';
            acceptBtn.style.color = 'white';
            acceptBtn.style.border = 'none';
            acceptBtn.style.borderRadius = '3px';
            acceptBtn.style.cursor = 'pointer';
            acceptBtn.style.position = 'relative';
            acceptBtn.style.zIndex = '10';

            acceptBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (typeof window.bdi.bar !== 'undefined' && typeof window.recordi === 'function') {
                    // Get the original tarareo input text
                    const tarareoInputEl = document.getElementById('tarareo-input');
                    const tarareoText = tarareoInputEl ? tarareoInputEl.value.trim() : '';

                    // Split tarareo text by commas to get individual measure texts
                    const tarareoSegments = tarareoText.split(',').map(s => s.trim());

                    // Split pattern by bar lines (code 100) to get individual measures
                    const measures = [];
                    const dynamicsMeasures = [];
                    let currentMeasure = [];
                    let currentDynamics = [];

                    variation.pattern.forEach((code, index) => {
                        if (code === 100) {
                            if (currentMeasure.length > 0) {
                                measures.push(currentMeasure);
                                dynamicsMeasures.push(currentDynamics);
                                currentMeasure = [];
                                currentDynamics = [];
                            }
                        } else {
                            currentMeasure.push(code);
                            currentDynamics.push(variation.dynamics[index]);
                        }
                    });

                    // Don't forget the last measure
                    if (currentMeasure.length > 0) {
                        measures.push(currentMeasure);
                        dynamicsMeasures.push(currentDynamics);
                    }

                    // If no bar lines were found, treat entire pattern as one measure
                    if (measures.length === 0) {
                        measures.push(variation.pattern.filter(n => n !== 100));
                        dynamicsMeasures.push(variation.dynamics.filter((_, i) => variation.pattern[i] !== 100));
                    }

                    // Create a separate BDI entry for each measure
                    const generatedTarareos = [];

                    // Parse color to RGB helper function (defined once, used in loop)
                    const parseColorToRGB = (colorString) => {
                        if (!colorString) return { r: 255, g: 0, b: 0 };
                        // Handle HSL
                        const hslMatch = colorString.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
                        if (hslMatch) {
                            const h = parseInt(hslMatch[1]) / 360;
                            const s = parseInt(hslMatch[2]) / 100;
                            const l = parseInt(hslMatch[3]) / 100;
                            let r, g, b;
                            if (s === 0) { r = g = b = l; } else {
                                const hue2rgb = (p, q, t) => {
                                    if (t < 0) t += 1; if (t > 1) t -= 1;
                                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                                    if (t < 1 / 2) return q;
                                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                                    return p;
                                };
                                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                                const p = 2 * l - q;
                                r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
                            }
                            return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
                        }
                        // Handle RGB
                        const rgbMatch = colorString.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
                        if (rgbMatch) { return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) }; }
                        // Handle Hex
                        if (colorString.startsWith('#')) {
                            const hex = colorString.slice(1);
                            if (hex.length === 6) {
                                return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
                            }
                        }
                        return { r: 255, g: 0, b: 0 };
                    };

                    // Get color ONCE from intervalReferenceChar for ALL measures
                    const refChar = (typeof window.intervalReferenceChar !== 'undefined') ? window.intervalReferenceChar : 'a';
                    const colorA = (typeof np6 !== 'undefined' && np6.noteColorMap && np6.noteColorMap[refChar])
                        ? np6.noteColorMap[refChar]
                        : 'hsl(0, 100%, 50%)'; // Default red if not found

                    const rgbA = parseColorToRGB(colorA);


                    // Get color name in Spanish ONCE for all measures
                    let colorName = "Tarareo";
                    try {
                        const colorInfo = await consulti(rgbA.r, rgbA.g, rgbA.b);
                        if (colorInfo && colorInfo.nombre) {
                            const translated = await traducirOnline(colorInfo.nombre);
                            colorName = translated;
                        }
                    } catch (err) {
                        console.log("Error fetching color name:", err);
                    }
                    // Get current voice selection
                    const voiceSelector = document.getElementById('voice-selector');
                    const selectedVoiceName = voiceSelector ? voiceSelector.value : 'soprano';

                    // CAMBIO: Usar la posición del cursor del Notepad para insertar en la posición correcta
                    const baseCursorIndex = (typeof np6 !== 'undefined' && np6.getCursorMeasureIndex)
                        ? np6.getCursorMeasureIndex()
                        : selectedMeasureIndex;

                    // Loop measures
                    for (let measureIndex = 0; measureIndex < measures.length; measureIndex++) {
                        const measurePattern = measures[measureIndex];
                        // Get dynamics for this measure
                        const measureDynamics = dynamicsMeasures[measureIndex] || [];

                        // Generate tarareo from pattern with dynamics
                        const generatedTarareo = patternToTarareo(measurePattern, measureDynamics);
                        generatedTarareos.push(generatedTarareo);

                        let calculatedTimis = [];
                        if (typeof restini === 'function') {
                            calculatedTimis = restini([measurePattern])[0];
                        } else {
                            calculatedTimis = measurePattern.map(elemento => {
                                if (elemento >= 10) {
                                    let decenas = Math.floor(elemento / 10);
                                    let unidades = elemento % 10;
                                    return (decenas - 1) * 10 + unidades;
                                } else if (elemento < 0) {
                                    return elemento - 1;
                                } else {
                                    return elemento - 1;
                                }
                            });
                        }

                        // Generate nimidi using selected tones or color 'A'
                        let nimidiArray = [];
                        let nimidiColorsArray = []; // Array to store colors for each note


                        // Check if user has selected tones from the palette
                        let midiNotes;
                        let sourceColors = []; // Array of [r,g,b,a] arrays corresponding to midiNotes 1-to-1

                        if (window.selectedTones && window.selectedTones.length > 0) {
                            // Use selected tones
                            midiNotes = window.getSelectedTonesMidi();
                            console.log('🎵 CRITICAL DEBUG: midiNotes from getSelectedTonesMidi =', midiNotes, 'length =', midiNotes ? midiNotes.length : 0);

                            // We need to reconstruct the colors that correspond to these notes
                            // getSelectedTonesMidi iterates the container and calls rgbToMidiInterval for each tone
                            // rgbToMidiInterval returns 3 notes [R, G, B] for each tone.
                            // So we need to do the same iteration to get the colors.
                            const container = document.getElementById('selected-tones-container');
                            if (container && container.children.length > 0) {
                                const toneSpans = Array.from(container.children);
                                toneSpans.forEach(span => {
                                    const bgColor = span.style.backgroundColor; // "rgb(r, g, b)"
                                    const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                                    if (rgbMatch) {
                                        const r = parseInt(rgbMatch[1]);
                                        const g = parseInt(rgbMatch[2]);
                                        const b = parseInt(rgbMatch[3]);
                                        const colorArr = [r, g, b, 255];
                                        // Store the source color once per tone
                                        sourceColors.push(colorArr);
                                    }
                                });
                            }
                        } else {
                            // Fallback to color A
                            midiNotes = typeof rgbToMidiInterval === 'function'
                                ? rgbToMidiInterval(rgbA.r, rgbA.g, rgbA.b, 60)
                                : [60];

                            // Store the single source color
                            const colorArr = [rgbA.r, rgbA.g, rgbA.b, 255];
                            sourceColors.push(colorArr);
                        }

                        // Generate MIDI notes for the pattern
                        // If we have more notes than MIDI notes, cycle through them
                        console.log('🔍 DEBUG: midiNotes =', midiNotes, 'length =', midiNotes.length);
                        console.log('🔍 DEBUG: measurePattern.length =', measurePattern.length);
                        for (let i = 0; i < measurePattern.length; i++) {
                            const midiValue = midiNotes[i % midiNotes.length];
                            console.log(`🔍 DEBUG: i=${i}, i%${midiNotes.length}=${i % midiNotes.length}, midiValue=${midiValue}`);
                            nimidiArray.push(midiValue);
                            // We do NOT fill nimidiColorsArray here anymore, 
                            // as we want to store the palette, not the per-note mapping.
                        }

                        // Assign source colors directly
                        nimidiColorsArray = sourceColors;

                        // Prepare color for storage
                        let hexColor = "#646464";
                        if (typeof colorToHex === 'function') {
                            hexColor = colorToHex(colorA);
                        } else {
                            // Fallback hex conversion
                            hexColor = "#" + ((1 << 24) + (rgbA.r << 16) + (rgbA.g << 8) + rgbA.b).toString(16).slice(1);
                        }

                        const newItem = {
                            "idi": Date.now() + measureIndex, // Unique ID for each measure
                            "numi": window.bdi.bar.length,
                            "nami": colorName + " " + (window.bdi.bar.length + 1),
                            "tarari": generatedTarareo,
                            "liri": "", // Add lyrics field (empty by default)
                            "coli": [rgbA.r, rgbA.g, rgbA.b, 255],
                            "hexi": hexColor,
                            "pinti": { "c": 0, "m": 0, "y": 0, "k": 0.6, "w": 0 },
                            "nimidi": nimidiArray,
                            "nimidiColors": nimidiColorsArray,
                            "timis": calculatedTimis,
                            "tipis": measurePattern,
                            "dinami": measureDynamics,
                            "chordi": false,
                            "voci": (() => {
                                // DEBUG: Check if voiceEditMode is accessible
                                console.log('🔍 CREATE MEASURE DEBUG:');
                                console.log('   → voiceEditMode =', typeof voiceEditMode !== 'undefined' ? voiceEditMode : 'UNDEFINED');
                                console.log('   → selectedVoiceName =', selectedVoiceName);

                                // Helper function to create voice data based on mode
                                const createVoiceData = (voiceName, voiceCode) => {
                                    // Check if this is the selected voice
                                    const isSelectedVoice = (
                                        (selectedVoiceName === 'soprano' && voiceCode === 's') ||
                                        (selectedVoiceName === 'contralto' && voiceCode === 'a') ||
                                        (selectedVoiceName === 'tenor' && voiceCode === 't') ||
                                        (selectedVoiceName === 'bajo' && voiceCode === 'b')
                                    );

                                    // In INDEPENDENT mode, only selected voice gets content
                                    if (voiceEditMode === 'independent' && !isSelectedVoice) {
                                        // Create silence for non-selected voices
                                        return {
                                            "nami": voiceCode,
                                            "nimidi": measurePattern.map(() => 0),
                                            "timis": [...calculatedTimis],
                                            "tipis": measurePattern.map(t => -Math.abs(t)),  // NEGATIVE for silence
                                            "dinami": [...measureDynamics],
                                            "nimidiColors": measurePattern.map(() => [128, 128, 128, 255]),
                                            "tarari": ""
                                        };
                                    }

                                    // In DEPENDENT mode OR selected voice in INDEPENDENT mode
                                    return {
                                        "nami": voiceCode,
                                        "nimidi": (window.selectedTones && window.selectedTones.length > 0)
                                            ? (isSelectedVoice ? [...nimidiArray] : measurePattern.map((_, idx) => midiNotes[idx % midiNotes.length]))
                                            : measurePattern.map((_, idx) => {
                                                const notes = rgbToMidiInterval(rgbA.r, rgbA.g, rgbA.b, 60, voiceName);
                                                return notes[idx % notes.length];
                                            }),
                                        "timis": [...calculatedTimis],
                                        "tipis": [...measurePattern],
                                        "dinami": [...measureDynamics],
                                        "nimidiColors": [...nimidiColorsArray],
                                        "tarari": generatedTarareo
                                    };
                                };

                                // Create all 4 voices
                                return [
                                    createVoiceData('soprano', 's'),
                                    createVoiceData('contralto', 'a'),
                                    createVoiceData('tenor', 't'),
                                    createVoiceData('bajo', 'b')
                                ];
                            })()
                        };
                        console.log("🎵 Created newItem:");
                        console.log("   -> nimidi:", JSON.stringify(newItem.nimidi));
                        console.log("   -> nimidiColors:", JSON.stringify(newItem.nimidiColors));

                        // Save state before adding new measure
                        saveBdiState();

                        const cursorMeasureIndex = baseCursorIndex + measureIndex;

                        console.log(`📍 Inserting measure at cursor position: ${cursorMeasureIndex}`);

                        //-->window.bdi.push(newItem);
                        window.bdi.bar.splice(cursorMeasureIndex, 0, newItem);

                        // Visual update is handled by applyTextLayer() below, so we don't need manual insertion here
                        // if (typeof np6 !== 'undefined' && np6.insertMeasureAtCursor) {
                        //     np6.insertMeasureAtCursor(generatedTarareo, hexColor);
                        // }

                        // Rebuild all MIDI tracks to ensure correct order
                        rebuildRecordi();
                    }

                    // Update BDI display textarea
                    updateBdiDisplay();

                    // Update Ritmo Textarea (text-layer-6)
                    const ritmoTextarea = document.getElementById('text-layer-6');
                    if (ritmoTextarea) {
                        // Add separator if not empty and not ending with separator
                        let currentVal = ritmoTextarea.value.trim();
                        if (currentVal.length > 0 && !currentVal.endsWith('|')) {
                            ritmoTextarea.value += ' | ';
                        }
                        // Join all generated measure patterns
                        const allTipis = measures.map(m => m.join(' ')).join(' | ');
                        ritmoTextarea.value += allTipis;

                        // Trigger input event to sync if needed
                        ritmoTextarea.dispatchEvent(new Event('input'));
                    }

                    // Update Notepad and Player to show the new tarareos from bdi
                    if (typeof updateAfterBdiChange === 'function') {
                        updateAfterBdiChange();

                        // Restore and advance cursor
                        if (typeof np6 !== 'undefined') {
                            np6.cursorPos = baseCursorIndex + measures.length;
                            np6._render();
                            if (typeof np6.focus === 'function') np6.focus();
                            if (typeof np6.scrollToCursor === 'function') np6.scrollToCursor();
                        }
                    }

                    acceptBtn.textContent = '✓';
                    acceptBtn.style.background = '#45a049';
                    setTimeout(() => {
                        acceptBtn.textContent = 'Aceptar';
                        acceptBtn.style.background = '#4CAF50';
                    }, 1000);
                }
            };

            optionDiv.appendChild(label);
            optionDiv.appendChild(notation);
            optionDiv.appendChild(acceptBtn);
            notationDisplay.appendChild(optionDiv);
        });
    }
}

// Event listeners for tarareo input
const tarareoInput = document.getElementById('tarareo-input');
if (tarareoInput) {
    tarareoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            tarareoAritmo();
        }
    });

    // Also trigger on blur?
    tarareoInput.addEventListener('blur', () => {
        tarareoAritmo();
    });

    // Auto-open Rhythm Editor on focus
    tarareoInput.addEventListener('focus', () => {
        if (typeof setMode === 'function') {
            // Only set mode if not already in text mode to avoid resetting cursor/view
            if (typeof editMode === 'undefined' || editMode !== 'text') {
                setMode('text');
            }
        }
    });
}

// Event listener for tarareo submit button
const tarareoSubmit = document.getElementById('tarareo-submit');
if (tarareoSubmit) {
    tarareoSubmit.addEventListener('click', () => {
        tarareoAritmo();
    });
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function tomidi(colorValue, minMidi = 48, maxOctavas = 3, inputRange = 255) {
    // Definir las escalas musicales (intervalos en semitonos desde la tónica)


    // Obtener la escala actual basada en scali
    const escalaActual = escalasNotas[escalas[scali]] || escalasNotas.mayor;

    // Normalizar el valor de entrada (0-255 o 0-100) a un rango 0-1
    const valorNormalizado = colorValue / inputRange;

    // Calcular cuántas notas caben en el rango deseado
    const notasTotales = escalaActual.length * maxOctavas;

    // Mapear el valor normalizado al índice de nota
    const indice = Math.floor(valorNormalizado * notasTotales);
    const indiceSeguro = Math.min(indice, notasTotales - 1);

    // Calcular octava y nota dentro de la escala
    const octava = Math.floor(indiceSeguro / escalaActual.length);
    const notaEnEscala = indiceSeguro % escalaActual.length;

    // Calcular el MIDI final
    const midi = minMidi + (octava * 12) + escalaActual[notaEnEscala];

    // Limitar al rango máximo
    const midiMax = minMidi + (maxOctavas * 12) + 11;
    const midiResultado = Math.min(midi, midiMax);

    // Log para debugging (opcional, puedes comentarlo después)
    console.log(`tomidi: color=${colorValue}, escala=${escalas[scali]}, midi=${midiResultado}`);

    return midiResultado;
}

// Convertir RGB a MIDI usando intervalos basados en componentes individuales
// Devuelve un array de 3 notas MIDI [R, G, B]
// Convertir RGB a MIDI usando intervalos basados en componentes individuales
// Devuelve un array de 3 notas MIDI [R, G, B]
function rgbToMidiInterval(r, g, b, notaBase = 36, voiceOverride = null) {
    const voiceSelector = document.getElementById('voice-selector');
    let voice = voiceOverride || (voiceSelector ? voiceSelector.value : 'soprano');

    // Rangos específicos por voz
    const voiceRanges = {
        soprano: { min: 60, max: 81, base: 60 },
        contralto: { min: 53, max: 72, base: 53 },
        tenor: { min: 48, max: 67, base: 48 },
        bajo: { min: 40, max: 60, base: 40 },
        todos: { min: 36, max: 84, base: 36 }
    };

    const range = voiceRanges[voice] || voiceRanges.soprano;



    const escalaActual = escalasNotas[escalas[scali]] || escalasNotas.mayor;
    const keyOffset = keyinselecti;

    // Precalcular todas las notas disponibles en el rango para esta escala
    const notasDisponibles = [];
    for (let nota = range.min; nota <= range.max; nota++) {
        // Verificar si la nota (ajustada por keyOffset) está en la escala
        const semitonoRelativo = (nota - keyOffset) % 12;
        const semitonoPositivo = semitonoRelativo < 0 ? semitonoRelativo + 12 : semitonoRelativo;

        if (escalaActual.includes(semitonoPositivo)) {
            notasDisponibles.push(nota);
        }
    }

    // Si no hay notas, usar la base
    if (notasDisponibles.length === 0) {
        console.warn(`No hay notas de la escala en el rango ${range.min}-${range.max}`);
        return [range.base, range.base, range.base];
    }

    // Función de mapeo usando la lista precalculada
    const mapComponentToMidi = (val, offset = 0) => {
        // MUSICOLI FIX: Align with midiToRgb range [50, 255]
        // normalized = (val - 50) / (255 - 50)
        let normalized = (val - 50) / 205;
        const valorNormalizado = Math.min(1, Math.max(0, normalized + offset * 0.01));
        const indice = Math.floor(valorNormalizado * notasDisponibles.length);
        const indiceSeguro = Math.min(indice, notasDisponibles.length - 1);
        return notasDisponibles[indiceSeguro];
    };

    // MUSICOLI: Check if this is a monochromatic color (R=G=B)
    // If so, return the same note 3 times instead of using offsets
    const isMonochromatic = (r === g && g === b);

    // Generar notas con pequeños offsets para variedad (solo si NO es monocromático)
    const result = isMonochromatic ? [
        mapComponentToMidi(r, 0),
        mapComponentToMidi(r, 0),
        mapComponentToMidi(r, 0)
    ] : [
        mapComponentToMidi(r, 0),
        mapComponentToMidi(g, 1),
        mapComponentToMidi(b, 2)
    ];

    if (isMonochromatic) {
        console.log(`🎨 MONOCHROMATIC: RGB(${r},${g},${b}) → MIDI[${result}] (same note repeated)`);
    }
    //console.log(`${voice}: RGB(${r},${g},${b}) → [${result}] (${notasDisponibles.length} notas disponibles)`);
    return result;
}


function rgbToMidiInterval02(r, g, b, notaBase = 36) {
    // Obtener tesitura seleccionada
    const voiceSelector = document.getElementById('voice-selector');
    const voice = voiceSelector ? voiceSelector.value : 'soprano';

    // Ajustar nota base según tesitura (aproximaciones MIDI)
    let base = notaBase;
    switch (voice) {
        case 'soprano': base = 60; break;
        case 'contralto': base = 53; break;
        case 'tenor': base = 48; break;
        case 'bajo': base = 40; break;
        case 'todos': base = 36; break;
        default: base = 60;
    }

    const escalaActual = escalasNotas[escalas[scali]] || escalasNotas.mayor;
    const keyOffset = keyinselecti;

    // Función auxiliar para mapear componente a nota MIDI
    const mapComponentToMidi = (val) => {
        const valorNormalizado = val / 255;
        // Ajustamos el rango de octavas según la voz para no salirnos demasiado
        // Aumentamos a 3 octavas para dar más resolución y evitar colisiones
        const octavasACubrir = (voice === 'todos') ? 5 : 3;
        const pasosEscala = escalaActual.length * octavasACubrir;

        const indiceEscala = Math.floor(valorNormalizado * pasosEscala);
        const indiceSeguro = Math.min(indiceEscala, pasosEscala - 1);

        const octava = Math.floor(indiceSeguro / escalaActual.length);
        const notaEnEscala = indiceSeguro % escalaActual.length;

        const intervaloSemitonos = (octava * 12) + escalaActual[notaEnEscala] + keyOffset;
        return Math.max(0, Math.min(127, base + intervaloSemitonos));
    };

    // Devolver array con las 3 notas correspondientes a R, G, B
    const result = [mapComponentToMidi(r), mapComponentToMidi(g), mapComponentToMidi(b)];
    console.log(`rgbToMidiInterval (${voice}): RGB(${r},${g},${b}) -> MIDI[${result}]`);
    return result;
}
// Helper function to get MIDI notes from selected tones
function getSelectedTonesMidi() {
    const container = document.getElementById('selected-tones-container');
    if (!container || container.children.length === 0) {
        return [];
    }

    const midiNotes = [];
    // Process in visual order (Left to Right)
    // The container has the newest added item at the beginning (prepend), 
    // but visually we read left-to-right. 
    // If the user added Red then Blue, Blue is first in DOM.
    // Let's assume the user wants the order they see: Left -> Right.

    const toneSpans = Array.from(container.children);

    toneSpans.forEach((span, index) => {
        const bgColor = span.style.backgroundColor; // "rgb(r, g, b)"

        // Parse RGB from style string
        const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);

            console.log(`Processing DOM Tone ${index}: RGB(${r}, ${g}, ${b})`);

            let midiArray;

            // Check if this is a chromatic color with stored MIDI values
            if (span.dataset.midiValues) {
                try {
                    midiArray = JSON.parse(span.dataset.midiValues);
                    console.log(`🎹 Using stored MIDI values for span ${index}: [${midiArray}] (length: ${midiArray.length})`);
                } catch (e) {
                    console.warn('Failed to parse stored MIDI values, falling back to rgbToMidiInterval');
                    midiArray = rgbToMidiInterval(r, g, b);
                    console.log(`🎹 Fallback RGB->MIDI for span ${index}: [${midiArray}] (length: ${midiArray.length})`);
                }
            } else {
                // Convert RGB to MIDI interval (returns array of 3 notes: R, G, B)
                midiArray = rgbToMidiInterval(r, g, b);
                console.log(`🎹 RGB->MIDI for span ${index}: [${midiArray}] (length: ${midiArray.length})`);
            }

            // Add all notes from this color
            console.log(`🎹 Adding ${midiArray.length} notes to midiNotes array`);
            midiNotes.push(...midiArray);
        }
    });

    console.log('🎵 Selected tones converted to MIDI (from DOM):', midiNotes);
    return midiNotes;
}

// Make it globally accessible for use when creating bdi entries
window.getSelectedTonesMidi = getSelectedTonesMidi;


// Caches to prevent API flooding
const translationCache = new Map();
const colorApiCache = new Map();

// Translate text from English to Spanish using Google Translate API
async function traducirOnline(text) {
    if (translationCache.has(text)) {
        return translationCache.get(text);
    }

    // Codificamos el texto para la URL (ej. "Dark Olive Green" -> "Dark%20Olive%20Green")
    const encodedText = encodeURIComponent(text);
    // URL del servicio de traducción (inglés 'en' a español 'es')
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodedText}`;

    try {
        const response = await fetch(translateUrl);
        const data = await response.json();

        // El resultado de la traducción está típicamente en data[0][0][0]
        // Ejemplo: [['Verde oliva oscuro'], 'Dark Olive Green', null, null, 1, null, [['Dark Olive Green']]]
        if (data && data[0] && data[0][0] && data[0][0][0]) {
            const result = data[0][0][0];
            translationCache.set(text, result);
            return result;
        }
        return text; // Devolver el original si la traducción falla
    } catch (error) {
        console.error("Error al intentar traducir online:", error);
        return text; // Devolver el original si hay un error de red o parsing
    }
}

// Fetch color name from thecolorapi
// Fetch color name from thecolorapi
async function consulti(r, g, b) {
    const key = `${r},${g},${b}`;
    if (colorApiCache.has(key)) {
        return colorApiCache.get(key);
    }

    const url = `https://www.thecolorapi.com/id?rgb=rgb(${r},${g},${b})`;
    try {
        const response = await fetch(url);

        // Check if response is OK
        if (!response.ok) {
            console.warn(`⚠️ TheColorAPI returned status ${response.status}`);
            return null;
        }

        // Check Content-Type (avoid parsing HTML as JSON)
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            console.warn(`⚠️ TheColorAPI returned non-JSON content: ${contentType}`);
            // Reset cache for this key so we can try again later? Or cache null to avoid spamming?
            // Let's return null without caching to allow retry
            return null;
        }

        const data = await response.json();
        const result = {
            nombre: data.name.value,
            imagen: data.image.bare
        };
        colorApiCache.set(key, result);
        return result;
    } catch (error) {
        console.error("Error al consultar la API de color:", error);
        return null; // Handle error gracefully
    }
}


// Convert RGB to CMYKW
function rgbToCMYKW(r, g, b, blackIntensity = 1, whiteThreshold = 0.8) {
    // Normalizar valores RGB
    let r0 = r / 255;
    let g0 = g / 255;
    let b0 = b / 255;

    // Calcular componentes CMY
    let c = 1 - r0;
    let m = 1 - g0;
    let y = 1 - b0;

    // Calcular el negro (K)
    let k = Math.min(c, m, y);

    // Ajustar la intensidad del negro con la variable blackIntensity
    let darkness = 1 - Math.max(r0, g0, b0);
    let kFactor = Math.pow(darkness, 1.5);
    k = k * kFactor * blackIntensity;

    // Ajustar los componentes CMY restando K
    let denominator = (1 - k) || 1;
    let kReduction = 0.3 + (0.4 * (1 - blackIntensity)); // Ajusta reducción basado en blackIntensity
    c = (c - k * kReduction) / denominator;
    m = (m - k * kReduction) / denominator;
    y = (y - k * kReduction) / denominator;

    // Calcular blanco (W) usando whiteThreshold
    let brightness = Math.max(r0, g0, b0);
    let saturation = 1 - Math.min(r0, g0, b0) / (brightness || 1);
    let whiti = 1 - whiteThreshold;
    let w = 0;
    if (brightness > whiti && saturation < 0.7) {
        w = (brightness - whiti) * 0.8;
    }

    // Asegurar que los valores estén en el rango correcto
    c = Math.max(0, Math.min(1, c));
    m = Math.max(0, Math.min(1, m));
    y = Math.max(0, Math.min(1, y));
    k = Math.max(0, Math.min(1, k));
    w = Math.max(0, Math.min(1, w));

    return {
        c: parseFloat(c.toFixed(3)),
        m: parseFloat(m.toFixed(3)),
        y: parseFloat(y.toFixed(3)),
        k: parseFloat(k.toFixed(3)),
        w: parseFloat(w.toFixed(3))
    };
}

// Global Notepad instance
var np6;
window.np6 = null; // Explicitly ensure it's on window

// MUSICOLI: Initialize applyTextLayer stub early so it's available before DOMContentLoaded
// This will be replaced with the actual function inside DOMContentLoaded
window.applyTextLayer = function () {
    console.warn('⚠️ applyTextLayer called before DOMContentLoaded - function not ready yet');
};
console.log('🔧 [EARLY INIT] window.applyTextLayer stub created');

document.addEventListener('DOMContentLoaded', () => {
    const rainbowColorMap = assignRainbowColors(alfabeto);
    console.log('✅ TRACE: rainbowColorMap created with', Object.keys(rainbowColorMap).length, 'keys');
    const rainbowSequence = generateRainbowColors(50);
    const randomColorMap = assignRandomColors(alfabeto);
    console.log('✅ TRACE: randomColorMap created with', Object.keys(randomColorMap).length, 'keys');
    const rainbowCycle10 = generateRainbowColors(10);
    let rainbowIndex = 0;


    console.log('🚀 Initializing Notepad (np6)...');
    try {
        np6 = new Notepad({
            parent: document.getElementById('notepi6'),
            fontSize: 14, // Reduced size
            noteColorMap: rainbowColorMap, // Use rainbow colors instead of random
            containerPadding: '0',
            width: 'auto',
            height: 53
        });
        window.np6 = np6;
        console.log('✅ Notepad initialized. Map has flavors?', Object.keys(np6.noteColorMap).some(k => k.endsWith('_flavors')));
    } catch (e) {
        console.error('❌ Failed to initialize Notepad:', e);
    }
    np6.setLetterPadding(4, 8); // Reduced padding
    np6.setLetterBorderRadius(4); // Smaller radius
    np6.setLetterMargin(0); // Add spacing between spans
    np6.setContainerBackground('linear-gradient(to right, #e0e0e0, #a0a0a0)');
    np6.setBorder(0, null, null);

    // MUSICOLI: Force horizontal scrolling layout
    if (np6.container) {
        np6.container.style.whiteSpace = 'nowrap';
        np6.container.style.display = 'flex';
        np6.container.style.flexDirection = 'row';
        np6.container.style.flexWrap = 'nowrap';
        np6.container.style.alignItems = 'stretch';
        np6.container.style.overflowY = 'hidden';
    }


    // Don't insert text here - applyColorLayer will set it with proper colors
    // np6.insertText("ABBCD DDDAAADA");

    // Add click listener to Notepad container to pick color
    // Wait a bit for np6 to be fully initialized
    // GLOBAL POINTERDOWN LISTENER (Delegated)
    // We use 'pointerdown' because Notepad calls e.preventDefault() on pointerdown,
    // which prevents 'click' events from firing.
    // Listen to note clicks (Event emitted by Notepad even in non-editable mode)
    np6.on('noteClick', (e) => {

        const { index, text, color, node, originalEvent } = e;
        console.log('🎵 Notepad noteClick:', index, text, color);

        // Update selected measure based on clicked span
        // Since applyTextLayer creates one span per measure, index corresponds directly to measure index
        if (isValidMeasureIndex(index)) {
            selectedMeasureIndex = index;
            console.log('📍 Selected measure for deletion:', selectedMeasureIndex, 'based on notepad span index:', index);

            // Synchronize notepad cursor to match selected measure
            if (typeof np6 !== 'undefined' && np6.cursorPos !== index) {
                np6.cursorPos = index;
                np6._render();
                console.log('🔄 Synchronized cursor to position:', index);
            }

            // Show alert with selected measure number
            //alert(`Compás seleccionado: ${index + 1}`);

            // Debug: Check originalEvent
            console.log('🔍 Debug - originalEvent:', originalEvent);
            if (originalEvent) {
                console.log('🔍 Debug - shiftKey:', originalEvent.shiftKey);
            }

            // Double click or Shift+Click detection
            const clickTime = new Date().getTime();
            const isDouble = (window.lastNoteClickTime && (clickTime - window.lastNoteClickTime < 300));
            window.lastNoteClickTime = clickTime;

            if ((originalEvent && originalEvent.shiftKey) || isDouble) {
                console.log('🎹 Double click or Shift+Click detected, opening MIDI editor');
                if (typeof window.openMidiEditor === 'function') {
                    window.openMidiEditor(index);
                } else {
                    console.error('❌ openMidiEditor function not found');
                }
            } else {
                console.log('ℹ️ Normal click. Double click or Hold Shift key to open MIDI editor.');
            }
        }
        document.getElementById('cursorPos').innerHTML = np6.getCursorPos();

        // 1. Update Rhythm Editor Input (Tarareo)
        const tarareoInput = document.getElementById('tarareo-input');
        if (tarareoInput) {
            // Fix: Retrieve original tarareo from BDI instead of getting all the span text (which now includes notes/time)
            let cleanTarareo = text;
            if (typeof window.bdi.bar !== 'undefined' && window.bdi.bar[index]) {
                cleanTarareo = window.bdi.bar[index].tarari || '';
            } else {
                // Fallback: cleaning new lines if BDI lookup fails for some reason
                if (text.includes('\n')) {
                    cleanTarareo = text.split('\n')[0];
                }
            }

            tarareoInput.value = cleanTarareo;
            // Trigger input event if needed for other listeners
            tarareoInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // 2. Update Color Selection
        const container = document.getElementById('selected-tones-container');
        // Find color input - it might be inside rhythmColorInfo OR editor-ritmo
        const colorInput = document.querySelector('#rhythm-color-info-div input[type="color"]') ||
            document.querySelector('#editor-ritmo input[type="color"]');

        if (color && (container || colorInput)) {
            let hexColor = '#000000';
            // Robust color conversion
            if (color.startsWith('#')) {
                hexColor = color;
            } else if (color.startsWith('rgb')) {
                const rgb = color.match(/\d+/g);
                if (rgb && rgb.length >= 3) {
                    hexColor = "#" + ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1);
                }
            } else if (typeof colorToHex === 'function') {
                hexColor = colorToHex(color);
            }

            if (colorInput) {
                console.log(`🎨 Updating rhythm color input to ${hexColor}`);
                colorInput.value = hexColor;
            }

            // 3. User Request: "poner el color del span el primero de la lista de colores seccionados"
            if (container) {
                if (!window.selectedTones) window.selectedTones = [];

                // Check if already in list
                const idx = window.selectedTones.findIndex(t => t.hex === hexColor);

                // Remove if exists (to move to front)
                if (idx > -1) {
                    window.selectedTones.splice(idx, 1);
                }

                // Add to state at front
                // We need basic r,g,b for storage if not calculated above
                let r = 0, g = 0, b = 0;
                if (color.startsWith('rgb')) {
                    const m = color.match(/\d+/g);
                    if (m) { r = +m[0]; g = +m[1]; b = +m[2]; }
                } else {
                    // Inline hex to RGB conversion since hexToRgb might be undefined
                    const bigint = parseInt(hexColor.slice(1), 16);
                    r = (bigint >> 16) & 255;
                    g = (bigint >> 8) & 255;
                    b = bigint & 255;
                }
                window.selectedTones.unshift({ hex: hexColor, rgb: { r, g, b } });


                // Update UI: check if span exists and count repetitions
                const spans = Array.from(container.children);
                // Check against both original color string and hex
                const refinedColor = color || hexColor;

                // Count how many times this specific color appears in the container
                const colorCount = spans.filter(s => {
                    // Simplify comparison by removing spaces
                    const sColor = s.style.backgroundColor.replace(/\s/g, '');
                    const tColor = refinedColor.replace(/\s/g, '');
                    const hColor = hexColor.replace(/\s/g, ''); // Hex usually doesn't have spaces but consistent
                    return sColor === tColor || sColor === hColor ||
                        (sColor.startsWith('rgb') && tColor.startsWith('rgb') && sColor === tColor);
                }).length;

                // Allow up to 6 repetitions of the same color
                const MAX_REPETITIONS = 6;
                if (colorCount < MAX_REPETITIONS) {
                    const existingSpan = spans.find(s => {
                        // Simplify comparison by removing spaces
                        const sColor = s.style.backgroundColor.replace(/\s/g, '');
                        const tColor = refinedColor.replace(/\s/g, '');
                        const hColor = hexColor.replace(/\s/g, ''); // Hex usually doesn't have spaces but consistent
                        return sColor === tColor || sColor === hColor ||
                            (sColor.startsWith('rgb') && tColor.startsWith('rgb') && sColor === tColor);
                    });

                    if (existingSpan) {
                        // Move existing span to top
                        container.insertBefore(existingSpan, container.firstChild);
                        console.log('🔄 Moved existing tone to front:', hexColor);
                    } else {
                        // Limit to 8 spans total - remove the last (oldest) one if limit reached
                        const MAX_TONES = 8;
                        if (container.children.length >= MAX_TONES) {
                            const lastSpan = container.lastElementChild;
                            if (lastSpan) {
                                // Get the color of the last span to remove from state
                                const lastBgColor = lastSpan.style.backgroundColor;
                                const rgbMatch = lastBgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                                if (rgbMatch) {
                                    const r = parseInt(rgbMatch[1]);
                                    const g = parseInt(rgbMatch[2]);
                                    const b = parseInt(rgbMatch[3]);
                                    const lastHex = '#' +
                                        r.toString(16).padStart(2, '0') +
                                        g.toString(16).padStart(2, '0') +
                                        b.toString(16).padStart(2, '0');

                                    // Remove from global state
                                    const lastIdx = window.selectedTones.findIndex(t => t.hex === lastHex);
                                    if (lastIdx > -1) {
                                        window.selectedTones.splice(lastIdx, 1);
                                    }
                                }
                                lastSpan.remove();
                                console.log('🗑️ Removed oldest tone (limit reached):', lastBgColor);
                            }
                        }

                        // Create and add new span
                        const toneSpan = document.createElement('span');
                        toneSpan.style.width = '25px';
                        toneSpan.style.height = '25px';
                        toneSpan.style.display = 'inline-block';
                        toneSpan.style.marginRight = '0px';
                        toneSpan.style.cursor = 'pointer';
                        toneSpan.style.backgroundColor = color; // Use original color if possible for consistency
                        toneSpan.style.border = 'none';

                        // Calculate MIDI info for tooltip if possible
                        if (typeof rgbToMidiInterval === 'function') {
                            const midiNotes = rgbToMidiInterval(r, g, b);
                            toneSpan.title = `RGB: (${r}, ${g}, ${b})\nMIDI: [${midiNotes.join(', ')}]`;
                        }

                        // Event listeners for the new span (similar to makeladi ones)
                        toneSpan.addEventListener('click', () => {
                            container.insertBefore(toneSpan, container.firstChild);
                            // Update global state: move to front
                            const idx = window.selectedTones.findIndex(t => t.hex === hexColor);
                            if (idx > -1) {
                                const tone = window.selectedTones.splice(idx, 1)[0];
                                window.selectedTones.unshift(tone);
                            }
                            if (typeof window.updateRhythmColorPreview === 'function') window.updateRhythmColorPreview();
                        });

                        toneSpan.addEventListener('dblclick', () => {
                            toneSpan.remove();
                            const idx = window.selectedTones.findIndex(t => t.hex === hexColor);
                            if (idx > -1) {
                                window.selectedTones.splice(idx, 1);
                            }
                            if (typeof window.updateRhythmColorPreview === 'function') window.updateRhythmColorPreview();
                        });


                        container.insertBefore(toneSpan, container.firstChild);
                        console.log('✅ Added tone to selection (at beginning):', hexColor);
                    }

                    // Update preview if function exists
                    if (typeof window.updateRhythmColorPreview === 'function') {
                        window.updateRhythmColorPreview();
                    }
                } else {
                    console.log(`ℹ️ Tone already selected ${colorCount} times (max ${MAX_REPETITIONS}):`, hexColor);
                }
            }
        }
    });

    // Listen to changes to sync visual tracks
    np6.on('change', () => {
        // Debounce slightly or just delay to let DOM settle
        setTimeout(renderVisualTracks, 50);
    });


    initraki(tempi, 4)

    // Initialize divi to notepad container
    divi = document.getElementById("notepi6");

    var playi = document.getElementById("player15");
    playi.src = ''
    for (let s = 0; s < bdi.bar.length; s++) {
        recordi(bdi.bar, s)
    }

    // Initialize history with initial state
    saveBdiState();

    // Initialize tonalidad ladder with default color and chromatic semitones
    makeladi('#ff0000'); // Default red color
    //updateChromaticSemitones();



    //////////////////////////////////////
    // FOR SOUNDFONT-PLAYER.JS
    //////////////////////////////////////
    function dobli(dato) {
        if (Number.isInteger(dato)) {
            if (dato >= 10 && dato <= 99) {
                const deci = parseInt(Math.floor(dato / 10));
                return duris45[deci]
            }
            if (dato >= 0 && dato <= 9) {
                return duris4[dato] || duris4[0];
            }
        }
        return duris4[dato] || duris4[0];
    }

    function tuci(basi, nc) {
        //alert(basi, nc)
        let contini = 0;
        if (nc > basi.length - 1) { return }
        let tiempos = basi[nc].tipis
        let acumulado = 0;
        let noteIndex = 0;
        console.log('TIPIS', tiempos)
        console.log('NIMIDI', basi[nc].nimidi)
        for (let a = 0; a < tiempos.length; a++) {
            if (newInsti) {
                // Handle rests (negative numbers)
                // Ignore bar line code (100)
                if (Math.abs(tiempos[a]) === 100) {
                    // Just skip it, don't increment accumulated time or note index?
                    // Actually, bar lines have 0 duration in playback context.
                    continue;
                }

                let isRest = tiempos[a] < 0;
                let durationCode = Math.abs(tiempos[a]);

                let ti = dobli(durationCode);

                // Get dynamics value (default to 110 if not present)
                let dynamicValue = 110;
                if (basi[nc].dinami && basi[nc].dinami[contini] !== undefined) {
                    dynamicValue = basi[nc].dinami[contini];
                }
                let gi = (dynamicValue / 127) * 7; // Boost volume massively (10x gain)

                if (!isRest) {
                    setTimeout(function () {
                        //if(ti>9){ti=int()}
                        // Fix for crash when tipis > nimidi: use modulo to cycle through available notes
                        let midiNoteToPlay = basi[nc].nimidi[contini % basi[nc].nimidi.length];

                        if (midiNoteToPlay !== undefined) {
                            newInsti
                                .play(midiNoteToPlay, ac.currentTime, { gain: gi })
                                .stop(ac.currentTime + ti * 4);
                        }
                        contini++;
                        noteIndex++
                    }, acumulado * 1000);
                } else {
                    // For rests, we just increment acumulado, but we might need to increment contini/noteIndex 
                    // if there are corresponding notes in nimidi? 
                    // Usually rests don't have pitch. 
                    // But basi structure might have dummy pitches for rests?
                    // If generated from tarareo, nimidi is just 60s.
                    // Let's assume we skip pitch index for rests too? 
                    // Or does nimidi match 1:1 with tipis? Yes.
                    // So we should increment contini/noteIndex even for rests to keep sync?
                    // If we don't play, we don't use nimidi[contini].
                    // But we should probably increment to stay aligned if nimidi has same length.
                    setTimeout(function () {
                        contini++;
                        noteIndex++;
                    }, acumulado * 1000);
                }

                if (basi[nc].chordi) { acumulado = 0 } else {
                    acumulado += ti;
                }
            }
        }
    }

    function initiwi(bpm) {
        let metrai = [4000, 2000, 1000, 500, 250, 125];
        let negraDuracion = 60000 / bpm;
        let baseNegra = 1000;
        let factorEscala = negraDuracion / baseNegra;
        return metrai.map((m) => m * factorEscala);
    }
    //////////////////////////////////////
    // FOR MIDIWRITER.JS
    //////////////////////////////////////
    function dobli5(dato) {
        let absDato = Math.abs(dato);
        if (Number.isInteger(absDato)) {
            if (absDato >= 10 && absDato <= 99) {
                const deci = parseInt(Math.floor(absDato / 10));
                // Fix shift: use deci - 1
                return durai5[deci - 1] || durai5[0];
            }
            if (absDato >= 0 && absDato <= 9) {
                // Fix shift: use absDato - 1
                if (absDato === 0) return durai[0];
                return durai[absDato - 1] || durai[0];
            }
        }
        return durai[0];
    }

    function recordi(basi, nc) {
        //traki
        let item = basi[nc];
        const metadata = bdi.metadata;

        const processVoice = (voiceData, trackIndex, voiceKey) => {
            let dati = [];
            // REMOVED: trackIndex = 0 override to allow multi-track writing
            const voiceMeta = metadata && metadata.voices ? metadata.voices[voiceKey] : null;
            const instrument = voiceMeta ? voiceMeta.instrument : 1;
            const isPercussion = voiceMeta ? voiceMeta.percussion : false;

            // Volume scaling (0-127, default 100)
            const trackVol = (voiceMeta && typeof voiceMeta.volume !== 'undefined') ? voiceMeta.volume : 100;
            const volFactor = trackVol / 127;

            if (voiceData.chordi) {
                dati[1] = [];
                dati[2] = [1];
                dati[0] = instrument;
                dati[3] = false;
                let baseVel = (voiceData.dinami && voiceData.dinami[0] !== undefined) ? voiceData.dinami[0] : 64;
                dati[4] = Math.round(baseVel * volFactor);
                dati[5] = 0;
                dati[6] = isPercussion ? 'p' : '1';
                for (let u = 0; u < voiceData.nimidi.length; u++) {
                    dati[1].push(voiceData.nimidi[u]);
                }
                addi(dati, trackIndex);
            } else {
                let pendingWaits = [];
                for (var a = 0; a < voiceData.nimidi.length; a++) {
                    let duration = dobli5(voiceData.tipis[a]);

                    if (voiceData.tipis[a] < 0) {
                        pendingWaits.push(duration);
                    } else {
                        dati[0] = instrument;
                        dati[1] = voiceData.nimidi[a];
                        dati[2] = [duration];
                        dati[3] = false;
                        let baseVel = (voiceData.dinami && voiceData.dinami[a] !== undefined) ? voiceData.dinami[a] : 64;
                        dati[4] = Math.round(baseVel * volFactor);

                        if (pendingWaits.length > 0) {
                            dati[5] = [...pendingWaits];
                            pendingWaits = [];
                        } else {
                            dati[5] = 0;
                        }

                        dati[6] = isPercussion ? 'p' : '1';
                        addi(dati, trackIndex);
                    }
                }

                // Handle trailing rests at the end of the measure
                // Fix: '0' duration might be invalid. Use the last rest as duration.
                if (pendingWaits.length > 0) {
                    const lastDuration = pendingWaits.pop(); // Take the last wait as the note duration

                    dati[0] = instrument;
                    dati[1] = 0; // Dummy pitch
                    dati[2] = [lastDuration]; // Valid duration from the rest sequence
                    dati[3] = false;
                    dati[4] = 0; // Velocity 0 (Silent)
                    dati[5] = [...pendingWaits]; // Remaining waits
                    dati[6] = isPercussion ? 'p' : '1';

                    addi(dati, trackIndex);
                }
            }
        };

        // Logic to handle single voice, combination, or 'todos'
        const playbackSelector = document.getElementById('playback-selector');
        const selectedVoices = playbackSelector ? playbackSelector.value : 's,a,t,b';
        const voiceCodes = window.selectedVoiceCodes || selectedVoices.split(',');

        if (voiceCodes.length === 4) {
            // All voices - use todos logic
            if (item.voci && Array.isArray(item.voci)) {
                const voiceMap = { 's': 0, 'a': 1, 't': 2, 'b': 3 };
                item.voci.forEach(v => {
                    const mappedTrackIdx = voiceMap[v.nami];
                    if (mappedTrackIdx !== undefined) {
                        processVoice(v, mappedTrackIdx, v.nami);
                    }
                });
            } else {
                processVoice(item, 0, 's');
            }
        } else if (voiceCodes.length > 1) {
            // Multiple voices (but not all 4)
            if (item.voci && Array.isArray(item.voci)) {
                const voiceMap = { 's': 0, 'a': 1, 't': 2, 'b': 3 };
                voiceCodes.forEach(code => {
                    const foundVoice = item.voci.find(v => v.nami === code);
                    if (foundVoice) {
                        const trackIdx = voiceMap[code];
                        processVoice(foundVoice, trackIdx !== undefined ? trackIdx : 0, code);
                    }
                });
            }
        } else {
            // Single voice selected
            const code = voiceCodes[0];
            if (item.voci && Array.isArray(item.voci)) {
                const foundVoice = item.voci.find(v => v.nami === code);
                if (foundVoice) {
                    processVoice(foundVoice, 0, code);
                } else {
                    processVoice(item, 0, code);
                }
            } else {
                processVoice(item, 0, 's');
            }
        }

        const escribi = new MidiWriter.Writer(traki);
        const playi = document.getElementById("player15");
        if (playi) playi.src = escribi.dataUri();

        const currentBpm = metadata ? metadata.bpm : bpmValue;
        let titi = 'Metr_' + currentBpm + '_' + (metadata ? metadata.timeSignature[0] : '4') + '_4';
        let anchor = document.getElementById("expi");
        if (anchor) {
            anchor.setAttribute('href', escribi.dataUri());
            anchor.setAttribute('download', (metadata && metadata.title ? metadata.title : titi) + '.mid');
            anchor.innerHTML = (metadata && metadata.title ? metadata.title : titi) + '.mid';
        }
        const bdiDisplay = document.getElementById('bdi-display');
        if (bdiDisplay) bdiDisplay.value = JSON.stringify(basi, null, 2);
    }

    function recordi01(basi, nc) {
        let item = basi[nc]
        let dati = []
        if (item.chordi) {
            //console.log('Chordi',item.chordi)
            dati[1] = []
            dati[2] = [1]
            dati[0] = 1
            dati[3] = false
            dati[4] = (item.dinami && item.dinami[0] !== undefined) ? item.dinami[0] : 64
            dati[5] = 0
            dati[6] = '1';
            for (let u = 0; u < item.nimidi.length; u++) {
                dati[1].push(item.nimidi[u])
                //dati[2]=push(durai[timis[u]])
            }
            addi(dati, 0)
        } else {
            let pendingWaits = [];
            for (var a = 0; a < item.nimidi.length; a++) {
                let duration = dobli5(item.tipis[a]);

                if (item.tipis[a] < 0) {
                    // Rest: accumulate duration in pendingWaits and skip adding event
                    pendingWaits.push(duration);
                } else {
                    // Note: apply accumulated waits
                    dati[0] = 1
                    dati[1] = item.nimidi[a]
                    dati[2] = [duration]
                    dati[3] = false
                    dati[4] = (item.dinami && item.dinami[a] !== undefined) ? item.dinami[a] : 64

                    if (pendingWaits.length > 0) {
                        dati[5] = [...pendingWaits];
                        pendingWaits = [];
                    } else {
                        dati[5] = 0;
                    }

                    dati[6] = '1';
                    addi(dati, 0);
                }
            }
        }
        escribi = new MidiWriter.Writer(traki[0]);
        playi = document.getElementById("player15");
        playi.src = escribi.dataUri();
        let titi = 'Metr_' + bpmValue + '_' + '4' + '_4';
        let anchor = document.getElementById("expi");
        anchor.setAttribute('href', escribi.dataUri());
        anchor.setAttribute('download', titi + '.mid');
        anchor.innerHTML = titi + '.mid';

        // Update BDI display textarea
        const bdiDisplay = document.getElementById('bdi-display');
        if (bdiDisplay) {
            if (basi) {
                bdiDisplay.value = JSON.stringify(basi, null, 2);
            }
        }
    }


    /**
 * Devuelve el código HTML completo de un Web Component,
 * incluyendo su Shadow DOM, estilos, SVG, etc.
 * 
 * @param {Element} element - El elemento (p.ej. document.getElementById('player15'))
 * @param {boolean} pretty - Si true, formatea con saltos de línea e indentación (opcional, por defecto true)
 * @returns {string} Código HTML completo del elemento
 */
    function getFullHTML(element, pretty = true) {
        if (!element || !(element instanceof Element)) {
            return '';
        }

        // Función interna recursiva para serializar nodos
        function serialize(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                return text ? node.textContent : '';
            }
            if (node.nodeType === Node.COMMENT_NODE) {
                return `<!--${node.textContent}-->`;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return '';
            }

            const clone = node.cloneNode(false);

            // Copiar todos los atributos
            for (const attr of node.attributes) {
                clone.setAttribute(attr.name, attr.value);
            }

            // Si tiene Shadow DOM, lo incluimos
            if (node.shadowRoot) {
                const template = document.createElement('template');
                template.setAttribute('shadowrootmode', node.shadowRoot.mode);
                template.innerHTML = serialize(node.shadowRoot);
                clone.appendChild(template);
            }

            // Serializar hijos
            for (const child of node.childNodes) {
                const childHTML = serialize(child);
                if (childHTML) {
                    clone.appendChild(document.createTextNode(childHTML));
                }
            }

            return clone.outerHTML;
        }

        // Construir el HTML completo del elemento + su shadow
        const rawHTML = serialize(element);

        if (!pretty) return rawHTML;

        // Formateo bonito (indentación y saltos de línea)
        let indent = 0;
        const indentStep = 2;
        const lines = rawHTML
            .replace(/></g, '>\n<')                    // separar tags
            .split('\n');

        const formatted = lines
            .map(line => {
                line = line.trim();
                if (!line) return '';

                let result = '';

                if (line.startsWith('</')) {
                    indent = Math.max(indent - indentStep, 0);
                }

                result += ' '.repeat(indent) + line;

                if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>') && line !== '<template shadowrootmode="open">') {
                    indent += indentStep;
                }

                return result;
            })
            .filter(line => line.trim() !== '')
            .join('\n');

        return formatted.trim();
    }

    // Define saveti function BEFORE using it in addEventListener
    // Make saveti global so it can be called from HTML onclick
    window.saveti = function saveti() {
        console.log('🔍 saveti called');

        try {
            console.log('Step 1: Getting elements...');
            const player15 = document.getElementById('player15');
            const expi = document.getElementById('expi');
            console.log('Step 2: Got elements:', { player15: !!player15, expi: !!expi });
            let playeti = player15 ? player15.outerHTML : '';
            let expiti = expi ? expi.outerHTML : '';
            console.log('Step 3: Got HTML');
            const bdiRef = (typeof window.bdi.bar !== 'undefined') ? window.bdi.bar : [];
            const codigo = [JSON.stringify(bdiRef, null, 2)]
            const codigos = [document.getElementById('notepi6').innerHTML, playeti, expiti];
            console.log('Step 4: Created arrays');
            const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Archivo Generado</title>
<script src="https://cdn.jsdelivr.net/combine/npm/tone@14.7.58,npm/@magenta/music@1.23.1/es6/core.js,npm/focus-visible@5,npm/html-midi-player@1.5.0"></script>
<style>
@font-face {
  font-family: "Bravura";
   src: url("Bravura.woff") format("woff2"), url("https://github.com/josepssv/metrohmp/blob/main/Bravura.ttf") format("woff"),
   url("Bravura.ttf") format("truetype");
}
</style>
</head>
<body>
<div style="background-color:#aaa;color:#000;height:100px;overflow: scroll;"> ${codigo.join('\n  ')} </div>
${codigos.join('\n  ')}
`.trim();
            console.log('Step 5: Created HTML template');
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            console.log('Step 6: Created blob and URL:', url);

            // creamos el enlace al vuelo
            const a = document.createElement('a');
            a.href = url;
            // Use title from bdi.metadata if available, otherwise fallback to tarari or default
            const title = (window.bdi && window.bdi.metadata && window.bdi.metadata.title)
                ? window.bdi.metadata.title
                : 'resumen';
            a.download = title + '.html';
            a.style.display = 'none';
            document.body.appendChild(a);

            // Direct click is the most reliable method
            a.click();
            console.log('Step 8: Clicked download link');

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 1000);
            console.log('✅ saveti completed');

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 1000);
            console.log('✅ saveti completed');
        } catch (error) {
            console.error('Error al generar resumen:', error);
            alert('Error al generar el resumen: ' + error.message);
        }
    }





    /* if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', saveti);
    } else {
        saveti();
    } */


    function addi(dati, ntraki) {
        // Safety check: ensure traki and traki[ntraki] exist
        if (typeof traki === 'undefined' || !traki || !traki[ntraki]) {
            console.error(`❌ traki[${ntraki}] is undefined. Initializing...`);
            if (typeof traki === 'undefined' || !traki) {
                window.traki = [];
            }
            // Ensure we have enough tracks
            while (traki.length <= ntraki) {
                traki.push(new MidiWriter.Track());
            }
        }

        let chani = ntraki + 1; // Default channel matches track index + 1
        if (dati[6] == 'p') { chani = 10; } // Channel 10 for percussion
        traki[ntraki].addEvent(
            new MidiWriter.ProgramChangeEvent({ instrument: dati[0], channel: ntraki })
        );
        traki[ntraki].addEvent(
            new MidiWriter.NoteEvent({
                pitch: dati[1],
                duration: dati[2],
                sequential: dati[3],
                velocity: dati[4],
                wait: dati[5],
                channel: chani,
                //repeat: dati[7]
            })
        );
    }

    function initrakiAll(tempi, metri) {
        traki = [];
        // Support 4 tracks for vocal voices (indexed 0-3)
        for (let i = 0; i < 4; i++) {
            traki[i] = new MidiWriter.Track();
            if (metri) traki[i].setTimeSignature(metri, 4);
            if (tempi) traki[i].setTempo(tempi);
        }
    }

    function initraki(tempi, metri) {
        traki = [];
        traki[0] = new MidiWriter.Track();
        traki[0].setTimeSignature(metri, 4);
        traki[0].setTempo(tempi);
    }
    function cleari() {
        const metadata = bdi.metadata;
        const tempi = metadata ? metadata.bpm : bpmValue;
        //const currentMeter = metadata ? metadata.timeSignature[0] : 4;
        initraki(tempi, 4)
        //window.bdiRedoStack = []
        //np6.insertText('');
        divi.innerHTML = ''
        //document.getElementById("notepi6").innerHTML="";
        bdi.bar = []
        var playi = document.getElementById("player15");
        playi.src = ''
    }

    // Rebuild recordi with all bdi entries
    function rebuildRecordi() {
        const playbackSelector = document.getElementById('playback-selector');
        const selectedVoices = playbackSelector ? playbackSelector.value : 's,a,t,b';

        // Parse voice codes (can be comma-separated for combinations)
        const voiceCodes = selectedVoices.split(',');

        // Use initrakiAll for any combination (single or multiple voices)
        // This ensures we have all 4 tracks available
        if (voiceCodes.length > 1) {
            initrakiAll(tempi, 4);
        } else {
            // Single voice - use initraki
            initraki(tempi, 4);
        }

        // Store selected voices globally for recordi function to use
        window.selectedVoiceCodes = voiceCodes;

        for (let s = 0; s < window.bdi.bar.length; s++) {
            recordi(window.bdi.bar, s);
        }
    }

    // Expose variables to global scope for index.html access
    window.bdi = bdi;
    window.recordi = recordi;
    window.tuci = tuci;
    window.rebuildRecordi = rebuildRecordi;
    window.bpmValue = bpmValue;
    window.tempi = tempi;
    window.initraki = initraki;
    window.cleari = cleari;
    window.ac = ac;
    window.currentPattern = currentPattern;

    // Async function to get detailed JSON with color names
    async function updateDetailedJSON() {
        const detailedJSON = np6.getDetailedJSON();
        const lyricsMeta = np6.lyricsMetadata || [];

        // Fetch color names for each character
        const enrichedJSON = await Promise.all(
            detailedJSON.map(async (item, index) => {
                const meta = lyricsMeta[index] || {};
                const extraProps = { arrili: meta.arrili };

                if (item.type === 'character' && item.rgb) {
                    const colorInfo = await consulti(item.rgb.r, item.rgb.g, item.rgb.b);
                    const cmykw = rgbToCMYKW(item.rgb.r, item.rgb.g, item.rgb.b);
                    return {
                        ...item,
                        ...extraProps,
                        nami: colorInfo ? colorInfo.nombre : 'Unknown',
                        pinti: cmykw
                    };
                }
                return {
                    ...item,
                    ...extraProps,
                    nami: null,
                    pinti: null
                };
            })
        );

        const jsi = JSON.stringify(enrichedJSON, null, 2);
        console.log(jsi);
        document.getElementById('vari').innerHTML = `<pre style="background: white; padding: 10px; border-radius: 4px; overflow-x: auto;">${jsi}</pre>`;
    }

    updateDetailedJSON();

    // Create palette editors
    createTonalidadEditor(np6, 'editor-tonalidad');
    createRitmoEditor('editor-ritmo');
    createLyricsEditor('editor-lyrics');

    // Dual-layer system
    window.editMode = 'text'; // Start in 'lyrics' mode as default (global for modal detection)

    // Start empty as requested
    let lyricsContent = "";
    let tonalidadContent = "";
    let ritmoContent = "";

    const textLayerTextarea = document.getElementById('text-layer-6');
    const colorLayerTextarea = document.getElementById('color-layer-6');
    const lyricsLayerTextarea = document.getElementById('lyrics-layer-6');


    const btnTonalidad = document.getElementById('mode-tonalidad');
    const btnRitmo = document.getElementById('mode-ritmo');
    const btnTarareo = document.getElementById('mode-tarareo');
    const btnLyrics = document.getElementById('mode-lyrics');


    // Initialize textareas with current content
    function updateTextareas() {
        // MUSICOLI: Add null checks since textareas were removed
        // In Tonalidad mode, we show tonalidadContent
        if (colorLayerTextarea) {
            colorLayerTextarea.value = tonalidadContent;
        }

        // In Ritmo mode, we show ritmoContent
        if (textLayerTextarea) {
            textLayerTextarea.value = ritmoContent;
        }

        // In Lyrics mode, we show lyricsContent
        if (lyricsLayerTextarea) {
            lyricsLayerTextarea.value = lyricsContent;
        }
    }

    function detisi(input) {
        const silabas = input.trim().split(/\s+/); // Divide por espacios
        const totalSilabas = silabas.reduce((sum, bloque) => sum + bloque.length / 2, 0); // Asume que cada sílaba = 2 letras
        return `${Math.floor(totalSilabas)}`;
    }

    function codifisi(texto) {
        // --- PASO 1: detectar sílabas ---
        detisi(texto)

        if (n < 1 || n > 8) return null;

        // --- PASO 2: detectar patrón de agrupación ---
        const longitudes = bloques.map(b => Math.floor(b.length / 2));
        const patronLetra = (() => {
            if (bloques.length === 1) return 'd';
            if (bloques.every(b => b.length === 2)) return 'a';
            if (bloques.length === 2) {
                if (longitudes[0] === 2 && longitudes[1] === 1) return 'b';
                if (longitudes[0] === 1 && longitudes[1] === 2) return 'c';
            }
            return String.fromCharCode(65 + bloques.length + 1); // E, F...
        })();

        // --- PASO 3: elegir patrón rítmico ---
        const indice = patronLetra.charCodeAt(0) - 65; // A=0, B=1...
        const lista = trilipi[n];
        if (!lista || indice >= lista.length) return null;

        return {
            texto,
            numSilabas: n,
            patron: `${n}${patronLetra}`,
            ritmo: lista[indice],
        };
    }




    // Helper to update lyrics metadata (arrili)
    function updateLyricsMetadata() {
        const rawLyrics = lyricsLayerTextarea.value;
        const groups = rawLyrics.split(',');
        const metadata = [];
        const arriliMatrix = [];

        groups.forEach(group => {
            const trimmedGroup = group.trim();
            // Split by whitespace to get tokens, filter out empty strings
            const tokens = trimmedGroup ? trimmedGroup.split(/\s+/) : [];

            arriliMatrix.push(tokens);

            // We now map 1:1 between groups and structural units (Notepad nodes in any mode)
            metadata.push({ arrili: tokens });
        });

        np6.lyricsMetadata = metadata;
        np6.arrili = arriliMatrix; // Expose as global variable on the instance
        console.log("arrili matrix:", np6.arrili);
    }

    // Sync Ritmo tokens with arrili length
    function updateRitmoFromLyrics() {
        // Decoupled: Logic removed
        /*
        if (!np6.arrili) return;
     
        let currentRitmoMeasures = textLayerTextarea.value.split('|').map(m => m.trim());
        if (currentRitmoMeasures.length === 1 && currentRitmoMeasures[0] === "") currentRitmoMeasures = [];
     
        // Resize Ritmo measures to match arrili length (groups)
        if (currentRitmoMeasures.length < np6.arrili.length) {
            const diff = np6.arrili.length - currentRitmoMeasures.length;
            for (let k = 0; k < diff; k++) {
                currentRitmoMeasures.push("4n");
            }
        } else if (currentRitmoMeasures.length > np6.arrili.length) {
            currentRitmoMeasures = currentRitmoMeasures.slice(0, np6.arrili.length);
        }
     
        // Update each measure based on arrili length
        const updatedMeasures = currentRitmoMeasures.map((measure, index) => {
            const arriliLength = np6.arrili[index] ? np6.arrili[index].length : 0;
            const clampedLength = Math.min(Math.max(arriliLength, 0), 5); // 0 to 5
     
            let token = measure || "4n";
     
            // Update the first number of the measure
            if (/^\d/.test(token)) {
                return clampedLength + token.substring(1);
            } else {
                return clampedLength + token;
            }
        });
     
        ritmoContent = updatedMeasures.join(" | ");
        textLayerTextarea.value = ritmoContent;
        */
    }
    function applyTarareoLayer() {
        //tarareoContent = tarareoLayerTextarea.value;
    }
    // Apply color layer to notepad (Tonalidad mode)
    function applyColorLayer() {
        tonalidadContent = colorLayerTextarea.value;
        console.log('applyColorLayer called');
        // Update metadata based on new lyrics content
        updateLyricsMetadata();
        // Use central applyTextLayer to sync content with correct colors
        applyTextLayer();
        updateDetailedJSON();
    }

    // Apply lyrics layer to notepad (Lyrics mode)
    function applyLyricsLayer() {
        // MUSICOLI: Populate lyricsContent with tarareo from each compás
        const bdiRef = (typeof window.bdi.bar !== 'undefined') ? window.bdi.bar : [];
        lyricsContent = bdiRef.map(item => item.tarari || '').join(', ');
        lyricsLayerTextarea.value = lyricsContent;

        // Update metadata first
        updateLyricsMetadata();
        // Use central applyTextLayer to sync content with correct colors
        applyTextLayer();
        updateDetailedJSON();
    }


    // Button elements are declared earlier (lines 1702-1705)

    function updateButtonStyles() {
        // Reset all buttons to inactive state (gray)
        btnTonalidad.style.background = '#e0e0e0';
        btnTonalidad.style.borderColor = '#999';
        btnTonalidad.style.color = '#666';

        btnRitmo.style.background = '#e0e0e0';
        btnRitmo.style.borderColor = '#999';
        btnRitmo.style.color = '#666';



        btnLyrics.style.background = '#e0e0e0';
        btnLyrics.style.borderColor = '#999';
        btnLyrics.style.color = '#666';



        // Highlight active mode
        if (window.editMode === 'color') {
            // Tonalidad active
            btnTonalidad.style.background = '#ff9800';
            btnTonalidad.style.borderColor = '#e65100';
            btnTonalidad.style.color = 'white';
        } else if (window.editMode === 'text') {
            // Ritmo active (also activate Tarareo visually since they work together)
            btnRitmo.style.background = '#4caf50';
            btnRitmo.style.borderColor = '#2e7d32';
            btnRitmo.style.color = 'white';


        } else if (window.editMode === 'lyrics') {
            // Lyrics active
            btnLyrics.style.background = '#9c27b0';
            btnLyrics.style.borderColor = '#6a1b9a';
            btnLyrics.style.color = 'white';

        }

    }

    function setMode(mode) {
        window.editMode = mode;
        updateButtonStyles();
        updateTextareas();

        const editorTonalidad = document.getElementById('editor-tonalidad');
        const editorRitmo = document.getElementById('editor-ritmo');
        const editorLyrics = document.getElementById('editor-lyrics');
        const editorTarareo = document.getElementById('editor-tarareo');

        const tarareoInput = document.getElementById('tarareo-input');
        const tarareoSubmit = document.getElementById('tarareo-submit');
        // Helper to hide all editors
        const hideAllEditors = () => {
            if (editorTonalidad) editorTonalidad.style.display = 'none';
            if (editorRitmo) editorRitmo.style.display = 'none';
            if (editorLyrics) editorLyrics.style.display = 'none';
            if (editorTarareo) editorTarareo.style.display = 'none';
            const rhythmColorInfo = document.getElementById('rhythm-color-info-div');
            if (rhythmColorInfo) rhythmColorInfo.style.display = 'none';
            const tonalidadLadder = document.getElementById('editor-tonalidad-ladder');
            if (tonalidadLadder) tonalidadLadder.style.display = 'none';
        };

        // Update UI state
        if (window.editMode === 'color') {
            // Color mode: all textareas disabled, notepad is editable
            if (colorLayerTextarea) colorLayerTextarea.disabled = true;
            if (textLayerTextarea) textLayerTextarea.disabled = true;
            if (lyricsLayerTextarea) lyricsLayerTextarea.disabled = true;

            if (colorLayerTextarea) colorLayerTextarea.style.opacity = '0.6';
            if (textLayerTextarea) textLayerTextarea.style.opacity = '0.6';
            if (lyricsLayerTextarea) lyricsLayerTextarea.style.opacity = '0.6';


            // Enable notepad interaction
            np6.setResizable(true);
            np6.setEditable(true);

            // RESTORE: Show cursor and enable textarea
            if (np6.cursor) np6.cursor.style.display = 'inline-block';
            if (np6.textarea) np6.textarea.disabled = false;

            np6.setOverwriteMode(false); // Normal editing
            document.getElementById('notepi6').style.pointerEvents = 'auto';
            document.getElementById('notepi6').style.opacity = '1';
            np6.setOverflow()
            // Show Tonalidad editor
            hideAllEditors();
            if (editorTonalidad) {
                editorTonalidad.style.display = 'block';
                editorTonalidad.style.opacity = '1';
                editorTonalidad.style.pointerEvents = 'auto';
            }

            const tonalidadLadder = document.getElementById('editor-tonalidad-ladder');
            if (tonalidadLadder) tonalidadLadder.style.display = 'inline';

            // Change notepad background for Tonalidad mode
            np6.setContainerBackground('linear-gradient(to right, #e0e0e0, #a0a0a0)');

            // Show Tonalidad content in Notepad
            applyColorLayer();

            // Hide/Show MIDI visualizer
            document.getElementById('staffi').style.display = 'block';

            // Hide tarareo controls
            if (tarareoInput) tarareoInput.style.display = 'none';
            if (tarareoSubmit) tarareoSubmit.style.display = 'none';
        } else if (window.editMode === 'text') {
            // Enable/disable textareas based on mode
            // MUSICOLI: Add null checks since textareas were removed
            if (textLayerTextarea) {
                textLayerTextarea.disabled = (window.editMode !== 'text');
            }
            if (colorLayerTextarea) {
                colorLayerTextarea.disabled = (window.editMode !== 'color');
            }
            if (lyricsLayerTextarea) {
                lyricsLayerTextarea.disabled = (window.editMode !== 'lyrics');
            }

            if (colorLayerTextarea) colorLayerTextarea.style.opacity = '0.6';
            if (textLayerTextarea) textLayerTextarea.style.opacity = '1';
            if (lyricsLayerTextarea) lyricsLayerTextarea.style.opacity = '0.6';

            // Enable notepad editing to allow cursor placement
            np6.setEditable(true);

            // Ensure cursor is visible and textarea enabled
            if (np6.cursor) np6.cursor.style.display = 'inline-block';
            if (np6.textarea) np6.textarea.disabled = false;


            console.log('np6 editable set to true (Ritmo mode)');
            document.getElementById('notepi6').style.pointerEvents = 'auto'; // Ensure clicks are received

            // Show Ritmo editor
            hideAllEditors();
            if (editorRitmo) {
                editorRitmo.style.display = 'block';
                editorRitmo.style.opacity = '1';
            }
            const tonalidadLadder = document.getElementById('editor-tonalidad-ladder');
            if (tonalidadLadder) tonalidadLadder.style.display = 'inline';
            const rhythmColorInfo = document.getElementById('rhythm-color-info-div');
            if (rhythmColorInfo) rhythmColorInfo.style.display = 'block';

            // Change notepad background for Ritmo mode
            //-->np6.setContainerBackground('rgba(76, 175, 80, 0.1)'); // Light green tint
            np6.setContainerBackground('linear-gradient(to right, #e0e0e0, #a0a0a0)');

            // Update rhythm group buttons based on current lyrics
            if (typeof window.updateRhythmGroupButtons === 'function') {
                window.updateRhythmGroupButtons();
            }

            // Show Ritmo content in Notepad
            applyTextLayer();

            // Hide/Show MIDI visualizer
            document.getElementById('staffi').style.display = 'none';

            // Show tarareo controls
            if (tarareoInput) {
                tarareoInput.style.display = '';
                tarareoInput.disabled = false;
                tarareoInput.style.opacity = '1';
                tarareoInput.style.cursor = 'text';
            }
            if (tarareoSubmit) {
                tarareoSubmit.style.display = '';
                tarareoSubmit.disabled = false;
                tarareoSubmit.style.opacity = '1';
                tarareoSubmit.style.cursor = 'pointer';
                tarareoSubmit.style.background = '#4CAF50';
            }
        } else if (window.editMode === 'lyrics') {
            // Lyrics mode: only lyrics textarea is editable
            if (colorLayerTextarea) {
                colorLayerTextarea.disabled = true;
                colorLayerTextarea.style.opacity = '0.6';
            }
            if (textLayerTextarea) {
                textLayerTextarea.disabled = true;
                textLayerTextarea.style.opacity = '0.6';
            }
            if (lyricsLayerTextarea) {
                lyricsLayerTextarea.disabled = false;
                lyricsLayerTextarea.style.opacity = '1';
            }


            // Disable notepad interaction - only allow editing via textarea
            //-->np6.setEditable(false);
            //->document.getElementById('notepi6').style.pointerEvents = 'none';
            document.getElementById('notepi6').style.opacity = '0.7';

            // Show Lyrics editor
            hideAllEditors();
            // Lyrics editor remains hidden as per user request
            /* if (editorLyrics) {
                editorLyrics.style.display = 'block';
                editorLyrics.style.opacity = '1';
            } */

            // Change notepad background for Lyrics mode
            np6.setContainerBackground('rgba(156, 39, 176, 0.1)'); // Light purple tint

            // Show Lyrics content in Notepad
            applyLyricsLayer();

            // Hide/Show MIDI visualizer
            document.getElementById('staffi').style.display = 'none';

            // Hide tarareo controls
            if (tarareoInput) tarareoInput.style.display = 'none';
            if (tarareoSubmit) tarareoSubmit.style.display = 'none';


        }

        // Update MIDI modal colors if modal is open
        if (typeof window.updateMidiModalColors === 'function') {
            window.updateMidiModalColors();
        }
    }

    // Event listeners for mode buttons
    btnTonalidad.addEventListener('click', () => setMode('color'));
    btnRitmo.addEventListener('click', () => setMode('text'));
    btnLyrics.addEventListener('click', () => setMode('lyrics'));



    // Activate mode when clicking on textareas (use mousedown to work even when disabled)
    /* textLayerTextarea.addEventListener('mousedown', (e) => {
        if (editMode !== 'text') {
            e.preventDefault(); // Prevent default to avoid issues with disabled state
            setMode('text');
        }
    }); */

    // MUSICOLI: Commented out - textareas removed in favor of track matrix
    /* colorLayerTextarea.addEventListener('mousedown', (e) => {
        if (editMode !== 'color') {
            e.preventDefault();
            setMode('color');
        }
    });

    lyricsLayerTextarea.addEventListener('mousedown', (e) => {
        if (editMode !== 'lyrics') {
            e.preventDefault();
            setMode('lyrics');
        }
    }); */

    // Update notepad when typing in text layer
    /* textLayerTextarea.addEventListener('input', () => {
        if (editMode === 'text') {
            applyTextLayer();
        }
    }); */

    // MUSICOLI: Commented out - textareas removed in favor of track matrix
    /* Update notepad when typing in color layer
    colorLayerTextarea.addEventListener('input', () => {
        if (editMode === 'color') {
            applyColorLayer();
        }
    });

    // Update notepad when typing in lyrics layer
    lyricsLayerTextarea.addEventListener('input', () => {
        if (editMode === 'lyrics') {
            applyLyricsLayer();
        }
        // Update rhythm group buttons when lyrics change
        if (typeof window.updateRhythmGroupButtons === 'function') {
            window.updateRhythmGroupButtons();
        }
    }); */

    // --- RITMO MODE CONSTRAINTS ---

    // Handle overwrite behavior in Ritmo mode
    /* textLayerTextarea.addEventListener('keydown', (e) => {
        if (editMode !== 'text') return;
    
        const start = textLayerTextarea.selectionStart;
        const end = textLayerTextarea.selectionEnd;
        const val = textLayerTextarea.value;
        const maxLength = val.length; // Fixed length based on current content
    
        // Allow navigation keys
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
            return;
        }
    
        // Handle printable characters
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
    
            // If at the end and no selection, do nothing (cannot extend)
            if (start >= maxLength && start === end) return;
    
            // Construct new value: before + char + after
            // If selection exists, it replaces the selection (but we must ensure length stays same? 
            // Actually, standard overwrite replaces 1 char. If selection is multiple, it's tricky.
            // Let's assume simple overwrite: replace 1 char at cursor, or replace selection range with 1 char + spaces?
            // Simpler: Replace selection with char, but PAD with spaces if selection > 1? 
            // No, user wants to "substitute text". 
            // If I select 3 chars and type 'A', usually it replaces 3 chars with 'A'. But that changes length.
            // Constraint: "only substitute text" and "same number of characters".
            // So if I select 3 chars and type 'A', I probably should replace first char with 'A' and others with space?
            // Or just block selection replacement if it changes length?
            // Let's implement simple overwrite single char for now.
    
            let nextVal = val.split('');
    
            if (start !== end) {
                // Selection exists. Replace first char of selection with key, others with space?
                // Or just replace the range with the key? No, that shortens it.
                // Let's just replace the character at `start` and clear the rest of selection to spaces?
                // Or maybe just replace the WHOLE selection with the key padded with spaces?
                // Example: Select "ABC", type "D" -> "D  "
                for (let i = start; i < end; i++) {
                    nextVal[i] = (i === start) ? e.key : ' ';
                }
            } else {
                // No selection, simple overwrite
                if (start < maxLength) {
                    nextVal[start] = e.key;
                }
            }
    
            textLayerTextarea.value = nextVal.join('');
            textLayerTextarea.setSelectionRange(start + 1, start + 1);
            applyTextLayer();
            return;
        }
    
        // Handle Backspace
        if (e.key === 'Backspace') {
            e.preventDefault();
            if (start === 0 && start === end) return; // At start, nothing to do
    
            let nextVal = val.split('');
    
            if (start !== end) {
                // Selection: replace with spaces
                for (let i = start; i < end; i++) {
                    nextVal[i] = ' ';
                }
                textLayerTextarea.value = nextVal.join('');
                textLayerTextarea.setSelectionRange(start, start); // Cursor at start of selection
            } else {
                // No selection: replace previous char with space and move back
                nextVal[start - 1] = ' ';
                textLayerTextarea.value = nextVal.join('');
                textLayerTextarea.setSelectionRange(start - 1, start - 1);
            }
            applyTextLayer();
            return;
        }
    
        // Handle Delete
        if (e.key === 'Delete') {
            e.preventDefault();
            if (start >= maxLength && start === end) return;
    
            let nextVal = val.split('');
    
            if (start !== end) {
                // Selection: replace with spaces
                for (let i = start; i < end; i++) {
                    nextVal[i] = ' ';
                }
                textLayerTextarea.value = nextVal.join('');
                textLayerTextarea.setSelectionRange(start, start);
            } else {
                // No selection: replace current char with space
                nextVal[start] = ' ';
                textLayerTextarea.value = nextVal.join('');
                textLayerTextarea.setSelectionRange(start + 1, start + 1); // Standard delete doesn't move cursor, but overwrite might? 
                // Actually standard delete keeps cursor pos.
                textLayerTextarea.setSelectionRange(start, start);
            }
            applyTextLayer();
            return;
        }
    }); */

    // Handle Paste
    /* textLayerTextarea.addEventListener('paste', (e) => {
        if (editMode !== 'text') return;
        e.preventDefault();
    
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const start = textLayerTextarea.selectionStart;
        const end = textLayerTextarea.selectionEnd;
        const val = textLayerTextarea.value;
        const maxLength = val.length;
    
        let nextVal = val.split('');
        let pasteIndex = 0;
    
        // Overwrite from start, respecting selection
        // If selection, we start at `start`.
        // We overwrite characters until we run out of pasted text OR run out of textarea length.
    
        for (let i = start; i < maxLength && pasteIndex < text.length; i++) {
            nextVal[i] = text[pasteIndex];
            pasteIndex++;
        }
    
        // If selection was larger than pasted text, fill rest of selection with spaces?
        // Example: Select 5 chars, paste "Hi". "Hi   ".
        if (start !== end && (start + pasteIndex) < end) {
            for (let i = start + pasteIndex; i < end; i++) {
                nextVal[i] = ' ';
            }
        }
    
        textLayerTextarea.value = nextVal.join('');
        textLayerTextarea.setSelectionRange(start + pasteIndex, start + pasteIndex);
        applyTextLayer();
    }); */

    // Handle Cut
    /* textLayerTextarea.addEventListener('cut', (e) => {
        if (editMode !== 'text') return;
        e.preventDefault();
    
        // Copy to clipboard manually?
        // Or just simulate "replace with spaces"
        const start = textLayerTextarea.selectionStart;
        const end = textLayerTextarea.selectionEnd;
        const val = textLayerTextarea.value;
    
        // Copy selected text to clipboard
        const selectedText = val.substring(start, end);
        if (selectedText) {
            navigator.clipboard.writeText(selectedText);
        }
    
        let nextVal = val.split('');
        for (let i = start; i < end; i++) {
            nextVal[i] = ' ';
        }
    
        textLayerTextarea.value = nextVal.join('');
        textLayerTextarea.setSelectionRange(start, start);
        applyTextLayer();
    }); */

    // Listen to any input changes in Ritmo textarea to update Notepad in real-time
    /* textLayerTextarea.addEventListener('input', (e) => {
        if (editMode !== 'text') return;
        applyTextLayer();
    }); */

    // Enforce token limit on blur (when user leaves the textarea)
    /* textLayerTextarea.addEventListener('blur', () => {
        if (editMode !== 'text') return;
    
        // Decoupled: Logic removed
        / *
        let ritmoMeasures = textLayerTextarea.value.split('|').map(m => m.trim());
        if (ritmoMeasures.length === 1 && ritmoMeasures[0] === "") ritmoMeasures = [];
     
        if (ritmoMeasures.length > tonalidadContent.length) {
            ritmoMeasures = ritmoMeasures.slice(0, tonalidadContent.length);
            textLayerTextarea.value = ritmoMeasures.join(" | ");
            applyTextLayer(); // Re-apply to ensure consistency
        }
        * /
    }); */

    // Listen to notepad changes to update textareas
    np6.on('change', () => {
        // If we are in Tonalidad mode and notepad changed (user typed in notepad), update tonalidadContent
        if (editMode === 'color') {
            const richContent = np6.getRichContent();
            tonalidadContent = richContent.map(item => item.text).join('');

            // Resize ritmoContent
            // Resize ritmoContent
            // Decoupled: Logic removed
            /*
            let currentRitmoMeasures = ritmoContent.split('|').map(m => m.trim());
            if (currentRitmoMeasures.length === 1 && currentRitmoMeasures[0] === "") currentRitmoMeasures = [];
     
            if (currentRitmoMeasures.length < tonalidadContent.length) {
                const diff = tonalidadContent.length - currentRitmoMeasures.length;
                for (let k = 0; k < diff; k++) {
                    currentRitmoMeasures.push("4n");
                }
            } else if (currentRitmoMeasures.length > tonalidadContent.length) {
                currentRitmoMeasures = currentRitmoMeasures.slice(0, tonalidadContent.length);
            }
            ritmoContent = currentRitmoMeasures.join(" | ");
            */

            updateTextareas();
        }
    });

    // Initialize mode
    // Initialize mode
    setMode('text');

    /*  // Play button functionality
      document.getElementById('play-button').addEventListener('click', () => {
          // Build basi array from current notepad data
          const detailedJSON = np6.getDetailedJSON();
          const basi = [];
     
          // Group characters by their properties
          detailedJSON.forEach((item, index) => {
              if (item.type === 'character') {
                  // Get MIDI note from character (A=60, B=62, C=64, etc.)
                  // Simple mapping: use char code offset
                  const charCode = item.char.toUpperCase().charCodeAt(0);
                  let midiNote = 60; // Default to middle C
     
                  if (charCode >= 65 && charCode <= 90) { // A-Z
                      midiNote = 60 + ((charCode - 65) % 12) * 2;
                  } else if (charCode >= 48 && charCode <= 57) { // 0-9
                      midiNote = 48 + (charCode - 48);
                  }
     
                  // Get rhythm duration from arrili metadata
                  const meta = np6.lyricsMetadata && np6.lyricsMetadata[index];
                  const arriliLength = meta && meta.arrili ? meta.arrili.length : 1;
     
                  // Parse rhythm from text-layer (ritmo)
                  const ritmoTokens = textLayerTextarea.value.trim().split(/\s+/).filter(t => t);
                  let tipis = [3]; // Default to quarter note
     
                  if (ritmoTokens[index]) {
                      // Parse rhythm notation like "3n 3n 3n" or "4n 4n 4n 4n"
                      const rhythmPattern = ritmoTokens[index].split(/\s+/);
                      tipis = rhythmPattern.map(r => {
                          const num = parseInt(r);
                          return isNaN(num) ? 3 : num;
                      });
                  }
     
                  // Create note array (repeat midi note for each rhythm element)
                  const nimidi = tipis.map(() => midiNote);
     
                  basi.push({
                      nimidi: nimidi,
                      tipis: tipis,
                      chordi: false
                  });
              }
          });
     
          // Play each note group sequentially
          if (typeof tuci === 'function' && basi.length > 0) {
              basi.forEach((item, index) => {
                  setTimeout(() => {
                      tuci(basi, index);
                  }, index * 500); // Stagger playback
              });
          } else {
              console.error('tuci function not available or no data to play');
          }
      });
    */
    document.getElementById('export-img-6').addEventListener('click', () => {
        np6.exportAsImageWithP5('notepad-snapshot-6.png', { scale: 2, background: 'transparent' })
            .then(() => console.log('Exportación del Ejemplo 6 completada'))
            .catch(err => console.error('Error en la exportación del Ejemplo 6:', err));
    });

    // BPM Selector event listener
    const bpmSelector = document.getElementById('bpm-selector');
    if (bpmSelector) {
        bpmSelector.addEventListener('change', (e) => {
            const newBpm = parseInt(e.target.value);
            window.bdi.metadata.bpm = newBpm;
            if (typeof window.bpmValue !== 'undefined') {
                window.bpmValue = newBpm;
                console.log('BPM updated to:', newBpm);

                // Update tempi if it exists
                if (typeof window.tempi !== 'undefined') {
                    window.tempi = newBpm;

                }

                // Reinitialize track with new tempo if initraki exists
                if (typeof window.initraki === 'function') {
                    window.initraki(newBpm, 4);
                    console.log('MIDI track reinitialized with new BPM');
                }
            } else {
                console.warn('bpmValue not found in window scope');
            }
        });
    }

    // Empezar button event listener (Reset)
    const empezarBtn = document.getElementById('empezar-btn');
    if (empezarBtn) {
        empezarBtn.addEventListener('click', () => {


            // Clear bdi array
            if (typeof window.bdi.bar !== 'undefined') {
                window.bdi.bar = [];

            }

            // Call initraki (part of cleari, but not the innerHTML clearing part)
            if (typeof window.initraki === 'function' && typeof tempi !== 'undefined') {
                window.initraki(tempi, 4);

            }

            // Clear player source (part of cleari)
            const playi = document.getElementById("player15");
            if (playi) {
                playi.src = '';

            }

            // NOTE: We do NOT call cleari() because it does divi.innerHTML='' which destroys np6

            // Clear tarareo input
            const tarareoInput = document.getElementById('tarareo-input');
            if (tarareoInput) {
                tarareoInput.value = '';

            }

            // Clear layer textareas
            const textLayer = document.getElementById('text-layer-6');
            const colorLayer = document.getElementById('color-layer-6');
            const lyricsLayer = document.getElementById('lyrics-layer-6');

            if (textLayer) {
                textLayer.value = '';

            }
            if (colorLayer) {
                colorLayer.value = '';

            }
            if (lyricsLayer) {
                lyricsLayer.value = '';

            }

            // Reset notepad instance properly
            if (typeof np6 !== 'undefined' && np6) {
                // Clear notepad content using setFromRichContent with empty array
                np6.setFromRichContent([]);

                // Re-enable notepad editing after reset
                np6.setEditable(true);
                if (np6.cursor) np6.cursor.style.display = 'inline-block';
                if (np6.textarea) np6.textarea.disabled = false;


            }

            // Clear BDI display
            const bdiDisplay = document.getElementById('bdi-display');
            if (bdiDisplay) {
                bdiDisplay.value = '';

            }

            // Clear redo stack
            if (window.bdiRedoStack) {
                window.bdiRedoStack = [];

            }

            // Visual feedback
            const originalText = empezarBtn.textContent;
            empezarBtn.textContent = '¡Listo!';
            empezarBtn.style.background = '#45a049';
            setTimeout(() => {
                empezarBtn.textContent = originalText;
                empezarBtn.style.background = '#4CAF50';
            }, 1500);
        });
    }

    // Undo button event listener (Go back in bdi history)
    const undoBtn = document.getElementById('undo-btn');
    // Redo button event listener (Go forward in bdi history)
    const redoBtn = document.getElementById('redo-btn');

    // History stack for redo functionality
    window.bdiRedoStack = window.bdiRedoStack || [];

    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            console.log('Undo button clicked');

            if (undoBdi()) {
                // Update all dependent systems
                updateAfterBdiChange();
            } else {
                console.log('No entries to undo');
            }

            // Visual feedback
            let originalBg = undoBtn.style.background;
            undoBtn.style.background = '#F57C00';
            setTimeout(() => {
                undoBtn.style.background = originalBg;
            }, 300);
        });
    }

    // Redo button logic
    if (redoBtn) {
        redoBtn.addEventListener('click', () => {
            console.log('Redo button clicked');
            if (redoBdi()) {
                // Update all dependent systems
                updateAfterBdiChange();
            } else {
                console.log('No entries to redo');
            }

            // Visual feedback
            let originalBg = redoBtn.style.background;
            redoBtn.style.background = '#1976D2';
            setTimeout(() => {
                originalBg = redoBtn.style.background;
            }, 300);
        });
    }

    // Delete selected measure button logic
    // ========== DELETE MEASURES BUTTON ==========
    console.log('🔧 INIT: Setting up delete measures button event listener');
    const deleteMeasuresBtn = document.getElementById('delete-measures-btn');
    console.log('🔧 INIT: deleteMeasuresBtn found?', !!deleteMeasuresBtn);

    if (deleteMeasuresBtn) {
        console.log('✅ INIT: Attaching event listener to delete button');
        deleteMeasuresBtn.addEventListener('click', () => {
            console.log('🗑️ DELETE BUTTON CLICKED!');

            if (!window.bdi.bar || window.bdi.bar.length === 0) {
                alert('No hay compases para borrar');
                return;
            }

            // If no measure is selected, delete the last one
            const measureToDelete = selectedMeasureIndex >= 0 ? selectedMeasureIndex : window.bdi.bar.length - 1;
            const measure = window.bdi.bar[measureToDelete];

            if (!measure) {
                alert('Error: No se pudo encontrar el compás seleccionado');
                return;
            }

            const measureNumber = measure.numi !== undefined ? measure.numi + 1 : measureToDelete + 1;
            const measureName = measure.nami || 'Sin nombre';
            const measureText = measure.tarari || 'Sin texto';


            // Save state before modification
            saveBdiState();

            console.log('🔍 DELETE BUTTON: About to call deleteMeasureWithMode');
            console.log('🔍 DELETE BUTTON: voiceEditMode value =', voiceEditMode);
            console.log('🔍 DELETE BUTTON: typeof window.deleteMeasureWithMode =', typeof window.deleteMeasureWithMode);

            // Use deleteMeasureWithMode to respect edit mode
            if (typeof window.deleteMeasureWithMode === 'function') {
                console.log('✅ Calling window.deleteMeasureWithMode');
                window.deleteMeasureWithMode(measureToDelete);
            } else {
                console.warn('⚠️ window.deleteMeasureWithMode not found, using fallback');
                // Fallback to old behavior if function not available
                window.bdi.bar.splice(measureToDelete, 1);
            }

            // Only update measure numbers if we actually deleted the measure (dependent mode)
            // In independent mode, the measure still exists (just emptied), so don't renumber
            if (voiceEditMode === 'dependent') {
                window.bdi.bar.forEach((measure, index) => {
                    measure.numi = index;
                });
                console.log('Updated measure numbers for remaining measures');
            }

            selectedMeasureIndex = -1; // Reset selection

            console.log('Processed measure at index', measureToDelete, '. Total measures:', window.bdi.bar.length);

            // Rebuild recordi with remaining entries
            if (typeof window.rebuildRecordi === 'function') {
                window.rebuildRecordi();
                console.log('Rebuilt recordi after measure deletion');
            }

            // Update MIDI player with new data
            if (typeof window.traki !== 'undefined' && window.traki.length > 0) {
                window.escribi = new MidiWriter.Writer(window.traki[0]);
                if (typeof window.playi !== 'undefined') {
                    // Clear src first to force reload
                    window.playi.src = '';
                    // Small delay then set new src with timestamp to force reload
                    setTimeout(() => {
                        const dataUri = window.escribi.dataUri();
                        window.playi.src = dataUri + '?t=' + Date.now();
                        console.log('MIDI player src updated after measure deletion');
                    }, 100);

                    // Update download link
                    let titi = 'Metr_' + window.bpmValue + '_' + '4' + '_4';
                    let anchor = document.getElementById("expi");
                    if (anchor) {
                        anchor.setAttribute('href', window.escribi.dataUri());
                        anchor.setAttribute('download', titi + '.mid');
                        anchor.innerHTML = titi + '.mid';
                    }

                    console.log('Updated MIDI player and download link after measure deletion');
                }
            }

            // Update BDI display
            let deleteBdiDisplay = document.getElementById('bdi-display');
            if (deleteBdiDisplay) {
                if (window.bdi.bar.length > 0) {
                    deleteBdiDisplay.value = JSON.stringify(window.bdi.bar, null, 2);
                } else {
                    deleteBdiDisplay.value = '';
                }
            }

            // Update Notepad Visuals
            if (typeof applyTextLayer === 'function') {
                applyTextLayer();
            }

            // Visual feedback
            let deleteOriginalBg = deleteMeasuresBtn.style.background;
            deleteMeasuresBtn.style.background = '#D32F2F';
            setTimeout(() => {
                deleteMeasuresBtn.style.background = deleteOriginalBg;
            }, 300);
            if (typeof window.rebuildRecordi === 'function') {
                window.rebuildRecordi();
                console.log('Rebuilt recordi after measure deletion');
            }

            // Update BDI display
            let bdiDisplay = document.getElementById('bdi-display');
            if (bdiDisplay) {
                if (window.bdi.bar.length > 0) {
                    bdiDisplay.value = JSON.stringify(window.bdi.bar, null, 2);
                } else {
                    bdiDisplay.value = '';
                }
            }


            // Update Notepad Visuals
            if (typeof applyTextLayer === 'function') {
                applyTextLayer();
            }

            // Visual feedback
            let originalBg = deleteMeasuresBtn.style.background;
            deleteMeasuresBtn.style.background = '#D32F2F';
            setTimeout(() => {
                deleteMeasuresBtn.style.background = originalBg;
            }, 300);
        });
    }

    // Update BDI Button Logic - Moved to ensure it attaches correctly
    const updateBdiBtn = document.getElementById('update-bdi-btn');
    if (updateBdiBtn) {
        console.log('✅ Update BDI button found, attaching listener...');
        updateBdiBtn.addEventListener('click', () => {
            console.log('🖱️ Update BDI button clicked!');
            const bdiDisplay = document.getElementById('bdi-display');
            if (!bdiDisplay) {
                console.error('❌ BDI display textarea not found!');
                return;
            }

            try {
                const jsonContent = bdiDisplay.value.trim();
                if (!jsonContent) {
                    console.warn('⚠️ JSON content is empty');
                    return;
                }

                console.log('Parsing JSON content...');
                const newBdi = JSON.parse(jsonContent);

                if (Array.isArray(newBdi)) {
                    // Save state before replacing all measures
                    saveBdiState();

                    // Update global BDI
                    if (typeof window.bdi.bar !== 'undefined') {
                        window.bdi.bar.length = 0; // Clear existing array
                        window.bdi.bar.push(...newBdi); // Copy new items
                        console.log('✅ BDI updated manually from JSON. Length:', window.bdi.bar.length);
                    } else {
                        console.error('❌ bdi array not found in global scope');
                        return;
                    }

                    // Rebuild MIDI track
                    if (typeof window.initraki === 'function') {
                        window.initraki(window.tempi, 4); // Reinitialize track
                        console.log('🔄 Track reinitialized');
                    }

                    // Rebuild MIDI events by calling recordi for each entry
                    if (typeof window.recordi === 'function') {
                        for (let s = 0; s < window.bdi.bar.length; s++) {
                            window.recordi(window.bdi.bar, s);
                        }
                        console.log('🎹 MIDI events rebuilt for', window.bdi.bar.length, 'entries');
                    } else {
                        console.error('❌ recordi function not found');
                    }

                    // Update visual layers
                    if (typeof applyTextLayer === 'function') {
                        applyTextLayer();
                        console.log('🎨 applyTextLayer() called');
                    }

                    // Update MIDI player with new data
                    if (typeof window.traki !== 'undefined' && window.traki.length > 0) {
                        window.escribi = new MidiWriter.Writer(window.traki[0]);
                        if (typeof window.playi !== 'undefined') {
                            window.playi.src = '';
                            setTimeout(() => {
                                const dataUri = window.escribi.dataUri();
                                window.playi.src = dataUri + '?t=' + Date.now();
                            }, 100);

                            // Update download link
                            let titi = 'Metr_' + window.bpmValue + '_' + '4' + '_4';
                            let anchor = document.getElementById("expi");
                            if (anchor) {
                                anchor.setAttribute('href', window.escribi.dataUri());
                                anchor.setAttribute('download', titi + '.mid');
                                anchor.innerHTML = titi + '.mid';
                            }

                            console.log('🎵 MIDI player updated after manual BDI update');
                        }
                    }

                    // Visual feedback
                    let originalBg = updateBdiBtn.style.background;
                    const originalText = updateBdiBtn.textContent;
                    updateBdiBtn.style.background = '#4CAF50';
                    updateBdiBtn.textContent = '¡Actualizado!';
                    setTimeout(() => {
                        updateBdiBtn.style.background = originalBg;
                        updateBdiBtn.textContent = originalText;
                    }, 1500);

                } else {
                    alert('El JSON debe ser un array (lista) de objetos.');
                    console.error('❌ JSON is not an array');
                }
            } catch (e) {
                console.error('❌ Error parsing JSON:', e);
                alert('Error en el formato JSON. Revisa la consola para más detalles.');
            }
        });
    } else {
        console.error('❌ Update BDI button NOT found in DOM');
    }

    // Voice selector event listener
    const voiceSelector = document.getElementById('voice-selector');
    if (voiceSelector) {
        voiceSelector.addEventListener('change', () => {
            console.log('Voice changed to:', voiceSelector.value);
            // Update chromatic semitones with new vocal range
            makeladi();
            // Rebuild MIDI player content
            if (typeof updateAfterBdiChange === 'function') {
                updateAfterBdiChange();
            } else if (typeof rebuildRecordi === 'function') {
                rebuildRecordi();
            }
            // Update instrument selector state for new voice
            if (typeof initInstrumentSelector === 'function') {
                initInstrumentSelector();
            }
        });
    }

    // BPM Input event listener
    const bpmCustomInputEl = document.getElementById('bpm-custom-input');

    if (bpmCustomInputEl) {
        // Update BPM when user enters custom value
        bpmCustomInputEl.addEventListener('change', (e) => {
            const newBpm = parseInt(e.target.value);

            // Validate BPM range
            if (!isNaN(newBpm) && newBpm >= 40 && newBpm <= 240) {
                // Update BPM variables
                bpmValue = newBpm;
                tempi = newBpm;
                if (bdi.metadata) {
                    bdi.metadata.bpm = newBpm;
                }

                console.log('BPM set to:', newBpm);

                // Rebuild player with new tempo
                if (typeof rebuildRecordi === 'function') {
                    rebuildRecordi();
                }
            } else {
                alert('Por favor ingresa un BPM entre 40 y 240');
                e.target.value = bpmValue || 120;
            }
        });

        // Also update on Enter key
        bpmCustomInputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.target.blur(); // Trigger change event
            }
        });
    }

    // Loop button event listener
    const loopBtn = document.getElementById('loop-btn');
    const player15 = document.getElementById('player15');

    if (loopBtn && player15) {
        let isLooping = false;

        loopBtn.addEventListener('click', () => {
            isLooping = !isLooping;

            if (isLooping) {
                player15.setAttribute('loop', '');
                loopBtn.textContent = '🔁 Loop ON';
                loopBtn.style.background = '#4CAF50';
            } else {
                player15.removeAttribute('loop');
                loopBtn.textContent = '🔁 Loop OFF';
                loopBtn.style.background = '#666';
            }


            console.log('Loop:', isLooping ? 'ON' : 'OFF');
        });
    }


    // Notepad click overlay for Tonalidad mode
    function setupTonalidadClickHandler() {
        const notepadContainer = document.getElementById('notepi6');
        if (!notepadContainer) return;

        // Remove existing overlay if any
        const existingOverlay = document.getElementById('tonalidad-click-overlay');
        if (existingOverlay) existingOverlay.remove();

        if (currentEditMode !== 'tonalidad') return;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'tonalidad-click-overlay';
        overlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; cursor: pointer;';

        overlay.addEventListener('click', (e) => {
            // Find which span was clicked
            const spans = Array.from(notepadContainer.querySelectorAll('span[data-is-word-block="true"]'));
            for (let i = 0; i < spans.length; i++) {
                const spanRect = spans[i].getBoundingClientRect();
                const relX = e.clientX - spanRect.left;
                const relY = e.clientY - spanRect.top;

                if (relX >= 0 && relX <= spanRect.width && relY >= 0 && relY <= spanRect.height) {
                    // Clicked on this span
                    window.selectedMeasureIndex = i;
                    selectedMeasureIndex = i;
                    console.log('📍 Measure selected via overlay click:', i + 1);

                    // Update visual highlight
                    document.querySelectorAll('.measure-number').forEach(el => {
                        el.style.background = '#999';
                    });
                    const clickedNumber = spans[i].querySelector('.measure-number');
                    if (clickedNumber) {
                        clickedNumber.style.background = '#FF9800';
                    }

                    // Open MIDI editor modal directly
                    if (typeof window.openMidiEditor === 'function') {
                        window.openMidiEditor(i);
                    }

                    break;
                }
            }
        });

        notepadContainer.style.position = 'relative';
        notepadContainer.appendChild(overlay);
        console.log('✅ Tonalidad click overlay installed');
    }

    // Mode buttons - update currentEditMode
    const modeRitmoBtn = document.getElementById('mode-ritmo');
    const modeTonalidadBtn = document.getElementById('mode-tonalidad');
    const modeLyricsBtn = document.getElementById('mode-lyrics');

    if (modeRitmoBtn) {
        modeRitmoBtn.addEventListener('click', () => {
            currentEditMode = 'ritmo';
            console.log('🎵 Mode: Ritmo');

            // Update button styles - Ritmo active (dark gray monochrome)
            modeRitmoBtn.style.background = '#2c2c2c';
            modeRitmoBtn.style.borderColor = '#ffffff';
            modeRitmoBtn.style.color = '#ffffff';
            modeRitmoBtn.style.fontWeight = 'bold';

            // Reset other buttons
            if (modeTonalidadBtn) {
                modeTonalidadBtn.style.background = 'rgb(224, 224, 224)';
                modeTonalidadBtn.style.borderColor = 'rgb(153, 153, 153)';
                modeTonalidadBtn.style.color = 'rgb(102, 102, 102)';
                modeTonalidadBtn.style.fontWeight = 'bold';
            }
            if (modeLyricsBtn) {
                modeLyricsBtn.style.background = 'rgb(224, 224, 224)';
                modeLyricsBtn.style.borderColor = 'rgb(153, 153, 153)';
                modeLyricsBtn.style.color = 'rgb(102, 102, 102)';
                modeLyricsBtn.style.fontWeight = 'bold';
            }
            const modeDinamicaBtn = document.getElementById('mode-dinamica');
            if (modeDinamicaBtn) {
                modeDinamicaBtn.style.background = 'rgb(224, 224, 224)';
                modeDinamicaBtn.style.borderColor = 'rgb(153, 153, 153)';
                modeDinamicaBtn.style.color = 'rgb(102, 102, 102)';
                modeDinamicaBtn.style.fontWeight = 'bold';
            }

            // Remove overlay
            const overlay = document.getElementById('tonalidad-click-overlay');
            if (overlay) overlay.remove();

            // Reset measure number colors
            document.querySelectorAll('.measure-number').forEach(el => {
                el.style.background = '';
            });
            selectedMeasureIndex = -1;

            // Hide editor-tonalidad container
            const editorTonalidad = document.getElementById('editor-tonalidad');
            if (editorTonalidad) editorTonalidad.style.display = 'none';

            // Hide editor-dinamica container
            const editorDinamica = document.getElementById('editor-dinamica');
            if (editorDinamica) editorDinamica.style.display = 'none';

            // Hide harmonize button
            const harmonizeContainer = document.getElementById('harmonize-container');
            if (harmonizeContainer) harmonizeContainer.style.display = 'none';

            if (typeof updateAfterBdiChange === 'function') updateAfterBdiChange();
        });
    }

    if (modeTonalidadBtn) {
        modeTonalidadBtn.addEventListener('click', () => {
            currentEditMode = 'tonalidad';
            console.log('🎹 Mode: Tonalidad');

            // Update button styles - Tonalidad active (warm orange)
            modeTonalidadBtn.style.background = '#ff9800';
            modeTonalidadBtn.style.borderColor = '#f57c00';
            modeTonalidadBtn.style.color = '#ffffff';
            modeTonalidadBtn.style.fontWeight = 'bold';

            // Reset other buttons
            if (modeRitmoBtn) {
                modeRitmoBtn.style.background = 'rgb(224, 224, 224)';
                modeRitmoBtn.style.borderColor = 'rgb(153, 153, 153)';
                modeRitmoBtn.style.color = 'rgb(102, 102, 102)';
                modeRitmoBtn.style.fontWeight = 'bold';
            }
            if (modeLyricsBtn) {
                modeLyricsBtn.style.background = 'rgb(224, 224, 224)';
                modeLyricsBtn.style.borderColor = 'rgb(153, 153, 153)';
                modeLyricsBtn.style.color = 'rgb(102, 102, 102)';
                modeLyricsBtn.style.fontWeight = 'bold';
            }
            const modeDinamicaBtn = document.getElementById('mode-dinamica');
            if (modeDinamicaBtn) {
                modeDinamicaBtn.style.background = 'rgb(224, 224, 224)';
                modeDinamicaBtn.style.borderColor = 'rgb(153, 153, 153)';
                modeDinamicaBtn.style.color = 'rgb(102, 102, 102)';
                modeDinamicaBtn.style.fontWeight = 'bold';
            }

            // Show the editor-tonalidad container
            const editorTonalidad = document.getElementById('editor-tonalidad');
            if (editorTonalidad) editorTonalidad.style.display = 'block';

            // Show harmonize button
            const harmonizeContainer = document.getElementById('harmonize-container');
            if (harmonizeContainer) harmonizeContainer.style.display = 'block';

            if (typeof updateAfterBdiChange === 'function') updateAfterBdiChange();

            // Setup click overlay after notepad updates
            setTimeout(() => setupTonalidadClickHandler(), 100);
        });
    }

    if (modeLyricsBtn) {
        modeLyricsBtn.addEventListener('click', () => {
            currentEditMode = 'lyrics';
            console.log('📝 Mode: Lyrics');

            // Update button styles - Lyrics active (soft pink)
            modeLyricsBtn.style.background = '#e91e63';
            modeLyricsBtn.style.borderColor = '#c2185b';
            modeLyricsBtn.style.color = '#ffffff';
            modeLyricsBtn.style.fontWeight = 'bold';

            // Reset other buttons
            if (modeRitmoBtn) {
                modeRitmoBtn.style.background = 'rgb(224, 224, 224)';
                modeRitmoBtn.style.borderColor = 'rgb(153, 153, 153)';
                modeRitmoBtn.style.color = 'rgb(102, 102, 102)';
                modeRitmoBtn.style.fontWeight = 'bold';
            }
            if (modeTonalidadBtn) {
                modeTonalidadBtn.style.background = 'rgb(224, 224, 224)';
                modeTonalidadBtn.style.borderColor = 'rgb(153, 153, 153)';
                modeTonalidadBtn.style.color = 'rgb(102, 102, 102)';
                modeTonalidadBtn.style.fontWeight = 'bold';
            }
            const modeDinamicaBtn = document.getElementById('mode-dinamica');
            if (modeDinamicaBtn) {
                modeDinamicaBtn.style.background = 'rgb(224, 224, 224)';
                modeDinamicaBtn.style.borderColor = 'rgb(153, 153, 153)';
                modeDinamicaBtn.style.color = 'rgb(102, 102, 102)';
                modeDinamicaBtn.style.fontWeight = 'bold';
            }

            // Remove overlay
            const overlay = document.getElementById('tonalidad-click-overlay');
            if (overlay) overlay.remove();

            // Reset measure number colors
            document.querySelectorAll('.measure-number').forEach(el => {
                el.style.background = '';
            });
            selectedMeasureIndex = -1;

            // Hide editor-tonalidad container
            const editorTonalidad = document.getElementById('editor-tonalidad');
            if (editorTonalidad) editorTonalidad.style.display = 'none';

            // Hide editor-dinamica container
            const editorDinamica = document.getElementById('editor-dinamica');
            if (editorDinamica) editorDinamica.style.display = 'none';

            // Hide harmonize button
            const harmonizeContainer = document.getElementById('harmonize-container');
            if (harmonizeContainer) harmonizeContainer.style.display = 'none';

            if (typeof updateAfterBdiChange === 'function') updateAfterBdiChange();
        });
    }

    const modeDinamicaBtn = document.getElementById('mode-dinamica');
    if (modeDinamicaBtn) {
        modeDinamicaBtn.addEventListener('click', () => {
            currentEditMode = 'dinamica';
            console.log('🎚️ Mode: Dinámica');

            // Update button styles - Dinámica active (blue)
            modeDinamicaBtn.style.background = '#2196f3';
            modeDinamicaBtn.style.borderColor = '#1565c0';
            modeDinamicaBtn.style.color = '#ffffff';
            modeDinamicaBtn.style.fontWeight = 'bold';

            // Reset other buttons
            if (modeRitmoBtn) {
                modeRitmoBtn.style.background = 'rgb(224, 224, 224)';
                modeRitmoBtn.style.borderColor = 'rgb(153, 153, 153)';
                modeRitmoBtn.style.color = 'rgb(102, 102, 102)';
                modeRitmoBtn.style.fontWeight = 'bold';
            }
            if (modeTonalidadBtn) {
                modeTonalidadBtn.style.background = 'rgb(224, 224, 224)';
                modeTonalidadBtn.style.borderColor = 'rgb(153, 153, 153)';
                modeTonalidadBtn.style.color = 'rgb(102, 102, 102)';
                modeTonalidadBtn.style.fontWeight = 'bold';
            }
            if (modeLyricsBtn) {
                modeLyricsBtn.style.background = 'rgb(224, 224, 224)';
                modeLyricsBtn.style.borderColor = 'rgb(153, 153, 153)';
                modeLyricsBtn.style.color = 'rgb(102, 102, 102)';
                modeLyricsBtn.style.fontWeight = 'bold';
            }

            // Remove overlay
            const overlay = document.getElementById('tonalidad-click-overlay');
            if (overlay) overlay.remove();

            // Reset measure number colors
            document.querySelectorAll('.measure-number').forEach(el => {
                el.style.background = '';
            });
            selectedMeasureIndex = -1;

            // Hide other editors
            const editorTonalidad = document.getElementById('editor-tonalidad');
            if (editorTonalidad) editorTonalidad.style.display = 'none';

            const editorLyrics = document.getElementById('editor-lyrics');
            if (editorLyrics) editorLyrics.style.display = 'none';

            // Show editor-dinamica
            const editorDinamica = document.getElementById('editor-dinamica');
            if (editorDinamica) editorDinamica.style.display = 'block';

            // Hide harmonize button
            const harmonizeContainer = document.getElementById('harmonize-container');
            if (harmonizeContainer) harmonizeContainer.style.display = 'none';

            // Initialize dynamics editor
            if (typeof createDinamicaEditor === 'function') {
                createDinamicaEditor();
            }

            if (typeof updateAfterBdiChange === 'function') updateAfterBdiChange();
        });
    }

    // MIDI Editor functionality (now always visible in right column)
    const midiEditorModal = document.getElementById('midi-editor-modal'); // Deprecated - kept for compatibility
    const midiInputsContainer = document.getElementById('midi-inputs-container');
    const midiEditorAccept = document.getElementById('midi-editor-accept');
    const midiEditorCancel = document.getElementById('midi-editor-cancel');
    // const midiEditorClose = document.getElementById('midi-editor-close'); // Removed - no longer exists
    window.currentEditingMeasureIndex = -1; // Global variable to track active editing session
    window.currentEditingRhythmValues = []; // Store rhythm values globally for access by accept button and color scale handlers

    // Note: Close button removed - editor is now always visible in right column


    // Helper to highlight a specific measure in the Notepad
    window.highlightMeasure = function (index) {
        // Reset all to gray (inactive)
        document.querySelectorAll('.measure-number').forEach(el => {
            el.style.background = '#999';
        });

        // Highlight selected
        const notepadContainer = document.getElementById('notepi6');
        if (notepadContainer) {
            const spans = Array.from(notepadContainer.querySelectorAll('span[data-is-word-block="true"]'));
            if (spans[index]) {
                const num = spans[index].querySelector('.measure-number');
                if (num) {
                    num.style.background = '#FF9800';
                }
            }
        }
    };

    /**
     * Check if the MIDI Editor is in rhythm mode AND actively editing a measure
     * @returns {boolean} - True if editMode is 'text' (rhythm mode) AND a measure is being edited
     * Note: Editor is now always visible, so we check both mode and editing state
     */
    window.isModalOpenInRhythmMode = function () {
        console.log('🔍 isModalOpenInRhythmMode check:');
        console.log('  - window.editMode:', window.editMode);
        console.log('  - window.currentEditingMeasureIndex:', window.currentEditingMeasureIndex);

        // Check if editMode is 'text' (rhythm mode) AND a measure is being edited
        const isRhythmMode = (typeof window.editMode !== 'undefined' && window.editMode === 'text');
        const isEditingMeasure = (typeof window.currentEditingMeasureIndex !== 'undefined' && window.currentEditingMeasureIndex >= 0);
        const result = isRhythmMode && isEditingMeasure;

        console.log('  - isRhythmMode:', isRhythmMode);
        console.log('  - isEditingMeasure:', isEditingMeasure);
        console.log('  ✅ Result:', result);

        return result;
    };

    // Function to open MIDI editor for a measure
    window.openMidiEditor = function (measureIndex) {
        // console.log('🎹 openMidiEditor called with index:', measureIndex);
        if (measureIndex < 0 || measureIndex >= window.bdi.bar.length) {
            console.error('Invalid measure index:', measureIndex);
            return;
        }

        window.currentEditingMeasureIndex = measureIndex;
        const measure = window.bdi.bar[measureIndex];

        // Update modal header with measure number and navigation arrows
        // Update header title with dynamic voice name
        const header = document.getElementById('midi-editor-header');
        if (header) {
            const voiceSelector = document.getElementById('voice-selector');
            const voiceCode = voiceSelector ? voiceSelector.value : 's';
            const voiceNames = { 's': 'Soprano', 'a': 'Contralto', 't': 'Tenor', 'b': 'Bajo' };
            const voiceName = voiceNames[voiceCode] || 'Compás';

            // Determine button style based on current mode
            const isIndependent = (typeof voiceEditMode !== 'undefined' && voiceEditMode === 'independent');
            const btnColor = isIndependent ? '#FF9800' : '#4CAF50';
            const btnIcon = isIndependent ? '🔓' : '🔗';
            const btnTitle = isIndependent ? 'Modo: Independiente' : 'Modo: Dependiente';

            // Create inner HTML with button and title
            header.innerHTML = `
                <button id="modal-mode-toggle" style="background: ${btnColor}; border: none; border-radius: 50%; width: 24px; height: 24px; color: white; margin-right: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;" title="${btnTitle}">
                    ${btnIcon}
                </button>
                ${voiceName} <span id="midi-editor-measure-num" style="color: #FF9800; font-weight: bold;"></span>
            `;

            // Add click listener to the new button
            const modalToggle = document.getElementById('modal-mode-toggle');
            if (modalToggle) {
                modalToggle.onclick = (e) => {
                    e.stopPropagation();
                    // Trigger the main toggle button (to keep logic centralized)
                    const mainToggle = document.getElementById('html-mode-toggle');
                    if (mainToggle) {
                        mainToggle.click();

                        // Update this button's look after a short delay (sync) or immediately check global
                        setTimeout(() => {
                            const isInd = (typeof voiceEditMode !== 'undefined' && voiceEditMode === 'independent');
                            modalToggle.style.backgroundColor = isInd ? '#FF9800' : '#4CAF50';
                            modalToggle.innerHTML = isInd ? '🔓' : '🔗';
                            modalToggle.title = isInd ? 'Modo: Independiente' : 'Modo: Dependiente';
                        }, 50);
                    }
                };
            }
        }

        const measureNumSpan = document.getElementById('midi-editor-measure-num');
        if (measureNumSpan) {
            measureNumSpan.innerHTML = ''; // Clear content

            // Left Arrow
            const leftBtn = document.createElement('button');
            leftBtn.innerHTML = '&lt;';
            leftBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 1.2em;
                cursor: pointer;
                padding: 0 10px;
                color: ${measureIndex > 0 ? '#333' : '#ccc'};
            `;
            leftBtn.disabled = measureIndex <= 0;
            leftBtn.onclick = () => {
                if (measureIndex > 0) {
                    // 1. Auto-accept current changes to save them
                    midiEditorAccept.click();

                    // 2. Initial delay to ensure save completes (accept logic is sync but robust checks help)
                    setTimeout(() => {
                        // 3. Swap measures in BDI
                        const bars = window.bdi.bar;
                        const temp = bars[measureIndex];
                        bars[measureIndex] = bars[measureIndex - 1];
                        bars[measureIndex - 1] = temp;

                        // 4. Update Player and UI
                        window.rebuildRecordi();
                        if (typeof window.applyTextLayer === 'function') window.applyTextLayer();

                        // Update Highlight
                        if (typeof window.highlightMeasure === 'function') window.highlightMeasure(measureIndex - 1);

                        // 5. Re-open editor at new index (swapped position)
                        // The user wants to "follow" the measure they are moving
                        window.openMidiEditor(measureIndex - 1);
                    }, 50);
                }
            };
            measureNumSpan.appendChild(leftBtn);

            // Measure Text
            const textSpan = document.createElement('span');
            textSpan.textContent = `#${measureIndex + 1}`;
            measureNumSpan.appendChild(textSpan);

            // Right Arrow
            const rightBtn = document.createElement('button');
            rightBtn.innerHTML = '&gt;';
            rightBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 1.2em;
                cursor: pointer;
                padding: 0 10px;
                color: ${measureIndex < window.bdi.bar.length - 1 ? '#333' : '#ccc'};
            `;
            rightBtn.disabled = measureIndex >= window.bdi.bar.length - 1;
            rightBtn.onclick = () => {
                if (measureIndex < window.bdi.bar.length - 1) {
                    // 1. Auto-accept current changes
                    midiEditorAccept.click();

                    setTimeout(() => {
                        // 2. Swap measures
                        const bars = window.bdi.bar;
                        const temp = bars[measureIndex];
                        bars[measureIndex] = bars[measureIndex + 1];
                        bars[measureIndex + 1] = temp;

                        // 3. Update Player and UI
                        window.rebuildRecordi();
                        if (typeof window.applyTextLayer === 'function') window.applyTextLayer();

                        // Update Highlight
                        if (typeof window.highlightMeasure === 'function') window.highlightMeasure(measureIndex + 1);

                        // 4. Re-open editor at new index
                        window.openMidiEditor(measureIndex + 1);
                    }, 50);
                }
            };
            measureNumSpan.appendChild(rightBtn);

            // Duplicate Button
            const duplicateBtn = document.createElement('button');
            duplicateBtn.innerHTML = '&#x2750;'; // Squared Copy/Duplicate icon
            duplicateBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 1.2em;
                cursor: pointer;
                padding: 0 10px;
                color: #333;
                margin-left: 10px; 
            `;
            duplicateBtn.title = "Duplicar compás";
            duplicateBtn.onclick = () => {
                // 1. Auto-accept current changes
                midiEditorAccept.click();

                setTimeout(() => {
                    // 2. Clone current measure (Deep copy)
                    const currentMeasure = window.bdi.bar[measureIndex];
                    const newMeasure = JSON.parse(JSON.stringify(currentMeasure));

                    // 3. Insert after current
                    window.bdi.bar.splice(measureIndex + 1, 0, newMeasure);

                    // 4. Update everything
                    window.rebuildRecordi();
                    if (typeof window.applyTextLayer === 'function') window.applyTextLayer();
                    if (typeof window.highlightMeasure === 'function') window.highlightMeasure(measureIndex + 1);

                    // 5. Open editor for the NEW duplicate (measureIndex + 1)
                    window.openMidiEditor(measureIndex + 1);
                }, 50);
            };
            measureNumSpan.appendChild(duplicateBtn);

            // Split Button
            const splitBtn = document.createElement('button');
            splitBtn.innerHTML = '⬊'; // Ladder down icon
            splitBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 1.2em;
                cursor: pointer;
                padding: 0 10px;
                color: #333;
                margin-left: 5px; 
            `;
            splitBtn.title = "Separar voces en 4 compases";
            splitBtn.onclick = () => {
                // 1. Auto-accept current changes
                midiEditorAccept.click();

                setTimeout(() => {
                    // 2. Get current measure
                    const currentMeasure = window.bdi.bar[measureIndex];

                    // Check if measure has multi-voice structure
                    if (!currentMeasure.voci || !Array.isArray(currentMeasure.voci)) {
                        alert('Este compás no tiene estructura de múltiples voces');
                        return;
                    }

                    // 3. Create 4 new measures, one for each voice
                    const voiceOrder = ['s', 'a', 't', 'b']; // Soprano, Alto, Tenor, Bajo
                    const newMeasures = [];

                    voiceOrder.forEach((activeVoiceCode, voiceIndex) => {
                        // Clone the entire measure
                        const newMeasure = JSON.parse(JSON.stringify(currentMeasure));

                        // For each voice in the new measure
                        newMeasure.voci.forEach(voice => {
                            if (voice.nami !== activeVoiceCode) {
                                // This is NOT the active voice - silence all notes
                                // Convert all tipis values to negative (silence)
                                if (voice.tipis && Array.isArray(voice.tipis)) {
                                    voice.tipis = voice.tipis.map(tipi => -Math.abs(tipi));
                                }
                                // Also set nimidi to 0 for clarity (though negative tipis is what matters)
                                if (voice.nimidi && Array.isArray(voice.nimidi)) {
                                    voice.nimidi = voice.nimidi.map(() => 0);
                                }
                            }
                            // If voice.nami === activeVoiceCode, leave it unchanged (active)
                        });

                        newMeasures.push(newMeasure);
                    });

                    // 4. Replace current measure with the 4 new measures
                    window.bdi.bar.splice(measureIndex, 1, ...newMeasures);

                    // 5. Update everything
                    window.rebuildRecordi();
                    if (typeof window.applyTextLayer === 'function') window.applyTextLayer();
                    if (typeof window.highlightMeasure === 'function') window.highlightMeasure(measureIndex);

                    // 6. Open editor for the first split measure
                    window.openMidiEditor(measureIndex);
                }, 50);
            };
            measureNumSpan.appendChild(splitBtn);

            // Silence All Notes Button (🔇)
            const silenceAllBtn = document.createElement('button');
            silenceAllBtn.innerHTML = '🔇'; // Mute/Silence icon
            silenceAllBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 1.0em;
                cursor: pointer;
                padding: 0 10px;
                color: #333;
                margin-left: 5px; 
            `;
            silenceAllBtn.title = "Silenciar todas las notas (convertir a silencios)";
            silenceAllBtn.onclick = () => {
                // Get current input
                const singleInput = document.getElementById('midi-single-input');
                if (!singleInput) return;

                // Get current notes
                const currentNotes = singleInput.value.trim().split(/\s+/).map(v => parseInt(v)).filter(v => !isNaN(v));

                if (currentNotes.length === 0) return;

                // Convert all notes to negative (silences)
                const silencedNotes = currentNotes.map(note => -Math.abs(note));

                // Update input with silenced notes
                singleInput.value = silencedNotes.join(' ');

                // Update the preview
                const currentAbsNotes = silencedNotes.map(Math.abs);
                renderMidiScorePreview(currentAbsNotes, rhythmValues, rhythmContainer);

                // Auto-click the Accept button to apply changes
                setTimeout(() => {
                    midiEditorAccept.click();
                }, 100);
            };
            measureNumSpan.appendChild(silenceAllBtn);

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&#x1F5D1;'; // Trash can
            deleteBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 1.2em;
                cursor: pointer;
                padding: 0 10px;
                color: #333; /* Changed to black as requested */
                margin-left: 5px; 
            `;
            deleteBtn.title = "Eliminar compás";
            deleteBtn.onclick = () => {
                console.log('🗑️ MODAL DELETE BUTTON CLICKED!');
                console.log('🔍 voiceEditMode =', voiceEditMode);
                console.log('🔍 measureIndex =', measureIndex);

                // Use mode-aware deletion
                if (typeof window.deleteMeasureWithMode === 'function') {
                    console.log('✅ Using deleteMeasureWithMode');
                    window.deleteMeasureWithMode(measureIndex);

                    // Log the measure after deletion to verify
                    console.log('🔍 Measure after delete:', window.bdi.bar[measureIndex]);
                } else {
                    console.warn('⚠️ deleteMeasureWithMode not found, using direct deletion');
                    window.bdi.bar.splice(measureIndex, 1);
                }

                // Update everything
                console.log('🔄 Rebuilding recordi...');
                window.rebuildRecordi();

                console.log('🔄 Applying text layer...');
                if (typeof window.applyTextLayer === 'function') {
                    window.applyTextLayer();
                }

                // Force notepad refresh if available
                if (typeof window.np6 !== 'undefined' && typeof window.np6._render === 'function') {
                    console.log('🔄 Forcing notepad render...');
                    window.np6._render();
                }

                // Note: Modal is now always visible, no need to close
                // Just reset the editing index
                window.currentEditingMeasureIndex = -1;
            };
            measureNumSpan.appendChild(deleteBtn);
        }

        // Clear previous inputs
        midiInputsContainer.innerHTML = '';

        // Get MIDI values - handle both single voice and multi-voice structure
        let midiValues = [];
        let rhythmValues = [];

        if (measure.voci && Array.isArray(measure.voci)) {
            // Multi-voice structure - get current selected voice
            const voiceSelector = document.getElementById('voice-selector');
            // Voice selector already returns 's', 'a', 't', 'b' directly
            const voiceCode = voiceSelector ? voiceSelector.value : 's';

            const voice = measure.voci.find(v => v.nami === voiceCode);
            midiValues = voice ? (voice.nimidi || []) : [];
            rhythmValues = voice ? (voice.tipis || []) : [];
        } else {
            // Single voice structure
            midiValues = measure.nimidi || [];
            rhythmValues = measure.tipis || [];
        }

        // Store rhythm values in persistent variable for access by accept button and color scale handlers
        window.currentEditingRhythmValues = [...rhythmValues];

        // Helper function to calculate vertical position based on MIDI note
        // Each line/space on the staff = one diatonic scale degree
        // Staff lines from bottom to top: E4, G4, B4, D5, F5 (in treble clef)
        const calculateNotePosition = (midiNote) => {
            // Map MIDI notes to their position on the staff
            // Using C major scale as reference (white keys on piano)

            const noteInOctave = midiNote % 12; // 0=C, 1=C#, 2=D, etc.
            const octave = Math.floor(midiNote / 12);

            // Map note to diatonic position (C=0, D=1, E=2, F=3, G=4, A=5, B=6)
            // For chromatic notes (sharps/flats), we use the closest natural note
            const noteToDiatonic = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]; // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
            const diatonicPosition = noteToDiatonic[noteInOctave];

            // Calculate absolute diatonic position from MIDI 60 (C4)
            // C4 (MIDI 60) = diatonic position 0 in octave 4
            const absolutePosition = (octave * 7) + diatonicPosition;
            const referencePosition = (4 * 7) + 0; // C4 = octave 4, position 0 (C)

            // Bravura staff at 24px font-size has 4 spaces total height
            // Each space = 24px / 4 = 6px
            // Each diatonic step should be 6px (one full space, not half)
            const pixelsPerStep = 6;
            const offset = (referencePosition - absolutePosition) * pixelsPerStep; // No additional adjustment

            return offset;
        };

        // EXTRACCIÓN: Función para renderizar la partitura
        const renderMidiScorePreview = (midiVals, rhythmVals, container) => {
            container.innerHTML = '';

            // Add hover effect to indicate it's clickable
            container.addEventListener('mouseenter', () => {
                container.style.background = '#f5f5f5';
            });
            container.addEventListener('mouseleave', () => {
                container.style.background = '#fff';
            });

            // Create staff lines manually with Bravura spacing
            // Shifted down to top: 20px to fit Treble Clef
            const staffLines = document.createElement('div');
            staffLines.style.cssText = `
                position: absolute;
                top: 20px;
                left: 10px;
                right: 10px;
                height: 24px;
                pointer-events: none;
            `;

            // Add 5 staff lines with 6px spacing
            for (let i = 0; i < 5; i++) {
                const line = document.createElement('div');
                line.style.cssText = `
                    position: absolute;
                    top: ${i * 6}px;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: #333;
                `;
                staffLines.appendChild(line);
            }

            container.appendChild(staffLines);

            // Add treble clef
            const trebleClef = document.createElement('div');
            trebleClef.innerHTML = '&#xE050;'; // gClef
            trebleClef.style.cssText = `
                position: absolute;
                left: 15px;
                top: -10px; /* Shifted from -18 to -10 (approx +8px) */
                font-family: "Bravura";
                font-size: 24px;
                color: #000 !important;
                pointer-events: none;
                z-index: 2;
            `;

            container.appendChild(trebleClef);

            // Add bass clef staff (shifted to 56px)
            const bassStaffLines = document.createElement('div');
            bassStaffLines.style.cssText = `
                position: absolute;
                top: 56px;
                left: 10px;
                right: 10px;
                height: 24px;
                pointer-events: none;
            `;

            // Add 5 bass staff lines with 6px spacing
            for (let i = 0; i < 5; i++) {
                const line = document.createElement('div');
                line.style.cssText = `
                    position: absolute;
                    top: ${i * 6}px;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: #333;
                `;
                bassStaffLines.appendChild(line);
            }

            container.appendChild(bassStaffLines);

            // Add bass clef - shifted +8px (6 -> 14)
            const bassClef = document.createElement('div');
            bassClef.innerHTML = '&#xE062;'; // fClef
            bassClef.style.cssText = `
                position: absolute;
                left: 15px;
                top: 14px;
                font-family: "Bravura";
                font-size: 24px;
                color: #000 !important;
                pointer-events: none;
                z-index: 2;
            `;

            container.appendChild(bassClef);

            // Container for notes (positioned absolutely within container)
            const notesContainer = document.createElement('div');
            notesContainer.style.cssText = `
                position: relative;
                display: flex;
                gap: 6px;
                align-items: center;
                justify-content: center;
                z-index: 1;
                width: 100%;
                padding-left: 60px;
            `;

            container.appendChild(notesContainer);

            // 2. Create Rhythm Visuals
            midiVals.forEach((midiValue, index) => {
                // Visual Rhythm - Use safe access for rhythmValues
                // If notes added, reuse last rhythm or default to '4'
                let rhythmVal = rhythmVals[index];
                if (typeof rhythmVal === 'undefined') {
                    rhythmVal = (rhythmVals.length > 0) ? rhythmVals[rhythmVals.length - 1] : '4';
                }

                const rhythmChar = noteMap[rhythmVal] || '?';

                // Calculate vertical position based on MIDI note
                const verticalOffset = calculateNotePosition(midiValue);

                // Determine if ledger lines are needed - only for MIDI 60 and 61 (C and C#)
                // Draw exactly 1 ledger line for these notes
                const needsLedgerLines = (midiValue === 60 || midiValue === 61);

                // Create a container for note + ledger lines
                // Use flex to center everything (note and ledger lines)
                const noteWrapper = document.createElement('span');
                noteWrapper.style.cssText = `
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    width: 30px; 
                `;

                // Add ledger lines if needed (only for MIDI 60 and 61)
                if (needsLedgerLines) {
                    const rhythmValStr = String(rhythmVal); // Ensure string comparison

                    // Use U+E023 (ledgerLineWide) for whole notes ('1'), U+E022 for others
                    const ledgerGlyph = (rhythmValStr === '1') ? '&#xE023;' : '&#xE022;';

                    let marginLeft = '0';
                    if (['4', '8'].includes(rhythmValStr)) {
                        marginLeft = '-3px';
                    } else if (rhythmValStr === '2') {
                        marginLeft = '0'; // Adjusted to 0 per user request
                    }

                    // Draw exactly one ledger line at -21px
                    // Centered by flex parent plus adjustment
                    const ledgerLine = document.createElement('div');
                    ledgerLine.innerHTML = ledgerGlyph;
                    ledgerLine.style.cssText = `
                        position: absolute;
                        top: 10px;
                        left: 0;
                        margin-left: ${marginLeft};
                        width: 100%;
                        text-align: center;
                        font-family: "Bravura";
                        font-size: 24px;
                        color: #000 !important;
                        pointer-events: none;
                        z-index: 10;
                    `;
                    noteWrapper.appendChild(ledgerLine);
                }

                const rhythmSpan = document.createElement('span');
                rhythmSpan.innerHTML = rhythmChar;
                rhythmSpan.style.cssText = `
                    font-family: "Bravura";
                    font-size: 24px;
                    color: #000 !important;
                    min-width: 15px;
                    text-align: center;
                    position: relative;
                    top: ${verticalOffset * 0.5 + 31}px; /* Adjusted: +31px to fix C4 position */
                    display: inline-block;
                    pointer-events: none;
                `;

                // Detect and add sharp directly to rhythmSpan so it moves with it
                const noteInOctave = midiValue % 12;
                const sharpNotes = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#
                if (sharpNotes.includes(noteInOctave)) {
                    const sharpSign = document.createElement('div');
                    sharpSign.innerHTML = '&#xE262;'; // Bravura sharp glyph
                    sharpSign.style.cssText = `
                        position: absolute;
                        top: 0px; /* Adjusted: -6px was one line too high. trying 0px. */
                        left: 50%; /* Anchor to the center of the note head */
                        margin-left: -16px; /* Pull left to position correctly next to head */
                        font-family: "Bravura";
                        font-size: 24px;
                        color: #000 !important;
                        pointer-events: none;
                        z-index: 10;
                    `;
                    rhythmSpan.appendChild(sharpSign);
                }
                rhythmSpan.title = `MIDI: ${midiValue}, Index: ${index}, Rhythm: ${rhythmVal}`;

                noteWrapper.appendChild(rhythmSpan);
                notesContainer.appendChild(noteWrapper);
            });
        };

        // 1. Create Rhythm Display Container with Staff Background (Bravura Font)
        const rhythmContainer = document.createElement('div');
        rhythmContainer.style.cssText = `
            position: relative;
            display: flex;
            gap: 6px;
            margin-bottom: 15px;
            flex-wrap: nowrap;
            justify-content: flex-start;
            align-items: center;
            background: #fff;
            padding: 0; 
            height: 80px; 
            box-sizing: border-box;
            border-radius: 4px;
            overflow-x: auto;
            cursor: pointer;
            transition: background 0.2s;
        `;

        // Store original values for Revert functionality
        const originalMidiValues = [...midiValues];
        // Note: rhythmValues generally don't change in this modal but we keep reference just in case
        const originalRhythmValues = [...rhythmValues];

        // RENDER EXECUTED
        renderMidiScorePreview(midiValues, rhythmValues, rhythmContainer);


        // REMOVED INLINE RENDERING - now using renderMidiScorePreview

        // Add rhythm container to main container
        midiInputsContainer.appendChild(rhythmContainer);

        // Add click handler to play the entire measure using tuci()
        rhythmContainer.addEventListener('click', () => {
            console.log('🖱️ Staff clicked!');
            // Need to get CURRENT values from input, not potentially stale closure variables
            const currentInput = document.getElementById('midi-single-input');
            const currentMidiStr = currentInput ? currentInput.value.trim() : '';
            let currentMidiVals = [];

            if (currentMidiStr) {
                currentMidiVals = currentMidiStr.split(/\s+/).map(v => parseInt(v)).filter(v => !isNaN(v)).map(Math.abs);
            } else {
                currentMidiVals = [...midiValues]; // Fallback
            }

            console.log('🎵 Playing measure with', currentMidiVals.length, 'notes using tuci()');

            if (currentMidiVals.length === 0) {
                return;
            }

            // Create basi structure for tuci()
            // basi is an array of objects with nimidi, tipis, and dinami
            const basi = [{
                nimidi: currentMidiVals,
                tipis: rhythmValues, // Reuse rhythm structure
                dinami: new Array(currentMidiVals.length).fill(127) // Max velocity
            }];

            // Call tuci() to play the notes
            if (typeof window.tuci === 'function') {
                window.tuci(basi, 0);
            } else {
                console.error('❌ tuci() function not found');
            }
        });

        // 3. Create Header (Label + Transposition + Generators)

        // PREPARE REVERT LOGIC
        const btnContainer = document.getElementById('midi-editor-cancel').parentElement;
        const existingRevert = document.getElementById('midi-editor-revert-dynamic');
        if (existingRevert) existingRevert.remove();

        const revertBtn = document.createElement('button');
        revertBtn.id = 'midi-editor-revert-dynamic';
        revertBtn.textContent = 'Revertir';
        revertBtn.style.cssText = 'background: #FF9800; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-family: monospace; font-weight: bold; cursor: pointer; margin-right: 10px;';

        revertBtn.onclick = () => {
            console.log('↺ Reverting to original:', originalMidiValues);
            const singleInput = document.getElementById('midi-single-input');
            if (singleInput) {
                singleInput.value = originalMidiValues.map((val, i) => {
                    const isRest = originalRhythmValues[i] < 0;
                    return isRest ? -val : val;
                }).join(' ');
            }

            // Also revert rhythm input
            const rhythmInput = document.getElementById('rhythm-values-input');
            if (rhythmInput) {
                rhythmInput.value = originalRhythmValues.join(' ');
                window.currentEditingRhythmValues = [...originalRhythmValues];
            }

            renderMidiScorePreview(originalMidiValues, originalRhythmValues, rhythmContainer);
        };
        btnContainer.insertBefore(revertBtn, btnContainer.firstChild);


        // === HEADER CONTAINER (Label + Controls) ===
        const headerContainer = document.createElement('div');
        headerContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; flex-wrap: wrap;';

        const singleInputLabel = document.createElement('label');
        singleInputLabel.textContent = 'Notas MIDI:';
        singleInputLabel.style.cssText = 'font-family: monospace; font-weight: bold; color: #333; margin: 0; margin-right: 10px;';

        const controlsContainer = document.createElement('div');
        controlsContainer.style.cssText = 'display: flex; gap: 5px; align-items: center;';

        headerContainer.appendChild(singleInputLabel);
        headerContainer.appendChild(controlsContainer);
        midiInputsContainer.appendChild(headerContainer);


        // === INPUT FIELD ===
        const singleInput = document.createElement('input');
        singleInput.type = 'text';
        singleInput.id = 'midi-single-input';
        singleInput.value = midiValues.map((val, i) => {
            const isRest = rhythmValues[i] < 0;
            return isRest ? -val : val;
        }).join(' ');
        singleInput.style.cssText = 'width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; font-size: 16px; margin-bottom: 5px; box-sizing: border-box;';

        singleInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (!val) {
                renderMidiScorePreview([], [], rhythmContainer);
                return;
            }
            const currentNotes = val.split(/\s+/).map(v => parseInt(v)).filter(v => !isNaN(v)).map(Math.abs);
            renderMidiScorePreview(currentNotes, rhythmValues, rhythmContainer);
        });
        midiInputsContainer.appendChild(singleInput);

        // === RHYTHM VALUES INPUT FIELD ===
        const rhythmInputLabel = document.createElement('label');
        rhythmInputLabel.textContent = 'Tiempos (tipis):';
        rhythmInputLabel.style.cssText = 'display:none;font-family: monospace; font-weight: bold; color: #333; margin-top: 10px; display: block;';

        const rhythmInput = document.createElement('input');
        rhythmInput.type = 'text';
        rhythmInput.id = 'rhythm-values-input';
        rhythmInput.value = rhythmValues.join(' ');
        rhythmInput.style.cssText = 'display:none;width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; font-size: 16px; margin-bottom: 5px; box-sizing: border-box;';

        rhythmInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (!val) {
                window.currentEditingRhythmValues = [];
                return;
            }

            // Parse rhythm values (allow negative for rests)
            const newRhythmValues = val.split(/\s+/).map(v => parseInt(v)).filter(v => !isNaN(v));
            window.currentEditingRhythmValues = newRhythmValues;

            // Synchronize MIDI notes count with rhythm values count
            const currentInput = document.getElementById('midi-single-input');
            if (currentInput) {
                const currentMidiStr = currentInput.value.trim();
                let currentNotes = [];

                if (currentMidiStr) {
                    currentNotes = currentMidiStr.split(/\s+/).map(v => parseInt(v)).filter(v => !isNaN(v));
                }

                // Adjust MIDI notes to match rhythm values count
                const targetCount = newRhythmValues.length;

                if (currentNotes.length < targetCount) {
                    // Need more notes - repeat the last note or use default (60)
                    const lastNote = currentNotes.length > 0 ? currentNotes[currentNotes.length - 1] : 60;
                    while (currentNotes.length < targetCount) {
                        currentNotes.push(lastNote);
                    }
                } else if (currentNotes.length > targetCount) {
                    // Too many notes - trim to match
                    currentNotes = currentNotes.slice(0, targetCount);
                }

                // Update MIDI input with synchronized notes
                currentInput.value = currentNotes.join(' ');

                // Update preview with synchronized notes and new rhythm values
                const absNotes = currentNotes.map(Math.abs);
                renderMidiScorePreview(absNotes, newRhythmValues, rhythmContainer);

                console.log('🎵 Synchronized - Rhythm:', newRhythmValues.length, 'MIDI:', currentNotes.length);
            }
        });

        midiInputsContainer.appendChild(rhythmInputLabel);
        midiInputsContainer.appendChild(rhythmInput);

        // === RHYTHM MOD CONFIGURATION ===
        const rhythmModRow = document.createElement('div');
        rhythmModRow.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 5px;';

        const x2Btn = document.createElement('button');
        x2Btn.textContent = 'x2 Diminución';
        x2Btn.title = "Duplicar notas y reducir duración a la mitad";
        x2Btn.style.cssText = 'background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 4px; font-family: monospace; cursor: pointer; font-size: 12px;';

        x2Btn.onclick = () => {
            // 1. Get current parsed notes from input (to account for manual edits)
            const val = singleInput.value.trim();
            if (!val) return;

            // Parse current notes (handling negative/rests)
            const currentNotes = val.split(/\s+/).map(v => parseInt(v)).filter(v => !isNaN(v));

            // 2. Double the notes sequence
            const newNotes = [...currentNotes, ...currentNotes];

            // 3. Update Rhythm Values (Halve duration = Increment logic index)
            // Musicoli Logic: 1=Whole, 2=Half, 3=Quarter, 4=Eighth, 5=16th
            // Dotted: 25=HalfDot, 35=QuarterDot, 45=EighthDot

            const getNextDuration = (val) => {
                const sign = val < 0 ? -1 : 1;
                const absVal = Math.abs(val);
                let nextAbs;

                if (absVal >= 10) {
                    // Dotted values (e.g. 25 -> 35, 35 -> 45)
                    nextAbs = absVal + 10;
                } else {
                    // Regular values (e.g. 1 -> 2, 2 -> 3, 3 -> 4)
                    nextAbs = absVal + 1;
                }

                // Cap at 16th (5 or 55) to prevent invalid codes
                if (nextAbs > 5 && nextAbs < 10) nextAbs = 5;
                if (nextAbs > 55) nextAbs = 55;

                return nextAbs * sign;
            };

            // Ensure window.currentEditingRhythmValues matches current notes length before doubling
            while (window.currentEditingRhythmValues.length < currentNotes.length) {
                window.currentEditingRhythmValues.push(window.currentEditingRhythmValues.length > 0 ? window.currentEditingRhythmValues[window.currentEditingRhythmValues.length - 1] : 4);
            }
            if (window.currentEditingRhythmValues.length > currentNotes.length) {
                window.currentEditingRhythmValues = window.currentEditingRhythmValues.slice(0, currentNotes.length);
            }

            // Create new rhythm array: [original..., original...] mapped to next duration
            const doubledRhythm = [...window.currentEditingRhythmValues, ...window.currentEditingRhythmValues].map(getNextDuration);

            // Update the persistent variable so accept button uses the new rhythm
            window.currentEditingRhythmValues = doubledRhythm;

            // Also update local rhythmValues for preview rendering
            rhythmValues = doubledRhythm;

            // 4. Update Input and Preview
            updateInputAndRecalc(newNotes);

            console.log('✨ x2 Diminution Applied: duration halved (index incremented), sequence doubled.');
        };


        rhythmModRow.appendChild(x2Btn);
        midiInputsContainer.appendChild(rhythmModRow);

        // === BOTTOM ROW (Color Controls) ===
        const bottomRow = document.createElement('div');
        bottomRow.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 10px;';
        midiInputsContainer.appendChild(bottomRow);


        // === SHARED HELPERS ===
        const updateInputAndRecalc = (newNotes) => {
            const singleInput = document.getElementById('midi-single-input');
            if (singleInput) {
                singleInput.value = newNotes.join(' ');
            }
            const currentAbsNotes = newNotes.map(Math.abs);
            renderMidiScorePreview(currentAbsNotes, rhythmValues, rhythmContainer);

            const recalcBtn = bottomRow.querySelector('button[title="Recalcular color basado en notas"]');
            if (recalcBtn) recalcBtn.click();

            // Playback (tuci)
            if (typeof window.tuci === 'function') {
                const tips = [...rhythmValues];
                const basi = [{
                    nimidi: currentAbsNotes,
                    tipis: tips,
                    dinami: new Array(currentAbsNotes.length).fill(127)
                }];
                window.tuci(basi, 0);
            }
        };

        const getCurrentNotes = () => {
            const singleInput = document.getElementById('midi-single-input');
            if (!singleInput) return [];
            return singleInput.value.trim().split(/\s+/).map(v => parseInt(v)).filter(v => !isNaN(v));
        };

        // --- TRANSPOSITION BUTTONS ---
        const createHeaderBtn = (text, title, action) => {
            const btn = document.createElement('button');
            btn.innerHTML = text;
            btn.title = title;
            btn.style.cssText = 'cursor: pointer; padding: 2px 5px; border: 1px solid #999; border-radius: 4px; background: #fff; font-size: 11px; flex-shrink: 0; min-width: 24px;';
            btn.onclick = action;
            return btn;
        };

        // Scale +1
        controlsContainer.appendChild(createHeaderBtn('+E', 'Subir un grado en escala', () => {
            if (typeof ininoti !== 'function') { alert('Error: ininoti not found'); return; }
            const currentNotes = getCurrentNotes();
            if (currentNotes.length === 0) return;
            const { scaleNotesInRange } = ininoti();
            const scaleMidis = scaleNotesInRange.map(n => n.midi);

            const newNotes = currentNotes.map(note => {
                const isRest = note < 0;
                const absNote = Math.abs(note);
                let idx = scaleMidis.indexOf(absNote);
                let newAbs = absNote;
                if (idx !== -1) {
                    if (idx < scaleMidis.length - 1) newAbs = scaleMidis[idx + 1];
                    else newAbs = absNote + 12;
                } else {
                    const next = scaleMidis.find(n => n > absNote);
                    if (next) newAbs = next;
                    else newAbs = absNote + 1;
                }
                return isRest ? -newAbs : newAbs;
            });
            updateInputAndRecalc(newNotes);
        }));

        // Scale -1
        controlsContainer.appendChild(createHeaderBtn('-E', 'Bajar un grado en escala', () => {
            if (typeof ininoti !== 'function') { alert('Error: ininoti not found'); return; }
            const currentNotes = getCurrentNotes();
            if (currentNotes.length === 0) return;
            const { scaleNotesInRange } = ininoti();
            const scaleMidis = scaleNotesInRange.map(n => n.midi);

            const newNotes = currentNotes.map(note => {
                const isRest = note < 0;
                const absNote = Math.abs(note);
                let idx = scaleMidis.indexOf(absNote);
                let newAbs = absNote;
                if (idx !== -1) {
                    if (idx > 0) newAbs = scaleMidis[idx - 1];
                } else {
                    for (let i = scaleMidis.length - 1; i >= 0; i--) {
                        if (scaleMidis[i] < absNote) {
                            newAbs = scaleMidis[i];
                            break;
                        }
                    }
                }
                return isRest ? -newAbs : newAbs;
            });
            updateInputAndRecalc(newNotes);
        }));

        // Octave +1
        controlsContainer.appendChild(createHeaderBtn('+12', 'Subir octava', () => {
            const currentNotes = getCurrentNotes();
            updateInputAndRecalc(currentNotes.map(n => {
                const isRest = n < 0;
                const v = Math.abs(n) + 12;
                return (v > 127) ? (isRest ? -(v - 12) : (v - 12)) : (isRest ? -v : v);
            }));
        }));

        // Octave -1
        controlsContainer.appendChild(createHeaderBtn('-12', 'Bajar octava', () => {
            const currentNotes = getCurrentNotes();
            updateInputAndRecalc(currentNotes.map(n => {
                const isRest = n < 0;
                const v = Math.abs(n) - 12;
                return (v < 0) ? (isRest ? -Math.abs(n) : Math.abs(n)) : (isRest ? -v : v);
            }));
        }));


        // --- PATTERN GENERATORS ---
        const genControls = document.createElement('div');
        genControls.style.cssText = 'display: flex; gap: 2px; align-items: center; margin-left: 5px; border-left: 1px solid #ccc; padding-left: 5px;';

        const getScaleInfo = () => {
            if (typeof ininoti !== 'function') return null;
            const { scaleNotesInRange } = ininoti();
            return scaleNotesInRange.map(n => n.midi);
        };
        const getClosestScaleNote = (targetMidi, scaleMidis) => {
            if (!scaleMidis || scaleMidis.length === 0) return Math.round(targetMidi);
            return scaleMidis.reduce((prev, curr) => Math.abs(curr - targetMidi) < Math.abs(prev - targetMidi) ? curr : prev);
        };
        const getScaleIndex = (note, scaleMidis) => scaleMidis.findIndex(n => n === note);

        const applyScaleGen = (type, origin) => {
            const currentNotes = getCurrentNotes();
            if (currentNotes.length < 2) return;
            const scaleMidis = getScaleInfo();
            if (!scaleMidis) { alert('Error: Scale info not found'); return; }

            const absNotes = currentNotes.map(Math.abs);
            const startVal = (origin === 'start') ? absNotes[0] : absNotes[absNotes.length - 1];
            let startIndex = getScaleIndex(startVal, scaleMidis);
            if (startIndex === -1) {
                const closest = getClosestScaleNote(startVal, scaleMidis);
                startIndex = getScaleIndex(closest, scaleMidis);
            }

            const newNotes = currentNotes.map((n, i) => {
                const isRest = n < 0;
                let newAbs = 60;
                let stepIndex = (type === 'asc') ? startIndex + i : startIndex - i;

                if (stepIndex >= 0 && stepIndex < scaleMidis.length) {
                    newAbs = scaleMidis[stepIndex];
                } else {
                    if (stepIndex < 0) newAbs = scaleMidis[0];
                    if (stepIndex >= scaleMidis.length) newAbs = scaleMidis[scaleMidis.length - 1];
                }
                return isRest ? -newAbs : newAbs;
            });
            updateInputAndRecalc(newNotes);
        };

        const applyGaussGen = (origin) => {
            const currentNotes = getCurrentNotes();
            if (currentNotes.length < 2) return;
            const scaleMidis = getScaleInfo();
            if (!scaleMidis) { alert('Error: Scale info not found'); return; }

            const absNotes = currentNotes.map(Math.abs);
            const startVal = (origin === 'start') ? absNotes[0] : absNotes[absNotes.length - 1];
            const len = currentNotes.length;
            const amplitude = 12;

            const newNotes = currentNotes.map((n, i) => {
                const isRest = n < 0;
                const pos = (len > 1) ? (i / (len - 1)) : 0;
                const curve = Math.sin(pos * Math.PI);
                const targetPitch = startVal + (curve * amplitude);
                const newAbs = getClosestScaleNote(targetPitch, scaleMidis);
                return isRest ? -newAbs : newAbs;
            });
            updateInputAndRecalc(newNotes);
        };

        const applyNormGen = (origin) => {
            const currentNotes = getCurrentNotes();
            if (currentNotes.length === 0) return;

            // Get scale info for snapping (keeps it musical)
            const scaleMidis = getScaleInfo();

            const absNotes = currentNotes.map(Math.abs);
            const targetVal = (origin === 'start') ? absNotes[0] : absNotes[absNotes.length - 1];
            const lerpFactor = 0.3; // Move 30% towards target per click

            const newNotes = currentNotes.map(n => {
                const isRest = n < 0;
                const val = Math.abs(n);

                const diff = targetVal - val;
                if (diff === 0) return n; // Already at target

                // Linear interpolation
                let move = diff * lerpFactor;

                // Force at least 1 unit of movement if not there yet
                if (Math.abs(move) < 1) {
                    move = (diff > 0) ? 1 : -1;
                }

                let newVal = Math.round(val + move);

                // Snap to scale if available
                if (scaleMidis && scaleMidis.length > 0) {
                    newVal = getClosestScaleNote(newVal, scaleMidis);
                }

                return isRest ? -newVal : newVal;
            });

            updateInputAndRecalc(newNotes);
        };

        const applyReverseGen = () => {
            const currentNotes = getCurrentNotes();
            if (currentNotes.length === 0) return;
            updateInputAndRecalc(currentNotes.reverse());
        };

        const applyInvertGen = () => {
            const currentNotes = getCurrentNotes();
            if (currentNotes.length === 0) return;
            const scaleMidis = getScaleInfo();
            const absNotes = currentNotes.map(Math.abs);
            const pivot = absNotes[0]; // Invert around start note

            const newNotes = currentNotes.map(n => {
                const isRest = n < 0;
                const val = Math.abs(n);
                let newVal = pivot - (val - pivot);

                // Snap
                if (scaleMidis && scaleMidis.length > 0) {
                    newVal = getClosestScaleNote(newVal, scaleMidis);
                }
                return isRest ? -newVal : newVal;
            });
            updateInputAndRecalc(newNotes);
        };

        genControls.appendChild(createHeaderBtn('↗️I', 'Escala Ascendente (Desde Inicio)', () => applyScaleGen('asc', 'start')));
        genControls.appendChild(createHeaderBtn('↘️I', 'Escala Descendente (Desde Inicio)', () => applyScaleGen('desc', 'start')));
        genControls.appendChild(createHeaderBtn('↘️F', 'Escala Descendente (Desde Final)', () => applyScaleGen('desc', 'end')));
        genControls.appendChild(createHeaderBtn('↗️F', 'Escala Ascendente (Desde Final)', () => applyScaleGen('asc', 'end')));
        genControls.appendChild(createHeaderBtn('∩I', 'Curva Gauss (Desde Inicio)', () => applyGaussGen('start')));
        genControls.appendChild(createHeaderBtn('∩F', 'Curva Gauss (Desde Final)', () => applyGaussGen('end')));
        genControls.appendChild(createHeaderBtn('=I', 'Normalizar (Desde Inicio)', () => applyNormGen('start')));
        genControls.appendChild(createHeaderBtn('=F', 'Normalizar (Desde Final)', () => applyNormGen('end')));

        // New Buttons
        genControls.appendChild(createHeaderBtn('⇄', 'Invertir Orden (Retrogradación)', () => applyReverseGen()));
        genControls.appendChild(createHeaderBtn('🎵↕', 'Invertir Melodía (Espejo)', () => applyInvertGen()));

        // Gradual Curve (Parabolic/Exponential)
        const applyCurveGen = (direction) => {
            const currentNotes = getCurrentNotes();
            if (currentNotes.length < 2) return;
            const scaleMidis = getScaleInfo();

            const absNotes = currentNotes.map(Math.abs);
            const startVal = absNotes[0];
            const endVal = absNotes[absNotes.length - 1];
            const len = currentNotes.length;

            // Define Target End based on direction and current state (Progressive Expansion)
            let targetEnd;
            if (direction === 'asc') {
                // If currently lower than start, try to flip to positive range, else expand up
                targetEnd = (endVal < startVal) ? startVal + 5 : endVal + 3;
            } else {
                // Descending
                targetEnd = (endVal > startVal) ? startVal - 5 : endVal - 3;
            }

            // Calculate Range for the Parabolic Curve
            const range = targetEnd - startVal;

            const newNotes = currentNotes.map((n, i) => {
                const isRest = n < 0;
                const val = Math.abs(n);

                // Target Curve: Parabolic t^2
                // t goes from 0 to 1
                const t = i / (len - 1);

                // Apply Power Curve (2 = Parabolic, could use Math.pow(t, 2))
                // This ensures the curve starts flat and steepens (accelerates) towards the moving end
                const curvePos = t * t;

                const perfectPitch = startVal + (range * curvePos);

                // Lerp towards the perfect pitch
                // Use a high lerp factor since the 'targetEnd' itself is moving gradually (we defined targetEnd relative to current)
                // Actually, to make it stable, we should treat targetEnd as a goal.
                // But the request says "progressively increase separation". 
                // So we move notes *towards* this new expanded shape.

                const diff = perfectPitch - val;

                // Move note
                // We simply move 50% towards the new shape to make it feel responsive but smooth
                let move = diff * 0.5;

                // Ensure min movement if far
                if (Math.abs(diff) > 0.5 && Math.abs(move) < 1) move = (diff > 0) ? 1 : -1;

                let newVal = Math.round(val + move);

                if (scaleMidis && scaleMidis.length > 0) {
                    newVal = getClosestScaleNote(newVal, scaleMidis);
                }
                return isRest ? -newVal : newVal;
            });
            updateInputAndRecalc(newNotes);
        };

        genControls.appendChild(createHeaderBtn('⤴', 'Curva Exp. Ascendente (Gradual)', () => applyCurveGen('asc')));
        genControls.appendChild(createHeaderBtn('⤵', 'Curva Exp. Descendente (Gradual)', () => applyCurveGen('desc')));

        // Linear Line Generator
        const applyLineGen = (direction) => {
            const currentNotes = getCurrentNotes();
            if (currentNotes.length < 2) return;
            const scaleMidis = getScaleInfo();

            const absNotes = currentNotes.map(Math.abs);
            const startVal = absNotes[0];
            const endVal = absNotes[absNotes.length - 1];
            const len = currentNotes.length;

            let targetEnd;
            // Logic: Move the END note (scale-wise) and interpolate the rest
            if (scaleMidis && scaleMidis.length > 0) {
                // Find current end index in scale
                let idx = scaleMidis.indexOf(endVal);
                let nextVal = endVal;

                if (idx !== -1) {
                    // In scale -> move up/down index
                    if (direction === 'asc') {
                        if (idx < scaleMidis.length - 1) nextVal = scaleMidis[idx + 1];
                        else nextVal = endVal + 12; // Rollover octave? Or max limit? Let's just +12 to keep expanding
                    } else {
                        if (idx > 0) nextVal = scaleMidis[idx - 1];
                        else nextVal = endVal - 12;
                    }
                } else {
                    // Not in scale -> find closest and move from there
                    const closest = getClosestScaleNote(endVal, scaleMidis);
                    // If closest is different, snap to it. If same (rare if index is -1), force move 1 semitone
                    nextVal = (direction === 'asc') ? closest + 1 : closest - 1;
                    // Re-snap to be sure
                    nextVal = getClosestScaleNote(nextVal, scaleMidis);
                }
                targetEnd = nextVal;
            } else {
                // Chromatic fallback
                targetEnd = (direction === 'asc') ? endVal + 2 : endVal - 2;
            }

            const totalRange = targetEnd - startVal;

            const newNotes = currentNotes.map((n, i) => {
                const isRest = n < 0;
                // Linear interpolation: y = mx + b
                // b = startVal
                // m = totalRange / (len - 1)
                // x = i
                const t = i / (len - 1);
                const perfectPitch = startVal + (totalRange * t);

                let newVal = Math.round(perfectPitch);

                if (scaleMidis && scaleMidis.length > 0) {
                    newVal = getClosestScaleNote(newVal, scaleMidis);
                }
                return isRest ? -newVal : newVal;
            });
            updateInputAndRecalc(newNotes);
        };

        genControls.appendChild(createHeaderBtn('📈', 'Línea Ascendente (Lineal)', () => applyLineGen('asc')));
        genControls.appendChild(createHeaderBtn('📉', 'Línea Descendente (Lineal)', () => applyLineGen('desc')));

        controlsContainer.appendChild(genControls);


        // --- COLOR LOGIC (In Bottom Row) ---
        const notepadContainer = document.getElementById('notepi6');
        let bgColor = '#eee';
        let bgImage = 'none';
        let borderRadius = '4px';

        if (notepadContainer) {
            const spans = Array.from(notepadContainer.querySelectorAll('span[data-is-word-block="true"]'));
            const sourceSpan = spans[measureIndex];
            if (sourceSpan) {
                const compStyle = window.getComputedStyle(sourceSpan);
                bgColor = compStyle.backgroundColor;
                bgImage = compStyle.backgroundImage;
                borderRadius = compStyle.borderRadius;
            }
        }

        const recalcBtn = document.createElement('button');
        recalcBtn.textContent = 'Recalcular Color ↕';
        recalcBtn.title = 'Recalcular color basado en notas';
        recalcBtn.style.cssText = 'cursor: pointer; padding: 5px 10px; border: 1px solid #999; border-radius: 4px; background: #eee; font-size: 12px;';

        recalcBtn.onclick = () => {
            const singleInput = document.getElementById('midi-single-input');
            if (!singleInput) return;

            const notes = singleInput.value.trim().split(/\s+/).map(v => parseInt(v)).filter(v => !isNaN(v) && v > 0);

            let colorResult = '#cccccc'; // Default

            if (notes.length > 0) {
                if (typeof window.midiNotesToScaleColor === 'function') {
                    colorResult = window.midiNotesToScaleColor(notes);
                } else {
                    console.warn('❌ midiNotesToScaleColor function not found!');
                }
            }

            const colorSwatch = bottomRow.querySelector('.color-swatch-box');
            if (colorSwatch) {
                // Reset both properties to ensure clean state
                colorSwatch.style.backgroundImage = 'none';
                colorSwatch.style.backgroundColor = 'transparent';

                // Apply new style (works for both solid colors and gradients)
                colorSwatch.style.background = colorResult;
            }

            // Save the color string (can be hex, rgb, hsl, or gradient)
            measure.hexi = colorResult;

            // Legacy support: set coli to grey as fallback since we rely on hexi now
            measure.coli = [128, 128, 128, 255];
        };

        const colorSwatch = document.createElement('div');
        colorSwatch.className = 'color-swatch-box';
        colorSwatch.style.cssText = `
            display: block; flex-grow: 1; height: 28px;
            background-color: ${bgColor}; background-image: ${bgImage};
            border: 1px solid #999; border-radius: 4px; box-sizing: border-box; 
        `;

        bottomRow.appendChild(recalcBtn);
        bottomRow.appendChild(colorSwatch);


        // Old logic disabled
        if (false && (measure.hexi || measure.coli)) {
            const colorContainer = document.createElement('div');
            colorContainer.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-top: 5px; font-family: monospace; font-size: 12px; color: #666;';

            const colorLabel = document.createElement('span');
            colorLabel.textContent = 'Color del compás: ';

            const colorSwatch = document.createElement('span');
            let bgColor = measure.hexi || '#ccc';
            if (!measure.hexi && measure.coli) {
                bgColor = `rgb(${measure.coli[0]}, ${measure.coli[1]}, ${measure.coli[2]})`;
            }

            colorSwatch.style.cssText = `
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 1px solid #999;
                border-radius: 4px;
                background-color: ${bgColor};
            `;

            const colorText = document.createElement('span');
            colorText.textContent = bgColor;
            if (measure.nami && measure.nami.includes('#')) {
                // Try to show name if available and relevant
                colorText.textContent += ` (${measure.nami})`;
            }

            colorContainer.appendChild(colorLabel);
            colorContainer.appendChild(colorSwatch);
            colorContainer.appendChild(colorText);
            midiInputsContainer.appendChild(colorContainer);
        }

        // Show modal
        // Apply color scheme based on current edit mode
        const updateModalColors = () => {
            const isRhythmMode = (typeof editMode !== 'undefined' && editMode === 'text');
            const midiEditorContent = document.getElementById('midi-editor-content');
            const midiEditorHeader = midiEditorContent ? midiEditorContent.querySelector('div') : null;
            const midiInputsContainer = document.getElementById('midi-inputs-container');
            const midiEditorH3 = document.getElementById('midi-editor-header');

            if (isRhythmMode) {
                // Rhythm mode - Apply gray color scheme
                if (midiEditorContent) {
                    midiEditorContent.style.background = '#606060'; // Gray background
                    midiEditorContent.style.color = '#ffffff'; // White text
                }
                if (midiEditorHeader) {
                    midiEditorHeader.style.background = '#4a4a4a'; // Darker gray header
                }
                if (midiInputsContainer) {
                    midiInputsContainer.style.color = '#ffffff'; // White text in inputs container
                }
                // Update h3 header text color
                if (midiEditorH3) {
                    midiEditorH3.style.color = '#ffffff'; // White text for header
                }
                // Update header buttons (emoji icons) to white
                const measureNumSpan = document.getElementById('midi-editor-measure-num');
                if (measureNumSpan) {
                    const headerButtons = measureNumSpan.querySelectorAll('button');
                    headerButtons.forEach(btn => {
                        btn.style.color = '#ffffff'; // White icons
                    });
                }
                // Update all labels and spans inside the modal to white
                if (midiInputsContainer) {
                    const labels = midiInputsContainer.querySelectorAll('label, span, div');
                    labels.forEach(el => {
                        if (el.style.color) {
                            el.style.color = '#ffffff';
                        }
                    });
                }
                // Update buttons
                if (midiEditorAccept) {
                    midiEditorAccept.style.background = '#6b6b6b'; // Gray accept button
                }
                if (midiEditorCancel) {
                    midiEditorCancel.style.background = '#555555'; // Darker gray cancel button
                }
            } else {
                // Other modes - Restore original colors
                if (midiEditorContent) {
                    midiEditorContent.style.background = '#fff'; // White background
                    midiEditorContent.style.color = '#333'; // Dark text
                }
                if (midiEditorHeader) {
                    midiEditorHeader.style.background = '#f5f5f5'; // Light gray header
                }
                if (midiInputsContainer) {
                    midiInputsContainer.style.color = '#333'; // Dark text in inputs container
                }
                // Update h3 header text color
                if (midiEditorH3) {
                    midiEditorH3.style.color = '#333'; // Dark text for header
                }
                // Update header buttons (emoji icons) to dark
                const measureNumSpan = document.getElementById('midi-editor-measure-num');
                if (measureNumSpan) {
                    const headerButtons = measureNumSpan.querySelectorAll('button');
                    headerButtons.forEach(btn => {
                        btn.style.color = '#333'; // Dark icons
                    });
                }
                // Update all labels and spans inside the modal to dark
                if (midiInputsContainer) {
                    const labels = midiInputsContainer.querySelectorAll('label, span, div');
                    labels.forEach(el => {
                        if (el.style.color) {
                            el.style.color = '#333';
                        }
                    });
                }
                // Update buttons
                if (midiEditorAccept) {
                    midiEditorAccept.style.background = '#4CAF50'; // Green accept button
                }
                if (midiEditorCancel) {
                    midiEditorCancel.style.background = '#666'; // Gray cancel button
                }
            }
        };

        // Store the function globally so it can be called when modes change
        window.updateMidiModalColors = updateModalColors;

        // Apply colors initially
        updateModalColors();

        // Note: Modal is now always visible in right column, no need to show/hide

        // Play measure immediately using tuci()
        if (midiValues.length > 0) {
            const basi = [{
                nimidi: midiValues,
                tipis: rhythmValues,
                dinami: new Array(midiValues.length).fill(127)
            }];

            if (typeof window.tuci === 'function') {
                window.tuci(basi, 0);
            }
        }

        // Focus input
        setTimeout(() => singleInput.focus(), 50);
    };

    // Accept changes
    if (midiEditorAccept) {
        midiEditorAccept.addEventListener('click', () => {
            if (window.currentEditingMeasureIndex < 0) return;

            // Get values from single input
            const singleInput = document.getElementById('midi-single-input');

            // Parse raw values, allowing negatives
            const rawMidiValues = singleInput.value.trim().split(/\s+/).map(val => {
                const parsed = parseInt(val);
                // Allow negative definition for rests, but ensure absolute is valid MIDI (0-127)
                // We map invalid values to 60 (Middle C)
                if (isNaN(parsed)) return 60;

                const absVal = Math.abs(parsed);
                if (absVal >= 0 && absVal <= 127) {
                    return parsed;
                }
                return 60;
            });

            // Process values: Separated absolute MIDI for pitch, and sign for rhythm (rest)
            const newMidiValues = rawMidiValues.map(v => Math.abs(v));
            const isRestArray = rawMidiValues.map(v => v < 0);

            // Also update the hidden inputs just to be consistent with the "pass to hidden inputs" request
            const hiddenInputs = midiInputsContainer.querySelectorAll('.midi-value-input-hidden');
            if (hiddenInputs.length === newMidiValues.length) {
                hiddenInputs.forEach((input, i) => {
                    input.value = newMidiValues[i];
                });
            }

            // Update BDI
            const measure = window.bdi.bar[window.currentEditingMeasureIndex];

            if (measure.voci && Array.isArray(measure.voci)) {
                // Multi-voice structure
                const voiceSelector = document.getElementById('voice-selector');
                const selectedVoice = voiceSelector ? voiceSelector.value : 'soprano';
                const nameToCode = { 'soprano': 's', 'contralto': 'a', 'tenor': 't', 'bajo': 'b' };
                const voiceCode = nameToCode[selectedVoice] || 's';

                const voice = measure.voci.find(v => v.nami === voiceCode);
                if (voice) {
                    voice.nimidi = newMidiValues;

                    // Update Rhythm (tipis) using the modified rhythm values from window.currentEditingRhythmValues
                    // Apply rest signs based on isRestArray
                    if (window.currentEditingRhythmValues.length === isRestArray.length) {
                        voice.tipis = window.currentEditingRhythmValues.map((dur, i) => {
                            const absDur = Math.abs(dur);
                            return isRestArray[i] ? -absDur : absDur;
                        });

                        // Recalcular timis basado en los nuevos tipis
                        if (typeof restini === 'function') {
                            voice.timis = restini([voice.tipis])[0];
                        }

                        console.log('🔍 EDIT MEASURE - Mode:', voiceEditMode, 'Voice:', selectedVoice);

                        // MODO DEPENDIENTE: Copiar tipis/timis a todas las voces y generar armonías
                        if (voiceEditMode === 'dependent') {
                            console.log('🔗 Modo Dependiente: Actualizando todas las voces con armonías');

                            measure.voci.forEach(v => {
                                if (v.nami !== voiceCode) {
                                    // Copiar ritmo
                                    v.tipis = [...voice.tipis];
                                    v.timis = [...voice.timis];

                                    // Generar armonía para esta voz
                                    if (typeof generateHarmonyForVoice === 'function') {
                                        const harmonyData = generateHarmonyForVoice({
                                            nimidi: newMidiValues,
                                            tipis: voice.tipis,
                                            timis: voice.timis,
                                            dinami: voice.dinami || newMidiValues.map(() => 64)
                                        }, v.nami);
                                        v.nimidi = harmonyData.nimidi;
                                    }
                                }
                            });
                        } else {
                            console.log('🔓 Modo Independiente: Solo actualizando voz', selectedVoice);
                            // En modo independiente, NO tocar las otras voces
                        }

                        // También actualizar el objeto principal del measure
                        measure.tipis = [...voice.tipis];
                        measure.timis = [...voice.timis];
                    }
                }
            } else {
                // Single voice structure
                measure.nimidi = newMidiValues;

                // Update Rhythm (tipis) using the modified rhythm values from window.currentEditingRhythmValues
                // Apply rest signs based on isRestArray
                if (window.currentEditingRhythmValues.length === isRestArray.length) {
                    measure.tipis = window.currentEditingRhythmValues.map((dur, i) => {
                        const absDur = Math.abs(dur);
                        return isRestArray[i] ? -absDur : absDur;
                    });

                    // Recalcular timis basado en los nuevos tipis
                    if (typeof restini === 'function') {
                        measure.timis = restini([measure.tipis])[0];
                    }
                }
            }

            // Save state and rebuild
            if (typeof saveBdiState === 'function') {
                saveBdiState();
            }

            if (typeof rebuildRecordi === 'function') {
                rebuildRecordi();
            }

            // Update visual layers
            if (typeof applyTextLayer === 'function') {
                applyTextLayer();
            }

            console.log('✅ MIDI values updated for measure', window.currentEditingMeasureIndex);

            // Refesh view (Apply behavior: keep open and reload)
            window.openMidiEditor(window.currentEditingMeasureIndex);
        });
    }

    // Cancel button - now just clears the editor without hiding it
    if (midiEditorCancel) {
        midiEditorCancel.addEventListener('click', () => {
            // Clear the inputs
            midiInputsContainer.innerHTML = '';
            window.currentEditingMeasureIndex = -1;

            // Reset the header
            const header = document.getElementById('midi-editor-header');
            if (header) {
                const measureNumSpan = document.getElementById('midi-editor-measure-num');
                if (measureNumSpan) measureNumSpan.innerHTML = '';
            }
        });
    }

    // Add click listener to notepad spans for MIDI editing
    const notepadContainer = document.getElementById('notepi6');
    console.log('📝 Notepad container found:', notepadContainer);

    if (notepadContainer) {
        notepadContainer.addEventListener('click', (e) => {
            console.log('🖱️ Click detected on notepad container');
            console.log('Click target:', e.target);
            console.log('Target tagName:', e.target.tagName);

            // Find the clicked span (measure)
            let target = e.target;
            while (target && target !== notepadContainer) {
                console.log('Checking element:', target.tagName, target);

                if (target.tagName === 'SPAN') {
                    console.log('✅ Found SPAN element');

                    // Get all spans in the notepad
                    const allSpans = Array.from(notepadContainer.querySelectorAll('span'));
                    console.log('Total spans found:', allSpans.length);
                    console.log('BDI bar length:', window.bdi ? window.bdi.bar.length : 'BDI not defined');

                    const measureIndex = allSpans.indexOf(target);
                    console.log('Measure index:', measureIndex);

                    if (measureIndex >= 0 && measureIndex < window.bdi.bar.length) {
                        console.log('Opening MIDI editor for measure:', measureIndex);
                        window.openMidiEditor(measureIndex);
                        break;
                    } else {
                        console.log('❌ Index out of range or invalid');
                    }
                }
                target = target.parentElement;
            }
        });

        console.log('✅ Click listener attached to notepad container');
    } else {
        console.error('❌ Notepad container not found!');
    }

    // Edit MIDI button - opens editor for currently selected measure
    const editMidiBtn = document.getElementById('edit-midi-btn');
    if (editMidiBtn) {
        editMidiBtn.addEventListener('click', () => {
            console.log('🔍 Current selectedMeasureIndex:', selectedMeasureIndex);
            console.log('🔍 Total measures in bdi.bar:', window.bdi.bar.length);

            if (selectedMeasureIndex >= 0 && selectedMeasureIndex < window.bdi.bar.length) {
                console.log('🎹 Opening MIDI editor for selected measure:', selectedMeasureIndex);
                window.openMidiEditor(selectedMeasureIndex);
            } else {
                alert('Por favor, selecciona un compás primero haciendo click en él.');
            }
        });
    }

    // Make modal draggable
    const midiEditorContent = document.getElementById('midi-editor-content');
    const midiEditorHeader = document.getElementById('midi-editor-header');

    if (midiEditorContent && midiEditorHeader) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        midiEditorHeader.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === midiEditorHeader) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, midiEditorContent);
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate(calc(-50% + ${xPos}px), calc(-50% + ${yPos}px))`;
        }
    }









    // Scale buttons event listeners
    const mayorBtn = document.getElementById('mayor');
    const menorBtn = document.getElementById('menor');
    const cromaticaBtn = document.getElementById('cromatica');

    const scaleButtons = [mayorBtn, menorBtn, cromaticaBtn];



    function setActiveScale(index) {
        scali = index;
        console.log('Scale changed to:', escalas[scali]);

        // Update chromatic semitones in the ladder (now with correct ordering: monochromatic, binary, ternary)
        //updateChromaticSemitones();
        makeladi()

        // Update button styles
        // Explicitly re-fetch buttons to avoid any stale reference issues
        const currentButtons = [
            document.getElementById('mayor'),
            document.getElementById('menor'),
            document.getElementById('cromatica')
        ];
        if (index == 2) { document.getElementById('keyin').style.visibility = 'hidden' } else {
            document.getElementById('keyin').style.visibility = 'visible'
        }
        currentButtons.forEach((btn, i) => {
            if (btn) {
                if (i === index) {
                    btn.style.background = 'var(--theme-primary)';
                    btn.style.fontWeight = 'bold';
                    btn.style.color = 'var(--theme-text-inverse)';
                    btn.style.border = '2px solid var(--theme-primary)';
                    btn.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.3)';
                    btn.style.transform = 'scale(1.05)';
                    console.log(`Set active style for button ${i} (${btn.id})`);
                } else {
                    btn.style.background = 'var(--theme-secondary)';
                    btn.style.fontWeight = 'normal';
                    btn.style.color = 'var(--theme-text-inverse)';
                    btn.style.border = '1px solid rgba(0, 0, 0, 0.1)';
                    btn.style.boxShadow = 'none';
                    btn.style.transform = 'scale(1)';
                }
            } else {
                console.warn(`Button at index ${i} not found`);
            }
        });
    }

    if (mayorBtn) {
        mayorBtn.addEventListener('click', () => setActiveScale(0));
    }
    if (menorBtn) {
        menorBtn.addEventListener('click', () => setActiveScale(1));
    }
    if (cromaticaBtn) {
        cromaticaBtn.addEventListener('click', () => setActiveScale(2));
    }

    // Set initial active scale (Mayor by default)
    // Use setTimeout to ensure DOM is fully ready and all elements are accessible
    setTimeout(() => {
        setActiveScale(0);
    }, 100);

    // Key selector event listener
    const keyinSelector = document.getElementById('keyin');
    if (keyinSelector) {
        keyinSelector.addEventListener('change', (e) => {
            keyinselecti = e.target.selectedIndex;
            //console.log('Key changed to:', keyin[keyinselecti], '(index:', keyinselecti, ')');
            makeladi();
        });
    }
    //////////INSTRUMENT SELECTOR
    // Instrument selector replaces old percussion button
    const instrumentSelector = document.getElementById('instrument-selector');

    if (instrumentSelector) {
        // Event listener for instrument change
        instrumentSelector.addEventListener('change', function () {
            const selectedValue = this.value;

            // Get selected voices from playback selector
            const playbackSelector = document.getElementById('playback-selector');
            const selectedVoices = playbackSelector ? playbackSelector.value : 's,a,t,b';
            const voiceCodes = selectedVoices.split(',');

            // Ensure metadata structure exists
            if (!bdi.metadata) bdi.metadata = { voices: {} };
            if (!bdi.metadata.voices) bdi.metadata.voices = {};

            // Apply instrument to all selected voices
            voiceCodes.forEach(voiceCode => {
                if (!bdi.metadata.voices[voiceCode]) {
                    bdi.metadata.voices[voiceCode] = { instrument: 1, percussion: false };
                }

                if (selectedValue === 'perc') {
                    // Percussion mode: use channel 10
                    bdi.metadata.voices[voiceCode].percussion = true;
                    bdi.metadata.voices[voiceCode].instrument = 1; // Instrument doesn't matter for percussion
                } else {
                    // Regular instrument mode
                    bdi.metadata.voices[voiceCode].percussion = false;
                    bdi.metadata.voices[voiceCode].instrument = parseInt(selectedValue);
                }
            });

            console.log('🎹 Instrument changed to:', selectedValue, 'for voices:', voiceCodes);

            // Rebuild player with new instrument setting
            rebuildRecordi();

            // Refresh rhythm pattern UI if percussion mode changed
            if (typeof buildGroupButtons === 'function' && typeof buildPatternGrid === 'function') {
                console.log('🔄 Refrescando UI de patrones rítmicos...');
                buildGroupButtons();
                if (typeof currentGroup !== 'undefined') {
                    buildPatternGrid(currentGroup);
                }
            }
        });

        // Initialize selector based on current playback voice
        window.initInstrumentSelector = () => {
            const playbackSelector = document.getElementById('playback-selector');
            const selectedVoices = playbackSelector ? playbackSelector.value : 's,a,t,b';
            const voiceCodes = selectedVoices.split(',');

            if (!bdi.metadata) bdi.metadata = { voices: {} };
            if (!bdi.metadata.voices) bdi.metadata.voices = {};

            // Check first selected voice for instrument
            const firstVoiceCode = voiceCodes[0];
            if (!bdi.metadata.voices[firstVoiceCode]) {
                bdi.metadata.voices[firstVoiceCode] = { instrument: 1, percussion: false };
            }

            const voiceMeta = bdi.metadata.voices[firstVoiceCode];

            if (voiceMeta.percussion) {
                instrumentSelector.value = 'perc';
            } else {
                instrumentSelector.value = voiceMeta.instrument.toString();
            }
        };

        // Initialize on load
        window.initInstrumentSelector();
    }
    // END INSTRUMENT SELECTOR

    // Voice selector - refresh rhythm patterns when voice changes
    const voiceSelectorEl = document.getElementById('voice-selector');
    if (voiceSelectorEl) {
        voiceSelectorEl.addEventListener('change', function () {
            // Refresh rhythm pattern UI in case the new voice has different percussion setting
            if (typeof buildGroupButtons === 'function' && typeof buildPatternGrid === 'function') {
                console.log('🔄 Voz cambiada, refrescando patrones rítmicos...');
                buildGroupButtons();
                if (typeof currentGroup !== 'undefined') {
                    buildPatternGrid(currentGroup);
                }
            }
        });
    }

    // ========== EDIT MODE TOGGLE SYSTEM ==========
    // Sistema para cambiar entre modo dependiente e independiente

    const editModeToggle = document.getElementById('edit-mode-toggle');
    const modeIcon = document.getElementById('mode-icon');
    const modeText = document.getElementById('mode-text');
    const voiceModeIndicator = document.getElementById('voice-mode-indicator');

    if (editModeToggle && modeIcon && modeText) {
        console.log('🔧 INIT: Mode toggle button found, initial voiceEditMode =', voiceEditMode);

        editModeToggle.addEventListener('click', () => {
            console.log('🔘 Mode button clicked, current voiceEditMode =', voiceEditMode);

            if (voiceEditMode === 'dependent') {
                voiceEditMode = 'independent';
                modeIcon.textContent = '🔓';
                modeText.textContent = 'Independiente';
                editModeToggle.style.background = '#ff9800';

                // Update voice mode indicator
                if (voiceModeIndicator) {
                    voiceModeIndicator.style.background = '#ff9800';
                    voiceModeIndicator.title = 'Modo Independiente: Cada pista se edita por separado';
                }

                console.log('📝 Modo de edición cambiado a: INDEPENDIENTE');
                console.log('   → Cada pista se edita por separado');
            } else {
                voiceEditMode = 'dependent';
                modeIcon.textContent = '🔗';
                modeText.textContent = 'Dependiente';
                editModeToggle.style.background = '#4caf50';

                // Update voice mode indicator
                if (voiceModeIndicator) {
                    voiceModeIndicator.style.background = '#4caf50';
                    voiceModeIndicator.title = 'Modo Dependiente: Las armonías se generan automáticamente';
                }

                console.log('📝 Modo de edición cambiado a: DEPENDIENTE');
                console.log('   → Las armonías se generan automáticamente');
            }

            console.log('🔘 After toggle, voiceEditMode =', voiceEditMode);
        });
    }

    /**
     * Crea un compás vacío (silencio de redonda)
     * @returns {Object} Compás vacío con estructura completa
     */
    function createEmptyMeasure() {
        return {
            nimidi: [60],     // Nota cualquiera (no se escuchará porque tipis es negativo)
            duri: [1],        // Redonda
            tipis: [-1],      // NEGATIVO para mostrar silencio en notepad
            timis: [1],       // Tiempo de redonda
            dinami: [64],     // Dinámica por defecto (mf - mezzo forte)
            liri: "",         // Sin letra
            tarari: "",       // Sin tarareo
            nimidiColors: [[128, 128, 128, 255]]  // Color gris para silencio
        };
    }

    /**
     * Sincroniza el número de compases entre todas las voces
     * Rellena con compases vacíos las voces que tengan menos compases
     */
    function syncMeasureCount() {
        if (!bdi.bar || bdi.bar.length === 0) {
            console.log('⚠️ syncMeasureCount: No hay compases para sincronizar');
            return;
        }

        const totalMeasures = bdi.bar.length;
        const voices = ['s', 'a', 't', 'b'];
        let changesMade = false;

        // Recorrer cada compás
        for (let i = 0; i < totalMeasures; i++) {
            if (!bdi.bar[i].voci) {
                bdi.bar[i].voci = {};
            }

            // Asegurar que cada voz existe en este compás
            voices.forEach(voice => {
                if (!bdi.bar[i].voci[voice]) {
                    bdi.bar[i].voci[voice] = createEmptyMeasure();
                    console.log(`📝 Compás ${i + 1}: Añadido compás vacío para voz ${voice}`);
                    changesMade = true;
                }
            });
        }

        if (changesMade) {
            console.log(`✅ Sincronización completa: ${totalMeasures} compases en todas las voces`);
        }
    }

    /**
     * Valida que todas las voces tengan el mismo número de compases
     * @returns {boolean} true si todas las voces están sincronizadas
     */
    function validateMeasureSync() {
        if (!bdi.bar || bdi.bar.length === 0) return true;

        const voices = ['s', 'a', 't', 'b'];
        const measureCounts = {};

        voices.forEach(voice => {
            measureCounts[voice] = bdi.bar.filter(m => m.voci && m.voci[voice]).length;
        });

        const allEqual = Object.values(measureCounts).every(
            count => count === bdi.bar.length
        );

        if (!allEqual) {
            console.warn('⚠️ Número de compases desincronizado:', measureCounts);
            syncMeasureCount(); // Auto-corregir
            return false;
        }

        return true;
    }

    // Exponer funciones globalmente para uso en otras partes del código
    window.createEmptyMeasure = createEmptyMeasure;
    window.syncMeasureCount = syncMeasureCount;
    window.validateMeasureSync = validateMeasureSync;

    // ========== MEASURE OPERATION WRAPPERS ==========
    // Funciones que implementan la lógica de modo dependiente/independiente

    /**
     * Añade un nuevo compás respetando el modo de edición actual
     * @param {Object} measureData - Datos del compás para la voz actual {nimidi, duri, liri}
     * @param {string} voiceCode - Código de la voz ('s', 'a', 't', 'b')
     * @returns {number} Índice del compás añadido
     */
    function addMeasureWithMode(measureData, voiceCode = null) {
        if (!voiceCode) {
            const voiceSelector = document.getElementById('voice-selector');
            voiceCode = voiceSelector ? voiceSelector.value : 's';
        }

        const measureIndex = bdi.bar.length;

        if (voiceEditMode === 'dependent') {
            // MODO DEPENDIENTE: Generar armonías automáticas
            console.log('🔗 Modo Dependiente: Generando armonías automáticas');

            const newMeasure = {
                voci: {
                    s: voiceCode === 's' ? measureData : generateHarmonyForVoice(measureData, 's'),
                    a: voiceCode === 'a' ? measureData : generateHarmonyForVoice(measureData, 'a'),
                    t: voiceCode === 't' ? measureData : generateHarmonyForVoice(measureData, 't'),
                    b: voiceCode === 'b' ? measureData : generateHarmonyForVoice(measureData, 'b')
                }
            };
            bdi.bar.push(newMeasure);
            console.log(`✅ Compás ${measureIndex + 1} añadido con armonías para todas las voces`);

        } else {
            // MODO INDEPENDIENTE: Solo añadir a la voz actual
            console.log('🔓 Modo Independiente: Añadiendo solo a voz', voiceCode);

            if (!bdi.bar[measureIndex]) {
                // Crear compás nuevo con todas las voces vacías
                bdi.bar[measureIndex] = {
                    voci: {
                        s: createEmptyMeasure(),
                        a: createEmptyMeasure(),
                        t: createEmptyMeasure(),
                        b: createEmptyMeasure()
                    }
                };
            }

            // Actualizar solo la voz seleccionada
            bdi.bar[measureIndex].voci[voiceCode] = measureData;
            console.log(`✅ Compás ${measureIndex + 1} añadido solo para voz ${voiceCode}`);

            // Sincronizar para asegurar que todas las voces tengan el mismo número de compases
            syncMeasureCount();
        }

        return measureIndex;
    }

    /**
     * Edita un compás existente respetando el modo de edición actual
     * @param {number} measureIndex - Índice del compás a editar
     * @param {Object} newData - Nuevos datos del compás {nimidi, duri, liri}
     * @param {string} voiceCode - Código de la voz a editar
     */
    function editMeasureWithMode(measureIndex, newData, voiceCode = null) {
        if (!voiceCode) {
            const voiceSelector = document.getElementById('voice-selector');
            voiceCode = voiceSelector ? voiceSelector.value : 's';
        }

        if (!bdi.bar[measureIndex]) {
            console.error(`❌ Compás ${measureIndex + 1} no existe`);
            return;
        }

        if (voiceEditMode === 'dependent') {
            // MODO DEPENDIENTE: Actualizar todas las voces con armonías
            console.log('🔗 Modo Dependiente: Actualizando todas las voces');

            bdi.bar[measureIndex].voci.s = voiceCode === 's' ? newData : generateHarmonyForVoice(newData, 's');
            bdi.bar[measureIndex].voci.a = voiceCode === 'a' ? newData : generateHarmonyForVoice(newData, 'a');
            bdi.bar[measureIndex].voci.t = voiceCode === 't' ? newData : generateHarmonyForVoice(newData, 't');
            bdi.bar[measureIndex].voci.b = voiceCode === 'b' ? newData : generateHarmonyForVoice(newData, 'b');

            console.log(`✅ Compás ${measureIndex + 1} actualizado con armonías`);

        } else {
            // MODO INDEPENDIENTE: Solo actualizar la voz seleccionada
            console.log('🔓 Modo Independiente: Actualizando solo voz', voiceCode);

            bdi.bar[measureIndex].voci[voiceCode] = newData;
            console.log(`✅ Compás ${measureIndex + 1} actualizado solo para voz ${voiceCode}`);
        }

        // Siempre sincronizar
        syncMeasureCount();
    }

    /**
     * Borra un compás respetando el modo de edición actual
     * @param {number} measureIndex - Índice del compás a borrar
     * @param {string} voiceCode - Código de la voz (solo usado en modo independiente)
     */
    function deleteMeasureWithMode(measureIndex, voiceCode = null) {
        if (!voiceCode) {
            const voiceSelector = document.getElementById('voice-selector');
            voiceCode = voiceSelector ? voiceSelector.value : 's';
        }

        if (!bdi.bar[measureIndex]) {
            console.error(`❌ Compás ${measureIndex + 1} no existe`);
            return;
        }

        console.log('🔍 DEBUG: voiceEditMode =', voiceEditMode);
        console.log('🔍 DEBUG: voiceCode =', voiceCode);
        console.log('🔍 DEBUG: Total measures before =', bdi.bar.length);

        if (voiceEditMode === 'dependent') {
            // MODO DEPENDIENTE: Borrar compás de todas las voces
            console.log('🔗 Modo Dependiente: Borrando compás de todas las voces');
            bdi.bar.splice(measureIndex, 1);
            console.log(`✅ Compás ${measureIndex + 1} borrado de todas las voces`);

        } else {
            // MODO INDEPENDIENTE: Vaciar solo la voz actual
            console.log('🔓 Modo Independiente: Vaciando solo voz', voiceCode);

            const measure = bdi.bar[measureIndex];
            console.log('🔍 DEBUG: measure.voci exists?', !!measure.voci);
            console.log('🔍 DEBUG: measure.voci is array?', Array.isArray(measure.voci));

            // Asegurar que existe la estructura voci
            if (!measure.voci) {
                measure.voci = {};
            }

            // Manejar ambas estructuras: array o objeto
            if (Array.isArray(measure.voci)) {
                // Estructura de array: buscar la voz por nami
                const voiceObj = measure.voci.find(v => v.nami === voiceCode);
                if (voiceObj) {
                    // Vaciar la voz con silencios (tipis NEGATIVOS)
                    voiceObj.nimidi = voiceObj.nimidi.map(() => 0);  // Mantener cantidad de notas
                    voiceObj.tipis = voiceObj.tipis.map(t => -Math.abs(t));  // NEGATIVOS para silencio
                    voiceObj.timis = voiceObj.timis || voiceObj.tipis.map(() => 1);
                    voiceObj.dinami = voiceObj.dinami || voiceObj.nimidi.map(() => 64);
                    voiceObj.tarari = '';

                    // IMPORTANTE: También actualizar datos del nivel superior del compás
                    measure.nimidi = [...voiceObj.nimidi];
                    measure.tipis = [...voiceObj.tipis];
                    measure.timis = [...voiceObj.timis];
                    measure.dinami = [...voiceObj.dinami];
                    measure.tarari = '';

                    console.log(`✅ Compás ${measureIndex + 1} vaciado para voz ${voiceCode} (array structure)`);
                    console.log('🔍 DEBUG: Voice after emptying =', voiceObj);
                    console.log('🔍 DEBUG: Measure tipis =', measure.tipis);
                } else {
                    console.error('❌ Voice not found in voci array!');
                }
            } else {
                // Estructura de objeto: acceso directo
                measure.voci[voiceCode] = createEmptyMeasure();
                console.log(`✅ Compás ${measureIndex + 1} vaciado para voz ${voiceCode} (object structure)`);
                console.log('🔍 DEBUG: Voice after emptying =', measure.voci[voiceCode]);
            }

            console.log('🔍 DEBUG: Total measures after empty =', bdi.bar.length);
            console.log('🔍 DEBUG: Measure still exists?', !!bdi.bar[measureIndex]);
        }

        syncMeasureCount();
    }

    /**
     * Genera armonía para una voz específica basándose en los datos de entrada
     * Usa intervalos armónicos estándar para voces SATB
     * @param {Object} sourceData - Datos del compás fuente {nimidi, duri, liri}
     * @param {string} targetVoice - Voz destino ('s', 'a', 't', 'b')
     * @returns {Object} Datos del compás armonizado
     */
    function generateHarmonyForVoice(sourceData, targetVoice) {
        // Intervalos armónicos estándar para voces SATB (en semitonos)
        const intervals = {
            's': 0,    // Soprano - sin cambio (voz principal)
            'a': -5,   // Alto - cuarta justa descendente
            't': -12,  // Tenor - octava descendente
            'b': -19   // Bajo - octava + quinta descendente (12 + 7)
        };

        const interval = intervals[targetVoice] || 0;

        // Generar notas MIDI transponiendo por el intervalo
        const harmonizedMidi = sourceData.nimidi ? sourceData.nimidi.map(midi => {
            if (midi === 0 || midi < 0) return midi; // Preservar silencios (0 o negativos)
            const newMidi = midi + interval;
            // Asegurar que el MIDI esté en rango válido (0-127)
            return Math.max(0, Math.min(127, newMidi));
        }) : [0];

        return {
            nimidi: harmonizedMidi,
            duri: sourceData.duri ? [...sourceData.duri] : [1],
            dinami: sourceData.dinami ? [...sourceData.dinami] : [64],
            liri: sourceData.liri || ""
        };
    }

    // Exponer funciones globalmente
    window.addMeasureWithMode = addMeasureWithMode;
    window.editMeasureWithMode = editMeasureWithMode;
    window.deleteMeasureWithMode = deleteMeasureWithMode;
    window.generateHarmonyForVoice = generateHarmonyForVoice;

    // ========== EDITABLE TITLE SYSTEM ==========
    // Sistema para editar el título del MIDI haciendo doble clic

    const titleDisplay = document.getElementById('title-display');
    const titleInput = document.getElementById('title-input');
    const lyricsTitleInput = document.getElementById('lyrics-title-input');
    const downloadLink = document.getElementById('expi');

    // Function to update title in all places
    function updateTitle(newTitle) {
        if (!newTitle || newTitle.trim() === '') {
            newTitle = 'emotion'; // Default title
        }

        // Update bdi.metadata.title
        if (window.bdi && window.bdi.metadata) {
            window.bdi.metadata.title = newTitle;
        }

        // Update display with .mid extension
        if (titleDisplay) {
            titleDisplay.textContent = newTitle + '.mid';
        }

        // Update input value (without extension)
        if (titleInput) {
            titleInput.value = newTitle;
        }

        // Update lyrics title input
        if (lyricsTitleInput) {
            lyricsTitleInput.value = newTitle;
        }

        // Update download link filename
        if (downloadLink) {
            downloadLink.setAttribute('download', newTitle + '.mid');
        }

        // Update title display download attribute
        if (titleDisplay) {
            titleDisplay.setAttribute('download', newTitle + '.mid');
        }

        console.log('✅ Title updated to:', newTitle);
    }

    // Initialize title from bdi.metadata
    if (window.bdi && window.bdi.metadata && window.bdi.metadata.title) {
        updateTitle(window.bdi.metadata.title);
    }

    // Click speed detection: fast click = download, slow/double click = edit
    if (titleDisplay && titleInput) {
        const titleExtension = document.getElementById('title-extension');
        let clickTimer = null;
        let lastClickTime = 0;
        const DOUBLE_CLICK_SPEED = 300; // ms for double click detection

        // Simplified interaction: Link click downloads (native), double click REMOVED
        /* titleDisplay.addEventListener('dblclick', (e) => {
             e.preventDefault();
             enterEditMode();
         }); */

        function enterEditMode() {
            titleDisplay.style.display = 'none';
            titleInput.style.display = 'inline-block';
            if (titleExtension) titleExtension.style.display = 'inline';
            titleInput.focus();
            titleInput.select();
        }

        // Deselect when clicking outside
        document.addEventListener('click', (e) => {
            if (!titleDisplay.contains(e.target) && !titleInput.contains(e.target)) {
                if (titleInput.style.display !== 'none') {
                    // If clicking outside while editing, save
                    saveTitle();
                }
            }
        });

        // Save on Enter or blur
        function saveTitle() {
            const newTitle = titleInput.value.trim();
            updateTitle(newTitle);
            titleInput.style.display = 'none';
            if (titleExtension) titleExtension.style.display = 'none';
            titleDisplay.style.display = 'inline';
        }

        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveTitle();
            } else if (e.key === 'Escape') {
                // Cancel editing
                titleInput.value = titleDisplay.textContent.replace('.mid', '');
                titleInput.style.display = 'none';
                if (titleExtension) titleExtension.style.display = 'none';
                titleDisplay.style.display = 'inline';
            }
        });

        titleInput.addEventListener('blur', saveTitle);
    }

    // Listener for lyrics title input
    // lyricsTitleInput is already declared above
    if (lyricsTitleInput) {
        lyricsTitleInput.addEventListener('input', (e) => {
            const newTitle = e.target.value;
            // Update everything EXCEPT the input itself (to avoid cursor jumping)
            if (window.bdi && window.bdi.metadata) {
                window.bdi.metadata.title = newTitle;
            }
            if (titleDisplay) {
                titleDisplay.textContent = newTitle + '.mid';
                titleDisplay.setAttribute('download', newTitle + '.mid');
            }
            if (titleInput) {
                titleInput.value = newTitle;
            }
            if (downloadLink) {
                downloadLink.setAttribute('download', newTitle + '.mid');
            }
        });
    }

    // Update download link when MIDI is rebuilt
    window.updateDownloadLink = function () {
        if (downloadLink && window.bdi && window.bdi.metadata) {
            const title = window.bdi.metadata.title || 'emotion';
            const currentHref = downloadLink.getAttribute('href');
            downloadLink.setAttribute('download', title + '.mid');

            // Sync title display href with download link
            if (titleDisplay && currentHref) {
                titleDisplay.setAttribute('href', currentHref);
                titleDisplay.setAttribute('download', title + '.mid');
            }
        }
    };

    // Watch for changes to the expi link's href and update title display href
    if (downloadLink) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
                    window.updateDownloadLink();
                }
            });
        });

        observer.observe(downloadLink, {
            attributes: true,
            attributeFilter: ['href']
        });
    }

    // END EDITABLE TITLE SYSTEM

    // ========== FRASES SYSTEM ==========
    // Sistema para guardar, listar y restaurar frases de composición

    // Función para obtener todas las frases guardadas desde localStorage
    function getSavedFrases() {
        try {
            const saved = localStorage.getItem('musicoli_frases');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading frases:', e);
            return [];
        }
    }

    // Función para guardar una frase en localStorage
    function saveFrase(fraseData) {
        try {
            const frases = getSavedFrases();
            fraseData.id = Date.now(); // ID único basado en timestamp
            fraseData.timestamp = new Date().toLocaleString();
            frases.push(fraseData);
            localStorage.setItem('musicoli_frases', JSON.stringify(frases));
            console.log('✅ Frase guardada:', fraseData.id);
            return true;
        } catch (e) {
            console.error('Error saving frase:', e);
            return false;
        }
    }

    // Función para eliminar una frase
    function deleteFrase(fraseId) {
        try {
            const frases = getSavedFrases();
            const filtered = frases.filter(f => f.id !== fraseId);
            localStorage.setItem('musicoli_frases', JSON.stringify(filtered));
            console.log('🗑️ Frase eliminada:', fraseId);
            return true;
        } catch (e) {
            console.error('Error deleting frase:', e);
            return false;
        }
    }

    // Función para guardar el estado actual como frase
    function saveCurrentFrase() {
        // Capturar el estado actual
        const fraseData = {
            bdi: typeof window.bdi.bar !== 'undefined' ? JSON.parse(JSON.stringify(window.bdi.bar)) : [],
            notepadContent: typeof np6 !== 'undefined' && np6 ? np6.letterNodes.map(node => ({
                text: node.textContent || '',
                color: node.style.backgroundColor || node.dataset.color || '',
                dataset: { ...node.dataset }
            })) : [],
            timestamp: new Date().toLocaleString()
        };

        // Guardar la frase
        if (saveFrase(fraseData)) {
            // Vaciar todo después de guardar
            clearAllComposition();

            // Actualizar los botones de frases
            renderFrasesButtons();

            // Mostrar mensaje breve
            const fraseBtn = document.getElementById('frase-btn');
            if (fraseBtn) {
                const originalText = fraseBtn.textContent;
                fraseBtn.textContent = '✓ Guardada';
                fraseBtn.style.background = 'var(--theme-primary)';
                setTimeout(() => {
                    fraseBtn.textContent = originalText;
                    fraseBtn.style.background = 'var(--theme-accent)';
                }, 1500);
            }

            return true;
        } else {
            alert('❌ Error al guardar la frase');
            return false;
        }
    }

    // Función para vaciar toda la composición (similar a empezar-btn)
    function clearAllComposition() {
        // Clear bdi array
        if (typeof window.bdi.bar !== 'undefined') {
            window.bdi.bar = [];
        }

        // Call initraki
        if (typeof window.initraki === 'function' && typeof tempi !== 'undefined') {
            window.initraki(tempi, 4);
        }

        // Clear player source
        const playi = document.getElementById("player15");
        if (playi) {
            playi.src = '';
        }

        // Clear tarareo input
        const tarareoInput = document.getElementById('tarareo-input');
        if (tarareoInput) {
            tarareoInput.value = '';
        }

        // Clear layer textareas
        const textLayer = document.getElementById('text-layer-6');
        const colorLayer = document.getElementById('color-layer-6');
        const lyricsLayer = document.getElementById('lyrics-layer-6');

        if (textLayer) textLayer.value = '';
        if (colorLayer) colorLayer.value = '';
        if (lyricsLayer) lyricsLayer.value = '';

        // Reset notepad instance
        if (typeof np6 !== 'undefined' && np6) {
            np6.setFromRichContent([]);
            np6.setEditable(true);
            if (np6.cursor) np6.cursor.style.display = 'inline-block';
            if (np6.textarea) np6.textarea.disabled = false;
        }

        // Clear BDI display
        const bdiDisplay = document.getElementById('bdi-display');
        if (bdiDisplay) {
            bdiDisplay.value = '[]';
        }

        // Clear redo stack
        if (window.bdiRedoStack) {
            window.bdiRedoStack = [];
        }

        // Update visual layers
        if (typeof applyTextLayer === 'function') {
            applyTextLayer();
        }

        // Update JSON display
        if (typeof updateDetailedJSON === 'function') {
            updateDetailedJSON();
        }

        console.log('🧹 Composición vaciada');
    }

    // Función para restaurar/insertar una frase
    function restoreFrase(fraseData) {
        if (!fraseData || !fraseData.bdi) {
            console.error('❌ Datos de frase inválidos');
            return false;
        }

        try {
            // Helper to get the bar array regardless of structure (direct array or object with bar)
            let measuresToRestore = [];
            if (Array.isArray(fraseData.bdi)) {
                measuresToRestore = fraseData.bdi;
            } else if (fraseData.bdi && Array.isArray(fraseData.bdi.bar)) {
                measuresToRestore = fraseData.bdi.bar;
            } else {
                console.error('❌ Data format not recognized inside fraseData.bdi');
                return false;
            }

            // Restaurar bdi
            if (typeof window.bdi.bar !== 'undefined') {
                // Si hay contenido actual, insertar al final; si está vacío, reemplazar
                if (window.bdi.bar.length === 0) {
                    // Save state before replacing all measures
                    saveBdiState();
                    window.bdi.bar = JSON.parse(JSON.stringify(measuresToRestore));
                } else {
                    // Save state before inserting phrase measures
                    saveBdiState();

                    // Insertar al final (en la posición del cursor)
                    const newBdi = JSON.parse(JSON.stringify(measuresToRestore));
                    // Ajustar numi para que sean consecutivos
                    const startNumi = window.bdi.bar.length;
                    newBdi.forEach((item, idx) => {
                        item.numi = startNumi + idx;
                    });
                    //-->window.bdi.push(...newBdi);
                    // Use designated splicing position or default to end if -1
                    // Ensure the index is valid
                    let insertIndex = selectedMeasureIndex;
                    if (insertIndex === -1 || insertIndex > window.bdi.bar.length) {
                        insertIndex = window.bdi.bar.length;
                    }

                    window.bdi.bar.splice(insertIndex, 0, ...newBdi);
                }
            }

            // Ensure lyrics field exists in new/restored data
            if (typeof window.ensureLyricsField === 'function') {
                window.ensureLyricsField();
            }

            // Rebuild MIDI track using rebuildRecordi which handles single/multi-track correctly
            if (typeof rebuildRecordi === 'function') {
                rebuildRecordi();
            }

            // Update visual layers
            if (typeof applyTextLayer === 'function') {
                applyTextLayer();
            }


            // Update BDI display
            let bdiDisplay = document.getElementById('bdi-display');
            if (bdiDisplay && typeof window.bdi.bar !== 'undefined') {
                bdiDisplay.value = JSON.stringify(window.bdi.bar, null, 2);
            }

            // Update JSON display
            if (typeof updateDetailedJSON === 'function') {
                updateDetailedJSON();
            }

            console.log('✅ Frase restaurada:', fraseData.id);
            return true;
        } catch (e) {
            console.error('❌ Error restaurando frase:', e);
            alert('Error al restaurar la frase: ' + e.message);
            return false;
        }
    }

    // Función para renderizar los botones de frases guardadas
    function renderFrasesButtons() {
        const container = document.getElementById('frases-buttons-container');
        if (!container) return;

        const frases = getSavedFrases();

        // Limpiar contenedor
        container.innerHTML = '';

        // Crear botones para cada frase guardada
        frases.forEach(frase => {
            const compasesCount = frase.bdi ? frase.bdi.length : 0;

            // Crear botón principal para insertar la frase
            const fraseBtn = document.createElement('button');
            fraseBtn.textContent = `F${frase.id}`;
            fraseBtn.title = `Insertar frase (${compasesCount} compases)`;
            fraseBtn.style.cssText = 'background: #4CAF50; color: white; border: none; padding: 4px 10px; border-radius: 3px; font-family: monospace; font-weight: bold; cursor: pointer; font-size: 11px;';
            fraseBtn.addEventListener('click', () => {
                restoreFrase(frase);
            });

            // Crear botón pequeño para eliminar
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.title = 'Eliminar frase';
            deleteBtn.style.cssText = 'background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-family: monospace; font-weight: bold; cursor: pointer; font-size: 11px; margin-left: 2px;';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`¿Eliminar frase F${frase.id}?`)) {
                    if (deleteFrase(frase.id)) {
                        renderFrasesButtons(); // Refrescar botones
                    }
                }
            });

            // Crear contenedor para el botón y el botón de eliminar
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display: inline-flex; align-items: center;';
            wrapper.appendChild(fraseBtn);
            wrapper.appendChild(deleteBtn);

            container.appendChild(wrapper);
        });
    }

    // Event listener para el botón "Frase"
    const fraseBtn = document.getElementById('frase-btn');
    if (fraseBtn) {
        fraseBtn.addEventListener('click', () => {
            // Verificar si hay contenido para guardar
            const hasContent = (typeof window.bdi.bar !== 'undefined' && window.bdi.bar.length > 0) ||
                (typeof np6 !== 'undefined' && np6 && np6.letterNodes.length > 0);

            if (hasContent) {
                // Guardar la frase actual y vaciar
                if (confirm('¿Guardar la frase actual y empezar de nuevo?\n\nSe guardará el estado actual y se vaciará todo para continuar componiendo.')) {
                    saveCurrentFrase();
                }
            } else {
                alert('No hay contenido para guardar. Crea una composición primero.');
            }
        });
    }


    // Apply text layer to notepad (Ritmo mode)
    function applyTextLayer() {
        // MUSICOLI: Validate that np6 exists
        if (typeof np6 === 'undefined' || !np6) {
            console.error('❌ [applyTextLayer] np6 (notepad) is not defined or not initialized');
            return;
        }

        // SOLICITADO POR MUSICOLI: Sync Macoti widths on interaction (Perspective effect)
        if (!np6._macotiListenersAttached) {
            const updateTracks = () => {
                // Short delay to allow perspective/styles to settle
                setTimeout(() => {
                    if (typeof renderVisualTracks === 'function') {
                        renderVisualTracks();
                    }
                }, 50);
            };

            // Listen to container clicks (captures most interactions)
            np6.container.addEventListener('click', updateTracks);

            // Listen to specific note clicks if emitted
            if (typeof np6.on === 'function') {
                np6.on('noteClick', updateTracks);
            }

            np6._macotiListenersAttached = true;
            console.log('✅ Macoti sync listeners attached to Notepad');
        }

        // Each BDI compás should be ONE span (word block) in the notepad
        const bdiRef = (typeof window.bdi.bar !== 'undefined') ? window.bdi.bar : [];

        // console.log(`🎨 [applyTextLayer] Rendering ${bdiRef.length} measures to notepad`);

        // Detect current voice view
        const voiceSelector = document.getElementById('voice-selector');
        const selectedVoiceName = voiceSelector ? voiceSelector.value : 'soprano';

        // Clear the notepad content
        const oldNodesCount = np6.letterNodes.length;
        np6._clearAll();

        // Manually create word block spans for each compás
        for (let i = 0; i < bdiRef.length; i++) {
            let item = bdiRef[i];

            // Use the selected voice data if available in item.voci
            let voiceData = item; // Default fallback to top-level
            if (item.voci && Array.isArray(item.voci) && selectedVoiceName !== 'todos') {
                const voiceMap = { 'soprano': 's', 'contralto': 'a', 'tenor': 't', 'bajo': 'b' };
                const targetNami = voiceMap[selectedVoiceName];
                const foundVoice = item.voci.find(v => v.nami === targetNami);
                // If the voice object exists and has notes, use it
                if (foundVoice && foundVoice.nimidi && foundVoice.nimidi.length > 0) {
                    voiceData = foundVoice;
                }
            }

            let text = voiceData.tarari || ''; // Use tarari from voice or item

            // MUSICOLI REFACTOR: Calculate color from MIDI notes (Notepad Algorithm)
            // Instead of using stored item.hexi, we interpret the current MIDI numbers
            let color;
            const activeNotes = (voiceData.nimidi || []).filter(n => typeof n === 'number' && n > 0);

            if (activeNotes.length > 0) {
                color = midiToColor(activeNotes);
            } else {
                // Fallback if no notes (rest) - use item.hexi or default
                color = item.hexi;

                if (!color && item.coli && Array.isArray(item.coli) && item.coli.length >= 3) {
                    color = `rgb(${item.coli[0]}, ${item.coli[1]}, ${item.coli[2]})`;
                }
            }

            if (!color) color = '#e0e0e0';

            // Retrieve extra info
            let nimidi = voiceData.nimidi || [];
            let tipis = voiceData.tipis || [];

            // Format Notes Info
            // Expected format: Do4/C4/60 - Mi4/E4/64
            let notesInfo = nimidi.map(midiVal => {
                const solfege = (typeof midiToScientific === 'function') ? midiToScientific(midiVal) : midiVal;
                const abc = (typeof midiToABC === 'function') ? midiToABC(midiVal) : midiVal;
                return `${solfege}/${abc}/${midiVal}`;
            }).join(' - ');

            if (!notesInfo) notesInfo = '(-)';

            // Format Times Info
            const timesInfo = tipis.length > 0 ? `T: ${tipis.join(', ')}` : 'T: -';

            // Generate Bravura notation WITHOUT vertical offsets for notepad display
            // Notes should all be an the same baseline, not positioned like a staff
            const bravuraNotation = (typeof renderPattern === 'function') ? renderPattern(noteMap, tipis) : '';

            // LOGGING FOR DEBUGGING RESTS
            if (i < 5) { // Limit logs to first few measures
                console.log(`[applyTextLayer DEBUG] Measure ${i}:`, {
                    voice: selectedVoiceName,
                    tipis: tipis, // Check for negative numbers (rests)
                    bravuraNotation: bravuraNotation // Check if empty strings returned
                });
            }

            // REMOVED: renderPatternWithHeights - causes vertical misalignment in notepad
            // const renderPatternWithHeights = ... 
            // const bravuraNotationWithHeights = renderPatternWithHeights(noteMap, tipis, nimidi);

            // DEBUG: Log visualization data for odd/even check
            console.log(`[applyTextLayer] Measure ${i}:`, {
                nimidi, tipis, color,
                bravuraLength: bravuraNotation.length,
                isOdd: i % 2 !== 0
            });

            // Create detailed tooltip text
            const tooltipText = `Tarareo: ${text}\nNotas: ${notesInfo}\nTiempos: ${timesInfo}`;

            // Create a word block span for this compás
            const span = document.createElement('span');
            // MUSICOLI: Flag as custom content to prevent notepad.js from stripping HTML/styles
            span.dataset.customContent = 'true';

            // Explicitly set font size on the span to override container defaults if needed
            span.style.fontSize = '12px'; // Base size for the block

            // MUSICOLI: Apply background color from item
            if (color) {
                span.style.backgroundColor = color;
                // Add simple contrast logic for text
                const rgbMatch = color.match(/\d+/g);
                if (rgbMatch) {
                    const brightness = (parseInt(rgbMatch[0]) * 299 + parseInt(rgbMatch[1]) * 587 + parseInt(rgbMatch[2]) * 114) / 1000;
                    span.style.color = brightness > 125 ? 'black' : 'white';
                }
            }

            // MIDI numbers only display
            let midiNumbers = nimidi.join(', ');

            // MUSICOLI: Display '-' for rests (negative tipis)
            // Handle MIXED patterns by checking each note individually
            if (tipis && tipis.length === nimidi.length) {
                midiNumbers = nimidi.map((note, idx) => {
                    return tipis[idx] < 0 ? '-' : note;
                }).join(', ');
            } else if (tipis && tipis.length > 0 && tipis.some(t => t < 0)) {
                // Fallback
                midiNumbers = '-';
            }

            // Structure content with HTML
            // Using inline-flex column centered for better alignment
            // Number styling depends on mode
            const numberStyle = currentEditMode === 'ritmo'
                ? 'position: absolute; top: 2px; left: 2px; font-size: 0.7em; font-weight: bold; color: inherit; user-select: none;'
                : 'position: absolute; top: 2px; left: 2px; font-size: 0.7em; font-weight: bold; color: #fff; background: #999; padding: 1px 4px; border-radius: 2px; cursor: pointer; user-select: none;';

            span.innerHTML = `
            <div class="measure-number" data-measure-index="${i}" style="${numberStyle}">${i + 1}</div>
            <div style="${(typeof editMode !== 'undefined' && editMode === 'lyrics') ? 'display:block; font-size: 1.1em; margin-bottom: 5px; font-weight: bold; color: inherit;' : 'display:none;'}">${text}</div>
            <!--<div style="font-family: 'Bravura'; font-size: 1.7em; margin-top: 8px; margin-bottom: 1px; line-height: 1;">${bravuraNotation}</div>-->
            
            <div style="font-family: 'Bravura'; font-size: 1.7em; margin-top: ${(typeof editMode !== 'undefined' && editMode === 'lyrics') ? '0' : '8'}px; margin-bottom: 4px; line-height: 1; order: 1;">${bravuraNotation}</div>
            
            <div style="font-size:0.85em; font-weight:bold; opacity:0.9; line-height:1.1; color: inherit; margin-top: -3px; order: 2;">${midiNumbers}</div>
            
            <div style="display:none;">${notesInfo}</div>
            <div style="display:none;">${timesInfo}</div>
        `;


            // Add click listener to measure number (always add, but check mode on click)
            const measureNumberEl = span.querySelector('.measure-number');
            if (measureNumberEl) {
                measureNumberEl.addEventListener('mousedown', (e) => {
                    console.log('🖱️ Mousedown on measure number, mode:', currentEditMode);

                    // Only handle click if NOT in ritmo mode
                    if (currentEditMode === 'ritmo') {
                        console.log('ℹ️ Click ignored in Ritmo mode');
                        return;
                    }

                    e.preventDefault(); // Prevent notepad from handling
                    e.stopPropagation(); // Prevent notepad click
                    const measureIdx = parseInt(measureNumberEl.dataset.measureIndex);

                    // Update global variable
                    window.selectedMeasureIndex = measureIdx;
                    selectedMeasureIndex = measureIdx;

                    console.log('📍 Measure selected via number click:', measureIdx + 1);
                    console.log('🔍 selectedMeasureIndex is now:', selectedMeasureIndex);
                    console.log('🔍 window.selectedMeasureIndex is now:', window.selectedMeasureIndex);

                    // Update visual highlight
                    document.querySelectorAll('.measure-number').forEach(el => {
                        el.style.background = '#999';
                    });
                    measureNumberEl.style.background = '#FF9800'; // Orange for selected

                    // If in dinámica mode, refresh the dynamics editor
                    if (currentEditMode === 'dinamica' && typeof createDinamicaEditor === 'function') {
                        createDinamicaEditor();
                    }
                });

                // Add hover effect (always add)
                measureNumberEl.addEventListener('mouseenter', () => {
                    if (currentEditMode !== 'ritmo' && selectedMeasureIndex !== i) {
                        measureNumberEl.style.background = '#bbb';
                    }
                });
                measureNumberEl.addEventListener('mouseleave', () => {
                    if (currentEditMode !== 'ritmo' && selectedMeasureIndex !== i) {
                        measureNumberEl.style.background = '#999';
                    }
                });

                // Set initial highlight if this is the selected measure
                if (selectedMeasureIndex === i) {
                    measureNumberEl.style.background = '#FF9800';
                }
            }


            span.title = tooltipText; // Tooltip

            span.style.display = 'inline-flex';
            span.style.flexDirection = 'column';
            span.style.alignItems = 'center';
            span.style.justifyContent = 'center';
            span.style.position = 'relative'; // For absolute positioning of number
            span.style.verticalAlign = 'top'; // Prevent baseline alignment issues

            // MUSICOLI: Support gradients for background and adjust contrast calculation
            let contrastBaseColor = color;
            if (color.includes('gradient')) {
                // Extract first color for contrast calculation (hex or rgb)
                const colorMatch = color.match(/#(?:[0-9a-fA-F]{3}){1,2}|rgb\([^)]+\)|hsl\([^)]+\)/);
                if (colorMatch) contrastBaseColor = colorMatch[0];
            }

            // Force background with !important to prevent overrides
            span.style.cssText += `background: ${color} !important;`;
            span.style.color = Notepad.getContrastColor(contrastBaseColor);
            span.style.padding = `${np6.opts.letterPadY}px ${np6.opts.letterPadX}px`;
            span.style.margin = (typeof np6.opts.letterMarginX === 'number') ? `0 ${np6.opts.letterMarginX}px` : np6.opts.letterMarginX;
            span.style.borderRadius = np6.opts.letterBorderRadius + 'px';
            span.dataset.color = contrastBaseColor; // Store solid color in dataset
            span.dataset.isWordBlock = 'true';

            // Allow word wrapping if notes are very long
            span.style.maxWidth = '200px';
            span.style.minWidth = '40px'; // Ensure visibility even if empty
            span.style.whiteSpace = 'normal';
            span.style.textAlign = 'center';

            // Add border if configured (or force one for debugging if invisible)
            // span.style.border = '1px solid red'; // DEBUG
            if (np6.opts.letterBorderWidth > 0) {
                span.style.border = np6.opts.letterBorderWidth + 'px solid ' + np6.opts.letterBorderColor;
            }

            np6.letterNodes.push(span);
        }

        // Preserve cursor position unless np6 was empty or cursor was at the end
        if (typeof np6.cursorPos === 'undefined' || np6.cursorPos >= oldNodesCount) {
            np6.cursorPos = np6.letterNodes.length;
        } else {
            np6.cursorPos = Math.min(np6.cursorPos, np6.letterNodes.length);
        }

        np6._render();
        // SOLICITADO POR MUSICOLI: Auto-scroll to cursor after render
        if (typeof np6.scrollToCursor === 'function') {
            np6.scrollToCursor();
        }
        np6._emit('change');
        if (typeof updateDetailedJSON === 'function') {
            updateDetailedJSON();
        }
        // Renderizar botones de frases al cargar la página
        if (typeof renderFrasesButtons === 'function') {
            renderFrasesButtons();
        }
    }

    // SOLICITADO POR MUSICOLI: Switch voice view and update voiceline div
    const vSelector = document.getElementById('voice-selector');
    if (vSelector) {
        vSelector.addEventListener('change', () => {
            const vLine = document.getElementById('voiceline');
            currentVoice = vSelector.value;

            // MUSICOLI: Reset selected gray MIDI on voice change so it defaults to min for new voice
            window.lastSelectedGrayMidi = null;
            // Also force ladder update if we are in tonalidad text-layer or generally
            // makeladi() might be needed here but let's check if applyTextLayer calls it indirectly or if UI refresh handles it.
            // Actually, simply cleaning it is enough, next interaction will refresh.
            // But if the user is staring at the ladder, it won't update immediately until they do something.
            // Let's add a safe call to makeladi if it exists.
            if (typeof makeladi === 'function') {
                // makeladi depends on currentGroup etc, it should be fine.
                // We call it after a short delay to ensure currentVoice change propagates if async (though it's sync here)
                setTimeout(makeladi, 10);
            }

            // Parse voice codes (can be comma-separated for combinations)
            const voiceCodes = currentVoice.split(',');

            // Map voice codes to display names
            const names = {
                's': 'Soprano',
                'a': 'Contralto',
                't': 'Tenor',
                'b': 'Bajo'
            };

            // Create display name
            const displayName = voiceCodes.map(code => names[code] || code).join(' + ');
            if (vLine) vLine.innerHTML = displayName;

            // Sync selected voice to main bdi if single voice (not combination)
            if (voiceCodes.length === 1 && typeof window.bdi.bar !== 'undefined') {
                if (window.bdi.metadata) {
                    window.bdi.metadata.voici = voiceCodes[0];
                }
                const targetNami = voiceCodes[0];

                let bdiChanged = false;
                window.bdi.bar.forEach(item => {
                    if (item.voci && Array.isArray(item.voci)) {
                        const foundVoice = item.voci.find(v => v.nami === targetNami);
                        if (foundVoice) {
                            // Copy data to main item
                            item.nimidi = foundVoice.nimidi ? [...foundVoice.nimidi] : [];
                            item.tipis = foundVoice.tipis ? [...foundVoice.tipis] : [];
                            // Also copy other properties if necessary
                            if (foundVoice.timis) item.timis = [...foundVoice.timis];
                            if (foundVoice.tarari) item.tarari = foundVoice.tarari;

                            bdiChanged = true;
                        }
                    }
                });

                if (bdiChanged) {
                    // Update textarea
                    const bdiDisplay = document.getElementById('bdi-display');
                    if (bdiDisplay) {
                        bdiDisplay.value = JSON.stringify(window.bdi.bar, null, 2);
                        // Click update button to refresh player
                        const updateBtn = document.getElementById('update-bdi-btn');
                        if (updateBtn) {
                            updateBtn.click();
                        }
                    }
                }
            } else {
                // For voice combinations, rebuild MIDI with selected voices
                if (typeof rebuildRecordi === 'function') {
                    rebuildRecordi();
                }

                // Also update the BDI display
                const bdiDisplay = document.getElementById('bdi-display');
                if (bdiDisplay) {
                    bdiDisplay.value = JSON.stringify(window.bdi.bar, null, 2);
                }
            }

            applyTextLayer();

            // MUSICOLI: Update screen layout for active voice
            if (typeof updateTrackLayout === 'function') {
                updateTrackLayout(currentVoice);
            }
            if (typeof renderVisualTracks === 'function') {
                setTimeout(renderVisualTracks, 50);
            }

            // MUSICOLI: Update monochromatic scale to match new voice range
            if (typeof monocromati === 'function') {
                monocromati();
            }
        });
    }

    // Helper to update voice label styles based on playback
    window.updateVoiceLabelStyles = function () {
        const playbackSelector = document.getElementById('playback-selector');
        const activeVoicesStr = playbackSelector ? playbackSelector.value : 's';
        const activeVoices = activeVoicesStr.split(',');

        const voiceCodes = ['s', 'a', 't', 'b'];

        voiceCodes.forEach(code => {
            const labelId = `voiceline-${code}`;
            const labelEl = document.getElementById(labelId);
            if (labelEl) {
                // Remove underline and set color based on active state
                labelEl.style.textDecoration = 'none';
                labelEl.style.cursor = 'default'; // Optional: remove pointer cursor if not clickable as link

                if (activeVoices.includes(code)) {
                    labelEl.style.color = '#ffffff'; // White for active
                } else {
                    labelEl.style.color = '#888888'; // Gray for muted
                }
            }
        });
    };

    // Playback selector - controls which voices are heard in MIDI player
    const playbackSelector = document.getElementById('playback-selector');
    if (playbackSelector) {
        playbackSelector.addEventListener('change', () => {
            console.log('🎵 Playback selector changed to:', playbackSelector.value);
            // Rebuild MIDI with selected playback voices
            // Do NOT call applyTextLayer() - only update the player
            if (typeof rebuildRecordi === 'function') {
                rebuildRecordi();
                console.log('✅ rebuildRecordi called');
            } else {
                console.error('❌ rebuildRecordi function not found');
            }

            // Update instrument selector to reflect current voice's instrument
            if (typeof initInstrumentSelector === 'function') {
                initInstrumentSelector();
            }

            // Update voice label styles
            if (typeof updateVoiceLabelStyles === 'function') {
                updateVoiceLabelStyles();
            }
        });
    } else {
        console.error('❌ playback-selector element not found');
    }

    // Function to attach harmonization button listeners
    // This needs to be called both on initial load and after dynamic re-injection
    function attachHarmonizeListeners() {
        // Harmonize button - sync rhythm from current voice to all voices
        const harmonizeBtn = document.getElementById('harmonize-btn');
        if (harmonizeBtn) {
            // Remove old listener if exists
            harmonizeBtn.replaceWith(harmonizeBtn.cloneNode(true));
            const newHarmonizeBtn = document.getElementById('harmonize-btn');

            newHarmonizeBtn.addEventListener('click', () => {
                const voiceSelector = document.getElementById('voice-selector');
                const selectedVoice = voiceSelector ? voiceSelector.value : 'soprano';
                const nameToCode = { 'soprano': 's', 'contralto': 'a', 'tenor': 't', 'bajo': 'b' };
                const sourceVoiceCode = nameToCode[selectedVoice] || 's';

                let updatedCount = 0;

                // Iterate through all measures
                window.bdi.bar.forEach((measure, index) => {
                    if (measure.voci && Array.isArray(measure.voci)) {
                        // Find source voice
                        const sourceVoice = measure.voci.find(v => v.nami === sourceVoiceCode);
                        if (sourceVoice && sourceVoice.tipis && sourceVoice.timis) {
                            // Copy to all other voices
                            measure.voci.forEach(v => {
                                if (v.nami !== sourceVoiceCode) {
                                    v.tipis = [...sourceVoice.tipis];
                                    v.timis = [...sourceVoice.timis];
                                }
                            });

                            // Also update main measure object
                            measure.tipis = [...sourceVoice.tipis];
                            measure.timis = [...sourceVoice.timis];

                            updatedCount++;
                        }
                    }
                });

                // Rebuild and update display
                if (typeof rebuildRecordi === 'function') {
                    rebuildRecordi();
                }
                if (typeof applyTextLayer === 'function') {
                    applyTextLayer();
                }

                const voiceNames = { 's': 'Soprano', 'a': 'Contralto', 't': 'Tenor', 'b': 'Bajo' };
                alert(`✅ Armonizado: ${updatedCount} compases actualizados desde ${voiceNames[sourceVoiceCode]}`);
            });
        }

        // Harmonize to scale button - adjust notes in selected voice to fit current scale
        const harmonizeScaleBtn = document.getElementById('harmonize-scale-btn');
        if (harmonizeScaleBtn) {
            // Remove old listener if exists
            harmonizeScaleBtn.replaceWith(harmonizeScaleBtn.cloneNode(true));
            const newHarmonizeScaleBtn = document.getElementById('harmonize-scale-btn');

            newHarmonizeScaleBtn.addEventListener('click', () => {
                const voiceSelector = document.getElementById('voice-selector');
                const selectedVoice = voiceSelector ? voiceSelector.value : 's';

                // Get current scale and key
                const currentScale = escalas[scali]; // 'mayor', 'menor', or 'cromatica'
                const currentKey = keyinselecti; // 0-11 (C to B)

                if (currentScale === 'cromatica') {
                    alert('⚠️ La escala cromática ya incluye todas las notas. No es necesario ajustar.');
                    return;
                }

                // Get scale intervals
                const scaleIntervals = escalasNotas[currentScale]; // e.g., [0, 2, 4, 5, 7, 9, 11]

                // Build scale notes in MIDI (all octaves)
                const scaleNotes = [];
                for (let octave = 0; octave <= 10; octave++) {
                    scaleIntervals.forEach(interval => {
                        const midiNote = (octave * 12) + currentKey + interval;
                        if (midiNote >= 0 && midiNote <= 127) {
                            scaleNotes.push(midiNote);
                        }
                    });
                }
                scaleNotes.sort((a, b) => a - b);

                // Function to find nearest scale note
                const findNearestScaleNote = (midiNote) => {
                    if (midiNote < 0) return midiNote; // Keep rests as-is

                    let nearest = scaleNotes[0];
                    let minDistance = Math.abs(midiNote - nearest);

                    for (const scaleNote of scaleNotes) {
                        const distance = Math.abs(midiNote - scaleNote);
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearest = scaleNote;
                        }
                    }

                    return nearest;
                };

                let updatedCount = 0;
                let notesAdjusted = 0;

                // Iterate through all measures
                window.bdi.bar.forEach((measure, index) => {
                    if (measure.voci && Array.isArray(measure.voci)) {
                        // Find selected voice
                        const voice = measure.voci.find(v => v.nami === selectedVoice);
                        if (voice && voice.nimidi && Array.isArray(voice.nimidi)) {
                            let measureChanged = false;

                            // Adjust each note to nearest scale note
                            voice.nimidi = voice.nimidi.map(midiNote => {
                                const adjusted = findNearestScaleNote(midiNote);
                                if (adjusted !== midiNote) {
                                    notesAdjusted++;
                                    measureChanged = true;
                                }
                                return adjusted;
                            });

                            if (measureChanged) {
                                updatedCount++;
                            }
                        }
                    }
                });

                // Rebuild and update display
                if (typeof rebuildRecordi === 'function') {
                    rebuildRecordi();
                }
                if (typeof applyTextLayer === 'function') {
                    applyTextLayer();
                }

                const voiceNames = { 's': 'Soprano', 'a': 'Contralto', 't': 'Tenor', 'b': 'Bajo' };
                const scaleName = currentScale.charAt(0).toUpperCase() + currentScale.slice(1);
                const keyName = keyin[currentKey];

                alert(`✅ Ajustado a escala: ${notesAdjusted} notas ajustadas en ${updatedCount} compases\nVoz: ${voiceNames[selectedVoice]}\nEscala: ${keyName} ${scaleName}`);
            });
        }
    }

    // Attach listeners on initial load
    attachHarmonizeListeners();

    // Make function globally available for re-attachment after dynamic injection
    window.attachHarmonizeListeners = attachHarmonizeListeners;

    // MUSICOLI: Store the real implementation and mark as ready
    window._applyTextLayerImpl = applyTextLayer;
    applyTextLayerReady = true;

    // Update the wrapper to call the real implementation
    window.applyTextLayer = function () {
        if (typeof window._applyTextLayerImpl === 'function') {
            window._applyTextLayerImpl();
        }
    };

    console.log('✅ [INIT] window.applyTextLayer real implementation ready');

    // Process any queued calls
    if (typeof window._processApplyTextLayerQueue === 'function') {
        window._processApplyTextLayerQueue();
    }
});


// ============================================
// MODE BUTTON EVENT HANDLERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Mode button configuration
    const modeButtons = {
        'mode-ritmo': 'ritmo',
        'mode-tonalidad': 'tonalidad',
        'mode-lyrics': 'lyrics',
        'mode-dinamica': 'dinamica',
        'mode-instrumentacion': 'instrumentacion'
    };

    // Editor element IDs
    const editors = {
        'ritmo': 'editor-ritmo',
        'tonalidad': 'editor-tonalidad',
        'lyrics': 'editor-lyrics',
        'dinamica': 'editor-dinamica',
        'instrumentacion': 'editor-instrumentacion'
    };

    // Function to switch mode
    function switchMode(mode) {
        console.log('🔄 Switching to mode:', mode);

        // Update body class for theme
        document.body.classList.remove('app-mode-ritmo', 'app-mode-tonalidad', 'app-mode-lyrics', 'app-mode-dinamica', 'app-mode-instrumentacion');
        document.body.classList.add('app-mode-' + mode);

        // Update current edit mode global variable
        if (typeof window.currentEditMode !== 'undefined') {
            window.currentEditMode = mode;
        }

        // Update button states - remove 'active' from all, add to selected
        Object.keys(modeButtons).forEach(buttonId => {
            const btn = document.getElementById(buttonId);
            if (btn) {
                if (modeButtons[buttonId] === mode) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });

        // Show/hide editors
        Object.keys(editors).forEach(editorMode => {
            const editor = document.getElementById(editors[editorMode]);
            if (editor) {
                if (editorMode === mode) {
                    editor.style.display = 'block';
                } else {
                    editor.style.display = 'none';
                }
            }
        });

        // Mode-specific logic

        // Harmonize container: Only in Tonalidad
        // Harmonize container: Only in Tonalidad
        // Harmonize container: Only in Tonalidad
        const harmonizeContainer = document.getElementById('harmonize-container');
        const editorTonalidad = document.getElementById('editor-tonalidad');

        if (mode === 'tonalidad') {
            console.log('🔍 Switching to Tonalidad. Verifying Harmonize Container...');

            // Allow time for any clearing scripts to run
            setTimeout(() => {
                let currentContainer = document.getElementById('harmonize-container');
                const currentEditor = document.getElementById('editor-tonalidad');

                if (!currentContainer && currentEditor) {
                    console.warn('⚠️ Harmonize container missing. Re-injecting...');

                    const newItem = document.createElement('div');
                    newItem.id = 'harmonize-container';
                    // High Visibility Styles
                    newItem.style.cssText = 'margin: 20px 0; padding: 20px; background: #fff3e0; border: 2px solid #ff9800; border-radius: 8px; text-align: left; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: block !important;';

                    newItem.innerHTML = `
                        <h4 style="margin-top: 0; margin-bottom: 15px; font-family: monospace; color: #e65100; font-size: 16px; font-weight: bold;">
                          🎹 ZONA DE ARMONIZACIÓN
                        </h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                            <button id="harmonize-btn" class="theme-btn"
                              style="padding: 8px 16px; font-size: 14px; cursor: pointer; border: none; border-radius: 4px; font-family: monospace; font-weight: bold; background: #ff9800; color: white;">
                              ✨ Armonizar
                            </button>
                            <button id="harmonize-scale-btn" class="theme-btn"
                              style="padding: 8px 16px; font-size: 14px; cursor: pointer; border: none; border-radius: 4px; font-family: monospace; font-weight: bold; background: #4CAF50; color: white;">
                              🎼 Escala
                            </button>

                            <div style="width: 1px; height: 24px; background: #ddd; margin: 0 5px;"></div>

                            <div style="display: flex; align-items: center; gap: 5px; background: #fff3e0; padding: 4px 8px; border-radius: 4px; border: 1px solid #ffe0b2;">
                                <input type="number" id="transpose-amount" value="0" 
                                    style="width: 50px; padding: 6px; border: 1px solid #ff9800; border-radius: 4px; font-family: monospace; font-weight: bold; text-align: center;">
                                
                                <select id="transpose-unit" 
                                    style="padding: 6px; border: 1px solid #ff9800; border-radius: 4px; font-family: monospace; font-weight: bold; background: white;">
                                    <option value="scale">Escala (E)</option>
                                    <option value="semitone">Tono (ST)</option>
                                </select>

                                <button onclick="triggerDuplicate()" class="theme-btn"
                                  style="padding: 8px 16px; font-size: 14px; cursor: pointer; border: none; border-radius: 4px; font-family: monospace; font-weight: bold; background: #ff9800; color: white;">
                                  Duplicar
                                </button>
                                
                                <button onclick="triggerTranspose()" class="theme-btn"
                                  style="padding: 8px 16px; font-size: 14px; cursor: pointer; border: none; border-radius: 4px; font-family: monospace; font-weight: bold; background: #9c27b0; color: white;">
                                  Trasponer
                                </button>
                            </div>
                        </div>
                    `;

                    currentEditor.insertBefore(newItem, currentEditor.firstChild);
                    currentContainer = newItem;
                    console.log('✅ Harmonize Container restored.');

                    // Re-attach event listeners to the new buttons
                    if (typeof attachHarmonizeListeners === 'function') {
                        attachHarmonizeListeners();
                        console.log('✅ Harmonize listeners re-attached.');
                    }
                }

                if (currentContainer) {
                    currentContainer.style.setProperty('display', 'block', 'important');
                }
            }, 100);

        } else {
            // Hide if exists types
            const cont = document.getElementById('harmonize-container');
            if (cont) cont.style.display = 'none';
        }

        // Tonalidad Ladder: Only in Ritmo
        const tonalidadLadder = document.getElementById('editor-tonalidad-ladder');
        if (tonalidadLadder) {
            tonalidadLadder.style.display = (mode === 'ritmo') ? 'inline' : 'none';
        }

        // Lyrics Title Input: Only in Lyrics mode
        const lyricsTitleInput = document.getElementById('lyrics-title-input');
        if (lyricsTitleInput) {
            lyricsTitleInput.style.display = (mode === 'lyrics') ? 'inline-block' : 'none';
            // Sync value if becoming visible
            if (mode === 'lyrics' && typeof window.bdi !== 'undefined' && window.bdi.metadata && window.bdi.metadata.title) {
                lyricsTitleInput.value = window.bdi.metadata.title;
            }
        }

        // Scale Controls (escoci): Only in Tonalidad (Melodía) mode
        const escociSpan = document.getElementById('escoci');
        if (escociSpan) {
            escociSpan.style.display = (mode === 'tonalidad') ? 'inline' : 'none';
            console.log('🎵 Scale controls (escoci) visibility:', mode === 'tonalidad' ? 'visible' : 'hidden');
        }

        // Refresh notepad display to update measure number styling
        if (typeof window.applyTextLayer === 'function') {
            window.applyTextLayer();
        }

        console.log('✅ Mode switched to:', mode);
    }

    // Attach event listeners to mode buttons
    Object.keys(modeButtons).forEach(buttonId => {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.addEventListener('click', () => {
                const mode = modeButtons[buttonId];
                switchMode(mode);
            });
            console.log('✅ Event listener attached to:', buttonId);
        } else {
            console.warn('⚠️ Button not found:', buttonId);
        }
    });

    // Initialize with ritmo mode active (default)
    console.log('🎵 Initializing mode system...');
    switchMode('ritmo');
});











// ========== DUPLICATE PHRASE SYSTEM ==========

// Helper to read values from UI and call duplicatePhrase (with transposition)
window.triggerDuplicate = function () {
    const amountInput = document.getElementById('transpose-amount');
    const unitSelect = document.getElementById('transpose-unit');

    const amount = parseInt(amountInput ? amountInput.value : 0) || 0;
    const unit = unitSelect ? unitSelect.value : 'scale';

    duplicatePhrase(amount, unit);
};

// Helper to transpose current phrase without duplicating
window.triggerTranspose = function () {
    const amountInput = document.getElementById('transpose-amount');
    const unitSelect = document.getElementById('transpose-unit');

    const amount = parseInt(amountInput ? amountInput.value : 0) || 0;
    const unit = unitSelect ? unitSelect.value : 'scale';

    transposePhrase(amount, unit);
};

// Function to duplicate current phrase with optional transposition
// amount: integer (positive or negative)
// unit: 'scale' or 'semitone'
window.duplicatePhrase = function (amount, unit) {
    if (!window.bdi || !window.bdi.bar || window.bdi.bar.length === 0) {
        alert('No hay frase para duplicar. Crea una frase primero.');
        return;
    }

    console.log(`🔄 Duplicating phrase. Amount: ${amount}, Unit: ${unit}`);

    // Save state for undo before modification
    if (typeof saveBdiState === 'function') {
        saveBdiState();
    }

    const originalMeasures = cleanForJSON(window.bdi.bar);
    const newMeasures = JSON.parse(JSON.stringify(originalMeasures)); // Deep copy

    // If transposition is needed (amount != 0)
    if (amount !== 0) {
        // Get current scale context
        const currentScale = escalas[scali] || 'mayor';
        const currentKey = keyinselecti; // 0-11
        const scaleIntervals = escalasNotas[currentScale];

        // Build full scale map (expanded to multiple octaves)
        const validScaleNotes = [];
        for (let octave = 0; octave <= 10; octave++) {
            scaleIntervals.forEach(interval => {
                const midiNote = (octave * 12) + currentKey + interval;
                if (midiNote >= 0 && midiNote <= 127) {
                    validScaleNotes.push(midiNote);
                }
            });
        }
        validScaleNotes.sort((a, b) => a - b);

        const findNearestIndex = (note) => {
            let minDist = Infinity;
            let idx = -1;
            for (let i = 0; i < validScaleNotes.length; i++) {
                const dist = Math.abs(note - validScaleNotes[i]);
                if (dist < minDist) {
                    minDist = dist;
                    idx = i;
                }
            }
            return idx;
        };

        const transposeNote = (note) => {
            if (note < 0) return note; // Ignore rests

            if (unit === 'semitone') {
                // Semitone/Chromatic Transposition
                const newNote = note + amount;
                return Math.max(0, Math.min(127, newNote));
            }

            if (unit === 'scale') {
                // Scale Step Transposition
                const idx = findNearestIndex(note);
                if (idx === -1) return note; // Should not happen if scale is correct

                let newIdx = idx + amount;
                // Clamp to valid arrays
                newIdx = Math.max(0, Math.min(validScaleNotes.length - 1, newIdx));
                return validScaleNotes[newIdx];
            }

            return note;
        };

        // Apply to all notes in newMeasures
        newMeasures.forEach(measure => {
            // Main notes
            if (measure.nimidi && Array.isArray(measure.nimidi)) {
                measure.nimidi = measure.nimidi.map(transposeNote);
            }

            // Voice-specific notes
            if (measure.voci && Array.isArray(measure.voci)) {
                measure.voci.forEach(voice => {
                    if (voice.nimidi && Array.isArray(voice.nimidi)) {
                        voice.nimidi = voice.nimidi.map(transposeNote);
                    }
                });
            }
        });
    }

    // Append new measures to current song
    window.bdi.bar = window.bdi.bar.concat(newMeasures);

    console.log(`✅ Phrase duplicated. Added ${newMeasures.length} measures.`);

    // Update everything
    if (typeof updateAfterBdiChange === 'function') {
        updateAfterBdiChange();
    } else {
        // Fallback updates
        if (typeof rebuildRecordi === 'function') rebuildRecordi();
        if (typeof applyTextLayer === 'function') applyTextLayer();
        const bdiDisplay = document.getElementById('bdi-display');
        if (bdiDisplay) bdiDisplay.value = JSON.stringify(window.bdi.bar, null, 2);
    }
};


// Function to update individual track volume
window.updateTrackVolume = function (voiceKey, value) {
    if (!window.bdi.metadata) window.bdi.metadata = { voices: {} };
    if (!window.bdi.metadata.voices) window.bdi.metadata.voices = {};
    if (!window.bdi.metadata.voices[voiceKey]) {
        window.bdi.metadata.voices[voiceKey] = { instrument: 1, percussion: false, volume: 100 };
    }

    window.bdi.metadata.voices[voiceKey].volume = parseInt(value);
    console.log('🔊 Track ' + voiceKey + ' volume set to ' + value);

    // Rebuild only if we have measures to render
    if (window.bdi.bar && window.bdi.bar.length > 0) {
        if (typeof rebuildRecordi === 'function') {
            rebuildRecordi();
        } else if (typeof updateAfterBdiChange === 'function') {
            updateAfterBdiChange();
        }
    }
};

// Ensure initial layout is correct
if (typeof updateTrackLayout === 'function') {
    // Default to 's' or whatever is in BDI metadta
    const initialVoice = (window.bdi && window.bdi.metadata && window.bdi.metadata.voici) ? window.bdi.metadata.voici : 's';
    updateTrackLayout(initialVoice);
    // Allow time for other inits then render
    setTimeout(() => {
        if (typeof renderVisualTracks === 'function') renderVisualTracks();
        if (typeof applyNotepadColoring === 'function') applyNotepadColoring();
    }, 500);
}

// Ensure all measures have lyrics field (liri) for all voices
window.ensureLyricsField = function () {
    if (!window.bdi || !window.bdi.bar) return;

    window.bdi.bar.forEach(measure => {
        // Ensure measure has voices array
        if (measure.voci && Array.isArray(measure.voci)) {
            measure.voci.forEach(voice => {
                if (typeof voice.liri === 'undefined') {
                    voice.liri = '';
                }
            });
        }
    });
    console.log('✅ Lyrics fields ensured.');

    // Force update of BDI display to show new fields
    const bdiDisplay = document.getElementById('bdi-display');
    if (bdiDisplay && window.bdi && window.bdi.bar) {
        bdiDisplay.value = JSON.stringify(window.bdi.bar, null, 2);
    }
};

// Run migration immediately
if (window.bdi && window.bdi.bar) {
    window.ensureLyricsField();
}

// Initialize modal editor UI with placeholder (without opening for editing)
// This shows a visual example without triggering events
setTimeout(() => {
    // DO NOT set currentEditingMeasureIndex - keep modal closed for editing
    // window.currentEditingMeasureIndex remains undefined

    console.log('🎹 Modal editor UI initialized with placeholder (not open for editing)');

    // Update modal UI to show placeholder measure number
    const measureNumSpan = document.getElementById('midi-editor-measure-num');
    if (measureNumSpan) {
        measureNumSpan.textContent = '1'; // Display as measure 1 (visual only)
    }

    // Show a visual placeholder with a whole note (MIDI 60) without making it editable
    const midiInputsContainer = document.getElementById('midi-inputs-container');
    if (midiInputsContainer) {
        midiInputsContainer.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: #666; font-family: monospace; margin-bottom: 15px;">
                    Selecciona un patrón rítmico y haz clic en una escala para comenzar
                </p>
                <div style="font-family: 'Bravura', serif; font-size: 48px; color: #ccc; user-select: none;">
                    𝅝
                </div>
                <p style="color: #999; font-family: monospace; font-size: 11px; margin-top: 10px;">
                    MIDI: 60 (Do central) - Nota redonda
                </p>
            </div>
        `;
    }
}, 600); // Wait for other initializations to complete
