import { GEMS, GEM_SETS, DIFFICULTIES } from './constants';
import { gameState, GameStatus, Gem } from './state';
import { UI } from './ui';
import { tracePath } from './path-tracer';
import { CellState, GRID_WIDTH, GRID_HEIGHT } from './grid';
import { rotateGridPattern, isShapeFlippable, flipGridPatternHorizontally } from './physics';

// Defines which grid-aligned edges each CellState has.
// This is used to determine illegal edge-to-edge adjacency.
const cellEdges: { [key in CellState]: boolean[] } = {
    // [hasTopEdge, hasRightEdge, hasBottomEdge, hasLeftEdge]
    [CellState.EMPTY]:       [false, false, false, false],
    [CellState.BLOCK]:       [true,  true,  true,  true],
    [CellState.ABSORB]:      [true,  true,  true,  true],
    [CellState.TRIANGLE_TL]: [true,  false, false, true],  // Edges are top and left
    [CellState.TRIANGLE_TR]: [true,  true,  false, false], // Edges are top and right
    [CellState.TRIANGLE_BR]: [false, true,  true,  false], // Edges are bottom and right
    [CellState.TRIANGLE_BL]: [false, false, true,  true],  // Edges are bottom and left
};

type GemPlacementInfo = {
    id?: string;
    name: string;
    x: number;
    y: number;
    gridPattern: CellState[][];
};

export class Game {
    ui: UI;
    secretGrid: CellState[][] = [];
    secretGemMap: Map<string, Gem> = new Map();

    constructor(ui: UI) {
        this.ui = ui;
        this.ui.bindGame(this);
        this.showMainMenu();
    }

    private _initSecretGrid() {
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
    
    showCustomCreator() {
        gameState.status = GameStatus.CUSTOM_CREATOR;
        this.ui.showScreen('custom-creator');
    }

    showEndScreen(isWin: boolean) {
        gameState.status = GameStatus.GAME_OVER;
        this.ui.showEndScreen(isWin, gameState.waveCount, gameState.secretGems, gameState.playerGems);
    }

    start(difficulty: string) {
        gameState.difficulty = difficulty;
        gameState.status = GameStatus.PLAYING;
        this._initSecretGrid();
        
        gameState.secretGems = this._placeSecretGems();
        if (gameState.secretGems.length === 0) {
            this.showDifficultySelect(); // Fallback if generation fails
            return;
        }

        gameState.playerGems = [];
        gameState.log = [];
        gameState.waveCount = 0;
        gameState.debugMode = false;
        gameState.showPlayerPathPreview = false;
        gameState.selectedLogEntryWaveId = null;
        gameState.previewSourceEmitterId = null;
        gameState.activePlayerPath = null;
        gameState.activePlayerResult = null;
        
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

    togglePlayerPathPreview() {
        gameState.showPlayerPathPreview = !gameState.showPlayerPathPreview;
        this.ui.updatePreviewToggleState(gameState.showPlayerPathPreview);
        this.ui.redrawAll();
    }

    private getGemDefinition(gemName: string): any {
        const isCustom = gameState.difficulty === DIFFICULTIES.CUSTOM;
        const definition = isCustom 
            ? gameState.customGemDefinitions[gemName]
            : GEMS[gemName];
        if (!definition) {
            console.error(`Could not find definition for gem: ${gemName}`);
        }
        return definition;
    }

    sendWave(emitterId: string) {
        if (gameState.status !== GameStatus.PLAYING) return;
        
        gameState.waveCount++;

        // 1. Trace solution path
        const result = tracePath(this.secretGrid, this.secretGemMap, emitterId, this);
        
        // 2. Trace player path
        const playerGrid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(CellState.EMPTY));
        const playerGemMap = new Map<string, Gem>();
        gameState.playerGems.forEach(gem => this._paintGemOnGrid(gem, playerGrid, playerGemMap));
        const playerResult = tracePath(playerGrid, playerGemMap, emitterId, this);

        // 3. Create log entry
        const logEntry = {
            waveId: emitterId,
            result,
            path: result.path,
            playerPath: playerResult.path,
            playerResult: playerResult
        };
        gameState.log.push(logEntry);
        
        this.ui.addLogEntry(logEntry, emitterId);
        this.setSelectedWave(emitterId, emitterId);
    }

    checkSolution() {
        // 1. Prepare player grid
        const playerGrid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(CellState.EMPTY));
        const playerGemMap = new Map<string, Gem>();
        gameState.playerGems.forEach(gem => this._paintGemOnGrid(gem, playerGrid, playerGemMap));
    
        // 2. Get all emitter IDs
        const allEmitterIds: string[] = [];
        for (let i = 1; i <= GRID_WIDTH; i++) {
            allEmitterIds.push(`T${i}`, `B${i}`);
        }
        for (let i = 1; i <= GRID_HEIGHT; i++) {
            allEmitterIds.push(`L${i}`, `R${i}`);
        }
    
        let isCorrect = true;
        
        // 3. Iterate and compare results for each emitter
        for (const emitterId of allEmitterIds) {
            // Trace on secret grid
            const secretResult = tracePath(this.secretGrid, this.secretGemMap, emitterId, this);
            
            // Trace on player grid
            const playerResult = tracePath(playerGrid, playerGemMap, emitterId, this);
    
            // Compare results by sorting colors to handle order differences.
            const secretColorsKey = [...secretResult.colors].sort().join(',');
            const playerColorsKey = [...playerResult.colors].sort().join(',');
    
            if (secretResult.exitId !== playerResult.exitId || secretColorsKey !== playerColorsKey) {
                isCorrect = false;
                break; // One mismatch is enough to fail.
            }
        }
    
        // 4. Show the end screen with the result
        this.showEndScreen(isCorrect);
    }

