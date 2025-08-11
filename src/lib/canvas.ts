import { Eraser, Pen, type Tool, type ToolKind } from "./canvas-tool";

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

  test() {
    console.log(this.ctx);
    this.ctx.beginPath();
    this.ctx.arc(30, 30, 10, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  currentToolName(): ToolKind {
    if (this.currentTool instanceof Pen) {
      return "pen";
    } else if (this.currentTool instanceof Eraser) {
      return "eraser";
    } else {
      return "lasso";
    }
  }

  setTool(name: ToolKind) {
    switch (name) {
      case "pen":
        this.currentTool = new Pen(this, this.ctx);
        break;
      case "eraser":
        this.currentTool = new Eraser(this, this.ctx);
        break;
    }
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
