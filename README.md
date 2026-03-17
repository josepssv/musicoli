# Musicoli 🎵🎨

**Musicoli** is a web-based musical composition tool focused on measure-based workflow, voice independence, humming (tarareo), and color-based visualization. It allows you to compose, edit, and play polyphonic MIDI music directly from your browser.

## Main Features

*   **Polyphonic Editing**: Full support for 4 independent voices (Soprano, Alto, Tenor, Bass).
*   **Specialized Editing Modes**:
    *   **Rhythm**: Define temporal structure and rhythmic patterns.
    *   **Tonality**: Adjust scales, harmonies, and specific notes.
    *   **Lyrics**: Add and synchronize text with the music.
    *   **Dynamics**: Precise control of overall volume and individual track mixing.
    *   **Measure Focus**: Measure-based editing adds more rhythm and meaning to phrases and the final composition.
*   **🎤 Humming System**: Automatically converts text into musical rhythm. Type words or phrases and the system translates them into natural rhythmic patterns based on Spanish syllabification. [See Quick Start Guide →](docs/TARAREO_QUICKSTART.md)
*   **Color System**: Intuitive visualization where colors represent pitches and tonal functions.
*   **MIDI Playback**: Integrated audio engine based on *Soundfont* for realistic playback.
*   **Export**: Generate and download `.mid` (MIDI) files and HTML summaries of your compositions.
*   **Local Storage**: Save your phrases and progress in the browser.

## Getting Started

Musicoli is built with standard web technologies (HTML, CSS, JS) and **requires no installation or build processes**.

1.  Clone or download this repository.
2.  Open `index.html` in any modern web browser (Chrome, Firefox, Edge).
3.  Start composing!

## Project Structure

*   `index.html`: Entry point of the application. Contains the UI structure.
*   `musicoli.js`: Core logic of the application. Manages the state (`bdi` object), playback, and editing logic.
*   `notepad.js`: Component for score and piano roll visualization and editing.
*   `metrica.js` & `silaba.js`: Auxiliary modules for handling metrics and text syllabification.
*   `midiWriter.js`: Library for generating MIDI files.
*   `soundfont-player.js`: Library for audio playback using soundfonts.

## Technologies

*   HTML5
*   CSS3 (Variables, Flexbox/Grid)
*   JavaScript (ES6+)
*   Web Audio API

## Documentation

### 📚 Humming System Guides (Tarareo)

The Humming system is a unique feature of Musicoli that converts text into musical rhythm:

*   **[Technical Guide](docs/TARAREO_GUIDE_EN.md)**: Detailed documentation of the system, algorithms, and rhythmic patterns.

### 🛠️ Developer & Technical Info

*   **[Algorithm Configuration](test/ALGORITHM_CONFIG_GUIDE.md)**: Technical details on pattern selection logic and weights.
*   **[Image to Melody Algorithm](docs/IMAGE_TO_MELODY_ALGORITHM_EN.md)**: Documentation on the visual-to-musical conversion system.
*   **[Voice Configuration Guide](docs/VOICE_CONFIG_GUIDE_EN.md)**: Details on automatic patterns and time decrease per voice.

## License

This project is open-source. Feel free to use, modify, and contribute.

---
*Created with the assistance of Antigravity AI*
