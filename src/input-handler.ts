

import { Game } from './game';
import { UI } from './ui';
import { Renderer } from './renderer';
import { gameState, Gem, InteractionMode } from './state';
import { GRID_WIDTH, GRID_HEIGHT } from './grid';
import { CellState } from './grid';

type DragInfo = {
    name: string;
    from: 'toolbar' | 'board';
    gridPattern: CellState[][];
    element?: HTMLElement;
    id?: string;
    offsetX: number;
    offsetY: number;
};

export class InputHandler {
    private game: Game;
    private ui: UI;
    private renderer?: Renderer;

    // DOM Elements
    private gemCanvas: HTMLCanvasElement;
    private logList: HTMLElement;

    // Interaction State
    private dragStartInfo: { item: DragInfo | null, startX: number, startY: number } | null = null;
    public isDragging = false;
    public draggedItemInfo: DragInfo | null = null;
    public dragPos = { x: 0, y: 0 };
    public lastValidDropTarget = { x: -1, y: -1, isValid: false };
    public hoveredGridCell: { x: number, y: number } | null = null;
    public focusedEmitterId: string | null = null;
    
    private longPressTimeout: number | null = null;
    private longPressTriggered = false;

    constructor(game: Game, ui: UI) {
        this.game = game;
        this.ui = ui;

        this.gemCanvas = document.getElementById('gem-canvas') as HTMLCanvasElement;
        this.logList = document.getElementById('log-list') as HTMLElement;

        this.bindEvents();
    }

    connectRenderer(renderer: Renderer) {
        this.renderer = renderer;
    }

