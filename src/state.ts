
import { CellState } from "./grid";

export enum GameStatus {
    MAIN_MENU,
    DIFFICULTY_SELECT,
    CUSTOM_CREATOR,
    PLAYING,
    GAME_OVER,
}

export enum InteractionMode {
    WAVE = 'wave',
    QUERY = 'query',
}

export interface Gem {
    id: string;
    name: string;
    x: number;
    y: number;
    rotation: number;
    isFlipped: boolean;
    isFlippable: boolean;
    gridPattern: CellState[][];
    isValid?: boolean;
    isCorrectlyPlaced?: boolean;
}

export type WaveLog = {
    type: InteractionMode.WAVE;
    id: string; // The emitter ID (e.g., 'T1')
    result: any;
    path: {x: number, y: number}[];
    playerPath?: {x: number, y: number}[];
    playerResult?: any;
};

export type QueryLog = {
    type: InteractionMode.QUERY;
    id: string; // A unique ID for this log entry
    coords: {x: number, y: number};
    result: { colorNameKey: string | null; colorHex: string | null; };
    playerResult: { colorNameKey: string | null; colorHex: string | null; };
};

export type LogEntry = WaveLog | QueryLog;

export type PermanentQueryResult = {
    coords: {x: number, y: number};
    result: { colorNameKey: string | null; colorHex: string | null; };
}

export interface GameState {
    status: GameStatus;
    difficulty: string | null;
    interactionMode: InteractionMode;
    secretGems: Gem[];
    playerGems: Gem[];
    log: LogEntry[];
    waveCount: number;
    debugMode: boolean;
    showPlayerPathPreview: boolean;
    selectedLogEntryId: string | null;
    previewSourceEmitterId: string | null; // ID of the emitter to use as the live preview source
    activePlayerPath: {x: number, y: number}[] | null; // Live calculated path for the player
    activePlayerResult: any | null; // Live calculated result for the player
    permanentQueryResults: PermanentQueryResult[]; // Persistently store all query results
    // For custom levels
    customGemSet: string[];
    customGemDefinitions: { [key: string]: any };
}

export const gameState: GameState = {
    status: GameStatus.MAIN_MENU,
    difficulty: null,
    interactionMode: InteractionMode.WAVE,
    secretGems: [],
    playerGems: [],
    log: [],
    waveCount: 0,
    debugMode: false,
    showPlayerPathPreview: false,
    selectedLogEntryId: null,
    previewSourceEmitterId: null,
    activePlayerPath: null,
    activePlayerResult: null,
    permanentQueryResults: [],
    customGemSet: [],
    customGemDefinitions: {},
};