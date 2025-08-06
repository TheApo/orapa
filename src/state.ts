

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
    playerPath?: {x: number, y: number}[];
    playerResult?: any;
}

export interface GameState {
    status: GameStatus;
    difficulty: string | null;
    secretGems: Gem[];
    playerGems: Gem[];
    log: LogEntry[];
    waveCount: number;
    debugMode: boolean;
    showPlayerPathPreview: boolean;
    selectedLogEntryWaveId: string | null; // ID of the wave in the log entry being inspected
    previewSourceEmitterId: string | null; // ID of the emitter to use as the live preview source
    activePlayerPath: {x: number, y: number}[] | null; // Live calculated path for the player
    activePlayerResult: any | null; // Live calculated result for the player
}

export const gameState: GameState = {
    status: GameStatus.MAIN_MENU,
    difficulty: null,
    secretGems: [],
    playerGems: [],
    log: [],
    waveCount: 0,
    debugMode: false,
    showPlayerPathPreview: false,
    selectedLogEntryWaveId: null,
    previewSourceEmitterId: null,
    activePlayerPath: null,
    activePlayerResult: null,
};