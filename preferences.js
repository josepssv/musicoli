/**
 * preferences.js — Musicoli Preferences Module
 * Manages persistent user settings via localStorage.
 * Exposes window.appPrefs globally.
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'musicoli_prefs';

    const DEFAULTS = {
        // 'english' = C/D/E/F notation, 'latin' = Do/Re/Mi/Fa notation
        nomenclature: 'english',
        // UI language: 'es' = Español, 'en' = English
        language: 'en',
        // Enable smart diatonic harmony auto-fill
        smartDiatonic: true,
        // Whether the user has seen the welcome screen at least once
        welcomed: false,
        // Default BPM
        bpm: 100,
        // Default Time Signature
        timeSignature: '[4,4]',
        // Default Key Root
        keyRoot: 'C',
        // Default Scale Mode
        scaleMode: 'Major'
    };

    const AppPreferences = {
        /** Current values (merged defaults + saved) */
        values: Object.assign({}, DEFAULTS),

        /** Load from localStorage. Returns true if prefs already existed. */
        load() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const saved = JSON.parse(raw);
                    this.values = Object.assign({}, DEFAULTS, saved);
                    return true;
                }
            } catch (e) {
                console.warn('[Prefs] Could not load preferences:', e);
            }
            this.values = Object.assign({}, DEFAULTS);
            return false;
        },

        /** Save current values to localStorage. */
        save() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.values));
            } catch (e) {
                console.warn('[Prefs] Could not save preferences:', e);
            }
        },

        /** Get a single preference value. */
        get(key) {
            return this.values[key] !== undefined ? this.values[key] : DEFAULTS[key];
        },

        /** Set a single preference value (does NOT auto-save; call save() separately). */
        set(key, val) {
            this.values[key] = val;
        },

        /** Apply current preferences to the running app. */
        apply() {
            // --- Language ---
            const currentLang = this.get('language');
            if (typeof setLanguage === 'function') {
                setLanguage(currentLang);
            } else {
                // Fallback for global context if setLanguage not available yet
                if (typeof currentLanguage !== 'undefined') {
                    window.currentLanguage = currentLang;
                }
            }

            // --- Nomenclature: update scale-root selector options ---
            this._applyNomenclature();

            // --- BPM ---
            this._applyBPM();

            // --- Time Signature ---
            this._applyTimeSignature();

            // --- Key Root ---
            this._applyKeyRoot();

            // --- Scale Mode ---
            this._applyScaleMode();
        },

        _applyNomenclature() {
            const useLatin = this.get('nomenclature') === 'latin';
            const english = (typeof keyin !== 'undefined') ? keyin
                : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const latin = (typeof tonicain !== 'undefined') ? tonicain
                : ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si', 'Si#'];
            const names = useLatin ? latin : english;

            const updateSelector = (id) => {
                const el = document.getElementById(id);
                if (!el) return;
                const currentVal = el.value;
                el.innerHTML = '';
                names.forEach((name, i) => {
                    const opt = document.createElement('option');
                    opt.value = english[i] || name;
                    opt.textContent = name;
                    if (opt.value === currentVal) opt.selected = true;
                    el.appendChild(opt);
                });
            };

            updateSelector('scale-root');
            updateSelector('pref-key');
        },

        _applyBPM() {
            const bpmValue = this.get('bpm');
            const input = document.getElementById('bpm-custom-input');
            if (input) {
                input.value = bpmValue;
                // Trigger change to update internal variables if musicoli.js is already loaded
                input.dispatchEvent(new Event('change'));
            } else {
                // If musicoli.js hasn't loaded yet, we can at least set the global variables if they exist
                if (typeof window.bpmValue !== 'undefined') window.bpmValue = bpmValue;
                if (typeof window.tempi !== 'undefined') window.tempi = bpmValue;
                if (window.bdi && window.bdi.metadata) window.bdi.metadata.bpm = bpmValue;
            }
        },

        _applyTimeSignature() {
            const tsValue = this.get('timeSignature');
            const selector = document.getElementById('compas-select');
            if (selector) {
                selector.value = tsValue;
                selector.dispatchEvent(new Event('change'));
            } else {
                if (typeof window.compi !== 'undefined') {
                    try { window.compi = JSON.parse(tsValue); } catch (e) { }
                }
                if (window.bdi && window.bdi.metadata) {
                    try { window.bdi.metadata.timeSignature = JSON.parse(tsValue); } catch (e) { }
                }
            }
        },

        _applyKeyRoot() {
            const val = this.get('keyRoot');
            const selector = document.getElementById('scale-root');
            if (selector) {
                selector.value = val;
                selector.dispatchEvent(new Event('change'));
            }
        },

        _applyScaleMode() {
            const val = this.get('scaleMode');
            const selector = document.getElementById('scale-mode');
            if (selector) {
                selector.value = val;
                selector.dispatchEvent(new Event('change'));
            }
        }
    };

    // Load immediately on script parse
    AppPreferences.load();

    // Expose globally
    window.appPrefs = AppPreferences;

})();
