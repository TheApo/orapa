
import { Game } from './game';
import { GEMS, GEM_SETS, COLORS, COLOR_MIXING, DIFFICULTIES, COLOR_NAMES } from './constants';
import { gameState, Gem, LogEntry, GameStatus } from './state';
import { CellState } from './grid';
import { GRID_WIDTH, GRID_HEIGHT } from './grid';

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
    board!: HTMLElement;
    emitterContainers: { [key: string]: HTMLElement } = {};
    gemCanvas!: HTMLCanvasElement;
    gemCtx!: CanvasRenderingContext2D;
    pathOverlay!: HTMLCanvasElement;
    pathCtx!: CanvasRenderingContext2D;
    gemToolbar!: HTMLElement;
    logList!: HTMLElement;
    actionsTabBtn!: HTMLButtonElement;
    logTabBtn!: HTMLButtonElement;
    checkSolutionBtn!: HTMLButtonElement;
    giveUpBtn!: HTMLButtonElement;
    
    // End Screen Elements
    endTitle!: HTMLElement;
    endStats!: HTMLElement;
    endSolutionCanvas!: HTMLCanvasElement;
    endSolutionCtx!: CanvasRenderingContext2D;
    btnNewLevel!: HTMLButtonElement;
    btnMenu!: HTMLButtonElement;
    
    // Drag & Drop Elements
    dragPreviewEl!: HTMLElement;
    dragPreviewCanvas!: HTMLCanvasElement;
    dragPreviewCtx!: CanvasRenderingContext2D;
    private draggedItemInfo: {
        id: string; // gemName from toolbar, or gem.id from board
        name: string;
        from: 'toolbar' | 'board';
        gridPattern: CellState[][];
        element: HTMLElement;
    } | null = null;
    private lastValidDropTarget = { x: -1, y: -1, isValid: false };

    cellWidth = 0;
    cellHeight = 0;

    constructor() {
        this.cacheDOMElements();
        this.bindGlobalEvents();
        this._populateIntroRules(); // Populate rules on startup
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
        this.board = document.getElementById('game-board')!;
        
        this.emitterContainers.top = this.boardWrapper.querySelector('.emitters-top')!;
        this.emitterContainers.bottom = this.boardWrapper.querySelector('.emitters-bottom')!;
        this.emitterContainers.left = this.boardWrapper.querySelector('.emitters-left')!;
        this.emitterContainers.right = this.boardWrapper.querySelector('.emitters-right')!;

        this.gemCanvas = document.getElementById('gem-canvas') as HTMLCanvasElement;
        this.gemCtx = this.gemCanvas.getContext('2d')!;
        this.pathOverlay = document.getElementById('path-overlay') as HTMLCanvasElement;
        this.pathCtx = this.pathOverlay.getContext('2d')!;
        
        this.dragPreviewEl = document.getElementById('drag-preview')!;
        this.dragPreviewCanvas = document.createElement('canvas');
        this.dragPreviewEl.appendChild(this.dragPreviewCanvas);
        this.dragPreviewCtx = this.dragPreviewCanvas.getContext('2d')!;
        
        this.gemToolbar = document.getElementById('gem-toolbar')!;
        this.logList = document.getElementById('log-list')!;
        this.actionsTabBtn = document.getElementById('actions-tab-btn') as HTMLButtonElement;
        this.logTabBtn = document.getElementById('log-tab-btn') as HTMLButtonElement;
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
            if (gameState.difficulty) {
                this.game.start(gameState.difficulty);
            }
        });
        this.btnMenu.addEventListener('click', () => this.game.showMainMenu());
        this.btnBackToMain1.addEventListener('click', () => this.game.showMainMenu());
        
        this.actionsTabBtn.addEventListener('click', () => this.switchTab('actions'));
        this.logTabBtn.addEventListener('click', () => this.switchTab('log'));
        
        this.checkSolutionBtn.addEventListener('click', () => this.game.checkSolution());
        this.giveUpBtn.addEventListener('click', () => this.game.giveUp());

        document.addEventListener('keydown', (e) => {
            // Handle 'n' for new level on game and end screens
            if (e.key === 'n' && (gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.GAME_OVER)) {
                if (gameState.difficulty) {
                    this.game.start(gameState.difficulty);
                }
                return; // Prevent other handlers
            }

            // Handle keys specific to playing state
            if (gameState.status === GameStatus.PLAYING) {
                if (e.key === 'Escape') {
                    this.game.showMainMenu();
                } else if (e.key === 'd') {
                    this.game.toggleDebugMode();
                }
            }
        });

        // Drag and Drop listeners
        document.addEventListener('dragstart', (e) => this.handleDragStart(e));
        document.addEventListener('dragover', (e) => this.handleDragOver(e));
        document.addEventListener('drop', (e) => this.handleDrop(e));
        document.addEventListener('dragend', (e) => this.handleDragEnd(e));

        this.board.addEventListener('click', (e) => this.handleBoardClick(e));
        this.boardWrapper.addEventListener('mouseover', (e) => this.handleEmitterHover(e));
        this.boardWrapper.addEventListener('mouseout', (e) => this.handleEmitterMouseOut(e));

        this.logList.addEventListener('mousedown', (e) => this.handleLogPress(e));
        this.logList.addEventListener('mouseup', () => this.clearPath());
        this.logList.addEventListener('mouseleave', () => this.clearPath());
        this.logList.addEventListener('touchstart', (e) => this.handleLogPress(e), { passive: true });
        this.logList.addEventListener('touchend', () => this.clearPath());
    }
    
    setupGameUI() {
        this.populateEmitters();
        this.updateToolbar();
        this.logList.innerHTML = '';
        this.clearPath();
        this.game.updateSolutionButtonState();
        this.switchTab('actions');
        
        // Use ResizeObserver to handle canvas scaling and redrawing
        const ro = new ResizeObserver(() => this.onBoardResize());
        ro.observe(this.board);
    }

    showScreen(screenName: 'main' | 'difficulty' | 'game' | 'end') {
        if (screenName === 'difficulty') {
            this.populateDifficultyOptions();
        }
        Object.values(this.screens).forEach(s => s.classList.add('hidden'));
        this.screens[screenName].classList.remove('hidden');
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

    private populateEmitters() {
        Object.values(this.emitterContainers).forEach(c => c.innerHTML = '');
        for(let i=0; i<GRID_WIDTH; i++) this.emitterContainers.top.appendChild(this.createEmitter(`T${i+1}`));
        for(let i=0; i<GRID_WIDTH; i++) this.emitterContainers.bottom.appendChild(this.createEmitter(`B${i+1}`));
        for(let i=0; i<GRID_HEIGHT; i++) this.emitterContainers.left.appendChild(this.createEmitter(`L${i+1}`));
        for(let i=0; i<GRID_HEIGHT; i++) this.emitterContainers.right.appendChild(this.createEmitter(`R${i+1}`));
    }
    
    private onBoardResize() {
        const boardRect = this.board.getBoundingClientRect();
        if (boardRect.width === 0 || boardRect.height === 0) return;
        
        const dpr = window.devicePixelRatio || 1;
        this.cellWidth = boardRect.width / GRID_WIDTH;
        this.cellHeight = boardRect.height / GRID_HEIGHT;

        [this.pathOverlay, this.gemCanvas].forEach(canvas => {
            canvas.width = boardRect.width * dpr;
            canvas.height = boardRect.height * dpr;
            canvas.style.width = `${boardRect.width}px`;
            canvas.style.height = `${boardRect.height}px`;
            const ctx = canvas.getContext('2d')!;
            ctx.scale(dpr, dpr);
        });
        
        this.redrawAll();
    }

    private createEmitter(id: string): HTMLButtonElement {
        const emitter = document.createElement('button');
        emitter.className = 'emitter';
        emitter.dataset.id = id;
        emitter.textContent = id; // Updated to show full ID
        emitter.addEventListener('click', () => this.game.sendWave(id));
        return emitter;
    }

    private _getGemTooltip(gemName: string): string {
        const gemDef = GEMS[gemName];
        if (!gemDef) return '';
    
        switch (gemName) {
            case 'TRANSPARENT':
                return "Reflektiert nur den Lichtstrahl, aber gibt keine weitere Farbe dazu, der Lichtstrahl behält seine aktuelle Farbe";
            case 'SCHWARZ':
                return "Absorbiert das Licht, wenn er vom Lichtstrahl getroffen wird. Und es kommt kein Licht zurück.";
            default:
                if (gemDef.baseGems && gemDef.baseGems.length > 0) {
                    const colorKey = gemDef.baseGems[0]; // e.g., 'GELB'
                    const colorDisplayName = COLOR_NAMES[colorKey]?.toLowerCase(); // e.g., 'gelb'
                    if (colorDisplayName) {
                        return `Fügt dem Lichtstrahl '${colorDisplayName}' hinzu, wenn er getroffen wird.`;
                    }
                }
                return `Edelstein ${gemName}`; // Fallback
        }
    }

    updateToolbar() {
        this.gemToolbar.innerHTML = '';
        if (!gameState.difficulty) return;
        GEM_SETS[gameState.difficulty].forEach(gemName => {
            const gemDef = GEMS[gemName];
            const div = document.createElement('div');
            div.className = 'toolbar-gem';
            div.draggable = true;
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
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.scale(dpr, dpr);

        const pattern = gemDef.gridPattern;
        const pHeight = pattern.length;
        const pWidth = pattern[0].length;
        const maxDim = Math.max(pWidth, pHeight);
        
        const cellW = canvas.clientWidth / maxDim;
        const cellH = canvas.clientHeight / maxDim;
        const offsetX = (canvas.clientWidth - pWidth * cellW) / 2;
        const offsetY = (canvas.clientHeight - pHeight * cellH) / 2;

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
        this.gemCtx.clearRect(0, 0, this.gemCanvas.width, this.gemCanvas.height);
        this._drawGrid(this.gemCtx); // Draw grid first for perfect alignment
        this.board.querySelectorAll('.gem-overlay').forEach(o => o.remove());

        if(gameState.status === GameStatus.PLAYING) {
            if (gameState.debugMode) {
                this.drawDebugSolution(this.gemCtx);
            } else {
                this.clearPath();
            }
            this.drawGemGrid(this.gemCtx, this.game.playerGrid);
            gameState.playerGems.forEach(gem => this.addGemOverlay(gem));
        }
    }

    private _drawGrid(ctx: CanvasRenderingContext2D, width?: number, height?: number) {
        const w = width ?? ctx.canvas.clientWidth;
        const h = height ?? ctx.canvas.clientHeight;
        const cellW = w / GRID_WIDTH;
        const cellH = h / GRID_HEIGHT;

        ctx.strokeStyle = 'rgba(74, 98, 122, 0.5)'; // var(--border-color) with alpha
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 1; x < GRID_WIDTH; x++) {
            ctx.moveTo(x * cellW, 0);
            ctx.lineTo(x * cellW, h);
        }
        for (let y = 1; y < GRID_HEIGHT; y++) {
            ctx.moveTo(0, y * cellH);
            ctx.lineTo(w, y * cellH);
        }
        ctx.stroke();
    }

    private drawGemGrid(ctx: CanvasRenderingContext2D, grid: CellState[][]) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const state = grid[y][x];
                if (state !== CellState.EMPTY) {
                    const gem = gameState.playerGems.find(g => 
                        x >= g.x && x < g.x + g.gridPattern[0].length &&
                        y >= g.y && y < g.y + g.gridPattern.length &&
                        g.gridPattern[y-g.y][x-g.x] === state
                    );
                    if (gem) {
                         this.drawCellShape(ctx, x * this.cellWidth, y * this.cellHeight, this.cellWidth, this.cellHeight, state, GEMS[gem.name].color);
                    }
                }
            }
        }
    }

    private drawDebugSolution(ctx: CanvasRenderingContext2D) {
        if (!this.game.secretGrid || gameState.secretGems.length === 0) return;
        const grid = this.game.secretGrid;
    
        ctx.save();
        ctx.globalAlpha = 0.2;
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const state = grid[y][x];
                if (state !== CellState.EMPTY) {
                    const gem = gameState.secretGems.find(g =>
                        x >= g.x && x < g.x + g.gridPattern[0].length &&
                        y >= g.y && y < g.y + g.gridPattern.length &&
                        g.gridPattern[y - g.y][x - g.x] === state
                    );
                    if (gem) {
                        this.drawCellShape(ctx, x * this.cellWidth, y * this.cellHeight, this.cellWidth, this.cellHeight, state, GEMS[gem.name].color);
                    }
                }
            }
        }
        ctx.restore();
    
        ctx.save();
        ctx.fillStyle = '#000000'; // Black text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const fontSize = Math.min(this.cellWidth / 3, 14); // Dynamic font size
        ctx.font = `bold ${fontSize}px sans-serif`;
    
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const state = grid[y][x];
                let label = '';
                switch (state) {
                    case CellState.TRIANGLE_TL: label = 'TL'; break;
                    case CellState.TRIANGLE_TR: label = 'TR'; break;
                    case CellState.TRIANGLE_BL: label = 'BL'; break;
                    case CellState.TRIANGLE_BR: label = 'BR'; break;
                }
    
                if (label) {
                    const centerX = (x + 0.5) * this.cellWidth;
                    const centerY = (y + 0.5) * this.cellHeight;
                    ctx.fillText(label, centerX, centerY);
                }
            }
        }
        ctx.restore();
    }
    
    private drawFinalSolution(ctx: CanvasRenderingContext2D, grid: CellState[][], gems: Gem[]) {
        const canvas = ctx.canvas;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) return;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        this._drawGrid(ctx, rect.width, rect.height);

        const cellW = rect.width / GRID_WIDTH;
        const cellH = rect.height / GRID_HEIGHT;

         for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const state = grid[y][x];
                if (state !== CellState.EMPTY) {
                    const gem = gems.find(g => 
                        x >= g.x && x < g.x + g.gridPattern[0].length &&
                        y >= g.y && y < g.y + g.gridPattern.length &&
                        g.gridPattern[y-g.y][x-g.x] === state
                    );
                     if (gem) {
                        this.drawCellShape(ctx, x * cellW, y * cellH, cellW, cellH, state, GEMS[gem.name].color, true);
                    }
                }
            }
        }
    }

    private drawCellShape(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, state: CellState, color: string, isFinalSolution = false) {
        if (color === COLORS.TRANSPARENT) {
            ctx.fillStyle = 'transparent';
            // A light, glassy blue, distinct from white, grey, and other gem colors.
            ctx.strokeStyle = '#a4d4e4';
            ctx.lineWidth = 2;
        } else {
            ctx.fillStyle = color;
            ctx.strokeStyle = isFinalSolution ? COLORS.correct : 'rgba(0,0,0,0.4)';
            ctx.lineWidth = isFinalSolution ? 2 : 1;
        }

        ctx.beginPath();
        switch (state) {
            case CellState.BLOCK:
            case CellState.ABSORB:
                ctx.rect(x, y, w, h);
                break;
            case CellState.TRIANGLE_TL:
                ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x, y + h); ctx.closePath();
                break;
            case CellState.TRIANGLE_TR:
                ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.closePath();
                break;
            case CellState.TRIANGLE_BR:
                ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
                break;
            case CellState.TRIANGLE_BL:
                ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.closePath();
                break;
        }
        ctx.fill();
        ctx.stroke();
    }
    
    private addGemOverlay(gem: Gem) {
        if (!this.board.clientWidth) return;
        
        const div = document.createElement('div');
        div.id = gem.id;
        div.className = 'gem-overlay';
        div.draggable = true;

        const pHeight = gem.gridPattern.length;
        const pWidth = gem.gridPattern[0].length;

        div.style.left = `${gem.x * this.cellWidth}px`;
        div.style.top = `${gem.y * this.cellHeight}px`;
        div.style.width = `${pWidth * this.cellWidth}px`;
        div.style.height = `${pHeight * this.cellHeight}px`;
        
        if (!gem.isValid) {
            div.classList.add('invalid-pos');
        }
        
        this.board.appendChild(div);
    }
    
    private getPathColor(result: { colors: string[], absorbed?: boolean }): string {
        if (result.absorbed) return COLORS.ABSORBIERT;
        if (result.colors.length === 0) return 'rgba(236, 240, 241, 0.7)';
        const key = [...result.colors].sort().join(',');
        return COLOR_MIXING[key] || '#ccc';
    }

    public showWavePath(result: { path: {x:number, y:number}[], colors: string[], absorbed?: boolean }) {
        if (!gameState.debugMode) return;
        const color = this.getPathColor(result);
        this.drawPath(result.path, color);
    }

    private drawPath(path: {x:number, y:number}[], color: string) {
        this.clearPath();
        if (path.length < 2) return;
    
        this.pathCtx.strokeStyle = color;
        this.pathCtx.lineWidth = 3;
        this.pathCtx.lineCap = 'round';
        this.pathCtx.lineJoin = 'round';
        this.pathCtx.shadowColor = 'rgba(0,0,0,0.5)';
        this.pathCtx.shadowBlur = 5;
    
        this.pathCtx.beginPath();
        this.pathCtx.moveTo(path[0].x * this.cellWidth, path[0].y * this.cellHeight);
        for (let i = 1; i < path.length; i++) {
            this.pathCtx.lineTo(path[i].x * this.cellWidth, path[i].y * this.cellHeight);
        }
        this.pathCtx.stroke();
    }

    private clearPath() {
        this.pathCtx.clearRect(0, 0, this.pathOverlay.width, this.pathOverlay.height);
    }
    
    switchTab(tabName: 'actions' | 'log') {
        document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => el.classList.remove('active'));
        document.getElementById(`${tabName}-tab-btn`)!.classList.add('active');
        document.getElementById(`${tabName}-panel`)!.classList.add('active');
    }

    updateEmitterState(emitterId: string, result: any) {
        const getContrast = (hex: string) => {
            if (!hex || hex.length < 7) return '#ffffff';
            const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
            return (r*0.299 + g*0.587 + b*0.114) > 186 ? '#000000' : '#ffffff';
        };

        const color = this.getPathColor(result);
        
        const startEl = this.boardWrapper.querySelector(`.emitter[data-id="${emitterId}"]`) as HTMLElement;
        if(startEl) {
            startEl.classList.add('used');
            startEl.style.backgroundColor = color;
            startEl.style.color = getContrast(color);
        }
        if(result.exitId) {
            const endEl = this.boardWrapper.querySelector(`.emitter[data-id="${result.exitId}"]`) as HTMLElement;
            if(endEl) {
                endEl.style.backgroundColor = color;
                endEl.style.color = getContrast(color);
            }
        }
    }

    addLogEntry(logEntry: LogEntry, waveId: string) {
        const li = document.createElement('li');
        li.dataset.waveId = waveId;
        
        const { result } = logEntry;
        const resultText = `${waveId} ➔ ${result.exitId}`;
        const resultColor = this.getPathColor(result);

        li.innerHTML = `<span>${resultText}</span><div class="log-color-box" style="background-color: ${resultColor};"></div>`;
        this.logList.prepend(li);
        this.switchTab('log');
    }
    
    showEndScreen(isWin: boolean, waveCount: number, secretGrid: CellState[][], secretGems: Gem[]) {
        this.endTitle.textContent = isWin ? 'Gewonnen!' : 'Verloren!';
        this.endStats.textContent = isWin 
            ? `Du hast die Mine in ${waveCount} Abfragen gelöst!`
            : `Du hast ${waveCount} Abfragen gebraucht.`;
        
        this.showScreen('end');
        requestAnimationFrame(() => {
            this.drawFinalSolution(this.endSolutionCtx, secretGrid, secretGems);
        });
    }

    private handleDragStart(e: DragEvent) {
        const target = e.target as HTMLElement;
        if (!e.dataTransfer || !target.draggable) return;
    
        const toolbarGemEl = target.closest('.toolbar-gem') as HTMLElement | null;
        const boardGemEl = target.closest('.gem-overlay') as HTMLElement | null;
        let info;
    
        if (toolbarGemEl) {
            const gemName = toolbarGemEl.dataset.gemName!;
            info = { id: gemName, name: gemName, from: 'toolbar' as const, gridPattern: GEMS[gemName].gridPattern, element: toolbarGemEl };
        } else if (boardGemEl) {
            const gem = gameState.playerGems.find(g => g.id === boardGemEl.id);
            if (!gem) return;
            info = { id: gem.id, name: gem.name, from: 'board' as const, gridPattern: gem.gridPattern, element: boardGemEl };
        } else {
            return;
        }
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', info.id);
        this.draggedItemInfo = info;
    
        setTimeout(() => {
            info.element.classList.add('dragging');
        }, 0);
    
        e.dataTransfer.setDragImage(new Image(), 0, 0); // Hide default ghost
    
        // Setup and draw our custom preview
        const pWidth = info.gridPattern[0].length;
        const pHeight = info.gridPattern.length;
        this.dragPreviewEl.style.width = `${pWidth * this.cellWidth}px`;
        this.dragPreviewEl.style.height = `${pHeight * this.cellHeight}px`;
        this.dragPreviewEl.style.display = 'block';

        const dpr = window.devicePixelRatio || 1;
        this.dragPreviewCanvas.width = pWidth * this.cellWidth * dpr;
        this.dragPreviewCanvas.height = pHeight * this.cellHeight * dpr;
        this.dragPreviewCtx.scale(dpr, dpr);
        
        const gemDef = GEMS[info.name];
        for (let r = 0; r < pHeight; r++) {
            for (let c = 0; c < pWidth; c++) {
                const state = info.gridPattern[r][c];
                if (state !== CellState.EMPTY) {
                    this.drawCellShape(this.dragPreviewCtx, c * this.cellWidth, r * this.cellHeight, this.cellWidth, this.cellHeight, state, gemDef.color);
                }
            }
        }
    }

    private handleDragOver(e: DragEvent) {
        if (!this.draggedItemInfo) return;
        e.preventDefault();
        
        const boardRect = this.board.getBoundingClientRect();
        const x = e.clientX - boardRect.left;
        const y = e.clientY - boardRect.top;
        
        const gridX = Math.round(x / this.cellWidth - 0.5);
        const gridY = Math.round(y / this.cellHeight - 0.5);
    
        const previewX = this.board.offsetLeft + gridX * this.cellWidth;
        const previewY = this.board.offsetTop + gridY * this.cellHeight;
        this.dragPreviewEl.style.transform = `translate(${previewX}px, ${previewY}px)`;

        const gemToTest = { ...this.draggedItemInfo, x: gridX, y: gridY };
        const isValid = this.game.canPlaceGem(gemToTest);
    
        this.lastValidDropTarget = { x: gridX, y: gridY, isValid };
    
        if (isValid) {
            this.dragPreviewEl.classList.add('valid-pos');
            this.dragPreviewEl.classList.remove('invalid-pos');
        } else {
            this.dragPreviewEl.classList.add('invalid-pos');
            this.dragPreviewEl.classList.remove('valid-pos');
        }
    }

    private handleDrop(e: DragEvent) {
        if (!this.draggedItemInfo) return;
        e.preventDefault();

        const boardRect = this.board.getBoundingClientRect();
        const isOutside = e.clientX < boardRect.left || e.clientX > boardRect.right || e.clientY < boardRect.top || e.clientY > boardRect.bottom;
        
        if (isOutside) {
            if (this.draggedItemInfo.from === 'board') {
                this.game.removePlayerGem(this.draggedItemInfo.id);
            }
        } else {
            if (this.lastValidDropTarget.isValid) {
                const { x, y } = this.lastValidDropTarget;
                if (this.draggedItemInfo.from === 'toolbar') {
                    this.game.addPlayerGem(this.draggedItemInfo.name, x, y);
                } else { // from board
                    this.game.movePlayerGem(this.draggedItemInfo.id, x, y);
                }
            }
        }
    }

    private handleDragEnd(e: DragEvent) {
        if (!this.draggedItemInfo) return;
    
        // Hide the preview element. This is the most important cleanup step.
        this.dragPreviewEl.style.display = 'none';
        this.dragPreviewEl.classList.remove('valid-pos', 'invalid-pos');
        
        // Reset drag info state
        this.draggedItemInfo = null;
        
        // Perform a final redraw to synchronize the UI with the game state.
        // This handles all cases: a successful move, a removal, or a cancelled drag.
        // It will implicitly remove the 'dragging' class by recreating all overlays from the current gameState.
        this.redrawAll();
    }
    
    private handleBoardClick(e: MouseEvent) {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const overlay = target.closest('.gem-overlay');
        if (overlay && !this.draggedItemInfo) { // Prevent rotation during a drag
            this.game.rotatePlayerGem(overlay.id);
        }
    }

    private _getPathColorName(result: { colors: string[], absorbed?: boolean }): string {
        if (result.absorbed) return 'Absorbiert';
        if (result.colors.length === 0) return 'Keine Farbe';
        const key = [...result.colors].sort().join(',');
        return COLOR_NAMES[key] || 'Unbekannte Mischung';
    }

    private handleEmitterHover(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (!target.classList.contains('emitter')) return;

        const emitterId = target.dataset.id;
        if (!emitterId) return;

        const logEntry = gameState.log.find(
            entry => entry.waveId === emitterId || entry.result.exitId === emitterId
        );

        if (!logEntry) return;

        const colorName = this._getPathColorName(logEntry.result);

        const startId = logEntry.waveId;
        const endId = logEntry.result.exitId;

        const startEl = this.boardWrapper.querySelector(`.emitter[data-id="${startId}"]`);
        const endEl = this.boardWrapper.querySelector(`.emitter[data-id="${endId}"]`);

        if (startEl && endEl) {
            const pathColor = this.getPathColor(logEntry.result);
            const highlightClass = pathColor.toLowerCase() === COLORS.ROT.toLowerCase()
                ? 'highlight-pair-alt'
                : 'highlight-pair';
            
            startEl.classList.add(highlightClass);
            endEl.classList.add(highlightClass);

            (startEl as HTMLElement).title = colorName;
            (endEl as HTMLElement).title = colorName;
        }
    }

    private handleEmitterMouseOut(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.classList.contains('emitter')) {
             this.boardWrapper.querySelectorAll('.emitter').forEach(el => {
                el.classList.remove('highlight-pair', 'highlight-pair-alt');
                (el as HTMLElement).title = '';
            });
        }
    }

    private handleLogPress(e: Event) {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const li = target.closest('li');
        if (!li) return;
        const waveId = (li as HTMLElement).dataset.waveId;
        const entry = gameState.log.find(l => l.waveId === waveId);
        if (entry) {
            const color = this.getPathColor(entry.result);
            this.drawPath(entry.path, color);
        }
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
}
