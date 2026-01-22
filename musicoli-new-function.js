// Nueva función midiNotesToScaleColor con soporte para degradados
function midiNotesToScaleColor(notes) {
    if (notes.length === 0) return 'hsl(0, 0%, 50%)';

    // 1 Note: Neutral gray with pitch-based lightness
    if (notes.length === 1) {
        return getSingleNoteColor(notes[0]);
    }

    // 2 Notes: Solid color based on movement
    if (notes.length === 2) {
        return getSingleNoteColor(notes[1], notes[0]);
    }

    // 3 Notes: Solid color (use middle note's movement)
    if (notes.length === 3) {
        return getSingleNoteColor(notes[1], notes[0]);
    }

    // 4 Notes: Two-color gradient
    if (notes.length === 4) {
        const c1 = getSingleNoteColor(notes[1], notes[0]);
        const c2 = getSingleNoteColor(notes[3], notes[2]);
        return `linear-gradient(to right, ${c1}, ${c2})`;
    }

    // 5 Notes: Two-color gradient
    if (notes.length === 5) {
        const c1 = getSingleNoteColor(notes[1], notes[0]);
        const c2 = getSingleNoteColor(notes[4], notes[3]);
        return `linear-gradient(to right, ${c1}, ${c2})`;
    }

    // 6 Notes: Two-color gradient
    if (notes.length === 6) {
        const c1 = getSingleNoteColor(notes[2], notes[0]);
        const c2 = getSingleNoteColor(notes[5], notes[3]);
        return `linear-gradient(to right, ${c1}, ${c2})`;
    }

    // 7+ Notes: Three-color gradient
    if (notes.length >= 7) {
        const third = Math.floor(notes.length / 3);
        const c1 = getSingleNoteColor(notes[third], notes[0]);
        const c2 = getSingleNoteColor(notes[third * 2], notes[third]);
        const c3 = getSingleNoteColor(notes[notes.length - 1], notes[third * 2]);
        return `linear-gradient(to right, ${c1}, ${c2}, ${c3})`;
    }

    return 'hsl(0, 0%, 50%)';
}
