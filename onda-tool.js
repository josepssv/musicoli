
// ==========================================
// ONDA TOOL - Sine Wave Generators
// ==========================================



// Helper to get element by ID, checking for mode-specific prefixes (ritmo-, comp-) first
function getPrefixedElement(baseId) {
    const activeModeBtn = document.querySelector('.mode-btn.active');
    const modeId = activeModeBtn ? activeModeBtn.id : '';
    let prefix = '';

    if (modeId === 'mode-ritmo') prefix = 'ritmo-';
    else if (modeId === 'mode-composicion') prefix = 'comp-';

    // Try prefixed first, then fallback to original
    let el = document.getElementById(prefix + baseId);
    if (!el) el = document.getElementById(baseId);
    return el;
}

// Helper to determine which voices to affect
function getTargetVoiceKeys() {
    const activeModeBtn = document.querySelector('.mode-btn.active');
    const isCompositionMode = activeModeBtn && activeModeBtn.id === 'mode-composicion';

    if (isCompositionMode) {
        const targetSelect = document.getElementById('comp-onda-target');
        const targetMode = targetSelect ? targetSelect.value : 'selected';

        if (targetMode === 'audible') {
            const playbackSelector = document.getElementById('playback-selector');
            if (playbackSelector && playbackSelector.value) {
                return playbackSelector.value.split(',').filter(v => v);
            }
            // Fallback to all standard voices if nothing selected but mode is audible
            return ['s', 'a', 't', 'b'];
        }
    }

    // Default: Only the currently selected voice in the main UI
    const voiceSelector = document.getElementById('voice-selector');
    return [voiceSelector ? voiceSelector.value : 's'];
}

