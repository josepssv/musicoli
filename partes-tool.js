// ============================================================
// PANEL PARTES — Ritmos diferenciados por sección
// ============================================================
// Each digit of the input = number of measures for that part.
// Differentiation per part:
//  1. Different trilipi note-group (rhythmic density)
//  2. Muted voices via negative tipis (same as MIDI editor silence col)
//  3. Scale-based pitches per voice in correct tessitura
//  4. Part colour applied to measure in notepad (coli/hexi/nimidiColors)
//
// Insertion: single bdi.bar.splice → correct order guaranteed.
// ============================================================
(function () {

    // ── Colour palette ───────────────────────────────────────
    var PARTES_COLORS = [
        { bg: '#e53935', text: '#fff', light: '#ffcdd2' }, // A
        { bg: '#1565c0', text: '#fff', light: '#bbdefb' }, // B
        { bg: '#6a1b9a', text: '#fff', light: '#e1bee7' }, // C
        { bg: '#e65100', text: '#fff', light: '#ffe0b2' }, // D
        { bg: '#00695c', text: '#fff', light: '#b2dfdb' }, // E
        { bg: '#827717', text: '#fff', light: '#f9fbe7' }, // F
        { bg: '#880e4f', text: '#fff', light: '#fce4ec' }, // G
        { bg: '#37474f', text: '#fff', light: '#eceff1' }, // H
        { bg: '#1b5e20', text: '#fff', light: '#c8e6c9' }  // I
    ];

    // ── Muting rotation tables ───────────────────────────────
    var MUTE2_ROTATIONS = [
        ['s', 't'], ['a', 'b'], ['s', 'b'],
        ['a', 't'], ['s', 'a'], ['t', 'b']
    ];
    var MUTE1_ROTATIONS = [['s'], ['a'], ['t'], ['b']];
    var MUTE3_ROTATIONS = [
        ['a', 't', 'b'], ['s', 't', 'b'],
        ['s', 'a', 'b'], ['s', 'a', 't']
    ];

    // Voice tessitura (MIDI range)
    var TESSITURA = {
        s: { min: 60, max: 84 },   // C4 – C6
        a: { min: 53, max: 74 },   // F3 – D5
        t: { min: 48, max: 69 },   // C3 – A4
        b: { min: 40, max: 62 }    // E2 – D4
    };

    function partLabel(i) { return String.fromCharCode(65 + (i % 26)); }

    // ── Hex → RGB ────────────────────────────────────────────
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }

    // ── Scale helpers ────────────────────────────────────────
    var SCALE_INTERVALS_FALLBACK = {
        mayor: [0, 2, 4, 5, 7, 9, 11],
        menor: [0, 2, 3, 5, 7, 8, 10],
        cromatica: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    };

    function getCurrentScaleNotes() {
        var scaleName = 'mayor';
        var keyIdx = 0;

        if (typeof escalas !== 'undefined' && typeof scali !== 'undefined') {
            scaleName = escalas[scali] || 'mayor';
        }
        if (typeof keyinselecti !== 'undefined') keyIdx = keyinselecti;

        var intervals = (typeof escalasNotas !== 'undefined' && escalasNotas[scaleName])
            ? escalasNotas[scaleName]
            : (SCALE_INTERVALS_FALLBACK[scaleName] || SCALE_INTERVALS_FALLBACK.mayor);

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

    /**
     * Pick the scale note that gives this voice its characteristic tonal colour
     * for part number `partIndex`.
     *
     * Strategy: step through scale degrees in 3rds for each new part so that
     * adjacent parts sound harmonically distinct:
     *   Part 0 → degree 0 (tonic):     C in C-major
     *   Part 1 → degree 2 (mediant):   E
     *   Part 2 → degree 4 (dominant):  G
     *   Part 3 → degree 6 (leading):   B
     *   Part 4 → degree 1 (supertonic):D  …and so on
     *
     * Each voice picks the *nearest* available scale note to its tessitura
     * centre that matches the target degree (mod 12).
     */
    function getCharacteristicPitch(voiceCode, partIndex, scaleNotes) {
        var range = TESSITURA[voiceCode] || { min: 55, max: 79 };
        var center = Math.round((range.min + range.max) / 2);

        // Get scale intervals for current scale
        var scaleName = 'mayor';
        if (typeof escalas !== 'undefined' && typeof scali !== 'undefined') {
            scaleName = escalas[scali] || 'mayor';
        }
        var FALLBACK = { mayor: [0, 2, 4, 5, 7, 9, 11], menor: [0, 2, 3, 5, 7, 8, 10], cromatica: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
        var intervals = (typeof escalasNotas !== 'undefined' && escalasNotas[scaleName])
            ? escalasNotas[scaleName] : (FALLBACK[scaleName] || FALLBACK.mayor);

        // Step by 2 scale-degrees per part (3rds) for maximum harmonic contrast
        var degreeIdx = (partIndex * 2) % intervals.length;
        var targetDegree = intervals[degreeIdx]; // semitone offset from tonic within octave

        // Find notes IN the voice range whose pitch class matches the target degree
        var keyIdx = (typeof keyinselecti !== 'undefined') ? keyinselecti : 0;
        var inRange = scaleNotes.filter(function (n) {
            return n >= range.min && n <= range.max && ((n - keyIdx + 120) % 12) === targetDegree;
        });

        // Fallback: any scale note in range, then any scale note nearest center
        if (inRange.length === 0) {
            inRange = scaleNotes.filter(function (n) { return n >= range.min && n <= range.max; });
        }
        if (inRange.length === 0) inRange = scaleNotes;

        // Pick the one nearest the centre of this voice's tessitura
        return inRange.reduce(function (prev, curr) {
            return Math.abs(curr - center) < Math.abs(prev - center) ? curr : prev;
        }, inRange[0]);
    }

    // ── Trilipi helpers ──────────────────────────────────────
    function getActiveTriliSafe() {
        if (typeof getActiveTrili === 'function') return getActiveTrili();
        if (typeof trilipi !== 'undefined') return trilipi;
        return [];
    }

    function getAvailableGroups() {
        var t = getActiveTriliSafe(), groups = [];
        for (var i = 1; i <= 8; i++) {
            if (t[i] && t[i].length > 0) groups.push(i);
        }
        return groups.length > 0 ? groups : [4];
    }

    function pickTrilipiPattern(noteGroup, usedPatterns) {
        var t = getActiveTriliSafe();
        var group = (t[noteGroup] && t[noteGroup].length > 0)
            ? t[noteGroup] : (t[4] || [[4, 4, 4, 4]]);
        var unused = group.filter(function (p) {
            return !usedPatterns.some(function (u) {
                return JSON.stringify(u) === JSON.stringify(p);
            });
        });
        var pool = unused.length > 0 ? unused : group;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // ── Note-group assignment per part ───────────────────────
    function getAutoGroup() {
        try {
            var s = document.getElementById('compas-select');
            if (s) { var ts = JSON.parse(s.value); if (ts && ts[0]) return ts[0]; }
        } catch (e) { }
        return (window.bdi && window.bdi.metadata && window.bdi.metadata.timeSignature)
            ? (window.bdi.metadata.timeSignature[0] || 4) : 4;
    }

    function computeNoteGroupsForParts(numParts, densityMode) {
        if (densityMode === 'auto') {
            var g = getAutoGroup();
            return Array.apply(null, Array(numParts)).map(function () { return g; });
        }
        var available = getAvailableGroups();
        if (densityMode === 'descendente') {
            available = available.slice().reverse();
        } else if (densityMode === 'alternado') {
            var lo = 0, hi = available.length - 1, interleaved = [];
            while (lo <= hi) {
                if (lo === hi) { interleaved.push(available[lo++]); }
                else { interleaved.push(available[lo++]); interleaved.push(available[hi--]); }
            }
            available = interleaved;
        }
        return Array.apply(null, Array(numParts)).map(function (_, j) {
            return available[j % available.length];
        });
    }

    // ── Voice muting ─────────────────────────────────────────
    function getMutedVoicesForPart(partIndex, voiceMode) {
        if (voiceMode === 'all') return [];
        var rot = voiceMode === 'mute1' ? MUTE1_ROTATIONS
            : voiceMode === 'mute3' ? MUTE3_ROTATIONS
                : MUTE2_ROTATIONS;
        return rot[partIndex % rot.length];
    }

    // ── Input parsing ────────────────────────────────────────
    function parsePartesInput(str) {
        return (str || '').split('').map(function (c) { return parseInt(c); })
            .filter(function (n) { return !isNaN(n) && n >= 1 && n <= 9; });
    }

    function getDensityMode() {
        var s = document.getElementById('partes-density-mode'); return s ? s.value : 'alternado';
    }
    function getVoiceMode() {
        var s = document.getElementById('partes-voice-mode'); return s ? s.value : 'mute2';
    }

    // ── Build plan ───────────────────────────────────────────
    function buildPartesPlan(parts) {
        var noteGroups = computeNoteGroupsForParts(parts.length, getDensityMode());
        var voiceMode = getVoiceMode();
        var usedPatterns = [];
        return parts.map(function (measures, i) {
            var noteGroup = noteGroups[i];
            var pattern = pickTrilipiPattern(noteGroup, usedPatterns);
            usedPatterns.push(pattern);
            var muted = getMutedVoicesForPart(i, voiceMode);
            return {
                measures: measures,
                pattern: pattern,
                noteGroup: noteGroup,
                muted: muted,
                active: ['s', 'a', 't', 'b'].filter(function (v) { return muted.indexOf(v) === -1; }),
                color: PARTES_COLORS[i % PARTES_COLORS.length],
                label: partLabel(i)
            };
        });
    }

    // ── Timing computation ───────────────────────────────────
    function computeTimis(pattern) {
        if (typeof restini === 'function') return restini([pattern])[0];
        return pattern.map(function (v) {
            var abs = Math.abs(v);
            if (abs >= 10) {
                var res = (Math.floor(abs / 10) - 1) * 10 + (abs % 10);
                return v < 0 ? -res : res;
            }
            return v < 0 ? v + 1 : v - 1;
        });
    }

    // ── Intra-measure melodic sequence ───────────────────────
    /**
     * Build a sequence of MIDI pitches for each note slot in the pattern.
     * Notes walk stepwise through the scale around the part's characteristic
     * pitch (± 3 scale steps within the voice tessitura).
     *
     * @param voiceCode   's'|'a'|'t'|'b'
     * @param partIndex   part number (0-based) — sets tonal center
     * @param measureIndex measure number within the part (0-based) — sets direction
     * @param noteCount   number of note slots in the pattern
     * @param scaleNotes  full sorted list of valid MIDI notes for current scale
     */
    function buildNoteSequence(voiceCode, partIndex, measureIndex, noteCount, scaleNotes, colorMode) {
        var range = TESSITURA[voiceCode] || { min: 55, max: 79 };

        if (colorMode === 'ritmo') {
            // Find the tonic in this voice's range. If none, pick the middle note.
            var keyIdx = (typeof keyinselecti !== 'undefined') ? keyinselecti : 0;
            var inRangeR = scaleNotes.filter(function (n) { return n >= range.min && n <= range.max; });
            var tonics = inRangeR.filter(function (n) { return (n % 12) === ((keyIdx + 120) % 12); });
            var anchorR = tonics.length > 0 ? tonics[Math.floor(tonics.length / 2)] : (inRangeR.length > 0 ? inRangeR[Math.floor(inRangeR.length / 2)] : Math.round((range.min + range.max) / 2));
            return Array.apply(null, Array(noteCount)).map(function () { return anchorR; });
        }

        var anchor = getCharacteristicPitch(voiceCode, partIndex, scaleNotes);

        // All scale notes within the voice range
        var inRange = scaleNotes.filter(function (n) {
            return n >= range.min && n <= range.max;
        });
        if (inRange.length === 0) {
            // Fallback: repeat anchor
            return Array.apply(null, Array(noteCount)).map(function () { return anchor; });
        }

        // Find anchor's position in the in-range list
        var anchorIdx = 0;
        var minDist = 9999;
        inRange.forEach(function (n, i) {
            var d = Math.abs(n - anchor);
            if (d < minDist) { minDist = d; anchorIdx = i; }
        });

        // Build a window of ±3 scale steps around the anchor
        var lo = Math.max(0, anchorIdx - 3);
        var hi = Math.min(inRange.length - 1, anchorIdx + 3);
        var win = inRange.slice(lo, hi + 1);   // 1–7 notes available

        if (win.length <= 1) {
            return Array.apply(null, Array(noteCount)).map(function () { return anchor; });
        }

        // Direction: ascending on even (partIndex+measureIndex), descending on odd
        var goUp = ((partIndex + measureIndex) % 2 === 0);

        // Build the sequence: walk through the window stepwise, cycling
        var result = [];
        for (var i = 0; i < noteCount; i++) {
            var pos = goUp
                ? i % win.length
                : (win.length - 1) - (i % win.length);
            result.push(win[pos]);
        }
        return result;
    }
    // ── Build one bdi measure ─────────────────────────────────
    // Pass 1: rhythm pattern (tipis/timis)
    // Pass 2: mute voices (negative tipis)
    // Pass 3: tonal coloring — scale walk within each measure
    function buildBdiMeasure(pattern, pLabel, muted, partIndex, measureIndex) {
        var tipis = pattern.slice();
        var timis = computeTimis(pattern);

        var colorModeEl = document.getElementById('partes-color-mode');
        var colorMode = colorModeEl ? colorModeEl.value : 'melodia';

        var dinami = tipis.map(function (t, idx) {
            if (colorMode === 'dinamica') {
                return idx === 0 ? 105 : 70 + Math.floor(Math.random() * 15);
            }
            return 80;
        });
        var scaleNotes = getCurrentScaleNotes();
        var noteCount = tipis.length;

        var voci = ['s', 'a', 't', 'b'].map(function (vCode) {
            var isMuted = muted.indexOf(vCode) !== -1;

            // Pass 3: different pitch per note slot (scale walk around tonal center)
            var nimidi = buildNoteSequence(vCode, partIndex, measureIndex, noteCount, scaleNotes, colorMode);

            // Pass 2: mute by negating tipis
            var voiceTipis = isMuted
                ? tipis.map(function (t) { return -Math.abs(t); })
                : tipis.slice();

            return {
                nami: vCode,
                nimidi: nimidi,
                tipis: voiceTipis,
                timis: timis.slice(),
                dinami: dinami.slice(),
                duri: tipis.map(function () { return 1; }),
                liri: '',
                tarari: '',
                chordi: false
            };
        });

        var rootVoice = voci.find(function (v) { return v.nami === 's'; }) || voci[0];

        return {
            idi: Date.now() + Math.floor(Math.random() * 100000),
            nami: 'Parte ' + pLabel,
            voci: voci,
            nimidi: rootVoice.nimidi.slice(),
            tipis: tipis.slice(),
            timis: timis.slice(),
            dinami: dinami.slice(),
            chordi: false
        };
    }


    // ── Display helpers ──────────────────────────────────────
    function tipiLabel(v) {
        var abs = Math.abs(v), isRest = v < 0;
        var L = { 1: 'R', 2: 'B', 25: 'B.', 3: 'N', 35: 'N.', 4: 'C', 45: 'C.', 5: 'S', 55: 'S.' };
        var sym = L[abs] !== undefined ? L[abs] : String(abs);
        return isRest ? '[' + sym + ']' : sym;
    }

    function renderPartesPreview(plan, displayEl, infoEl) {
        var html = '', totalMeasures = 0;
        plan.forEach(function (part, i) {
            totalMeasures += part.measures;
            var patStr = part.pattern.map(tipiLabel).join('-');

            var voiceBadges = ['s', 'a', 't', 'b'].map(function (v) {
                var isMuted = part.muted.indexOf(v) !== -1;
                return '<span style="display:inline-block;padding:1px 3px;border-radius:3px;' +
                    'font-size:9px;font-weight:bold;' +
                    'background:' + (isMuted ? '#555' : part.color.bg) + ';' +
                    'color:' + (isMuted ? '#999' : '#fff') + ';' +
                    (isMuted ? 'text-decoration:line-through;' : '') +
                    '">' + v.toUpperCase() + '</span>';
            }).join('');

            var blocks = '';
            for (var mi = 0; mi < part.measures; mi++) {
                var isFirst = mi === 0, isLast = mi === part.measures - 1;
                var radius = isFirst ? '6px 0 0 6px' : (isLast ? '0 6px 6px 0' : '0');
                var bl = isFirst ? '' : 'border-left:none;';
                var bg = isFirst ? part.color.bg : part.color.light;
                var fg = isFirst ? part.color.text : part.color.bg;

                blocks +=
                    '<div style="display:inline-flex;flex-direction:column;align-items:center;' +
                    'background:' + bg + ';color:' + fg + ';border:2px solid ' + part.color.bg + ';' +
                    'border-radius:' + radius + ';padding:3px 5px;min-width:46px;margin-right:1px;' +
                    'font-family:monospace;font-size:10px;line-height:1.3;' + bl + '">' +
                    (isFirst
                        ? '<span style="font-weight:bold;font-size:12px;">P' + part.label + '</span>' +
                        '<span style="display:flex;gap:2px;margin:1px 0;">' + voiceBadges + '</span>'
                        : '<span style="font-size:9px;opacity:0.5;">' + (mi + 1) + '</span>') +
                    '<span style="font-size:9px;overflow:hidden;max-width:60px;white-space:nowrap;' +
                    'text-overflow:ellipsis;" title="' + patStr + '">' + patStr + '</span>' +
                    (isFirst ? '<span style="font-size:8px;opacity:0.7;">n=' + part.noteGroup + '</span>' : '') +
                    '</div>';
            }
            // Wrap in a div that handles randomization of THIS part
            html += '<div onclick="randomizePartInPreview(' + i + ')" ' +
                'style="display:inline-flex;margin-bottom:4px;margin-right:6px;cursor:pointer;transition:transform 0.1s;" ' +
                'onmouseover="this.style.transform=\'scale(1.03)\';this.style.filter=\'brightness(1.15)\';" ' +
                'onmouseout="this.style.transform=\'scale(1)\';this.style.filter=\'brightness(1)\';" ' +
                'title="' + (typeof t === 'function' ? t('PartesReshuffleTitle') : 'Randomizar esta parte') + '">' +
                blocks + '</div>';
        });

        displayEl.innerHTML = html ||
            '<span style="font-family:monospace;font-size:11px;color:#666;padding:4px;" data-i18n="Sin partes">' + (typeof t === 'function' ? t('Sin partes') : 'Sin partes') + '</span>';

        if (infoEl) {
            var s = plan.map(function (p) {
                var ml = p.muted.length
                    ? ('&#128263;' + p.muted.map(function (v) { return v.toUpperCase(); }).join(''))
                    : '&#10003;SATB';
                return 'P' + p.label + ':n' + p.noteGroup + ' ' + ml;
            }).join(' | ');
            var tPartes = typeof t === 'function' ? t('partesExt') : 'partes';
            var tComp = typeof t === 'function' ? t('compExt') : 'comp';
            infoEl.innerHTML = '&#128202; ' + plan.length + ' ' + tPartes + ' &middot; ' + totalMeasures +
                ' ' + tComp + ' &mdash; ' + s;
        }
    }

    // ── Global state ─────────────────────────────────────────
    window.partesState = null;

    function refreshPreview() {
        var inputEl = document.getElementById('partes-input');
        var displayEl = document.getElementById('partes-preview-display');
        var infoEl = document.getElementById('partes-info');
        if (!inputEl || !displayEl) return;

        var parts = parsePartesInput(inputEl.value.trim());
        if (parts.length === 0) {
            displayEl.innerHTML =
                '<span style="font-family:monospace;font-size:11px;color:#b71c1c;padding:4px;" data-i18n="PartesEmptyWarning">' +
                (typeof t === 'function' ? t('PartesEmptyWarning') : '&#9888; Escribe d&iacute;gitos 1-9 (ej: 234)') + '</span>';
            if (infoEl) infoEl.textContent = '';
            window.partesState = null;
            return;
        }

        var plan = buildPartesPlan(parts);
        window.partesState = { plan: plan };
        renderPartesPreview(plan, displayEl, infoEl);
    }

    window.previewPartesFromUI = refreshPreview;
    window.reshufflePartesFromUI = function () { window.partesState = null; refreshPreview(); };

    /**
     * Randomize a single part in the preview plan.
     */
    window.randomizePartInPreview = function (index) {
        if (!window.partesState || !window.partesState.plan[index]) return;
        var plan = window.partesState.plan;
        var part = plan[index];

        // 1. Pick a random note group (density) from available ones
        var availableGroups = getAvailableGroups();
        if (availableGroups.length > 1) {
            // Try to pick one different from current
            var currentGroup = part.noteGroup;
            var poolGroups = availableGroups.filter(function (g) { return g !== currentGroup; });
            part.noteGroup = (poolGroups.length > 0 ? poolGroups : availableGroups)[Math.floor(Math.random() * (poolGroups.length > 0 ? poolGroups.length : availableGroups.length))];
        }

        // 2. Pick new random pattern for the NEW noteGroup
        var usedPatterns = plan.map(function (p) { return p.pattern; });
        part.pattern = pickTrilipiPattern(part.noteGroup, usedPatterns.filter(function (_, i) { return i !== index; }));

        // 3. Randomize muted voices within the selected voice mode context
        var voiceMode = getVoiceMode();
        if (voiceMode !== 'all') {
            var rot = voiceMode === 'mute1' ? MUTE1_ROTATIONS
                : voiceMode === 'mute3' ? MUTE3_ROTATIONS
                    : MUTE2_ROTATIONS;

            // Pick a random one that is DIFFERENT from current if possible
            var currentMutedStr = JSON.stringify(part.muted.slice().sort());
            var available = rot.filter(function (r) {
                return JSON.stringify(r.slice().sort()) !== currentMutedStr;
            });
            var pool = available.length > 0 ? available : rot;
            part.muted = pool[Math.floor(Math.random() * pool.length)];

            // Update active voices list
            part.active = ['s', 'a', 't', 'b'].filter(function (v) {
                return part.muted.indexOf(v) === -1;
            });
        }

        renderPartesPreview(plan, document.getElementById('partes-preview-display'), document.getElementById('partes-info'));
    };

    // ── Apply ─────────────────────────────────────────────────
    window.applyPartesFromUI = function () {
        if (!window.partesState || !window.partesState.plan) {
            refreshPreview(); 
            if (!window.partesState) return;
        }

        var plan = window.partesState.plan;
        if (!window.bdi || !window.bdi.bar) { alert('No hay partitura activa.'); return; }

        if (typeof window.saveBdiState === 'function') window.saveBdiState();

        // Insert position
        var insertAt = window.bdi.bar.length;
        if (typeof window.selectedMeasureIndex !== 'undefined' && window.selectedMeasureIndex >= 0) {
            insertAt = window.selectedMeasureIndex;
        } else if (typeof np6 !== 'undefined' && np6 && typeof np6.getCursorMeasureIndex === 'function') {
            var ci = np6.getCursorMeasureIndex();
            if (typeof ci === 'number' && ci >= 0) insertAt = ci;
        }

        // Build all measures: 3 passes inline per measure
        // Pass 1: rhythm, Pass 2: mute voices, Pass 3: tonal coloring per part
        var newMeasures = [];
        plan.forEach(function (part, partIndex) {
            for (var m = 0; m < part.measures; m++) {
                newMeasures.push(buildBdiMeasure(
                    part.pattern,
                    part.label,
                    part.muted,
                    partIndex,
                    m          // ← measure offset within part → controls melodic direction
                ));
            }
        });

        // Single splice → correct insertion order
        Array.prototype.splice.apply(window.bdi.bar, [insertAt, 0].concat(newMeasures));

        if (typeof window.syncMeasureCount === 'function') window.syncMeasureCount();
        if (typeof window.applyTextLayer === 'function') window.applyTextLayer();
        if (typeof window.rebuildRecordi === 'function') window.rebuildRecordi();

        // Advance cursor to end of inserted block
        var lastIdx = insertAt + newMeasures.length - 1;
        if (typeof window.selectedMeasureIndex !== 'undefined') window.selectedMeasureIndex = lastIdx;
        if (typeof np6 !== 'undefined' && np6 && typeof np6.setCursorPos === 'function') {
            np6.setCursorPos(lastIdx);
        }
        if (typeof window.renderSilenceButtons === 'function') window.renderSilenceButtons();

        // Feedback
        var infoEl = document.getElementById('partes-info');
        if (infoEl) {
            var total = newMeasures.length;
            var tCompasesInfo = typeof t === 'function' ? t('compases insertados') : 'compases';
            var tInsertadosInfo = typeof t === 'function' ? t('insertados en pos.') : 'insertados en pos.';
            var strInsert = '&#9989; <strong>' + total + ' ' + tCompasesInfo + '</strong> ' + tInsertadosInfo + ' ' + (insertAt + 1);
            infoEl.innerHTML = strInsert;
            var savedPlan = plan;
            setTimeout(function () {
                if (infoEl && savedPlan) {
                    var s = savedPlan.map(function (p) {
                        var ml = p.muted.length
                            ? ('&#128263;' + p.muted.map(function (v) { return v.toUpperCase(); }).join(''))
                            : '&#10003;SATB';
                        return 'P' + p.label + ':n' + p.noteGroup + ' ' + ml;
                    }).join(' | ');
                    var tPartes = typeof t === 'function' ? t('partesExt') : 'partes';
                    var tComp = typeof t === 'function' ? t('compExt') : 'comp';
                    infoEl.innerHTML = '&#128202; ' + savedPlan.length + ' ' + tPartes + ' &middot; ' +
                        total + ' ' + tComp + ' &mdash; ' + s;
                }
            }, 3500);
        }
    };

    // ── Auto-preview wiring ───────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        ['partes-input', 'partes-density-mode', 'partes-voice-mode', 'partes-color-mode'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener(id === 'partes-input' ? 'input' : 'change', refreshPreview);
        });
        setTimeout(refreshPreview, 600);
    });

}());
