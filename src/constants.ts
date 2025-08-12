
import { CellState } from "./grid";

export const DIFFICULTIES = {
    TRAINING: 'TRAINING',
    NORMAL: 'NORMAL',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
    CUSTOM: 'CUSTOM',
};

export const COLORS = {
    GELB: '#f1c40f',
    ROT: '#e74c3c',
    BLAU: '#3498db',
    WEISS: '#ecf0f1',
    TRANSPARENT: '#95a5a6', 
    LILA: '#9b59b6', // rot+blau
    HIMMELBLAU: '#5dade2', // weiss+blau
    GRUEN: '#2ecc71', // gelb+blau
    PINK: '#ff8a80', // weiss+rot -> Hellrot
    ORANGE: '#e67e22', // gelb+rot
    ZITRONE: '#ffff8d', // weiss+gelb -> Hellgelb
    HELLLILA: '#ba68c8', // rot+blau+weiss
    SCHWARZ_GEM: '#1d1d1d', // Gem color - made darker
    SCHWARZ_MIX: '#34495e', // rot+blau+gelb
    HELLGRUEN: '#81c784', // weiss+gelb+blau
    HELLORANGE: '#ffb74d', // weiss+gelb+rot
    GRAU: '#9e9e9e', // alle 4
    ABSORBIERT: '#17202a',
    correct: '#4caf50',
    INVALID_GEM: '#e74c3c',
};

export const BASE_COLORS: { [key: string]: { nameKey: string, color: string, baseGems: string[], special?: string } } = {
    ROT: { nameKey: 'colors.red', color: COLORS.ROT, baseGems: ['ROT'] },
    GELB: { nameKey: 'colors.yellow', color: COLORS.GELB, baseGems: ['GELB'] },
    BLAU: { nameKey: 'colors.blue', color: COLORS.BLAU, baseGems: ['BLAU'] },
    WEISS: { nameKey: 'colors.white', color: COLORS.WEISS, baseGems: ['WEISS'] },
    TRANSPARENT: { nameKey: 'colors.transparent', color: COLORS.TRANSPARENT, baseGems: [] },
    SCHWARZ: { nameKey: 'colors.black', color: COLORS.SCHWARZ_GEM, baseGems: [], special: 'absorbs' },
};

export const COLOR_MIXING: { [key: string]: string } = {
    'BLAU': COLORS.BLAU,
    'GELB': COLORS.GELB,
    'ROT': COLORS.ROT,
    'WEISS': COLORS.WEISS,
    'BLAU,ROT': COLORS.LILA,
    'BLAU,WEISS': COLORS.HIMMELBLAU,
    'BLAU,GELB': COLORS.GRUEN,
    'ROT,WEISS': COLORS.PINK,
    'GELB,ROT': COLORS.ORANGE,
    'GELB,WEISS': COLORS.ZITRONE,
    'BLAU,ROT,WEISS': COLORS.HELLLILA,
    'BLAU,GELB,ROT': COLORS.SCHWARZ_MIX,
    'BLAU,GELB,WEISS': COLORS.HELLGRUEN,
    'GELB,ROT,WEISS': COLORS.HELLORANGE,
    'BLAU,GELB,ROT,WEISS': COLORS.GRAU,
};

export const COLOR_NAME_KEYS: { [key: string]: string } = {
    'BLAU': 'colors.blue',
    'GELB': 'colors.yellow',
    'ROT': 'colors.red',
    'WEISS': 'colors.white',
    'TRANSPARENT': 'colors.transparent',
    'SCHWARZ': 'colors.black',
    'BLAU,ROT': 'colors.purple',
    'BLAU,WEISS': 'colors.skyBlue',
    'BLAU,GELB': 'colors.green',
    'ROT,WEISS': 'colors.lightRed',
    'GELB,ROT': 'colors.orange',
    'GELB,WEISS': 'colors.lightYellow',
    'BLAU,ROT,WEISS': 'colors.lightPurple',
    'BLAU,GELB,ROT': 'colors.darkGray',
    'BLAU,GELB,WEISS': 'colors.lightGreen',
    'GELB,ROT,WEISS': 'colors.lightOrange',
    'BLAU,GELB,ROT,WEISS': 'colors.gray',
};

