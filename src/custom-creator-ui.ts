
import { Game } from './game';
import { Renderer } from './renderer';
import { t } from './i18n';
import { BASE_COLORS, CUSTOM_SHAPES, COLORS, DIFFICULTIES } from './constants';
import { CellState } from './grid';
import { gameState } from './state';

type CustomCreatorState = {
    selectedColorKey: string | null;
    selectedShapeKey: string | null;
    gems: any[];
    designerGridState: CellState[][];
    customDesignedShape: { gridPattern: CellState[][] } | null;
};

export class CustomCreatorUI {
    private game: Game;
    private renderer: Renderer;

    // DOM Elements
    private customColorSelector: HTMLElement;
    private customShapeSelector: HTMLElement;
    private btnAddCustomGem: HTMLButtonElement;
    private customGemList: HTMLElement;
    private customValidationFeedback: HTMLElement;
    private btnStartCustomLevel: HTMLButtonElement;
    
    // Designer Modal Elements
    private designerModal: HTMLElement;
    private designerGrid: HTMLElement;
    private designerPreviewCanvas: HTMLCanvasElement;
    private btnFinishDesign: HTMLButtonElement;
    private btnCancelDesign: HTMLButtonElement;

    private state: CustomCreatorState = {
        selectedColorKey: null,
        selectedShapeKey: null,
        gems: [],
        designerGridState: [],
        customDesignedShape: null,
    };

    constructor(game: Game, renderer: Renderer) {
        this.game = game;
        this.renderer = renderer;

        this.customColorSelector = document.getElementById('custom-color-selector')!;
        this.customShapeSelector = document.getElementById('custom-shape-selector')!;
        this.btnAddCustomGem = document.getElementById('btn-add-custom-gem') as HTMLButtonElement;
        this.customGemList = document.getElementById('custom-gem-list')!;
        this.customValidationFeedback = document.getElementById('custom-validation-feedback')!;
        this.btnStartCustomLevel = document.getElementById('btn-start-custom-level') as HTMLButtonElement;

        this.designerModal = document.getElementById('custom-shape-designer-modal')!;
        this.designerGrid = document.getElementById('designer-grid')!;
        this.designerPreviewCanvas = document.getElementById('designer-preview-canvas') as HTMLCanvasElement;
        this.btnFinishDesign = document.getElementById('btn-finish-design') as HTMLButtonElement;
        this.btnCancelDesign = document.getElementById('btn-cancel-design') as HTMLButtonElement;
        
        this.btnAddCustomGem.addEventListener('click', () => this.handleAddCustomGem());
        this.btnStartCustomLevel.addEventListener('click', () => this.handleStartCustomLevel());
        this.btnFinishDesign.addEventListener('click', () => this.handleFinishDesign());
        this.btnCancelDesign.addEventListener('click', () => this.closeDesigner());
    }

    public setup() {
        // Check if there's a previous custom level set in the global game state.
        const hasPreviousCustomLevel = gameState.customGemSet.length > 0 && Object.keys(gameState.customGemDefinitions).length > 0;

        // Restore previous gems if they exist, otherwise start fresh.
        const initialGems = hasPreviousCustomLevel
            ? gameState.customGemSet.map(gemName => gameState.customGemDefinitions[gemName]).filter(Boolean) // Filter out undefined if state is inconsistent
            : [];

        this.state = {
            selectedColorKey: null,
            selectedShapeKey: null,
            gems: initialGems, // Use restored or empty array.
            designerGridState: Array.from({ length: 4 }, () => Array(4).fill(CellState.EMPTY)),
            customDesignedShape: null,
        };
        
        this.populateSelectors();
        this.updateCustomGemList();
        this.validateCustomSet();
    }
    
    private populateSelectors() {
        this.customColorSelector.innerHTML = '';
        Object.entries(BASE_COLORS).forEach(([key, value]) => {
            const div = document.createElement('div');
            div.className = 'color-choice';
            div.dataset.colorKey = key;
            div.style.backgroundColor = value.color;
            if (this.renderer.isTransparentColor(value.color)) {
                div.style.border = `2px solid ${COLORS.TRANSPARENT}`;
                div.style.backgroundColor = 'rgba(164, 212, 228, 0.3)';
            }
            div.title = t(value.nameKey);
            div.onclick = () => {
                this.state.selectedColorKey = key;
                this.customColorSelector.querySelectorAll('.color-choice').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
            };
            this.customColorSelector.appendChild(div);
        });

        this.customShapeSelector.innerHTML = '';
        Object.entries(CUSTOM_SHAPES).forEach(([key, value]) => {
            const div = document.createElement('div');
            div.className = 'shape-choice';
            div.dataset.shapeKey = key;
            div.title = t(value.nameKey);
            const canvas = document.createElement('canvas');
            div.appendChild(canvas);
            
            if (key === 'SHAPE_CUSTOM_DESIGN') {
                div.onclick = () => this.openDesigner();
            } else {
                div.onclick = () => {
                    this.state.selectedShapeKey = key;
                    this.customShapeSelector.querySelectorAll('.shape-choice').forEach(el => el.classList.remove('selected'));
                    div.classList.add('selected');
                };
            }
            this.customShapeSelector.appendChild(div);
            setTimeout(() => this.renderer.drawToolbarGem(canvas, { ...value, color: COLORS.BLAU }), 0);
        });
    }