// 2. STANDARD ONDA (Pitch Only)
window.applyOndaFromUI = function () {
    console.log("Applying Onda (Pitch/MIDI Only)...");

    const ampSelect = getPrefixedElement('onda-amp');
    const freqSelect = getPrefixedElement('onda-freq');
    if (!ampSelect || !freqSelect) {
        console.error("Onda controls not found");
        return;
    }

    const amplitude = parseFloat(ampSelect.value);
    const cycleLength = parseFloat(freqSelect.value);

    // 1. Identify Target Voices
    const targetVoiceKeys = getTargetVoiceKeys();

    // DEFINE TESSITURA RANGES
    const tessitura = {
        's': { min: 60, max: 84 }, // C4 - C6
        'a': { min: 53, max: 74 }, // F3 - D5
        't': { min: 48, max: 69 }, // C3 - A4
        'b': { min: 40, max: 62 }  // E2 - D4
    };

    // Basic Validation
    if (typeof window.bdi === 'undefined' || !window.bdi.bar || window.bdi.bar.length === 0) {
        alert("No hay compases cargados.");
        return;
    }

    // --- GENERATE FULL SCALE MAP (0-127) ---
    let currentScaleName = 'mayor';
    let currentKeyIndex = 0; // C

    if (typeof escalas !== 'undefined' && typeof scali !== 'undefined') {
        currentScaleName = escalas[scali];
    }
    if (typeof keyinselecti !== 'undefined') {
        currentKeyIndex = keyinselecti;
    }

    const scaleIntervalsDict = {
        'mayor': [0, 2, 4, 5, 7, 9, 11],
        'menor': [0, 2, 3, 5, 7, 8, 10],
        'cromatica': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    };

    let intervals = scaleIntervalsDict[currentScaleName];
    if (typeof escalasNotas !== 'undefined' && escalasNotas[currentScaleName]) {
        intervals = escalasNotas[currentScaleName];
    }

    const validMidiNotes = [];
    for (let oct = -1; oct <= 9; oct++) {
        const base = oct * 12 + currentKeyIndex;
        intervals.forEach(step => {
            const note = base + step;
            if (note >= 0 && note <= 127) {
                validMidiNotes.push(note);
            }
        });
    }
    validMidiNotes.sort((a, b) => a - b);

    const getScaleIndex = (midi) => {
        let nearestIdx = 0;
        let minDiff = Infinity;
        for (let i = 0; i < validMidiNotes.length; i++) {
            const diff = Math.abs(validMidiNotes[i] - midi);
            if (diff < minDiff) {
                minDiff = diff;
                nearestIdx = i;
            }
        }
        return nearestIdx;
    };

    // --- APPLY WAVE TO SELECTED MEASURES ---

    // Save state for undo
    if (typeof window.saveBdiState === 'function') {
        window.saveBdiState();
    }

    // Determine Index Range
    let startIdx = 0;
    let endIdx = window.bdi.bar.length - 1;

    if (window.selectionRange && window.selectionRange.start !== -1) {
        startIdx = window.selectionRange.start;
        endIdx = window.selectionRange.end;
    }

    // Clamp
    const total = window.bdi.bar.length;
    startIdx = Math.max(0, Math.min(startIdx, total - 1));
    endIdx = Math.max(0, Math.min(endIdx, total - 1));

    console.log(`🌊 Applying Onda to range [${startIdx}, ${endIdx}] for voices: ${targetVoiceKeys.join(', ')}`);

    targetVoiceKeys.forEach((selectedVoiceKey, voiceIdx) => {
        const range = tessitura[selectedVoiceKey] || { min: 0, max: 127 };

        // Start each voice with a different phase/offset so they are independent
        let globalNoteIndex = Math.floor(voiceIdx * (cycleLength / targetVoiceKeys.length || 1.618));

        // Process only selected range
        for (let i = startIdx; i <= endIdx; i++) {
            const measure = window.bdi.bar[i];
            if (!measure.voci || !Array.isArray(measure.voci)) continue;

            // Find Target Voice Object
            const targetVoice = measure.voci.find(v => v.nami === selectedVoiceKey);

            if (targetVoice && targetVoice.tipis && targetVoice.tipis.length > 0) {

                if (!targetVoice.nimidi) targetVoice.nimidi = [];
                const voiceMidis = [...targetVoice.nimidi];
                const voiceTipis = [...targetVoice.tipis];

                targetVoice.tipis.forEach((vVal, vIdx) => {
                    const isRest = vVal < 0;
                    if (isRest) {
                        // Existing rest stays rest
                    } else {
                        let currentMidi = voiceMidis[vIdx];
                        if (!currentMidi && currentMidi !== 0) currentMidi = 60; // Fallback

                        const currentScaleIdx = getScaleIndex(currentMidi);

                        // FIX: Use cycleLength as frequency (cycles per note)
                        // avoid (globalNoteIndex % cycleLength) / cycleLength which fails for small values < 1
                        const t = globalNoteIndex * cycleLength;
                        const waveVal = Math.sin(t * 2 * Math.PI);
                        const offsetSteps = Math.round(waveVal * amplitude);

                        let newScaleIdx = currentScaleIdx + offsetSteps;

                        // Force clamps to remain within MIDI table
                        if (newScaleIdx < 0) newScaleIdx = 0;
                        if (newScaleIdx >= validMidiNotes.length) newScaleIdx = validMidiNotes.length - 1;

                        const newMidi = validMidiNotes[newScaleIdx];

                        // STRICT TESSITURA CHECK
                        if (newMidi < range.min || newMidi > range.max) {
                            voiceMidis[vIdx] = -Math.abs(newMidi);
                            const oldTipi = voiceTipis[vIdx];
                            let newRestVal = -1;
                            if (oldTipi > 0) newRestVal = -oldTipi;
                            else if (oldTipi < 0) newRestVal = oldTipi;
                            else newRestVal = -1;
                            voiceTipis[vIdx] = newRestVal;

                        } else {
                            voiceMidis[vIdx] = Math.abs(newMidi);
                            if (voiceTipis[vIdx] < 0) {
                                voiceTipis[vIdx] = Math.abs(voiceTipis[vIdx]);
                                if (voiceTipis[vIdx] === 0) voiceTipis[vIdx] = 1;
                            }
                        }
                    }

                    globalNoteIndex++;
                });

                targetVoice.nimidi = voiceMidis;
                targetVoice.tipis = voiceTipis;

                // Sync S if needed
                if (selectedVoiceKey === 's') {
                    measure.nimidi = [...voiceMidis];
                    measure.tipis = [...voiceTipis];
                }
            }
        }
    });

    // 4. Update UI AND RELOAD PLAYER
    if (typeof window.applyTextLayer === 'function') {
        window.applyTextLayer();
    }

    // Attempt to reload standard player if available
    if (typeof window.updatePlayer === 'function') {
        window.updatePlayer();
        console.log("Player updated.");
    } else {
        // Fallback: Check if there's a loadMidi function or similar
        const player = document.querySelector('midi-player');
        if (player && typeof player.reload === 'function') {
            player.reload();
        }
    }
};

