/**
 * clipboard_tool.js
 * Handles copying and pasting measures based on ruler selection.
 */

(function () {
    window.measureClipboard = [];

    function initClipboard() {
        const copyBtn = document.getElementById('copy-measures-btn');
        const cutBtn = document.getElementById('cut-measures-btn');
        const pasteBtn = document.getElementById('paste-measures-btn');
        const dubBtn = document.getElementById('duplicate-measures-btn');
        const varBtn = document.getElementById('variation-measures-btn');

        if (copyBtn) {
            copyBtn.addEventListener('click', copyMeasures);
        }
        if (cutBtn) {
            cutBtn.addEventListener('click', cutMeasures);
        }
        if (pasteBtn) {
            pasteBtn.addEventListener('click', pasteMeasures);
        }
        if (dubBtn) {
            dubBtn.addEventListener('click', duplicateMeasures);
        }
        if (varBtn) {
            varBtn.addEventListener('click', variationMeasures);
        }

        console.log(' Clipboard Tool initialized');
    }

    function copyMeasures() {
        if (!window.bdi || !window.bdi.bar) return;

        let startIdx = -1;
        let endIdx = -1;

        if (window.selectionRange && window.selectionRange.start !== -1) {
            startIdx = window.selectionRange.start;
            endIdx = window.selectionRange.end;
        } else if (typeof window.selectedMeasureIndex !== 'undefined' && window.selectedMeasureIndex !== -1) {
            startIdx = window.selectedMeasureIndex;
            endIdx = window.selectedMeasureIndex;
        }

        if (startIdx === -1) {
            console.warn(' Nada seleccionado para copiar');
            return;
        }

        // Clamp to real measures
        const realTotal = window.bdi.bar.length;
        const validStart = Math.max(0, startIdx);
        const validEnd = Math.min(endIdx, realTotal - 1);

        if (validStart >= realTotal) {
            console.warn(' La selección está fuera de los compases reales');
            return;
        }

        const measuresToCopy = window.bdi.bar.slice(validStart, validEnd + 1);

        // Deep copy to avoid reference issues
        window.measureClipboard = JSON.parse(JSON.stringify(measuresToCopy));

        console.log(` Copiados ${window.measureClipboard.length} compases (${validStart + 1} - ${validEnd + 1})`);

        // Visual feedback
        const copyBtn = document.getElementById('copy-measures-btn');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '¡Copiado!';
            copyBtn.style.backgroundColor = '#4CAF50';
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.backgroundColor = '';
            }, 1000);
        }
    }

    function cutMeasures() {
        if (!window.bdi || !window.bdi.bar) return;

        let startIdx = -1;
        let endIdx = -1;

        if (window.selectionRange && window.selectionRange.start !== -1) {
            startIdx = window.selectionRange.start;
            endIdx = window.selectionRange.end;
        } else if (typeof window.selectedMeasureIndex !== 'undefined' && window.selectedMeasureIndex !== -1) {
            startIdx = window.selectedMeasureIndex;
            endIdx = window.selectedMeasureIndex;
        }

        if (startIdx === -1) {
            console.warn(' Nada seleccionado para cortar');
            return;
        }

        const realTotal = window.bdi.bar.length;
        const validStart = Math.max(0, startIdx);
        const validEnd = Math.min(endIdx, realTotal - 1);

        if (validStart >= realTotal) {
            console.warn(' La selección está fuera de los compases reales');
            return;
        }

        // 1. Copy
        const measuresToCopy = window.bdi.bar.slice(validStart, validEnd + 1);
        window.measureClipboard = JSON.parse(JSON.stringify(measuresToCopy));
        console.log(` Cortados ${window.measureClipboard.length} compases (${validStart + 1} - ${validEnd + 1})`);

        // Save state for undo
        if (typeof window.saveBdiState === 'function') {
            window.saveBdiState();
        }

        // 2. Delete backwards
        for (let i = validEnd; i >= validStart; i--) {
            if (typeof window.deleteMeasureWithMode === 'function') {
                window.deleteMeasureWithMode(i);
            } else {
                window.bdi.bar.splice(i, 1);
            }
        }

        // 3. Update measure numbers
        const voiceEditMode = (typeof window.voiceEditMode !== 'undefined') ? window.voiceEditMode : 'dependent';
        if (voiceEditMode === 'dependent') {
            window.bdi.bar.forEach((m, idx) => {
                m.numi = idx;
            });
        }

        // 4. Update UI
        if (typeof window.clearRulerSelection === 'function') {
            window.clearRulerSelection();
        }
        window.selectedMeasureIndex = -1;

        if (typeof window.syncMeasureCount === 'function') {
            window.syncMeasureCount();
        }
        if (typeof window.updateAfterBdiChange === 'function') {
            window.updateAfterBdiChange();
        }
        if (typeof window.updateRulerVisuals === 'function') {
            window.updateRulerVisuals();
        }

        // Visual feedback
        const cutBtn = document.getElementById('cut-measures-btn');
        if (cutBtn) {
            const originalText = cutBtn.textContent;
            cutBtn.textContent = '¡Cortado!';
            cutBtn.style.backgroundColor = '#e65c00';
            setTimeout(() => {
                cutBtn.textContent = originalText;
                cutBtn.style.backgroundColor = '';
            }, 1000);
        }
    }

    function pasteMeasures() {
        if (!window.bdi || !window.bdi.bar) return;
        if (!window.measureClipboard || window.measureClipboard.length === 0) {
            alert('El portapapeles está vacío');
            return;
        }

        // Determine insertion point
        let insertionIdx = 0;
        if (window.selectionRange && window.selectionRange.start !== -1) {
            insertionIdx = window.selectionRange.start;
        } else if (typeof window.selectedMeasureIndex !== 'undefined' && window.selectedMeasureIndex !== -1) {
            insertionIdx = window.selectedMeasureIndex;
        } else {
            insertionIdx = window.bdi.bar.length;
        }

        // Clamp to logical range: [0, total]
        const realTotal = window.bdi.bar.length;
        if (insertionIdx > realTotal) insertionIdx = realTotal;
        if (insertionIdx < 0) insertionIdx = 0;

        console.log(` Pegando ${window.measureClipboard.length} compases en el índice ${insertionIdx}`);

        // Save state for undo
        if (typeof window.saveBdiState === 'function') {
            window.saveBdiState();
        }

        // Create new copies for insertion
        const measuresToPaste = JSON.parse(JSON.stringify(window.measureClipboard));

        // Solo pegar en pistas audibles (el resto se silencia)
        const playbackSelector = document.getElementById('playback-selector');
        let activeStr = playbackSelector ? playbackSelector.value : 'audible';
        const activeVoices = (activeStr === 'audible' || activeStr === 's,a,t,b') ? ['s', 'a', 't', 'b'] : activeStr.split(',');

        measuresToPaste.forEach(item => {
            if (item.voci) {
                item.voci.forEach(voice => {
                    if (!activeVoices.includes(voice.nami)) {
                        // Silenciar la pista no audible
                        if (voice.nimidi) voice.nimidi = voice.nimidi.map(() => 0);
                        if (voice.tipis) voice.tipis = voice.tipis.map(t => -Math.abs(t));
                        voice.tarari = '';
                        voice.letra = '';
                    }
                });
            }
        });

        // Insert into bar
        window.bdi.bar.splice(insertionIdx, 0, ...measuresToPaste);

        // Update measure numbers (numi)
        window.bdi.bar.forEach((m, idx) => {
            m.numi = idx;
        });

        // Update cursor to end of paste
        const newCursorPos = insertionIdx + measuresToPaste.length;
        window.selectedMeasureIndex = newCursorPos;
        if (window.np6) window.np6.cursorPos = newCursorPos;

        // Select the pasted range
        if (window.selectionRange) {
            window.selectionRange.start = insertionIdx;
            window.selectionRange.end = newCursorPos - 1;
        }

        // Finalize change
        if (typeof window.syncMeasureCount === 'function') {
            window.syncMeasureCount();
        }

        if (typeof window.updateAfterBdiChange === 'function') {
            window.updateAfterBdiChange();
        }

        // Update ruler visuals if possible
        if (typeof window.updateRulerVisuals === 'function') {
            window.updateRulerVisuals();
        }


        console.log(` Pegado completado. Nuevo total: ${window.bdi.bar.length} compases.`);

        // Visual feedback
        const pasteBtn = document.getElementById('paste-measures-btn');
        if (pasteBtn) {
            const originalText = pasteBtn.textContent;
            pasteBtn.textContent = '¡Pegado!';
            pasteBtn.style.backgroundColor = '#2196F3';
            setTimeout(() => {
                pasteBtn.textContent = originalText;
                pasteBtn.style.backgroundColor = '';
            }, 1000);
        }
    }

    function duplicateMeasures() {
        if (!window.bdi || !window.bdi.bar) return;

        let startIdx = -1;
        let endIdx = -1;

        if (window.selectionRange && window.selectionRange.start !== -1) {
            startIdx = window.selectionRange.start;
            endIdx = window.selectionRange.end;
        } else if (typeof window.selectedMeasureIndex !== 'undefined' && window.selectedMeasureIndex !== -1) {
            startIdx = window.selectedMeasureIndex;
            endIdx = window.selectedMeasureIndex;
        }

        if (startIdx === -1) {
            console.warn(' Nada seleccionado para duplicar');
            return;
        }

        const realTotal = window.bdi.bar.length;
        const validStart = Math.max(0, startIdx);
        const validEnd = Math.min(endIdx, realTotal - 1);

        if (validStart >= realTotal) {
            console.warn(' La selección está fuera de los compases reales');
            return;
        }

        // Copies to duplicate
        const measuresToCopy = window.bdi.bar.slice(validStart, validEnd + 1);
        const measuresToPaste = JSON.parse(JSON.stringify(measuresToCopy));

        const insertionIdx = validEnd + 1; // Insert right after the selection block

        console.log(` Duplicando ${measuresToCopy.length} compases en el índice ${insertionIdx}`);

        // Save state for undo
        if (typeof window.saveBdiState === 'function') {
            window.saveBdiState();
        }

        // Apply same silence logic for non-audible tracks as pasteMeasures
        const playbackSelector = document.getElementById('playback-selector');
        let activeStr = playbackSelector ? playbackSelector.value : 'audible';
        const activeVoices = (activeStr === 'audible' || activeStr === 's,a,t,b') ? ['s', 'a', 't', 'b'] : activeStr.split(',');

        measuresToPaste.forEach(item => {
            if (item.voci) {
                item.voci.forEach(voice => {
                    if (!activeVoices.includes(voice.nami)) {
                        if (voice.nimidi) voice.nimidi = voice.nimidi.map(() => 0);
                        if (voice.tipis) voice.tipis = voice.tipis.map(t => -Math.abs(t));
                        voice.tarari = '';
                        voice.letra = '';
                    }
                });
            }
        });

        // Insert into bar
        window.bdi.bar.splice(insertionIdx, 0, ...measuresToPaste);

        // Update measure numbers
        window.bdi.bar.forEach((m, idx) => {
            m.numi = idx;
        });

        // Select the newly pasted range automatically and put cursor at end of paste
        const newCursorPos = insertionIdx + measuresToPaste.length;
        window.selectedMeasureIndex = newCursorPos;
        if (window.np6) window.np6.cursorPos = newCursorPos;

        if (window.selectionRange) {
            window.selectionRange.start = insertionIdx;
            window.selectionRange.end = newCursorPos - 1;
        }

        if (typeof window.syncMeasureCount === 'function') {
            window.syncMeasureCount();
        }
        if (typeof window.updateAfterBdiChange === 'function') {
            window.updateAfterBdiChange();
        }
        if (typeof window.updateRulerVisuals === 'function') {
            window.updateRulerVisuals();
        }


        console.log(` Duplicación completada. Nuevo total: ${window.bdi.bar.length} compases.`);

        // Visual feedback
        const dubBtn = document.getElementById('duplicate-measures-btn');
        if (dubBtn) {
            const originalText = dubBtn.textContent;
            dubBtn.textContent = '¡Duplicado!';
            dubBtn.style.backgroundColor = '#9C27B0'; // Purple for duplicate
            dubBtn.style.color = '#fff';
            setTimeout(() => {
                dubBtn.textContent = originalText;
                dubBtn.style.backgroundColor = '';
                dubBtn.style.color = '';
            }, 1000);
        }
    }

    function variationMeasures() {
        if (!window.bdi || !window.bdi.bar) return;

        let startIdx = -1;
        let endIdx = -1;

        if (window.selectionRange && window.selectionRange.start !== -1) {
            startIdx = window.selectionRange.start;
            endIdx = window.selectionRange.end;
        } else if (typeof window.selectedMeasureIndex !== 'undefined' && window.selectedMeasureIndex !== -1) {
            startIdx = window.selectedMeasureIndex;
            endIdx = window.selectedMeasureIndex;
        }

        if (startIdx === -1) {
            console.warn(' Nada seleccionado para variar');
            return;
        }

        const realTotal = window.bdi.bar.length;
        const validStart = Math.max(0, startIdx);
        const validEnd = Math.min(endIdx, realTotal - 1);

        if (validStart >= realTotal) {
            console.warn(' La selección está fuera de los compases reales');
            return;
        }

        // Copies to apply variation
        const measuresToCopy = window.bdi.bar.slice(validStart, validEnd + 1);
        const measuresToPaste = JSON.parse(JSON.stringify(measuresToCopy));

        const insertionIdx = validEnd + 1; // Insert right after the selection block

        console.log(` Variando ${measuresToCopy.length} compases en el índice ${insertionIdx}`);

        // Save state for undo
        if (typeof window.saveBdiState === 'function') {
            window.saveBdiState();
        }

        const playbackSelector = document.getElementById('playback-selector');
        let activeStr = playbackSelector ? playbackSelector.value : 'audible';
        const activeVoices = (activeStr === 'audible' || activeStr === 's,a,t,b') ? ['s', 'a', 't', 'b'] : activeStr.split(',');

        // Calculate scale
        function getCurrentScaleNotes() {
            var scaleName = 'mayor';
            var keyIdx = 0;

            if (typeof window.escalas !== 'undefined' && typeof window.scali !== 'undefined') {
                scaleName = window.escalas[window.scali] || 'mayor';
            }
            if (typeof window.keyinselecti !== 'undefined') keyIdx = window.keyinselecti;

            var FALLBACK = {
                mayor: [0, 2, 4, 5, 7, 9, 11],
                menor: [0, 2, 3, 5, 7, 8, 10],
                cromatica: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            };

            var intervals = (typeof window.escalasNotas !== 'undefined' && window.escalasNotas[scaleName])
                ? window.escalasNotas[scaleName]
                : (FALLBACK[scaleName] || FALLBACK.mayor);

            var notes = [];
            for (var oct = -1; oct <= 9; oct++) {
                var base = oct * 12 + keyIdx;
                for (var i = 0; i < intervals.length; i++) {
                    var n = base + intervals[i];
                    if (n >= 0 && n <= 127) notes.push(n);
                }
            }
            notes.sort(function (a, b) { return a - b; });
            return notes;
        }

        const scaleNotes = getCurrentScaleNotes();

        // 1. Tonal Variation Settings
        const variationTonal = window.variationTonal || 'normal';
        let scaleStepOptions = [-3, -2, -1, 1, 2, 3];
        
        switch (variationTonal) {
            case 'subtle':
                scaleStepOptions = [-1, 1];
                break;
            case 'aggressive':
                scaleStepOptions = [-5, -4, 4, 5];
                break;
            case 'none':
                scaleStepOptions = [0];
                break;
            case 'final':
            case 'normal':
            default:
                scaleStepOptions = [-3, -2, -1, 1, 2, 3];
                break;
        }

        const scaleStepDelta = scaleStepOptions[Math.floor(Math.random() * scaleStepOptions.length)]; 

        // 2. Dynamic Variation Settings
        const variationDynamic = window.variationDynamic || 'none';

        // 3. Time/Duration Variation Settings
        const variationTime = window.variationTime || 'none';

        const tesituras = window.globalTessituras || {
            's': { min: 60, max: 81 },
            'a': { min: 55, max: 76 },
            't': { min: 48, max: 69 },
            'b': { min: 40, max: 64 }
        };

        // Pre-calculate total audible notes per voice for global dynamic effects (like Crescendo)
        const totalNotesPerVoice = {};
        const passedNotesPerVoice = {};
        activeVoices.forEach(vName => {
            totalNotesPerVoice[vName] = 0;
            passedNotesPerVoice[vName] = 0;
        });

        // 1. Time Variations Logic (Processes First)
        measuresToPaste.forEach(item => {
            if (item.voci) {
                item.voci.forEach(voice => {
                    if (activeVoices.includes(voice.nami)) {
                        if (variationTime !== 'none' && voice.tipis && voice.tipis.length > 0) {
                            const TIPIS_TO_BEATS = {
                                1: 4.0, 2: 2.0, 25: 3.0, 3: 1.0, 35: 1.5,
                                4: 0.5, 45: 0.75, 5: 0.25, 55: 0.375, 6: 0.125, 65: 0.1875
                            };
                            const beatsToCode = (beats) => {
                                let best = 3, minDiff = Infinity;
                                for (const [k, v] of Object.entries(TIPIS_TO_BEATS)) {
                                    const diff = Math.abs(beats - v);
                                    if (diff < minDiff) { minDiff = diff; best = parseInt(k); }
                                }
                                return best;
                            };

                            let absTipis = voice.tipis.map(t => Math.abs(t));
                            let originalNimidi = voice.nimidi ? [...voice.nimidi] : [];
                            let originalDinami = voice.dinami ? [...voice.dinami] : [];
                            
                            if (variationTime === 'rotation') {
                                const pivot = Math.floor(Math.random() * absTipis.length);
                                absTipis = [...absTipis.slice(pivot), ...absTipis.slice(0, pivot)];
                                if (voice.nimidi) voice.nimidi = [...originalNimidi.slice(pivot), ...originalNimidi.slice(0, pivot)];
                                if (voice.dinami) voice.dinami = [...originalDinami.slice(pivot), ...originalDinami.slice(0, pivot)];
                            } else if (variationTime === 'permutation') {
                                let indices = Array.from({length: absTipis.length}, (_, i) => i);
                                for (let i = indices.length - 1; i > 0; i--) {
                                    const j = Math.floor(Math.random() * (i + 1));
                                    [indices[i], indices[j]] = [indices[j], indices[i]];
                                }
                                absTipis = indices.map(i => absTipis[i]);
                                if (voice.nimidi) voice.nimidi = indices.map(i => originalNimidi[i] || 0);
                                if (voice.dinami) voice.dinami = indices.map(i => originalDinami[i] || 64);
                            } else if (variationTime === 'multiply' || variationTime === 'divide') {
                                const totalBeats = absTipis.reduce((s, t) => s + (TIPIS_TO_BEATS[t] || 1.0), 0);
                                let newTipis = [], newNimidi = [], newDinami = [];
                                
                                if (variationTime === 'multiply') {
                                    let accum = 0;
                                    for (let i = 0; i < absTipis.length; i++) {
                                        let dur = (TIPIS_TO_BEATS[absTipis[i]] || 1.0) * 2;
                                        if (accum + dur > totalBeats) {
                                            dur = totalBeats - accum;
                                        }
                                        if (dur > 0) {
                                            newTipis.push(beatsToCode(dur));
                                            newNimidi.push(voice.nimidi && voice.nimidi[i] ? voice.nimidi[i] : 0);
                                            newDinami.push(voice.dinami && voice.dinami[i] ? voice.dinami[i] : 64);
                                            accum += dur;
                                        }
                                        if (accum >= totalBeats) break;
                                    }
                                    if (accum < totalBeats) {
                                        newTipis.push(beatsToCode(totalBeats - accum));
                                        newNimidi.push(0);
                                        newDinami.push(0);
                                    }
                                } else if (variationTime === 'divide') {
                                    let halfAccum = 0;
                                    let firstHalfTipis = [], firstHalfNimidi = [], firstHalfDinami = [];
                                    
                                    for (let i = 0; i < absTipis.length; i++) {
                                        let dur = (TIPIS_TO_BEATS[absTipis[i]] || 1.0) / 2;
                                        firstHalfTipis.push(beatsToCode(dur));
                                        firstHalfNimidi.push(voice.nimidi && voice.nimidi[i] ? voice.nimidi[i] : 0);
                                        firstHalfDinami.push(voice.dinami && voice.dinami[i] ? voice.dinami[i] : 64);
                                        halfAccum += dur;
                                    }
                                    
                                    if (halfAccum < totalBeats / 2) {
                                        let padDur = (totalBeats / 2) - halfAccum;
                                        firstHalfTipis.push(beatsToCode(padDur));
                                        firstHalfNimidi.push(0);
                                        firstHalfDinami.push(0);
                                    } else if (halfAccum > totalBeats / 2) {
                                        let excess = halfAccum - (totalBeats / 2);
                                        while(excess > 0 && firstHalfTipis.length > 0) {
                                            let lastCode = firstHalfTipis.pop();
                                            let lastDur = TIPIS_TO_BEATS[lastCode] || 1.0;
                                            firstHalfNimidi.pop();
                                            firstHalfDinami.pop();
                                            if (lastDur > excess) {
                                                firstHalfTipis.push(beatsToCode(lastDur - excess));
                                                firstHalfNimidi.push(0);
                                                firstHalfDinami.push(0);
                                                break;
                                            } else {
                                                excess -= lastDur;
                                            }
                                        }
                                    }
                                    
                                    newTipis = [...firstHalfTipis, ...firstHalfTipis];
                                    newNimidi = [...firstHalfNimidi, ...firstHalfNimidi];
                                    newDinami = [...firstHalfDinami, ...firstHalfDinami];
                                }
                                
                                absTipis = newTipis;
                                if (voice.nimidi) voice.nimidi = newNimidi;
                                if (voice.dinami) voice.dinami = newDinami;
                                voice.tarari = '';
                                voice.letra = '';
                            }
                            
                            // Re-apply negative sign for rests if nimidi is 0 or undefined
                            voice.tipis = absTipis.map((t, i) => (voice.nimidi && voice.nimidi[i] > 0) ? t : -t);
                        }
                    } else {
                        // Silence non-audible tracks
                        if (voice.nimidi) voice.nimidi = voice.nimidi.map(() => 0);
                        if (voice.tipis) voice.tipis = voice.tipis.map(t => -Math.abs(t));
                        if (voice.dinami) voice.dinami = voice.dinami.map(() => 0);
                        voice.tarari = '';
                        voice.letra = '';
                    }
                });
            }
        });

        // 2. Recalculate total notes for dynamic variations checking logic
        measuresToPaste.forEach(item => {
            if (item.voci) {
                item.voci.forEach(voice => {
                    if (activeVoices.includes(voice.nami) && voice.nimidi) {
                        totalNotesPerVoice[voice.nami] += voice.nimidi.filter(n => n > 0).length;
                    }
                });
            }
        });

        // 3. Tonal & Dynamic Variations
        measuresToPaste.forEach(item => {
            if (item.voci) {
                item.voci.forEach(voice => {
                    if (activeVoices.includes(voice.nami)) {
                        const voiceLimits = tesituras[voice.nami] || { min: 36, max: 84 };

                        // Find index boundaries for this voice's tessitura in the scale
                        let minIdx = scaleNotes.findIndex(n => n >= voiceLimits.min);
                        let maxIdx = scaleNotes.length - 1;
                        while(maxIdx >= 0 && scaleNotes[maxIdx] > voiceLimits.max) { maxIdx--; }
                        if(minIdx === -1) minIdx = 0;
                        if(maxIdx === -1) maxIdx = scaleNotes.length - 1;

                        // Tonal Variations Logic
                        if (variationTonal !== 'none') {
                            // Find if this is the last note to resolve it to tonic for 'final' mode
                            const isLastMeasure = (measuresToPaste.indexOf(item) === measuresToPaste.length - 1);
                            let lastValidNoteIndex = -1;
                            if (isLastMeasure && variationTonal === 'final' && voice.nimidi) {
                                for (let i = voice.nimidi.length - 1; i >= 0; i--) {
                                    if (voice.nimidi[i] > 0) {
                                        lastValidNoteIndex = i;
                                        break;
                                    }
                                }
                            }

                            if (voice.nimidi) {
                                voice.nimidi = voice.nimidi.map((note, noteIdx) => {
                                    if (note > 0) {
                                        // Handle resolving to tonic
                                        if (isLastMeasure && variationTonal === 'final' && noteIdx === lastValidNoteIndex) {
                                            const rootNote = (typeof window.keyinselecti !== 'undefined') ? window.keyinselecti : 0;
                                            let bestTonic = note;
                                            let minDiff = Infinity;
                                            
                                            for (let s = minIdx; s <= maxIdx; s++) {
                                                if (scaleNotes[s] % 12 === rootNote) {
                                                    const diff = Math.abs(scaleNotes[s] - note);
                                                    if (diff < minDiff) {
                                                        minDiff = diff;
                                                        bestTonic = scaleNotes[s];
                                                    }
                                                }
                                            }
                                            return bestTonic;
                                        }

                                        let currentScaleIndex = scaleNotes.reduce((prevIdx, currNote, idx) => {
                                            return Math.abs(currNote - note) < Math.abs(scaleNotes[prevIdx] - note) ? idx : prevIdx;
                                        }, 0);
                                        
                                        let newScaleIndex = currentScaleIndex + scaleStepDelta;
                                        
                                        if (newScaleIndex > maxIdx) {
                                            newScaleIndex = maxIdx - (newScaleIndex - maxIdx);
                                        } else if (newScaleIndex < minIdx) {
                                            newScaleIndex = minIdx + (minIdx - newScaleIndex);
                                        }

                                        newScaleIndex = Math.max(minIdx, Math.min(maxIdx, newScaleIndex));
                                        return scaleNotes[newScaleIndex];
                                    }
                                    return 0;
                                });
                            }
                        }

                        // Dynamic Variations Logic
                        if (variationDynamic !== 'none' && voice.nimidi && voice.nimidi.some(n => n > 0)) {
                            if (!voice.dinami || voice.dinami.length !== voice.nimidi.length) {
                                voice.dinami = new Array(voice.nimidi.length).fill(64);
                            }
                            
                            voice.dinami = voice.dinami.map((vel, idx) => {
                                if (voice.nimidi[idx] > 0) {
                                    passedNotesPerVoice[voice.nami]++; // Increment counter for this voice
                                    
                                    let newVel = vel;
                                    const maxNotes = Math.max(1, totalNotesPerVoice[voice.nami] - 1);
                                    const progress = (passedNotesPerVoice[voice.nami] - 1) / maxNotes;
                                    
                                    if (variationDynamic === 'humanize') {
                                        const dynamicDelta = Math.floor(Math.random() * 31) - 15;
                                        newVel += dynamicDelta;
                                        if (idx % 4 === 0) newVel += 10;
                                    } else if (variationDynamic === 'crescendo') {
                                        newVel = Math.floor(40 + Math.pow(progress, 1.5) * 70); // 40 to 110 curve
                                    } else if (variationDynamic === 'diminuendo') {
                                        newVel = Math.floor(110 - Math.pow(progress, 1.5) * 70); // 110 to 40 curve
                                    } else if (variationDynamic === 'accent') {
                                        // Accents on first beat, weak on others
                                        if (idx === 0) newVel = 120;
                                        else if (idx % 4 === 0) newVel = 85; 
                                        else newVel = 60;
                                    }
                                    
                                    return Math.max(20, Math.min(127, newVel));
                                }
                                return vel;
                            });
                        }
                    }
                });
            }
        });

        // Insert into bar
        window.bdi.bar.splice(insertionIdx, 0, ...measuresToPaste);

        // Update measure numbers
        window.bdi.bar.forEach((m, idx) => {
            m.numi = idx;
        });

        // Select the newly pasted range automatically and put cursor at end of paste
        const newCursorPos = insertionIdx + measuresToPaste.length;
        window.selectedMeasureIndex = newCursorPos;
        if (window.np6) window.np6.cursorPos = newCursorPos;

        if (window.selectionRange) {
            window.selectionRange.start = insertionIdx;
            window.selectionRange.end = newCursorPos - 1;
        }

        if (typeof window.syncMeasureCount === 'function') {
            window.syncMeasureCount();
        }
        if (typeof window.updateAfterBdiChange === 'function') {
            window.updateAfterBdiChange();
        }
        if (typeof window.updateRulerVisuals === 'function') {
            window.updateRulerVisuals();
        }


        console.log(` Variación completada. Nuevo total: ${window.bdi.bar.length} compases.`);

        // Visual feedback
        const varBtn = document.getElementById('variation-measures-btn');
        if (varBtn) {
            const originalText = varBtn.textContent;
            varBtn.textContent = '¡Variado!';
            varBtn.style.backgroundColor = '#673AB7'; // Deep purple
            varBtn.style.color = '#fff';
            setTimeout(() => {
                varBtn.textContent = originalText;
                varBtn.style.backgroundColor = '';
                varBtn.style.color = '';
            }, 1000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initClipboard);
    } else {
        initClipboard();
    }
})();
