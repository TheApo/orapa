import { GRID_WIDTH, GRID_HEIGHT } from './grid';
import { CellState } from './grid';

// --- Visual grid dimensions ---

export function getVisualCols(rotated: boolean): number {
    return rotated ? GRID_HEIGHT : GRID_WIDTH;
}

export function getVisualRows(rotated: boolean): number {
    return rotated ? GRID_WIDTH : GRID_HEIGHT;
}

// --- Coordinate transforms ---

/** Transform game-grid cell coords to visual cell coords (for _gridToCanvasCoords). */
export function gameToVisualCell(gx: number, gy: number, rotated: boolean): { x: number; y: number } {
    if (!rotated) return { x: gx, y: gy };
    return { x: (GRID_HEIGHT - 1) - gy, y: gx };
}

/** Inverse: visual cell coords back to game-grid cell coords (for _canvasToGridCoords). */
export function visualToGameCell(vx: number, vy: number, rotated: boolean): { x: number; y: number } {
    if (!rotated) return { x: vx, y: vy };
    return { x: vy, y: (GRID_HEIGHT - 1) - vx };
}

/** Transform continuous game coords to visual coords (for path drawing). */
export function gameToVisualContinuous(gx: number, gy: number, rotated: boolean): { x: number; y: number } {
    if (!rotated) return { x: gx, y: gy };
    return { x: GRID_HEIGHT - gy, y: gx };
}

// --- CellState visual rotation (90° CW) ---

export function rotateCellStateCW(state: CellState): CellState {
    switch (state) {
        case CellState.TRIANGLE_TL: return CellState.TRIANGLE_TR;
        case CellState.TRIANGLE_TR: return CellState.TRIANGLE_BR;
        case CellState.TRIANGLE_BR: return CellState.TRIANGLE_BL;
        case CellState.TRIANGLE_BL: return CellState.TRIANGLE_TL;
        default: return state; // BLOCK, ABSORB, EMPTY unchanged
    }
}

// --- Emitter ID mapping ---
// When board is rotated 90° CW:
//   Original Top    → Visual Right:  T(n) → R(n)
//   Original Right  → Visual Bottom: R(n) → B(GRID_HEIGHT+1-n)
//   Original Bottom → Visual Left:   B(n) → L(GRID_WIDTH+1-n)
//   Original Left   → Visual Top:    L(n) → T(GRID_HEIGHT+1-n)

export function mapEmitterToVisual(originalId: string, rotated: boolean): string {
    if (!rotated) return originalId;
    const prefix = originalId[0];
    const num = parseInt(originalId.substring(1));
    switch (prefix) {
        case 'T': return `R${num}`;
        case 'R': return `B${GRID_HEIGHT + 1 - num}`;
        case 'B': return `L${num}`;
        case 'L': return `T${GRID_HEIGHT + 1 - num}`;
        default: return originalId;
    }
}

export function mapEmitterToOriginal(visualId: string, rotated: boolean): string {
    if (!rotated) return visualId;
    const prefix = visualId[0];
    const num = parseInt(visualId.substring(1));
    switch (prefix) {
        case 'R': return `T${num}`;
        case 'B': return `R${GRID_HEIGHT + 1 - num}`;
        case 'L': return `B${num}`;
        case 'T': return `L${GRID_HEIGHT + 1 - num}`;
        default: return visualId;
    }
}
