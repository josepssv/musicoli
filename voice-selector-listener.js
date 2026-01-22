// Voice selector change listener to update track matrix highlighting
(function () {
    const voiceSelector = document.getElementById('voice-selector');
    if (voiceSelector) {
        voiceSelector.addEventListener('change', function () {
            console.log('🔄 Voice selector changed to:', this.value);

            // Update the visual tracks to reflect the new selected voice
            if (typeof renderVisualTracks === 'function') {
                renderVisualTracks();
            }

            // Update Notepad coloring to reflect the new voice's MIDI notes
            if (typeof applyNotepadColoring === 'function') {
                applyNotepadColoring();
                console.log('🎨 Applied Notepad coloring for voice:', this.value);
            }

            // Update voiceline display
            const voiceline = document.getElementById('voiceline');
            if (voiceline) {
                const voiceNames = {
                    's': 'Soprano',
                    'a': 'Contralto',
                    't': 'Tenor',
                    'b': 'Bajo'
                };
                voiceline.textContent = voiceNames[this.value] || this.value;
            }
        });
        console.log('✅ Voice selector change listener attached');
    } else {
        console.warn('⚠️ Voice selector not found');
    }
})();
