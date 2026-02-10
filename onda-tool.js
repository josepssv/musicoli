
// ==========================================
// ONDA TOOL - Sine Wave Generators
// ==========================================



// 2. STANDARD ONDA (Pitch Only)
window.applyOndaFromUI = function () {
    console.log("Applying Onda (Pitch/MIDI Only) to Single Track with Tessitura Check...");

    const ampSelect = document.getElementById('onda-amp');
    const freqSelect = document.getElementById('onda-freq');
    if (!ampSelect || !freqSelect) {
        console.error("Onda controls not found");
        return;
    }

    const amplitude = parseFloat(ampSelect.value);
    const cycleLength = parseFloat(freqSelect.value);

    // 1. Identify Target Voice
    const voiceSelector = document.getElementById('voice-selector');
    const selectedVoiceKey = voiceSelector ? voiceSelector.value : 's';

    // DEFINE TESSITURA RANGES
    const tessitura = {
        's': { min: 60, max: 84 }, // C4 - C6
        'a': { min: 53, max: 74 }, // F3 - D5
        't': { min: 48, max: 69 }, // C3 - A4
        'b': { min: 40, max: 62 }  // E2 - D4
    };

    // Explicit Fallback for range
    const range = tessitura[selectedVoiceKey] || { min: 0, max: 127 };
    console.log(`Checking range for ${selectedVoiceKey}: ${range.min} to ${range.max}`);

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

    // --- APPLY WAVE TO SINGLE TRACK ---

    let globalNoteIndex = 0;
    const measures = window.bdi.bar;

    measures.forEach((measure) => {
        if (!measure.voci || !Array.isArray(measure.voci)) return;

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

                    const t = (globalNoteIndex % cycleLength) / cycleLength;
                    const waveVal = Math.sin(t * 2 * Math.PI);
                    const offsetSteps = Math.round(waveVal * amplitude);

                    let newScaleIdx = currentScaleIdx + offsetSteps;

                    // Force clamps to remain within MIDI table
                    if (newScaleIdx < 0) newScaleIdx = 0;
                    if (newScaleIdx >= validMidiNotes.length) newScaleIdx = validMidiNotes.length - 1;

                    const newMidi = validMidiNotes[newScaleIdx];

                    // STRICT TESSITURA CHECK
                    if (newMidi < range.min || newMidi > range.max) {
                        // FORCE SILENCE via NEGATIVE NOTE & NEGATIVE TIPI

                        // 1. UPDATE MIDI TO NEGATIVE
                        voiceMidis[vIdx] = -Math.abs(newMidi);

                        // 2. UPDATE TIPI TO NEGATIVE (This is the critical flag for the UI/Player usually)
                        const oldTipi = voiceTipis[vIdx];
                        let newRestVal = -1;
                        if (oldTipi > 0) newRestVal = -oldTipi;
                        else if (oldTipi < 0) newRestVal = oldTipi;
                        else newRestVal = -1;

                        voiceTipis[vIdx] = newRestVal;

                    } else {
                        // VALID NOTE: Ensure POSITIVE
                        voiceMidis[vIdx] = Math.abs(newMidi); // Ensure MIDI is positive

                        // Ensure Tipi is Positive to indicate Note ON
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

    console.log(`Onda Finalized for Voice ${selectedVoiceKey}. Checked Range: ${range.min}-${range.max}`);
};

// 3. ONDA RITMO (Random Rhythm from patterns)
window.applyOndaRitmoFromUI = function () {
    console.log("Applying Onda Ritmo (Random Rhythm)...");

    const voiceSelector = document.getElementById('voice-selector');
    const selectedVoiceKey = voiceSelector ? voiceSelector.value : 's';
    const densitySelect = document.getElementById('onda-ritmo-density');

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
    const blockSelect = document.getElementById('onda-ritmo-block');
    const blockValue = blockSelect ? blockSelect.value : 'all'; // '1', '2', '4', '8', 'all'
    const blockSize = blockValue === 'all' ? Infinity : parseInt(blockValue);

    // Get Mode: 'random' or 'cyclic'
    const modeSelect = document.getElementById('onda-ritmo-mode');
    const mode = modeSelect ? modeSelect.value : 'random';

    // Pick Initial Random (Pattern A)
    let patternA = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
    // Pick Pattern B (for cyclic mode)
    let patternB = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];

    let currentPattern = patternA;
    console.log("Initial Pattern (A):", patternA);
    if (mode === 'cyclic') console.log("Cyclic Pattern (B):", patternB);

    // Action: Modify or Generate
    const actionSelect = document.getElementById('onda-ritmo-action');
    const action = actionSelect ? actionSelect.value : 'modify';

    // Quantity / Count (Used for both Generation count AND Modification range)
    const countInput = document.getElementById('onda-ritmo-count');
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
    workingMeasures.forEach((measure, localIndex) => {
        // "Absolute" logical index for pattern consistency. 
        // If we want the pattern to flow continuously from the start of the song, we use (startIndex + localIndex).
        // If we want the pattern to start fresh for this block, use localIndex.
        // Usually "Onda" implies continuity, so (startIndex + localIndex) might be better, 
        // BUT if I generate a block, I probably want it to start with Pattern A.
        // Let's use localIndex for predictable "Block" generation.
        // OR better: if Modify -> Continuity (startIndex + localIndex). If Generate -> Fresh (localIndex)?
        // User request "Debe también generar n compases".
        // Let's stick to localIndex (relative to operation) for now as it's cleaner for "Insert Pattern Here".

        const effectiveIndex = localIndex;

        if (blockValue !== 'all') {
            const blockIndex = Math.floor(effectiveIndex / blockSize);
            if (mode === 'cyclic') {
                currentPattern = (blockIndex % 2 === 0) ? patternA : patternB;
            } else {
                if (effectiveIndex > 0 && effectiveIndex % blockSize === 0) {
                    currentPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
                }
            }
        } else {
            currentPattern = patternA;
        }

        // Apply to Voice
        let targetVoice = null;
        if (measure.voci) targetVoice = measure.voci.find(v => v.nami === selectedVoiceKey);

        // Handle case where voice might not exist in empty text-generated measure (though we inited it above)
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
            if (selectedVoiceKey === 's') {
                measure.tipis = [...targetVoice.tipis];
                measure.nimidi = [...targetVoice.nimidi];
                measure.timis = new Array(newTipis.length).fill(1e-9); // Placeholder time
                measure.dinami = [...targetVoice.dinami];
            }
            changedCount++;
        }
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

