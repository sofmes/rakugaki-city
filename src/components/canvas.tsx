import { useEffect, useRef } from "hono/jsx";

import createPanZoom from "panzoom";
import type { Session } from "../lib/client/session";

export default function Canvas(props: {
  defaultColor: string;
  createCanvasSession: (canvasElement: HTMLCanvasElement) => Session;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current)
      throw new Error("キャンバスの取得ができませんでした。");

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) throw new Error("キャンバスのContextの取得に失敗しました。");

    const controller = props.createCanvasSession(canvasRef.current);

    // マウスイベントを設定。
    const [panzoom, cleanUpPanZoom] = setupPanZoom(canvasRef.current);

    const getScale = () => panzoom.getTransform().scale;
    const cleanUpDraw = setupDrawEvent(canvasRef.current, controller, {
      getScale,
    });

    return () => {
      cleanUpPanZoom();
      cleanUpDraw();
    };
  });

  return (
    <div id="canvas-container">
      <canvas ref={canvasRef} id="canvas" width="1200" height="900" />
    </div>
  );
}

function setupPanZoom(canvas: HTMLCanvasElement) {
  const MIDDLE_BUTTON = 1;

  const instance = createPanZoom(canvas, {
    // マウスイベントの伝搬が阻害されないように設定。
    onClick: () => false,
    onTouch: () => false,

    // ダブルクリックのズームを無効化。（Undoボタンの連打時に邪魔になる。）
    zoomDoubleClickSpeed: 1,

    // 描画中に移動しないように、中ボタンか右クリックを押していないと動かないよう設定。
    beforeMouseDown: (e) => e.button !== MIDDLE_BUTTON,
  });

  const rect = canvas.getBoundingClientRect();
  instance.moveTo(
    innerWidth / 2 - rect.width / 2,
    innerHeight / 2 - rect.height / 2,
  );

  return [
    instance,
    () => {
      instance.dispose();
    },
  ] as const;
}

interface CanvasController {
  paint(x: number, y: number): void;
  presentPath(): void;
}

function setupDrawEvent(
  canvas: HTMLCanvasElement,
  controller: CanvasController,
  state: { getScale: () => number },
) {
  // 後で座標の計算に使う情報を用意する。
  // キャンバスの画面上の座標を基準にしたキャンバスの横幅と、絵の解像度の座標を基準にした横幅は違う。
  // 例えば、解像度が1200*900の時、画面の大きさによってそのままのサイズで表示した場合、大きすぎるか小さすぎるので、
  // 実際に表示されるキャンバスは拡大か縮小がされている。これは横幅だけでなく縦幅にも同じことが言える。
  // これはすなわち、マウスの座標系とキャンバス内の座標系が違うということで、
  // マウスの座標をキャンバス内の座標に変換するためには、拡大／縮小後の横幅・縦幅との比率を元に拡大／縮小を解除しなければならない。
  // このため、比率を計算しておく。
  const rect = canvas.getBoundingClientRect();
  const canvasWidthRatio = canvas.width / rect.width;
  const canvasHeightRatio = canvas.height / rect.height;

  /**
   * 画面上の座標を、キャンバス内での座標に変換する。もしキャンバス外だった場合、`null`を返す。
   */
  function convertPosition(
    x: number,
    y: number,
  ): { x: number; y: number } | null {
    const rect = canvas.getBoundingClientRect();

    // もしキャンバスの場外の座標だった場合、キャンバス内の座標に変換する意味がない。この場合無視。
    if (rect.x > x || rect.y > y || rect.right < x || rect.bottom < y) {
      return null;
    }

    const zoomScale = state.getScale();

    // canvasWidthRatio/canvasHeightRatio: キャンバスの表示上の横幅・縦幅と解像度の縦幅と横幅の比率
    //   これで座標を拡大／縮小された状態からされていない状態に戻す。
    // zoomScale: panzoomライブラリによる、ユーザーが行った拡大・縮小による拡大率。
    //   これでpanzoomライブラリによる拡大・縮小された座標をキャンバス内の座標にする。

    return {
      x: ((x - rect.x) * canvasWidthRatio) / zoomScale,
      y: ((y - rect.y) * canvasHeightRatio) / zoomScale,
    };
  }

  const LEFT_BUTTON = 0;
  function mouseFilter(event: MouseEvent) {
    return event.button !== LEFT_BUTTON;
  }

  let painting = false;
  const onDown = (event: MouseEvent) => {
    if (mouseFilter(event)) return;

    const pos = convertPosition(event.clientX, event.clientY);
    if (pos) {
      painting = true;
      controller.paint(pos.x, pos.y);
    }
  };

  const onMove = (event: MouseEvent) => {
    if (mouseFilter(event) || !painting) return;

    const pos = convertPosition(event.clientX, event.clientY);
    if (pos) {
      controller.paint(pos.x, pos.y);
    }
  };

  const onUp = (event: MouseEvent) => {
    if (mouseFilter(event)) return;

    const pos = convertPosition(event.clientX, event.clientY);
    if (pos) {
      controller.presentPath();
    }

    painting = false;
  };

  addEventListener("mousedown", onDown);
  addEventListener("mousemove", onMove);
  addEventListener("mouseup", onUp);

  return () => {
    removeEventListener("mousedown", onDown);
    removeEventListener("mousemove", onMove);
    removeEventListener("mouseup", onUp);
  };
}