// 3. ONDA RITMO (Random Rhythm from patterns)
window.applyOndaRitmoFromUI = function () {
    console.log("Applying Onda Ritmo (Random Rhythm)...");

    const targetVoiceKeys = getTargetVoiceKeys();
    const densitySelect = getPrefixedElement('onda-ritmo-density');

    // Check if trilipi is available
    if (typeof trilipi === 'undefined' || trilipi.length === 0) {
        alert("No hay patrones rítmicos cargados (trilipi).");
        return;
    }

    // Collect patterns
    let availablePatterns = [];

    // Check filter
    // If densitySelect exists, we could use it to filter by index of trilipi
    // e.g. "low" -> indices 1-3, "high" -> 4+
    // For now, if no specific logic requested, getting ALL patterns.

    trilipi.forEach(group => {
        if (group && Array.isArray(group)) {
            availablePatterns = availablePatterns.concat(group);
        }
    });

    if (availablePatterns.length === 0) {
        alert("No se encontraron patrones.");
        return;
    }

    // Get repetition setting
    const blockSelect = getPrefixedElement('onda-ritmo-block');
    const blockValue = blockSelect ? blockSelect.value : 'all'; // '1', '2', '4', '8', 'all'
    const blockSize = blockValue === 'all' ? Infinity : parseInt(blockValue);

    // Get Mode: 'random' or 'cyclic'
    const modeSelect = getPrefixedElement('onda-ritmo-mode');
    const mode = modeSelect ? modeSelect.value : 'random';

    // Pick Initial Random (Pattern A)
    let patternA = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
    // Pick Pattern B (for cyclic mode)
    let patternB = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];

    let currentPattern = patternA;
    console.log("Initial Pattern (A):", patternA);
    if (mode === 'cyclic') console.log("Cyclic Pattern (B):", patternB);

    // Action: Modify or Generate
    const actionSelect = getPrefixedElement('onda-ritmo-action');
    const action = actionSelect ? actionSelect.value : 'modify';

    // Quantity / Count (Used for both Generation count AND Modification range)
    const countInput = getPrefixedElement('onda-ritmo-count');
    let countVal = countInput ? parseInt(countInput.value) : 4;
    if (isNaN(countVal) || countVal < 1) countVal = 4;

    // Determine Start Index (Cursor / Selection)
    let startIndex = 0;
    if (typeof window.selectedMeasureIndex !== 'undefined' && window.selectedMeasureIndex >= 0) {
        startIndex = window.selectedMeasureIndex;
    }
    console.log(`Onda Ritmo Action: ${action}, Count: ${countVal}, StartIndex: ${startIndex}`);

    // Prepare measures to operate on
    let workingMeasures = [];

    if (action === 'generate') {
        // Create N new measures
        for (let i = 0; i < countVal; i++) {
            const newMeasure = {
                idi: Date.now() + i,
                numi: 0,
                nami: "Ritmo Gen",
                voci: [
                    { nami: 's', nimidi: [], tipis: [] },
                    { nami: 'a', nimidi: [], tipis: [] },
                    { nami: 't', nimidi: [], tipis: [] },
                    { nami: 'b', nimidi: [], tipis: [] }
                ],
                nimidi: [], tipis: [], timis: [], dinami: [], chordi: false
            };
            workingMeasures.push(newMeasure);
        }

        // Insert into BDI immediately so we can render/logic properly? 
        // Or apply rhythm first then insert? Better to apply first then insert.
    } else {
        // Modify Existing: Slice the range from StartIndex
        if (typeof window.bdi === 'undefined' || !window.bdi.bar) {
            alert("No hay partitura activa.");
            return;
        }

        // If "Modify", we modify 'countVal' measures starting from startIndex
        // If count goes beyond length, stop at end.
        const allMeasures = window.bdi.bar;
        const endIndex = Math.min(startIndex + countVal, allMeasures.length);

        console.log(`Modifying range: ${startIndex} to ${endIndex}`);

        // We operate on reference objects directly in the array
        for (let i = startIndex; i < endIndex; i++) {
            workingMeasures.push(allMeasures[i]);
        }
    }

    let changedCount = 0;

    // Apply Logic to workingMeasures
    targetVoiceKeys.forEach((vKey, vIdx) => {
        // Individual patterns for each voice
        let localPatternA = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
        let localPatternB = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
        let currentPattern = localPatternA;

        workingMeasures.forEach((measure, localIndex) => {
            const effectiveIndex = localIndex;

            if (mode === 'structure') {
                // FIXED STRUCTURE: Multiplicandose por dos desde la pista bajo (Bajo=Lento, Soprano=Rápido)
                // Disminuyendo a la mitad desde la capa superior (Soprano=8, Contralto=4, Tenor=2, Bajo=1)
                if (vKey === 's') currentPattern = [4, 4, 4, 4, 4, 4, 4, 4]; // 8 corcheas
                else if (vKey === 'a') currentPattern = [3, 3, 3, 3];        // 4 negras
                else if (vKey === 't') currentPattern = [2, 2];              // 2 blancas
                else if (vKey === 'b') currentPattern = [1];                 // 1 redonda
                else currentPattern = [3, 3, 3, 3]; // Fallback
            } else if (blockValue !== 'all') {
                const blockIndex = Math.floor(effectiveIndex / blockSize);
                if (mode === 'cyclic') {
                    currentPattern = (blockIndex % 2 === 0) ? localPatternA : localPatternB;
                } else {
                    if (effectiveIndex > 0 && effectiveIndex % blockSize === 0) {
                        currentPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
                    }
                }
            } else {
                currentPattern = localPatternA;
            }

            // Apply to Voice
            let targetVoice = null;
            if (measure.voci) targetVoice = measure.voci.find(v => v.nami === vKey);

            if (targetVoice) {
                const oldMidis = targetVoice.nimidi || [];
                const newTipis = [...currentPattern];
                const newMidis = [];

                if (oldMidis.length > 0) {
                    newTipis.forEach((t, k) => {
                        const existingMidi = oldMidis[k % oldMidis.length];
                        newMidis.push(Math.abs(existingMidi));
                    });
                } else {
                    newTipis.forEach(() => newMidis.push(60));
                }

                targetVoice.tipis = newTipis;
                targetVoice.nimidi = newMidis;

                // Dynamics
                if (!targetVoice.dinami || targetVoice.dinami.length !== newMidis.length) {
                    targetVoice.dinami = new Array(newMidis.length).fill(64);
                }

                // Sync S
                if (vKey === 's') {
                    measure.tipis = [...targetVoice.tipis];
                    measure.nimidi = [...targetVoice.nimidi];
                    measure.timis = new Array(newTipis.length).fill(1e-9);
                    measure.dinami = [...targetVoice.dinami];
                }
            }
        });
    });

    // Finalize Changes
    if (action === 'generate') {
        // INSERT (Splice) at StartIndex
        if (!window.bdi) window.bdi = { bar: [] };
        if (!window.bdi.bar) window.bdi.bar = [];

        // Splice: index, deleteCount (0), ...items
        window.bdi.bar.splice(startIndex, 0, ...workingMeasures);
        console.log(`Inserted ${workingMeasures.length} new measures at index ${startIndex}.`);

        if (typeof window.rebuildRecordi === 'function') window.rebuildRecordi();
    } else {
        console.log(`Modified ${workingMeasures.length} existing measures starting at ${startIndex}.`);
    }

    // Refresh Logic
    if (typeof window.applyTextLayer === 'function') window.applyTextLayer();
    if (typeof window.updatePlayer === 'function') {
        window.updatePlayer();
    } else {
        const player = document.querySelector('midi-player');
        if (player && typeof player.reload === 'function') player.reload();
    }
};


