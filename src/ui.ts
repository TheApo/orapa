

import { Game } from './game';
import { GEMS, GEM_SETS, DIFFICULTIES, COLOR_MIXING, COLOR_NAME_KEYS, RATINGS } from './constants';
import { gameState, LogEntry, GameStatus, InteractionMode, Gem } from './state';
import { t, setLanguage, getLanguage, onLanguageChange, Language } from './i18n';
import { Renderer } from './renderer';
import { InputHandler } from './input-handler';
import { CustomCreatorUI } from './custom-creator-ui';


export class UI {
    game!: Game;
    renderer!: Renderer;
    inputHandler!: InputHandler;
    customCreatorUI!: CustomCreatorUI;

    // Screen Elements
    screens: { [key: string]: HTMLElement } = {};
    
    // Main Menu Elements
    langSwitcher!: HTMLElement;
    btnStartGame!: HTMLButtonElement;
    introRulesEl!: HTMLElement;

    // Difficulty Screen Elements
    difficultyOptions!: HTMLDivElement;
    btnBackToMain1!: HTMLButtonElement;
    btnBackToDifficulty!: HTMLButtonElement;
    
    // Game Screen Elements
    gemToolbar!: HTMLElement;
    logList!: HTMLElement;
    actionsTabBtn!: HTMLButtonElement;
    logTabBtn!: HTMLButtonElement;
    rulesTabBtn!: HTMLButtonElement;
    checkSolutionBtn!: HTMLButtonElement;
    giveUpBtn!: HTMLButtonElement;
    previewToggle!: HTMLInputElement;
    rulesPanel!: HTMLElement;
    modeWaveBtn!: HTMLButtonElement;
    modeQueryBtn!: HTMLButtonElement;
    
    // End Screen Elements
    endTitle!: HTMLElement;
    endRating!: HTMLElement;
    endStats!: HTMLElement;
    endRetryMessage!: HTMLElement;
    endSolutionLabel!: HTMLElement;
    endRatingLegend!: HTMLElement;
    btnNewLevel!: HTMLButtonElement;
    btnMenu!: HTMLButtonElement;

    constructor() {
        this.cacheDOMElements();
        this.bindGlobalEvents();
        onLanguageChange(() => this.updateUIText());
    }

    bindGame(gameInstance: Game) {
        this.game = gameInstance;
        this.renderer = new Renderer(this.game, this);
        this.inputHandler = new InputHandler(this.game, this);
        this.customCreatorUI = new CustomCreatorUI(this.game, this.renderer);

        this.renderer.connectInputHandler(this.inputHandler);
        this.inputHandler.connectRenderer(this.renderer);

        this.updateUIText(); // Initial text population moved here
    }
    
    private cacheDOMElements() {
        this.screens.main = document.getElementById('screen-main')!;
        this.screens.difficulty = document.getElementById('screen-difficulty')!;
        this.screens['custom-creator'] = document.getElementById('screen-custom-creator')!;
        this.screens.game = document.getElementById('screen-game')!;
        this.screens.end = document.getElementById('screen-end')!;
        
        this.langSwitcher = document.getElementById('lang-switcher')!;
        this.btnStartGame = document.getElementById('btn-start-game') as HTMLButtonElement;
        this.introRulesEl = document.getElementById('intro-rules')!;
        
        this.difficultyOptions = document.getElementById('difficulty-options') as HTMLDivElement;
        this.btnBackToMain1 = document.getElementById('btn-back-to-main-1') as HTMLButtonElement;
        this.btnBackToDifficulty = document.getElementById('btn-back-to-difficulty') as HTMLButtonElement;

        this.gemToolbar = document.getElementById('gem-toolbar')!;
        this.logList = document.getElementById('log-list')!;
        this.actionsTabBtn = document.getElementById('actions-tab-btn') as HTMLButtonElement;
        this.logTabBtn = document.getElementById('log-tab-btn') as HTMLButtonElement;
        this.rulesTabBtn = document.getElementById('rules-tab-btn') as HTMLButtonElement;
        this.rulesPanel = document.getElementById('rules-panel') as HTMLElement;
        this.checkSolutionBtn = document.getElementById('check-solution-btn') as HTMLButtonElement;
        this.giveUpBtn = document.getElementById('give-up-btn') as HTMLButtonElement;
        this.previewToggle = document.getElementById('preview-toggle') as HTMLInputElement;
        this.modeWaveBtn = document.getElementById('mode-wave-btn') as HTMLButtonElement;
        this.modeQueryBtn = document.getElementById('mode-query-btn') as HTMLButtonElement;
        
        this.endTitle = document.getElementById('end-title')!;
        this.endRating = document.getElementById('end-rating') as HTMLElement;
        this.endStats = document.getElementById('end-stats')!;
        this.endRetryMessage = document.getElementById('end-retry-message')!;
        this.endSolutionLabel = document.getElementById('end-solution-label')!;
        this.endRatingLegend = document.getElementById('end-rating-legend') as HTMLElement;
        this.btnNewLevel = document.getElementById('btn-new-level') as HTMLButtonElement;
        this.btnMenu = document.getElementById('btn-menu') as HTMLButtonElement;
    }

