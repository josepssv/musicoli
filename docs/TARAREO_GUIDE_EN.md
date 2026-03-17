# 🎤 Hum System Guide in Musicoli

## Index
1. [What is Humming?](#what-is-humming)
2. [How It Works](#how-it-works)
3. [User Interface](#user-interface)
4. [Text → Rhythm Translation System](#text--rhythm-translation-system)
5. [Rhythmic Patterns (Trilipi)](#rhythmic-patterns-trilipi)
6. [Practical Examples](#practical-examples)
7. [Advanced Options](#advanced-options)

---

## What is Humming?

**Humming** (Tarareo) is an innovative tool in Musicoli that allows you to **convert text into musical rhythm** automatically and intelligently. Inspired by the natural way we sing or hum words, the system analyzes the syllabic structure of the text and translates it into coherent musical rhythmic patterns.

### Main Concept

When you hum a word like "**music**" (mu-sic, 2 syllables), the system:
1. **Syllabifies** the word automatically
2. **Identifies** the stressed syllable (mu)
3. **Selects** an appropriate rhythmic pattern for 2 syllables
4. **Generates** a musical measure with the corresponding rhythm
5. **Applies** dynamic accents on the stressed syllable

---

## How It Works

### Processing Flow

```
WRITTEN TEXT
    ↓
[Syllabic Analysis]
    ↓
[Intelligent Grouping]
    ↓
[Rhythmic Pattern Selection]
    ↓
[Musical Event Generation]
    ↓
MUSICAL MEASURES
```

### Key Components

#### 1. **Automatic Syllabification** (`silabaJS`)
- Divides words into syllables based on Spanish rules (works acceptably for English/German)
- Identifies the stressed syllable
- Example: "composition" → com-po-si-**tion** (4 syllables)

#### 2. **Intelligent Word Grouping**
The system groups short functional words with adjacent words to create more natural musical phrases:

**Grouped functional words (Supports Spanish, English, and German):**
- **Spanish**: el, la, de, a, en, con, y, que, mi, su...
- **English**: the, a, of, to, in, and, is, it, my...
- **German**: der, die, das, ein, in, an, und, ist...
- Categories: Articles, Prepositions, Pronouns, Conjunctions, and short auxiliary verbs.

**Example:**
```
Text: "the sun shines in the morning"
Grouping: ["the sun", "shines", "in the morning"]
```

#### 3. **Rhythmic Patterns (Trilipi)**
Database of rhythmic patterns organized by number of syllables (1-8):
- Each group contains multiple rhythmic variations
- Patterns are randomly selected for variety
- Numeric codes represent musical durations

#### 4. **Duration Codes**

| Code | Duration | Musical Note | Syllable Example |
|--------|----------|----------------|----------------|
| 1 | 4 beats | Whole note | daaaa |
| 2 | 2 beats | Half note | daaa |
| 25 | 3 beats | Dotted half note | daaaa |
| 3 | 1 beat | Quarter note | da |
| 35 | 1.5 beats | Dotted quarter note | daa |
| 4 | 0.5 beats | Eighth note | ti |
| 45 | 0.75 beats | Dotted eighth note | tii |
| 5 | 0.25 beats | Sixteenth note | di |
| -X | Rest | (Negative X = rest) | -da |

---

## User Interface

### Location
The Humming panel is located in **Composition Mode**, at the top of the editor:

```
┌─────────────────────────────────────────┐
│ 🎤 Hum (Rhythm)                          │
├─────────────────────────────────────────┤
│ ┌───────────────────────────────┐  ┌──┐│
│ │ Type your rhythm...           │  │→ ││
│ │ (e.g., ta ta ta ta)           │  └──┘│
│ └───────────────────────────────┘      │
└─────────────────────────────────────────┘
```

### UI Elements

1. **Text Field** (`tarareo-input`)
   - Multiline text area
   - Accepts free text
   - Placeholder: "Type your rhythm... (e.g., ta ta ta ta)"

2. **Submit Button** (→)
   - Processes the entered text
   - Generates musical measures
   - Updates the score automatically

3. **Rhythmic Notation Display** (`rhythm-notation-display`)
   - Visually shows the generated rhythm
   - Appears below the text field

---

## Text → Rhythm Translation System

### Input Options

#### 1. **Natural Text**
Write phrases or words:
```
Input: "the music is beautiful"
Output: 4 measures with rhythms based on syllables
```

#### 2. **Direct Rhythmic Syllables**
Use conventional humming syllables:
```
Input: "ta ta ti ti ta"
Output: Literal rhythmic pattern
```

#### 3. **Rest Markers**

**Automatic Punctuation:**
- `,` (comma) → Quarter rest (1 beat)
- `.` (dot) → Quarter rest (1 beat)
- `;` (semicolon) → Quarter rest (1 beat)
- `:` (colon) → Quarter rest (1 beat)
- `!` (exclamation) → Half rest (2 beats)

**Explicit Markers:**
- `(silence)` → Quarter rest
- `.` (standalone) → Quarter rest

**Example:**
```
Input: "hello, world!"
Output: 
  - Measure 1: "hello" (2 syllables) + quarter rest
  - Measure 2: "world" (1 syllable) + half rest
```

### Detailed Translation Process

#### Step 1: Cleaning and Splitting
```javascript
Input: "the sun shines, 
the moon rests"
↓
Words: ["the", "sun", "shines,", "the", "moon", "rests"]
```

#### Step 2: Intelligent Grouping
```javascript
↓
Groups: ["the sun", "shines", "the moon", "rests"]
```

#### Step 3: Rest Detection
```javascript
↓
"shines," → word: "shines" + rest: 1 beat
```

#### Step 4: Syllabification
```javascript
"the sun" → syllables: ["the", "sun"] (2 syllables, stress on "sun")
"shines" → syllables: ["shines"] (1 syllable)
"the moon" → syllables: ["the", "moon"] (2 syllables, stress on "moon")
"rests" → syllables: ["rests"] (1 syllable)
```

#### Step 5: Pattern Selection
```javascript
For 2 syllables → trilipi[2] → random pattern selection
Example: [3, 3] (two quarter notes)
      or: [4, 4] (two eighth notes)
```

#### Step 6: Event Generation
```javascript
Word: "the sun"
Pattern: [3, 3]
↓
Events:
  - { type: 'note', duration: 1, text: 'the', accent: false }
  - { type: 'note', duration: 1, text: 'sun', accent: true }
```

#### Step 7: Measure Creation
```javascript
↓
Measure generated with:
  - Rhythm: [3, 3]
  - Dynamics: [50, 80] (accent on stressed syllable)
  - Text: "the sun"
```

---

## Generation Strategies

The Humming panel offers 5 selectable strategies to control how text is translated to rhythm:

### 1. Strict Syllabic (`syllabic-strict`)
- **Grouping**: **No**. Processes each word individually.
- **Soprano Pattern**: Random.
- **Tenor Pattern**: Intelligent.
- **Use**: To preserve exact word separation.

### 2. Grouped Syllabic (`syllabic-grouped`)
- **Grouping**: **Yes**. Joins monosyllables with adjacent words (e.g., "in the house").
- **Soprano**: Random.
- **Tenor**: Intelligent.
- **Use**: **(Default)** Creates fluid and natural musical phrases.

### 3. Intelligent Phonetic (`phonetic-smart`)
- **Grouping**: **Yes**.
- **Soprano**: **Intelligent** (adapts rhythm to syllable weight: stressed/long).
- **Tenor**: Intelligent.
- **Use**: Natural prosody across all voices.

### 4. Strict Intelligent (`syllabic-strict-smart`)
- **Grouping**: **No**.
- **Soprano**: Intelligent.
- **Tenor**: Intelligent.
- **Use**: Strict separation but with natural rhythm.

### 5. Double Random (`grouped-double-random`)
- **Grouping**: **Yes**.
- **Soprano**: Random A.
- **Tenor**: Random B (independent of A).
- **Use**: Maximum polyphonic variety between male and female voices.

---

## Rhythmic Patterns (Trilipi)

### Data Structure

The `trilipi` system is an array indexed by number of syllables:

```javascript
trilipi[1] = [ [3], [2], [35], ... ]      // 1-syllable patterns
trilipi[2] = [ [3,3], [4,4], [3,4], ... ] // 2-syllable patterns
...
trilipi[8] = [ ... ]                       // 8-syllable patterns
```

### Pattern Examples

#### 2-Syllable Patterns
```
[3, 3]   → ♩ ♩     (quarter, quarter)
[4, 4]   → ♪ ♪     (eighth, eighth)
[3, 4]   → ♩ ♪     (quarter, eighth)
[35, 4]  → ♩. ♪    (dotted quarter, eighth)
```

#### 3-Syllable Patterns
```
[3, 3, 3]    → ♩ ♩ ♩       (three quarters)
[4, 4, 4]    → ♪ ♪ ♪       (three eighths)
```

#### Random Selection

For each word, the system:
1. Counts syllables (N)
2. Looks up `trilipi[N]`
3. Selects a random pattern from the array
4. Applies the pattern to syllables

**Benefit:** Every time you process the same text, you get different rhythmic variations.

---

## Voice Behavior (SATB)

The system generates specific rhythmic variations for each voice:

### 1. Soprano (S) and Alto (A)
- **Strategy**: Use randomly selected patterns (`random`) from `trilipi`.
- **Soprano**: Lead voice, maintains original text density.
- **Alto**: Follows Soprano structure but with **half density**.
  - *Technique*: Soprano note count (N) is divided by 2, and a new pattern from `trilipi[N/2]` is selected.
  - *Result*: Longer notes, calmer rhythm ("harmonic bed").

### 2. Tenor (T) and Bass (B)
- **Strategy**: Use strictly **phonetic** patterns (`phonetic`).
- **Tenor**: High male voice, uses base phonetic pattern at original density.
- **Bass**: Follows Tenor structure but with **half density**.

---

## Technical Summary

### Files Involved

1. **`tarareo-helper.js`**: Syllable → musical event conversion logic.
2. **`musicoli.js`**: Text processing, measure generation, BDI integration.
3. **`metrica.js`**: `trilipi` database of rhythmic patterns.
4. **`silaba.js`**: Syllabification engine.
5. **`index.html`**: User interface.

---

## Conclusion

The **Humming** system in Musicoli is a powerful tool that democratizes musical composition by allowing anyone to create natural and expressive musical rhythms simply by typing text.

*Hum System Guide - March 2026*