// 4. DYNAMIC SHAPE MODELING
window.applyDynamicShapeFromUI = function () {
    console.log("Applying Dynamic Shape Modeling...");

    const shapeTypeEl = getPrefixedElement('dynamic-shape-type');
    const shapeType = shapeTypeEl ? shapeTypeEl.value : 'crescendo';

    const minEl = getPrefixedElement('dynamic-min');
    const minVal = minEl ? parseInt(minEl.value) : 40;

    const maxEl = getPrefixedElement('dynamic-max');
    const maxVal = maxEl ? parseInt(maxEl.value) : 110;

    const extraEl = getPrefixedElement('dynamic-extra-val');
    const extraVal = extraEl ? parseFloat(extraEl.value) : 1;

    // 1. Identify Target Voices
    const voiceKeys = getTargetVoiceKeys();

    if (typeof window.bdi === 'undefined' || !window.bdi.bar || window.bdi.bar.length === 0) {
        alert("No hay compases cargados.");
        return;
    }

    // Determine Index Range
    let startIdx = 0;
    let endIdx = window.bdi.bar.length - 1;

    if (window.selectionRange && window.selectionRange.start !== -1) {
        startIdx = window.selectionRange.start;
        endIdx = window.selectionRange.end;
    }

    // Clamp
    const total = window.bdi.bar.length;
    startIdx = Math.max(0, Math.min(startIdx, total - 1));
    endIdx = Math.max(0, Math.min(endIdx, total - 1));

    console.log(`🌊 Applying Dynamic Shape Modeling to range [${startIdx}, ${endIdx}]`);

    // Process only selected range
    // Apply to each selected voice
    voiceKeys.forEach((voiceKey, vIdx) => {
        const voicePhaseShift = vIdx * 0.25;
        // 2. Count total notes for normalization in selection
        let totalNotes = 0;
        for (let i = startIdx; i <= endIdx; i++) {
            const measure = window.bdi.bar[i];
            const targetVoice = (measure.voci && Array.isArray(measure.voci)) ?
                measure.voci.find(v => v.nami === voiceKey) :
                (measure.voci ? measure.voci[voiceKey] : null);
            if (targetVoice && targetVoice.nimidi) {
                totalNotes += targetVoice.nimidi.length;
            }
        }

        if (totalNotes === 0) {
            console.warn("No se encontraron notas para la voz: " + voiceKey);
            return; // Skip this voice
        }

        let globalNoteIdx = 0;

        for (let i = startIdx; i <= endIdx; i++) {
            const measure = window.bdi.bar[i];
            const targetVoice = (measure.voci && Array.isArray(measure.voci)) ?
                measure.voci.find(v => v.nami === voiceKey) :
                (measure.voci ? measure.voci[voiceKey] : null);

            if (!targetVoice || !targetVoice.nimidi) continue;

            if (!targetVoice.dinami || targetVoice.dinami.length !== targetVoice.nimidi.length) {
                targetVoice.dinami = new Array(targetVoice.nimidi.length).fill(64);
            }

            const numNotesInMeasure = targetVoice.nimidi.length;

            for (let n = 0; n < numNotesInMeasure; n++) {
                let dyn = 64;
                const progress = totalNotes > 1 ? globalNoteIdx / (totalNotes - 1) : 0;

                switch (shapeType) {
                    case 'crescendo':
                        dyn = minVal + (maxVal - minVal) * progress;
                        break;
                    case 'diminuendo':
                        dyn = maxVal - (maxVal - minVal) * progress;
                        break;
                    case 'pico':
                        if (progress <= 0.5) {
                            dyn = minVal + (maxVal - minVal) * (progress * 2);
                        } else {
                            const p2 = (progress - 0.5) * 2;
                            dyn = maxVal - (maxVal - minVal) * p2;
                        }
                        break;
                    case 'valle':
                        if (progress <= 0.5) {
                            dyn = maxVal - (maxVal - minVal) * (progress * 2);
                        } else {
                            const p2 = (progress - 0.5) * 2;
                            dyn = minVal + (maxVal - minVal) * p2;
                        }
                        break;
                    case 'uniforme':
                        const noteNum = globalNoteIdx + 1;
                        const nStep = Math.round(extraVal) || 4;
                        dyn = (noteNum % nStep === 0) ? maxVal : minVal;
                        break;
                    case 'ondas':
                        const wavelength = extraVal || 8;
                        const tWave = (globalNoteIdx / wavelength) + voicePhaseShift;
                        const wave = 0.5 + 0.5 * Math.sin(tWave * 2 * Math.PI);
                        dyn = minVal + (maxVal - minVal) * wave;
                        break;
                }

                targetVoice.dinami[n] = Math.max(0, Math.min(127, Math.round(dyn)));
                globalNoteIdx++;
            }

            if (voiceKey === 's') {
                measure.dinami = [...targetVoice.dinami];
            }
        }
    });

    // Finalize Changes
    if (typeof window.applyTextLayer === 'function') window.applyTextLayer();
    if (typeof window.updatePlayer === 'function') {
        window.updatePlayer();
    } else {
        const player = document.querySelector('midi-player');
        if (player && typeof player.reload === 'function') player.reload();
    }

    // Save state for undo
    if (typeof window.saveBdiState === 'function') {
        window.saveBdiState();
    }

    console.log(`Dynamic shape ${shapeType} applied to voices: ${voiceKeys.join(', ')}`);
};


