



import { Game } from './game';
import { gameState, Gem, LogEntry, InteractionMode, WaveLog } from './state';
import { GEMS, COLORS, COLOR_MIXING, BASE_COLORS, COLOR_NAME_KEYS } from './constants';
import { CellState, GRID_WIDTH, GRID_HEIGHT } from './grid';
import { EmitterButton } from './ui-objects';
import { t } from './i18n';
import { InputHandler } from './input-handler';
import { UI } from './ui';

export class Renderer {
    private game: Game;
    private ui: UI;
    private inputHandler?: InputHandler;

    // Canvas Elements
    private boardWrapper: HTMLElement;
    private gemCanvas: HTMLCanvasElement;
    private gemCtx: CanvasRenderingContext2D;
    private pathOverlay: HTMLCanvasElement;
    private pathCtx: CanvasRenderingContext2D;
    private endSolutionCanvas: HTMLCanvasElement;
    private endSolutionCtx: CanvasRenderingContext2D;
    
    // Sizing state
    private cellWidth = 0;
    private cellHeight = 0;
    private gap = 1;
    
    // Drawable objects
    private emitters: EmitterButton[] = [];

    constructor(game: Game, ui: UI) {
        this.game = game;
        this.ui = ui;

        this.boardWrapper = document.getElementById('game-board-wrapper')!;
        this.gemCanvas = document.getElementById('gem-canvas') as HTMLCanvasElement;
        this.gemCtx = this.gemCanvas.getContext('2d')!;
        this.pathOverlay = document.getElementById('path-overlay') as HTMLCanvasElement;
        this.pathCtx = this.pathOverlay.getContext('2d')!;
        this.endSolutionCanvas = document.getElementById('end-solution-canvas') as HTMLCanvasElement;
        this.endSolutionCtx = this.endSolutionCanvas.getContext('2d')!;

        const ro = new ResizeObserver(() => this.handleResize());
        ro.observe(this.boardWrapper);
    }
    
    connectInputHandler(handler: InputHandler) {
        this.inputHandler = handler;
    }

