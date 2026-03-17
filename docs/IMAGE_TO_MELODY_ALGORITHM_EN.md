# Image to Melody Algorithm

This document describes the logic used in the "Image to Melody" function to transform visual images into polyphonic musical compositions.

## 1. Fundamental Concept: The Time Strip

The algorithm treats any loaded image not as a static picture, but as a **visual score** read from left to right.

*   **X-Axis (Horizontal):** Represents **Time**.
*   The image is resized horizontally based on the control slider (20px to 1000px).
*   Each pixel in width is equivalent to an **eighth note** (1/8 note).
*   8 pixels form a complete **4/4 measure**.
*   Example: `1000px` width ≈ `125 measures` ≈ `4 minutes` of music (at 120 BPM).

*   **Y-Axis (Vertical):** Represents **Voices**.
*   The image is always forced to a height of **exactly 4 pixels**.
*   Each row of pixels corresponds to a specific voice of the SATB quartet.

## 2. Voice Mapping (Polyphony)

The image is processed as 4 simultaneous parallel tracks:

| Row (Y) | Voice | Tessitura Range (MIDI) | Description |
| :--- | :--- | :--- | :--- |
| **0** (Top) | **Soprano (S)** | **60 - 84** (C4 - C6) | Main melody / Highs |
| **1** | **Alto (A)** | **53 - 74** (F3 - D5) | Mid-high harmony |
| **2** | **Tenor (T)** | **48 - 69** (C3 - A4) | Mid-low harmony |
| **3** (Bottom)| **Bass (B)** | **40 - 62** (E2 - D4) | Harmonic foundation / Lows |

## 3. Color Decoding (RGB)

Each pixel is analyzed to determine the characteristics of the musical note generated at that moment in time for that specific voice.

### A. Pitch
The **Luminosity** (brightness) of the pixel determines how high or low the note is *within the range of that voice*.

*   **Luminosity Formula:** `L = 0.299*R + 0.587*G + 0.114*B`
*   **Dark Pixel (Black):** Lowest note in the voice range.
*   **Bright Pixel (White):** Highest note in the voice range.
*   **Tonal Adjustment:** The resulting note is automatically "snapped" to the **Scale** and **Key** selected globally in the application (e.g., C Major, D Minor, etc.), ensuring the melody always sounds "musical" and coherent.

### B. Dynamics (Velocity)
The **Blue** channel is used to determine the intensity or volume of the note.

*   **Low Blue:** Soft dynamics (*piano*), ~40 velocity.
*   **High Blue:** Loud dynamics (*forte*), ~127 velocity.
*   This allows creating accents and intensity variations simply by manipulating the color of the image.

## 4. Rhythmic Structure

### A. Uniform Mode (Transformed to Percussion B/C)
*   **Logic:** Generates a background rhythmic base for drums, assigning Kick (note 36 to Tenor/Bass) and Snare (note 38 to Soprano/Alto).
*   **Pattern Memory (Momentum):** Based on sharp luminosity changes or areas of very high contrast in the image, the system abandons the base rhythm and intelligently "jumps" to complex rhythmic variations that last for a few measures.
    *   *Motor Base:* Constant rhythm (quarter note kick, backbeat snare + eighth note padding). Applies when the image is flat and without ups and downs.
    *   *Broken/Syncopated Pattern:* Organic and mid-range changes trigger Funk/Reggae style syncopation, abandoning the padding.
    *   *Intense/Fill Pattern:* Extreme brightness or contrast triggers energetic sequences dense with disco/rock-style fills.
*   **Proportional Structure:** Incorporates drum ramps (fade in / out) and the rhythm varies progressively from *very sparse* in the intro to *solid and steady* at the final exit.

### B. Dynamic Mode (Based on Brightness)
*   **Block Analysis:** The image is processed in blocks of 8 pixels (equivalent to one measure).
*   **Average Luminosity:** The average brightness of the block is calculated.
*   **Threshold:** If the block is **dark** (< 100 luminosity), complex rhythmic generation is activated.
    *   **Weighted Selection:** A rhythmic pattern is chosen from the `trilipi` library (Metrica.js).
    *   **Dark (Low Lum):** Simple patterns, fewer notes.
    *   **Light (High Lum):** Dense patterns, more notes.
