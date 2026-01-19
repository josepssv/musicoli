// Function to update individual track volume
window.updateTrackVolume = function (voiceKey, value) {
    if (!window.bdi.metadata) window.bdi.metadata = { voices: {} };
    if (!window.bdi.metadata.voices) window.bdi.metadata.voices = {};
    if (!window.bdi.metadata.voices[voiceKey]) {
        window.bdi.metadata.voices[voiceKey] = { instrument: 1, percussion: false, volume: 100 };
    }

    window.bdi.metadata.voices[voiceKey].volume = parseInt(value);
    console.log(`🔊 Track ${voiceKey} volume set to ${value}`);

    // Rebuild only if we have measures to render
    if (window.bdi.bar && window.bdi.bar.length > 0) {
        if (typeof rebuildRecordi === 'function') {
            rebuildRecordi();
        } else if (typeof updateAfterBdiChange === 'function') {
            updateAfterBdiChange();
        }
    }
};
