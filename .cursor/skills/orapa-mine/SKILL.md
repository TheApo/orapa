---
name: orapa-mine
description: Reference for the Orapa Mine web game codebase. Covers architecture, file roles, game mechanics, coordinate system, rendering pipeline, and key patterns. Use when working on any Orapa Mine source files or when needing context about the project.
---

# Orapa Mine – Project Knowledge Base

## Overview

Web implementation of the Orapa Mine board game — a deduction puzzle where players locate hidden gemstones by sending ultrasonic waves through a grid and analyzing reflected colors. Built with vanilla TypeScript, HTML5 Canvas, and Vite.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Build | Vite 6.x |
| Language | TypeScript 5.x |
| Rendering | HTML5 Canvas 2D |
| Styling | Plain CSS (variables, flexbox, grid) |
| Dependencies | Zero runtime dependencies |

## File Roles

| File | Purpose |
|------|---------|
| `index.html` | HTML shell with all screens, sidebars, modals |
| `index.tsx` | Entry point — creates `UI` and `Game`, exposes `window.game` |
| `index.css` | All styles including responsive and wide-screen sidebar layout |
| `src/game.ts` | Game rules, gem placement, wave/query, solution verification |
| `src/ui.ts` | Screen management, tabs, toolbar, log, rules, sidebars |
| `src/renderer.ts` | Canvas drawing: board, gems, paths, emitters, tooltips |
| `src/input-handler.ts` | Mouse/touch/keyboard input, drag-and-drop |
| `src/state.ts` | Mutable `gameState` singleton with all game state |
| `src/constants.ts` | Gem definitions, colors, difficulties, ratings |
| `src/grid.ts` | `GRID_WIDTH=10`, `GRID_HEIGHT=8`, `CellState` enum, coordinate label utilities |
| `src/physics.ts` | Light reflection maps, pattern rotation/flip |
| `src/path-tracer.ts` | Light path simulation from emitter to exit |
| `src/ui-objects.ts` | `EmitterButton` class (drawing, hit-test, orientation-aware positioning) |
| `src/custom-creator-ui.ts` | Custom level creator with 4x4 shape designer |
| `src/i18n.ts` | DE/EN translations via `t()` function |

## Data Flow

```
User Input → InputHandler → Game (mutates gameState) → UI.redrawAll() → Renderer.redrawAll()
```

## Grid & Coordinate System

- Internal grid: 10 columns × 8 rows (`GRID_WIDTH=10`, `GRID_HEIGHT=8`)
- Internal emitter IDs: `T1-T10` (top), `B1-B10` (bottom), `L1-L8` (left), `R1-R8` (right)
- Display labels (original game convention):
  - Top: 1–10 (numbers), Right: 11–18 (numbers)
  - Left: A–H (letters), Bottom: I–R (letters)
- Cell labels: column number + row letter, e.g. "3C" = column 3, row C
- `getEmitterDisplayLabel(id)` and `getCellDisplayLabel(x, y)` in `grid.ts`

## Board Orientation

The board supports two orientations stored in `gameState.boardOrientation`:
- **Landscape** (default): 10 wide × 8 tall, `aspect-ratio: 12/10`
- **Portrait**: 8 wide × 10 tall, `aspect-ratio: 10/12`, CSS class `portrait` on `#game-board-wrapper`

Rotation is rendering-only — internal grid coordinates never change. The `Renderer` transforms between internal and visual coordinates:
- Landscape: `visual = internal`
- Portrait (90° CW): `visual_x = GRID_HEIGHT - 1 - gridY`, `visual_y = gridX`

Toggle via the rotate button or `r` key.

## Rendering Pipeline

The `Renderer` draws on two canvases stacked with z-index:
1. **`#gem-canvas`** (z:1): background grid, query fills, gems, emitters
2. **`#path-overlay`** (z:100, pointer-events:none): light paths, hover effects, tooltips

Drawing uses `Path2D` for cell shapes (blocks, triangles). DPR scaling is applied for retina displays. `ResizeObserver` on the board wrapper triggers re-layout.

## Game Mechanics

- **Gem shapes**: defined as 2D `CellState[][]` arrays (EMPTY, BLOCK, TRIANGLE_*, ABSORB)
- **Gem rotation**: 90° CW via `rotateGridPattern()`, center-preserving
- **Gem flip**: horizontal via `flipGridPatternHorizontally()`
- **Placement rules**: no overlap, no edge-to-edge adjacency; black gems also forbid corner adjacency
- **Path tracing**: ray enters from emitter, bounces off gem surfaces per reflection map, exits grid
- **Color mixing**: ray accumulates base colors (ROT, GELB, BLAU, WEISS) from gems hit; combined via `COLOR_MIXING` map

## UI Layout

### Narrow screens (< 1100px)
- Single column: board on top, tabbed controls below (Actions, Logbook, Rules)
- `#app` constrained to `max-width: 550px`

### Wide screens (>= 1100px)
- Three columns: Rules sidebar (280px) | Game board + controls | Logbook sidebar (280px)
- Activated by `.game-active` class on `#app`; Rules/Log tabs hidden

### Screens
`main` → `difficulty` → `custom-creator` (optional) → `game` → `end`

Switched via `UI.showScreen()`, toggling `.hidden` class on `.screen` elements.

## Key Patterns

- **State management**: mutable `gameState` singleton in `state.ts`, no framework
- **i18n**: `t(key, replacements?)` with DE/EN, `data-i18n-key` attributes for static elements
- **Canvas interaction**: `InputHandler` converts client coordinates to grid coordinates via `Renderer._canvasToGridCoords()`
- **Gem map keys**: `"${y},${x}"` strings for O(1) cell-to-gem lookup
- **Emitter system**: `EmitterButton` objects with orientation-aware `updateRect()`
