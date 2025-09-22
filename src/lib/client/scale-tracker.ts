/**
 * キャンバスの解像度に対する画面の表示上のサイズの比を追跡するクラス。
 * 画面の大きさが変わる度にその比率（拡大率）を求め直す。
 */
export class ViewportScale {
  widthScale: number = 1;
  heightScale: number = 1;
  private onResize = () => {};

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly opts: { onResize: (rect: DOMRect) => void },
  ) {
    this.calc();

    this.onResize = () => this.calc();
  }

  private calc() {
    const rect = this.canvas.getBoundingClientRect();

    this.widthScale = rect.width / this.canvas.width;
    this.heightScale = rect.height / this.canvas.height;

    this.opts.onResize(rect);
  }

  bind() {
    addEventListener("resize", this.onResize);
  }

  unBind() {
    removeEventListener("resize", this.onResize);
  }
}
