
import { GEMS } from './constants';
import { gameState, Gem } from './state';
import { CellState, GRID_WIDTH, GRID_HEIGHT } from './grid';
import { Direction, getReflection } from './physics';

const MAX_STEPS = 100; // Prevents infinite loops

function getEmitterDetails(emitterId: string): { pos: { x: number; y: number }, dir: Direction } | null {
    const idNum = parseInt(emitterId.substring(1)) - 1;
    switch (emitterId[0]) {
        case 'T': return { pos: { x: idNum, y: -1 }, dir: Direction.DOWN };
        case 'B': return { pos: { x: idNum, y: GRID_HEIGHT }, dir: Direction.UP };
        case 'L': return { pos: { x: -1, y: idNum }, dir: Direction.RIGHT };
        case 'R': return { pos: { x: GRID_WIDTH, y: idNum }, dir: Direction.LEFT };
        default: return null;
    }
}

function getExitId(pos: { x: number, y: number }): string {
    if (pos.y < 0) return `T${pos.x + 1}`;
    if (pos.y >= GRID_HEIGHT) return `B${pos.x + 1}`;
    if (pos.x < 0) return `L${pos.y + 1}`;
    if (pos.x >= GRID_WIDTH) return `R${pos.y + 1}`;
    return 'Error';
}

function move(pos: { x: number; y: number }, dir: Direction): void {
    switch (dir) {
        case Direction.UP: pos.y--; break;
        case Direction.DOWN: pos.y++; break;
        case Direction.LEFT: pos.x--; break;
        case Direction.RIGHT: pos.x++; break;
    }
}

/**
 * Traces a light wave's path through a logic grid.
 * @param grid The logic grid with CellState values.
 * @param gemMap A map from "y,x" coordinates to the Gem occupying that cell.
 * @param emitterId The starting emitter ID (e.g., 'T1').
 * @returns An object with the path result and the visual path.
 */
export function tracePath(
    grid: CellState[][], 
    gemMap: Map<string, Gem>, 
    emitterId: string
) {
    const startDetails = getEmitterDetails(emitterId);
    if (!startDetails) {
        return { exitId: 'Error', colors: [], path: [], absorbed: false };
    }

    const currentPos = { ...startDetails.pos };
    let currentDir = startDetails.dir;
    
    // Path points are cell centers for drawing
    const path: {x: number, y: number}[] = [];
    const hitColors = new Set<string>();
    const hitGems = new Set<string>();

    for (let step = 0; step < MAX_STEPS; step++) {
        move(currentPos, currentDir);
        
        // Add point for drawing
        // For the very first point, start from the edge of the board.
        if (path.length === 0) {
             path.push({ 
                x: startDetails.pos.x + (startDetails.dir === Direction.RIGHT ? 1 : startDetails.dir === Direction.LEFT ? 0 : 0.5),
                y: startDetails.pos.y + (startDetails.dir === Direction.DOWN ? 1 : startDetails.dir === Direction.UP ? 0 : 0.5)
            });
        }

        if (
            currentPos.x < 0 || currentPos.x >= GRID_WIDTH ||
            currentPos.y < 0 || currentPos.y >= GRID_HEIGHT
        ) {
            // Exited the board
            path.push({
                x: currentPos.x + (currentDir === Direction.LEFT ? 1 : currentDir === Direction.RIGHT ? 0 : 0.5),
                y: currentPos.y + (currentDir === Direction.UP ? 1 : currentDir === Direction.DOWN ? 0 : 0.5)
            });
            return { exitId: getExitId(currentPos), colors: [...hitColors], path, absorbed: false };
        }

        const cellState = grid[currentPos.y][currentPos.x];
        
        if (cellState === CellState.EMPTY) {
            continue; // Keep moving in the same direction
        }

        // Add the current cell center as a path node before reflection
        path.push({ x: currentPos.x + 0.5, y: currentPos.y + 0.5 });
        
        // Something was hit, add gem color if not already hit
        const gemKey = `${currentPos.y},${currentPos.x}`;
        const hitGem = gemMap.get(gemKey);
        if (hitGem && !hitGems.has(hitGem.id)) {
            hitGems.add(hitGem.id);
            const gemDef = GEMS[hitGem.name];
            if (gemDef.baseGems) {
                gemDef.baseGems.forEach((c: string) => hitColors.add(c));
            }
        }
        
        if (cellState === CellState.ABSORB) {
            return { exitId: 'Absorbed', colors: [], path, absorbed: true };
        }

        const newDir = getReflection(cellState, currentDir);
        if (newDir === null) {
            // Hit a triangle edge-on, passes through.
            continue;
        }
        
        currentDir = newDir;
    }

    // Loop detected
    return { exitId: 'Loop?', colors: [...hitColors], path, absorbed: false };
}