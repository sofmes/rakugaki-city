/**
 * 指定された要素を画面中央に配置する場合の座標を計算する。
 */
export function getCenter(element: HTMLElement, calculatedRect?: DOMRect) {
  const rect = calculatedRect ?? element.getBoundingClientRect();

  return {
    x: innerWidth / 2 - rect.width / 2,
    y: innerHeight / 2 - rect.height / 2,
  };
}

/**
 * 指定された画面上の座標がキャンバスの内側にあるかどうかを返す関数。
 */
export function isInside(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  calculatedRect?: DOMRect,
): boolean {
  const rect = calculatedRect ?? canvas.getBoundingClientRect();
  return rect.x < x && rect.y < y && rect.right > x && rect.bottom > y;
}

/**
 * 画面上の座標をキャンバス内での座標に変換する。もしキャンバス外だった場合、`null`を返す。
 *
 * @param canvas 画面上の座標をキャンバス上での座標に変換したい、対象のキャンバス。
 * @param viewportScale キャンバスの解像度に対する、画面の表示上の縦幅・横幅の拡大率。
 * @param zoomScale 画面の表示上の拡大とは別で実施した拡大・縮小の拡大率。
 * @param x 画面上でのX座標
 * @param y 画面上でのY座標
 */
export function translateToCanvasPos(
  canvas: HTMLCanvasElement,
  viewportScale: { widthScale: number; heightScale: number },
  zoomScale: number,
  x: number,
  y: number,
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();

  // 指定された座標が要素の外側かどうかを確かめる。
  if (!isInside(canvas, x, y, rect)) {
    return null;
  }

  // widthScale/heightScale: キャンバスの表示上の横幅・縦幅と解像度の縦幅と横幅の比率
  // zoomScale: panzoomライブラリによる、ユーザーが行える拡大・縮小による拡大率。

  const { widthScale, heightScale } = viewportScale;

  return {
    x: (x - rect.x) / widthScale / zoomScale,
    y: (y - rect.y) / heightScale / zoomScale,
  };
}