// Gem definitions strictly based on the user's provided text specifications.
// All slants are exactly 45 degrees.
export const GEMS: { [key: string]: any } = {
    GELB: { // Rechtwinkliges Dreieck (belegt ein 2x1 Rechteck)
        name: 'GELB', color: COLORS.GELB, baseGems: ['GELB'],
        gridPattern: [[CellState.TRIANGLE_BL, CellState.EMPTY],
        [CellState.BLOCK, CellState.TRIANGLE_BL]],
    },
    ROT: { // Parallelogramm (belegt ein 3x1 Rechteck)
        name: 'ROT', color: COLORS.ROT, baseGems: ['ROT'],
        gridPattern: [
            [CellState.TRIANGLE_BR, CellState.BLOCK, CellState.TRIANGLE_TL]
        ],
    },
    BLAU: { // Grosses, gleichschenkliges Dreieck (Basis 4, Höhe 2)
        name: 'BLAU', color: COLORS.BLAU, baseGems: ['BLAU'],
        gridPattern: [
            [CellState.EMPTY, CellState.TRIANGLE_BR, CellState.TRIANGLE_BL, CellState.EMPTY],
            [CellState.TRIANGLE_BR, CellState.BLOCK, CellState.BLOCK, CellState.TRIANGLE_BL]
        ],
    },
    WEISS_RAUTE: { // Raute (belegt ein 2x2 Quadrat)
        name: 'WEISS_RAUTE', color: COLORS.WEISS, baseGems: ['WEISS'],
        gridPattern: [
            [CellState.TRIANGLE_BR, CellState.TRIANGLE_BL],
            [CellState.TRIANGLE_TR, CellState.TRIANGLE_TL]
        ],
    },
    WEISS_DREIECK: { // Grosses, gleichschenkliges Dreieck, weiss (Basis 4, Höhe 2)
        name: 'WEISS_DREIECK', color: COLORS.WEISS, baseGems: ['WEISS'],
        gridPattern: [
            [CellState.EMPTY, CellState.TRIANGLE_BR, CellState.TRIANGLE_BL, CellState.EMPTY],
            [CellState.TRIANGLE_BR, CellState.BLOCK, CellState.BLOCK, CellState.TRIANGLE_BL]
        ],
    },
    TRANSPARENT: { // Kleines, gleichschenkliges Dreieck (Basis 2, Höhe 1)
        name: 'TRANSPARENT', color: COLORS.TRANSPARENT, baseGems: [],
        gridPattern: [
            [CellState.TRIANGLE_BR, CellState.TRIANGLE_BL]
        ],
    },
    SCHWARZ: { // Rechteck-Absorber (2x1 Gitterzellen)
        name: 'SCHWARZ', color: COLORS.SCHWARZ_GEM, baseGems: [], special: 'absorbs',
        gridPattern: [[CellState.ABSORB, CellState.ABSORB]],
    },
};

