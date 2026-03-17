# Humming (Tarareo): Quick Start User Guide

## What is Humming?

**Humming** (Tarareo) automatically converts your words into musical rhythms. Simply type text, and Musicoli transforms it into measures with natural and expressive rhythms.

---

## How to Use Humming

### 1. Access the Humming Panel

1.  Open Musicoli in your browser.
2.  Select **Composition Mode**.
3.  Find the **Humming (Rhythm)** panel at the top.

### 2. Type Your Text

In the text field, you can type:

#### Natural Text
```
the music is beautiful
```

#### Poetic Phrases
```
in the silence of the night
the stars are shining
```

#### With Punctuation (for rests)
```
hello, how are you?
good morning!
```

### 3. Generate Rhythm

Click the arrow button (→) or press **Enter** to generate the measures.

---

## Tips and Tricks

### Use Punctuation to Control Rests

| Symbol | Generated Rest |
|---------|-------------------|
| `,` (comma) | Short pause (1 beat) |
| `.` (period) | Short pause (1 beat) |
| `;` (semicolon) | Short pause (1 beat) |
| `!` (exclamation) | Long pause (2 beats) |
| `(silence)` | Explicit pause |

**Example:**
```
Input:  "hello, world!"
Output: "hello" + short pause + "world" + long pause
```

### Automatic Accent Detection

Tonic (accented) syllables are marked with higher volume:

```
"music" -> mu-sic
           ^ (accent here)
```

### Every Time is Different

The system selects rhythmic patterns randomly, so:
- Same text -> different rhythms every time.
- Perfect for experimenting to find the ideal rhythm.

### Natural Word Grouping

The system groups small words automatically:

```
"the sun shines"
   |
["the sun"] + ["shines"]
```

This creates more natural musical phrases.

---

## Practical Examples

### Example 1: Simple Song

**Input:**
```
life is but a dream
```

**Result:**
- 2-3 measures.
- Natural rhythm based on syllables.
- Accents on "life" and "dream".

### Example 2: Poetry with Pauses

**Input:**
```
under the moon,
the river sings.
```

**Result:**
- Measure 1: "under the moon" + pause.
- Measure 2: "the river" + "sings" + pause.

### Example 3: Fast Rhythm

**Input:**
```
run run without stopping
```

**Result:**
- Continuous rhythm with eighth notes.
- Sense of movement.

---

## Frequently Asked Questions

### Can I edit the generated rhythm?

Yes, after generating the measures:
1.  Click the measure in the editor.
2.  Use the **MIDI Editor** to adjust durations.
3.  Modify dynamics (volume) if desired.

### Does it work in other languages?

The syllabification system is currently optimized for **Spanish**, but it can be used with English and other languages for creative results.

### What happens if I type many words?

The system generates one measure for each word or group of words. Long texts will result in many measures.

### Can I control the type of rhythm?

Currently, the system selects patterns automatically. In future versions, you will be able to:
- Choose between slow/fast rhythms.
- Select styles (classical, jazz, pop).
- Preview before applying.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|-------|
| Generate rhythm | `Enter` (inside text field) |
| Clear text | `Ctrl + A` -> `Delete` |

---

## Recommended Workflow

### To Create a Song:

1.  **Type the first line** of your lyrics:
    ```
    under the blue sky
    ```
2.  **Generate the rhythm** (→).
3.  **Listen to the result** (Play).
4.  **Adjust if necessary** (edit the measure).
5.  **Repeat** with the following lines.
6.  **Combine** the measures to form your complete song.

### To Experiment:

1.  Type a word or phrase.
2.  Generate multiple times to get variations.
3.  Choose the one you like best.
4.  Combine different rhythms to create interesting patterns.

---

## Current Limitations

- Maximum 8 syllables per word (longer words use a default rhythm).
- Optimized for Spanish.
- No preview before generating.
- Cannot choose rhythm style.

**Note:** These limitations will be addressed in future updates.

---

## Creative Tips

### Experiment with Different Texts

- **Classical Poetry**: Verses by Lorca, Neruda, or Frost.
- **Sayings**: "Actions speak louder than words".
- **Tongue Twisters**: "She sells seashells by the seashore".
- **Your own lyrics**: Write what you feel.

### Combine with Other Modes

1.  Generate rhythm with **Humming**.
2.  Add melody in **Tonality Mode**.
3.  Adjust dynamics with **Dynamics Mode**.
4.  Add final lyrics in **Lyrics Mode**.

---

## Troubleshooting

### The → button doesn't work
- Ensure you have typed something in the text field.
- Reload the page if necessary.

### No measures are generated
- Make sure you are in **Composition Mode**.
- Verify that the `silaba.js` library is loaded (check the browser console).

### Rhythms don't sound right
- Try generating again (you'll get a different pattern).
- Manually edit the generated measure.
- Adjust dynamics to improve expression.

---

## Additional Resources

- **Full Technical Guide**: `docs/TARAREO_GUIDE.md`
- **Rhythmic Patterns**: Defined in `metrica.js`
- **Source Code**: `tarareo-helper.js` and `musicoli.js`

---

## Start Creating!

Humming is your gateway to musical composition without barriers. You don't need to know music theory—just write what you feel and let Musicoli turn it into music.

**Have fun composing!**

---

*Last update: February 2026*