    addPlayerGem(gemName: string, x: number, y: number) {
        const alreadyPlaced = gameState.playerGems.some(gem => gem.name === gemName);
        if (alreadyPlaced) return;

        const gemDef = this.getGemDefinition(gemName);
        if (!gemDef) return;

        const newGem: Gem = { 
            id: `player_${Date.now()}`, 
            name: gemName, 
            x, y, 
            rotation: 0,
            isFlipped: false,
            isFlippable: isShapeFlippable(gemDef.gridPattern),
            gridPattern: gemDef.gridPattern,
            isValid: false
        };
        
        const height = newGem.gridPattern.length;
        const width = newGem.gridPattern[0].length;
        newGem.x = Math.max(0, Math.min(x, GRID_WIDTH - width));
        newGem.y = Math.max(0, Math.min(y, GRID_HEIGHT - height));
        
        gameState.playerGems.push(newGem);
        this._revalidateAllPlayerGems();
        this._updateActivePlayerPathPreview();

        this.updateSolutionButtonState();
        this.ui.updateToolbar();
        this.ui.redrawAll();
    }

    movePlayerGem(id: string, newX: number, newY: number) {
        const gem = gameState.playerGems.find(g => g.id === id);
        if (gem) {
            const height = gem.gridPattern.length;
            const width = gem.gridPattern[0].length;
            gem.x = Math.max(0, Math.min(newX, GRID_WIDTH - width));
            gem.y = Math.max(0, Math.min(newY, GRID_HEIGHT - height));
            
            this._revalidateAllPlayerGems();
            this._updateActivePlayerPathPreview();
            this.updateSolutionButtonState();
            this.ui.redrawAll();
        }
    }

    removePlayerGem(id: string) {
        const gemIndex = gameState.playerGems.findIndex(g => g.id === id);
        if (gemIndex > -1) {
            gameState.playerGems.splice(gemIndex, 1);
            
            this._revalidateAllPlayerGems();
            this._updateActivePlayerPathPreview();
            this.updateSolutionButtonState();
            this.ui.updateToolbar();
            this.ui.redrawAll();
        }
    }

    rotatePlayerGem(id: string) {
        const gem = gameState.playerGems.find(g => g.id === id);
        if (gem) {
            const oldWidth = gem.gridPattern[0].length;
            const oldHeight = gem.gridPattern.length;

            // 1. Calculate center point before rotation
            const centerX = gem.x + oldWidth / 2;
            const centerY = gem.y + oldHeight / 2;

            // 2. Rotate pattern and update dimensions
            gem.rotation = (gem.rotation + 90) % 360;
            gem.gridPattern = rotateGridPattern(gem.gridPattern);
            const newWidth = gem.gridPattern[0].length;
            const newHeight = gem.gridPattern.length;

            // 3. Calculate new top-left based on center and round it
            gem.x = Math.round(centerX - newWidth / 2);
            gem.y = Math.round(centerY - newHeight / 2);

            // 4. Clamp to grid boundaries as a safeguard
            gem.x = Math.max(0, Math.min(gem.x, GRID_WIDTH - newWidth));
            gem.y = Math.max(0, Math.min(gem.y, GRID_HEIGHT - newHeight));

            // 5. Revalidate and redraw
            this._revalidateAllPlayerGems();
            this._updateActivePlayerPathPreview();
            this.updateSolutionButtonState();
            this.ui.redrawAll();
        }
    }
    
