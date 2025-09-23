import type { Coord, PathData } from "../data";

/**
 * ペンを下してから上げるまでに描いた線の描画情報。
 */
export class Path {
  constructor(
    public readonly ctx: CanvasRenderingContext2D,
    public readonly points: Coord[],
    public readonly userId: string,
    public readonly color: string,
    public readonly size: number,
  ) {}

  static fromData(ctx: CanvasRenderingContext2D, data: PathData) {
    return new Path(ctx, data.points, data.userId, data.color, data.size);
  }

  /**
   * JSONに変換できる状態にする。
   */
  toData(): PathData {
    return {
      points: this.points,
      userId: this.userId,
      color: this.color,
      size: this.size,
    };
  }

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

  /**
   * キャンバスに線を描画する。
   */
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

  /**
   * 描画情報を記録しつつ、キャンバスに描画する。
   */
  paint(x: number, y: number) {
    this.ctx.fillStyle = this.color;
    this.ctx.strokeStyle = this.color;
    this.paintCircle(x, y);

    const last = this.points[this.points.length - 1];
    if (last) {
      this.paintLine(last[0], last[1], x, y);
    }

    this.points.push([x, y]);
  }
}

/**
 * キャンバス上のオブジェクトを管理するためのクラス。
 *
 * 基本的には線を描く度にスタックへ`Path`を重ねていく。
 * 「元に戻す」時は、直近に追加した`Path`を削除し、
 * キャンバスをリセットしてスタック上の`Path`を１から順番に描画しなおす。
 */
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

  /**
   * スタックにあるパスを１から全て描画する。（`Path.render`を呼び出す。）
   */
  render() {
    for (const path of this.stack) {
      path.render();
    }
  }

  /**
   * 現在描画中の`Path`の`paint`を呼び出す。
   * もし新しい線であれば、現在のペンの色情報を基に新しい`Path`を作る。
   */
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

  /**
   * `paint`で描いていた線（`Path`）を描画終了とし、スタックに追加する。
   */
  presentPath() {
    if (this.newPath) {
      const path = this.newPath;
      this.newPath = undefined;
      this.stack.push(path);
      return path;
    }
  }

  /**
   * 指定されたデータでスタックの中身を交換し、キャンバスに反映する。
   */
  refresh(stackData: PathData[]) {
    this.reset();

    for (const pathData of stackData) {
      this.push(pathData);
    }
  }

  /**
   * 渡されたデータのパスを描画してスタックに追加する。
   */
  push(pathData: PathData) {
    const path = Path.fromData(this.ctx, pathData);
    path.render();
    this.stack.push(path);
  }

  /**
   * 直近に描いた線（`Path`）をスタックから削除し、キャンバスを１から描画し直す。
   */
  undo(opts?: { userId?: string }) {
    let requireReRender = false;
    const userId = opts?.userId === undefined ? this.authorId : opts.userId;

    for (let i = this.stack.length - 1; i >= 0; i--) {
      const path = this.stack[i];

      if (path.userId === userId) {
        requireReRender = true;
        this.stack.splice(i, 1);
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

  /**
   * スタック含め、キャンバスを全てリセットする。
   */
  reset() {
    this.stack = [];
    this.clear();
  }
}
