

export type Language = 'de' | 'en';

const translations = {
    de: {
        lang: {
            name: "Deutsch",
            flag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3"><path d="M0 0h5v3H0z"/><path d="M0 1h5v2H0z" fill="#D00"/><path d="M0 2h5v1H0z" fill="#FFCE00"/></svg>`,
            switch: "Sprache wechseln",
        },
        mainMenu: {
            startGame: "Spiel starten",
            byline: "von Dirk Aporius und Google Studio AI",
            basedOn: "basiert auf dem <a href=\"https://boardgamegeek.com/boardgame/424152/orapa-mine\" target=\"_blank\" rel=\"noopener\">Brettspiel</a>",
        },
        difficulty: {
            title: "Schwierigkeitsgrad",
            TRAINING: "Training",
            TRAINING_desc: "Ideal zum Lernen des Spiels, mit dem Verlauf der Lichtstrahlen.",
            NORMAL: "Normal",
            NORMAL_desc: "Die Grundlagen. Lerne die farbigen und weissen Steine kennen.",
            MEDIUM: "Mittel",
            MEDIUM_desc: "Eine neue Herausforderung. Ein transparenter Prisma-Stein lenkt das Licht ab, ohne es zu färben.",
            HARD: "Schwer",
            HARD_desc: "Expertenmodus. Neben dem transparenten kommt ein schwarzer, Licht absorbierender Stein in Spiel.",
            CUSTOM: "Eigenes Level",
            CUSTOM_desc: "Wähle deine eigenen Steine und erstelle eine neue Herausforderung."
        },
        customCreator: {
            title: "Eigenes Level erstellen",
            selectColor: "1. Farbe wählen",
            selectShape: "2. Form wählen",
            addGem: "Edelstein hinzufügen +",
            levelSet: "Level-Set (deine Auswahl)",
            startLevel: "Level starten",
            alert: {
                selectColorAndShape: "Bitte wähle zuerst eine Farbe und eine Form aus."
            }
        },
        customDesigner: {
            title: "Eigene Form entwerfen",
            instruction: "Klicke auf die Zellen, um ihren Typ zu ändern (Leer, Block, Diagonale). Entwerfe einen Edelstein innerhalb des 4x4-Rasters.",
            preview: "Vorschau (optimierte Grösse):",
            finish: "Design fertigstellen",
        },
        gameScreen: {
            tabs: {
                actions: "Aktionen",
                logbook: "Logbuch",
                rules: "Regeln",
            },
            interactionMode: "Aktionsmodus:",
            modeWave: "Strahl senden",
            modeQuery: "Feld abfragen",
            availableGems: "Verfügbare Edelsteine:",
            showPath: "Aktuellen Lichtweg anzeigen (F)"
        },
        endScreen: {
            winTitle: "Gewonnen!",
            lossTitle: "Verloren!",
            stats: "Du hast die Mine in {{count}} Abfragen gelöst.",
            statsLoss: "Du hast die Lösung nach {{count}} Abfragen nicht gefunden.",
            retry: "Bitte versuche es erneut.",
            solutionLabel: {
                correct: "Korrekte Lösung:",
                alternative: "Alternative Lösung gefunden! Deine Lösung (transparent):",
                yourInput: "Deine Eingabe (über der korrekten Lösung):",
            },
            ratingLegendTitle: "Bewertung für {{difficulty}}",
            ratingLegend: {
                upTo: "bis {{end}} Abfragen",
                range: "{{start}} - {{end}} Abfragen",
                moreThan: "mehr als {{start}} Abfragen",
            }
        },
        buttons: {
            back: "Zurück",
            newLevel: "Neues Level",
            menu: "Menü",
            submitSolution: "Lösung einreichen",
            giveUp: "Aufgeben",
            remove: "Entfernen",
        },
        rules: {
            title: "Spielanleitung",
            objectiveTitle: "Ziel:",
            objective: "Finde die Position und Ausrichtung der versteckten Edelsteine.",
            item1: "Du hast zwei Methoden, um Informationen zu sammeln:",
            item2: "<strong>Strahl senden:</strong> Sende eine Lichtwelle von einem Emitter am Rand. Die austretende Farbe und Position verraten, welche Steine auf dem Weg getroffen wurden.",
            item3: "<strong>Feld abfragen:</strong> Frage ein einzelnes Feld direkt ab. Dies verrät dir die Grundfarbe des Steins in diesem Feld (oder ob es leer ist), aber nicht seine Form.",
            item4: "Ziehe Edelsteine aus der Werkzeugleiste auf das Feld. Du kannst sie verschieben und drehen.",
            item5: "Ein Klick auf einen platzierten Stein dreht ihn um 90°, ein langes Drücken spiegelt ihn (falls möglich).",
            item6: "Steine dürfen sich nicht überlappen oder Kante an Kante liegen.",
            item7: "Drücke 'n' für ein neues Level oder 'esc' um zum Menü zurückzukehren.",
            colorMixingTitle: "Farbmischung",
            colorMixingDesc: "Ein Lichtstrahl wird von farbigen Steinen abgelenkt und nimmt dabei deren Farbe an. Trifft er auf mehrere Steine, mischen sich die Farben:",
            basicRules: "Spielmethoden",
            panel: {
                item1: "<strong>Strahl senden:</strong> Klicke auf einen Emitter am Rand, um eine Lichtwelle zu senden. Dies gibt dir Hinweise auf den Pfad und die getroffenen Farben.",
                item2: "<strong>Feld abfragen:</strong> Wechsle den Aktionsmodus und klicke auf ein Feld, um dessen Grundfarbe zu erfahren.",
                item3: "Ziehe die Edelsteine auf das Feld, um die Lösung nachzubauen.",
                item4: "Klicke auf einen platzierten Stein, um ihn zu drehen. Langes Drücken spiegelt ihn.",
                item5: "Steine dürfen sich nicht überlappen oder Kante an Kante liegen.",
            }
        },
        tooltips: {
            absorbs: "Absorbiert Licht.",
            reflectsOnly: "Reflektiert nur, färbt nicht.",
            addsColor: "Fügt Farbe '{{color}}' hinzu."
        },
        colors: {
            red: 'Rot',
            yellow: 'Gelb',
            blue: 'Blau',
            white: 'Weiss',
            transparent: 'Transparent',
            black: 'Schwarz',
            purple: 'Lila',
            skyBlue: 'Himmelblau',
            green: 'Grün',
            lightRed: 'Hellrot',
            orange: 'Orange',
            lightYellow: 'Hellgelb',
            lightPurple: 'Hell-Lila',
            darkGray: 'Dunkelgrau',
            lightGreen: 'Hellgrün',
            lightOrange: 'Hell-Orange',
            gray: 'Grau',
        },
        shapes: {
            rightTriangle: "Rechtwinkliges Dreieck",
            parallelogram: "Parallelogramm",
            bigTriangle: "Grosses Dreieck",
            diamond: "Raute",
            smallTriangle: "Kleines Dreieck",
            absorber: "Absorber",
            lShape: "L-Form",
            tShape: "T-Form",
            square: "Quadrat",
            bar: "Stab",
            small: "Klein",
            custom: "Eigene Form",
        },
        log: {
            absorbed: "Absorbiert",
            noColor: "Keine Farbe",
            unknownMix: "Unbekannte Mischung",
            query: "Abfrage ({{x}},{{y}})",
            empty: "Leer",
        },
        validation: {
            exactOneRed: "Benötigt: <strong>genau 1 roten</strong> Stein",
            exactOneYellow: "Benötigt: <strong>genau 1 gelben</strong> Stein",
            exactOneBlue: "Benötigt: <strong>genau 1 blauen</strong> Stein",
            atLeastOneWhite: "Benötigt: <strong>mindestens 1 weissen</strong> Stein",
            maxTwoWhite: "Erlaubt: <strong>maximal 2 weisse</strong> Steine",
            maxTwoTransparent: "Erlaubt: <strong>maximal 2 transparente</strong> Steine",
            maxOneBlack: "Erlaubt: <strong>maximal 1 schwarzen</strong> Stein",
            levelIsValid: "Level ist valide",
        },
        ratings: {
            training: {
                "1": "Sehr gut", "2": "Gut", "3": "Normal", "4": "Verbesserungsfähig"
            },
            normal: {
                "1": "Ein wahrer Experte bei der Edelsteinsuche", "2": "Ein Profi, dem kaum einer was vormacht", "3": "Guter Edelsteinsucher", "4": "Juhu, alle Edelsteine gefunden!", "5": "Immerhin alle Edelsteine gefunden."
            },
            medium: {
                "1": "Meisterlich! Kaum eine Abfrage zu viel.", "2": "Sehr beeindruckend! Du kennst dich aus.", "3": "Starke Leistung! Du hast den Dreh raus.", "4": "Gut gemacht! Alle Schätze geborgen.", "5": "Geduld und Spucke führen zum Ziel!"
            },
            hard: {
                "1": "Legendär! Eine Leistung für die Geschichtsbücher.", "2": "Herausragend! Selbst Experten staunen.", "3": "Experten-Niveau! Du hast es wirklich drauf.", "4": "Ein hartes Stück Arbeit, aber erfolgreich!", "5": "Puh, das war knapp, aber gewonnen!"
            },
        }
    },
    en: {
        lang: {
            name: "English",
            flag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30"><clipPath id="a"><path d="M0 0v30h60V0z"/></clipPath><clipPath id="b"><path d="M30 15h30v15H30zM0 0v15h30V0z"/></clipPath><g clip-path="url(#a)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m-60 0L60 0" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m-60 0L60 0" clip-path="url(#b)" stroke="#C8102E" stroke-width="4"/><path d="M0 15h60M30 0v30" stroke="#fff" stroke-width="10"/><path d="M0 15h60M30 0v30" stroke="#C8102E" stroke-width="6"/></g></svg>`,
            switch: "Change language",
        },
        mainMenu: {
            startGame: "Start Game",
            byline: "by Dirk Aporius and Google Studio AI",
            basedOn: "based on the <a href=\"https://boardgamegeek.com/boardgame/424152/orapa-mine\" target=\"_blank\" rel=\"noopener\">boardgame</a>",
        },
        difficulty: {
            title: "Difficulty",
            TRAINING: "Training",
            TRAINING_desc: "Ideal for learning the game, shows the path of light rays.",
            NORMAL: "Normal",
            NORMAL_desc: "The basics. Get to know the colored and white gems.",
            MEDIUM: "Medium",
            MEDIUM_desc: "A new challenge. A transparent prism gem deflects light without coloring it.",
            HARD: "Hard",
            HARD_desc: "Expert mode. In addition to the transparent gem, a black, light-absorbing gem comes into play.",
            CUSTOM: "Custom Level",
            CUSTOM_desc: "Choose your own gems and create a new challenge."
        },
        customCreator: {
            title: "Create Custom Level",
            selectColor: "1. Select Color",
            selectShape: "2. Select Shape",
            addGem: "Add Gem +",
            levelSet: "Level Set (Your Selection)",
            startLevel: "Start Level",
            alert: {
                selectColorAndShape: "Please select a color and a shape first."
            }
        },
        customDesigner: {
            title: "Design Custom Shape",
            instruction: "Click on the cells to change their type (Empty, Block, Diagonal). Design a gem within the 4x4 grid.",
            preview: "Preview (cropped size):",
            finish: "Finish Design",
        },
        gameScreen: {
            tabs: {
                actions: "Actions",
                logbook: "Logbook",
                rules: "Rules",
            },
            interactionMode: "Action Mode:",
            modeWave: "Send Ray",
            modeQuery: "Query Cell",
            availableGems: "Available Gems:",
            showPath: "Show current light path (F)"
        },
        endScreen: {
            winTitle: "You Win!",
            lossTitle: "You Lose!",
            stats: "You solved the mine in {{count}} queries.",
            statsLoss: "You did not find the solution after {{count}} queries.",
            retry: "Please try again.",
            solutionLabel: {
                correct: "Correct Solution:",
                alternative: "Alternative solution found! Your solution (transparent):",
                yourInput: "Your input (over the correct solution):",
            },
            ratingLegendTitle: "Rating for {{difficulty}}",
            ratingLegend: {
                upTo: "up to {{end}} queries",
                range: "{{start}} - {{end}} queries",
                moreThan: "more than {{start}} queries",
            }
        },
        buttons: {
            back: "Back",
            newLevel: "New Level",
            menu: "Menu",
            submitSolution: "Submit Solution",
            giveUp: "Give Up",
            remove: "Remove",
        },
        rules: {
            title: "How to Play",
            objectiveTitle: "Goal:",
            objective: "Find the position and orientation of the hidden gems.",
            item1: "You have two methods to gather information:",
            item2: "<strong>Send Ray:</strong> Send a light wave from an emitter on the edge. The exiting color and position reveal which gems were hit along the path.",
            item3: "<strong>Query Cell:</strong> Directly query a single cell. This tells you the base color of the gem in that cell (or if it's empty), but not its shape.",
            item4: "Drag gems from the toolbar onto the board. You can move and rotate them.",
            item5: "Clicking on a placed gem rotates it by 90°. A long press flips it (if possible).",
            item6: "Gems cannot overlap or be edge-to-edge.",
            item7: "Press 'n' for a new level or 'esc' to return to the menu.",
            colorMixingTitle: "Color Mixing",
            colorMixingDesc: "A light beam is deflected by colored gems, taking on their color. If it hits multiple gems, the colors mix:",
            basicRules: "Game Methods",
            panel: {
                item1: "<strong>Send Ray:</strong> Click an emitter on the edge to send a light wave. This gives clues about the path and colors hit.",
                item2: "<strong>Query Cell:</strong> Switch the action mode and click a cell to learn its base color.",
                item3: "Drag the gems onto the board to replicate the solution.",
                item4: "Click on a placed gem to rotate it. A long press flips it.",
                item5: "Gems cannot overlap or be edge-to-edge.",
            }
        },
        tooltips: {
            absorbs: "Absorbs light.",
            reflectsOnly: "Only reflects, does not color.",
            addsColor: "Adds '{{color}}' color."
        },
        colors: {
            red: 'Red',
            yellow: 'Yellow',
            blue: 'Blue',
            white: 'White',
            transparent: 'Transparent',
            black: 'Black',
            purple: 'Purple',
            skyBlue: 'Sky Blue',
            green: 'Green',
            lightRed: 'Light Red',
            orange: 'Orange',
            lightYellow: 'Light Yellow',
            lightPurple: 'Light Purple',
            darkGray: 'Dark Gray',
            lightGreen: 'Light Green',
            lightOrange: 'Light Orange',
            gray: 'Gray',
        },
        shapes: {
            rightTriangle: "Right Triangle",
            parallelogram: "Parallelogram",
            bigTriangle: "Large Triangle",
            diamond: "Diamond",
            smallTriangle: "Small Triangle",
            absorber: "Absorber",
            lShape: "L-Shape",
            tShape: "T-Shape",
            square: "Square",
            bar: "Bar",
            small: "Small",
            custom: "Custom Shape",
        },
        log: {
            absorbed: "Absorbed",
            noColor: "No Color",
            unknownMix: "Unknown Mix",
            query: "Query ({{x}},{{y}})",
            empty: "Empty",
        },
        validation: {
            exactOneRed: "Requires: <strong>exactly 1 red</strong> gem",
            exactOneYellow: "Requires: <strong>exactly 1 yellow</strong> gem",
            exactOneBlue: "Requires: <strong>exactly 1 blue</strong> gem",
            atLeastOneWhite: "Requires: <strong>at least 1 white</strong> gem",
            maxTwoWhite: "Allowed: <strong>maximum of 2 white</strong> gems",
            maxTwoTransparent: "Allowed: <strong>maximum of 2 transparent</strong> gems",
            maxOneBlack: "Allowed: <strong>maximum of 1 black</strong> gem",
            levelIsValid: "Level is valid",
        },
        ratings: {
            training: {
                "1": "Very good", "2": "Good", "3": "Average", "4": "Needs improvement"
            },
            normal: {
                "1": "A true gem-finding expert", "2": "A pro who can't be fooled", "3": "Good gem hunter", "4": "Yay, all gems found!", "5": "At least all gems were found."
            },
            medium: {
                "1": "Masterful! Hardly a query wasted.", "2": "Very impressive! You know your stuff.", "3": "Strong performance! You've got the hang of it.", "4": "Well done! All treasures recovered.", "5": "Patience and persistence lead to success!"
            },
            hard: {
                "1": "Legendary! A performance for the history books.", "2": "Outstanding! Even experts are amazed.", "3": "Expert level! You've really got it.", "4": "A tough job, but successful!", "5": "Phew, that was close, but you won!"
            },
        }
    }
};

/**
 * Determines the initial language based on stored preference or browser language.
 * Priority:
 * 1. Language explicitly set by the user and stored in localStorage.
 * 2. Browser's language setting (if German).
 * 3. English as a fallback.
 */
function determineInitialLanguage(): Language {
    const savedLang = localStorage.getItem('orapa-lang');
    if (savedLang === 'de' || savedLang === 'en') {
        return savedLang as Language;
    }

    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    if (browserLang === 'de') {
        return 'de';
    }

    return 'en';
}

let currentLang: Language = determineInitialLanguage();

const listeners: (() => void)[] = [];

export function onLanguageChange(callback: () => void) {
    listeners.push(callback);
}

function notifyListeners() {
    listeners.forEach(cb => cb());
    document.documentElement.lang = currentLang;
}

export function setLanguage(lang: Language) {
    if (lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem('orapa-lang', lang);
    notifyListeners();
}

export function getLanguage(): Language {
    return currentLang;
}

export function t(key: string, replacements?: { [key: string]: string | number }): string {
    const keys = key.split('.');
    let result: any = translations[currentLang];
    
    // Primary language lookup
    for (const k of keys) {
        result = result?.[k];
        if (result === undefined) break;
    }
    
    // Fallback to German if key not found in current language
    if (result === undefined && currentLang !== 'de') {
        let fallbackResult: any = translations.de;
        for (const k of keys) {
            fallbackResult = fallbackResult?.[k];
            if (fallbackResult === undefined) return key; // Return key if not found in fallback either
        }
        result = fallbackResult;
    } else if (result === undefined) {
        return key;
    }
    
    if (typeof result !== 'string') return key;

    if (replacements) {
        Object.entries(replacements).forEach(([rKey, rValue]) => {
            const regex = new RegExp(`{{${rKey}}}`, 'g');
            result = result.replace(regex, String(rValue));
        });
    }

    return result;
}

// Set initial language on load
document.documentElement.lang = currentLang;