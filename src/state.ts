
import { CellState } from "./grid";

export enum GameStatus {
    MAIN_MENU,
    DIFFICULTY_SELECT,
    PLAYING,
    GAME_OVER,
}

export interface Gem {
    id: string;
    name: string;
    x: number;
    y: number;
    rotation: number;
    gridPattern: CellState[][];
    isValid?: boolean;
    isCorrectlyPlaced?: boolean;
}

export interface LogEntry {
    waveId: string;
    result: any;
    path: {x: number, y: number}[];
}

export interface GameState {
    status: GameStatus;
    difficulty: string | null;
    secretGems: Gem[];
    playerGems: Gem[];
    log: LogEntry[];
    waveCount: number;
    debugMode: boolean;
}

export const gameState: GameState = {
    status: GameStatus.MAIN_MENU,
    difficulty: null,
    secretGems: [],
    playerGems: [],
    log: [],
    waveCount: 0,
    debugMode: false,
};
