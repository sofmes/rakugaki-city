export class CanvasManager {
  private readonly stack: ImageData[];
  public currentTool: Tool;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly state: {
      getSize: () => { width: number; height: number };
    },
  ) {
    this.stack = [];
    this.currentTool = new Pen(this, ctx);
  }

  pushSnapshot() {
    const { width, height } = this.state.getSize();
    this.stack.push(this.ctx.getImageData(0, 0, width, height));
  }

  undo() {
    const data = this.stack.pop();

    if (data) {
      this.ctx.putImageData(data, 0, 0);
    }
  }

  clear() {
    this.ctx.globalCompositeOperation = "destination-out";
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.globalCompositeOperation = "source-over";
  }
}

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
