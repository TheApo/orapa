
import { Game } from './game';
import { GEMS, GEM_SETS, COLORS, COLOR_MIXING, DIFFICULTIES, COLOR_NAMES } from './constants';
import { gameState, Gem, LogEntry, GameStatus } from './state';
import { CellState, GRID_WIDTH, GRID_HEIGHT } from './grid';
import { EmitterButton } from './ui-objects';

type DragInfo = {
    name: string;
    from: 'toolbar' | 'board';
    gridPattern: CellState[][];
    element?: HTMLElement; // for toolbar item
    id?: string; // for board gem
    offsetX: number;
    offsetY: number;
};


export class UI {
    game!: Game;

    // Screen Elements
    screens: { [key: string]: HTMLElement } = {};
    
    // Main Menu Elements
    btnStartGame!: HTMLButtonElement;
    introRulesEl!: HTMLElement;

    // Difficulty Screen Elements
    difficultyOptions!: HTMLDivElement;
    btnBackToMain1!: HTMLButtonElement;
    
    // Game Screen Elements
    boardWrapper!: HTMLElement;
    gemCanvas!: HTMLCanvasElement;
    gemCtx!: CanvasRenderingContext2D;
    pathOverlay!: HTMLCanvasElement;
    pathCtx!: CanvasRenderingContext2D;
    gemToolbar!: HTMLElement;
    logList!: HTMLElement;
    actionsTabBtn!: HTMLButtonElement;
    logTabBtn!: HTMLButtonElement;
    rulesTabBtn!: HTMLButtonElement;
    checkSolutionBtn!: HTMLButtonElement;
    giveUpBtn!: HTMLButtonElement;
    previewToggle!: HTMLInputElement;
    rulesPanel!: HTMLElement;
    
    // End Screen Elements
    endTitle!: HTMLElement;
    endStats!: HTMLElement;
    endRetryMessage!: HTMLElement;
    endSolutionCanvas!: HTMLCanvasElement;
    endSolutionCtx!: CanvasRenderingContext2D;
    endSolutionLabel!: HTMLElement;
    btnNewLevel!: HTMLButtonElement;
    btnMenu!: HTMLButtonElement;
    
    // Canvas interaction state
    private emitters: EmitterButton[] = [];
    private focusedEmitterId: string | null = null;
    
    // Drag & Drop State
    private dragStartInfo: { item: DragInfo, startX: number, startY: number } | null = null;
    private isDragging = false;
    private draggedItemInfo: DragInfo | null = null;
    private dragPos = { x: 0, y: 0 };
    private lastValidDropTarget = { x: -1, y: -1, isValid: false };

    // Sizing state for the entire 12x10 board
    cellWidth = 0;
    cellHeight = 0;
    gap = 1;

    constructor() {
        this.cacheDOMElements();
        this.bindGlobalEvents();
        this._populateIntroRules();
    }

    bindGame(gameInstance: Game) {
        this.game = gameInstance;
    }
    
    private cacheDOMElements() {
        this.screens.main = document.getElementById('screen-main')!;
        this.screens.difficulty = document.getElementById('screen-difficulty')!;
        this.screens.game = document.getElementById('screen-game')!;
        this.screens.end = document.getElementById('screen-end')!;
        
        this.btnStartGame = document.getElementById('btn-start-game') as HTMLButtonElement;
        this.introRulesEl = document.getElementById('intro-rules')!;
        
        this.difficultyOptions = document.getElementById('difficulty-options') as HTMLDivElement;
        this.btnBackToMain1 = document.getElementById('btn-back-to-main-1') as HTMLButtonElement;

        this.boardWrapper = document.getElementById('game-board-wrapper')!;
        
        this.gemCanvas = document.getElementById('gem-canvas') as HTMLCanvasElement;
        this.gemCtx = this.gemCanvas.getContext('2d')!;
        this.pathOverlay = document.getElementById('path-overlay') as HTMLCanvasElement;
        this.pathCtx = this.pathOverlay.getContext('2d')!;
        
        this.gemToolbar = document.getElementById('gem-toolbar')!;
        this.logList = document.getElementById('log-list')!;
        this.actionsTabBtn = document.getElementById('actions-tab-btn') as HTMLButtonElement;
        this.logTabBtn = document.getElementById('log-tab-btn') as HTMLButtonElement;
        this.rulesTabBtn = document.getElementById('rules-tab-btn') as HTMLButtonElement;
        this.rulesPanel = document.getElementById('rules-panel') as HTMLElement;
        this.checkSolutionBtn = document.getElementById('check-solution-btn') as HTMLButtonElement;
        this.giveUpBtn = document.getElementById('give-up-btn') as HTMLButtonElement;
        this.previewToggle = document.getElementById('preview-toggle') as HTMLInputElement;
        
        this.endTitle = document.getElementById('end-title')!;
        this.endStats = document.getElementById('end-stats')!;
        this.endRetryMessage = document.getElementById('end-retry-message')!;
        this.endSolutionCanvas = document.getElementById('end-solution-canvas') as HTMLCanvasElement;
        this.endSolutionCtx = this.endSolutionCanvas.getContext('2d')!;
        this.endSolutionLabel = document.getElementById('end-solution-label')!;
        this.btnNewLevel = document.getElementById('btn-new-level') as HTMLButtonElement;
        this.btnMenu = document.getElementById('btn-menu') as HTMLButtonElement;
    }

