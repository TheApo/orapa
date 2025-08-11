
import { CellState, GRID_WIDTH, GRID_HEIGHT } from './grid';

export type EmitterState = 'normal' | 'focused';

/**
 * A class to manage the state and drawing of a single emitter button on the canvas.
 */
export class EmitterButton {
    id: string;
    rect: { x: number; y: number; width: number; height: number };
    state: EmitterState = 'normal'; // For highlight/focus states
    isUsed: boolean = false; // For persistent used state
    label: string;
    usedColor: string | null = null;
    private cornerRadius = 4;

    constructor(id: string, label: string) {
        this.id = id;
        this.label = label;
        this.rect = { x: 0, y: 0, width: 0, height: 0 };
    }

    updateRect(cellWidth: number, cellHeight: number, gap: number) {
        this.rect.width = cellWidth;
        this.rect.height = cellHeight;
        const idNum = parseInt(this.id.substring(1)) - 1;
        
        switch (this.id[0]) {
            case 'T':
                this.rect.x = (idNum + 1) * (cellWidth + gap);
                this.rect.y = 0;
                break;
            case 'B':
                this.rect.x = (idNum + 1) * (cellWidth + gap);
                this.rect.y = (GRID_HEIGHT + 1) * (cellHeight + gap);
                break;
            case 'L':
                this.rect.x = 0;
                this.rect.y = (idNum + 1) * (cellHeight + gap);
                break;
            case 'R':
                this.rect.x = (GRID_WIDTH + 1) * (cellWidth + gap);
                this.rect.y = (idNum + 1) * (cellHeight + gap);
                break;
        }
    }

    isInside(x: number, y: number): boolean {
        return x >= this.rect.x && x <= this.rect.x + this.rect.width &&
               y >= this.rect.y && y <= this.rect.y + this.rect.height;
    }

    draw(ctx: CanvasRenderingContext2D, isSelected: boolean = false) {
        ctx.save();

        // 1. Determine BASE background color
        const bgColor = this.isUsed && this.usedColor ? this.usedColor : '#4a627a';

        // 2. Draw the rounded rectangle background
        ctx.beginPath();
        const path = new Path2D();
        path.roundRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height, this.cornerRadius);
        ctx.fillStyle = bgColor;
        ctx.fill(path);
        
        // 3. Draw Border/Outline for different states
        // Selection has priority over focus visually
        if (isSelected) {
            ctx.strokeStyle = '#f1c40f'; // A bright yellow for selection
            ctx.lineWidth = 3;
            ctx.shadowColor = '#f1c40f';
            ctx.shadowBlur = 8;
            ctx.stroke(path);
            ctx.shadowColor = 'transparent'; // Reset shadow for text
            ctx.shadowBlur = 0;
        } else if (this.state === 'focused') {
            ctx.strokeStyle = '#3498db'; // --primary-color
            ctx.lineWidth = 2;
            ctx.stroke(path);
        }

        // 4. Determine text color
        const getContrast = (colorStr: string): string => {
            if (!colorStr) return '#ecf0f1';

            let r=0, g=0, b=0;

            try {
                if (colorStr.startsWith('#')) {
                    let hex = colorStr.substring(1);
                    if (hex.length === 3) {
                        hex = hex.split('').map(char => char + char).join('');
                    }
                    if (hex.length !== 6) return '#ecf0f1';
                    
                    r = parseInt(hex.substring(0, 2), 16);
                    g = parseInt(hex.substring(2, 4), 16);
                    b = parseInt(hex.substring(4, 6), 16);

                } else if (colorStr.startsWith('rgb')) { // handles rgb and rgba
                    const parts = colorStr.substring(colorStr.indexOf('(') + 1, colorStr.lastIndexOf(')')).split(/,\s*/);
                    r = parseInt(parts[0]);
                    g = parseInt(parts[1]);
                    b = parseInt(parts[2]);
                } else {
                     return '#ecf0f1'; // Unsupported format
                }
            } catch (e) {
                return '#ecf0f1'; // Parsing error
            }
           
            if (isNaN(r) || isNaN(g) || isNaN(b)) return '#ecf0f1';

            // Using YIQ formula to determine luminance.
            // See https://www.w3.org/TR/AERT/#color-contrast
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            // A threshold of 149 provides a good balance for this app's color palette.
            return (yiq >= 149) ? '#2c3e50' : '#ecf0f1';
        };
        
        const textColor = getContrast(bgColor);

        ctx.fillStyle = textColor;
        ctx.font = `bold ${this.rect.height * 0.45}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.rect.x + this.rect.width / 2, this.rect.y + this.rect.height / 2);
        
        ctx.restore();
    }
}
