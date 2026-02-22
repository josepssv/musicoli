# Future Improvements & Technical Debt

## Ruler Selection
- **Click Behavior (Start of Bar)**: The user reported inconsistent cursor updates when clicking directly on the selection bar (red bar) without dragging.
- **Goal**: Ensure that a simple click on the bar always updates the app's cursor and selected measure to the start of the bar. (Current implementation attempts this but might need refinement).

## Audio System Refactor
- **Replace Legacy Playback (`tuci`)**: The legacy `tuci()` function is still used in several parts of the application outside the main editor (e.g., scale previews, interval generation, `atuci` helper).
  - **Goal**: refactor these calls to use the modern `playMeasureFast()` system (or a similar wrapper around `recordi` + `updatePlayerMIDI`).
  - **Reason**: `playMeasureFast` uses the robust `html-midi-player` integration with `MidiWriter.js`, supports accurate rhythm handling (including dotted notes), and is the standard for the main editor. `tuci` is deprecated/legacy.
  - **Affected Areas**:
    - Scale/Interval previews (approx. line 5076 in `musicoli.js`)
    - `atuci` helper function (approx. line 5567 in `musicoli.js`)
    - Other scattered usages found via `findstr "tuci(" musicoli.js`

## Feature Integration

## Preferences
- **General Nomenclature Configuration**: Implement a configuration screen to select general settings, including nomenclature (e.g., Note Names: C/D/E vs Do/Re/Mi).
- **General Harmony Configuration**: Create a general configuration panel to manage global harmony settings (e.g., enable/disable smart diatonic harmony, adjust interval offsets for voices).

