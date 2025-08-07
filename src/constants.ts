import { CellState } from "./grid";

export const DIFFICULTIES = {
    TRAINING: 'Training',
    NORMAL: 'Normal',
    MITTEL: 'Mittel',
    SCHWER: 'Schwer',
    CUSTOM: 'Eigenes Level',
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

export const BASE_COLORS: { [key: string]: { name: string, color: string, baseGems: string[], special?: string } } = {
    ROT: { name: 'Rot', color: COLORS.ROT, baseGems: ['ROT'] },
    GELB: { name: 'Gelb', color: COLORS.GELB, baseGems: ['GELB'] },
    BLAU: { name: 'Blau', color: COLORS.BLAU, baseGems: ['BLAU'] },
    WEISS: { name: 'Weiss', color: COLORS.WEISS, baseGems: ['WEISS'] },
    TRANSPARENT: { name: 'Transparent', color: COLORS.TRANSPARENT, baseGems: [] },
    SCHWARZ: { name: 'Schwarz', color: COLORS.SCHWARZ_GEM, baseGems: [], special: 'absorbs' },
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

export const COLOR_NAMES: { [key: string]: string } = {
    'BLAU': 'Blau',
    'GELB': 'Gelb',
    'ROT': 'Rot',
    'WEISS': 'Weiss',
    'TRANSPARENT': 'Transparent',
    'SCHWARZ': 'Schwarz',
    'BLAU,ROT': 'Lila',
    'BLAU,WEISS': 'Himmelblau',
    'BLAU,GELB': 'Grün',
    'ROT,WEISS': 'Hellrot',
    'GELB,ROT': 'Orange',
    'GELB,WEISS': 'Hellgelb',
    'BLAU,ROT,WEISS': 'Hell-Lila',
    'BLAU,GELB,ROT': 'Dunkelgrau',
    'BLAU,GELB,WEISS': 'Hellgrün',
    'GELB,ROT,WEISS': 'Hell-Orange',
    'BLAU,GELB,ROT,WEISS': 'Grau',
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

export const CUSTOM_SHAPES: { [key: string]: { name: string, gridPattern: CellState[][] } } = {
    SHAPE_RTRIANGLE: { name: 'Rechtwinkliges Dreieck', gridPattern: GEMS.GELB.gridPattern },
    SHAPE_PARALLEL: { name: 'Parallelogramm', gridPattern: GEMS.ROT.gridPattern },
    SHAPE_BIG_TRIANGLE: { name: 'Grosses Dreieck', gridPattern: GEMS.BLAU.gridPattern },
    SHAPE_DIAMOND: { name: 'Raute', gridPattern: GEMS.WEISS_RAUTE.gridPattern },
    SHAPE_SMALL_TRIANGLE: { name: 'Kleines Dreieck', gridPattern: GEMS.TRANSPARENT.gridPattern },
    SHAPE_ABSORBER: { name: 'Absorber', gridPattern: GEMS.SCHWARZ.gridPattern },
    SHAPE_L: { name: 'L-Form', gridPattern: [[CellState.BLOCK, CellState.TRIANGLE_BL], [CellState.BLOCK, CellState.BLOCK]] },
    SHAPE_T: { name: 'T-Form', gridPattern: [[CellState.BLOCK, CellState.BLOCK, CellState.BLOCK], [CellState.TRIANGLE_TR, CellState.BLOCK, CellState.TRIANGLE_TL]] },
    SHAPE_SQUARE: { name: 'Quadrat', gridPattern: [[CellState.TRIANGLE_BR, CellState.BLOCK], [CellState.BLOCK, CellState.TRIANGLE_TL]] },
    SHAPE_BAR: { name: 'Stab', gridPattern: [[CellState.TRIANGLE_BL], [CellState.BLOCK], [CellState.TRIANGLE_TL]] },
};


export const GEM_SETS: { [key: string]: string[] } = {
    [DIFFICULTIES.TRAINING]: ['GELB', 'ROT', 'BLAU', 'WEISS_RAUTE'],
    [DIFFICULTIES.NORMAL]: ['GELB', 'ROT', 'BLAU', 'WEISS_RAUTE', 'WEISS_DREIECK'],
    [DIFFICULTIES.MITTEL]: ['GELB', 'ROT', 'BLAU', 'WEISS_RAUTE', 'WEISS_DREIECK', 'TRANSPARENT'],
    [DIFFICULTIES.SCHWER]: ['GELB', 'ROT', 'BLAU', 'WEISS_RAUTE', 'WEISS_DREIECK', 'TRANSPARENT', 'SCHWARZ'],
};

export const RATINGS: { [key: string]: { limit: number; text: string }[] } = {
    [DIFFICULTIES.TRAINING]: [
        { limit: 8, text: 'Sehr gut' },
        { limit: 10, text: 'Gut' },
        { limit: 20, text: 'Normal' },
        { limit: Infinity, text: 'Verbesserungsfähig' },
    ],
    [DIFFICULTIES.NORMAL]: [
        { limit: 10, text: 'Ein wahrer Experte bei der Edelsteinsuche' },
        { limit: 13, text: 'Ein Profi, dem kaum einer was vormacht' },
        { limit: 18, text: 'Guter Edelsteinsucher' },
        { limit: 23, text: 'Juhu, alle Edelsteine gefunden!' },
        { limit: Infinity, text: 'Immerhin alle Edelsteine gefunden.' },
    ],
    [DIFFICULTIES.MITTEL]: [
        { limit: 12, text: 'Meisterlich! Kaum eine Abfrage zu viel.' },
        { limit: 15, text: 'Sehr beeindruckend! Du kennst dich aus.' },
        { limit: 20, text: 'Starke Leistung! Du hast den Dreh raus.' },
        { limit: 25, text: 'Gut gemacht! Alle Schätze geborgen.' },
        { limit: Infinity, text: 'Geduld und Spucke führen zum Ziel!' },
    ],
    [DIFFICULTIES.SCHWER]: [
        { limit: 15, text: 'Legendär! Eine Leistung für die Geschichtsbücher.' },
        { limit: 18, text: 'Herausragend! Selbst Experten staunen.' },
        { limit: 21, text: 'Experten-Niveau! Du hast es wirklich drauf.' },
        { limit: 25, text: 'Ein hartes Stück Arbeit, aber erfolgreich!' },
        { limit: Infinity, text: 'Puh, das war knapp, aber gewonnen!' },
    ],
    [DIFFICULTIES.CUSTOM]: [ // Same as 'Schwer'
        { limit: 15, text: 'Legendär! Eine Leistung für die Geschichtsbücher.' },
        { limit: 18, text: 'Herausragend! Selbst Experten staunen.' },
        { limit: 21, text: 'Experten-Niveau! Du hast es wirklich drauf.' },
        { limit: 25, text: 'Ein hartes Stück Arbeit, aber erfolgreich!' },
        { limit: Infinity, text: 'Puh, das war knapp, aber gewonnen!' },
    ],
};