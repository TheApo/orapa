
export const GRID_WIDTH = 8;
export const GRID_HEIGHT = 10;

export enum CellState {
    EMPTY = 0,
    BLOCK = 1,
    TRIANGLE_TL = 2, // Top-Left corner is filled. '\' slope.
    TRIANGLE_TR = 3, // Top-Right. '/' slope.
    TRIANGLE_BR = 4, // Bottom-Right. '\' slope.
    TRIANGLE_BL = 5, // Bottom-Left. '/' slope.
    ABSORB = 6,
}
