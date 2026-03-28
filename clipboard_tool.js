/**
 * clipboard_tool.js
 * Handles copying and pasting measures based on ruler selection.
 * Updated to respect Dependent/Independent mode.
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

    /**
     * Helper to get common selection range from ruler or selected index
     */
    function getSelectionIndices() {
        let startIdx = -1;
        let endIdx = -1;

        if (window.selectionRange && window.selectionRange.start !== -1) {
            startIdx = window.selectionRange.start;
            endIdx = window.selectionRange.end;
        } else if (typeof window.selectedMeasureIndex !== 'undefined' && window.selectedMeasureIndex !== -1) {
            startIdx = window.selectedMeasureIndex;
            endIdx = window.selectedMeasureIndex;
        }

        if (startIdx === -1) return null;

        const realTotal = window.bdi.bar.length;
        const validStart = Math.max(0, startIdx);
        const validEnd = Math.min(endIdx, realTotal - 1);

        if (validStart >= realTotal) return null;

        return { start: validStart, end: validEnd };
    }

    function copyMeasures() {
        if (!window.bdi || !window.bdi.bar) return;

        const range = getSelectionIndices();
        if (!range) {
            console.warn(' Nada seleccionado para copiar');
            return;
        }

        const voiceEditMode = (typeof window.voiceEditMode !== 'undefined') ? window.voiceEditMode : 'dependent';
        const voiceSelector = document.getElementById('voice-selector');
        const currentVoice = voiceSelector ? voiceSelector.value : 's';

        if (voiceEditMode === 'independent') {
            // MODO INDEPENDIENTE: Copiar solo la pista actual
            const voiceDataToCopy = [];
            for (let i = range.start; i <= range.end; i++) {
                const measure = window.bdi.bar[i];
                let voiceObj = null;
                if (measure.voci) {
                    if (Array.isArray(measure.voci)) {
                        voiceObj = measure.voci.find(v => v.nami === currentVoice);
                    } else {
                        voiceObj = measure.voci[currentVoice];
                    }
                }
                voiceDataToCopy.push(voiceObj ? JSON.parse(JSON.stringify(voiceObj)) : null);
            }
            window.measureClipboard = voiceDataToCopy;
            window.measureClipboard.isIndependent = true;
            window.measureClipboard.sourceVoice = currentVoice;
            console.log(` Copiados ${window.measureClipboard.length} compases de la pista ${currentVoice.toUpperCase()} (${range.start + 1} - ${range.end + 1})`);
        } else {
            // MODO DEPENDIENTE: Copiar columnas completas
            const measuresToCopy = window.bdi.bar.slice(range.start, range.end + 1);
            window.measureClipboard = JSON.parse(JSON.stringify(measuresToCopy));
            window.measureClipboard.isIndependent = false;
            console.log(` Copiados ${window.measureClipboard.length} compases (${range.start + 1} - ${range.end + 1})`);
        }

        // Visual feedback
        const copyBtn = document.getElementById('copy-measures-btn');
        if (copyBtn) {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = (voiceEditMode === 'independent' ? 'Pista!' : 'Copiado!');
            copyBtn.style.backgroundColor = '#4CAF50';
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.backgroundColor = '';
            }, 1000);
        }
    }

    function cutMeasures() {
        if (!window.bdi || !window.bdi.bar) return;

        const range = getSelectionIndices();
        if (!range) {
            console.warn(' Nada seleccionado para cortar');
            return;
        }

        // 1. Copy (respecting mode)
        copyMeasures();

        // Save state for undo
        if (typeof window.saveBdiState === 'function') {
            window.saveBdiState();
        }

        // 2. Delete (respecting mode via deleteMeasureWithMode)
        for (let i = range.end; i >= range.start; i--) {
            if (typeof window.deleteMeasureWithMode === 'function') {
                window.deleteMeasureWithMode(i);
            } else {
                // Fallback if global function not available
                window.bdi.bar.splice(i, 1);
            }
        }

        // 3. Update measure numbers (only relevant if measures were removed)
        const voiceEditMode = (typeof window.voiceEditMode !== 'undefined') ? window.voiceEditMode : 'dependent';
        if (voiceEditMode === 'dependent') {
            window.bdi.bar.forEach((m, idx) => {
                m.numi = idx;
            });
        }

        // 4. Update UI
        finalizeAction('cut-measures-btn', 'Cortado!', '#e65c00');
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

        // Save state for undo
        if (typeof window.saveBdiState === 'function') {
            window.saveBdiState();
        }

        if (window.measureClipboard.isIndependent) {
            // MODO INDEPENDIENTE: Sobreescribir solo la pista actual
            console.log(` Pegando ${window.measureClipboard.length} compases de pista en el índice ${insertionIdx}`);
            const voiceSelector = document.getElementById('voice-selector');
            const targetVoice = voiceSelector ? voiceSelector.value : 's';
            const dataToPaste = JSON.parse(JSON.stringify(window.measureClipboard));

            for (let i = 0; i < dataToPaste.length; i++) {
                const targetIdx = insertionIdx + i;
                const voiceData = dataToPaste[i];
                
                if (targetIdx < window.bdi.bar.length) {
                    // Sobreescribir compás existente
                    const measure = window.bdi.bar[targetIdx];
                    if (voiceData) {
                        voiceData.nami = targetVoice;
                        if (Array.isArray(measure.voci)) {
                            const vIdx = measure.voci.findIndex(v => v.nami === targetVoice);
                            if (vIdx !== -1) measure.voci[vIdx] = voiceData;
                            else measure.voci.push(voiceData);
                        } else if (measure.voci) {
                            measure.voci[targetVoice] = voiceData;
                        }
                        
                        // Sync top-level fields for compatibility
                        measure.nimidi = [...voiceData.nimidi];
                        measure.tipis = [...voiceData.tipis];
                    }
                } else {
                    // Si pegamos fuera de límites, añadir compás nuevo con esa pista
                    if (typeof window.createEmptyMeasure === 'function') {
                        const newMeasure = {
                            numi: targetIdx,
                            voci: [
                                { nami: 's', ...(targetVoice==='s' ? voiceData : window.createEmptyMeasure()) },
                                { nami: 'a', ...(targetVoice==='a' ? voiceData : window.createEmptyMeasure()) },
                                { nami: 't', ...(targetVoice==='t' ? voiceData : window.createEmptyMeasure()) },
                                { nami: 'b', ...(targetVoice==='b' ? voiceData : window.createEmptyMeasure()) }
                            ]
                        };
                        // Set top level from active voice
                        const activeVoiceObj = newMeasure.voci.find(v => v.nami === targetVoice);
                        newMeasure.nimidi = [...activeVoiceObj.nimidi];
                        newMeasure.tipis = [...activeVoiceObj.tipis];
                        window.bdi.bar.push(newMeasure);
                    }
                }
            }
            
            // UI Selection update
            if (window.selectionRange) {
                window.selectionRange.start = insertionIdx;
                window.selectionRange.end = Math.min(insertionIdx + dataToPaste.length - 1, window.bdi.bar.length - 1);
            }
        } else {
            // MODO DEPENDIENTE: Insertar columnas nuevas
            console.log(` Pegando ${window.measureClipboard.length} compases completos en el índice ${insertionIdx}`);
            const measuresToPaste = JSON.parse(JSON.stringify(window.measureClipboard));

            // Silenciar pistas no audibles
            const playbackSelector = document.getElementById('playback-selector');
            let activeStr = playbackSelector ? playbackSelector.value : 'audible';
            const activeVoices = (activeStr === 'audible' || activeStr === 's,a,t,b') ? ['s', 'a', 't', 'b'] : activeStr.split(',');

            measuresToPaste.forEach(item => {
                if (item.voci) {
                    const voicesArr = Array.isArray(item.voci) ? item.voci : Object.values(item.voci);
                    voicesArr.forEach(voice => {
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
            window.bdi.bar.forEach((m, idx) => { m.numi = idx; });

            // Update cursor/selection
            const newCursorPos = insertionIdx + measuresToPaste.length;
            window.selectedMeasureIndex = newCursorPos;
            if (window.np6) window.np6.cursorPos = newCursorPos;
            if (window.selectionRange) {
                window.selectionRange.start = insertionIdx;
                window.selectionRange.end = newCursorPos - 1;
            }
        }

        finalizeAction('paste-measures-btn', 'Pegado!', '#2196F3');
    }

    function duplicateMeasures() {
        if (!window.bdi || !window.bdi.bar) return;

        const range = getSelectionIndices();
        if (!range) {
            console.warn(' Nada seleccionado para duplicar');
            return;
        }

        // 1. Temporarily store old clipboard
        const oldClipboard = window.measureClipboard;
        const oldIndependent = window.measureClipboard.isIndependent;

        // 2. Copy current selection (respects mode)
        copyMeasures();
        
        // 3. Paste at original end + 1 (respects mode)
        const insertionIdx = range.end + 1;
        
        // Use a modified version of pasteMeasures logic or just call it after setting insertionIdx
        // To keep it clean, we duplicate part of the paste logic here but focused on duplication
        
        const originalSelectedIdx = window.selectedMeasureIndex;
        window.selectedMeasureIndex = insertionIdx;
        if (window.selectionRange) window.selectionRange.start = insertionIdx;
        
        pasteMeasures();

        // Restore clipboard if needed or keep the new one
        
        finalizeAction('duplicate-measures-btn', 'Duplicado!', '#9C27B0');
    }

    /**
     * Common finalization logic for actions
     */
    function finalizeAction(btnId, feedbackText, feedbackColor) {
        if (typeof window.clearRulerSelection === 'function' && btnId === 'cut-measures-btn') {
            window.clearRulerSelection();
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

        // Visual feedback
        const btn = document.getElementById(btnId);
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = feedbackText;
            btn.style.backgroundColor = feedbackColor;
            if (feedbackColor === '#9C27B0') btn.style.color = '#fff';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }, 1000);
        }
    }

    function variationMeasures() {
        if (!window.bdi || !window.bdi.bar) return;

        const range = getSelectionIndices();
        if (!range) {
            console.warn(' Nada seleccionado para variar');
            return;
        }

        const realTotal = window.bdi.bar.length;
        
        // Copies to apply variation
        const measuresToCopy = window.bdi.bar.slice(range.start, range.end + 1);
        const measuresToPaste = JSON.parse(JSON.stringify(measuresToCopy));

        const insertionIdx = range.end + 1; // Insert right after the selection block

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

        // Pre-calculate total audible notes per voice for global dynamic effects
        const totalNotesPerVoice = {};
        const passedNotesPerVoice = {};
        activeVoices.forEach(vName => {
            totalNotesPerVoice[vName] = 0;
            passedNotesPerVoice[vName] = 0;
        });

        // 1. Time Variations Logic
        measuresToPaste.forEach(item => {
            if (item.voci) {
                const voicesArr = Array.isArray(item.voci) ? item.voci : Object.values(item.voci);
                voicesArr.forEach(voice => {
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
                                        if (accum + dur > totalBeats) dur = totalBeats - accum;
                                        if (dur > 0) {
                                            newTipis.push(beatsToCode(dur));
                                            newNimidi.push(voice.nimidi && voice.nimidi[i] ? voice.nimidi[i] : 0);
                                            newDinami.push(voice.dinami && voice.dinami[i] ? voice.dinami[i] : 64);
                                            accum += dur;
                                        }
                                        if (accum >= totalBeats) break;
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
                                    newTipis = [...firstHalfTipis, ...firstHalfTipis];
                                    newNimidi = [...firstHalfNimidi, ...firstHalfNimidi];
                                    newDinami = [...firstHalfDinami, ...firstHalfDinami];
                                }
                                absTipis = newTipis;
                                if (voice.nimidi) voice.nimidi = newNimidi;
                                if (voice.dinami) voice.dinami = newDinami;
                            }
                            voice.tipis = absTipis.map((t, i) => (voice.nimidi && voice.nimidi[i] > 0) ? t : -t);
                        }
                    } else {
                        if (voice.nimidi) voice.nimidi = voice.nimidi.map(() => 0);
                        if (voice.tipis) voice.tipis = voice.tipis.map(t => -Math.abs(t));
                        if (voice.dinami) voice.dinami = voice.dinami.map(() => 0);
                    }
                });
            }
        });

        // 2 & 3. Recalculate notes & Apply variations
        measuresToPaste.forEach(item => {
            if (item.voci) {
                const voicesArr = Array.isArray(item.voci) ? item.voci : Object.values(item.voci);
                voicesArr.forEach(voice => {
                    if (activeVoices.includes(voice.nami)) {
                        if (voice.nimidi) totalNotesPerVoice[voice.nami] += voice.nimidi.filter(n => n > 0).length;
                        const voiceLimits = tesituras[voice.nami] || { min: 36, max: 84 };
                        let minIdx = scaleNotes.findIndex(n => n >= voiceLimits.min);
                        let maxIdx = scaleNotes.length - 1;
                        while(maxIdx >= 0 && scaleNotes[maxIdx] > voiceLimits.max) maxIdx--;
                        if(minIdx === -1) minIdx = 0;

                        if (variationTonal !== 'none' && voice.nimidi) {
                            voice.nimidi = voice.nimidi.map(note => {
                                if (note > 0) {
                                    let currentScaleIndex = scaleNotes.reduce((prevIdx, currNote, idx) => {
                                        return Math.abs(currNote - note) < Math.abs(scaleNotes[prevIdx] - note) ? idx : prevIdx;
                                    }, 0);
                                    let newScaleIndex = currentScaleIndex + scaleStepDelta;
                                    newScaleIndex = Math.max(minIdx, Math.min(maxIdx, newScaleIndex));
                                    return scaleNotes[newScaleIndex];
                                }
                                return 0;
                            });
                        }
                    }
                });
            }
        });

        // Insert into bar
        window.bdi.bar.splice(insertionIdx, 0, ...measuresToPaste);
        window.bdi.bar.forEach((m, idx) => { m.numi = idx; });

        // Finalize
        finalizeAction('variation-measures-btn', 'Variado!', '#673AB7');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initClipboard);
    } else {
        initClipboard();
    }
})();