    private bindGlobalEvents() {
        this.langSwitcher.addEventListener('click', () => {
            const newLang: Language = getLanguage() === 'de' ? 'en' : 'de';
            setLanguage(newLang);
        });

        this.btnStartGame.addEventListener('click', () => this.game.showDifficultySelect());
        this.btnNewLevel.addEventListener('click', () => {
            if (gameState.difficulty) this.game.start(gameState.difficulty);
        });
        this.btnMenu.addEventListener('click', () => this.game.showMainMenu());
        this.btnBackToMain1.addEventListener('click', () => this.game.showMainMenu());
        this.btnBackToDifficulty.addEventListener('click', () => this.game.showDifficultySelect());
        
        this.actionsTabBtn.addEventListener('click', () => this.switchTab('actions'));
        this.logTabBtn.addEventListener('click', () => this.switchTab('log'));
        this.rulesTabBtn.addEventListener('click', () => this.switchTab('rules'));
        
        this.checkSolutionBtn.addEventListener('click', () => this.game.checkSolution());
        this.giveUpBtn.addEventListener('click', () => this.game.giveUp());
        this.previewToggle.addEventListener('change', () => this.game.togglePlayerPathPreview());
        this.modeWaveBtn.addEventListener('click', () => this.game.setInteractionMode(InteractionMode.WAVE));
        this.modeQueryBtn.addEventListener('click', () => this.game.setInteractionMode(InteractionMode.QUERY));
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'n' && (gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.GAME_OVER)) {
                if (gameState.difficulty) this.game.start(gameState.difficulty);
                return;
            }
            if (e.key === 'Escape' && (gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.GAME_OVER || gameState.status === GameStatus.CUSTOM_CREATOR || gameState.status === GameStatus.DIFFICULTY_SELECT)) {
                this.game.showMainMenu();
                return;
            }
            if (gameState.status === GameStatus.PLAYING) {
                if (e.key === 'd') this.game.toggleDebugMode();
                if (e.key === 'f') this.game.togglePlayerPathPreview();
            }
        });

        this.logList.addEventListener('animationend', () => {
            this.logList.classList.remove('flash');
        });
    }

    private updateUIText() {
        // Update language switcher
        this.langSwitcher.innerHTML = t('lang.flag');
        this.langSwitcher.title = t('lang.switch');

        // Update all elements with data-i18n-key
        document.querySelectorAll<HTMLElement>('[data-i18n-key]').forEach(el => {
            const key = el.dataset.i18nKey!;
            const attr = el.dataset.i18nAttr || 'textContent';
            (el as any)[attr] = t(key);
        });

        // Update dynamic content
        if (gameState.status === GameStatus.MAIN_MENU) {
            this._populateIntroRules();
        }
        if (gameState.status === GameStatus.DIFFICULTY_SELECT) {
            this.populateDifficultyOptions();
        }
        if (gameState.status === GameStatus.CUSTOM_CREATOR) {
            this.customCreatorUI.setup();
        }
        if (gameState.status === GameStatus.PLAYING) {
            this._populateRulesPanel();
            this.updateToolbar(); // Re-creates tooltips
            this.updateLogTabCounter();
            this.redrawAll();
        }
    }
    
    setupGameUI() {
        this._populateRulesPanel();
        this.switchTab('actions');
        this.updateInteractionModeUI(gameState.interactionMode);
        this.renderer.setupEmitters();
        this.updateToolbar();
        this.logList.innerHTML = '';
        this.updateLogTabCounter();
        this.renderer.clearPath();
        this.game.updateSolutionButtonState();
        this.updatePreviewToggleState(gameState.showPlayerPathPreview);
        this.renderer.handleResize();
    }

    showScreen(screenName: 'main' | 'difficulty' | 'custom-creator' | 'game' | 'end') {
        if (screenName === 'difficulty') this.populateDifficultyOptions();
        if (screenName === 'custom-creator') this.customCreatorUI.setup();
        
        Object.values(this.screens).forEach(s => s.classList.add('hidden'));
        this.screens[screenName].classList.remove('hidden');

        if (screenName === 'game') {
            const gemCanvas = document.getElementById('gem-canvas');
            gemCanvas?.focus();
        }
    }

    private populateDifficultyOptions() {
        this.difficultyOptions.innerHTML = '';
        [DIFFICULTIES.TRAINING, DIFFICULTIES.NORMAL, DIFFICULTIES.MEDIUM, DIFFICULTIES.HARD].forEach(diffKey => {
            const btn = document.createElement('button');
            btn.innerHTML = `${t('difficulty.' + diffKey)}<div class="difficulty-desc">${t('difficulty.' + diffKey + '_desc')}</div>`;
            btn.onclick = () => this.game.start(diffKey);
            this.difficultyOptions.appendChild(btn);
        });
        
        const customBtn = document.createElement('button');
        customBtn.innerHTML = `${t('difficulty.CUSTOM')}<div class="difficulty-desc">${t('difficulty.CUSTOM_desc')}</div>`;
        customBtn.onclick = () => this.game.showCustomCreator();
        this.difficultyOptions.appendChild(customBtn);
    }

    public updateInteractionModeUI(mode: InteractionMode) {
        if (mode === InteractionMode.WAVE) {
            this.modeWaveBtn.classList.add('active');
            this.modeQueryBtn.classList.remove('active');
        } else {
            this.modeWaveBtn.classList.remove('active');
            this.modeQueryBtn.classList.add('active');
        }
    }

    public getGemDefinition(gemName: string): any | undefined {
        const isCustom = gameState.difficulty === DIFFICULTIES.CUSTOM;
        return isCustom ? gameState.customGemDefinitions[gemName] : GEMS[gemName];
    }

    private getGemTooltip(gemName: string): string {
        const gemDef = this.getGemDefinition(gemName);
        if (!gemDef) return '';
    
        if (gemDef.special === 'absorbs') return t('tooltips.absorbs');
        if (gemDef.baseGems.length === 0) return t('tooltips.reflectsOnly');
       
        const colorKey = gemDef.baseGems[0];
        const colorNameKey = this.renderer.getBaseColorNameKey(colorKey);
        const colorDisplayName = t(colorNameKey).toLowerCase();
        return t('tooltips.addsColor', { color: colorDisplayName });
    }

    updateToolbar() {
        this.gemToolbar.innerHTML = '';
        if (!gameState.difficulty) return;
        
        const isCustom = gameState.difficulty === DIFFICULTIES.CUSTOM;
        const gemSet = isCustom ? gameState.customGemSet : GEM_SETS[gameState.difficulty!];
        if (!gemSet) return;
        
        const placedGemNames = new Set(gameState.playerGems.map(g => g.name));

        gemSet.forEach(gemName => {
            const gemDef = this.getGemDefinition(gemName);
            if (!gemDef) return;

            const div = document.createElement('div');
            div.className = 'toolbar-gem';
            if (placedGemNames.has(gemName)) div.classList.add('placed');
            div.dataset.gemName = gemName;
            div.title = this.getGemTooltip(gemName);
            const canvas = document.createElement('canvas');
            canvas.className = 'toolbar-gem-canvas';
            div.appendChild(canvas);
            this.gemToolbar.appendChild(div);
            // Draw after a delay to ensure element is in DOM and has size
            setTimeout(() => this.renderer.drawToolbarGem(canvas, gemDef), 0);
        });
    }
    
    public handleSelectionChange() {
        this.redrawAll();
        this.updateLogHighlight();
    }
    
    redrawAll() {
        if (!this.renderer) return;
        this.renderer.redrawAll();
    }

    switchTab(tabName: 'actions' | 'log' | 'rules') {
        document.querySelectorAll('.tab-btn, .tab-panel').forEach(el => el.classList.remove('active'));
        document.getElementById(`${tabName}-tab-btn`)!.classList.add('active');
        document.getElementById(`${tabName}-panel`)!.classList.add('active');
    }

    addLogEntry(logEntry: LogEntry) {
        const li = document.createElement('li');
        li.dataset.logId = logEntry.id;
    
        if (logEntry.type === InteractionMode.WAVE) {
            this.renderer.updateEmitterFromLog(logEntry);
            const { result } = logEntry;
            const resultText = `${logEntry.id} ➔ ${result.exitId}`;
            const resultColor = this.renderer.getPathColor(result);
            const colorName = this.getPathColorName(result);
            li.innerHTML = `<span>${resultText}</span><div class="log-entry-result"><span class="log-color-name">${colorName}</span><div class="log-color-box" style="background-color: ${resultColor};"></div></div>`;

        } else { // It's a QueryLog
            const { coords, result } = logEntry;
            const resultColor = result.colorHex || 'transparent';
            const colorName = result.colorNameKey ? t(result.colorNameKey) : t('log.empty');
            const queryText = t('log.query', { x: coords.x + 1, y: coords.y + 1 });
            const boxStyle = `background-color: ${resultColor};` + 
                             (this.renderer.isTransparentColor(resultColor) ? 'border-color: #a4d4e4;' : '');
    
            li.innerHTML = `<span>${queryText}</span><div class="log-entry-result"><span class="log-color-name">${colorName}</span><div class="log-color-box" style="${boxStyle}"></div></div>`;
        }
        
        this.logList.prepend(li);
        this.updateLogTabCounter();
    }

    private updateLogTabCounter() {
        const count = gameState.log.length;
        const logbook = t('gameScreen.tabs.logbook');
        if (count > 0) {
            this.logTabBtn.textContent = `${logbook} (${count})`;
        } else {
            this.logTabBtn.textContent = logbook;
        }
    }
    
    private areGemSetsIdentical(gemsA: Gem[], gemsB: Gem[]): boolean {
        if (gemsA.length !== gemsB.length) return false;
    
        const gemToKey = (g: Gem) => `${g.name},${g.x},${g.y},${JSON.stringify(g.gridPattern)}`;
        const keysA = new Set(gemsA.map(gemToKey));
        const keysB = new Set(gemsB.map(gemToKey));
    
        if (keysA.size !== keysB.size) return false;
    
        for (const key of keysA) {
            if (!keysB.has(key)) return false;
        }
    
        return true;
    }
    
    showEndScreen(isWin: boolean, waveCount: number, secretGems: Gem[], playerGems: Gem[]) {
        this.endTitle.classList.remove('win', 'loss');
        this.endRetryMessage.textContent = '';
        this.endRating.textContent = '';
        this.endRatingLegend.innerHTML = '';
        this.endRating.style.display = 'none';
        this.endRatingLegend.style.display = 'none';
        
        let playerSolutionToShow: Gem[] = [];
    
        if (isWin) {
            this.endTitle.textContent = t('endScreen.winTitle');
            this.endTitle.classList.add('win');
            this.endStats.textContent = t('endScreen.stats', { count: waveCount });
    
            const areSolutionsIdentical = this.areGemSetsIdentical(secretGems, playerGems);
    
            if (areSolutionsIdentical) {
                this.endSolutionLabel.textContent = t('endScreen.solutionLabel.correct');
                playerSolutionToShow = [];
            } else {
                this.endSolutionLabel.textContent = t('endScreen.solutionLabel.alternative');
                playerSolutionToShow = playerGems;
            }
            
            const difficulty = gameState.difficulty;
            if (difficulty && RATINGS[difficulty]) {
                const ratingTiers = RATINGS[difficulty];
                let ratingText = '';
                for (const tier of ratingTiers) {
                    if (waveCount <= tier.limit) {
                        ratingText = t(tier.textKey);
                        break;
                    }
                }
    
                if (ratingText) {
                    this.endRating.textContent = ratingText;
                    this.endRating.style.display = 'block';
    
                    this.endRatingLegend.style.display = 'block';
                    let legendHtml = `<h5>${t('endScreen.ratingLegendTitle', { difficulty: t('difficulty.'+difficulty) })}</h5><ul>`;
                    let lastLimit = 0;
                    ratingTiers.forEach(tier => {
                        const rangeTextKey = lastLimit === 0 ? 'endScreen.ratingLegend.upTo'
                                        : tier.limit === Infinity ? 'endScreen.ratingLegend.moreThan'
                                        : 'endScreen.ratingLegend.range';
                        const rangeText = t(rangeTextKey, { start: lastLimit + 1, end: tier.limit });
                        
                        legendHtml += `<li><strong>${t(tier.textKey)}:</strong> ${rangeText}</li>`;
                        lastLimit = tier.limit;
                    });
                    legendHtml += '</ul>';
                    this.endRatingLegend.innerHTML = legendHtml;
                }
            }
    
        } else {
            this.endTitle.textContent = t('endScreen.lossTitle');
            this.endTitle.classList.add('loss');
            this.endStats.textContent = t('endScreen.stats', { count: waveCount });
            this.endRetryMessage.textContent = t('endScreen.retry');
            this.endSolutionLabel.textContent = t('endScreen.solutionLabel.yourInput');
            playerSolutionToShow = playerGems;
        }
    
        this.showScreen('end');
        requestAnimationFrame(() => {
            this.renderer.drawEndScreenSolution(secretGems, playerSolutionToShow);
        });
    }

    public updatePreviewToggleState(isChecked: boolean) {
        this.previewToggle.checked = isChecked;
    }

    updateLogHighlight() {
        this.logList.querySelectorAll('li').forEach(li => {
            const htmlLi = li as HTMLLIElement;
            if (htmlLi.dataset.logId === gameState.selectedLogEntryId) {
                htmlLi.classList.add('selected');
                htmlLi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                htmlLi.classList.remove('selected');
            }
        });
    }

    public getPathColorName(result: { colors: string[], absorbed?: boolean }): string {
        if (result.absorbed) return t('log.absorbed');
        if (result.colors.length === 0) return t('log.noColor');
        const key = [...result.colors].sort().join(',');
        const nameKey = COLOR_NAME_KEYS[key];
        return nameKey ? t(nameKey) : t('log.unknownMix');
    }
    
    private createColorMixEntry(key: string): HTMLElement {
        const resultColor = COLOR_MIXING[key];
        const baseColors = key.split(',');
        const entryDiv = document.createElement('div');
        entryDiv.className = 'color-mix-entry';
    
        let html = '';
        baseColors.forEach((colorName, index) => {
            const colorHex = this.renderer.getBaseColorHex(colorName);
            html += `<div class="color-mix-box" style="background-color: ${colorHex}"></div>`;
            if (index < baseColors.length - 1) {
                html += `<span>+</span>`;
            }
        });
        
        const resultName = t(COLOR_NAME_KEYS[key as keyof typeof COLOR_NAME_KEYS] || 'log.unknownMix');
    
        html += `<span>=</span> <div class="color-mix-box" style="background-color: ${resultColor}"></div> <span>${resultName}</span>`;
        entryDiv.innerHTML = html;
        return entryDiv;
    }

    private populateColorMixColumns(container: HTMLElement) {
        if (!container || !this.renderer) return;
        
        container.innerHTML = '';
    
        const col1 = document.createElement('div');
        col1.className = 'color-mix-column';
        const col2 = document.createElement('div');
        col2.className = 'color-mix-column';
    
        const leftColumnKeys = ['BLAU,ROT', 'BLAU,GELB', 'GELB,ROT', 'BLAU,ROT,WEISS', 'BLAU,GELB,WEISS', 'BLAU,GELB,ROT,WEISS'];
        const rightColumnKeys = ['BLAU,WEISS', 'ROT,WEISS', 'GELB,WEISS', 'BLAU,GELB,ROT', 'GELB,ROT,WEISS'];
    
        leftColumnKeys.forEach(key => col1.appendChild(this.createColorMixEntry(key)));
        rightColumnKeys.forEach(key => col2.appendChild(this.createColorMixEntry(key)));
    
        container.appendChild(col1);
        container.appendChild(col2);
    }
    
    private _populateIntroRules() {
        this.introRulesEl.innerHTML = `
            <h3 data-i18n-key="rules.title"></h3>
            <p><strong data-i18n-key="rules.objectiveTitle"></strong> <span data-i18n-key="rules.objective"></span></p>
            <ul>
                <li>
                    <span data-i18n-key="rules.item1"></span>
                    <ul>
                        <li data-i18n-key="rules.item2"></li>
                        <li data-i18n-key="rules.item3"></li>
                    </ul>
                </li>
                <li data-i18n-key="rules.item4"></li>
                <li data-i18n-key="rules.item5"></li>
                <li data-i18n-key="rules.item6"></li>
                <li data-i18n-key="rules.item7"></li>
            </ul>
            <h4 data-i18n-key="rules.colorMixingTitle"></h4>
            <p data-i18n-key="rules.colorMixingDesc"></p>
            <div class="color-mix-container"></div>
        `;
        // Manually trigger translation for the newly created elements
        this.introRulesEl.querySelectorAll<HTMLElement>('[data-i18n-key]').forEach(el => {
            const key = el.dataset.i18nKey!;
            // Use innerHTML to support the <strong> tags in the rule descriptions
            if (key.startsWith('rules.item')) {
                el.innerHTML = t(key);
            } else {
                el.textContent = t(key);
            }
        });
        const container = this.introRulesEl.querySelector('.color-mix-container') as HTMLElement;
        this.populateColorMixColumns(container);
    }

    private _populateRulesPanel() {
        this.rulesPanel.innerHTML = `
            <h4 data-i18n-key="rules.basicRules"></h4>
            <ul>
                <li data-i18n-key="rules.panel.item1"></li>
                <li data-i18n-key="rules.panel.item2"></li>
                <li data-i18n-key="rules.panel.item3"></li>
                <li data-i18n-key="rules.panel.item4"></li>
                <li data-i18n-key="rules.panel.item5"></li>
            </ul>
            <h4 data-i18n-key="rules.colorMixingTitle"></h4>
            <p data-i18n-key="rules.colorMixingDesc"></p>
            <div class="color-mix-container"></div>
        `;
        this.rulesPanel.querySelectorAll<HTMLElement>('[data-i18n-key]').forEach(el => {
             const key = el.dataset.i18nKey!;
             if (key.startsWith('rules.panel.item')) {
                 el.innerHTML = t(key);
             } else {
                 el.textContent = t(key);
             }
        });
    
        const container = this.rulesPanel.querySelector('.color-mix-container') as HTMLElement;
        this.populateColorMixColumns(container);
    }
}
