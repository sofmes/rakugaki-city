import { ColorKind, Eraser, Pen, type Tool, type ToolKind } from "./canvas-tool";

interface Tools {
  pen: Pen;
  eraser: Eraser;
}

export class CanvasManager {
  private readonly stack: ImageData[];
  private currentTool: Tool;
  private tools: Tools;
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly state: {
      getSize: () => { width: number; height: number };
    },
  ) {
    this.stack = [];

    this.tools = {
      pen: new Pen(this, ctx),
      eraser: new Eraser(this, ctx)
    };
    this.currentTool = this.tools.pen;
  }

  getTools(): Tools {
    return this.tools;
  }
  
  getCurrentTool(): Tool {
    return this.currentTool;
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
        this.currentTool = this.tools.pen;
        break;
      case "eraser":
        this.currentTool = this.tools.eraser;
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