export const CUSTOM_SHAPES: { [key: string]: { nameKey: string, gridPattern: CellState[][] } } = {
    SHAPE_RTRIANGLE: { nameKey: 'shapes.rightTriangle', gridPattern: GEMS.GELB.gridPattern },
    SHAPE_PARALLEL: { nameKey: 'shapes.parallelogram', gridPattern: GEMS.ROT.gridPattern },
    SHAPE_BIG_TRIANGLE: { nameKey: 'shapes.bigTriangle', gridPattern: GEMS.BLAU.gridPattern },
    SHAPE_DIAMOND: { nameKey: 'shapes.diamond', gridPattern: GEMS.WEISS_RAUTE.gridPattern },
    SHAPE_SMALL_TRIANGLE: { nameKey: 'shapes.smallTriangle', gridPattern: GEMS.TRANSPARENT.gridPattern },
    SHAPE_ABSORBER: { nameKey: 'shapes.absorber', gridPattern: GEMS.SCHWARZ.gridPattern },
    SHAPE_L: { nameKey: 'shapes.lShape', gridPattern: [[CellState.TRIANGLE_BR, CellState.TRIANGLE_BL], [CellState.BLOCK, CellState.TRIANGLE_TL]] },
    SHAPE_T: { nameKey: 'shapes.tShape', gridPattern: [[CellState.TRIANGLE_BR, CellState.BLOCK, CellState.TRIANGLE_BL], [CellState.TRIANGLE_TR, CellState.BLOCK, CellState.TRIANGLE_TL]] },
    SHAPE_SQUARE: { nameKey: 'shapes.square', gridPattern: [[CellState.TRIANGLE_BR, CellState.BLOCK], [CellState.BLOCK, CellState.TRIANGLE_TL]] },
    SHAPE_BAR: { nameKey: 'shapes.bar', gridPattern: [[CellState.TRIANGLE_BL], [CellState.BLOCK], [CellState.TRIANGLE_TL]] },
    SHAPE_SMALL: { nameKey: 'shapes.small', gridPattern: [[CellState.TRIANGLE_TR, CellState.TRIANGLE_BL]] },
    SHAPE_CUSTOM_DESIGN: { nameKey: 'shapes.custom', gridPattern: [[CellState.EMPTY, CellState.BLOCK, CellState.EMPTY], [CellState.BLOCK, CellState.BLOCK, CellState.BLOCK], [CellState.EMPTY, CellState.BLOCK, CellState.EMPTY]] },
};


export const GEM_SETS: { [key: string]: string[] } = {
    [DIFFICULTIES.TRAINING]: ['GELB', 'ROT', 'BLAU', 'WEISS_RAUTE', 'WEISS_DREIECK'],
    [DIFFICULTIES.NORMAL]: ['GELB', 'ROT', 'BLAU', 'WEISS_RAUTE', 'WEISS_DREIECK'],
    [DIFFICULTIES.MEDIUM]: ['GELB', 'ROT', 'BLAU', 'WEISS_RAUTE', 'WEISS_DREIECK', 'TRANSPARENT'],
    [DIFFICULTIES.HARD]: ['GELB', 'ROT', 'BLAU', 'WEISS_RAUTE', 'WEISS_DREIECK', 'TRANSPARENT', 'SCHWARZ'],
};

export const RATINGS: { [key: string]: { limit: number; textKey: string }[] } = {
    [DIFFICULTIES.TRAINING]: [
        { limit: 8, textKey: 'ratings.training.1' },
        { limit: 10, textKey: 'ratings.training.2' },
        { limit: 20, textKey: 'ratings.training.3' },
        { limit: Infinity, textKey: 'ratings.training.4' },
    ],
    [DIFFICULTIES.NORMAL]: [
        { limit: 10, textKey: 'ratings.normal.1' },
        { limit: 13, textKey: 'ratings.normal.2' },
        { limit: 18, textKey: 'ratings.normal.3' },
        { limit: 23, textKey: 'ratings.normal.4' },
        { limit: Infinity, textKey: 'ratings.normal.5' },
    ],
    [DIFFICULTIES.MEDIUM]: [
        { limit: 12, textKey: 'ratings.medium.1' },
        { limit: 15, textKey: 'ratings.medium.2' },
        { limit: 20, textKey: 'ratings.medium.3' },
        { limit: 25, textKey: 'ratings.medium.4' },
        { limit: Infinity, textKey: 'ratings.medium.5' },
    ],
    [DIFFICULTIES.HARD]: [
        { limit: 15, textKey: 'ratings.hard.1' },
        { limit: 18, textKey: 'ratings.hard.2' },
        { limit: 21, textKey: 'ratings.hard.3' },
        { limit: 25, textKey: 'ratings.hard.4' },
        { limit: Infinity, textKey: 'ratings.hard.5' },
    ],
    [DIFFICULTIES.CUSTOM]: [ // Same as 'Hard'
        { limit: 15, textKey: 'ratings.hard.1' },
        { limit: 18, textKey: 'ratings.hard.2' },
        { limit: 21, textKey: 'ratings.hard.3' },
        { limit: 25, textKey: 'ratings.hard.4' },
        { limit: Infinity, textKey: 'ratings.hard.5' },
    ],
};