// Initialize voice edit mode if not already set (global variable, no window.)
if (typeof voiceEditMode === 'undefined') {
    voiceEditMode = 'dependent';
}

// Mode Toggle Button Event Listener (Circular button)
const htmlModeToggle = document.getElementById('html-mode-toggle');
if (htmlModeToggle) {
    // Function to update button appearance based on current mode
    const updateButtonAppearance = () => {
        const modeIcon = document.getElementById('html-mode-icon');
        if (voiceEditMode === 'independent') {
            htmlModeToggle.style.backgroundColor = '#FF9800'; // Orange for independent
            if (modeIcon) modeIcon.textContent = '🔓'; // Unlocked
            htmlModeToggle.title = 'Modo: Independiente (solo voz seleccionada)\nClick para cambiar a Dependiente';
        } else {
            htmlModeToggle.style.backgroundColor = '#4CAF50'; // Green for dependent
            if (modeIcon) modeIcon.textContent = '🔗'; // Linked/locked
            htmlModeToggle.title = 'Modo: Dependiente (armonía automática)\nClick para cambiar a Independiente';
        }
    };

    // Set initial appearance
    updateButtonAppearance();

    // Add click handler
    htmlModeToggle.addEventListener('click', () => {
        // Toggle mode (using global variable, same as existing code)
        if (voiceEditMode === 'dependent') {
            voiceEditMode = 'independent';
            console.log('📝 Modo de edición cambiado a: INDEPENDIENTE');
            console.log('   → Cada pista se edita por separado');
        } else {
            voiceEditMode = 'dependent';
            console.log('📝 Modo de edición cambiado a: DEPENDIENTE');
            console.log('   → Las armonías se generan automáticamente');
        }

        // Update button appearance
        updateButtonAppearance();

        console.log('✅ Mode changed to:', voiceEditMode);
    });
}
