import { CellState } from './grid';

export enum Direction {
    UP,
    RIGHT,
    DOWN,
    LEFT,
}

// Defines how light reflects off different surfaces.
const reflectionMap: { [key in CellState]?: { [key in Direction]?: Direction } } = {
    [CellState.BLOCK]: {
        [Direction.UP]: Direction.DOWN,
        [Direction.RIGHT]: Direction.LEFT,
        [Direction.DOWN]: Direction.UP,
        [Direction.LEFT]: Direction.RIGHT,
    },
    // '\' slope surfaces (Top-Left and Bottom-Right triangles)
    [CellState.TRIANGLE_TR]: {
        [Direction.UP]: Direction.LEFT,
        [Direction.RIGHT]: Direction.DOWN,
        [Direction.DOWN]: Direction.UP,
        [Direction.LEFT]: Direction.RIGHT,
    },
    [CellState.TRIANGLE_BL]: {
        [Direction.UP]: Direction.DOWN,
        [Direction.RIGHT]: Direction.LEFT,
        [Direction.DOWN]: Direction.RIGHT,
        [Direction.LEFT]: Direction.UP,
    },
    // '/' slope surfaces (Top-Right and Bottom-Left triangles)
    [CellState.TRIANGLE_TL]: {
        [Direction.UP]: Direction.RIGHT,
        [Direction.RIGHT]: Direction.LEFT,
        [Direction.DOWN]: Direction.UP,
        [Direction.LEFT]: Direction.DOWN,
    },
    [CellState.TRIANGLE_BR]: {
        [Direction.UP]: Direction.DOWN,
        [Direction.RIGHT]: Direction.UP,
        [Direction.DOWN]: Direction.LEFT,
        [Direction.LEFT]: Direction.RIGHT,
    },
};

// Defines how a cell's state changes when its parent grid is rotated 90 degrees clockwise.
const rotationMap: { [key in CellState]: CellState } = {
    [CellState.EMPTY]: CellState.EMPTY,
    [CellState.BLOCK]: CellState.BLOCK,
    [CellState.ABSORB]: CellState.ABSORB,
    [CellState.TRIANGLE_TL]: CellState.TRIANGLE_TR,
    [CellState.TRIANGLE_TR]: CellState.TRIANGLE_BR,
    [CellState.TRIANGLE_BR]: CellState.TRIANGLE_BL,
    [CellState.TRIANGLE_BL]: CellState.TRIANGLE_TL,
};

const flipMap: { [key in CellState]: CellState } = {
    [CellState.EMPTY]: CellState.EMPTY,
    [CellState.BLOCK]: CellState.BLOCK,
    [CellState.ABSORB]: CellState.ABSORB,
    [CellState.TRIANGLE_TL]: CellState.TRIANGLE_TR,
    [CellState.TRIANGLE_TR]: CellState.TRIANGLE_TL,
    [CellState.TRIANGLE_BR]: CellState.TRIANGLE_BL,
    [CellState.TRIANGLE_BL]: CellState.TRIANGLE_BR,
};


/**
 * Calculates the reflection of a light ray.
 * @param cell The state of the cell the ray is in.
 * @param dir The current direction of the ray.
 * @returns The new direction after reflection, or null if the ray passes through.
 */
export function getReflection(cell: CellState, dir: Direction): Direction | null {
    if (cell === CellState.EMPTY) {
        return null;
    }
    // The path tracer handles ABSORB cells before this function is called.
    // For any other gem cell, a reflection must occur as defined in the map.
    // If the map entry is somehow undefined, it defaults to passing through (null).
    return reflectionMap[cell]?.[dir] ?? null;
}

/**
 * Rotates a gem's grid pattern 90 degrees clockwise.
 * @param pattern The 2D array of CellStates representing the gem.
 * @returns A new 2D array with the rotated pattern.
 */
export function rotateGridPattern(pattern: CellState[][]): CellState[][] {
    const rows = pattern.length;
    const cols = pattern[0].length;
    const newPattern: CellState[][] = Array.from({ length: cols }, () => Array(rows).fill(CellState.EMPTY));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            newPattern[c][rows - 1 - r] = rotationMap[pattern[r][c]];
        }
    }
    return newPattern;
}

/**
 * Flips a gem's grid pattern horizontally.
 * @param pattern The 2D array of CellStates representing the gem.
 * @returns A new 2D array with the flipped pattern.
 */
export function flipGridPatternHorizontally(pattern: CellState[][]): CellState[][] {
    return pattern.map(row => 
        row.map(cellState => flipMap[cellState]).reverse()
    );
}

/**
 * Checks if a shape's pattern is meaningfully flippable.
 * A shape is flippable if its flipped version cannot be achieved by rotation.
 * @param pattern The 2D array of CellStates representing the gem shape.
 * @returns True if the shape is flippable, false otherwise.
 */
export function isShapeFlippable(pattern: CellState[][]): boolean {
    const flipped = flipGridPatternHorizontally(pattern);
    const flippedStr = JSON.stringify(flipped);

    let current = pattern;
    // Check against all 4 rotations
    for (let i = 0; i < 4; i++) {
        if (JSON.stringify(current) === flippedStr) {
            return false; // Flipped version is identical to one of the rotations.
        }
        current = rotateGridPattern(current);
    }
    
    return true; // Flipped version is unique and not achievable by rotation.
}