import { CellState } from './grid';

export type EmitterState = 'normal' | 'highlight' | 'focused';

/**
 * A class to manage the state and drawing of a single emitter button on the canvas.
 */
export class EmitterButton {
    id: string;
    rect: { x: number; y: number; width: number; height: number };
    state: EmitterState = 'normal'; // For highlight/focus states
    isUsed: boolean = false; // For persistent used state
    isHovered: boolean = false; // For transient visual hover
    label: string;
    usedColor: string | null = null;
    private cornerRadius = 4;

    constructor(id: string, label: string) {
        this.id = id;
        this.label = label;
        this.rect = { x: 0, y: 0, width: 0, height: 0 };
    }

    isInside(x: number, y: number): boolean {
        return x >= this.rect.x && x <= this.rect.x + this.rect.width &&
               y >= this.rect.y && y <= this.rect.y + this.rect.height;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();

        // 1. Determine BASE background color
        const bgColor = this.isUsed && this.usedColor ? this.usedColor : '#4a627a';

        // 2. Draw the rounded rectangle background
        ctx.beginPath();
        const path = new Path2D();
        path.roundRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height, this.cornerRadius);
        ctx.fillStyle = bgColor;
        ctx.fill(path);
        
        // 3. Layer hover effect on top if applicable
        if (this.isHovered) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fill(path); // Re-fill the same path with the overlay
        }

        // 4. Draw Border/Outline for different states
        if (this.state === 'highlight') {
            ctx.strokeStyle = '#e74c3c'; // --invalid-color
            ctx.lineWidth = 3;
            ctx.stroke(path);
        } else if (this.state === 'focused') {
            ctx.strokeStyle = '#3498db'; // --primary-color
            ctx.lineWidth = 2;
            ctx.stroke(path);
        }

        // 5. Determine text color
        const getContrast = (hex: string) => {
            if (!hex || hex.length < 7) return '#ecf0f1'; // default text color
            try {
                const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
                return (r*0.299 + g*0.587 + b*0.114) > 186 ? '#2c3e50' : '#ecf0f1';
            } catch (e) {
                return '#ecf0f1';
            }
        };
        
        let textColor = getContrast(bgColor);
        if (this.state === 'highlight') {
            textColor = '#f1c40f'; // High-contrast yellow
        }

        ctx.fillStyle = textColor;
        ctx.font = `bold ${this.rect.height * 0.45}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.rect.x + this.rect.width / 2, this.rect.y + this.rect.height / 2);
        
        ctx.restore();
    }
}