    private openDesigner() {
        this.designerModal.classList.remove('hidden');
        this.designerGrid.innerHTML = '';
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const cellWrapper = document.createElement('div');
                cellWrapper.className = 'designer-cell';
                cellWrapper.dataset.row = r.toString();
                cellWrapper.dataset.col = c.toString();
                const canvas = document.createElement('canvas');
                cellWrapper.appendChild(canvas);
                cellWrapper.onclick = () => this.handleDesignerCellClick(r, c);
                this.designerGrid.appendChild(cellWrapper);
            }
        }
        this.updateDesignerGridCanvases();
        this.updateDesignerPreview();
    }

    private closeDesigner() {
        this.designerModal.classList.add('hidden');
    }

    private handleDesignerCellClick(row: number, col: number) {
        const currentState = this.state.designerGridState[row][col];
        // Cycle through: 0 (EMPTY) -> 1 (BLOCK) -> 2 (TL) -> 3 (TR) -> 4 (BR) -> 5 (BL)
        const nextState = (currentState + 1) % 6;
        this.state.designerGridState[row][col] = nextState;

        const cellCanvas = this.designerGrid.querySelector<HTMLCanvasElement>(`[data-row='${row}'][data-col='${col}'] canvas`);
        if (cellCanvas) {
            this.drawDesignerCell(cellCanvas, nextState);
        }
        this.updateDesignerPreview();
    }
    
    private updateDesignerGridCanvases() {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                 const cellCanvas = this.designerGrid.querySelector<HTMLCanvasElement>(`[data-row='${r}'][data-col='${c}'] canvas`);
                 if (cellCanvas) {
                    this.drawDesignerCell(cellCanvas, this.state.designerGridState[r][c]);
                 }
            }
        }
    }

    private drawDesignerCell(canvas: HTMLCanvasElement, state: CellState) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0) return;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, rect.width, rect.height);

        if (state !== CellState.EMPTY) {
            ctx.fillStyle = COLORS.BLAU; // Use a consistent color for designing
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;

            ctx.beginPath();
            const path = new Path2D();
            const w = rect.width, h = rect.height, x = 0, y = 0;
            
            switch (state) {
                case CellState.BLOCK: path.rect(x, y, w, h); break;
                case CellState.TRIANGLE_TL: path.moveTo(x, y); path.lineTo(x + w, y); path.lineTo(x, y + h); path.closePath(); break;
                case CellState.TRIANGLE_TR: path.moveTo(x, y); path.lineTo(x + w, y); path.lineTo(x + w, y + h); path.closePath(); break;
                case CellState.TRIANGLE_BR: path.moveTo(x + w, y); path.lineTo(x + w, y + h); path.lineTo(x, y + h); path.closePath(); break;
                case CellState.TRIANGLE_BL: path.moveTo(x, y); path.lineTo(x, y + h); path.lineTo(x + w, y + h); path.closePath(); break;
            }
            ctx.fill(path);
            ctx.stroke(path);
        }
    }

    private cropPattern(pattern: CellState[][]): CellState[][] {
        let minRow = pattern.length, maxRow = -1, minCol = pattern[0].length, maxCol = -1;
        for (let r = 0; r < pattern.length; r++) {
            for (let c = 0; c < pattern[r].length; c++) {
                if (pattern[r][c] !== CellState.EMPTY) {
                    minRow = Math.min(minRow, r);
                    maxRow = Math.max(maxRow, r);
                    minCol = Math.min(minCol, c);
                    maxCol = Math.max(maxCol, c);
                }
            }
        }
        if (maxRow === -1) { // Empty pattern
            return [[CellState.EMPTY]];
        }
        return pattern.slice(minRow, maxRow + 1).map(row => row.slice(minCol, maxCol + 1));
    }

    private updateDesignerPreview() {
        const cropped = this.cropPattern(this.state.designerGridState);
        this.renderer.drawToolbarGem(this.designerPreviewCanvas, { gridPattern: cropped, color: COLORS.BLAU });
    }
    
    private handleFinishDesign() {
        const cropped = this.cropPattern(this.state.designerGridState);
        if (cropped.length === 1 && cropped[0].length === 1 && cropped[0][0] === CellState.EMPTY) {
            // Don't allow saving an empty shape.
            return;
        }

        this.state.customDesignedShape = { gridPattern: cropped };
        this.state.selectedShapeKey = 'SHAPE_CUSTOM_DESIGN';

        this.customShapeSelector.querySelectorAll('.shape-choice').forEach(el => el.classList.remove('selected'));
        const customShapeButton = this.customShapeSelector.querySelector<HTMLElement>("[data-shape-key='SHAPE_CUSTOM_DESIGN']");
        if (customShapeButton) {
            customShapeButton.classList.add('selected');
            const canvas = customShapeButton.querySelector('canvas');
            if (canvas) {
                this.renderer.drawToolbarGem(canvas, { gridPattern: cropped, color: COLORS.BLAU });
            }
        }
        this.closeDesigner();
    }
    
    private handleAddCustomGem() {
        const { selectedColorKey, selectedShapeKey } = this.state;
        if (!selectedColorKey || !selectedShapeKey) {
            alert(t('customCreator.alert.selectColorAndShape'));
            return;
        }

        const shapeDef = (selectedShapeKey === 'SHAPE_CUSTOM_DESIGN' && this.state.customDesignedShape)
            ? { ...this.state.customDesignedShape, nameKey: CUSTOM_SHAPES.SHAPE_CUSTOM_DESIGN.nameKey }
            : CUSTOM_SHAPES[selectedShapeKey as keyof typeof CUSTOM_SHAPES];

        if (!shapeDef || !shapeDef.gridPattern) return;
    
        const colorDef = BASE_COLORS[selectedColorKey as keyof typeof BASE_COLORS];
        
        const finalGridPattern = (selectedColorKey === 'SCHWARZ')
            ? shapeDef.gridPattern.map(row => row.map(cell => (cell !== CellState.EMPTY ? CellState.ABSORB : CellState.EMPTY)))
            : shapeDef.gridPattern;
        
        const gemName = `CUSTOM_${selectedColorKey}_${selectedShapeKey}_${Date.now()}`;
        
        const newGemDef = {
            ...colorDef,
            ...shapeDef,
            gridPattern: finalGridPattern,
            name: gemName,
            originalColorKey: selectedColorKey,
        };
        
        this.state.gems.push(newGemDef);
        this.updateCustomGemList();
        this.validateCustomSet();
    }
    
    private updateCustomGemList() {
        this.customGemList.innerHTML = '';
        this.state.gems.forEach((gemDef, index) => {
            const item = document.createElement('div');
            item.className = 'custom-gem-item';
            const canvas = document.createElement('canvas');
            item.appendChild(canvas);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-gem-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = t('buttons.remove');
            deleteBtn.onclick = () => {
                this.state.gems.splice(index, 1);
                this.updateCustomGemList();
                this.validateCustomSet();
            };
            item.appendChild(deleteBtn);
            
            this.customGemList.appendChild(item);
            setTimeout(() => this.renderer.drawToolbarGem(canvas, gemDef), 0);
        });
    }

    private validateCustomSet() {
        const counts = this.state.gems.reduce((acc, gem) => {
            acc[gem.originalColorKey] = (acc[gem.originalColorKey] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
    
        const validationRules = [
            { condition: (counts['ROT'] ?? 0) === 1, errorKey: "validation.exactOneRed" },
            { condition: (counts['GELB'] ?? 0) === 1, errorKey: "validation.exactOneYellow" },
            { condition: (counts['BLAU'] ?? 0) === 1, errorKey: "validation.exactOneBlue" },
            { condition: (counts['WEISS'] ?? 0) >= 1, errorKey: "validation.atLeastOneWhite" },
            { condition: (counts['WEISS'] ?? 0) <= 2, errorKey: "validation.maxTwoWhite" },
            { condition: (counts['TRANSPARENT'] ?? 0) <= 2, errorKey: "validation.maxTwoTransparent" },
            { condition: (counts['SCHWARZ'] ?? 0) <= 1, errorKey: "validation.maxOneBlack" },
        ];
    
        const firstError = validationRules.find(rule => !rule.condition);
    
        if (firstError) {
            this.customValidationFeedback.innerHTML = `<div class="invalid">❌ ${t(firstError.errorKey)}</div>`;
            this.btnStartCustomLevel.disabled = true;
        } else {
            this.customValidationFeedback.innerHTML = `<div class="valid">✅ ${t('validation.levelIsValid')}</div>`;
            this.btnStartCustomLevel.disabled = this.state.gems.length === 0;
        }
    }
    
    private handleStartCustomLevel() {
        if (this.btnStartCustomLevel.disabled) return;
        
        gameState.customGemSet = this.state.gems.map(g => g.name);
        gameState.customGemDefinitions = Object.fromEntries(this.state.gems.map(g => [g.name, g]));
        
        this.game.start(DIFFICULTIES.CUSTOM);
    }
}
