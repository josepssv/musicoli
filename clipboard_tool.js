/**
 * clipboard_tool.js
 * Handles copying and pasting measures based on ruler selection.
 */

(function () {
    window.measureClipboard = [];

    function initClipboard() {
        const copyBtn = document.getElementById('copy-measures-btn');
        const pasteBtn = document.getElementById('paste-measures-btn');

        if (copyBtn) {
            copyBtn.addEventListener('click', copyMeasures);
        }
        if (pasteBtn) {
            pasteBtn.addEventListener('click', pasteMeasures);
        }

        console.log('📋 Clipboard Tool initialized');
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
            console.warn('📋 Nada seleccionado para copiar');
            return;
        }

        // Clamp to real measures
        const realTotal = window.bdi.bar.length;
        const validStart = Math.max(0, startIdx);
        const validEnd = Math.min(endIdx, realTotal - 1);

        if (validStart >= realTotal) {
            console.warn('📋 La selección está fuera de los compases reales');
            return;
        }

        const measuresToCopy = window.bdi.bar.slice(validStart, validEnd + 1);

        // Deep copy to avoid reference issues
        window.measureClipboard = JSON.parse(JSON.stringify(measuresToCopy));

        console.log(`📋 Copiados ${window.measureClipboard.length} compases (${validStart + 1} - ${validEnd + 1})`);

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

        console.log(`📋 Pegando ${window.measureClipboard.length} compases en el índice ${insertionIdx}`);

        // Save state for undo
        if (typeof window.saveBdiState === 'function') {
            window.saveBdiState();
        }

        // Create new copies for insertion
        const measuresToPaste = JSON.parse(JSON.stringify(window.measureClipboard));

        // Insert into bar
        window.bdi.bar.splice(insertionIdx, 0, ...measuresToPaste);

        // Update measure numbers (numi)
        window.bdi.bar.forEach((m, idx) => {
            m.numi = idx;
        });

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

        // Select the pasted range
        if (window.selectionRange) {
            window.selectionRange.start = insertionIdx;
            window.selectionRange.end = insertionIdx + measuresToPaste.length - 1;
            // Update app cursor to start of paste
            window.selectedMeasureIndex = insertionIdx;
            if (window.np6) window.np6.cursorPos = insertionIdx;
        }

        console.log(`✅ Pegado completado. Nuevo total: ${window.bdi.bar.length} compases.`);

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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initClipboard);
    } else {
        initClipboard();
    }
})();