// 5. COMBINED ONDA (Rhythm + Pitch)
window.applyOndaCompletaFromUI = function () {
    console.log("🌊 Applying Combined Onda (Rhythm + Pitch)...");

    // 1. Identify Target Voice and Current State
    const voiceSelector = document.getElementById('voice-selector');
    const selectedVoiceKey = voiceSelector ? voiceSelector.value : 's';

    // Save state for undo
    if (typeof window.saveBdiState === 'function') {
        window.saveBdiState();
    }

    // 2. Determine indices BEFORE running rhythm
    let startIndex = 0;
    if (typeof window.selectedMeasureIndex !== 'undefined' && window.selectedMeasureIndex >= 0) {
        startIndex = window.selectedMeasureIndex;
    }
    const countInput = getPrefixedElement('onda-ritmo-count');
    let countVal = countInput ? parseInt(countInput.value) : 4;

    // 3. APPLY RHYTHM FIRST
    window.applyOndaRitmoFromUI();

    // 4. APPLY PITCH ONDA to the EXACT same range
    // We temporarily override selectionRange to force applyOndaFromUI to work on the new/modified block
    const oldSelection = window.selectionRange ? { ...window.selectionRange } : null;

    window.selectionRange = {
        start: startIndex,
        end: startIndex + countVal - 1
    };

    console.log(`Applying Pitch layer to range [${window.selectionRange.start}, ${window.selectionRange.end}]`);

    // 5. APPLY PITCH ONDA
    window.applyOndaFromUI();

    // 6. APPLY DYNAMICS (VOLUME)
    window.applyDynamicShapeFromUI();

    // Restore selection
    if (oldSelection) {
        window.selectionRange = oldSelection;
    }

    // FINAL SYNC for UI
    if (typeof window.applyTextLayer === 'function') window.applyTextLayer();
    if (typeof window.updatePlayer === 'function') window.updatePlayer();

    console.log("✅ Combined Onda finalized.");
};

// UI Listener for Shape Type
document.addEventListener('DOMContentLoaded', () => {
    const shapeTypeSelect = document.getElementById('dynamic-shape-type');
    const extraParams = document.getElementById('dynamic-params-extra');
    const extraLabel = document.getElementById('dynamic-extra-label');
    const extraInput = document.getElementById('dynamic-extra-val');

    if (shapeTypeSelect) {
        shapeTypeSelect.addEventListener('change', () => {
            const val = shapeTypeSelect.value;
            if (val === 'uniforme') {
                extraParams.style.display = 'flex';
                extraLabel.textContent = 'Cada N:';
                extraInput.value = 4;
                extraInput.step = 1;
            } else if (val === 'ondas') {
                extraParams.style.display = 'flex';
                extraLabel.textContent = 'Ciclo (N):';
                extraInput.value = 8;
                extraInput.step = 0.5;
            } else {
                extraParams.style.display = 'none';
            }
        });
    }
});
