/**
 * Image to Melody Feature
 * Handles image uploading, scaling, and polyphonic generation.
 */

(function () {
    // Current state
    let originalImage = null; // Store Image object for re-scaling
    let currentScale = 'mayor';
    let currentKey = 0; // C=0

    // Tessitura Definitions (Standard SATB)
    const TESSITURA = {
        's': { min: 60, max: 84 }, // C4-C6
        'a': { min: 53, max: 74 }, // F3-D5
        't': { min: 48, max: 69 }, // C3-A4
        'b': { min: 40, max: 62 }  // E2-D4
    };

    // Helper: Snap MIDI note to Scale
    function snapToScale(midi, scaleIntervals, keyIndex) {
        let bestNote = midi;
        let minDiff = 1000;

        for (let i = midi - 6; i <= midi + 6; i++) {
            let rel = (i - keyIndex) % 12;
            if (rel < 0) rel += 12;

            if (scaleIntervals.includes(rel)) {
                const diff = Math.abs(i - midi);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestNote = i;
                }
            }
        }
        return bestNote;
    }

    // Helper: Get all in-scale MIDI notes between two pitches (inclusive)
    function getScaleNotesBetween(lowMidi, highMidi, scaleIntervals, keyIndex) {
        const notes = [];
        const lo = Math.min(lowMidi, highMidi);
        const hi = Math.max(lowMidi, highMidi);
        for (let midi = lo; midi <= hi; midi++) {
            let rel = (midi - keyIndex) % 12;
            if (rel < 0) rel += 12;
            if (scaleIntervals.includes(rel)) {
                notes.push(midi);
            }
        }
        return notes;
    }

    // Helper: Move a MIDI note by N scale-steps (positive=up, negative=down), clamped to range
    function stepInScale(midi, steps, scaleIntervals, keyIndex, rangeMin, rangeMax) {
        let current = midi;
        const direction = steps >= 0 ? 1 : -1;
        const count = Math.abs(steps);
        for (let n = 0; n < count; n++) {
            let found = false;
            for (let search = 1; search <= 24; search++) {
                const testNote = current + direction * search;
                let rel = (testNote - keyIndex) % 12;
                if (rel < 0) rel += 12;
                if (scaleIntervals.includes(rel)) {
                    current = testNote;
                    found = true;
                    break;
                }
            }
            if (!found) break;
        }
        if (rangeMin !== undefined) current = Math.max(rangeMin, Math.min(rangeMax, current));
        return current;
    }

    // Initialization
    // Compute real duration from measure count, BPM and time signature.
    // Module-level so both initImageToMelody and processImageDimensions can use it.
    function calcDuration(measures) {
        const bpmInput = document.getElementById('bpm-custom-input');
        const compasSelect = document.getElementById('compas-select');
        const bpm = bpmInput ? (parseInt(bpmInput.value) || 120) : 120;
        const compasVal = compasSelect ? compasSelect.value : '[4,4]';
        let beatsPerMeasure = 4;
        try { beatsPerMeasure = JSON.parse(compasVal)[0]; } catch (e) { }
        const totalSeconds = Math.round(measures * beatsPerMeasure / bpm * 60);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        const durStr = `${m}m ${String(s).padStart(2, '0')}s`;
        return { totalSeconds, durStr, bpm, beatsPerMeasure };
    }

    function initImageToMelody() {
        const container = document.getElementById('right-column-wrapper');
        if (!container) return;

        let panel = document.getElementById('image-melody-container');

        // Ensure panel exists
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'image-melody-container';
            panel.className = 'mode-panel';
            panel.style.display = 'none'; // Hidden by default, toggled later
            panel.style.flexDirection = 'column';
            panel.style.gap = '5px';
            panel.style.padding = '8px';
            panel.style.background = '#fefefe';
            panel.style.borderRadius = '6px';
            panel.style.boxShadow = '0 1px 4px rgba(0,0,0,0.1)';
            panel.style.height = '100%';
            panel.style.overflowY = 'auto';
            container.prepend(panel);
        } else {
            panel.innerHTML = '';
        }

        // Compact UI Layout
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 5px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <h4 style="margin: 0; font-family: monospace; color: #333; font-size: 13px;">🖼️ Img2Melody</h4>
                    <button id="img-melody-info-btn"
                        style="background: #FF9800; color: white; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: help; display: flex; align-items: center; justify-content: center; padding: 0; font-weight: bold;"
                        title="Información sobre el algoritmo">ℹ</button>
                </div>
                <button id="img-melody-open-btn" 
                    style="background: #2196F3; color: white; border: none; padding: 2px 8px; border-radius: 3px; font-weight: bold; cursor: pointer; font-family: monospace; font-size: 10px;">
                    📂 Abrir
                </button>
                <input type="file" id="img-melody-upload" accept="image/*" style="display: none;">
            </div>

            <!-- Preview Area -->
            <div style="display: flex; gap: 8px; align-items: center; justify-content: center; background: #eee; padding: 2px; border-radius: 4px;">
                <canvas id="img-melody-canvas" style="image-rendering: pixelated; max-width: 100%; height: auto; border: 1px solid #ccc;"></canvas>
            </div>
            
            <div style="margin-top: 5px; display: flex; flex-direction: column; gap: 4px;">
                <!-- Slider Control -->
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size:10px; font-family:monospace;">Duración:</span>
                    <span id="img-width-val" style="font-size:10px; font-family:monospace; font-weight:bold;">16 compases</span>
                </div>
                <input type="range" id="img-width-slider" min="1" max="125" value="16" step="1" style="width: 100%;">
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                    <span style="font-size:10px; font-family:monospace;">Ritmo:</span>
                    <select id="img-melody-rhythm" style="font-family: monospace; font-size: 10px; padding: 1px;">
                        <option value="sensible">Sensible (Dinámico + Silencios Trilipi)</option>
                        <option value="relativa">Relativa (Sensible + Tono Relativo)</option>
                        <option value="uniforme">Uniforme (Percusión B/C)</option>
                        <option value="dinamico">Basado en Brillo (Trilipi)</option>
                        <option value="silencio_relleno">Completo (Dinámico + Silencios/Rel.)</option>
                        <option value="arpegio" selected>Arpegio (Escalera de Extremos)</option>
                    </select>
                </div>

                <div id="img-sensible-controls" style="display: block; margin-top: 4px; padding: 5px; background: #f4f4f4; border: 1px solid #ddd; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                        <div style="font-size: 10px; font-weight: bold; font-family: monospace; color: #333;">🎛️ Ajustes Sensibles y Estructura</div>
                    </div>
                    
                    <div style="font-size: 9px; font-family: monospace; color: #333; margin-top:2px;">Estructura (Intro - Medio - Fin): <span id="img-struct-vals" style="font-weight:bold;">25% - 50% - 25%</span></div>
                    <div class="dual-range-container">
                        <div class="dual-range-track"></div>
                        <div class="dual-range-fill" id="img-struct-fill" style="left: 25%; width: 50%;"></div>
                        <input type="range" id="img-intro-slider" class="dual-range-input" min="0" max="100" value="25" step="1">
                        <input type="range" id="img-outro-slider" class="dual-range-input" min="0" max="100" value="75" step="1">
                    </div>

                    <style>
                    .dual-range-container { position: relative; width: 100%; height: 20px; margin-bottom: 4px; }
                    .dual-range-track { position: absolute; top: 10px; width: 100%; height: 4px; background: #ddd; border-radius: 2px; }
                    .dual-range-fill { position: absolute; top: 10px; height: 4px; background: #FF9800; border-radius: 2px; }
                    .dual-range-input { position: absolute; top: 0; width: 100%; -webkit-appearance: none; appearance: none; background: transparent; pointer-events: none; margin: 0; height: 20px;}
                    .dual-range-input::-webkit-slider-thumb { -webkit-appearance: none; pointer-events: auto; width: 12px; height: 12px; background: #fff; border: 2px solid #FF9800; border-radius: 50%; cursor: pointer;}
                    .dual-range-input::-moz-range-thumb { pointer-events: auto; width: 12px; height: 12px; background: #fff; border: 2px solid #FF9800; border-radius: 50%; cursor: pointer; }
                    </style>
                    <div id="img-sensible-desc" style="font-size: 9px; font-family: monospace; color: #666; margin-bottom: 4px; line-height: 1.1;">
                        Define umbral de oscuridad (silencio) y base de volumen.
                    </div>
                    
                    <div style="display:flex; align-items:center; gap: 8px;">
                        <!-- Silence Control -->
                        <div style="display:flex; align-items:center; flex: 1; gap: 2px;">
                            <span id="img-sil-label" style="font-size:9px; font-family:monospace;">Sil:</span>
                            <input type="range" id="img-silence-threshold" min="0" max="100" value="20" step="5" style="flex: 1; min-width: 0;">
                            <span id="img-silence-val" style="font-size:9px; font-family:monospace; width: 18px; text-align: right;">20</span>
                        </div>

                        <!-- Volume Control -->
                        <div style="display:flex; align-items:center; flex: 1; gap: 2px;">
                            <span style="font-size:9px; font-family:monospace;">Vol:</span>
                            <input type="range" id="img-min-volume" min="0" max="100" value="40" step="10" style="flex: 1; min-width: 0;">
                            <span id="img-vol-val" style="font-size:9px; font-family:monospace; width: 18px; text-align: right;">40</span>
                        </div>
                    </div>
                </div>
                
                <div id="img-stats" style="font-family: monospace; font-size: 9px; color: #666; text-align: right; margin-top:2px;"></div>

                <div style="display: flex; gap: 4px; margin-top: 4px;"> 
                    <button id="img-melody-process-btn" disabled 
                        style="flex: 1; background: #FF9800; color: white; border: none; padding: 6px; border-radius: 3px; font-weight: bold; cursor: pointer; font-family: monospace; font-size: 11px; opacity: 0.5;">
                        🚀 Generar
                    </button>
                </div>
            </div>
             
             <!-- Algorithm Explanation -->
             <div id="img-melody-info-tooltip" style="display: none; margin-top: 8px; padding: 8px; background: #fff; border: 1px solid #FF9800; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                <h5 style="margin: 0 0 6px 0; font-size: 10px; font-family: monospace; color: #E65100; text-transform: uppercase; border-bottom: 1px solid #FF9800; padding-bottom: 2px;">🎯 Lógica Polifónica:</h5>
                <ul style="margin: 0; padding-left: 12px; font-size: 10px; font-family: monospace; color: #444; line-height: 1.4;">
                    <li>📏 <span style="font-weight:bold">Eje X</span> = Tiempo</li>
                    <li>↕️ <span style="font-weight:bold">Eje Y</span> = Voces (SATB)</li>
                    <li>🎵 <span style="font-weight:bold">Brillo</span> = Altura</li>
                    <li>⚫ <span style="font-weight:bold">Negro</span> = Silencio (si activo)</li>
                    <li>⚪ <span style="font-weight:bold">Blanco</span> = Nota Larga (si activo)</li>
                </ul>
             </div>

             <div id="img-feedback" style="font-family: monospace; font-size: 10px; color: #4CAF50; margin-top: 5px; min-height: 12px; text-align: center;"></div>
        `;

        // Attach Listeners
        const openBtn = document.getElementById('img-melody-open-btn');
        const uploadInput = document.getElementById('img-melody-upload');
        const slider = document.getElementById('img-width-slider');
        const processBtn = document.getElementById('img-melody-process-btn');

        const infoBtn = document.getElementById('img-melody-info-btn');
        const infoTooltip = document.getElementById('img-melody-info-tooltip');

        if (openBtn) openBtn.onclick = () => uploadInput.click();

        if (infoBtn && infoTooltip) {
            infoBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                infoTooltip.style.display = infoTooltip.style.display === 'none' ? 'block' : 'none';
            };

            // Close tooltip when clicking outside
            document.addEventListener('click', (e) => {
                if (infoTooltip.style.display === 'block' &&
                    !infoTooltip.contains(e.target) &&
                    !infoBtn.contains(e.target)) {
                    infoTooltip.style.display = 'none';
                }
            });
        }
        if (uploadInput) uploadInput.onchange = handleImageUpload;

        const introSl = document.getElementById('img-intro-slider');
        const outroSl = document.getElementById('img-outro-slider');
        const sFill = document.getElementById('img-struct-fill');
        const sVals = document.getElementById('img-struct-vals');

        function updateDualSlider() {
            if (!introSl || !outroSl) return;
            let val1 = parseInt(introSl.value);
            let val2 = parseInt(outroSl.value);
            // Prevent crossing
            if (val1 > val2) {
                if (this.id === 'img-intro-slider') { introSl.value = val2; val1 = val2; }
                else { outroSl.value = val1; val2 = val1; }
            }
            sFill.style.left = val1 + '%';
            sFill.style.width = (val2 - val1) + '%';
            sVals.textContent = `${val1}% - ${val2 - val1}% - ${100 - val2}%`;
        }

        if (introSl) introSl.addEventListener('input', updateDualSlider);
        if (outroSl) outroSl.addEventListener('input', updateDualSlider);

        // Auto-refresh duration labels when global settings change
        const globalBpm = document.getElementById('bpm-custom-input');
        const globalCompas = document.getElementById('compas-select');
        const refreshDuration = () => {
            const slider = document.getElementById('img-width-slider');
            if (slider) {
                const measures = parseInt(slider.value);
                const { durStr } = calcDuration(measures);
                document.getElementById('img-width-val').textContent = `${measures} compases · ${durStr}`;
                const stats = document.getElementById('img-stats');
                if (stats) stats.textContent = `${durStr} · ${measures} compases`;
            }
        };
        if (globalBpm) globalBpm.addEventListener('input', refreshDuration);
        if (globalCompas) globalCompas.addEventListener('change', refreshDuration);

        if (slider) {
            slider.oninput = (e) => {
                const measures = parseInt(e.target.value);
                const widthPx = measures * 8;
                const { durStr } = calcDuration(measures);
                document.getElementById('img-width-val').textContent = `${measures} compases · ${durStr}`;
                if (originalImage) {
                    processImageDimensions(originalImage, widthPx);
                }
            };
        }

        const silenceThresholdSlider = document.getElementById('img-silence-threshold');
        if (silenceThresholdSlider) {
            silenceThresholdSlider.oninput = (e) => {
                document.getElementById('img-silence-val').textContent = e.target.value;
            };
        }

        const volSlider = document.getElementById('img-min-volume');
        if (volSlider) {
            volSlider.oninput = (e) => {
                document.getElementById('img-vol-val').textContent = e.target.value;
            };
        }



        const rhythmSelect = document.getElementById('img-melody-rhythm');
        const sensibleControls = document.getElementById('img-sensible-controls');

        // Helper: update control labels based on selected mode
        function updateControlLabels(mode) {
            const silLabel = document.getElementById('img-sil-label');
            const silSlider = document.getElementById('img-silence-threshold');
            const silVal = document.getElementById('img-silence-val');
            const desc = document.getElementById('img-sensible-desc');
            if (mode === 'arpegio') {
                if (silLabel) silLabel.textContent = 'Int:';
                if (desc) desc.textContent = 'Intervalo S→A / T→B (pasos de escala) y volumen base.';
                if (silSlider) { silSlider.min = 1; silSlider.max = 8; silSlider.step = 1; silSlider.value = 3; }
                if (silVal) silVal.textContent = '3';
            } else {
                if (silLabel) silLabel.textContent = 'Sil:';
                if (desc) desc.textContent = 'Define umbral de oscuridad (silencio) y base de volumen.';
                if (silSlider) { silSlider.min = 0; silSlider.max = 100; silSlider.step = 5; silSlider.value = 20; }
                if (silVal) silVal.textContent = '20';
            }
        }

        if (rhythmSelect) {
            rhythmSelect.addEventListener('change', () => {
                if (sensibleControls) {
                    // Ahora la estructura y el volumen son aplicables a todos los modos
                    sensibleControls.style.display = 'block';
                }
                updateControlLabels(rhythmSelect.value);
            });
            // Initial check
            if (sensibleControls) {
                sensibleControls.style.display = 'block';
            }
            updateControlLabels(rhythmSelect.value);
        }

        if (processBtn) processBtn.onclick = processAndGenerate;

        // Load Default Image (010.png) from Base64 to avoid CORS/file:// issues
        const defaultImgBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAAAECAYAAACwVrKdAAANM0lEQVR4ARyUd1QVVtbFfwJSpPciPHp5D3g8epeioIDtw8r42UusY4wlamyjRp0YW0KMRichGR2TGU3siqhEEUWDBUVBFAsaEFAEpLczb80fZ52z7l333rPv3vvoeKsWSlDoWvFRzpfQiFXi7TNfVJpPxDNgkQQEL5HwkNXyRVCWLLYIl9Wm/vKZpUY2O4dIto2PHLbwloOGtrLOyku26znIgYGB8o2lv2y0VMomG5XsV0TJckW0LLVTy3q7UFlrGySfWqtlpbZebx8s+500stzUQzZ5JsvKgRGyxyVNljgmy7jphyRy6A5JHfalDEldJ1PHbpO/hmVJlme6ZDrEyZ7gJPlEM1GmeGbIKtVguTxokHwcOVUu+3hITkCU7NIMkq1ekbJG4SFfK1xlnSpS1rupZYt/inykTJFtqhSJCF4gYTHLxTdkoahjV0hwwgoJS1otIYkbJSZ9uyRnfS8x4/dK4rSDkjL7exm35LB8tOmU1GycJFdC/aQyS0eK1Q5yRe0oz4ep5abSVS4qvKTA112u+DtLnreDFEU4y/vZPvIs2kHqx3hL3V/s5YqroRT7Wsltlak8jzMXOe8rrTc10nDYWxq32UpRqKtc8LaUXG9ryXd3lMIgCzmpUMivzgo54WAvFwI85aynhXTuMhHZpJTboWq5rnaVklRnqfvYSd6OGSjVw62kaUugvBqhkGeZNlK7J0z7zmypWe0pUjFW2r5yk9oZVvJmmq10H1TJ0yRDqYwyksdj9eVmkKXke1jKVS8TeTHZSYpDneWEs4HkKx3/h+uqn7XUf2IvH87ZStU8WznjZSYX/B3lvNJeTnlZye8ZyHEfCznqZSMd++2lSGP6Pwy3wuylNMZRCiIcpXuvq7z5wlqa5mqkY+1AuaQ2kcJAJ7niZyKVE1VSOkQty1YflaxF/5IR/39A0iZ+K2nT9kng4A2SMukLiUhZIREJSyVCNVsyopdIRMAcCQ+bJ9Hhi2SKcqyMcUqWtU6x8plHmhxSD9NynibrfTUy1y1C1oVlSLaHRhYPDJdlzuHyjVYj8zzT5IyLUpY4a88ETpDpzumS6TJclkfNlOSRX0r08B2SNOErmTFqqZyMHy4bAxLlH2Favbr5yB5NjJwO0PId6iCnAqy1/2Arv2scpCDMRq4PUsjlGIWcVzto92zleqSTXFVby5UQN/nBy16O+PlIXlSI5EeGSrZ/gBxWRcmO4DTZpk6VnFGzJGXkKhk1I1sysnaJJmKZqEOXSWjYClH7L5SQwIXi6T1PdDbaFPGt8wW+981l64Dj7LK5wE6bAraa5pLtXchKq5MEODxn/ChjEuMtyRxhqs19eEWAS4qlNqzJWufCoDmeeI4WXDJNtGuW+GYqMIjtJC1dl5jUD4Qn9DH9r2Ykz7IheKILPll2tI0Jwnn6EEzHqFDPj9fWdagmuDJB+as2rpEVfwmFsR79+7qpcVLRq4nDMCGNe0EjMBs5mtA5Uxg6Uk3d4+ukNv4LX6832NUXMcnrHrO875DW9xxF70tmudwiUe8xCS15qJ/k8aYsD4+73+BbtBP1nWx8iraj+SObqGtbSCrezKiitSSeXUD8qfkofpmL7k8zebdrEo82jGDull/ZVvaU0b8IU8vqWPywlh23nlLS/p5W41dYerUQucCI5DVWhG00xyLLHMc9gZh8HozJqghCz6WiORmP8nAYdjlDaHd2Q79HD2MrHYwDzQnY2ErMnn5Eru4gaE4TDW0fMLJs4Hn7Ky62tXLi8TPyazvZtKaLzV+95NHLUqoaqjF824RpWzNmjs1Yz++PweAu7L6OwOXbDViPdqHP5jo2Cd30lRTR/edbOsp6yDv9jvULHrGmsIu194XPzuiyuaKDHfUd7Kvp4uTFJuxTW4hbaAd+NfQq6jH26KJfqzF6Vwbg4u1I7Iz+xG+xJiXHi7TfIojbNYKM3GRG5ifRb1g0EadHEnE8lpAfNXhsciBukyPNj5rRfdSfGzfL2ba3ln9WtvBpaTXLHrcw+mgFky894OKWsbz4bhb1h2bTc2wxZocW43V1AzZHP9Py9RXjHuxhaNVPmBftYWbldwx7cIBhpfuxK/uNlOrLqNsLGSYXcGy8yOuyc3h9KGGa1W0m2+eTYlfOSP2HDHhXTL+WV2gWzaZg+iZMsuZTHxaNVXoKDglxtAeqCbTuY3Z8CRmeNYSG9OHwsSOGqa60JZtjNNkJo1RTaof60BDlT3N8KI3p0QzwV9Ll7Uuzux8dIUoMsjxojXajOVZJV7oaw1GeOAz2RTk3FNOh1vQG2eOoNMY4uBsnLW++Wq/pOL5kmuEpJtUeZErTL6wzv8E+5Q122ufydVIl25Or+DGrHB1Le2Ny6u3YX63hPx2+XDZNIOe9AxU2KeS9VfF7uy95Lb6cbYriZHswB584cbPSmnvvPCl+OIDiCnMKDvXy8LEVdX9qG230Qa/VGZMufd4960fxFeh9E0TdKzPsFSre39BBt7QbvduCzbNWFFoxmJbXof9HA7oPfLF/3gZ3LAio1yX4jhGTm/IZW3uOOY3nmd+Xy7TaXGZUnyH15ndEXDqAlOQSkBaDSVgsz0yCCZiVxnvzMKoCRmIzdQwDEsN5pUhDPzmJ/kPSCVswiLSsWJaMTmHpuDhWTYnlbxMG8eWnacwYF8uMif6MnuXG8iPBTF/tzfY1Qfz490gunRzKlctDGO84gAwze+aZmLLaxgKVoR2dPXYU1upT8tqMolJjdi95wa4ZFWwZ/YQdw0vZHpvP8oBjZAbnMtn/HBnK84wMv84qzTFe/f0CxbNKuPZRJcenPuX0X5rYO6qBbbNb2fC3Hva9gF2lXVxvMaKuuYXe/jo06faAdKPQAwYY0d3TzSOt6QxjtGIYbkmfrw8Gz3rRf/CQzmvbobKG7vdQfa+dtk5d+mU44/StA+Ny3Bkz2JhBZrr4aO8Mk3biTXRxbmvHpK+PV02t7NvdyZyVdWw+qc/mc53svtDOmh9esS77Fbu2PubYjvec/aicK9OKKVt6g2c7y1isOkGm1ylGeZ5liOthhrifYWLgZeJT7zMkvZSJ2S1MyHnL7rs93G7U5W2XER2ii62OPnG6eoy1MGGr2pDrtyZzamsIR7Nj2LzWg93rg9h3dDg5h0cwY3kgs5Z4cXB3IulLlSxZ6c3sT9xZsVpJ5oZIQuaoCP5kGD7j1Oyc6k9cVjL2QRoMnELp9lBjHhbE6AlD8EmJZky/XBbonWR8P61hDG+S2FnI6hHODLKoIK6pCMur9QSWP8VFO3De5hlgbRmIYmAWpp0Z9HsfzoDGOIy6E2ir8aNNN4lig2jq7UfxmhAa2yIoL02is1+GlgMNrS2x2oGbxMvQKdy+a8P9KhVN7d60G8bSoB5P259udP45kN46e3R6Imnqr6bXMZ5232TumGdwb0AUVfWuvKtxpPF2Lzqr77ZSUVlNW3szL/58TmPtHQbqv+Zt2Q2elJdQUfaUB+WlFBXmUVpyladPK/j9SQPlz6u436DNjV3858U7Ttyv4fi9Wn6+XsZprSEPFHdwocGEP8wcuNH+hkftNYzfeZvzGJCvY8BVA6gxqONew31e6dbTYVpNbW8pNTo1lL99xOkXj/i56ikFBt1Ua4wpdRD+3WzJEQNjDhvY8gU2bNczJccomM/rbDlh4EeVyo28ul5+6YBCrRg2aQHmvHPkuzdmHKnV5b7ZS45XCfd1u3nh1sQJuvix4T1n+jdxQIvzWGcdp9p7uPTBghMFQmWHNQWNPey70Un2b1Xs3XWRWo0C06EO9KUp6I2yYlySJYPDdElL6MEvygxNcg/JmX54x1qTOdWXAR5mhA5VMH6sPR/5mDMtyp1DK5zYnOrInPFK+owC0FM60DLQAF1vS2yjBxKeok9UrCvzJylYM8+M3/aFsyLBmOWDXVmU4saywR5MS/dhyg8aooa7kzwxmJhJKrpt1egbhPAmv4MG3xAaLVUYm8TQ6upO/2YbFGNm0NhmhODOm4dG9JRbYmRljluUPXFJNoyYGcGiz2OZMEjFtMQQRiVGMHZSIEsywlgZr2T/qiAS4/xJGhypNYwad19PHHxdsFCG02KrwtxlIP0dzBmW4Mn/qf2YGebBbLWaRdFhDPezY32Khrlx3nwxI5ZLOUnMTHZkYUoAC5J82J5ux6pRbmQOcyc6wRJLP0curM3j1vU67uY30FDWxtOSVirPveDXg/d5+KSewsoefrr5jrPPjTn2wpTfqw05/byTk5X9uVBtwW9XX/CoxYG7Ogr2FjXzc5Mhp3rNuWjkTKF26JnYfaCqoYfz5y5zuPgNPxS+5trLJiq0nBdf/hKDpqs87HrGrZ567po0UKXoodKsi/wHhZwqLiDvcR7PqOGnZ+Ucf/ucX/rpcvpdHbd19TlSXsyxmpfaviq4VvWQ0pd/8Nqig4MlT9h+8R6/7svnto4ZP996Q86dGi4+aeRU9kUO597l/N0nWlw1fHv9MYevPeafuTc5cvoq+08W8H1ZE1tLPrD9VjXLC/T4LwAAAP//A7XlEwAAAAZJREFUAwBwpw33lx2Z5QAAAABJRU5ErkJggg==";

        const defaultImg = new Image();
        defaultImg.onload = function () {
            originalImage = defaultImg;
            const sliderVal = document.getElementById('img-width-slider') ? document.getElementById('img-width-slider').value : 16;
            const widthPx = parseInt(sliderVal) * 8;
            processImageDimensions(defaultImg, widthPx);
        };
        defaultImg.src = defaultImgBase64;
    }

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                originalImage = img; // Store for re-processing
                const sliderVal = document.getElementById('img-width-slider').value;
                const widthPx = parseInt(sliderVal) * 8;
                processImageDimensions(img, widthPx);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function processImageDimensions(img, widthPx) {
        const canvas = document.getElementById('img-melody-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Width can go up to ~1000px (= ~4 minutes)
        // Height = 4 (Voices)
        const w = widthPx;
        const h = 4;

        canvas.width = w;
        canvas.height = h;

        // Draw resized
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, w, h);

        // Update Stats
        const stats = document.getElementById('img-stats');
        const totalMeasures = Math.ceil(w / 8);
        const { durStr } = calcDuration(totalMeasures);

        const label = document.getElementById('img-width-val');
        if (label) label.textContent = `${totalMeasures} compases · ${durStr}`;

        if (stats) stats.textContent = `${durStr} · ${totalMeasures} compases`;

        const btn = document.getElementById('img-melody-process-btn');
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
        }

        document.getElementById('img-feedback').textContent = '';
    }

    // Helper to get global time signature info
    function getGlobalTimeSignature() {
        if (window.bdi && window.bdi.metadata && window.bdi.metadata.timeSignature) {
            return window.bdi.metadata.timeSignature; // e.g. [4, 4]
        }
        return [4, 4];
    }

    // Helper: Pick a pattern from global 'trilipi' based on brightness
    // Darker = Lower Index (Simpler/Slower)
    // Lighter = Higher Index (More notes/Complex)
    function getWeightedTrilipiPattern(timeSig, luminosity) {
        if (typeof window.trilipi === 'undefined') return null;

        // trilipi is an array where trilipi[i] contains patterns of density/complexity i.
        // We want to map luminosity to 'i'.

        const availableKeys = Object.keys(window.trilipi).map(Number).filter(n => !isNaN(n));
        if (availableKeys.length === 0) return null;

        const minKey = Math.min(...availableKeys);
        const maxKey = Math.max(...availableKeys);

        const norm = luminosity / 255;

        // Map norm to key range
        // User said: "Claro (255) -> trilipi[8]", "Oscuro (0) -> trilipi[2]" (assuming [2] is min valid usually)
        let targetKey = minKey + (norm * (maxKey - minKey));
        targetKey = Math.round(targetKey);

        const bestKey = availableKeys.reduce((prev, curr) => {
            return (Math.abs(curr - targetKey) < Math.abs(prev - targetKey) ? curr : prev);
        });

        const variations = window.trilipi[bestKey];
        if (!variations || variations.length === 0) return null;

        // Pick one random variation from this density level
        const randIndex = Math.floor(Math.random() * variations.length);
        return variations[randIndex];
    }

    // New Helper: Get best matching Rest Pattern from Trilini (variations with rests)
    // We look at the 'on/off' structure of the chunk (based on velocity threshold)
    // and find the pattern in trilini[8] (assumed to be 8th notes base variations) that matches best.
    // trilini[8] might not exist directly as '8' usually means count of notes. 
    // Actually window.trilini contains variations with rests.
    // We assume we are working with 8th notes (8 pixels) -> trilini[8] would correspond to patterns derived from 8 notes.
    // IF trilini[8] serves 8 notes.
    function getSensibleTriliniPattern(chunkVelocities) {
        if (typeof window.trilini === 'undefined') return null;

        // We assume the chunk represents a full measure of 8th notes (8 slots)
        // We want to find a pattern in trilini that matches the "silence" distribution.

        // 1. Create a boolean map of the chunk: [true, false, true...] where false is below threshold
        const threshold = 40; // Velocity threshold for silence
        const inputPatternBool = chunkVelocities.map(v => v > threshold);

        // 2. Find closest match in trilini
        // We look at trilini[8] (variations of 8 notes). If not exists, maybe fallback to trilipi[8] and apply rests?
        // Check metrica.js: trili[8] = [[4,4,4...]]. trilini[8] = restini(trili[8]).
        // So trilini[8] contains arrays like [4, -4, 4, 4...].

        const possiblePatterns = window.trilini[8];
        if (!possiblePatterns || possiblePatterns.length === 0) return null;

        let bestPattern = null;
        let maxScore = -1;

        // Scoring: +1 for match (Sounding match Sounding, Silent match Silent)
        possiblePatterns.forEach(pat => {
            // pat is array of durations, e.g. [4, -4, 4...]
            // We need to map `pat` back to time slots to compare with `inputPatternBool` (which is 8 slots of fixed time?)
            // ACTUALLY: `trilini` patterns vary in duration sums? 
            // `trili[8]` is defined as `[[5,5,5,5,5,5,5,5]]` (16th notes?) or similar?
            // In metrica.js: `trili[8] = [[5, 5, 5, 5, 5, 5, 5, 5]];` -> 8 semicorcheas?
            // Wait. 
            // Classic 'uniforme' mapping in image-melody uses 8 pixels -> 8 corcheas (4).
            // So we want patterns of length 8 where elements are '4' or '-4'.
            // trili[8] in metrica.js (lines 80/215) is defined as 8 * 5 (semicorcheas)? No, `5` is 16th.
            // If we want 8 corcheas, we need a pattern that sums to 4/4 (32 units).
            // 8 * 4 = 32. So we need patterns of 8 '4's.
            // In metrica.js: `trili[8] = [[4, 4, 4, 4, 4, 4, 4, 4]];` (line 215 for 4/4).
            // Perfecto. So trilini[8] has variations like [-4, 4, 4...].

            let currentScore = 0;
            // Assuming pattern length corresponds to input slots (both 8)
            if (pat.length !== inputPatternBool.length) return;

            for (let i = 0; i < pat.length; i++) {
                const isSounding = pat[i] > 0;
                const inputSounding = inputPatternBool[i];
                if (isSounding === inputSounding) {
                    currentScore++;
                }
            }

            if (currentScore > maxScore) {
                maxScore = currentScore;
                bestPattern = pat;
            }
        });

        return bestPattern;
    }

    function processAndGenerate() {
        const canvas = document.getElementById('img-melody-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const w = canvas.width;
        const h = canvas.height; // Should be 4
        const imageData = ctx.getImageData(0, 0, w, h).data;

        const rhythmMode = document.getElementById('img-melody-rhythm').value; // 'uniforme' or 'dinamico'
        const timeSig = getGlobalTimeSignature();

        // Determine Pixels per Measure based on Time Sig
        // Standard: 4/4 -> 8 pixels (corcheas)
        // 3/4 -> 6 pixels
        // n/4 -> n * 2 pixels
        // n/8 -> n pixels (since 1 pixel = 1 corchea/8th)
        // Formula: (Numerator * 8) / Denominator
        // 4/4 -> 32/4 = 8.
        // 3/4 -> 24/4 = 6.
        // 6/8 -> 48/8 = 6.
        const PIXELS_PER_MEASURE = (timeSig[0] * 8) / timeSig[1];

        // GLOBAL Context
        const globalScaleName = (typeof window.escalas !== 'undefined' && typeof window.scali !== 'undefined') ? window.escalas[window.scali] : 'mayor';
        const globalKeyIndex = (typeof window.keyinselecti !== 'undefined') ? window.keyinselecti : 0;
        const scaleIntervals = (typeof window.escalasNotas !== 'undefined') ? window.escalasNotas[globalScaleName] : [0, 2, 4, 5, 7, 9, 11];

        // Prepare Data Structures
        const voiceKeys = ['s', 'a', 't', 'b'];
        const notesByVoice = { 's': [], 'a': [], 't': [], 'b': [] };
        // We will store raw pixel data first, then process into measures

        // Scan Column by Column (Time)
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < 4; y++) {
                const idx = (y * w + x) * 4;
                const r = imageData[idx];
                const g = imageData[idx + 1];
                const b = imageData[idx + 2];

                const vKey = voiceKeys[y];
                if (!vKey) continue;

                // Store raw pixel props
                notesByVoice[vKey].push({ r, g, b });
            }
        }

        const totalMeasures = Math.ceil(w / PIXELS_PER_MEASURE);

        const introSlider = document.getElementById('img-intro-slider');
        const outroSlider = document.getElementById('img-outro-slider');

        // Defaults if missing
        const introPct = introSlider ? parseInt(introSlider.value) / 100 : 0.25;
        const outroPct = outroSlider ? parseInt(outroSlider.value) / 100 : 0.75;
        const codaPct = 1 - outroPct;

        const useOverture = introPct > 0;
        const useResolution = codaPct > 0;

        // Ensure at least 1 measure if percentage applies
        const numOvertureMeasures = useOverture ? Math.max(1, Math.floor(totalMeasures * introPct)) : 0;
        const numCodaMeasures = useResolution ? Math.max(1, Math.floor(totalMeasures * codaPct)) : 0;
        const finalMeasures = [];

        const noteDuration = (timeSig[1] === 8) ? 4 : 4; // Assuming pixel=corchea=4 always. Just mapping.

        const playbackSelector = document.getElementById('playback-selector');
        const activeVoices = playbackSelector ? playbackSelector.value.split(',') : ['s', 'a', 't', 'b'];

        // State for RELATIVA mode (Voice specific continuity)
        // Stores { lastPitch: number, lastLum: number } for each voice
        const voiceState = {};
        voiceKeys.forEach(k => voiceState[k] = { lastPitch: null, lastLum: null });

        // --- Arpegio rhythm variation state (per dominant voice) ---
        // Tracks the previous measure's average luminosity and how many remaining
        // measures should keep using the current alternative rhythm pattern.
        //
        // Valid 4/4 patterns (all durations sum to exactly 4 quarter-note beats):
        //   code 1=whole, 2=half, 3=quarter, 4=eighth, 5=16th
        //   [3,3,3,3]       = 1+1+1+1 = 4 beats  (4 notes)  — negras calm
        //   [2,4,4,4,4]     = 2+.5+.5+.5+.5 = 4   (5 notes)  — blanca then corcheas
        //   [3,4,4,3,4,4]   = 1+.5+.5+1+.5+.5 = 4 (6 notes)  — swing pairs
        //   [3,3,5,5,5,5,5,5,5,5] = 1+1+.25*8=4  (10 notes)  — negras + semis burst
        //   [4,4,4,4,4,4,4,4]     = .5*8 = 4      (8 notes)   — normal corcheas
        const ARP_PATTERNS = {
            normal: [4, 4, 4, 4, 4, 4, 4, 4],         // base: 8 corcheas
            calm: [3, 3, 3, 3],                  // 4 negras — más lento, reposado
            wide: [2, 4, 4, 4, 4],                // blanca + 4 corcheas — apertura dramática
            swing: [3, 4, 4, 3, 4, 4],             // pares swing — groove
            burst: [3, 3, 5, 5, 5, 5, 5, 5, 5, 5],    // negras + explosión de semis
            resolve: [2, 2]                       // 2 blancas — cierre final
        };

        const arpRhythmState = {
            s: { prevAvgLum: null, momentum: 0, currentPattern: null },
            t: { prevAvgLum: null, momentum: 0, currentPattern: null }
        };

        // --- PHASE 0: Global Summary (Obertura de Resumen) ---
        // Analizamos TODA la imagen antes de empezar para crear un resumen en el primer compás.
        let globalSummary = { s: null, t: null };
        if (rhythmMode === 'arpegio') {
            ['s', 't'].forEach(vk => {
                const fullVoiceData = notesByVoice[vk];
                if (!fullVoiceData || fullVoiceData.length === 0) return;

                const sliceCount = numOvertureMeasures * 8; // 8 puntos por cada compás de obertura
                const sliceSize = Math.floor(fullVoiceData.length / sliceCount);
                const summaryNotes = [];
                let entropyCount = 0;
                let prevL = null;

                for (let i = 0; i < sliceCount; i++) {
                    const startIdx = i * sliceSize;
                    const slice = fullVoiceData.slice(startIdx, startIdx + sliceSize);
                    let sumL = 0;
                    slice.forEach(p => {
                        const l = (0.299 * p.r + 0.587 * p.g + 0.114 * p.b);
                        sumL += l;
                        if (prevL !== null && Math.abs(l - prevL) > 40) entropyCount++;
                        prevL = l;
                    });
                    const avgL = sumL / (slice.length || 1);
                    const range = TESSITURA[vk];
                    const pitch = snapToScale(Math.round(range.min + (avgL / 255) * (range.max - range.min)), scaleIntervals, globalKeyIndex);
                    summaryNotes.push(pitch);
                }

                // Selección dinámica del ritmo de la intro basado en la "actividad" (entropía) visual
                const relativeEntropy = entropyCount / fullVoiceData.length;
                let chosenPattern;
                if (relativeEntropy > 0.35) chosenPattern = ARP_PATTERNS.burst;   // Imagen muy ruidosa/detallada
                else if (relativeEntropy > 0.15) chosenPattern = ARP_PATTERNS.swing; // Movimiento moderado
                else if (relativeEntropy > 0.05) chosenPattern = ARP_PATTERNS.wide;  // Cambios graduales
                else chosenPattern = ARP_PATTERNS.calm;                       // Imagen minimalista/plana

                globalSummary[vk] = { notes: summaryNotes, pattern: chosenPattern };
            });
        }

        for (let m = 0; m < totalMeasures; m++) {
            const start = m * PIXELS_PER_MEASURE;
            const end = start + PIXELS_PER_MEASURE;

            const newMeasureVoices = [];
            let mainTrackNotes = [];
            let mainTrackDurs = [];
            let mainTrackDyns = [];
            // Stores arpegio ladders from S and T so A and B can depend on them
            const arpegioStore = {};

            voiceKeys.forEach(vKey => {
                // Skip inactive voices
                if (!activeVoices.includes(vKey)) return;

                const chunk = notesByVoice[vKey].slice(start, end);

                // Default: Empty measure if no data
                if (chunk.length === 0) {
                    newMeasureVoices.push({ nami: vKey, nimidi: [], tipis: [], dinami: [] });
                    return;
                }

                // Calculate Avg Brightness for this chunk
                let totalLum = 0;
                chunk.forEach(p => {
                    totalLum += (0.299 * p.r + 0.587 * p.g + 0.114 * p.b);
                });
                const avgLum = totalLum / chunk.length; // 0-255

                // Decision Logic
                // If "dinamico" AND avgLum is LOW (< 80 maybe?), use Trilipi Pattern
                // Else use Uniform 8th notes

                let nimidi = [];
                let tipis = [];
                let dinami = [];
                let processed = false;

                // --- NEW LOGIC: Silence/Fill Mode ---
                if (!processed && rhythmMode === 'silencio_relleno') {
                    // Very Dark (Black, < 50) -> Silence whole measure
                    if (avgLum < 50) {
                        nimidi.push(60);
                        tipis.push(-1); // Whole Rest (Redonda rest if -1 is mapped, or use -4*8. Let's assume -1 works for restWhole)
                        dinami.push(0);
                        processed = true;
                    }
                    // Very Bright (White, > 230) -> Single Long Note
                    else if (avgLum > 230) {
                        const p = chunk[0];
                        const range = TESSITURA[vKey];
                        const brightness = (0.299 * p.r + 0.587 * p.g + 0.114 * p.b);
                        const norm = brightness / 255;
                        const rawPitch = range.min + (norm * (range.max - range.min));
                        const finalNote = snapToScale(Math.round(rawPitch), scaleIntervals, globalKeyIndex);

                        nimidi.push(finalNote);
                        tipis.push(1); // Whole Note (Redonda)
                        dinami.push(100);
                        processed = true;
                    }
                }

                // --- Existing Logic: Dynamic Mode (Trilipi) ---
                // Also apply to 'silencio_relleno' if it wasn't caught by the extreme black/white checks above
                if (!processed && (rhythmMode === 'dinamico' || rhythmMode === 'silencio_relleno') && avgLum < 100) {
                    // Get Pattern Weighted by Luminosity
                    const pattern = getWeightedTrilipiPattern(timeSig, avgLum);
                    // pattern is array of durations e.g. [4, 4, 4, 4] or [2, 2]

                    if (pattern) {
                        // Map pattern beats to pitches
                        // We have `chunk` of pixels (e.g. 8 pixels).
                        // We have `pattern.length` notes (e.g. 2 notes).
                        // How to chose pitch?
                        // Simple: Distribute chunk evenly among pattern steps.

                        let pixelIndex = 0;
                        const pixelsPerStep = chunk.length / pattern.length;

                        pattern.forEach(durCode => {
                            // Determine duration int value
                            // durCode might be '4' (int) or complex? 
                            // trilipi usually stores ints like 4, 2, 25(dotted).
                            // Wait, trilipi in metrica.js had 25, 35. This needs parsing?
                            // But usually they represent standard units. 
                            // Let's assume passed strictly to `tipis`.

                            // Sample Pitch from the corresponding segment of pixels
                            const centerPixelIdx = Math.floor(pixelIndex + (pixelsPerStep / 2));
                            const p = chunk[Math.min(chunk.length - 1, centerPixelIdx)];

                            // Calculate Pitch from this pixel
                            const range = TESSITURA[vKey];
                            const brightness = (0.299 * p.r + 0.587 * p.g + 0.114 * p.b);
                            const norm = brightness / 255;
                            const rawPitch = range.min + (norm * (range.max - range.min));
                            const finalNote = snapToScale(Math.round(rawPitch), scaleIntervals, globalKeyIndex);
                            const vel = Math.max(40, Math.min(127, Math.floor(p.b / 2)));

                            // Handle Rest codes in pattern (negative)
                            // trilipi patterns in metrica.js sometimes have negatives? 
                            // `inimetri` fills `trili`, `trilini` fills with rests options.
                            // `trilipi` seems to hold positive patterns only in some indices? 
                            // Let's check logic: window.trilipi[a] = trili[a]. 
                            // trili[4] has arrays of positive numbers.

                            // If duration is negative? No, trili patterns are usually generated fully sound.
                            // But user said "tome patrones trilipi".

                            nimidi.push(finalNote);
                            tipis.push(durCode); // Use the code directly (4, 2, 25...)
                            dinami.push(vel);

                            pixelIndex += pixelsPerStep;
                        });

                    } else {
                        // Fallback to uniform if no pattern found
                        chunk.forEach(p => {
                            // ... same logic as below ...
                            // Duplicated for brevity, effectively fallback
                        });
                    }
                }

                // --- ARPEGIO MODE ---
                if (!processed && rhythmMode === 'arpegio') {
                    const volSlider = document.getElementById('img-min-volume');
                    const baseVol = volSlider ? parseInt(volSlider.value) : 40;
                    const volRange = 127 - baseVol;

                    // Interval steps: how many scale steps A is below S (and B below T)
                    const intSlider = document.getElementById('img-silence-threshold');
                    const intervalSteps = intSlider ? parseInt(intSlider.value) : 3;

                    const range = TESSITURA[vKey];

                    // --- VOICES S and T: generate own arpegio ladder ---
                    if (vKey === 's' || vKey === 't') {
                        // 1. Luminosities for the chunk
                        const lums = chunk.map(p => 0.299 * p.r + 0.587 * p.g + 0.114 * p.b);

                        // 2. Find extreme pixels
                        let minLum = 255, maxLum = 0, minIdx = 0, maxIdx = 0;
                        lums.forEach((l, i) => {
                            if (l < minLum) { minLum = l; minIdx = i; }
                            if (l > maxLum) { maxLum = l; maxIdx = i; }
                        });

                        // 3. Map extremes to pitches within tessitura
                        const lowPitch = snapToScale(Math.round(range.min + (minLum / 255) * (range.max - range.min)), scaleIntervals, globalKeyIndex);
                        const highPitch = snapToScale(Math.round(range.min + (maxLum / 255) * (range.max - range.min)), scaleIntervals, globalKeyIndex);

                        // 4. Build the diatonic staircase
                        let ladder = getScaleNotesBetween(lowPitch, highPitch, scaleIntervals, globalKeyIndex);
                        if (ladder.length === 0) ladder = [lowPitch];

                        // 5. Intermediate pixels → velocity
                        const interPixels = chunk.filter((_, i) => i !== minIdx && i !== maxIdx);
                        const avgInterLum = interPixels.length > 0
                            ? interPixels.reduce((s, p) => s + 0.299 * p.r + 0.587 * p.g + 0.114 * p.b, 0) / interPixels.length
                            : 128;
                        const arpVel = Math.round(baseVol + (avgInterLum / 255) * volRange);
                        const avgLumForState = lums.reduce((s, l) => s + l, 0) / (lums.length || 1);

                        // 6. Rhythm variation: detect luminosity change vs previous measure
                        const vrs = arpRhythmState[vKey];
                        const lumChange = (vrs.prevAvgLum !== null)
                            ? Math.abs(avgLumForState - vrs.prevAvgLum) : 0;
                        const gettingBrighter = (vrs.prevAvgLum !== null) && (avgLumForState > vrs.prevAvgLum);
                        vrs.prevAvgLum = avgLumForState;

                        // 7. Direction & Special Cases
                        let dirLadder;
                        let chosenPattern;

                        if (m < numOvertureMeasures && globalSummary[vKey]) {
                            // --- CASO ESPECIAL: Obertura Resumen ---
                            // En los compases de obertura usamos los datos globales calculados en la Fase 0
                            chosenPattern = globalSummary[vKey].pattern;
                            // Extraemos las 8 notas que corresponden a ESTE compás de obertura
                            dirLadder = globalSummary[vKey].notes.slice(m * 8, (m + 1) * 8);
                        } else {
                            // Comportamiento normal (local al compás)
                            dirLadder = (m === 0 || m % 2 === 0) ? ladder : [...ladder].reverse();

                            if (useResolution && m >= totalMeasures - numCodaMeasures) {
                                // --- CASO ESPECIAL: Final Proporcional (Coda) ---
                                const prevMeasure = (finalMeasures.length > 0) ? finalMeasures[m - 1] : null;
                                const prevVD = prevMeasure ? prevMeasure.voci.find(v => v.nami === vKey) : null;

                                if (prevVD && prevVD.nimidi.length > 1) {
                                    let currentUnits = 0;
                                    const limitUnits = PIXELS_PER_MEASURE; // Capacidad en corcheas (8 para 4/4)
                                    const unitMap = { 1: 8, 2: 4, 3: 2, 4: 1, 5: 0.5 };

                                    for (let i = 0; i < prevVD.nimidi.length; i += 2) {
                                        const oldT = Math.abs(prevVD.tipis[i]);
                                        // Doblar duración de forma segura (5->4->3->2->1)
                                        let newT = Math.max(1, oldT - 1);
                                        if (oldT === 1) newT = 1;

                                        const dur = unitMap[newT] || 1;
                                        if (currentUnits + dur > limitUnits) break;

                                        nimidi.push(prevVD.nimidi[i]);
                                        tipis.push(prevVD.tipis[i] < 0 ? -newT : newT);
                                        dinami.push(prevVD.dinami[i]);
                                        currentUnits += dur;
                                    }
                                } else if (prevVD && prevVD.nimidi.length > 0) {
                                    nimidi.push(prevVD.nimidi[0]);
                                    tipis.push(1); // Redonda final
                                    dinami.push(prevVD.dinami[0]);
                                }
                                processed = true;
                            }
                            else if (vrs.momentum > 0) {
                                // Continue variation from previous trigger
                                chosenPattern = vrs.currentPattern;
                                vrs.momentum--;
                            } else if (lumChange > 45) {
                                // Significant change detected → pick alternative rhythm
                                const pick = Math.random();
                                if (gettingBrighter) {
                                    vrs.currentPattern = (pick < 0.5) ? ARP_PATTERNS.burst : ARP_PATTERNS.swing;
                                } else {
                                    vrs.currentPattern = (pick < 0.5) ? ARP_PATTERNS.calm : ARP_PATTERNS.wide;
                                }
                                vrs.momentum = 1;
                                chosenPattern = vrs.currentPattern;
                            } else {
                                chosenPattern = ARP_PATTERNS.normal;
                            }
                        }

                        if (!processed) {
                            // 8. Distribute pattern notes evenly across the diatonic ladder
                            //    Each pattern slot picks a proportional position in the ladder.
                            const patLen = chosenPattern.length;
                            for (let i = 0; i < patLen; i++) {
                                const noteIdx = Math.floor((i / patLen) * dirLadder.length);
                                nimidi.push(dirLadder[noteIdx % dirLadder.length]);
                                tipis.push(chosenPattern[i]);
                                dinami.push(arpVel);
                            }
                        }

                        // Store nimidi + contrast info so A/B can read it
                        const lumRangeST = maxLum - minLum;
                        const avgLumST = lums.reduce((s, l) => s + l, 0) / (lums.length || 1);
                        arpegioStore[vKey] = {
                            nimidi: [...nimidi], tipis: [...tipis], dinami: [...dinami],
                            lumRange: lumRangeST, avgLum: avgLumST
                        };

                        // --- VOICE A: depends on S | --- VOICE B: depends on T ---
                    } else if ((vKey === 'a' && arpegioStore['s']) || (vKey === 'b' && arpegioStore['t'])) {
                        const src = arpegioStore[vKey === 'a' ? 's' : 't'];
                        const depVel = Math.max(baseVol, Math.round((src.dinami[0] || baseVol) * 0.82));

                        // --- Decide rhythm based on contrast of the leader's chunk ---
                        // Very low contrast + generally bright → redonda (1 whole note, sustained)
                        // Low contrast                        → 2 blancas
                        // Medium contrast                     → 4 negras
                        // High contrast                       → 8 corcheas (follow S/T exactly)
                        const contrast = src.lumRange;
                        const brightness = src.avgLum;

                        // Helper: pick representative dependent note from src nimidi by segment
                        const depNote = (segStart, segLen) => {
                            const midIdx = Math.min(src.nimidi.length - 1, Math.floor(segStart + segLen / 2));
                            return stepInScale(src.nimidi[midIdx], -intervalSteps, scaleIntervals, globalKeyIndex, range.min, range.max);
                        };

                        if (contrast < 28 && brightness > 165) {
                            // === REDONDA (1 whole note) ===
                            const note = depNote(0, src.nimidi.length);
                            nimidi.push(note);
                            tipis.push(1);   // whole note
                            dinami.push(depVel);

                        } else if (contrast < 70) {
                            // === 2 BLANCAS (half notes) ===
                            const half = Math.floor(src.nimidi.length / 2);
                            nimidi.push(depNote(0, half)); tipis.push(2); dinami.push(depVel);
                            nimidi.push(depNote(half, half)); tipis.push(2); dinami.push(depVel);

                        } else if (contrast < 140) {
                            // === 4 NEGRAS (quarter notes) ===
                            const q = Math.floor(src.nimidi.length / 4);
                            for (let qi = 0; qi < 4; qi++) {
                                nimidi.push(depNote(qi * q, q));
                                tipis.push(3);
                                dinami.push(depVel);
                            }

                        } else {
                            // === 8 CORCHEAS (follow leader exactly) ===
                            src.nimidi.forEach(srcNote => {
                                nimidi.push(stepInScale(srcNote, -intervalSteps, scaleIntervals, globalKeyIndex, range.min, range.max));
                            });
                            src.tipis.forEach(t => tipis.push(t));
                            src.dinami.forEach(v => dinami.push(Math.max(baseVol, Math.round(v * 0.82))));
                        }

                    } else {
                        // Fallback: single average note if dependency not yet available
                        const lums = chunk.map(p => 0.299 * p.r + 0.587 * p.g + 0.114 * p.b);
                        const avgLum = lums.reduce((s, l) => s + l, 0) / (lums.length || 1);
                        const note = snapToScale(Math.round(range.min + (avgLum / 255) * (range.max - range.min)), scaleIntervals, globalKeyIndex);
                        const slots = Math.round(PIXELS_PER_MEASURE);
                        for (let i = 0; i < slots; i++) {
                            nimidi.push(note); tipis.push(4); dinami.push(baseVol);
                        }
                    }

                    processed = true;
                }

                // --- NEW LOGIC: Sensible Mode (Trilini based on Velocity) OR Relativa ---
                if (!processed && (rhythmMode === 'sensible' || rhythmMode === 'relativa')) {
                    // Raw velocity (0-127) for threshold check
                    const rawVelocities = chunk.map(p => Math.max(0, Math.min(127, Math.floor(p.b / 2))));

                    // Dynamic Volume Base
                    const volSlider = document.getElementById('img-min-volume');
                    const baseVol = volSlider ? parseInt(volSlider.value) : 40;
                    const volRange = 127 - baseVol;

                    // Boosted velocity (baseVol-127) for sounding notes
                    const boostedVelocities = chunk.map(p => Math.floor(baseVol + (p.b / 255) * volRange));

                    const slider = document.getElementById('img-silence-threshold');
                    const threshold = slider ? parseInt(slider.value) : 20;

                    // Helper for Pitch Calculation
                    const getPitch = (p, vKey, lastState) => {
                        const range = TESSITURA[vKey];
                        const brightness = (0.299 * p.r + 0.587 * p.g + 0.114 * p.b);
                        const norm = brightness / 255;

                        let finalNote;

                        if (rhythmMode === 'relativa') {
                            // Relative Logic
                            // If first note ever for this voice, use Absolute
                            if (lastState.lastPitch === null) {
                                const rawPitch = range.min + (norm * (range.max - range.min));
                                finalNote = snapToScale(Math.round(rawPitch), scaleIntervals, globalKeyIndex);
                            } else {
                                // Compare current brightness with previous brightness
                                const diff = brightness - lastState.lastLum;
                                // Determine step size?
                                // Simple: if diff > 0 -> +1 scale step, if diff < 0 -> -1 scale step
                                // Or proportional? Let's try to make it reasonably melodic.
                                // If huge jump in brightness, maybe jump in interval.
                                // Minimal implementation: Direction based.
                                // "l.indicara si subida o bajada"
                                let semitoneChange = 0;
                                if (Math.abs(diff) > 10) { // Noise threshold
                                    const direction = Math.sign(diff);
                                    // Scale magnitude: 255 diff -> maybe octave?
                                    // Let's try: 1 step per 30 units of brightness?
                                    // Or just simple scalar: 
                                    const steps = Math.ceil(Math.abs(diff) / 40);
                                    semitoneChange = direction * steps * 2; // Approximate interval
                                }

                                // To stick to scale, we should find next scale note.
                                // But snapping handles that. We just need target midi.
                                let targetMidi = lastState.lastPitch + semitoneChange;
                                // Clamp to tessitura
                                targetMidi = Math.max(range.min, Math.min(range.max, targetMidi));
                                finalNote = snapToScale(targetMidi, scaleIntervals, globalKeyIndex);
                            }

                            // Update State
                            lastState.lastPitch = finalNote;
                            lastState.lastLum = brightness;

                        } else {
                            // Sensible (Absolute) Logic
                            const rawPitch = range.min + (norm * (range.max - range.min));
                            finalNote = snapToScale(Math.round(rawPitch), scaleIntervals, globalKeyIndex);
                        }
                        return finalNote;
                    };

                    // S & T: 8 Corcheas (8th notes) - Fast movement
                    if (vKey === 's' || vKey === 't') {
                        for (let i = 0; i < PIXELS_PER_MEASURE; i++) {
                            const p = chunk[i] || { r: 0, g: 0, b: 0 };
                            const rawVel = rawVelocities[i] !== undefined ? rawVelocities[i] : 0;
                            const playVel = boostedVelocities[i] !== undefined ? boostedVelocities[i] : baseVol;

                            const finalNote = getPitch(p, vKey, voiceState[vKey]);

                            nimidi.push(finalNote);

                            if (rawVel < threshold) { // Check against raw velocity
                                tipis.push(-4); // Silent Eighth
                                dinami.push(0);
                            } else {
                                tipis.push(4);  // Sounding Eighth
                                dinami.push(playVel); // Use boosted velocity
                            }
                        }
                    }
                    // A & B: 4 Negras (Quarter notes) - Slow backing
                    else {
                        const step = 2;
                        for (let i = 0; i < 4; i++) {
                            // Average the 2 pixels for this beat
                            const idx1 = i * step;
                            const idx2 = idx1 + 1;

                            const p1 = chunk[idx1] || { r: 0, g: 0, b: 0 };
                            const p2 = chunk[idx2] || { r: 0, g: 0, b: 0 };

                            // Average props
                            const avgR = (p1.r + p2.r) / 2;
                            const avgG = (p1.g + p2.g) / 2;
                            const avgB = (p1.b + p2.b) / 2;

                            // Create a pseudo pixel for getPitch
                            const pAvg = { r: avgR, g: avgG, b: avgB };

                            const rawAvgVel = Math.max(0, Math.min(127, Math.floor(avgB / 2)));
                            const playAvgVel = Math.floor(baseVol + (avgB / 255) * volRange);

                            const finalNote = getPitch(pAvg, vKey, voiceState[vKey]);

                            nimidi.push(finalNote);

                            if (rawAvgVel < threshold) { // Check raw
                                tipis.push(-3); // Silent Quarter
                                dinami.push(0);
                            } else {
                                tipis.push(3);  // Sounding Quarter
                                dinami.push(playAvgVel); // Use boosted
                            }
                        }
                    }
                    processed = true;
                }

                // --- UNIFORME MODE (Transformado para Percusión Bombo y Caja) ---
                if (!processed && rhythmMode === 'uniforme') {
                    const percNote = (vKey === 's' || vKey === 'a') ? 38 : 36; // 38=Caja, 36=Bombo

                    const volSlider = document.getElementById('img-min-volume');
                    const baseVol = volSlider ? parseInt(volSlider.value) : 40;
                    const volRange = 127 - baseVol;

                    const lums = chunk.map(p => 0.299 * p.r + 0.587 * p.g + 0.114 * p.b);
                    const avgLum = lums.reduce((sum, l) => sum + l, 0) / (lums.length || 1);

                    const maxL = Math.max(...lums);
                    const minL = Math.min(...lums);
                    const contrast = maxL - minL;

                    if (!window.uniformeRhythmState || m === 0) {
                        window.uniformeRhythmState = {
                            s: { prevLum: null, momentum: 0, pattern: 0 },
                            a: { prevLum: null, momentum: 0, pattern: 0 },
                            t: { prevLum: null, momentum: 0, pattern: 0 },
                            b: { prevLum: null, momentum: 0, pattern: 0 }
                        };
                    }
                    const st = window.uniformeRhythmState[vKey];
                    let lumChange = 0;

                    if (st.prevLum !== null) {
                        lumChange = Math.abs(avgLum - st.prevLum);
                    }

                    // Detectar evento de transformación del ritmo estructurada
                    if (lumChange > 25 || contrast > 80) {
                        st.momentum = 2; // Mantener la variación durante este y 1 compás más
                        if (avgLum > 140 || contrast > 100) {
                            st.pattern = 2; // Patrón intenso / rock puro (alto brillo o alto contraste temporal)
                        } else {
                            st.pattern = 1; // Patrón roto / síncopa (zona media baja agitada)
                        }
                    } else if (st.momentum > 0) {
                        st.momentum--; // Agota remanente
                    } else {
                        // Vuelve a ser componente uniforme / orgánico bajo 
                        st.pattern = 0;
                    }
                    st.prevLum = avgLum;

                    for (let i = 0; i < Math.floor(PIXELS_PER_MEASURE); i++) {
                        const p = chunk[i] || { r: 0, g: 0, b: 0 };
                        const l = 0.299 * p.r + 0.587 * p.g + 0.114 * p.b;
                        // Volumen ligeramente influenciado por brillo del pixel
                        const vel = Math.floor(Math.max(baseVol, 60 + (l / 255) * 67));

                        let isSounding = false;
                        let noteVel = vel;

                        if (vKey === 't' || vKey === 'b') { // Bombo
                            if (m < numOvertureMeasures && numOvertureMeasures > 0) {
                                // Intro: Ritmo más disperso, bombo marcando solo el inicio del compás
                                if (i === 0) isSounding = true;
                                else if (i === 4 && st.pattern > 0) { isSounding = true; noteVel = Math.floor(vel * 0.7); }
                            } else if (m >= totalMeasures - numCodaMeasures && numCodaMeasures > 0) {
                                // Fin: Bombo constante y simétrico para cerrar
                                if (i === 0 || i === 4) isSounding = true;
                            } else {
                                // Centro normal
                                if (st.pattern === 0) { // Base Uniforme Motor
                                    if (i === 0 || i === 4) isSounding = true;
                                    else if (i === 2 || i === 6) { isSounding = true; noteVel = Math.floor(vel * 0.7); }
                                } else if (st.pattern === 1) { // Síncopa / Roto
                                    if (i === 0 || i === 3 || i === 5) isSounding = true;
                                    if (i === 3 || i === 5) noteVel = Math.floor(vel * 0.85);
                                } else if (st.pattern === 2) { // Intenso / Rock
                                    if (i === 0 || i === 2 || i === 4 || i === 6) isSounding = true;
                                    if (i === 7) { isSounding = true; noteVel = Math.floor(vel * 0.85); }
                                }
                            }
                        } else { // Caja (S, A)
                            if (m < numOvertureMeasures && numOvertureMeasures > 0) {
                                // Intro: caja marcando muy levemente y con menos frecuencia
                                if (i === 6) { isSounding = true; noteVel = Math.floor(vel * 0.6); }
                                else if (i === 2 && st.pattern > 0) { isSounding = true; noteVel = Math.floor(vel * 0.4); }
                            } else if (m >= totalMeasures - numCodaMeasures && numCodaMeasures > 0) {
                                // Fin: Caja en backbeat seco
                                if (i === 2 || i === 6) { isSounding = true; noteVel = Math.floor(vel * 0.8); }
                            } else {
                                // Centro normal
                                if (st.pattern === 0) { // Base Uniforme
                                    if (i === 2 || i === 6) isSounding = true;
                                    else if (i % 2 !== 0) { isSounding = true; noteVel = Math.floor(baseVol * 0.8); } // Padding continuo y uniforme
                                } else if (st.pattern === 1) { // Síncopa / Roto
                                    if (i === 2) isSounding = true;
                                    else if (i === 4 || i === 7) { isSounding = true; noteVel = Math.floor(vel * 0.6); } // Fantasmas rotos
                                } else if (st.pattern === 2) { // Intenso / Fill
                                    if (i === 2 || i === 6) { isSounding = true; noteVel = Math.floor(vel * 1.1); }
                                    else if (i % 2 !== 0 || i === 5) { isSounding = true; noteVel = Math.floor(vel * 0.7); } // Fills densos ocupando el compás
                                }
                            }
                        }

                        nimidi.push(percNote);
                        if (isSounding) {
                            tipis.push(4); // Corchea
                            dinami.push(noteVel);
                        } else {
                            tipis.push(-4); // Silencio de corchea
                            dinami.push(0);
                        }
                    }
                    processed = true;
                }

                // If not using Trilipi (or fallback happened implicitly if implemented above, but lets keep it clean)
                if (nimidi.length === 0) {
                    // Fallback Mode / End of song padding
                    // Or if chunk is smaller than PIXELS_PER_MEASURE (end of song), we behave uniformly 
                    chunk.forEach(p => {
                        const range = TESSITURA[vKey];
                        const brightness = (0.299 * p.r + 0.587 * p.g + 0.114 * p.b);
                        const norm = brightness / 255;
                        const rawPitch = range.min + (norm * (range.max - range.min));
                        const finalNote = snapToScale(Math.round(rawPitch), scaleIntervals, globalKeyIndex);
                        const vel = Math.floor(70 + (p.b / 255) * 57); // Boosted Volume (70-127)

                        nimidi.push(finalNote);
                        tipis.push(4); // Fixed Corchea
                        dinami.push(vel);
                    });

                    // Pad if incomplete measure (end of song)
                    const missing = PIXELS_PER_MEASURE - chunk.length;
                    for (let i = 0; i < missing; i++) {
                        nimidi.push(60);
                        tipis.push(-4); // Rest 8th
                        dinami.push(0);
                    }
                }

                // --- NEW LOGIC: Structural Volume/Dynamics (Fade In/Out) for ALL Modes ---
                // Se aplica a todos los modos: Un fade proporcional de inicio y fin en el volumen base
                if (nimidi.length > 0) {
                    if (m < numOvertureMeasures && numOvertureMeasures > 0) {
                        // Fade in: from 0.4 to 1.0 depending on how far into the intro we are
                        const progress = m / numOvertureMeasures;
                        const scale = 0.4 + (0.6 * progress);
                        dinami = dinami.map(v => Math.floor(v * scale));
                    } else if (m >= totalMeasures - numCodaMeasures && numCodaMeasures > 0) {
                        // Fade out: from 1.0 down to 0.1
                        const measuresIntoCoda = m - (totalMeasures - numCodaMeasures);
                        const progress = measuresIntoCoda / numCodaMeasures;
                        const scale = 1.0 - (0.9 * progress);
                        dinami = dinami.map(v => Math.floor(v * scale));
                    }
                }

                if (processed && (rhythmMode === 'sensible' || rhythmMode === 'relativa')) {
                    // --- REDUCTION LOGIC ---
                    // Combine identical adjacent notes in this measure
                    // 1. Reduce 2 x 8th (4) -> Quarter (3)
                    // 2. Reduce 2 x Quarter (3) -> Half (2)

                    // Helper to reduce array in place or create new
                    const reduceNotes = (n, t, d) => {
                        let newN = [], newT = [], newD = [];

                        // First Pass: 8th -> Quarter
                        // Only same pitch AND same duration (4) AND consecutive
                        for (let i = 0; i < n.length; i++) {
                            // Check if current and next are mergeable 8th notes (code 4)
                            // IMPORTANT: For reduction, indices i and i+1 must be in same "beat" pair?
                            // Actually, reducing any consecutive pair of 8ths into a Quarter is musically valid 
                            // as long as we start from an even position if we want to align to beats, 
                            // BUT simple concatenation reduction is fine for now.
                            // Ideally we respect half-measure boundaries, but basic reduction is: 
                            // [4,4] -> [3]. 

                            // Check if mergeable:
                            if (i < n.length - 1 &&
                                t[i] === 4 && t[i + 1] === 4 &&
                                n[i] === n[i + 1]) { // Same Pitch

                                newN.push(n[i]);
                                newT.push(3); // Become Quarter
                                newD.push(d[i]); // Keep velocity
                                i++; // Skip next because we merged it
                            }
                            // Check for mergeable silences (-4 and -4 -> -3)
                            else if (i < n.length - 1 &&
                                t[i] === -4 && t[i + 1] === -4) {

                                newN.push(n[i]);
                                newT.push(-3); // Silent Quarter
                                newD.push(0);
                                i++;
                            }
                            else {
                                newN.push(n[i]);
                                newT.push(t[i]);
                                newD.push(d[i]);
                            }
                        }

                        // Second Pass: Quarter -> Half
                        // (We need to run this on the result of pass 1)
                        let intermediateN = [], intermediateT = [], intermediateD = [];
                        for (let i = 0; i < newN.length; i++) {
                            // Check if current and next are mergeable Quarter notes (code 3)
                            if (i < newN.length - 1 &&
                                newT[i] === 3 && newT[i + 1] === 3 &&
                                newN[i] === newN[i + 1]) {

                                intermediateN.push(newN[i]);
                                intermediateT.push(2); // Become Half
                                intermediateD.push(newD[i]);
                                i++;
                            }
                            // Check for mergeable silences (-3 and -3 -> -2)
                            else if (i < newN.length - 1 &&
                                newT[i] === -3 && newT[i + 1] === -3) {

                                intermediateN.push(newN[i]);
                                intermediateT.push(-2); // Silent Half
                                intermediateD.push(0);
                                i++;
                            }
                            else {
                                intermediateN.push(newN[i]);
                                intermediateT.push(newT[i]);
                                intermediateD.push(newD[i]);
                            }
                        }

                        // Third Pass: Half -> Whole (Redonda)
                        let finalN = [], finalT = [], finalD = [];
                        for (let i = 0; i < intermediateN.length; i++) {
                            // Check mergeable Half notes (code 2)
                            if (i < intermediateN.length - 1 &&
                                intermediateT[i] === 2 && intermediateT[i + 1] === 2 &&
                                intermediateN[i] === intermediateN[i + 1]) {

                                finalN.push(intermediateN[i]);
                                finalT.push(1); // Become Whole
                                finalD.push(intermediateD[i]);
                                i++;
                            }
                            // Check for mergeable silences (-2 and -2 -> -1)
                            else if (i < intermediateN.length - 1 &&
                                intermediateT[i] === -2 && intermediateT[i + 1] === -2) {

                                finalN.push(intermediateN[i]);
                                finalT.push(-1); // Silent Whole
                                finalD.push(0);
                                i++;
                            }
                            else {
                                finalN.push(intermediateN[i]);
                                finalT.push(intermediateT[i]);
                                finalD.push(intermediateD[i]);
                            }
                        }

                        return { n: finalN, t: finalT, d: finalD };
                    };

                    const reduced = reduceNotes(nimidi, tipis, dinami);
                    nimidi = reduced.n;
                    tipis = reduced.t;
                    dinami = reduced.d;
                }

                newMeasureVoices.push({ nami: vKey, nimidi, tipis, dinami });

                if (vKey === 's') {
                    mainTrackNotes = [...nimidi];
                    mainTrackDurs = [...tipis];
                    mainTrackDyns = [...dinami];
                }

            }); // End voiceKeys loop

            finalMeasures.push({
                nimidi: mainTrackNotes,
                tipis: mainTrackDurs,
                dinami: mainTrackDyns,
                voci: newMeasureVoices
            });
        }

        if (typeof window.bdi === 'undefined') window.bdi = { bar: [] };
        if (!window.bdi.bar) window.bdi.bar = [];

        if (typeof window.bdi === 'undefined') window.bdi = { bar: [] };
        if (!window.bdi.bar) window.bdi.bar = [];

        // Insert/Merge at Cursor Position
        let startIndex = (typeof window.selectedMeasureIndex !== 'undefined' && window.selectedMeasureIndex >= 0)
            ? window.selectedMeasureIndex
            : window.bdi.bar.length;

        finalMeasures.forEach((newMeasure, i) => {
            const targetIndex = startIndex + i;

            // Scenario 1: Measure exists -> MERGE
            if (targetIndex < window.bdi.bar.length) {
                const existingMeasure = window.bdi.bar[targetIndex];

                // We need to update ONLY the voices that were generated (activeVoices)
                // newMeasure.voci contains only the active generated voices

                newMeasure.voci.forEach(newVoiceData => {
                    // Find if voice exists in existing measure
                    const existingVoiceIndex = existingMeasure.voci.findIndex(v => v.nami === newVoiceData.nami);

                    if (existingVoiceIndex !== -1) {
                        // Update existing voice
                        existingMeasure.voci[existingVoiceIndex] = newVoiceData;
                    } else {
                        // Add new voice
                        existingMeasure.voci.push(newVoiceData);
                    }
                });

                // Update main track if 's' was modified, or just keep it sync?
                // Usually main track reflects 's'. If 's' is updated, update main.
                const sVoice = newMeasure.voci.find(v => v.nami === 's');
                if (sVoice) {
                    existingMeasure.nimidi = [...sVoice.nimidi];
                    existingMeasure.tipis = [...sVoice.tipis];
                    existingMeasure.dinami = [...sVoice.dinami];
                }
            }
            // Scenario 2: Measure does not exist -> APPEND
            else {
                window.bdi.bar.push(newMeasure);
            }
        });

        // Re-index all measures
        window.bdi.bar.forEach((m, idx) => m.numi = idx);

        if (typeof window.rebuildRecordi === 'function') window.rebuildRecordi();
        if (typeof window.applyTextLayer === 'function') window.applyTextLayer();
        if (typeof window.updateDetailedJSON === 'function') window.updateDetailedJSON();

        const feedback = document.getElementById('img-feedback');
        if (feedback) feedback.textContent = `✅ Generado: ${finalMeasures.length} compases (Modo: ${rhythmMode})`;
    }

    window.initImageToMelody = initImageToMelody;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageToMelody);
    } else {
        initImageToMelody();
    }
})();