    private bindGlobalEvents() {
        this.btnStartGame.addEventListener('click', () => this.game.showDifficultySelect());
        this.btnNewLevel.addEventListener('click', () => {
            if (gameState.difficulty) this.game.start(gameState.difficulty);
        });
        this.btnMenu.addEventListener('click', () => this.game.showMainMenu());
        this.btnBackToMain1.addEventListener('click', () => this.game.showMainMenu());
        
        this.actionsTabBtn.addEventListener('click', () => this.switchTab('actions'));
        this.logTabBtn.addEventListener('click', () => this.switchTab('log'));
        this.rulesTabBtn.addEventListener('click', () => this.switchTab('rules'));
        
        this.checkSolutionBtn.addEventListener('click', () => this.game.checkSolution());
        this.giveUpBtn.addEventListener('click', () => this.game.giveUp());
        this.previewToggle.addEventListener('change', () => this.game.togglePlayerPathPreview());

        // Keyboard navigation and actions
        this.gemCanvas.addEventListener('keydown', (e) => this.handleCanvasKeyDown(e));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'n' && (gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.GAME_OVER)) {
                if (gameState.difficulty) this.game.start(gameState.difficulty);
                return;
            }
            if (e.key === 'Escape' && (gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.GAME_OVER)) {
                this.game.showMainMenu();
                return;
            }
            if (gameState.status === GameStatus.PLAYING) {
                if (e.key === 'd') this.game.toggleDebugMode();
                if (e.key === 'f') this.game.togglePlayerPathPreview();
            }
        });
        
        // This global click listener handles deselecting waves when clicking outside interactive areas.
        document.addEventListener('click', (e) => this.handleGlobalClick(e));

        // Canvas interactions (handled specifically)
        this.logList.addEventListener('click', (e) => this.handleLogClick(e));

        // Global pointer events for robust drag & drop (mouse and touch)
        document.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        document.addEventListener('touchstart', (e) => this.handlePointerDown(e), { passive: false });
        document.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        document.addEventListener('touchmove', (e) => this.handlePointerMove(e), { passive: false });
        document.addEventListener('mouseup', (e) => this.handlePointerUp(e));
        document.addEventListener('touchend', (e) => this.handlePointerUp(e));

        this.logList.addEventListener('animationend', () => {
            this.logList.classList.remove('flash');
        });
    }

    private handleGlobalClick(e: MouseEvent) {
        if (!gameState.selectedLogEntryWaveId) return;
    
        const target = e.target as HTMLElement;
    
        // If the click is on an element that manages its own selection, do nothing.
        // Let the specific handlers for the canvas and log list do their work.
        const isInteractive = target.closest('#gem-canvas') || target.closest('#log-list li') || target.closest('.preview-toggle-wrapper');
    
        if (!isInteractive) {
            this.game.setSelectedWave(null, null);
        }
    }
    
    setupGameUI() {
        this._populateRulesPanel();
        this.switchTab('actions');
        this._createEmitterObjects();
        this.updateToolbar();
        this.logList.innerHTML = '';
        this.updateLogTabCounter(); // Reset log counter text
        this.clearPath();
        this.game.updateSolutionButtonState();
        this.updatePreviewToggleState(gameState.showPlayerPathPreview);
        
        const ro = new ResizeObserver(() => this.onBoardResize());
        ro.observe(this.boardWrapper);
        this.onBoardResize();
    }

    showScreen(screenName: 'main' | 'difficulty' | 'game' | 'end') {
        if (screenName === 'difficulty') this.populateDifficultyOptions();
        
        Object.values(this.screens).forEach(s => s.classList.add('hidden'));
        this.screens[screenName].classList.remove('hidden');

        if (screenName === 'game') {
            this.gemCanvas.focus();
        }
    }

    private populateDifficultyOptions() {
        this.difficultyOptions.innerHTML = '';
        const descs: {[key:string]: string} = {
            [DIFFICULTIES.TRAINING]: "Ideal zum Lernen des Spiels, mit dem Verlauf der Lichtstrahlen.",
            [DIFFICULTIES.NORMAL]: "Die Grundlagen. Lerne die farbigen und weissen Steine kennen.",
            [DIFFICULTIES.MITTEL]: "Eine neue Herausforderung. Ein transparenter Prisma-Stein lenkt das Licht ab, ohne es zu färben.",
            [DIFFICULTIES.SCHWER]: "Expertenmodus. Neben dem transparenten kommt ein schwarzer, Licht absorbierender Stein in Spiel."
        };
        Object.values(DIFFICULTIES).forEach(diff => {
            const btn = document.createElement('button');
            btn.innerHTML = `${diff}<div class="difficulty-desc">${descs[diff]}</div>`;
            btn.onclick = () => this.game.start(diff);
            this.difficultyOptions.appendChild(btn);
        });
    }

    private _createEmitterObjects() {
        this.emitters = [];
        for (let i = 0; i < GRID_WIDTH; i++) this.emitters.push(new EmitterButton(`T${i + 1}`, `T${i + 1}`));
        for (let i = 0; i < GRID_WIDTH; i++) this.emitters.push(new EmitterButton(`B${i + 1}`, `B${i + 1}`));
        for (let i = 0; i < GRID_HEIGHT; i++) this.emitters.push(new EmitterButton(`L${i + 1}`, `L${i + 1}`));
        for (let i = 0; i < GRID_HEIGHT; i++) this.emitters.push(new EmitterButton(`R${i + 1}`, `R${i + 1}`));
        
        if (this.emitters.length > 0) {
            this.focusedEmitterId = this.emitters[0].id;
        }
    }
    
    private onBoardResize() {
        const wrapperRect = this.boardWrapper.getBoundingClientRect();
        if (wrapperRect.width === 0 || wrapperRect.height === 0) return;
    
        const totalGridCols = GRID_WIDTH + 2;
        const totalGridRows = GRID_HEIGHT + 2;
    
        this.cellWidth = (wrapperRect.width - (totalGridCols - 1) * this.gap) / totalGridCols;
        this.cellHeight = (wrapperRect.height - (totalGridRows - 1) * this.gap) / totalGridRows;
        
        const dpr = window.devicePixelRatio || 1;
        [this.pathOverlay, this.gemCanvas].forEach(canvas => {
            canvas.width = wrapperRect.width * dpr;
            canvas.height = wrapperRect.height * dpr;
            canvas.style.width = `${wrapperRect.width}px`;
            canvas.style.height = `${wrapperRect.height}px`;
            const ctx = canvas.getContext('2d')!;
            ctx.scale(dpr, dpr);
        });
        
        this.emitters.forEach(emitter => {
            const id = emitter.id;
            const num = parseInt(id.substring(1)) - 1;
            let col = 0, row = 0;
            switch(id[0]) {
                case 'T': col = num + 1; row = 0; break;
                case 'B': col = num + 1; row = totalGridRows - 1; break;
                case 'L': col = 0; row = num + 1; break;
                case 'R': col = totalGridCols - 1; row = num + 1; break;
            }
            emitter.rect.x = col * (this.cellWidth + this.gap);
            emitter.rect.y = row * (this.cellHeight + this.gap);
            emitter.rect.width = this.cellWidth;
            emitter.rect.height = this.cellHeight;
        });

        this.redrawAll();
    }

    private _getGemTooltip(gemName: string): string {
        const gemDef = GEMS[gemName];
        if (!gemDef) return '';
    
        switch (gemName) {
            case 'TRANSPARENT': return "Reflektiert nur, färbt nicht.";
            case 'SCHWARZ': return "Absorbiert Licht.";
            default:
                if (gemDef.baseGems && gemDef.baseGems.length > 0) {
                    const colorKey = gemDef.baseGems[0];
                    const colorDisplayName = COLOR_NAMES[colorKey]?.toLowerCase();
                    return `Fügt Farbe '${colorDisplayName}' hinzu.`;
                }
                return `Edelstein ${gemName}`;
        }
    }

    updateToolbar() {
        this.gemToolbar.innerHTML = '';
        if (!gameState.difficulty) return;
        const placedGemNames = new Set(gameState.playerGems.map(g => g.name));
        GEM_SETS[gameState.difficulty].forEach(gemName => {
            const gemDef = GEMS[gemName];
            const div = document.createElement('div');
            div.className = 'toolbar-gem';
            if (placedGemNames.has(gemName)) div.classList.add('placed');
            div.dataset.gemName = gemName;
            div.title = this._getGemTooltip(gemName);
            const canvas = document.createElement('canvas');
            canvas.className = 'toolbar-gem-canvas';
            div.appendChild(canvas);
            this.gemToolbar.appendChild(div);
            setTimeout(() => this.drawToolbarGem(canvas, gemDef), 0);
        });
    }

    private drawToolbarGem(canvas: HTMLCanvasElement, gemDef: any) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        if (rect.width === 0 || rect.height === 0) return;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const pattern = gemDef.gridPattern;
        const pHeight = pattern.length;
        const pWidth = pattern[0].length;
        const maxDim = Math.max(pWidth, pHeight);
        
        const cellW = rect.width / maxDim;
        const cellH = rect.height / maxDim;
        const offsetX = (rect.width - pWidth * cellW) / 2;
        const offsetY = (rect.height - pHeight * cellH) / 2;

        for (let r = 0; r < pHeight; r++) {
            for (let c = 0; c < pWidth; c++) {
                const state = pattern[r][c];
                if (state !== CellState.EMPTY) {
                    this.drawCellShape(ctx, c * cellW + offsetX, r * cellH + offsetY, cellW, cellH, state, gemDef.color);
                }
            }
        }
    }
    
    public handleSelectionChange() {
        this.redrawAll();
        this.updateLogHighlight();
    }
    
    redrawAll() {
        if (this.gemCanvas.width === 0) return; 
        const ctx = this.gemCtx;
        ctx.clearRect(0, 0, this.gemCanvas.width, this.gemCanvas.height);
        
        this._drawBoardBackgroundAndGrid(ctx);

        const selectedLog = gameState.selectedLogEntryWaveId ? gameState.log.find(l => l.waveId === gameState.selectedLogEntryWaveId) : null;

        this.emitters.forEach(e => {
            let isSelected = false;
            if (selectedLog) {
                isSelected = (e.id === selectedLog.waveId || e.id === selectedLog.result.exitId);
            }
            e.draw(ctx, isSelected);
        });

        this.clearPath();
        
        if (selectedLog) {
            // Draw Solution Path (in training/debug)
            const shouldShowSolutionPath = gameState.difficulty === DIFFICULTIES.TRAINING || gameState.debugMode;
            if (shouldShowSolutionPath && selectedLog.path) {
                const color = this.getPathColor(selectedLog.result);
                this.drawPath(selectedLog.path, color, false);
            }
        }
        
        // Draw Player Path Preview (Live)
        if (gameState.showPlayerPathPreview && gameState.activePlayerPath && gameState.activePlayerResult) {
            const playerColor = this.getPathColor(gameState.activePlayerResult);
            this.drawPath(gameState.activePlayerPath, playerColor, true);
        }

        if(gameState.status === GameStatus.PLAYING) {
            if (gameState.debugMode) this.drawDebugSolution(ctx);
            
            this.drawPlayerGems(ctx);
            this._drawSelectedWaveTooltip(ctx);

            if (this.isDragging && this.draggedItemInfo) {
                this.drawDragPreview(ctx);
            }
        }
    }
    
    private drawDragPreview(ctx: CanvasRenderingContext2D) {
        if (!this.draggedItemInfo) return;
        const { gridPattern, name, id } = this.draggedItemInfo;
        const gemDef = GEMS[name];
        
        const pWidth = gridPattern[0].length;
        const pHeight = gridPattern.length;
        
        const gridXFloat = (this.dragPos.x / (this.cellWidth + this.gap)) - 1 - (pWidth / 2) + 0.5;
        const gridYFloat = (this.dragPos.y / (this.cellHeight + this.gap)) - 1 - (pHeight / 2) + 0.5;

        const gridX = Math.round(gridXFloat);
        const gridY = Math.round(gridYFloat);

        const gemToTest = { id, x: gridX, y: gridY, gridPattern };
        this.lastValidDropTarget.isValid = this.game.canPlaceGem(gemToTest);
        this.lastValidDropTarget.x = gridX;
        this.lastValidDropTarget.y = gridY;

        ctx.save();
        ctx.globalAlpha = 0.7;
        for (let r = 0; r < pHeight; r++) {
            for (let c = 0; c < pWidth; c++) {
                if (gridPattern[r][c] !== CellState.EMPTY) {
                    const canvasCoords = this._gridToCanvasCoords(gridX + c, gridY + r);
                    this.drawCellShape(ctx, canvasCoords.x, canvasCoords.y, this.cellWidth, this.cellHeight, gridPattern[r][c], gemDef.color, !this.lastValidDropTarget.isValid);
                }
            }
        }
        ctx.restore();
    }


    private drawPlayerGems(ctx: CanvasRenderingContext2D) {
        for (const gem of gameState.playerGems) {
            if (this.isDragging && this.draggedItemInfo?.from === 'board' && this.draggedItemInfo.id === gem.id) continue;
            
            const { gridPattern, x, y, name } = gem;
            const color = GEMS[name].color;
            const isInvalid = !gem.isValid;
            
            let isHovered = false;
            if (!this.isDragging) {
                 isHovered = this.getGemAtCanvasPos(this.dragPos.x, this.dragPos.y)?.id === gem.id;
            }

            for (let r = 0; r < gridPattern.length; r++) {
                for (let c = 0; c < gridPattern[r].length; c++) {
                    const state = gridPattern[r][c];
                    if (state !== CellState.EMPTY) {
                        const canvasCoords = this._gridToCanvasCoords(x + c, y + r);
                        this.drawCellShape(ctx, canvasCoords.x, canvasCoords.y, this.cellWidth, this.cellHeight, state, color, isInvalid, isHovered);
                    }
                }
            }
        }
    }
    
    private _drawBoardBackgroundAndGrid(ctx: CanvasRenderingContext2D) {
        ctx.save();
        
        const surfaceColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-color');
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
        
        ctx.fillStyle = surfaceColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = borderColor;
        ctx.fillRect(this.cellWidth + this.gap/2, this.cellHeight + this.gap/2, 
                     (GRID_WIDTH) * this.cellWidth + (GRID_WIDTH + 1) * this.gap, 
                     (GRID_HEIGHT) * this.cellHeight + (GRID_HEIGHT + 1) * this.gap);

        ctx.fillStyle = surfaceColor;
        ctx.fillRect(this.cellWidth + this.gap, this.cellHeight + this.gap, 
            (GRID_WIDTH) * this.cellWidth + (GRID_WIDTH - 1) * this.gap, 
            (GRID_HEIGHT) * this.cellHeight + (GRID_HEIGHT - 1) * this.gap);

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = this.gap;
        ctx.beginPath();
        for (let i = 1; i < GRID_WIDTH; i++) {
            const x = (i+1) * (this.cellWidth + this.gap) - this.gap/2;
            ctx.moveTo(x, this.cellHeight + this.gap);
            ctx.lineTo(x, (GRID_HEIGHT+1) * (this.cellHeight + this.gap) );
        }
        for (let i = 1; i < GRID_HEIGHT; i++) {
            const y = (i+1) * (this.cellHeight + this.gap) - this.gap/2;
            ctx.moveTo(this.cellWidth + this.gap, y);
            ctx.lineTo((GRID_WIDTH+1) * (this.cellWidth + this.gap), y);
        }
        ctx.stroke();
        
        ctx.restore();
    }

    private drawDebugSolution(ctx: CanvasRenderingContext2D) {
        if (!this.game.secretGrid || gameState.secretGems.length === 0) return;
        ctx.save();
    
        for (const gem of gameState.secretGems) {
            const { gridPattern, x, y, name } = gem;
            const color = GEMS[name].color;
    
            ctx.globalAlpha = 0.2; // All solution gems are transparent in debug mode
    
            for (let r = 0; r < gridPattern.length; r++) {
                for (let c = 0; c < gridPattern[r].length; c++) {
                    const state = gridPattern[r][c];
                    if (state !== CellState.EMPTY) {
                        const canvasCoords = this._gridToCanvasCoords(x + c, y + r);
                        this.drawCellShape(ctx, canvasCoords.x, canvasCoords.y, this.cellWidth, this.cellHeight, state, color);
                    }
                }
            }
        }
        ctx.restore();
    }
    
    private drawCellShape(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, state: CellState, color: string, isInvalid = false, isHovered = false) {
        ctx.save();
        
        // Default styles
        if (color === COLORS.TRANSPARENT) {
            ctx.fillStyle = 'rgba(164, 212, 228, 0.3)';
            ctx.strokeStyle = '#a4d4e4';
            ctx.lineWidth = 2;
        } else if (color === COLORS.SCHWARZ_GEM) {
            ctx.fillStyle = color;
            ctx.strokeStyle = '#555'; // Lighter border for contrast
            ctx.lineWidth = 1;
        } else {
            ctx.fillStyle = color;
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;
        }
    
        // Overrides
        if (isInvalid) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
            ctx.strokeStyle = COLORS.INVALID_GEM;
            ctx.lineWidth = 2;
        }
        if (isHovered && !isInvalid) {
             ctx.shadowColor = 'white';
             ctx.shadowBlur = 10;
        }
    
        ctx.beginPath();
        const path = new Path2D();
        switch (state) {
            case CellState.BLOCK:
            case CellState.ABSORB:
                path.rect(x, y, w, h); break;
            case CellState.TRIANGLE_TL:
                path.moveTo(x, y); path.lineTo(x + w, y); path.lineTo(x, y + h); path.closePath(); break;
            case CellState.TRIANGLE_TR:
                path.moveTo(x, y); path.lineTo(x + w, y); path.lineTo(x + w, y + h); path.closePath(); break;
            case CellState.TRIANGLE_BR:
                path.moveTo(x + w, y); path.lineTo(x + w, y + h); path.lineTo(x, y + h); path.closePath(); break;
            case CellState.TRIANGLE_BL:
                path.moveTo(x, y); path.lineTo(x, y + h); path.lineTo(x + w, y + h); path.closePath(); break;
        }
        ctx.fill(path);
        ctx.stroke(path);
        ctx.restore();
    }

    private _gridToCanvasCoords(gridX: number, gridY: number): { x: number; y: number } {
        return {
            x: (gridX + 1) * (this.cellWidth + this.gap),
            y: (gridY + 1) * (this.cellHeight + this.gap),
        };
    }

    private _canvasToGridCoords(canvasX: number, canvasY: number): { x: number; y: number } {
        return {
            x: Math.floor(canvasX / (this.cellWidth + this.gap)) - 1,
            y: Math.floor(canvasY / (this.cellHeight + this.gap)) - 1,
        }
    }
    
    private getPathColor(result: { colors: string[], absorbed?: boolean }): string {
        if (result.absorbed) return COLORS.ABSORBIERT;
        if (result.colors.length === 0) return 'rgba(236, 240, 241, 0.7)';
        const key = [...result.colors].sort().join(',');
        return COLOR_MIXING[key] || '#ccc';
    }

    private drawPath(path: {x:number, y:number}[], color: string, isPreview: boolean = false) {
        if (path.length < 2) return;
    
        const ctx = this.pathCtx;
        ctx.save();
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 5;

        if (isPreview) {
            ctx.globalAlpha = 0.6;
            ctx.setLineDash([8, 6]);
        }
    
        ctx.beginPath();
    
        const gridStartX = this.cellWidth + this.gap;
        const gridStartY = this.cellHeight + this.gap;
        const stepX = this.cellWidth + this.gap;
        const stepY = this.cellHeight + this.gap;

        const p2c = (p: {x: number, y: number}) => {
            const canvasX = gridStartX + p.x * stepX;
            const canvasY = gridStartY + p.y * stepY;
            return { x: canvasX, y: canvasY };
        };
        
        const firstPoint = p2c(path[0]);
        ctx.moveTo(firstPoint.x, firstPoint.y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(p2c(path[i]).x, p2c(path[i]).y);
        }
        ctx.stroke();
        ctx.restore();
    }

    private clearPath() {
        this.pathCtx.clearRect(0, 0, this.pathOverlay.width, this.pathOverlay.height);
    }
    
    switchTab(tabName: 'actions' | 'log' | 'rules') {
        document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => el.classList.remove('active'));
        document.getElementById(`${tabName}-tab-btn`)!.classList.add('active');
        document.getElementById(`${tabName}-panel`)!.classList.add('active');
    }

    addLogEntry(logEntry: LogEntry, waveId: string) {
        const li = document.createElement('li');
        li.dataset.waveId = waveId;
        const { result } = logEntry;
        const resultText = `${waveId} ➔ ${result.exitId}`;
        const resultColor = this.getPathColor(result);
        const colorName = this._getPathColorName(result);
        li.innerHTML = `<span>${resultText}</span><div class="log-entry-result"><span class="log-color-name">${colorName}</span><div class="log-color-box" style="background-color: ${resultColor};"></div></div>`;
        
        this.logList.prepend(li);
        this.updateLogTabCounter();

        const startEmitter = this.emitters.find(e => e.id === waveId);
        if (startEmitter) {
            startEmitter.isUsed = true;
            startEmitter.usedColor = resultColor;
        }
        if (result.exitId && result.exitId !== 'Loop?') {
             const endEmitter = this.emitters.find(e => e.id === result.exitId);
             if (endEmitter) {
                endEmitter.isUsed = true;
                endEmitter.usedColor = resultColor;
             }
        }
    }

    private updateLogTabCounter() {
        const count = gameState.log.length;
        if (count > 0) {
            this.logTabBtn.textContent = `Logbuch (${count})`;
        } else {
            this.logTabBtn.textContent = 'Logbuch';
        }
    }
    
    private _getGemSetIdentifier(gems: Gem[]): string {
        // Create a canonical string representation of a gem set.
        // Sorting the resulting strings ensures that the order of gems in the array
        // doesn't affect the final identifier.
        return gems
            .map(g => `${g.name},${g.x},${g.y},${g.rotation}`)
            .sort()
            .join(';');
    }
    
    showEndScreen(isWin: boolean, waveCount: number, secretGems: Gem[], playerGems: Gem[]) {
        this.endTitle.classList.remove('win', 'loss');
        this.endRetryMessage.textContent = ''; // Clear it
        
        let playerSolutionToShow: Gem[] = [];
    
        if (isWin) {
            this.endTitle.textContent = 'Gewonnen!';
            this.endTitle.classList.add('win');
            this.endStats.textContent = `Du hast die Mine in ${waveCount} Abfragen gelöst!`;
    
            const secretIdentifier = this._getGemSetIdentifier(secretGems);
            const playerIdentifier = this._getGemSetIdentifier(playerGems);
    
            if (secretIdentifier === playerIdentifier) {
                this.endSolutionLabel.textContent = 'Korrekte Lösung:';
                playerSolutionToShow = []; // Only show the secret solution, as it's identical
            } else {
                this.endSolutionLabel.textContent = 'Alternative Lösung gefunden! Deine Lösung (transparent):';
                playerSolutionToShow = playerGems; // Show player's solution on top
            }
    
        } else {
            this.endTitle.textContent = 'Verloren!';
            this.endTitle.classList.add('loss');
            this.endStats.textContent = `Du hast ${waveCount} Abfragen gebraucht.`;
            this.endRetryMessage.textContent = 'Bitte versuche es erneut.';
            this.endSolutionLabel.textContent = 'Deine Eingabe (über der korrekten Lösung):';
            playerSolutionToShow = playerGems;
        }
    
        this.showScreen('end');
        requestAnimationFrame(() => {
            this.drawEndScreenSolution(this.endSolutionCtx, secretGems, playerSolutionToShow, this.emitters);
        });
    }

    private drawEndScreenSolution(ctx: CanvasRenderingContext2D, correctGems: Gem[], playerGems: Gem[], emitters: EmitterButton[]) {
        // 1. Setup canvas and dimensions
        const canvas = ctx.canvas;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
    
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        // 2. Calculate cell dimensions based on full board (with emitters)
        const gap = 1;
        const totalGridCols = GRID_WIDTH + 2;
        const totalGridRows = GRID_HEIGHT + 2;
        const cellWidth = (rect.width - (totalGridCols - 1) * gap) / totalGridCols;
        const cellHeight = (rect.height - (totalGridRows - 1) * gap) / totalGridRows;
    
        // Helper to draw a set of gems
        const drawGems = (gems: Gem[], opacity: number, highlightInvalid: boolean) => {
            ctx.save();
            ctx.globalAlpha = opacity;
            for (const gem of gems) {
                const color = GEMS[gem.name].color;
                const isInvalid = highlightInvalid ? !gem.isValid : false;
    
                for (let r = 0; r < gem.gridPattern.length; r++) {
                    for (let c = 0; c < gem.gridPattern[r].length; c++) {
                        const state = gem.gridPattern[r][c];
                        if (state !== CellState.EMPTY) {
                            const gridX = gem.x + c;
                            const gridY = gem.y + r;
                            const cellCanvasX = (gridX + 1) * (cellWidth + gap);
                            const cellCanvasY = (gridY + 1) * (cellHeight + gap);
                            this.drawCellShape(ctx, cellCanvasX, cellCanvasY, cellWidth, cellHeight, state, color, isInvalid);
                        }
                    }
                }
            }
            ctx.restore();
        };
    
        // 3. Draw board background and grid lines
        ctx.save();
        const surfaceColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-color');
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
        
        ctx.fillStyle = surfaceColor;
        ctx.fillRect(0, 0, rect.width, rect.height);
        
        ctx.fillStyle = borderColor;
        ctx.fillRect(cellWidth + gap / 2, cellHeight + gap / 2, 
                     (GRID_WIDTH) * cellWidth + (GRID_WIDTH + 1) * gap, 
                     (GRID_HEIGHT) * cellHeight + (GRID_HEIGHT + 1) * gap);
    
        ctx.fillStyle = surfaceColor;
        ctx.fillRect(cellWidth + gap, cellHeight + gap, 
                     GRID_WIDTH * (cellWidth + gap) - gap, 
                     GRID_HEIGHT * (cellHeight + gap) - gap);
    
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = gap;
        ctx.beginPath();
        for (let i = 1; i < GRID_WIDTH; i++) {
            const x = (i + 1) * (cellWidth + gap) - gap / 2;
            ctx.moveTo(x, cellHeight + gap);
            ctx.lineTo(x, (GRID_HEIGHT + 1) * (cellHeight + gap));
        }
        for (let i = 1; i < GRID_HEIGHT; i++) {
            const y = (i + 1) * (cellHeight + gap) - gap / 2;
            ctx.moveTo(cellWidth + gap, y);
            ctx.lineTo((GRID_WIDTH + 1) * (cellWidth + gap), y);
        }
        ctx.stroke();
        ctx.restore();
    
        // 4. Draw Emitters
        emitters.forEach(emitter => {
            const id = emitter.id;
            const num = parseInt(id.substring(1)) - 1;
            let col = 0, row = 0;
            switch (id[0]) {
                case 'T': col = num + 1; row = 0; break;
                case 'B': col = num + 1; row = totalGridRows - 1; break;
                case 'L': col = 0; row = num + 1; break;
                case 'R': col = totalGridCols - 1; row = num + 1; break;
            }
            
            const tempEmitter = Object.assign(new EmitterButton(emitter.id, emitter.label), emitter);
            tempEmitter.rect = {
                x: col * (cellWidth + gap),
                y: row * (cellHeight + gap),
                width: cellWidth,
                height: cellHeight
            };
            tempEmitter.state = 'normal';
            tempEmitter.draw(ctx, false);
        });
    
        // 5. Draw the gems
        drawGems(correctGems, 1.0, false);
        if (playerGems.length > 0) {
            drawGems(playerGems, 0.55, true);
        }
    }

    private handleLogClick(e: MouseEvent) {
        const li = (e.target as HTMLElement).closest('li');
        if (li && li.dataset.waveId) {
            const waveId = li.dataset.waveId;
            if (gameState.selectedLogEntryWaveId === waveId) {
                this.game.setSelectedWave(null, null);
            } else {
                // When clicking the log, the context is the start emitter
                this.game.setSelectedWave(waveId, waveId);
            }
        }
    }
    
    private handleCanvasHover(clientX: number, clientY: number) {
        if (this.isDragging) return;

        const rect = this.gemCanvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        this.dragPos = { x, y };
        
        this.redrawAll();
    }
    
    private handleCanvasMouseLeave() {
        this.dragPos = {x: -1, y: -1};
        this.redrawAll();
    }

    public updatePreviewToggleState(isChecked: boolean) {
        this.previewToggle.checked = isChecked;
    }

    private updateLogHighlight() {
        this.logList.querySelectorAll('li').forEach(li => {
            const htmlLi = li as HTMLLIElement;
            if (htmlLi.dataset.waveId === gameState.selectedLogEntryWaveId) {
                htmlLi.classList.add('selected');
                htmlLi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                htmlLi.classList.remove('selected');
            }
        });
    }

    private handleCanvasKeyDown(e: KeyboardEvent) {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)) return;
        e.preventDefault();
        
        const currentFocused = this.emitters.find(em => em.id === this.focusedEmitterId);
        if (currentFocused) currentFocused.state = 'normal';

        if (e.key === 'Enter' || e.key === ' ') {
            if (this.focusedEmitterId) {
                const focusedEmitter = this.emitters.find(em => em.id === this.focusedEmitterId);
                if (focusedEmitter && !focusedEmitter.isUsed) {
                    this.game.sendWave(this.focusedEmitterId);
                } else if (focusedEmitter?.isUsed) {
                    const logEntry = gameState.log.find(l => l.waveId === focusedEmitter.id || l.result.exitId === focusedEmitter.id);
                    if (logEntry) {
                        if (gameState.selectedLogEntryWaveId === logEntry.waveId && gameState.previewSourceEmitterId === focusedEmitter.id) {
                            this.game.setSelectedWave(null, null);
                        } else {
                             this.game.setSelectedWave(logEntry.waveId, focusedEmitter.id);
                        }
                    }
                }
            }
            if(currentFocused) currentFocused.state = 'focused';
            this.redrawAll();
            this.updateLogHighlight();
            return;
        }

        const focusedIndex = this.emitters.findIndex(em => em.id === this.focusedEmitterId);
        if (focusedIndex === -1) return;
        
        let nextIndex = -1;

        switch (e.key) {
            case 'ArrowRight': nextIndex = (focusedIndex + 1) % this.emitters.length; break;
            case 'ArrowLeft': nextIndex = (focusedIndex - 1 + this.emitters.length) % this.emitters.length; break;
            case 'ArrowUp': nextIndex = (focusedIndex - 1 + this.emitters.length) % this.emitters.length; break;
            case 'ArrowDown': nextIndex = (focusedIndex + 1) % this.emitters.length; break;
        }
        
        if (nextIndex !== -1) {
            this.focusedEmitterId = this.emitters[nextIndex].id;
            const next = this.emitters[nextIndex];
            if (next) next.state = 'focused';
            this.redrawAll();
        }
    }

    private getPointerCoordinates(e: MouseEvent | TouchEvent): { clientX: number, clientY: number } | null {
        if (e instanceof MouseEvent) {
            return { clientX: e.clientX, clientY: e.clientY };
        }
        if (e.changedTouches && e.changedTouches.length > 0) {
            return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
        }
        return null;
    }
    
    private handlePointerDown(e: MouseEvent | TouchEvent) {
        if (e instanceof MouseEvent && e.button !== 0) return;
    
        const coords = this.getPointerCoordinates(e);
        if (!coords) return;
        const { clientX, clientY } = coords;
    
        const target = e.target as HTMLElement;
        const toolbarGemEl = target.closest('.toolbar-gem:not(.placed)');
        const isOverCanvas = target.closest('#gem-canvas');
    
        // Key fix for mobile: Prevent synthetic mouse events that cause double actions (e.g., tap-to-select, then ghost-click-to-deselect).
        // We do this for any touch that starts on an interactive area of our game.
        if (e instanceof TouchEvent && (isOverCanvas || toolbarGemEl)) {
            e.preventDefault();
        }
        
        let potentialDragItem: DragInfo | null = null;
        let offsetX = 0;
        let offsetY = 0;
    
        if (toolbarGemEl) {
            const rect = toolbarGemEl.getBoundingClientRect();
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;
            const name = (toolbarGemEl as HTMLElement).dataset.gemName!;
            potentialDragItem = { name, from: 'toolbar', gridPattern: GEMS[name].gridPattern, element: (toolbarGemEl as HTMLElement), offsetX, offsetY };
        } else if (isOverCanvas) {
            const canvasRect = this.gemCanvas.getBoundingClientRect();
            const x = clientX - canvasRect.left;
            const y = clientY - canvasRect.top;
            const gem = this.getGemAtCanvasPos(x, y);
            if (gem) {
                const gridCoords = this._canvasToGridCoords(x, y);
                potentialDragItem = { id: gem.id, name: gem.name, from: 'board', gridPattern: gem.gridPattern, offsetX: (gridCoords.x - gem.x) * this.cellWidth, offsetY: (gridCoords.y - gem.y) * this.cellHeight };
            }
        }
        
        if (potentialDragItem) {
            this.dragStartInfo = {
                item: potentialDragItem,
                startX: clientX,
                startY: clientY
            };
        }
    }

    private handlePointerMove(e: MouseEvent | TouchEvent) {
        const coords = this.getPointerCoordinates(e);
        if (!coords) return;
        const { clientX, clientY } = coords;

        if (this.dragStartInfo) {
            if (e instanceof TouchEvent) e.preventDefault();
            if (!this.isDragging) {
                const dx = clientX - this.dragStartInfo.startX;
                const dy = clientY - this.dragStartInfo.startY;
                if (Math.sqrt(dx * dx + dy * dy) > 5) {
                    this.isDragging = true;
                    this.draggedItemInfo = this.dragStartInfo.item;
                    if(this.draggedItemInfo.element) {
                        this.draggedItemInfo.element.classList.add('dragging');
                    }
                }
            }

            if (this.isDragging) {
                const canvasRect = this.gemCanvas.getBoundingClientRect();
                this.dragPos = { x: clientX - canvasRect.left, y: clientY - canvasRect.top };
                this.redrawAll();
            }
        } else {
            const isOverCanvas = e.target === this.gemCanvas;
            if (isOverCanvas) {
                this.handleCanvasHover(clientX, clientY);
            } else {
                this.handleCanvasMouseLeave();
            }
        }
    }
    
    private handlePointerUp(e: MouseEvent | TouchEvent) {
        const coords = this.getPointerCoordinates(e);
        if (!coords) return;
        const { clientX, clientY } = coords;

        const wasDragging = this.isDragging;

        // --- Finish Drag ---
        if (wasDragging && this.draggedItemInfo) {
            const canvasRect = this.gemCanvas.getBoundingClientRect();
            const isOverCanvas = clientX >= canvasRect.left && clientX <= canvasRect.right && clientY >= canvasRect.top && clientY <= canvasRect.bottom;
            
            if (isOverCanvas) {
                const { x, y } = this.lastValidDropTarget;
                const { gridPattern } = this.draggedItemInfo;
                const pWidth = gridPattern[0].length;
                const pHeight = gridPattern.length;
                
                const isWithinBounds = x >= 0 && y >= 0 && (x + pWidth) <= GRID_WIDTH && (y + pHeight) <= GRID_HEIGHT;
        
                if (isWithinBounds) {
                    if (this.draggedItemInfo.from === 'toolbar') {
                        this.game.addPlayerGem(this.draggedItemInfo.name, x, y);
                    } else if (this.draggedItemInfo.id) {
                        this.game.movePlayerGem(this.draggedItemInfo.id, x, y);
                    }
                }
            } else {
                if (this.draggedItemInfo.from === 'board' && this.draggedItemInfo.id) {
                    this.game.removePlayerGem(this.draggedItemInfo.id);
                }
            }
        }
        // --- Handle Tap ---
        else {
            const target = e.target as HTMLElement;
            // Only handle tap if it happened on the canvas
            if(target.closest('#gem-canvas')) {
                const rect = this.gemCanvas.getBoundingClientRect();
                const x = clientX - rect.left;
                const y = clientY - rect.top;

                const clickedEmitter = this.emitters.find(em => em.isInside(x, y));
                if (clickedEmitter) {
                    if (!clickedEmitter.isUsed) {
                        this.game.sendWave(clickedEmitter.id);
                    } else {
                        const logEntry = gameState.log.find(l => l.waveId === clickedEmitter.id || l.result.exitId === clickedEmitter.id);
                        if (logEntry) {
                            if (gameState.selectedLogEntryWaveId === logEntry.waveId && gameState.previewSourceEmitterId === clickedEmitter.id) {
                                this.game.setSelectedWave(null, null);
                            } else {
                                this.game.setSelectedWave(logEntry.waveId, clickedEmitter.id);
                            }
                        } else {
                            this.game.setSelectedWave(null, null);
                        }
                    }
                } else {
                    const clickedGem = this.getGemAtCanvasPos(x, y);
                    if (clickedGem) {
                        this.game.setSelectedWave(null, null);
                        this.game.rotatePlayerGem(clickedGem.id);
                    } else {
                        // Clicked on empty space on canvas, deselect
                        this.game.setSelectedWave(null, null);
                    }
                }
            }
        }

        // --- Reset State ---
        if (this.dragStartInfo?.item.element) {
            this.dragStartInfo.item.element.classList.remove('dragging');
        }
        this.dragStartInfo = null;
        this.isDragging = false;
        this.draggedItemInfo = null;
        this.redrawAll();
        this.updateToolbar();
    }

    private getGemAtCanvasPos(canvasX: number, canvasY: number): Gem | null {
        if(canvasX < 0 || canvasY < 0) return null;
        const { x, y } = this._canvasToGridCoords(canvasX, canvasY);
        for (let i = gameState.playerGems.length - 1; i >= 0; i--) {
            const gem = gameState.playerGems[i];
            const pHeight = gem.gridPattern.length;
            const pWidth = gem.gridPattern[0].length;
            if (x >= gem.x && x < gem.x + pWidth && y >= gem.y && y < gem.y + pHeight) {
                if (gem.gridPattern[y - gem.y][x - gem.x] !== CellState.EMPTY) {
                     return gem;
                }
            }
        }
        return null;
    }

    private _getPathColorName(result: { colors: string[], absorbed?: boolean }): string {
        if (result.absorbed) return 'Absorbiert';
        if (result.colors.length === 0) return 'Keine Farbe';
        const key = [...result.colors].sort().join(',');
        return COLOR_NAMES[key] || 'Unbekannte Mischung';
    }
    
    private _createColorMixEntry(key: string): HTMLElement {
        const resultColor = COLOR_MIXING[key];
        const baseColors = key.split(',');
        const entryDiv = document.createElement('div');
        entryDiv.className = 'color-mix-entry';
    
        let html = '';
        baseColors.forEach((colorName, index) => {
            const colorHex = COLORS[colorName as keyof typeof COLORS];
            html += `<div class="color-mix-box" style="background-color: ${colorHex}"></div>`;
            if (index < baseColors.length - 1) {
                html += `<span>+</span>`;
            }
        });
        
        const resultName = COLOR_NAMES[key as keyof typeof COLOR_NAMES] || 'Mischung';
    
        html += `<span>=</span> <div class="color-mix-box" style="background-color: ${resultColor}"></div> <span>${resultName}</span>`;
        entryDiv.innerHTML = html;
        return entryDiv;
    }

    private _populateColorMixColumns(container: HTMLElement) {
        if (!container) return;
    
        const col1 = document.createElement('div');
        col1.className = 'color-mix-column';
        const col2 = document.createElement('div');
        col2.className = 'color-mix-column';
    
        const leftColumnKeys = ['BLAU,ROT', 'BLAU,GELB', 'GELB,ROT', 'BLAU,ROT,WEISS', 'BLAU,GELB,WEISS', 'BLAU,GELB,ROT,WEISS'];
        const rightColumnKeys = ['BLAU,WEISS', 'ROT,WEISS', 'GELB,WEISS', 'BLAU,GELB,ROT', 'GELB,ROT,WEISS'];
    
        leftColumnKeys.forEach(key => col1.appendChild(this._createColorMixEntry(key)));
        rightColumnKeys.forEach(key => col2.appendChild(this._createColorMixEntry(key)));
    
        container.appendChild(col1);
        container.appendChild(col2);
    }
    
    private _populateIntroRules() {
        this.introRulesEl.innerHTML = `
            <h3>Spielanleitung</h3>
            <p><strong>Ziel:</strong> Finde die Position und Ausrichtung der versteckten Edelsteine.</p>
            <ul>
                <li>Sende Lichtwellen von den Rändern in das Spielfeld.</li>
                <li>Die austretende Farbe und Position verraten, welche Steine getroffen wurden.</li>
                <li>Ziehe Edelsteine aus der Werkzeugleiste auf das Feld. Du kannst sie verschieben und drehen.</li>
                <li>Ein Klick auf einen platzierten Stein dreht ihn um 90°.</li>
                <li>Steine dürfen sich nicht überlappen oder Kante an Kante liegen.</li>
                <li>Drücke <strong>'n'</strong> für ein neues Level oder <strong>'esc'</strong> um zum Menü zurückzukehren.</li>
            </ul>
            <h4>Farbmischung</h4>
            <p>Wenn ein Lichtstrahl mehrere farbige Steine durchquert, mischen sich ihre Farben:</p>
            <div class="color-mix-container"></div>
        `;

        const container = this.introRulesEl.querySelector('.color-mix-container') as HTMLElement;
        this._populateColorMixColumns(container);
    }

    private _populateRulesPanel() {
        this.rulesPanel.innerHTML = `
            <h4>Grundregeln</h4>
            <ul>
                <li><strong>Ziel:</strong> Finde die Position und Ausrichtung der versteckten Edelsteine.</li>
                <li>Sende Lichtwellen, um zu sehen, wo sie austreten und welche Farbe sie haben.</li>
                <li>Ziehe die Edelsteine auf das Feld, um die Lösung nachzubauen.</li>
                <li>Klicke auf einen platzierten Stein, um ihn zu <strong>drehen</strong>.</li>
                <li>Steine dürfen sich nicht überlappen oder Kante an Kante liegen.</li>
            </ul>
            <h4>Farbmischung</h4>
            <p>Wenn ein Lichtstrahl mehrere farbige Steine durchquert, mischen sich ihre Farben:</p>
            <div class="color-mix-container"></div>
        `;
    
        const container = this.rulesPanel.querySelector('.color-mix-container') as HTMLElement;
        this._populateColorMixColumns(container);
    }

    private _drawSelectedWaveTooltip(ctx: CanvasRenderingContext2D) {
        if (!gameState.selectedLogEntryWaveId) return;
    
        const selectedLog = gameState.log.find(l => l.waveId === gameState.selectedLogEntryWaveId);
        if (!selectedLog) return;
    
        const contextEmitterId = gameState.previewSourceEmitterId || selectedLog.waveId;
        const contextEmitter = this.emitters.find(e => e.id === contextEmitterId);
        if (!contextEmitter) return;
    
        const startEmitterId = selectedLog.waveId;
        const endEmitterId = selectedLog.result.exitId;
        const colorName = this._getPathColorName(selectedLog.result);
        const text = (contextEmitterId === startEmitterId)
            ? `${startEmitterId} ➔ ${colorName} ➔ ${endEmitterId}`
            : `${endEmitterId} ➔ ${colorName} ➔ ${startEmitterId}`;
    
        ctx.save();
        const fontSize = this.cellHeight * 0.35;
        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
        ctx.textBaseline = 'middle';
        
        const textMetrics = ctx.measureText(text);
        const padding = { x: 8, y: 5 };
        const rectWidth = textMetrics.width + padding.x * 2;
        const rectHeight = fontSize + padding.y * 2;
        const cornerRadius = 6;
        
        const emitterRect = contextEmitter.rect;
        const margin = 5;
        const canvasW = this.gemCanvas.width / (window.devicePixelRatio || 1);
        const canvasH = this.gemCanvas.height / (window.devicePixelRatio || 1);
        
        let rectX = 0, rectY = 0;

        // Smart positioning logic
        // 1. Try BELOW
        rectY = emitterRect.y + emitterRect.height + margin;
        rectX = emitterRect.x + emitterRect.width / 2 - rectWidth / 2;
        if (rectY + rectHeight > canvasH) {
            // 2. Try ABOVE
            rectY = emitterRect.y - rectHeight - margin;
            if (rectY < 0) {
                // 3. Try RIGHT
                rectX = emitterRect.x + emitterRect.width + margin;
                rectY = emitterRect.y + emitterRect.height / 2 - rectHeight / 2;
                if (rectX + rectWidth > canvasW) {
                    // 4. Try LEFT, and clamp as a fallback
                    rectX = emitterRect.x - rectWidth - margin;
                }
            }
        }
        
        // Clamp to canvas bounds to prevent tooltip from going off-screen
        if (rectX < 0) rectX = 0;
        if (rectX + rectWidth > canvasW) rectX = canvasW - rectWidth;
        if (rectY < 0) rectY = 0;
        if (rectY + rectHeight > canvasH) rectY = canvasH - rectHeight;
        
        const textX = rectX + rectWidth / 2;
        const textY = rectY + rectHeight / 2;
        
        ctx.fillStyle = 'black'; // Solid black background
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectWidth, rectHeight, cornerRadius);
        ctx.fill();
    
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(text, textX, textY);
        ctx.restore();
    }
}