import type { CanvasManager } from "./canvas";

export type ToolKind = "pen" | "eraser" | "lasso";

export type ColorKind = "red" | "blue" | "green" | "yellow" | "black";

export abstract class Tool {
  abstract down(): void;
  abstract isDowned(): boolean;
  abstract move(x: number, y: number): void;
  abstract up(): void;
}

export class Pen extends Tool {
  private painting = false;
  private beforePainted: [number, number] | undefined = undefined;

  constructor(
    private readonly manager: CanvasManager,
    private readonly ctx: CanvasRenderingContext2D,
    public color = "blue",
    public size = 3,
  ) {
    super();
  }

  down() {
    this.ctx.globalCompositeOperation = "source-over";
    this.ctx.fillStyle = this.color;

    this.painting = true;
  }

  isDowned(): boolean {
    return this.painting;
  }

  move(x: number, y: number) {
    if (!this.isDowned()) return;

    this.ctx.beginPath();
    this.ctx.arc(x, y, this.size / 2, 0, 2 * Math.PI);
    this.ctx.fill();

    if (this.beforePainted) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.beforePainted[0], this.beforePainted[1]);
      this.ctx.lineTo(x, y);
      this.ctx.strokeStyle = this.color;
      this.ctx.lineWidth = this.size;
      this.ctx.stroke();
    }

    this.beforePainted = [x, y];
  }

  up() {
    this.beforePainted = undefined;

    this.painting = false;
    this.manager.pushSnapshot();
  }
}

export class Eraser extends Tool {
  private erasing = false;
  private beforeErased: [number, number] | undefined = undefined;

  constructor(
    private readonly manager: CanvasManager,
    private readonly ctx: CanvasRenderingContext2D,
    public size = 30,
  ) {
    super();
  }

  down() {
    this.ctx.globalCompositeOperation = "destination-out";

    this.erasing = true;
  }

  isDowned(): boolean {
    return this.erasing;
  }

  move(x: number, y: number) {
    if (!this.isDowned()) return;

    this.ctx.beginPath();
    this.ctx.arc(x, y, this.size / 2, 0, 2 * Math.PI);
    this.ctx.fill();

    if (this.beforeErased) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.beforeErased[0], this.beforeErased[1]);
      this.ctx.lineTo(x, y);
      this.ctx.lineWidth = this.size;
      this.ctx.stroke();
    }

    this.beforeErased = [x, y];
  }

  up() {
    this.beforeErased = undefined;
    this.ctx.globalCompositeOperation = "source-over";

    this.erasing = false;
    this.manager.pushSnapshot();
  }
}
