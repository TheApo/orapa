

import { GEMS, GEM_SETS, FORBIDDEN_ZONE, DIFFICULTIES } from './constants';
import { gameState, GameStatus, Gem } from './state';
import { UI } from './ui';
import { tracePath } from './path-tracer';
import { CellState, GRID_WIDTH, GRID_HEIGHT } from './grid';
import { rotateGridPattern } from './physics';

export class Game {
    ui: UI;
    playerGrid: CellState[][] = [];
    secretGrid: CellState[][] = [];
    secretGemMap: Map<string, Gem> = new Map();

    constructor(ui: UI) {
        this.ui = ui;
        this.ui.bindGame(this);
        this.showMainMenu();
    }

    private _initGrids() {
        this.playerGrid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(CellState.EMPTY));
        this.secretGrid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(CellState.EMPTY));
        this.secretGemMap.clear();
    }

    showMainMenu() {
        gameState.status = GameStatus.MAIN_MENU;
        this.ui.showScreen('main');
    }

    showDifficultySelect() {
        gameState.status = GameStatus.DIFFICULTY_SELECT;
        this.ui.showScreen('difficulty');
    }
    
    showEndScreen(isWin: boolean) {
        gameState.status = GameStatus.GAME_OVER;
        this.ui.showEndScreen(isWin, gameState.waveCount, this.secretGrid, gameState.secretGems);
    }

    start(difficulty: string) {
        gameState.difficulty = difficulty;
        gameState.status = GameStatus.PLAYING;
        this._initGrids();
        
        gameState.secretGems = this._placeSecretGems();
        if (gameState.secretGems.length === 0) {
            // Failed to generate a level
            this.showDifficultySelect();
            return;
        }

        gameState.playerGems = [];
        gameState.log = [];
        gameState.waveCount = 0;
        gameState.debugMode = false;
        
        this.ui.setupGameUI();
        this.ui.showScreen('game');
        this.ui.redrawAll(); // Initial draw
    }
    
    giveUp() {
        this.showEndScreen(false);
    }

    toggleDebugMode() {
        gameState.debugMode = !gameState.debugMode;
        this.ui.redrawAll();
    }

    sendWave(emitterId: string) {
        if (gameState.status !== GameStatus.PLAYING) return;
        
        gameState.waveCount++;
        const result = tracePath(this.secretGrid, this.secretGemMap, emitterId);
        const logEntry = { waveId: emitterId, result, path: result.path };
        gameState.log.push(logEntry);
        
        this.ui.addLogEntry(logEntry, emitterId);
        this.ui.updateEmitterState(emitterId, result);
        this.ui.showWavePath(result);
    }

    checkSolution() {
        // Rebuild the player grid from scratch to ensure it's up-to-date and not stale
        const freshPlayerGrid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(CellState.EMPTY));
        for (const gem of gameState.playerGems) {
            const { gridPattern, x, y } = gem;
            for (let r = 0; r < gridPattern.length; r++) {
                for (let c = 0; c < gridPattern[0].length; c++) {
                    const cellState = gridPattern[r][c];
                    if (cellState !== CellState.EMPTY) {
                        freshPlayerGrid[y + r][x + c] = cellState;
                    }
                }
            }
        }

        // Now compare the fresh grid with the secret grid
        let isCorrect = true;
        for(let y = 0; y < GRID_HEIGHT; y++) {
            for(let x = 0; x < GRID_WIDTH; x++) {
                if (freshPlayerGrid[y][x] !== this.secretGrid[y][x]) {
                    isCorrect = false;
                    break;
                }
            }
            if (!isCorrect) break;
        }
        this.showEndScreen(isCorrect);
    }

    addPlayerGem(gemName: string, x: number, y: number) {
        const gemDef = GEMS[gemName];
        if (!gemDef) return;
        const newGem: Gem = { 
            id: `player_${Date.now()}`, 
            name: gemName, 
            x, y, 
            rotation: 0, 
            gridPattern: gemDef.gridPattern,
        };
        this._updatePlayerGem(newGem);
        gameState.playerGems.push(newGem);
        this.updateSolutionButtonState();
        this.ui.redrawAll();
    }

    movePlayerGem(id: string, newX: number, newY: number) {
        const gem = gameState.playerGems.find(g => g.id === id);
        if (gem) {
            this._clearGemFromGrid(gem, this.playerGrid);
            gem.x = newX;
            gem.y = newY;
            this._updatePlayerGem(gem);
        }
    }

    removePlayerGem(id: string) {
        const gemIndex = gameState.playerGems.findIndex(g => g.id === id);
        if (gemIndex > -1) {
            const gem = gameState.playerGems[gemIndex];
            this._clearGemFromGrid(gem, this.playerGrid);
            gameState.playerGems.splice(gemIndex, 1);
            this.updateSolutionButtonState();
        }
    }

    rotatePlayerGem(id: string) {
        const gem = gameState.playerGems.find(g => g.id === id);
        if (gem) {
            this._clearGemFromGrid(gem, this.playerGrid);
            gem.rotation = (gem.rotation + 90) % 360;
            gem.gridPattern = rotateGridPattern(gem.gridPattern);
            this._updatePlayerGem(gem);
            this.ui.redrawAll();
        }
    }
    
    public canPlaceGem(gemToTest: { id?: string; x: number; y: number; gridPattern: CellState[][] }): boolean {
        const tempGrid = this.playerGrid.map(row => [...row]);
    
        if (gemToTest.id) {
            const originalGem = gameState.playerGems.find(g => g.id === gemToTest.id);
            if (originalGem) {
                this._clearGemFromGrid(originalGem, tempGrid);
            }
        }
    
        const { gridPattern, x, y } = gemToTest;
        const height = gridPattern.length;
        const width = gridPattern[0].length;
    
        if (x < 0 || y < 0 || x + width > GRID_WIDTH || y + height > GRID_HEIGHT) {
            return false;
        }
    
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                if (gridPattern[r][c] !== CellState.EMPTY) {
                    const gx = x + c;
                    const gy = y + r;
                    if (tempGrid[gy][gx] !== CellState.EMPTY) {
                        return false;
                    }
                    if (this._isInForbiddenZone(gx, gy)) {
                        return false;
                    }
                    // NEW: Check for edge-to-edge adjacency
                    const neighbors = [
                        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
                    ];

                    for (const neighbor of neighbors) {
                        const nx = gx + neighbor.dx;
                        const ny = gy + neighbor.dy;

                        if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
                            if (tempGrid[ny][nx] !== CellState.EMPTY) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    private _updatePlayerGem(gem: Gem) {
        this._validateGemPlacement(gem);
        this._paintGemOnGrid(gem, this.playerGrid);
        this._checkCorrectPlacement(gem);
    }

    private _validateGemPlacement(gem: Gem) {
        const { gridPattern } = gem;
        const height = gridPattern.length;
        const width = gridPattern[0].length;

        // Clamp position to be within bounds
        gem.x = Math.max(0, Math.min(gem.x, GRID_WIDTH - width));
        gem.y = Math.max(0, Math.min(gem.y, GRID_HEIGHT - height));

        gem.isValid = this._isPlacementValid(gem, this.playerGrid);
    }

    private _checkCorrectPlacement(pGem: Gem) {
        if (!pGem.isValid) {
            pGem.isCorrectlyPlaced = false;
            return;
        }
        
        let isCorrect = true;
        const { gridPattern } = pGem;
        for (let r = 0; r < gridPattern.length; r++) {
            for (let c = 0; c < gridPattern[r].length; c++) {
                const cellState = gridPattern[r][c];
                if (cellState === CellState.EMPTY) continue;
                const gx = pGem.x + c;
                const gy = pGem.y + r;
                if (this.secretGrid[gy][gx] !== cellState) {
                    isCorrect = false;
                    break;
                }
            }
            if(!isCorrect) break;
        }
        pGem.isCorrectlyPlaced = isCorrect;
    }
    
    private _isPlacementValid(gem: Gem, grid: CellState[][], ignoreId?: string): boolean {
        const { gridPattern, x, y } = gem;
        const height = gridPattern.length;
        const width = gridPattern[0].length;
    
        if (x < 0 || y < 0 || x + width > GRID_WIDTH || y + height > GRID_HEIGHT) {
            return false;
        }
    
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                if (gridPattern[r][c] !== CellState.EMPTY) {
                    const gx = x + c;
                    const gy = y + r;
                    
                    // 1. Check for overlap
                    if (grid[gy][gx] !== CellState.EMPTY) {
                        return false;
                    }
                    
                    // 2. Check forbidden zone
                    if (this._isInForbiddenZone(gx, gy)) {
                        return false;
                    }

                    // 3. NEW: Check for edge-to-edge adjacency with other gems
                    const neighbors = [
                        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
                    ];
                    
                    for (const neighbor of neighbors) {
                        const nx = gx + neighbor.dx;
                        const ny = gy + neighbor.dy;

                        if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
                            if (grid[ny][nx] !== CellState.EMPTY) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    private _isInForbiddenZone(x: number, y: number): boolean {
        return x >= FORBIDDEN_ZONE.x && x < FORBIDDEN_ZONE.x + FORBIDDEN_ZONE.width &&
               y >= FORBIDDEN_ZONE.y && y < FORBIDDEN_ZONE.y + FORBIDDEN_ZONE.height;
    }

    private _clearGemFromGrid(gem: Gem, grid: CellState[][]) {
        const { gridPattern, x, y } = gem;
        for (let r = 0; r < gridPattern.length; r++) {
            for (let c = 0; c < gridPattern[r].length; c++) {
                 if (gridPattern[r][c] !== CellState.EMPTY) {
                    if(grid[y + r] && grid[y+r][x+c] !== undefined) {
                        grid[y + r][x + c] = CellState.EMPTY;
                    }
                 }
            }
        }
    }

    private _paintGemOnGrid(gem: Gem, grid: CellState[][], gemMap?: Map<string, Gem>) {
        const { gridPattern, x, y } = gem;
        for (let r = 0; r < gridPattern.length; r++) {
            for (let c = 0; c < gridPattern[r].length; c++) {
                const cellState = gridPattern[r][c];
                if (cellState !== CellState.EMPTY) {
                    grid[y + r][x + c] = cellState;
                    gemMap?.set(`${y+r},${x+c}`, gem);
                }
            }
        }
    }

    updateSolutionButtonState() {
        const requiredCount = GEM_SETS[gameState.difficulty!]?.length ?? 0;
        const allValid = gameState.playerGems.every(gem => gem.isValid);
        const correctCount = gameState.playerGems.length === requiredCount;
        this.ui.checkSolutionBtn.disabled = !(allValid && correctCount);
    }
    
    private _placeSecretGems(): Gem[] {
        const placedGems: Gem[] = [];
        const tempGrid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(CellState.EMPTY));
        const gemSet = GEM_SETS[gameState.difficulty!];
        let attempts = 0;

        while(placedGems.length < gemSet.length && attempts < 500) {
            attempts++;
            // Reset for each attempt
            placedGems.length = 0;
            tempGrid.forEach(row => row.fill(CellState.EMPTY));

            for (const gemName of gemSet) {
                const gemDef = GEMS[gemName];
                let placed = false;
                let singleGemAttempts = 0;
                
                while(!placed && singleGemAttempts < 200) {
                    singleGemAttempts++;
                    let pattern = gemDef.gridPattern;
                    const rotCount = Math.floor(Math.random() * 4);
                    for (let i = 0; i < rotCount; i++) {
                        pattern = rotateGridPattern(pattern);
                    }

                    const effH = pattern.length;
                    const effW = pattern[0].length;
                    
                    if (GRID_WIDTH < effW || GRID_HEIGHT < effH) continue;

                    const x = Math.floor(Math.random() * (GRID_WIDTH - effW + 1));
                    const y = Math.floor(Math.random() * (GRID_HEIGHT - effH + 1));

                    const newGem: Gem = {
                        id: `secret_${gemName}_${placedGems.length}`,
                        name: gemName, x, y, rotation: rotCount * 90, gridPattern: pattern
                    };

                    if (this._isPlacementValid(newGem, tempGrid)) {
                        this._paintGemOnGrid(newGem, tempGrid);
                        placedGems.push(newGem);
                        placed = true;
                    }
                }
                if (!placed) break; // Failed to place this gem, restart the whole process
            }
        }

        if (placedGems.length !== gemSet.length) {
            console.error("Failed to place all secret gems! The difficulty might be too high for the board size.");
            alert("Fehler bei der Level-Erstellung. Bitte versuchen Sie es erneut.");
            return [];
        }

        // Final commit to the actual secret grid and map
        placedGems.forEach(gem => this._paintGemOnGrid(gem, this.secretGrid, this.secretGemMap));
        
        console.log("Secret gems placed:", placedGems);
        return placedGems;
    }
}