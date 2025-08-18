import type { Coord } from "./math";

class Path {
  constructor(
    public readonly ctx: CanvasRenderingContext2D,
    public readonly points: Coord[],
    public readonly userId: string,
    public readonly color: string,
    public readonly size: number,
  ) {}

  private paintCircle(x: number, y: number) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.size / 2, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  private paintLine(px: number, py: number, x: number, y: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(px, py);
    this.ctx.lineTo(x, y);
    this.ctx.lineWidth = this.size;
    this.ctx.stroke();
  }

  render() {
    this.ctx.fillStyle = this.color;
    this.ctx.strokeStyle = this.color;

    for (let i = 0; i < this.points.length; i++) {
      const [x, y] = this.points[i];
      this.paintCircle(x, y);

      const previous = this.points[i - 1];
      if (previous) {
        this.paintLine(previous[0], previous[1], x, y);
      }
    }
  }

  paint(x: number, y: number) {
    this.ctx.fillStyle = this.color;
    this.ctx.strokeStyle = this.color;
    console.log(this.color);
    this.paintCircle(x, y);

    const last = this.points[this.points.length - 1];
    if (last) {
      this.paintLine(last[0], last[1], x, y);
    }

    this.points.push([x, y]);
  }
}

export class CanvasObjectModel {
  private stack: Path[];
  private newPath: Path | undefined;
  public isEraserMode: boolean = false;

  constructor(
    public readonly authorId: string,
    public readonly ctx: CanvasRenderingContext2D,
    public color: string,
    public size: number = 5,
    public eraserSize: number = 30,
  ) {
    this.stack = [];
    this.ctx.globalCompositeOperation = "source-over";
  }

  render() {
    for (const path of this.stack) {
      path.render();
    }
  }

  paint(x: number, y: number) {
    if (!this.newPath) {
      this.newPath = new Path(
        this.ctx,
        [],
        this.authorId,
        this.isEraserMode ? "white" : this.color,
        this.isEraserMode ? this.eraserSize : this.size,
      );
    }

    this.newPath.paint(x, y);
  }

  presentPath() {
    if (this.newPath) {
      this.stack.push(this.newPath);
      this.newPath = undefined;
    }
  }

  undo() {
    let requireReRender = false;

    for (const path of this.stack.toReversed()) {
      if (path.userId === this.authorId) {
        requireReRender = true;
        this.stack.pop();
        break;
      }
    }

    if (requireReRender) {
      this.clear();
      this.render();
    }
  }

  private clear() {
    this.ctx.globalCompositeOperation = "destination-out";
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.globalCompositeOperation = "source-over";
  }

  reset() {
    this.stack = [];
    this.clear();
  }
}
