/**
 * Renderer.ts
 * Handles rendering game entities and scenes to the canvas
 */

export interface RenderOptions {
  width: number;
  height: number;
  backgroundColor?: string;
  pixelRatio?: number;
  smoothing?: boolean;
}

export interface Renderable {
  x: number;
  y: number;
  width: number;
  height: number;
  render: (ctx: CanvasRenderingContext2D) => void;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private backgroundColor: string;
  private pixelRatio: number;

  constructor(canvas: HTMLCanvasElement, options: RenderOptions) {
    this.canvas = canvas;
    this.width = options.width;
    this.height = options.height;
    this.backgroundColor = options.backgroundColor || '#000';
    this.pixelRatio = options.pixelRatio || window.devicePixelRatio || 1;

    // Set canvas dimensions
    this.canvas.width = this.width * this.pixelRatio;
    this.canvas.height = this.height * this.pixelRatio;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Get and configure context
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = context;
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
    
    // Set image smoothing based on options
    this.ctx.imageSmoothingEnabled = options.smoothing !== undefined ? options.smoothing : false;
  }

  // Clear the canvas
  clear(): void {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // Render a single entity
  renderEntity(entity: Renderable): void {
    entity.render(this.ctx);
  }

  // Render an array of entities
  renderEntities(entities: Renderable[]): void {
    entities.forEach(entity => this.renderEntity(entity));
  }

  // Draw a rectangle
  drawRect(x: number, y: number, width: number, height: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  // Draw a circle
  drawCircle(x: number, y: number, radius: number, color: string): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  // Draw an image
  drawImage(image: HTMLImageElement, x: number, y: number, width?: number, height?: number): void {
    if (width && height) {
      this.ctx.drawImage(image, x, y, width, height);
    } else {
      this.ctx.drawImage(image, x, y);
    }
  }

  // Draw text
  drawText(text: string, x: number, y: number, options: {
    color?: string;
    font?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
  } = {}): void {
    this.ctx.fillStyle = options.color || '#fff';
    this.ctx.font = options.font || '16px arcade, monospace';
    this.ctx.textAlign = options.align || 'left';
    this.ctx.textBaseline = options.baseline || 'top';
    this.ctx.fillText(text, x, y);
  }

  // Get context for advanced operations
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  // Resize the renderer
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width * this.pixelRatio;
    this.canvas.height = height * this.pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
  }

  /**
   * Set the background color
   */
  setBackgroundColor(color: string): void {
    this.backgroundColor = color;
  }
} 