    private bindEvents() {
        // Global click listener for deselecting waves
        document.addEventListener('click', (e) => this.handleGlobalClick(e));
        
        this.logList.addEventListener('click', (e) => this.handleLogClick(e));

        // Canvas specific events
        this.gemCanvas.addEventListener('keydown', (e) => this.handleCanvasKeyDown(e));
        this.gemCanvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e.clientX, e.clientY));
        this.gemCanvas.addEventListener('mouseleave', () => this.handleCanvasMouseLeave());

        // Global pointer events for robust drag & drop (mouse and touch)
        document.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        document.addEventListener('touchstart', (e) => this.handlePointerDown(e), { passive: false });
        document.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        document.addEventListener('touchmove', (e) => this.handlePointerMove(e), { passive: false });
        document.addEventListener('mouseup', (e) => this.handlePointerUp(e));
        document.addEventListener('touchend', (e) => this.handlePointerUp(e));
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

    private handleGlobalClick(e: MouseEvent) {
        if (!gameState.selectedLogEntryId) return;
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('#gem-canvas') || target.closest('#log-list li') || target.closest('.preview-toggle-wrapper');
        if (!isInteractive) {
            this.game.setSelectedLogEntry(null);
        }
    }

    private handleLogClick(e: MouseEvent) {
        const li = (e.target as HTMLElement).closest('li');
        if (li && li.dataset.logId) {
            const logId = li.dataset.logId;
            if (gameState.selectedLogEntryId === logId) {
                this.game.setSelectedLogEntry(null);
            } else {
                const logEntry = gameState.log.find(l => l.id === logId);
                const sourceEmitterId = logEntry?.type === InteractionMode.WAVE ? logEntry.id : undefined;
                this.game.setSelectedLogEntry(logId, sourceEmitterId);
            }
        }
    }
    
    private handleCanvasHover(clientX: number, clientY: number) {
        if (this.isDragging || !this.renderer) return;
    
        const rect = this.gemCanvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        this.dragPos = { x, y };
        
        if (gameState.interactionMode === InteractionMode.QUERY) {
            const gridCoords = this.renderer._canvasToGridCoords(x, y);
            const isOverGrid = gridCoords.x >= 0 && gridCoords.x < GRID_WIDTH && gridCoords.y >= 0 && gridCoords.y < GRID_HEIGHT;
            this.gemCanvas.style.cursor = isOverGrid ? 'crosshair' : 'default';
            this.hoveredGridCell = isOverGrid ? gridCoords : null;
        } else {
            this.hoveredGridCell = null;
            const gem = this.getGemAtCanvasPos(x, y);
            const emitter = this.renderer['emitters'].find(em => em.isInside(x, y));
            this.gemCanvas.style.cursor = (gem || emitter) ? 'pointer' : 'default';
        }
    
        this.ui.redrawAll();
    }
    
    private handleCanvasMouseLeave() {
        this.dragPos = { x: -1, y: -1 };
        this.hoveredGridCell = null;
        this.gemCanvas.style.cursor = 'default';
        this.ui.redrawAll();
    }

    private handlePointerDown(e: MouseEvent | TouchEvent) {
        if (e instanceof MouseEvent && e.button !== 0) return;
        const coords = this.getPointerCoordinates(e);
        if (!coords) return;
        const { clientX, clientY } = coords;
        const target = e.target as HTMLElement;
        const toolbarGemEl = target.closest('.toolbar-gem:not(.placed)');
        const isOverCanvas = target.closest('#gem-canvas');
    
        if (e instanceof TouchEvent && (isOverCanvas || toolbarGemEl)) {
            e.preventDefault();
        }
        
        let potentialDragItem: DragInfo | null = null;
    
        if (toolbarGemEl) {
            const rect = toolbarGemEl.getBoundingClientRect();
            const name = (toolbarGemEl as HTMLElement).dataset.gemName!;
            const gemDef = this.ui.getGemDefinition(name);
            if (gemDef) {
                potentialDragItem = {
                    name,
                    from: 'toolbar',
                    gridPattern: gemDef.gridPattern,
                    element: (toolbarGemEl as HTMLElement),
                    offsetX: clientX - rect.left,
                    offsetY: clientY - rect.top,
                };
            }
        } else if (isOverCanvas && gameState.interactionMode === InteractionMode.WAVE && this.renderer) {
            const canvasRect = this.gemCanvas.getBoundingClientRect();
            const x = clientX - canvasRect.left;
            const y = clientY - canvasRect.top;
            const gem = this.getGemAtCanvasPos(x, y);
            if (gem) {
                const gridCoords = this.renderer._canvasToGridCoords(x, y);
                potentialDragItem = {
                    id: gem.id,
                    name: gem.name,
                    from: 'board',
                    gridPattern: gem.gridPattern,
                    offsetX: (gridCoords.x - gem.x) * this.renderer['cellWidth'],
                    offsetY: (gridCoords.y - gem.y) * this.renderer['cellHeight']
                };
                
                if (gem.isFlippable) {
                    this.longPressTimeout = window.setTimeout(() => {
                        this.game.flipPlayerGem(gem.id);
                        this.longPressTriggered = true;
                        this.dragStartInfo = null;
                        this.isDragging = false; 
                    }, 400);
                }
            }
        }
        
        if (isOverCanvas || toolbarGemEl) {
            this.dragStartInfo = { item: potentialDragItem, startX: clientX, startY: clientY };
        }
    }

    private handlePointerMove(e: MouseEvent | TouchEvent) {
        const coords = this.getPointerCoordinates(e);
        if (!coords) return;
        const { clientX, clientY } = coords;
    
        if (this.dragStartInfo) {
            if (e instanceof TouchEvent) e.preventDefault();
            
            const dx = clientX - this.dragStartInfo.startX;
            const dy = clientY - this.dragStartInfo.startY;
            
            if (!this.isDragging && Math.sqrt(dx * dx + dy * dy) > 10) {
                if (this.longPressTimeout) {
                    clearTimeout(this.longPressTimeout);
                    this.longPressTimeout = null;
                }
                
                if (this.dragStartInfo.item) {
                    this.isDragging = true;
                    this.draggedItemInfo = this.dragStartInfo.item;
                    this.gemCanvas.style.cursor = 'grabbing';
                    if(this.draggedItemInfo.element) this.draggedItemInfo.element.classList.add('dragging');
                } else {
                    this.dragStartInfo = null;
                }
            }
    
            if (this.isDragging) {
                const canvasRect = this.gemCanvas.getBoundingClientRect();
                this.dragPos = { x: clientX - canvasRect.left, y: clientY - canvasRect.top };
                
                const { gridPattern, name, id } = this.draggedItemInfo!;
                const pWidth = gridPattern[0].length;
                const pHeight = gridPattern.length;
                const gridX = Math.round(this.renderer!._canvasToGridCoords(this.dragPos.x, this.dragPos.y).x - pWidth / 2 + 0.5);
                const gridY = Math.round(this.renderer!._canvasToGridCoords(this.dragPos.y, this.dragPos.y).y - pHeight / 2 + 0.5);

                const gemToTest = { id, name, x: gridX, y: gridY, gridPattern };
                this.lastValidDropTarget.isValid = this.game.canPlaceGem(gemToTest);
                this.lastValidDropTarget.x = gridX;
                this.lastValidDropTarget.y = gridY;
                
                this.ui.redrawAll();
            }
        } else {
            const isOverCanvas = (e.target as HTMLElement).closest('#gem-canvas');
            if (isOverCanvas) {
                this.handleCanvasHover(clientX, clientY);
            } else {
                this.handleCanvasMouseLeave();
            }
        }
    }

    private handlePointerUp(e: MouseEvent | TouchEvent) {
        if (this.longPressTimeout) clearTimeout(this.longPressTimeout);
        if (this.longPressTriggered) {
            this.longPressTriggered = false; this.dragStartInfo = null; this.isDragging = false;
            this.ui.redrawAll();
            return;
        }
    
        const coords = this.getPointerCoordinates(e);
        if (!coords || !this.renderer) {
            this.dragStartInfo = null; this.isDragging = false;
            return;
        }
    
        if (this.isDragging && this.draggedItemInfo) {
            const canvasRect = this.gemCanvas.getBoundingClientRect();
            const isOverCanvas = coords.clientX >= canvasRect.left && coords.clientX <= canvasRect.right && coords.clientY >= canvasRect.top && coords.clientY <= canvasRect.bottom;
            
            if (isOverCanvas) {
                const { x, y } = this.lastValidDropTarget;
                if (this.draggedItemInfo.from === 'toolbar') this.game.addPlayerGem(this.draggedItemInfo.name, x, y);
                else if (this.draggedItemInfo.id) this.game.movePlayerGem(this.draggedItemInfo.id, x, y);
            } else if (this.draggedItemInfo.from === 'board' && this.draggedItemInfo.id) {
                this.game.removePlayerGem(this.draggedItemInfo.id);
            }
        } else if (this.dragStartInfo) { // Tap occurred
            const target = e.target as HTMLElement;
            if (target.closest('#gem-canvas')) {
                this.handleCanvasTap(coords.clientX, coords.clientY);
            }
        }
    
        if (this.draggedItemInfo?.element) this.draggedItemInfo.element.classList.remove('dragging');
        this.dragStartInfo = null; this.isDragging = false; this.draggedItemInfo = null;
        this.gemCanvas.style.cursor = 'default';
        this.ui.redrawAll();
        this.ui.updateToolbar();
    }
    
    private handleCanvasTap(clientX: number, clientY: number) {
        if (!this.renderer) return;
        const rect = this.gemCanvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (gameState.interactionMode === InteractionMode.WAVE) {
            const clickedEmitter = this.renderer['emitters'].find(em => em.isInside(x, y));
            if (clickedEmitter) {
                if (!clickedEmitter.isUsed) {
                    this.game.sendWave(clickedEmitter.id);
                } else {
                    const logEntry = gameState.log.find(l => l.type === InteractionMode.WAVE && (l.id === clickedEmitter.id || l.result.exitId === clickedEmitter.id));
                    if (logEntry) {
                        this.game.setSelectedLogEntry(
                            (gameState.selectedLogEntryId === logEntry.id && gameState.previewSourceEmitterId === clickedEmitter.id) ? null : logEntry.id, 
                            clickedEmitter.id
                        );
                    } else this.game.setSelectedLogEntry(null);
                }
            } else {
                const clickedGem = this.getGemAtCanvasPos(x, y);
                if (clickedGem && this.dragStartInfo?.item?.id === clickedGem.id) {
                    this.game.setSelectedLogEntry(null);
                    this.game.rotatePlayerGem(clickedGem.id);
                } else {
                    this.game.setSelectedLogEntry(null);
                }
            }
        } else { // QUERY mode
            const gridCoords = this.renderer._canvasToGridCoords(x, y);
            if (gridCoords.x >= 0 && gridCoords.x < GRID_WIDTH && gridCoords.y >= 0 && gridCoords.y < GRID_HEIGHT) {
                this.game.queryCell(gridCoords.x, gridCoords.y);
            } else {
                this.game.setSelectedLogEntry(null);
            }
        }
    }

    private handleCanvasKeyDown(e: KeyboardEvent) {
        if (gameState.interactionMode !== InteractionMode.WAVE || !this.renderer) return;
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)) return;
        e.preventDefault();
        
        const emitters = this.renderer['emitters'];
        if (e.key === 'Enter' || e.key === ' ') {
            if (this.focusedEmitterId) {
                const focusedEmitter = emitters.find(em => em.id === this.focusedEmitterId);
                if (focusedEmitter && !focusedEmitter.isUsed) this.game.sendWave(this.focusedEmitterId);
                else if (focusedEmitter?.isUsed) {
                    const logEntry = gameState.log.find(l => l.type === InteractionMode.WAVE && (l.id === focusedEmitter.id || l.result.exitId === focusedEmitter.id));
                    if(logEntry) this.game.setSelectedLogEntry(
                        (gameState.selectedLogEntryId === logEntry.id && gameState.previewSourceEmitterId === focusedEmitter.id) ? null : logEntry.id, 
                        focusedEmitter.id
                    );
                }
            }
            this.ui.redrawAll();
            this.ui.updateLogHighlight();
            return;
        }

        // If no emitter is focused, set a default one before proceeding.
        if (!this.focusedEmitterId && emitters.length > 0) {
            this.focusedEmitterId = emitters[0].id;
        }

        const focusedIndex = emitters.findIndex(em => em.id === this.focusedEmitterId);
        if (focusedIndex === -1) return;
        let nextIndex = -1;
        switch (e.key) {
            case 'ArrowRight': nextIndex = (focusedIndex + 1) % emitters.length; break;
            case 'ArrowLeft': nextIndex = (focusedIndex - 1 + emitters.length) % emitters.length; break;
            case 'ArrowUp': nextIndex = (focusedIndex - 1 + emitters.length) % emitters.length; break;
            case 'ArrowDown': nextIndex = (focusedIndex + 1) % emitters.length; break;
        }
        if (nextIndex !== -1) {
            this.focusedEmitterId = emitters[nextIndex].id;
            this.ui.redrawAll();
        }
    }
    
    public getGemAtCanvasPos(canvasX: number, canvasY: number): Gem | null {
        if (!this.renderer || canvasX < 0 || canvasY < 0) return null;
        const { x, y } = this.renderer._canvasToGridCoords(canvasX, canvasY);
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
    
    public getPlayerGemMap(): Map<string, Gem> {
        const map = new Map<string, Gem>();
        for (const gem of gameState.playerGems) {
            for (let r = 0; r < gem.gridPattern.length; r++) {
                for (let c = 0; c < gem.gridPattern[r].length; c++) {
                    if (gem.gridPattern[r][c] !== CellState.EMPTY) {
                        map.set(`${gem.y + r},${gem.x + c}`, gem);
                    }
                }
            }
        }
        return map;
    }
}