
export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 8;

export enum CellState {
    EMPTY = 0,
    BLOCK = 1,
    TRIANGLE_TL = 2, // Top-Left corner is filled. '\' slope.
    TRIANGLE_TR = 3, // Top-Right. '/' slope.
    TRIANGLE_BR = 4, // Bottom-Right. '\' slope.
    TRIANGLE_BL = 5, // Bottom-Left. '/' slope.
    ABSORB = 6,
}

/**
 * Converts an internal emitter ID (e.g. "T3", "L2") to the original
 * game's display label using 1-18 (numbers) and A-R (letters).
 *
 * Mapping (landscape, left-to-right / top-to-bottom):
 *   Top  T1-T10 → 1-10    Right R1-R8 → 11-18
 *   Left L1-L8  → A-H     Bottom B1-B10 → I-R
 */
export function getEmitterDisplayLabel(id: string): string {
    const side = id[0];
    const num = parseInt(id.substring(1));
    switch (side) {
        case 'T': return `${num}`;
        case 'R': return `${GRID_WIDTH + num}`;
        case 'L': return String.fromCharCode(64 + num); // A=65, so 64+1=A
        case 'B': return String.fromCharCode(72 + num); // I=73, so 72+1=I
        default: return id;
    }
}

/** Converts a grid coordinate to a human-readable label: column number + row letter. */
export function getCellDisplayLabel(x: number, y: number): string {
    return `${x + 1}${String.fromCharCode(65 + y)}`;
}
