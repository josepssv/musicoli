// Playback Control: Link Voice Labels to Playback Selector

(function () {
    // console.log('🎵 Initializing Playback Control...');

    // Self-healing: Create selector if it doesn't exist
    let selector = document.getElementById('playback-selector');
    if (!selector) {
        console.warn('⚠️ Playback selector not found in DOM, creating it dynamically...');
        selector = document.createElement('select');
        selector.id = 'playback-selector';
        selector.style.display = 'none';

        // Add default options (all active)
        const allOption = document.createElement('option');
        allOption.value = 's,a,t,b';
        allOption.selected = true;
        selector.appendChild(allOption);

        document.body.appendChild(selector);
        console.log('✅ Created temporary playback-selector');
    }

    const voiceLabels = {
        's': document.getElementById('voiceline-s'),
        'a': document.getElementById('voiceline-a'),
        't': document.getElementById('voiceline-t'),
        'b': document.getElementById('voiceline-b')
    };

    // Helper: Update label styles based on selector value
    function updateLabelStyles() {
        if (!selector) return;
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
        if (!selector) return;

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
        let optionExists = Array.from(selector.options).some(opt => opt.value === newValue);

        // Dynamic: Create option if it doesn't exist
        if (!optionExists) {
            const newOpt = document.createElement('option');
            newOpt.value = newValue;
            selector.appendChild(newOpt);
        }

        selector.value = newValue;
        // Dispatch change event
        const event = new Event('change');
        selector.dispatchEvent(event);
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
