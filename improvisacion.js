/**
 * Musicoli - Improvisación Mode Logic
 * 
 * Functions for real-time, measure-based improvisation using a unified keyboard.
 * 
 * CORE DESIGN:
 * - At each bar boundary, the measure is CLONED to the next slot (Live Looper).
 * - The user can modify the CURRENT bar via MIDI editor buttons (+12, -12, etc.).
 * - Button presses fire window.imProNotifyEdit() which saves edits to state.userEdits.
 * - Just before cloning, applyUserEditsToCurrentMeasure() bakes those edits into BDI.
 * - The clone then reflects the user's changes perfectly.
 */

(function() {
    console.log('Initializing Unified Improvisación mode...');

    const state = {
        isRunning: false,
        timer: null,
        bpm: 120,
        bufferIndex: -1,

        // Snapshot of user edits made via MIDI editor buttons or text input.
        // Populated by window.imProNotifyEdit(), consumed by applyUserEditsToCurrentMeasure().
        userEdits: null,

        settings: {
            density: 4,
            pattern: 0,
            scale: 'mayor',
            customScaleArr: null,
            voiceRoots: null,
            lastMeanDyn: 80
        }
    };

    function init() {
        const startBtn = document.getElementById('impro-start-stop-btn');
        if (startBtn) startBtn.onclick = toggleImpro;

        window.addEventListener('keydown', handleKeyDown);
        
        const bpmInput = document.getElementById('bpm-custom-input');
        if (bpmInput) {
            bpmInput.addEventListener('change', updateBpm);
            updateBpm();
        }

        // =====================================================================
        // PUBLIC HOOK: musicoli.js button handlers (updateInputAndRecalc, etc.)
        // must call window.imProNotifyEdit() after changing note values.
        // This is the single reliable bridge between editor buttons and impro.
        // =====================================================================
        window.imProNotifyEdit = function() {
            if (!state.isRunning || state.bufferIndex === -1) return;
            if (window.currentEditingMeasureIndex !== state.bufferIndex) return;

            const midi = window.currentFullMidiValues;
            const rhythm = window.currentEditingRhythmValues;
            const dyn = window.currentEditingDynamicsValues;
            const voiceSelector = document.getElementById('voice-selector');
            const voiceCode = voiceSelector ? voiceSelector.value : 's';

            if (!midi || !rhythm || midi.length === 0) return;

            state.userEdits = {
                voiceCode: voiceCode,
                nimidi: [...midi],
                tipis: [...rhythm],
                dinami: dyn ? [...dyn] : null
            };
            console.log('Impro: Edit captured for voice', voiceCode, '->', state.userEdits.nimidi.join(', '));
        };
    }

    function updateBpm() {
        const bpmInput = document.getElementById('bpm-custom-input');
        if (bpmInput) state.bpm = parseInt(bpmInput.value) || 120;
    }

    function toggleImpro() {
        if (state.isRunning) stopImpro(); else startImpro();
    }

    function startImpro() {
        if (state.isRunning) return;
        if (!window.bdi) window.bdi = { bar: [] };
        if (!window.bdi.bar) window.bdi.bar = [];

        state.isRunning = true;
        state.userEdits = null;
        updateUI();

        if (window.currentEditMode !== 'improvisacion') {
            const btn = document.getElementById('mode-improvisacion');
            if (btn) btn.click();
        }

        createNewWorkingBar();
        scheduleNextBar();
    }

    function stopImpro() {
        state.isRunning = false;
        if (state.timer) clearTimeout(state.timer);
        state.timer = null;
        state.bufferIndex = -1;
        state.userEdits = null;
        updateUI();

        if (typeof window.rebuildRecordi === 'function') window.rebuildRecordi();
        if (typeof window.renderVisualTracks === 'function') window.renderVisualTracks();
        if (typeof window.refreshUI === 'function') window.refreshUI();
    }

    /**
     * Bakes pending user edits (from editor buttons) into the BDI measure.
     * MUST be called BEFORE openMidiEditor() which resets the globals.
     */
    function applyUserEditsToCurrentMeasure() {
        if (!state.userEdits || state.bufferIndex === -1) return;
        if (!window.bdi || !window.bdi.bar[state.bufferIndex]) return;

        const measure = window.bdi.bar[state.bufferIndex];
        const { voiceCode, nimidi, tipis, dinami } = state.userEdits;

        const vIdx = measure.voci ? measure.voci.findIndex(v => v.nami === voiceCode) : -1;
        if (vIdx !== -1) {
            const v = measure.voci[vIdx];
            v.nimidi = [...nimidi];
            v.tipis = [...tipis];
            if (dinami && dinami.length === nimidi.length) {
                v.dinami = [...dinami];
            }
            // Keep root measure properties in sync
            if (voiceCode === 's' || measure.nimidi) {
                measure.nimidi = [...v.nimidi];
                measure.tipis = [...v.tipis];
                measure.dinami = [...v.dinami];
            }
            console.log('Impro: Baked edits into measure', state.bufferIndex, 'for voice', voiceCode);
        }

        state.userEdits = null; // Consumed
    }

    /**
     * Creates the next measure by:
     * 1. Baking any pending edits into the current measure.
     * 2. Cloning the updated measure as the new bar.
     * 3. Opening the editor on the new (clone) bar.
     */
    function createNewWorkingBar() {
        if (!window.bdi || !window.bdi.bar) return;

        // CRITICAL: bake edits BEFORE openMidiEditor resets globals
        applyUserEditsToCurrentMeasure();

        let measureData;
        if (state.bufferIndex !== -1 && window.bdi.bar[state.bufferIndex]) {
            measureData = JSON.parse(JSON.stringify(window.bdi.bar[state.bufferIndex]));
            console.log('Impro: Cloned bar', state.bufferIndex, '→', window.bdi.bar.length);
        } else {
            measureData = generateMeasureDataFromSettings();
            console.log('Impro: Generated first bar.');
        }

        window.bdi.bar.push(measureData);
        state.bufferIndex = window.bdi.bar.length - 1;
        window.selectedMeasureIndex = state.bufferIndex;

        // Open editor AFTER updating state.bufferIndex so imProNotifyEdit guards work correctly
        if (typeof window.openMidiEditor === 'function') {
            window.openMidiEditor(state.bufferIndex);
        }
        
        // Blur any auto-focused text input so that impro keyboard shortcuts keep working
        setTimeout(() => {
            const focused = document.activeElement;
            if (focused && focused.tagName === 'INPUT' && focused.id !== 'bpm-custom-input') {
                focused.blur();
            }
        }, 50);

        refreshDisplay();
        updateMeasureCounter();
    }

    function scheduleNextBar() {
        if (!state.isRunning) return;
        if (state.timer) clearTimeout(state.timer);

        updateBpm();
        const beatsPerBar = (window.compi && window.compi[0]) ? window.compi[0] : 4;
        const msPerBar = (beatsPerBar * 60 / state.bpm) * 1000;

        state.timer = setTimeout(() => {
            try { commitAndCycle(); } catch (err) { console.error('Impro Loop Error:', err); }
            scheduleNextBar();
        }, msPerBar);
    }

    function commitAndCycle() {
        if (!state.isRunning || state.bufferIndex === -1) return;

        // Bake any last-second edits before playing+cloning
        applyUserEditsToCurrentMeasure();

        const measureToPlay = window.bdi.bar[state.bufferIndex];
        if (measureToPlay && measureToPlay.voci && typeof window.playMeasureFast === 'function') {
            try { window.playMeasureFast(0, measureToPlay); }
            catch (pErr) { console.warn('Impro: Playback error:', pErr); }
        }

        createNewWorkingBar();

        const scroller = document.getElementById('tracks-scroll-viewport');
        if (scroller) setTimeout(() => { scroller.scrollLeft = scroller.scrollWidth; }, 50);
    }

    function generateMeasureDataFromSettings() {
        const s = state.settings;
        const scalesMap = window.escalasNotas || { mayor: [0, 2, 4, 5, 7, 9, 11] };
        let scale = s.customScaleArr || (scalesMap[s.scale] || scalesMap.mayor);

        if (typeof window.inimetri === 'function') {
            window.inimetri(window.compi || [4, 4]);
        }

        let patternArr = [3, 3, 3, 3];
        if (window.trilipi && window.trilipi[s.density] && window.trilipi[s.density].length > 0) {
            patternArr = window.trilipi[s.density][s.pattern % window.trilipi[s.density].length] || patternArr;
        } else {
            patternArr = new Array((window.compi && window.compi[0]) || 4).fill(3);
        }

        const roots = s.voiceRoots || { s: 72, a: 60, t: 48, b: 36 };
        const voci = [
            generateVoiceFromPattern(patternArr, scale, roots.s || 72, 's'),
            generateVoiceFromPattern(patternArr, scale, roots.a || 60, 'a'),
            generateVoiceFromPattern(patternArr, scale, roots.t || 48, 't'),
            generateVoiceFromPattern(patternArr, scale, roots.b || 36, 'b')
        ];

        return {
            voci,
            nimidi: [...voci[0].nimidi],
            tipis: [...voci[0].tipis],
            dinami: [...voci[0].dinami]
        };
    }

    function generateVoiceFromPattern(pattern, scale, baseMidi, name) {
        const density = state.settings.density;
        if (density === 0) return { nami: name, nimidi: [baseMidi], tipis: [-1], dinami: [0] };

        const baseDyn = state.settings.lastMeanDyn || 80;
        const nimidi = [], tipis = [], dinami = [];

        pattern.forEach(dur => {
            const step = scale[Math.floor(Math.random() * scale.length)];
            nimidi.push(baseMidi + step);
            tipis.push(dur);
            dinami.push(Math.max(16, Math.min(127, baseDyn + Math.floor(Math.random() * 21) - 10)));
        });

        return { nami: name, nimidi, tipis, dinami };
    }

    function captureScaleFromEditor() {
        if (state.bufferIndex === -1 || !window.bdi || !window.bdi.bar[state.bufferIndex]) return;

        // Snapshot current globals if editor shows our bar
        if (window.currentEditingMeasureIndex === state.bufferIndex
            && window.currentFullMidiValues && window.currentFullMidiValues.length > 0) {
            const voiceSelector = document.getElementById('voice-selector');
            const voiceCode = voiceSelector ? voiceSelector.value : 's';
            state.userEdits = {
                voiceCode,
                nimidi: [...window.currentFullMidiValues],
                tipis: window.currentEditingRhythmValues ? [...window.currentEditingRhythmValues] : [],
                dinami: window.currentEditingDynamicsValues ? [...window.currentEditingDynamicsValues] : null
            };
            applyUserEditsToCurrentMeasure();
        }

        const measure = window.bdi.bar[state.bufferIndex];
        const capturedPitches = new Set();
        let totalDyn = 0, countNotes = 0;
        const roots = state.settings.voiceRoots || { s: 72, a: 60, t: 48, b: 36 };

        (measure.voci || []).forEach(v => {
            let lowest = 999;
            (v.nimidi || []).forEach((midi, idx) => {
                if (midi > 0 && Math.abs((v.tipis || [])[idx]) < 100) {
                    capturedPitches.add(midi % 12);
                    if (midi < lowest) lowest = midi;
                    if (v.dinami && v.dinami[idx]) { totalDyn += v.dinami[idx]; countNotes++; }
                }
            });
            if (lowest < 999) roots[v.nami] = lowest - (lowest % 12);
        });

        if (capturedPitches.size > 0) {
            state.settings.customScaleArr = Array.from(capturedPitches).sort((a, b) => a - b);
            state.settings.scale = 'Custom';
            state.settings.voiceRoots = roots;
            if (countNotes > 0) state.settings.lastMeanDyn = Math.floor(totalDyn / countNotes);
            console.log('Impro: Learned custom scale:', state.settings.customScaleArr);
        }
    }

    /**
     * Applies a new trilipi rhythm pattern to the current measure
     * while preserving existing note pitches from the MIDI editor.
     * Numbers (0-9) and Uppercase (A-Z) use this instead of full generation.
     */
    function applyRhythmToCurrentMeasure() {
        if (state.bufferIndex === -1 || !window.bdi || !window.bdi.bar[state.bufferIndex]) return;

        const s = state.settings;

        // Get the new rhythm pattern from trilipi
        if (typeof window.inimetri === 'function') window.inimetri(window.compi || [4, 4]);

        let patternArr = [3, 3, 3, 3];
        if (window.trilipi && window.trilipi[s.density] && window.trilipi[s.density].length > 0) {
            patternArr = window.trilipi[s.density][s.pattern % window.trilipi[s.density].length] || patternArr;
        } else {
            patternArr = new Array((window.compi && window.compi[0]) || 4).fill(3);
        }

        const measure = window.bdi.bar[state.bufferIndex];

        // Apply new rhythm to each voice, keeping existing pitches (cycling/truncating as needed)
        (measure.voci || []).forEach(v => {
            const oldMidi = v.nimidi ? [...v.nimidi] : [];
            const oldDyn  = v.dinami  ? [...v.dinami]  : [];
            const baseDyn = state.settings.lastMeanDyn || 80;

            v.nimidi = patternArr.map((_, i) => oldMidi[i % oldMidi.length] || 60);
            v.tipis  = [...patternArr];
            v.dinami = patternArr.map((_, i) => oldDyn[i % oldDyn.length] || baseDyn);
        });

        // Keep root measure properties in sync with voice 's'
        const sVoice = measure.voci ? measure.voci.find(v => v.nami === 's') : null;
        if (sVoice) {
            measure.nimidi = [...sVoice.nimidi];
            measure.tipis  = [...sVoice.tipis];
            measure.dinami = [...sVoice.dinami];
        }
    }

    function handleKeyDown(e) {
        if (!state.isRunning || e.repeat) return;

        // Only block keys if the user is ACTIVELY TYPING in a text field.
        // We check specific IDs so that the auto-focus from openMidiEditor doesn't silence us.
        const activeId = document.activeElement ? document.activeElement.id : '';
        const textFields = ['midi-single-input', 'rhythm-values-input', 'lyrics-input', 'bpm-custom-input'];
        if (textFields.includes(activeId) && e.key !== ' ') return;
        // Also block if in a generic textarea
        if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') return;

        const key = e.key;
        let changed = false;
        let rhythmOnly = false; // True = change rhythm but keep pitches from editor

        if (/^[0-9]$/.test(key)) {
            state.settings.density = parseInt(key);
            changed = true;
            rhythmOnly = true; // Number keys only change rhythm density
        } else if (/^[A-Z]$/.test(key)) {
            state.settings.pattern = key.charCodeAt(0) - 65;
            changed = true;
            rhythmOnly = true; // Uppercase only changes pattern variant
        } else if (/^[a-z]$/.test(key)) {
            const mapping = {
                'm': 'mayor', 'n': 'menor', 'p': 'pentatonica', 'd': 'dorica',
                'f': 'frigia', 'l': 'lidia', 'x': 'mixolidia', 'a': 'eolica'
            };
            if (mapping[key]) {
                state.settings.scale = mapping[key];
                state.settings.customScaleArr = null;
                changed = true;
                rhythmOnly = false; // Lowercase changes scale → regenerate pitches too
            }
        } else if (key === ' ' || key === 'Spacebar') {
            e.preventDefault();
            captureScaleFromEditor();
            updateUI();
            return;
        }

        if (changed && state.bufferIndex !== -1) {
            state.userEdits = null; // Reset pending edits so our change takes effect

            if (rhythmOnly) {
                // Numbers/Uppercase: apply new trilipi rhythm but keep editor pitches
                console.log('Impro: Rhythm change, keeping pitches from editor...');
                applyRhythmToCurrentMeasure();
            } else {
                // Lowercase scale change: regenerate everything
                console.log('Impro: Scale change, regenerating full measure...');
                window.bdi.bar[state.bufferIndex] = generateMeasureDataFromSettings();
            }

            if (typeof window.openMidiEditor === 'function') window.openMidiEditor(state.bufferIndex);
            // Restore keyboard focus after editor auto-focus
            setTimeout(() => {
                const focused = document.activeElement;
                if (focused && focused.tagName === 'INPUT' && focused.id !== 'bpm-custom-input') focused.blur();
            }, 50);

            refreshDisplay();
            updateUI();
        }
    }

    function refreshDisplay() {
        if (typeof window.renderVisualTracks === 'function') window.renderVisualTracks();
        if (typeof window.refreshUI === 'function') window.refreshUI();
    }

    function updateMeasureCounter() {
        const totalEl = document.getElementById('totalMeasures');
        if (totalEl && window.bdi && window.bdi.bar) totalEl.textContent = window.bdi.bar.length;
    }

    function updateUI() {
        const startBtn = document.getElementById('impro-start-stop-btn');
        if (startBtn) {
            startBtn.textContent = state.isRunning ? 'STOP' : 'START';
            startBtn.classList.toggle('active', state.isRunning);
        }
        const statusText = document.getElementById('impro-status-text');
        if (statusText) {
            const s = state.settings;
            statusText.innerHTML = `Dens: <b>${s.density}</b> | Pat: <b>${String.fromCharCode(65 + s.pattern)}</b> | Scale: <b>${s.scale}</b>`;
        }
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();
