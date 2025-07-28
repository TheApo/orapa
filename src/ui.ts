import { Game } from './game';
import { GEMS, GEM_SETS, COLORS, COLOR_MIXING, DIFFICULTIES, COLOR_NAMES } from './constants';
import { gameState, Gem, LogEntry, GameStatus } from './state';
import { CellState, GRID_WIDTH, GRID_HEIGHT } from './grid';
import { EmitterButton } from './ui-objects';

type ActiveTooltip = {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    emitter1Id: string;
    emitter2Id: string;
};

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
    rulesPanel!: HTMLElement;
    
    // End Screen Elements
    endTitle!: HTMLElement;
    endStats!: HTMLElement;
    endSolutionCanvas!: HTMLCanvasElement;
    endSolutionCtx!: CanvasRenderingContext2D;
    btnNewLevel!: HTMLButtonElement;
    btnMenu!: HTMLButtonElement;
    
    // Canvas interaction state
    private emitters: EmitterButton[] = [];
    private focusedEmitterId: string | null = null;
    
    // Tooltip & Hover state
    private tooltipTimer: number | null = null;
    private activeTooltip: ActiveTooltip | null = null;
    private currentHoveredEmitter: EmitterButton | null = null;
    
    // Drag & Drop State
    private dragStartInfo: { item: DragInfo, startX: number, startY: number } | null = null;
    private isDragging = false;
    private draggedItemInfo: DragInfo | null = null;
    private dragPos = { x: 0, y: 0 };
    private lastValidDropTarget = { x: -1, y: -1, isValid: false };
    private justDragged = false;

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
        
        this.endTitle = document.getElementById('end-title')!;
        this.endStats = document.getElementById('end-stats')!;
        this.endSolutionCanvas = document.getElementById('end-solution-canvas') as HTMLCanvasElement;
        this.endSolutionCtx = this.endSolutionCanvas.getContext('2d')!;
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

        // Keyboard navigation and actions
        this.gemCanvas.addEventListener('keydown', (e) => this.handleCanvasKeyDown(e));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'n' && (gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.GAME_OVER)) {
                if (gameState.difficulty) this.game.start(gameState.difficulty);
                return;
            }
            if (gameState.status === GameStatus.PLAYING) {
                if (e.key === 'd') this.game.toggleDebugMode();
            }
        });
        
        // Canvas interactions (only for clicks, mouse move on document handles dragging)
        this.gemCanvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Global mouse events for robust drag & drop
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Log interactions
        this.logList.addEventListener('mouseover', (e) => this.handleLogHover(e));
        this.logList.addEventListener('mouseout', () => this.handleLogLeave());
        this.logList.addEventListener('animationend', () => {
            this.logList.classList.remove('flash');
        });
    }
    
    setupGameUI() {
        this._populateRulesPanel();
        this.switchTab('actions');
        this._createEmitterObjects();
        this.updateToolbar();
        this.logList.innerHTML = '';
        this.clearPath();
        this.game.updateSolutionButtonState();
        
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
    
    redrawAll() {
        if (this.gemCanvas.width === 0) return; 
        const ctx = this.gemCtx;
        ctx.clearRect(0, 0, this.gemCanvas.width, this.gemCanvas.height);
        
        this._drawBoardBackgroundAndGrid(ctx);
        this.emitters.forEach(e => e.draw(ctx));

        if(gameState.status === GameStatus.PLAYING) {
            if (gameState.debugMode) this.drawDebugSolution(ctx);
            
            this.drawPlayerGems(ctx);

            if (this.isDragging && this.draggedItemInfo) {
                this.drawDragPreview(ctx);
            }
        }
        
        this._drawActiveTooltip(ctx);
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
        ctx.globalAlpha = 0.2;
        for (const gem of gameState.secretGems) {
             const { gridPattern, x, y, name } = gem;
             const color = GEMS[name].color;
             for (let r = 0; r < gridPattern.length; r++) {
                for (let c = 0; c < gridPattern[r].length; c++) {
                    const state = gridPattern[r][c];
                    if (state !== CellState.EMPTY) {
                        const canvasCoords = this._gridToCanvasCoords(x, y);
                        this.drawCellShape(ctx, canvasCoords.x + c * (this.cellWidth), canvasCoords.y + r * (this.cellHeight), this.cellWidth, this.cellHeight, state, color);
                    }
                }
            }
        }
        ctx.restore();
    }
    
    private drawCellShape(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, state: CellState, color: string, isInvalid = false, isHovered = false) {
        ctx.save();
        if (color === COLORS.TRANSPARENT) {
            ctx.fillStyle = 'rgba(164, 212, 228, 0.3)';
            ctx.strokeStyle = '#a4d4e4';
            ctx.lineWidth = 2;
        } else {
            ctx.fillStyle = color;
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;
        }
    
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
    
    private _drawActiveTooltip(ctx: CanvasRenderingContext2D) {
        if (!this.activeTooltip) return;
        const { x, y, width, height, text } = this.activeTooltip;

        ctx.save();
        ctx.font = 'bold 14px sans-serif';
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = 14; 
        const padding = 8;
        
        let tooltipX = x + width / 2 - (textWidth/2 + padding);
        let tooltipY = y - textHeight - padding * 2;

        if (tooltipY < 0) tooltipY = y + height + padding;
        if (tooltipX < 0) tooltipX = padding;
        if (tooltipX + textWidth + padding * 2 > ctx.canvas.width / (window.devicePixelRatio || 1) ) {
            tooltipX = ctx.canvas.width / (window.devicePixelRatio || 1) - textWidth - padding * 2;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        const path = new Path2D();
        path.roundRect(tooltipX, tooltipY, textWidth + padding * 2, textHeight + padding, 5);
        ctx.fill(path);

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, tooltipX + textWidth/2 + padding, tooltipY + textHeight/2 + padding/2);
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

    public showWavePath(result: { path: {x:number, y:number}[], colors: string[], absorbed?: boolean }) {
        this.clearPath();
        if (!gameState.debugMode) return;
        
        const color = this.getPathColor(result);
        this.drawPath(result.path, color);
    }

    private drawPath(path: {x:number, y:number}[], color: string) {
        if (path.length < 2) return;
    
        const ctx = this.pathCtx;
        this.clearPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 5;
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
        this.logList.classList.add('flash');
        
        this.switchTab('log');

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
        this.redrawAll();
    }
    
    showEndScreen(isWin: boolean, waveCount: number, secretGems: Gem[], playerGems: Gem[]) {
        this.endTitle.textContent = isWin ? 'Gewonnen!' : 'Verloren!';
        this.endStats.textContent = isWin ? `Du hast die Mine in ${waveCount} Abfragen gelöst!` : `Du hast ${waveCount} Abfragen gebraucht.`;
        this.showScreen('end');
        requestAnimationFrame(() => {
            const playerSolutionToShow = isWin ? [] : playerGems;
            this.drawEndScreenSolution(this.endSolutionCtx, secretGems, playerSolutionToShow);
        });
    }

    private drawEndScreenSolution(ctx: CanvasRenderingContext2D, correctGems: Gem[], playerGems: Gem[]) {
        const canvas = ctx.canvas;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0) return;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        const cellW = (rect.width - (GRID_WIDTH - 1) * 1) / GRID_WIDTH;
        const cellH = (rect.height - (GRID_HEIGHT - 1) * 1) / GRID_HEIGHT;

        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface-color');
        ctx.fillRect(0,0, rect.width, rect.height);
        this.drawGemSet(ctx, correctGems, { cellW, cellH, gap: 1, opacity: 1.0, highlightInvalid: false });
        if (playerGems.length > 0) this.drawGemSet(ctx, playerGems, { cellW, cellH, gap: 1, opacity: 0.55, highlightInvalid: true });
    }
    
    private drawGemSet(ctx: CanvasRenderingContext2D, gems: Gem[], opts: { cellW: number, cellH: number, gap: number, opacity: number, highlightInvalid?: boolean }) {
        ctx.save();
        ctx.globalAlpha = opts.opacity;
        for (const gem of gems) {
            const color = GEMS[gem.name].color;
            const shouldHighlight = !!opts.highlightInvalid && !gem.isValid;
            for (let r = 0; r < gem.gridPattern.length; r++) {
                for (let c = 0; c < gem.gridPattern[r].length; c++) {
                    const state = gem.gridPattern[r][c];
                    if (state !== CellState.EMPTY) {
                        const canvasX = gem.x * (opts.cellW + opts.gap) + c * opts.cellW;
                        const canvasY = gem.y * (opts.cellH + opts.gap) + r * opts.cellH;
                        this.drawCellShape(ctx, canvasX, canvasY, opts.cellW, opts.cellH, state, color, shouldHighlight);
                    }
                }
            }
        }
        ctx.restore();
    }
    
    private handleCanvasClick(e: MouseEvent) {
        if (this.justDragged) {
            // This flag is set by handleMouseUp after a drag.
            // It's reset by a timeout, so we just ignore this single click event.
            return;
        }

        const rect = this.gemCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const clickedEmitter = this.emitters.find(em => em.isInside(x, y));
        if (clickedEmitter) {
            if (!clickedEmitter.isUsed) {
                this.game.sendWave(clickedEmitter.id);
            }
            return;
        }

        const clickedGem = this.getGemAtCanvasPos(x, y);
        if (clickedGem) {
            this.game.rotatePlayerGem(clickedGem.id);
        }
    }

    private clearAllHighlightsAndTooltips() {
        if (this.tooltipTimer) {
            clearTimeout(this.tooltipTimer);
            this.tooltipTimer = null;
        }
        this.activeTooltip = null;
        this.emitters.forEach(e => {
            if(e.state === 'highlight') e.state = 'normal';
        });
    }
    
    // This method now only handles hover effects, not dragging.
    private handleCanvasHover(e: MouseEvent) {
        if (this.isDragging) return; // Don't process hovers while a drag is active

        const rect = this.gemCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.dragPos = { x, y }; // Still useful for gem hover highlights

        const emitter = this.emitters.find(em => em.isInside(x,y));

        if (this.currentHoveredEmitter === emitter) {
            return; 
        }

        if(this.currentHoveredEmitter) {
            this.currentHoveredEmitter.isHovered = false;
        }
        this.clearAllHighlightsAndTooltips();
        
        this.currentHoveredEmitter = emitter || null;

        if (this.currentHoveredEmitter) {
            this.currentHoveredEmitter.isHovered = true;
            if (this.currentHoveredEmitter.isUsed) {
                this.tooltipTimer = window.setTimeout(() => this._showHoverTooltip(this.currentHoveredEmitter!.id), 750);
            }
        }
        
        this.redrawAll();
    }
    
    private handleCanvasMouseLeave() {
        this.dragPos = {x: -1, y: -1};
        if (this.currentHoveredEmitter) {
            this.currentHoveredEmitter.isHovered = false;
            this.currentHoveredEmitter = null;
        }
        this.clearAllHighlightsAndTooltips();
        this.redrawAll();
    }
    
    private _showHoverTooltip(emitterId: string) {
        this.tooltipTimer = null;
        const logEntry = gameState.log.find(l => l.waveId === emitterId || l.result.exitId === emitterId);
        if (!logEntry) return;

        const startEmitter = this.emitters.find(e => e.id === logEntry.waveId);
        const endEmitter = this.emitters.find(e => e.id === logEntry.result.exitId);
        
        if (!startEmitter || !endEmitter) return;
        
        const colorName = this._getPathColorName(logEntry.result);
        const partnerId = startEmitter.id === emitterId ? endEmitter.id : startEmitter.id;
        
        startEmitter.state = 'highlight';
        endEmitter.state = 'highlight';
        
        const triggerEmitter = this.emitters.find(e => e.id === emitterId)!;

        this.activeTooltip = {
            text: `${colorName} ➔ ${partnerId}`,
            x: triggerEmitter.rect.x,
            y: triggerEmitter.rect.y,
            width: triggerEmitter.rect.width,
            height: triggerEmitter.rect.height,
            emitter1Id: startEmitter.id,
            emitter2Id: endEmitter.id
        };
        
        this.redrawAll();
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
                }
            }
            if(currentFocused) currentFocused.state = 'focused';
            this.redrawAll();
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
    
    private handleMouseDown(e: MouseEvent) {
        if (e.button !== 0) return; // Only main button

        const target = e.target as HTMLElement;
        const toolbarGemEl = target.closest('.toolbar-gem:not(.placed)');
        const canvasRect = this.gemCanvas.getBoundingClientRect();
        const isOverCanvas = e.clientX >= canvasRect.left && e.clientX <= canvasRect.right && e.clientY >= canvasRect.top && e.clientY <= canvasRect.bottom;
        
        let potentialDragItem: DragInfo | null = null;
        
        if (toolbarGemEl) {
            const name = (toolbarGemEl as HTMLElement).dataset.gemName!;
            potentialDragItem = { name, from: 'toolbar', gridPattern: GEMS[name].gridPattern, element: (toolbarGemEl as HTMLElement), offsetX: e.offsetX, offsetY: e.offsetY };
        } else if (isOverCanvas) {
            const x = e.clientX - canvasRect.left;
            const y = e.clientY - canvasRect.top;
            const gem = this.getGemAtCanvasPos(x, y);
            if (gem) {
                const gridCoords = this._canvasToGridCoords(x, y);
                potentialDragItem = { id: gem.id, name: gem.name, from: 'board', gridPattern: gem.gridPattern, offsetX: (gridCoords.x - gem.x) * this.cellWidth, offsetY: (gridCoords.y - gem.y) * this.cellHeight };
            }
        }
        
        if (potentialDragItem) {
            this.dragStartInfo = {
                item: potentialDragItem,
                startX: e.clientX,
                startY: e.clientY
            };
        }
    }

    private handleMouseMove(e: MouseEvent) {
        if (this.dragStartInfo) {
            // Check if we should start dragging
            if (!this.isDragging) {
                const dx = e.clientX - this.dragStartInfo.startX;
                const dy = e.clientY - this.dragStartInfo.startY;
                if (Math.sqrt(dx * dx + dy * dy) > 5) { // Drag threshold
                    this.isDragging = true;
                    this.draggedItemInfo = this.dragStartInfo.item;
                    if(this.draggedItemInfo.element) {
                        this.draggedItemInfo.element.classList.add('dragging');
                    }
                }
            }

            if (this.isDragging) {
                const canvasRect = this.gemCanvas.getBoundingClientRect();
                this.dragPos = { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top };
                this.redrawAll();
            }
        } else {
            // Standard hover logic when not about to drag
            const isOverCanvas = e.target === this.gemCanvas;
            if (isOverCanvas) {
                this.handleCanvasHover(e);
            } else {
                this.handleCanvasMouseLeave();
            }
        }
    }
    
    private handleMouseUp(e: MouseEvent) {
        if (this.isDragging && this.draggedItemInfo) {
            // This flag prevents the 'click' event that fires after a drag-drop
            // from being interpreted as a gem rotation.
            this.justDragged = true;
            // Use a timeout to reset the flag shortly after, so the next
            // intended click by the user is not swallowed.
            setTimeout(() => { this.justDragged = false; }, 0);

            const canvasRect = this.gemCanvas.getBoundingClientRect();
            const isOverCanvas = e.clientX >= canvasRect.left && e.clientX <= canvasRect.right && e.clientY >= canvasRect.top && e.clientY <= canvasRect.bottom;
            
            if (isOverCanvas) {
                if (this.lastValidDropTarget.isValid) {
                    const { x, y } = this.lastValidDropTarget;
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

        // Reset all drag-related state
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
    
    private handleLogHover(e: MouseEvent) {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const li = target.closest('li[data-wave-id]');
        
        this.clearAllHighlightsAndTooltips();

        if (li) {
            li.classList.add('highlight-pair');
            const waveId = (li as HTMLElement).dataset.waveId!;
            const entry = gameState.log.find(l => l.waveId === waveId);
            if (entry) {
                if (gameState.debugMode) {
                    this.drawPath(entry.path, this.getPathColor(entry.result));
                }
                const startEmitter = this.emitters.find(em => em.id === entry.waveId);
                if (startEmitter) startEmitter.state = 'highlight';
                
                if (entry.result.exitId) {
                    const endEmitter = this.emitters.find(em => em.id === entry.result.exitId);
                    if (endEmitter) endEmitter.state = 'highlight';
                }
            }
        }
        this.redrawAll();
    }

    private handleLogLeave() {
        this.clearPath();
        document.querySelectorAll('#log-list li.highlight-pair').forEach(el => el.classList.remove('highlight-pair'));
        this.clearAllHighlightsAndTooltips();
        this.redrawAll();
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
                <li>Drücke 'n' für ein neues Level mit der aktuellen Schwierigkeit.</li>
            </ul>
            <p><strong>Farbmischung:</strong></p>
            <ul>
                <li>Rot + Blau = Lila</li>
                <li>Blau + Gelb = Grün</li>
                <li>Rot + Gelb = Orange</li>
                <li>Jede Farbe + Weiss = Hellere Variante</li>
                <li>Alle 3 Grundfarben = Dunkelgrau</li>
            </ul>
        `;
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
            <div class="color-mix-grid"></div>
        `;
    
        const grid = this.rulesPanel.querySelector('.color-mix-grid')!;
        Object.entries(COLOR_MIXING).forEach(([key, resultColor]) => {
            const baseColors = key.split(',');
            if (baseColors.length < 2) return; // Nur Mischungen anzeigen
    
            const entryDiv = document.createElement('div');
            entryDiv.className = 'color-mix-entry';
    
            baseColors.forEach((colorName, index) => {
                // Find the hex value from the COLORS constant, which uses uppercase keys
                const colorHex = COLORS[colorName as keyof typeof COLORS];
                entryDiv.innerHTML += `<div class="color-mix-box" style="background-color: ${colorHex}"></div>`;
                if (index < baseColors.length - 1) {
                    entryDiv.innerHTML += `<span>+</span>`;
                }
            });
            
            const resultName = COLOR_NAMES[key as keyof typeof COLOR_NAMES] || 'Mischung';
    
            entryDiv.innerHTML += `<span>=</span> <div class="color-mix-box" style="background-color: ${resultColor}"></div> <span>${resultName}</span>`;
            grid.appendChild(entryDiv);
        });
    }
}