// Voice selector change listener to update track matrix highlighting
(function () {
    const voiceSelector = document.getElementById('voice-selector');
    if (voiceSelector) {
        voiceSelector.addEventListener('change', function () {
            console.log('🔄 Voice selector changed to:', this.value);

            // Update the track matrix to reflect the new selected voice
            if (typeof renderTrackMatrix === 'function') {
                renderTrackMatrix();
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