    public handleResize() {
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
            canvas.getContext('2d')!.scale(dpr, dpr);
        });
        
        this.emitters.forEach(emitter => emitter.updateRect(this.cellWidth, this.cellHeight, this.gap));

        this.redrawAll();
    }
    
    public setupEmitters() {
        this.emitters = [];
        for (let i = 0; i < GRID_WIDTH; i++) this.emitters.push(new EmitterButton(`T${i + 1}`, `T${i + 1}`));
        for (let i = 0; i < GRID_WIDTH; i++) this.emitters.push(new EmitterButton(`B${i + 1}`, `B${i + 1}`));
        for (let i = 0; i < GRID_HEIGHT; i++) this.emitters.push(new EmitterButton(`L${i + 1}`, `L${i + 1}`));
        for (let i = 0; i < GRID_HEIGHT; i++) this.emitters.push(new EmitterButton(`R${i + 1}`, `R${i + 1}`));
    }
    
    public updateEmitterFromLog(logEntry: WaveLog) {
        const resultColor = this.getPathColor(logEntry.result);
        const startEmitter = this.emitters.find(e => e.id === logEntry.id);
        if (startEmitter) {
            startEmitter.isUsed = true;
            startEmitter.usedColor = resultColor;
        }
        if (logEntry.result.exitId && logEntry.result.exitId !== 'Loop?') {
            const endEmitter = this.emitters.find(e => e.id === logEntry.result.exitId);
            if (endEmitter) {
                endEmitter.isUsed = true;
                endEmitter.usedColor = resultColor;
            }
        }
    }

    redrawAll() {
        if (this.gemCanvas.width === 0 || !this.inputHandler) return; 

        // Clear canvases
        this._clearCanvas(this.gemCtx);
        this.clearPath();

        // --- Main Canvas (gemCtx) Drawing Order ---
        this._drawBoardBackgroundAndGrid(this.gemCtx);
        this._drawPermanentQueryFills(this.gemCtx);
        if (gameState.debugMode) this.drawDebugSolution(this.gemCtx);
        this.drawPlayerGems(this.gemCtx);
        this._drawPermanentQueryConflictBorders(this.gemCtx); // Draw conflicts on top of gems
        if (this.inputHandler.isDragging && this.inputHandler.draggedItemInfo) {
            this.drawDragPreview(this.gemCtx);
        }
        this.drawEmitters(this.gemCtx);
        
        // --- Overlay Canvas (pathCtx) Drawing Order ---
        this._drawPaths(this.pathCtx);
        this._drawHoverEffects(this.pathCtx);
        this._drawTooltips(this.pathCtx);
    }
    
    private drawEmitters(ctx: CanvasRenderingContext2D) {
        const selectedLog = gameState.selectedLogEntryId ? gameState.log.find(l => l.id === gameState.selectedLogEntryId) : null;
        this.emitters.forEach(e => {
            let isSelected = false;
            if (selectedLog && selectedLog.type === InteractionMode.WAVE) {
                isSelected = (e.id === selectedLog.id || e.id === selectedLog.result.exitId);
            }
            e.state = (e.id === this.inputHandler?.focusedEmitterId) ? 'focused' : 'normal';
            e.draw(ctx, isSelected);
        });
    }

    private _drawPaths(ctx: CanvasRenderingContext2D) {
        const selectedLog = gameState.selectedLogEntryId ? gameState.log.find(l => l.id === gameState.selectedLogEntryId) : null;
        if (selectedLog && selectedLog.type === InteractionMode.WAVE) {
            const shouldShowSolutionPath = gameState.difficulty === 'TRAINING' || gameState.debugMode;
            if (shouldShowSolutionPath && selectedLog.path) {
                const color = this.getPathColor(selectedLog.result);
                this.drawPath(ctx, selectedLog.path, color, false);
            }
        }
        
        if (gameState.showPlayerPathPreview && gameState.activePlayerPath && gameState.activePlayerResult) {
            const playerColor = this.getPathColor(gameState.activePlayerResult);
            this.drawPath(ctx, gameState.activePlayerPath, playerColor, true);
        }
    }

    private _drawHoverEffects(ctx: CanvasRenderingContext2D) {
        if (this.inputHandler?.hoveredGridCell && gameState.interactionMode === InteractionMode.QUERY && !this.inputHandler.isDragging) {
            this._drawQueryHover(ctx);
        }
    }

    private _drawTooltips(ctx: CanvasRenderingContext2D) {
        const selectedLog = gameState.selectedLogEntryId ? gameState.log.find(l => l.id === gameState.selectedLogEntryId) : null;
        if (selectedLog?.type === InteractionMode.WAVE) {
            this._drawSelectedWaveTooltip(ctx);
        } else if (selectedLog?.type === InteractionMode.QUERY) {
            this._drawSelectedQueryHighlight(ctx);
        }
    }
    
    private _drawBoardBackgroundAndGrid(ctx: CanvasRenderingContext2D) {
        ctx.save();
        
        const surfaceColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-color');
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
        
        ctx.fillStyle = surfaceColor;
        ctx.fillRect(0, 0, ctx.canvas.width / (window.devicePixelRatio||1), ctx.canvas.height / (window.devicePixelRatio||1));
        
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
    
    private _drawPermanentQueryFills(ctx: CanvasRenderingContext2D) {
        if (gameState.permanentQueryResults.length === 0) return;
        
        const playerGemMap = this.inputHandler!.getPlayerGemMap();
        
        ctx.save();
        ctx.globalAlpha = 0.5;

        for (const query of gameState.permanentQueryResults) {
            const { coords, result } = query;
            const playerGemOnCell = playerGemMap.get(`${coords.y},${coords.x}`);

            // Only draw the fill if the cell is empty.
            if (!playerGemOnCell) {
                const canvasCoords = this._gridToCanvasCoords(coords.x, coords.y);
                if (result.colorHex) {
                    ctx.fillStyle = result.colorHex;
                    if (this.isTransparentColor(result.colorHex)) {
                        ctx.fillStyle = 'rgba(164, 212, 228, 0.5)'; // Specific style for transparent
                    }
                } else {
                    ctx.fillStyle = 'rgba(127, 140, 141, 0.35)'; // Empty
                }
                ctx.fillRect(canvasCoords.x, canvasCoords.y, this.cellWidth, this.cellHeight);
            }
        }
        ctx.restore();
    }

    private _drawPermanentQueryConflictBorders(ctx: CanvasRenderingContext2D) {
        if (gameState.permanentQueryResults.length === 0) return;

        const playerGemMap = this.inputHandler!.getPlayerGemMap();

        ctx.save();
        for (const query of gameState.permanentQueryResults) {
            const { coords, result: correctResult } = query;
            const playerGemOnCell = playerGemMap.get(`${coords.y},${coords.x}`);

            if (playerGemOnCell) {
                const playerGemResult = this.game.getQueryResult(playerGemOnCell);
                if (playerGemResult.colorNameKey !== correctResult.colorNameKey) {
                    const canvasCoords = this._gridToCanvasCoords(coords.x, coords.y);
                    ctx.strokeStyle = correctResult.colorHex || 'white';
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = 1;
                    ctx.shadowColor = 'black';
                    ctx.shadowBlur = 6;
                    ctx.strokeRect(canvasCoords.x + 1.5, canvasCoords.y + 1.5, this.cellWidth - 3, this.cellHeight - 3);
                }
            }
        }
        ctx.restore();
    }

    private drawPlayerGems(ctx: CanvasRenderingContext2D) {
        for (const gem of gameState.playerGems) {
            if (this.inputHandler?.isDragging && this.inputHandler.draggedItemInfo?.from === 'board' && this.inputHandler.draggedItemInfo.id === gem.id) continue;
            
            const gemDef = this.game.getGemDefinition(gem.name);
            if (!gemDef) continue;
            
            let isHovered = false;
            if (this.inputHandler && !this.inputHandler.isDragging && gameState.interactionMode === InteractionMode.WAVE) {
                 isHovered = this.inputHandler.getGemAtCanvasPos(this.inputHandler.dragPos.x, this.inputHandler.dragPos.y)?.id === gem.id;
            }

            this.drawGem(ctx, gem, gemDef.color, !gem.isValid, isHovered);
        }
    }

    private drawDebugSolution(ctx: CanvasRenderingContext2D) {
        if (!this.game.secretGrid || gameState.secretGems.length === 0) return;
        ctx.save();
        ctx.globalAlpha = 0.2; // All solution gems are transparent
        for (const gem of gameState.secretGems) {
            const gemDef = this.game.getGemDefinition(gem.name);
            if (gemDef) this.drawGem(ctx, gem, gemDef.color);
        }
        ctx.restore();
    }
    
    private drawDragPreview(ctx: CanvasRenderingContext2D) {
        if (!this.inputHandler?.draggedItemInfo || !this.inputHandler) return;
        const { gridPattern, name } = this.inputHandler.draggedItemInfo;
        const gemDef = this.game.getGemDefinition(name);
        if (!gemDef) return;
        
        const { x, y, isValid } = this.inputHandler.lastValidDropTarget;

        ctx.save();
        ctx.globalAlpha = 0.7;
        this.drawGem(ctx, { x, y, gridPattern } as Gem, gemDef.color, !isValid);
        ctx.restore();
    }

    private drawGem(ctx: CanvasRenderingContext2D, gem: { x: number, y: number, gridPattern: CellState[][] }, color: string, isInvalid = false, isHovered = false) {
        const { gridPattern, x, y } = gem;
        for (let r = 0; r < gridPattern.length; r++) {
            for (let c = 0; c < gridPattern[r].length; c++) {
                if (gridPattern[r][c] !== CellState.EMPTY) {
                    const canvasCoords = this._gridToCanvasCoords(x + c, y + r);
                    this.drawCellShape(ctx, canvasCoords.x, canvasCoords.y, this.cellWidth, this.cellHeight, gridPattern[r][c], color, isInvalid, isHovered);
                }
            }
        }
    }
    
    private drawCellShape(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, state: CellState, color: string, isInvalid = false, isHovered = false) {
        ctx.save();
        
        if (this.isTransparentColor(color)) {
            ctx.fillStyle = 'rgba(164, 212, 228, 0.3)';
            ctx.strokeStyle = '#a4d4e4';
            ctx.lineWidth = 2;
        } else if (color === COLORS.SCHWARZ_GEM) {
            ctx.fillStyle = color;
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
        } else {
            ctx.fillStyle = color;
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;
        }
    
        if (isHovered && !isInvalid) {
             ctx.shadowColor = 'white';
             ctx.shadowBlur = 10;
        }
        if (isInvalid) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
            ctx.strokeStyle = COLORS.INVALID_GEM;
            ctx.lineWidth = 2;
            if (isHovered) {
                ctx.shadowColor = 'white';
                ctx.shadowBlur = 10;
            }
        }
    
        ctx.beginPath();
        const path = new Path2D();
        switch (state) {
            case CellState.BLOCK: case CellState.ABSORB:
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
    
    private drawPath(ctx: CanvasRenderingContext2D, path: {x:number, y:number}[], color: string, isPreview: boolean = false) {
        if (path.length < 2) return;
    
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

        const p2c = (p: {x: number, y: number}) => ({ x: gridStartX + p.x * stepX, y: gridStartY + p.y * stepY });
        
        ctx.moveTo(p2c(path[0]).x, p2c(path[0]).y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(p2c(path[i]).x, p2c(path[i]).y);
        }
        ctx.stroke();
        ctx.restore();
    }
    
    private _clearCanvas(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }

    public clearPath() {
        this._clearCanvas(this.pathCtx);
    }
    
    public getPathColor(result: { colors: string[], absorbed?: boolean }): string {
        if (result.absorbed) return COLORS.ABSORBIERT;
        if (result.colors.length === 0) return 'rgba(236, 240, 241, 0.7)';
        const key = [...result.colors].sort().join(',');
        return COLOR_MIXING[key] || '#ccc';
    }

    public _gridToCanvasCoords(gridX: number, gridY: number): { x: number; y: number } {
        return {
            x: (gridX + 1) * (this.cellWidth + this.gap),
            y: (gridY + 1) * (this.cellHeight + this.gap),
        };
    }

    public _canvasToGridCoords(canvasX: number, canvasY: number): { x: number; y: number } {
        return {
            x: Math.floor(canvasX / (this.cellWidth + this.gap)) - 1,
            y: Math.floor(canvasY / (this.cellHeight + this.gap)) - 1,
        }
    }
    
    public drawToolbarGem(canvas: HTMLCanvasElement, gemDef: any) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, rect.width, rect.height);

        const pattern = gemDef.gridPattern;
        const pHeight = pattern.length;
        const pWidth = pattern[0].length;
        const scale = Math.min(rect.width / pWidth, rect.height / pHeight);
        const cellSize = scale;
        const renderedWidth = pWidth * cellSize;
        const renderedHeight = pHeight * cellSize;
        const offsetX = (rect.width - renderedWidth) / 2;
        const offsetY = (rect.height - renderedHeight) / 2;
        const color = gemDef.color || '#bdc3c7';

        for (let r = 0; r < pHeight; r++) {
            for (let c = 0; c < pWidth; c++) {
                if (pattern[r][c] !== CellState.EMPTY) {
                    this.drawCellShape(ctx, c * cellSize + offsetX, r * cellSize + offsetY, cellSize, cellSize, pattern[r][c], color);
                }
            }
        }
    }
    
    public drawEndScreenSolution(correctGems: Gem[], playerGems: Gem[]) {
        const solutionCanvas = this.endSolutionCanvas;
        const solutionCtx = this.endSolutionCtx;
        const dpr = window.devicePixelRatio || 1;
    
        // Make the solution canvas exactly the same size as the main game canvas
        solutionCanvas.width = this.gemCanvas.width;
        solutionCanvas.height = this.gemCanvas.height;
        solutionCanvas.style.width = this.gemCanvas.style.width;
        solutionCanvas.style.height = this.gemCanvas.style.height;
    
        // Reset transform and clear before drawing
        solutionCtx.setTransform(1, 0, 0, 1, 0, 0);
        solutionCtx.clearRect(0, 0, solutionCanvas.width, solutionCanvas.height);
    
        // Apply DPR scaling just like the main canvas
        solutionCtx.scale(dpr, dpr);
    
        // Helper to draw a set of gems
        const drawGems = (ctx: CanvasRenderingContext2D, gems: Gem[], opacity: number, highlightInvalid: boolean) => {
            ctx.save();
            ctx.globalAlpha = opacity;
            for (const gem of gems) {
                const gemDef = this.game.getGemDefinition(gem.name);
                if (gemDef) this.drawGem(ctx, gem, gemDef.color, highlightInvalid ? !gem.isValid : false);
            }
            ctx.restore();
        };
    
        // Draw everything directly onto the solution canvas
        this._drawBoardBackgroundAndGrid(solutionCtx);
        this.emitters.forEach(e => e.draw(solutionCtx, false));
        drawGems(solutionCtx, correctGems, 1.0, false);
        if (playerGems.length > 0) {
            drawGems(solutionCtx, playerGems, 0.55, true);
        }
    }
    
    private _drawSelectedWaveTooltip(ctx: CanvasRenderingContext2D) {
        if (!this.inputHandler) return;
        const selectedLog = gameState.log.find(l => l.id === gameState.selectedLogEntryId) as WaveLog | undefined;
        if (!selectedLog || selectedLog.type !== InteractionMode.WAVE) return;
    
        const contextEmitterId = gameState.previewSourceEmitterId || selectedLog.id;
        const contextEmitter = this.emitters.find(e => e.id === contextEmitterId);
        if (!contextEmitter) return;

        const pathColorName = this.ui.getPathColorName(selectedLog.result);
        const text = (contextEmitterId === selectedLog.id)
            ? `${selectedLog.id} ➔ ${pathColorName} ➔ ${selectedLog.result.exitId}`
            : `${selectedLog.result.exitId} ➔ ${pathColorName} ➔ ${selectedLog.id}`;
    
        this.drawTooltip(ctx, text, contextEmitter.rect);
    }

    private drawTooltip(ctx: CanvasRenderingContext2D, text: string, anchorRect: DOMRect | {x:number, y:number, width:number, height:number}) {
        ctx.save();
        const fontSize = this.cellHeight * 0.35;
        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
        ctx.textBaseline = 'middle';
        
        const textMetrics = ctx.measureText(text);
        const padding = { x: 8, y: 5 };
        const rectWidth = textMetrics.width + padding.x * 2;
        const rectHeight = fontSize + padding.y * 2;
        const margin = 5;
        const canvasW = this.gemCanvas.width / (window.devicePixelRatio || 1);
        const canvasH = this.gemCanvas.height / (window.devicePixelRatio || 1);
        
        let rectX = 0, rectY = 0;

        rectY = anchorRect.y + anchorRect.height + margin;
        rectX = anchorRect.x + anchorRect.width / 2 - rectWidth / 2;
        if (rectY + rectHeight > canvasH) {
            rectY = anchorRect.y - rectHeight - margin;
            if (rectY < 0) {
                rectX = anchorRect.x + anchorRect.width + margin;
                rectY = anchorRect.y + anchorRect.height / 2 - rectHeight / 2;
                if (rectX + rectWidth > canvasW) {
                    rectX = anchorRect.x - rectWidth - margin;
                }
            }
        }
        
        if (rectX < 0) rectX = 0;
        if (rectX + rectWidth > canvasW) rectX = canvasW - rectWidth;
        if (rectY < 0) rectY = 0;
        if (rectY + rectHeight > canvasH) rectY = canvasH - rectHeight;
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 6);
        ctx.fill();
    
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(text, rectX + rectWidth / 2, rectY + rectHeight / 2);
        ctx.restore();
    }

    private _drawSelectedQueryHighlight(ctx: CanvasRenderingContext2D) {
        const selectedLog = gameState.log.find(l => l.id === gameState.selectedLogEntryId);
        if (!selectedLog || selectedLog.type !== InteractionMode.QUERY) return;
        
        const { coords, result } = selectedLog;
        const canvasCoords = this._gridToCanvasCoords(coords.x, coords.y);
        
        ctx.save();
        ctx.globalAlpha = 0.5;
        if (result.colorHex) {
            ctx.fillStyle = result.colorHex;
            if (this.isTransparentColor(result.colorHex)) {
                ctx.fillStyle = 'rgba(164, 212, 228, 0.5)';
                ctx.strokeStyle = '#a4d4e4';
                ctx.lineWidth = 2;
                ctx.strokeRect(canvasCoords.x, canvasCoords.y, this.cellWidth, this.cellHeight);
            }
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        }
        ctx.fillRect(canvasCoords.x, canvasCoords.y, this.cellWidth, this.cellHeight);
        ctx.restore();
    }

    private _drawQueryHover(ctx: CanvasRenderingContext2D) {
        if (!this.inputHandler?.hoveredGridCell) return;
        const { x, y } = this.inputHandler.hoveredGridCell;
        const canvasCoords = this._gridToCanvasCoords(x, y);
    
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        ctx.strokeRect(canvasCoords.x, canvasCoords.y, this.cellWidth, this.cellHeight);
        ctx.restore();
    }
    
    // --- Helper methods for colors ---
    public isTransparentColor(color: string | null): boolean {
        return color === COLORS.TRANSPARENT;
    }

    public getBaseColorHex(colorKey: string): string {
        return (BASE_COLORS[colorKey as keyof typeof BASE_COLORS] as any)?.color || '#000';
    }

    public getBaseColorNameKey(colorKey: string): string {
        return (BASE_COLORS[colorKey as keyof typeof BASE_COLORS] as any)?.nameKey || '';
    }
}