*   If the block is **bright**, the uniform eighth note rhythm is maintained.

### C. Sensitive Mode (Recommended)
*   **Intelligent Logic:** Combines threshold-based silence detection with note reduction to generate more musical phrasing.
*   **Voice Differentiation:**
    *   **Soprano (S) and Tenor (T):** Move in **Eighth notes** (8 notes per measure) for agility.
    *   **Alto (A) and Bass (B):** Move in **Quarter notes** (4 notes per measure) for stable harmonic support.
*   **Advanced Controls:**
    *   **Silence Threshold:** Defines how dark a part of the image must be for it not to sound (0-100).
    *   **Minimum Volume:** Sets the base dynamics of audible notes, preventing them from sounding too weak.
*   **Note Reduction (Post-Process):** Applies a 3-pass algorithm to simplify the score:
    1.  **2 equal Eighth notes** → 1 Quarter note.
    2.  **2 equal Quarter notes** → 1 Half note.
    3.  **2 equal Half notes** → 1 Whole note.

### D. Complete Mode (Dynamic + Rests/Fill)
*   Extends dynamic mode with extreme behaviors for high contrast:
    *   **Black (< 50 Lum):** Generates a **Whole Rest** (empty measure).
    *   **White (> 230 Lum):** Generates a **Whole Note** (long sustained note for the entire measure).
    *   **Mid Tones:** Applies Dynamic Mode logic (trilipi or uniform).

### E. Relative Mode (New)
*   **Rhythmic Base:** Uses exactly the same intelligent metrics as **Sensitive Mode** (S/T in eighths, A/B in quarters, note reduction).
*   **Melodic Logic:**
    *   Instead of assigning an absolute note based on pixel color, it calculates the note based on the **change** in color relative to the previous one.
    *   **Lighter than the previous:** The melody goes up.
    *   **Darker than the previous:** The melody goes down.
*   **Continuity:** Maintains "memory" of the last note played by each voice across measures, generating more connected and fluid melodic lines.

### F. Arpeggio Mode (New)
*   **Concept:** Instead of processing each pixel individually, it analyzes the **whole measure** to find the two luminosity extremes and build a musical scale between them.
*   **Logic:**
    1.  **Dark Extreme:** The lowest luminosity pixel in the block → **lowest** note within the voice range.
    2.  **Light Extreme:** The highest luminosity pixel → **highest** note within the range.
    3.  **Scale (Arpeggio):** All notes from the selected scale that falling between the low and high notes are collected, forming an ascending diatonic scale.
    4.  **Alternation:** Even measures go up (low→high), odd measures go down (high→low), creating a continuous wave effect.
    5.  **Cycle:** The scale repeats in a cycle to cover the 8 beats (eighth notes) of the measure. If the scale is longer, it's truncated to 8 notes.
*   **Rejected Mid-Values:** Pixels of mid-luminosity (neither the darkest nor the brightest in the block) are discarded as note generators, but their average brightness controls the **dynamics (velocity)** of the entire scale for that measure.
    *   Dark Mid-Tones → Soft arpeggio (piano).
    *   Light Mid-Tones → Loud arpeggio (forte).

## Workflow Summary

1.  **Image Upload:** The user uploads any image file.
2.  **Resizing:**
    *   `Height` -> forced to 4px.
    *   `Width` -> user-defined (Slider).
3.  **Scanning:** The image is read column by column (moment by moment).
4.  **Generation:**
    *   For each column `x`, 4 vertical pixels are read.
    *   4 simultaneous notes (chord) are calculated based on luminosity and tessitura.
    *   Musical scale restrictions are applied.
5.  **Writing:** Notes are written directly to the `s`, `a`, `t`, `b` tracks of the score engine (BDI).
