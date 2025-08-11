
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

    private state: CustomCreatorState = {
        selectedColorKey: null,
        selectedShapeKey: null,
        gems: [],
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
        
        this.btnAddCustomGem.addEventListener('click', () => this.handleAddCustomGem());
        this.btnStartCustomLevel.addEventListener('click', () => this.handleStartCustomLevel());
    }

    public setup() {
        this.state = { selectedColorKey: null, selectedShapeKey: null, gems: [] };
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
            
            div.onclick = () => {
                this.state.selectedShapeKey = key;
                this.customShapeSelector.querySelectorAll('.shape-choice').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
            };
            this.customShapeSelector.appendChild(div);
            setTimeout(() => this.renderer.drawToolbarGem(canvas, value), 0);
        });
    }
    
    private handleAddCustomGem() {
        const { selectedColorKey, selectedShapeKey } = this.state;
        if (!selectedColorKey || !selectedShapeKey) {
            alert(t('customCreator.alert.selectColorAndShape'));
            return;
        }
    
        const colorDef = BASE_COLORS[selectedColorKey as keyof typeof BASE_COLORS];
        const shapeDef = CUSTOM_SHAPES[selectedShapeKey];
        
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
            this.btnStartCustomLevel.disabled = false;
        }
    }
    
    private handleStartCustomLevel() {
        if (this.btnStartCustomLevel.disabled) return;
        
        gameState.customGemSet = this.state.gems.map(g => g.name);
        gameState.customGemDefinitions = Object.fromEntries(this.state.gems.map(g => [g.name, g]));
        
        this.game.start(DIFFICULTIES.CUSTOM);
    }
}