    flipPlayerGem(id: string) {
        const gem = gameState.playerGems.find(g => g.id === id);
        if (gem && gem.isFlippable) {
            gem.isFlipped = !gem.isFlipped;
            gem.gridPattern = flipGridPatternHorizontally(gem.gridPattern);

            // Bounding box does not change on flip, so no need to re-center.
            // But validation is crucial.
            this._revalidateAllPlayerGems();
            this._updateActivePlayerPathPreview();
            this.updateSolutionButtonState();
            this.ui.redrawAll();
        }
    }
    
    public canPlaceGem(gemToTest: { id?: string; name: string; x: number; y: number; gridPattern: CellState[][] }): boolean {
        // This is used for the drag preview, so we check against all player gems
        return this._isPlacementValid(gemToTest, gameState.playerGems);
    }
    
    public setSelectedWave(logEntryWaveId: string | null, sourceEmitterId: string | null) {
        gameState.selectedLogEntryWaveId = logEntryWaveId;
        gameState.previewSourceEmitterId = sourceEmitterId;
        this._updateActivePlayerPathPreview();
        this.ui.handleSelectionChange();
    }

    private _updateActivePlayerPathPreview() {
        if (!gameState.previewSourceEmitterId) {
            gameState.activePlayerPath = null;
            gameState.activePlayerResult = null;
            return;
        }
    
        const playerGrid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(CellState.EMPTY));
        const playerGemMap = new Map<string, Gem>();
        gameState.playerGems.forEach(gem => this._paintGemOnGrid(gem, playerGrid, playerGemMap));
        const playerResult = tracePath(playerGrid, playerGemMap, gameState.previewSourceEmitterId, this);
        
