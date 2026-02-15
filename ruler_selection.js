/**
 * ruler_selection.js
 * Handles the logic for the global timeline/ruler bar below header2.
 * Allows selecting a range of measures (compases en grupo).
 * 
 * UPDATE: Uses absolute pixel positioning matching the track layout.
 * Synchronizes with horizontal scrolling of #tracks-scroll-viewport.
 */

(function () {
    // State
    window.selectionRange = { start: 0, end: 0 };

    // Widths Cache
    window.measureWidths = [];
    window.measureOffsets = [];
    window.totalSongWidth = 0;
    const DEFAULT_MEASURE_WIDTH = 40; // User requested module width

    // DOM Elements
    let rulerContainer, interactiveArea, indicator, leftHandle, rightHandle;
    let scrollViewport;

    let isDragging = false;
    let dragMode = null;
    let dragStartMeasure = -1;
    let initialRange = { start: -1, end: -1 };

    function initRuler() {
        rulerContainer = document.getElementById('transport-ruler');
        interactiveArea = document.getElementById('ruler-interactive-area');
        indicator = document.getElementById('selection-range-indicator');
        leftHandle = document.getElementById('selection-handle-left');
        rightHandle = document.getElementById('selection-handle-right');

        // Find the scroll viewport to sync with
        scrollViewport = document.getElementById('tracks-scroll-viewport');

        if (!interactiveArea || !scrollViewport) {
            console.warn('Ruler elements not found, retrying...');
            setTimeout(initRuler, 1000);
            return;
        }

        // Attach Event Listeners
        interactiveArea.addEventListener('mousedown', handleMouseDown);
        indicator.addEventListener('dragstart', (e) => e.preventDefault());

        // SYNC SCROLL: Listen to track scrolling
        scrollViewport.addEventListener('scroll', handleScrollSync);

        // Listen for clicks on the scroll viewport (black empty space)
        scrollViewport.addEventListener('mousedown', handleViewportClick);

        console.log('📏 Ruler Selection initialized (Pixel Sync Mode)');
        updateVisuals();
    }

    function handleViewportClick(e) {
        // Only handle direct clicks on viewport or container, not on measures/notes
        // But the viewport contains everything. We need to check if the click is BEYOND the totalSongWidth.

        recalculateMetrics();
        const total = getTotalMeasures();
        // Allow total=0 case for clicks on empty area

        // Calculate click X in "song pixels"
        const rect = scrollViewport.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const songPixel = relativeX + scrollViewport.scrollLeft;

        // Tolerance or check if it's strictly > totalSongWidth
        // Or check if the Y position is valid? Assuming the user clicks anywhere in the "black bar".

        if (songPixel > window.totalSongWidth) {
            console.log('Click in empty space -> Moving selection to END (insertion point)');
            const insertionIdx = total;
            window.selectionRange.start = insertionIdx;
            window.selectionRange.end = insertionIdx;
            updateVisuals();
            syncAppCursorToRuler(true);
        }
    }

    function handleScrollSync() {
        if (!interactiveArea || !scrollViewport) return;
        // Shift the interactive area content to match scroll
        // We use transform on the area itself or inner content?
        // The interactiveArea is the "viewport" of the ruler.
        // We need an inner wrapper or move the background/indicator relative.
        // Easiest: The indicator has absolute position. 
        // We effectively need the "0px" of the ruler to be at "0px - scrollLeft" relative to the container.

        const scrollLeft = scrollViewport.scrollLeft;
        interactiveArea.style.backgroundPosition = `-${scrollLeft}px 0`; // If we had a grid

        // Move the "origin" of our coordinate system
        // We'll apply a transform to the indicator's parent or the indicator itself?
        // Actually, if we just set the Left of the indicator to (StartPx - ScrollLeft), it works.
        updateVisuals();
    }

    function getTotalMeasures() {
        if (window.bdi && window.bdi.bar) return window.bdi.bar.length;
        return 0;
    }

    function recalculateMetrics() {
        const total = getTotalMeasures();
        window.measureWidths = [];
        window.measureOffsets = [];
        window.totalSongWidth = 0;

        let currentOffset = 0;
        for (let i = 0; i < total; i++) {
            let width = 40;
            if (typeof window.getRequiredMeasureWidth === 'function') {
                width = window.getRequiredMeasureWidth(i);
            }
            window.measureWidths.push(width);
            window.measureOffsets.push(currentOffset);
            currentOffset += width;
        }
        window.totalSongWidth = currentOffset;
    }

    // Helper to get pixel range for ANY measure (existing or virtual)
    function getMeasurePixelRange(index) {
        const total = getTotalMeasures();
        if (index < 0) index = 0;

        if (index < total) {
            // Existing measure
            return {
                start: window.measureOffsets[index],
                end: window.measureOffsets[index] + window.measureWidths[index],
                width: window.measureWidths[index]
            };
        } else {
            // Virtual measure
            const extra = index - total;
            const start = window.totalSongWidth + (extra * DEFAULT_MEASURE_WIDTH);
            return {
                start: start,
                end: start + DEFAULT_MEASURE_WIDTH,
                width: DEFAULT_MEASURE_WIDTH
            };
        }
    }

    // Convert Screen X (clicked on ruler) to Measure Index (accounting for scroll)
    function getMeasureFromX(clientX) {
        const rect = interactiveArea.getBoundingClientRect();
        // Relative X within the visible ruler area
        const relativeVisualX = clientX - rect.left;

        // Add Scroll Offset to get "Song Pixel"
        const scrollLeft = scrollViewport ? scrollViewport.scrollLeft : 0;
        const songPixel = relativeVisualX + scrollLeft;

        // 1. Check existing measures
        const total = getTotalMeasures();
        for (let i = 0; i < total; i++) {
            const start = window.measureOffsets[i];
            const end = start + window.measureWidths[i];

            if (songPixel >= start && songPixel < end) {
                return i;
            }
        }

        // 2. Check virtual measures (beyond end)
        if (songPixel >= window.totalSongWidth) {
            const extraPixels = songPixel - window.totalSongWidth;
            const extraIndex = Math.floor(extraPixels / DEFAULT_MEASURE_WIDTH);
            return total + extraIndex;
        }

        return 0; // Fallback
    }

    function handleMouseDown(e) {
        recalculateMetrics();
        // Removed check: if (total === 0) return; -> We allow interaction on empty score

        isDragging = true;
        const target = e.target;
        const clickedMeasure = getMeasureFromX(e.clientX);

        if (target === leftHandle) {
            dragMode = 'resize-left';
            initialRange = { ...window.selectionRange };
        } else if (target === rightHandle) {
            dragMode = 'resize-right';
            initialRange = { ...window.selectionRange };
        } else if (target === indicator || target.closest('#selection-range-indicator')) {
            dragMode = 'move';
            dragStartMeasure = clickedMeasure;
            initialRange = { ...window.selectionRange };
            syncAppCursorToRuler(); // Sync immediately on click
        } else {
            dragMode = 'create';
            dragStartMeasure = clickedMeasure;

            // Fix: If clicking in virtual space (create mode), should we snap start to end?
            // "si está fuera al cursor del notepad lo arrastrará al final"
            // So on initial click, if clickedMeasure >= total, we should sync to total-1.

            const total = getTotalMeasures();
            const safeIdx = (total >= 0 && clickedMeasure >= total) ? total : clickedMeasure;
            const finalIdx = (safeIdx < 0) ? 0 : safeIdx;

            setSelection(finalIdx, finalIdx);

            // Force sync even if redundant to update UI
            syncAppCursorToRuler(true);
        }

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    function handleMouseMove(e) {
        if (!isDragging) return;
        const currentMeasure = getMeasureFromX(e.clientX);
        const total = getTotalMeasures();

        if (dragMode === 'create') {
            const start = Math.min(dragStartMeasure, currentMeasure);
            const end = Math.max(dragStartMeasure, currentMeasure);

            // Limit CREATE: Cannot go beyond total unless specifically dragging right to extend? 
            // The prompt says: "no debe poder moverse más allá... nada mas que por módulos arrastrados por el sensor del final"
            // This implies the 'main' movement should be clamped, but extending (right handle) is allowed.
            // Let's Clamp CREATE to total-1, unless we decide create IS an extension.
            // If dragging past end, we interpret it as wanting to select past end. 
            // BUT: "nada mas que por módulos arrastrados por el sensor del final de la barra roja" implies only the right handle extends.

            // So, for CREATE (initial drag), clamp to existing measures? 
            // Or maybe allow if constructing new? 
            // "Sensor del final" likely refers to the Right Handle.
            // So 'create' (click and drag on empty space) should probably be clamped if it starts inside?
            // If it starts outside, it's already outside. 

            // Logic: Clamp End to Total-1 if we are not explicitly resizing the right handle?
            // "Sensor del final" = Right Handle.
            // So Move/Create should be clamped. Resize-Right is the only one allowed to go beyond.

            const clampedEnd = (end > total) ? total : end;
            const clampedStart = (start > total) ? total : start;

            // Allow selecting up to 'total' (insertion point)
            const maxIdx = total;

            setSelection(Math.min(clampedStart, maxIdx), Math.min(clampedEnd, maxIdx));

        } else if (dragMode === 'resize-left') {
            let newStart = currentMeasure;
            if (newStart > window.selectionRange.end) newStart = window.selectionRange.end;
            // Left handle doesn't extend end, so just clamp start to 0
            setSelection(newStart, window.selectionRange.end);
            syncAppCursorToRuler();

        } else if (dragMode === 'resize-right') {
            // THIS is the "sensor del final". It IS allowed to extend.
            let newEnd = currentMeasure;

            // Ensure we don't cross start
            if (newEnd < window.selectionRange.start) newEnd = window.selectionRange.start;

            // No clamping here -> Allows expansion
            setSelection(window.selectionRange.start, newEnd);

        } else if (dragMode === 'move') {
            // Move entire block: Should NOT extend beyond song end?
            // "no debe poder moverse más allá... nada mas que por módulos arrastrados por el sensor del final"
            // So dragging the whole bar (move) should also be clamped to existing measures.

            const span = initialRange.end - initialRange.start;
            const diff = currentMeasure - dragStartMeasure;
            let newStart = initialRange.start + diff;
            let newEnd = newStart + span;

            // Clamp both to valid range (allowing insertion point at 'total')
            const maxIdx = total;

            if (newStart < 0) {
                newStart = 0;
                newEnd = span;
            }

            if (newEnd > maxIdx) {
                newEnd = maxIdx;
                newStart = newEnd - span;
                if (newStart < 0) newStart = 0;
            }

            setSelection(newStart, newEnd);
            syncAppCursorToRuler(); // Sync moving block
        }
    }

    function handleMouseUp() {
        isDragging = false;
        dragMode = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        // Sync back to app (optional)
        if (window.selectionRange.start === window.selectionRange.end) {
            // If single measure selection, update global cursor?
            if (typeof jumpToMeasure === 'function') {
                // jumpToMeasure(window.selectionRange.start); // Optional integration
            }
        }
    }

    function syncAppCursorToRuler(forceUpdate = false) {
        const start = window.selectionRange.start;
        const total = getTotalMeasures();
        // Allow total=0 case

        let targetIdx = start;

        // IMPORTANT: We need to allow targetIdx to be == total for "Assertion/End" mode.
        // Previous logic: if (targetIdx >= total) targetIdx = total - 1;
        // New logic: Allow targetIdx == total (Virtual Insertion Point)
        // But not crazy big.
        if (targetIdx > total) targetIdx = total; // Clamp to just after last
        if (targetIdx < 0) targetIdx = 0;

        if (forceUpdate || window.selectedMeasureIndex !== targetIdx) {
            window.selectedMeasureIndex = targetIdx;

            // Update Notepad cursor
            // Try global np6 (Notepad instance) or fallback
            if (window.np6) {
                window.np6.cursorPos = targetIdx;
                /* If np6 has a draw method, we might want to call it to update cursor visual immediately
                   but usually the update loop handles it or highlightMeasure does */
            }

            // Trigger global highlights
            if (typeof window.highlightMeasure === 'function') {
                window.highlightMeasure(targetIdx);
            }

            // Optional: Update status text if it exists
            const measurePosDisplay = document.getElementById('measurePos');
            if (measurePosDisplay) measurePosDisplay.textContent = targetIdx + 1;
        }
    }

    function setSelection(start, end) {
        // Allow selection beyond total
        start = Math.max(0, start);
        // Removed: end = Math.min(total - 1, end); 
        // We now allow 'end' to be anything >= 0
        end = Math.max(0, end);
        if (start > end) { const t = start; start = end; end = t; }

        window.selectionRange.start = start;
        window.selectionRange.end = end;

        updateVisuals();
    }

    window.clearRulerSelection = function () {
        window.selectionRange.start = -1;
        window.selectionRange.end = -1;
        updateVisuals();
    }

    window.updateRulerVisuals = function () {
        recalculateMetrics();
        updateVisuals();
    }

    function updateVisuals() {
        if (!indicator || !interactiveArea) return;

        const total = getTotalMeasures();
        // Just check lengths to avoid errors
        if (window.measureOffsets.length !== total) recalculateMetrics();

        // Check if we have a valid selection
        const startIdx = window.selectionRange.start;
        const endIdx = window.selectionRange.end;

        if (startIdx === -1) {
            indicator.style.display = 'none';
            return;
        }

        indicator.style.display = 'block';

        // Calculate Absolute Pixels
        const startRange = getMeasurePixelRange(startIdx);
        const endRange = getMeasurePixelRange(endIdx);

        const startPx = startRange.start;
        const endPx = endRange.end; // End of the end index
        const widthPx = endPx - startPx;

        // Adjust for Scroll
        const scrollLeft = scrollViewport ? scrollViewport.scrollLeft : 0;
        const visibleLeft = startPx - scrollLeft;

        // Apply Styles
        indicator.style.left = visibleLeft + 'px';
        indicator.style.width = widthPx + 'px';
    }

    // Init Logic
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRuler);
    } else {
        initRuler();
    }

    // Watch Loop
    let lastTotalCount = -1;
    let lastTotalWidth = -1;
    let lastSelectedIndex = -1;

    setInterval(() => {
        const currentCount = getTotalMeasures();
        recalculateMetrics();
        const currentWidth = window.totalSongWidth;

        // Sync with Editor Cursor (unless dragging)
        if (!isDragging && typeof window.selectedMeasureIndex !== 'undefined') {
            const currentIdx = window.selectedMeasureIndex;
            if (currentIdx !== lastSelectedIndex && currentIdx !== -1) {
                lastSelectedIndex = currentIdx;
                // Force sync to single measure
                window.selectionRange.start = currentIdx;
                window.selectionRange.end = currentIdx;
                updateVisuals();
            }
        }

        if (currentCount !== lastTotalCount || Math.abs(currentWidth - lastTotalWidth) > 1) {
            lastTotalCount = currentCount;
            lastTotalWidth = currentWidth;
            updateVisuals();
        }
    }, 200);

})();
