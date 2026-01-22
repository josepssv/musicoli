// Playback Control: Link Voice Labels to Playback Selector

(function () {
    // console.log('🎵 Initializing Playback Control...');

    const selector = document.getElementById('playback-selector');
    const voiceLabels = {
        's': document.getElementById('voiceline-s'),
        'a': document.getElementById('voiceline-a'),
        't': document.getElementById('voiceline-t'),
        'b': document.getElementById('voiceline-b')
    };

    if (!selector) {
        // console.warn('⚠️ Playback selector not found!');
        return;
    }

    // Helper: Update label styles based on selector value
    function updateLabelStyles() {
        const selectedValue = selector.value;
        const activeVoices = selectedValue.split(',');

        // console.log('🎛️ Playback active voices:', activeVoices);

        Object.keys(voiceLabels).forEach(key => {
            const label = voiceLabels[key];
            if (!label) return;

            // Apply cursor pointer
            label.style.cursor = 'pointer';
            label.style.userSelect = 'none'; // Prevent text selection on quick clicks

            // Identify active state
            if (activeVoices.includes(key)) {
                label.style.textDecoration = 'underline';
                label.style.textDecorationThickness = '2px';
                label.style.textDecorationColor = '#4CAF50'; // Green underline for active
                label.style.color = '#000';
            } else {
                label.style.textDecoration = 'none';
                label.style.color = '#888'; // Grey out inactive
            }
        });
    }

    // Helper: Toggle a voice
    function toggleVoice(voiceKey) {
        let currentVoices = selector.value.split(',').filter(v => v); // Remove empty strings

        if (currentVoices.includes(voiceKey)) {
            // Remove
            currentVoices = currentVoices.filter(v => v !== voiceKey);
        } else {
            // Add
            currentVoices.push(voiceKey);
        }

        // Sort to match selector options (s, a, t, b order)
        const order = ['s', 'a', 't', 'b'];
        currentVoices.sort((a, b) => order.indexOf(a) - order.indexOf(b));

        const newValue = currentVoices.join(',');

        // Check if this combination exists in selector
        const optionExists = Array.from(selector.options).some(opt => opt.value === newValue);

        if (optionExists || newValue === '') {
            // If empty, maybe we should just not change or allow empty? 
            // Selector options don't have empty usually, but let's try.
            // If no option matches, we can't set it directly unless we add dynamic options, 
            // but user said "select already has all combinations".
            if (newValue === '') {
                console.log('⚠️ No voices selected. Resetting to default or keeping previous?');
                // Let's allow empty if logic permits, or just warn.
            }

            selector.value = newValue;
            // Dispatch change event
            const event = new Event('change');
            selector.dispatchEvent(event);
        } else {
            console.warn(`⚠️ Combination "${newValue}" not found in selector options.`);
        }
    }

    // Attach Listeners
    selector.addEventListener('change', updateLabelStyles);

    Object.keys(voiceLabels).forEach(key => {
        const label = voiceLabels[key];
        if (label) {
            label.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                // console.log(`🖱️ Clicked voice label: ${key}`);
                toggleVoice(key);
            };
            // Initial style setup
            label.title = "Click to toggle playback for this voice";
        }
    });

    // Initial run
    updateLabelStyles();

    // console.log('✅ Playback Control initialized.');
})();