        gameState.activePlayerPath = playerResult.path;
        gameState.activePlayerResult = playerResult;
    }

    private _revalidateAllPlayerGems() {
        gameState.playerGems.forEach(gem => {
            gem.isValid = this._isPlacementValid(gem, gameState.playerGems);
        });
    }

    private _doGemsCollide(gemA: GemPlacementInfo, gemB: GemPlacementInfo): boolean {
        const heightA = gemA.gridPattern.length;
        const widthA = gemA.gridPattern[0].length;
        const heightB = gemB.gridPattern.length;
        const widthB = gemB.gridPattern[0].length;

        const gemDefA = this.getGemDefinition(gemA.name);
        const gemDefB = this.getGemDefinition(gemB.name);
        const isSchwarzInvolved = gemDefA?.special === 'absorbs' || gemDefB?.special === 'absorbs';
    
        // Check every cell of gem A against every cell of gem B
        for (let rA = 0; rA < heightA; rA++) {
            for (let cA = 0; cA < widthA; cA++) {
                const cellAState = gemA.gridPattern[rA][cA];
                if (cellAState === CellState.EMPTY) continue;
    
                const worldXA = gemA.x + cA;
                const worldYA = gemA.y + rA;
    
                for (let rB = 0; rB < heightB; rB++) {
                    for (let cB = 0; cB < widthB; cB++) {
                        const cellBState = gemB.gridPattern[rB][cB];
                        if (cellBState === CellState.EMPTY) continue;
                        
                        const worldXB = gemB.x + cB;
                        const worldYB = gemB.y + rB;
    
                        const dx = Math.abs(worldXA - worldXB);
                        const dy = Math.abs(worldYA - worldYB);
                        
                        if (isSchwarzInvolved) {
                            // For Schwarz, any adjacency (including corners) is a collision.
                            if (dx <= 1 && dy <= 1) {
                                return true;
                            }
                        } else {
                            // For other gems, check for overlap and edge adjacency.
                            // 1. Overlap
                            if (dx === 0 && dy === 0) {
                                return true;
                            }
                            // 2. Edge adjacency
                            if (dx + dy === 1) {
                                const edgesA = cellEdges[cellAState];
                                const edgesB = cellEdges[cellBState];
    
                                if (worldXA < worldXB) { // A left of B
                                    if (edgesA[1] && edgesB[3]) return true;
                                } else if (worldXA > worldXB) { // A right of B
                                    if (edgesA[3] && edgesB[1]) return true;
                                } else if (worldYA < worldYB) { // A above B
                                    if (edgesA[2] && edgesB[0]) return true;
                                } else { // A below B (worldYA > worldYB)
                                    if (edgesA[0] && edgesB[2]) return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }
    

    private _isPlacementValid(
        gemToTest: GemPlacementInfo,
        allPlacedGems: Gem[]
    ): boolean {
        const { gridPattern, x, y, id } = gemToTest;
        const height = gridPattern.length;
        const width = gridPattern[0].length;
    
        if (x < 0 || y < 0 || x + width > GRID_WIDTH || y + height > GRID_HEIGHT) {
            return false;
        }
    
        for (const otherGem of allPlacedGems) {
            if (id && otherGem.id === id) continue;
            if (this._doGemsCollide(gemToTest, otherGem)) {
                return false;
            }
        }
        return true;
    }

    private _paintGemOnGrid(gem: Gem, grid: CellState[][], gemMap?: Map<string, Gem>) {
        const { gridPattern, x, y } = gem;
        for (let r = 0; r < gridPattern.length; r++) {
            for (let c = 0; c < gridPattern[r].length; c++) {
                const cellState = gridPattern[r][c];
                if (cellState !== CellState.EMPTY) {
                    if(grid[y + r] && grid[y + r][x + c] !== undefined) {
                       grid[y + r][x + c] = cellState;
                       gemMap?.set(`${y+r},${x+c}`, gem);
                    }
                }
            }
        }
    }

    updateSolutionButtonState() {
        const isCustom = gameState.difficulty === DIFFICULTIES.CUSTOM;
        const requiredCount = isCustom 
            ? gameState.customGemSet.length
            : GEM_SETS[gameState.difficulty!]?.length ?? 0;
            
        const allValid = gameState.playerGems.every(gem => gem.isValid);
        const correctCount = gameState.playerGems.length === requiredCount;
        this.ui.checkSolutionBtn.disabled = !(allValid && correctCount);
    }
    
    private _placeSecretGems(): Gem[] {
        const placedGems: Gem[] = [];
        const isCustom = gameState.difficulty === DIFFICULTIES.CUSTOM;
        const gemSet = isCustom ? gameState.customGemSet : GEM_SETS[gameState.difficulty!];

        if (!gemSet || gemSet.length === 0) {
            console.error("Gem set is empty for difficulty:", gameState.difficulty);
            return [];
        }

        let attempts = 0;

        while(placedGems.length < gemSet.length && attempts < 500) {
            attempts++;
            placedGems.length = 0;

            for (const gemName of gemSet) {
                const gemDef = this.getGemDefinition(gemName);
                if (!gemDef) continue;
                
                let placed = false;
                let singleGemAttempts = 0;
                
                while(!placed && singleGemAttempts < 200) {
                    singleGemAttempts++;

                    const isFlippable = isShapeFlippable(gemDef.gridPattern);
                    const shouldFlip = isFlippable && Math.random() < 0.5;

                    let pattern = gemDef.gridPattern;
                    if (shouldFlip) {
                        pattern = flipGridPatternHorizontally(pattern);
                    }

                    const rotCount = Math.floor(Math.random() * 4);
                    for (let i = 0; i < rotCount; i++) pattern = rotateGridPattern(pattern);

                    const effH = pattern.length;
                    const effW = pattern[0].length;
                    
                    if (GRID_WIDTH < effW || GRID_HEIGHT < effH) continue;

                    const x = Math.floor(Math.random() * (GRID_WIDTH - effW + 1));
                    const y = Math.floor(Math.random() * (GRID_HEIGHT - effH + 1));

                    const newGem: Gem = {
                        id: `secret_${gemName}_${placedGems.length}`,
                        name: gemName, x, y, rotation: rotCount * 90, 
                        isFlipped: shouldFlip,
                        isFlippable: isFlippable,
                        gridPattern: pattern
                    };

                    if (this._isPlacementValid(newGem, placedGems)) {
                        placedGems.push(newGem);
                        placed = true;
                    }
                }
                if (!placed) break;
            }
        }

        if (placedGems.length !== gemSet.length) {
            console.error("Failed to place all secret gems!");
            alert("Fehler bei der Level-Erstellung. Bitte versuchen Sie es erneut.");
            return [];
        }

        placedGems.forEach(gem => this._paintGemOnGrid(gem, this.secretGrid, this.secretGemMap));
        console.log("Secret gems placed:", placedGems);
        return placedGems;
    }
}