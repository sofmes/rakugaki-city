import { useEffect, useRef } from "hono/jsx";

import createPanZoom, { type PanZoom } from "panzoom";
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

    const cleanUpDraw = setupDrawEvent(canvasRef.current, panzoom, controller);

    return () => {
      cleanUpPanZoom();
      cleanUpDraw();
    };
  });

  return <canvas ref={canvasRef} id="canvas" width="1200" height="900" />;
}

/**
 * 画面上の座標を、キャンバス内での座標に変換する。もしキャンバス外だった場合、`null`を返す。
 */
function convertPosition(
  canvas: HTMLCanvasElement,
  panzoom: PanZoom,
  x: number,
  y: number,
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();

  // もしキャンバスの場外の座標だった場合、キャンバス内の座標に変換する意味がない。この場合無視。
  if (rect.x > x || rect.y > y || rect.right < x || rect.bottom < y) {
    return null;
  }

  const canvasWidthRatio = canvas.width / rect.width;
  const canvasHeightRatio = canvas.height / rect.height;
  const zoomScale = panzoom.getTransform().scale;

  // canvasWidthRatio/canvasHeightRatio: キャンバスの表示上の横幅・縦幅と解像度の縦幅と横幅の比率
  //   これで座標を拡大／縮小された状態からされていない状態に戻す。
  // zoomScale: panzoomライブラリによる、ユーザーが行った拡大・縮小による拡大率。
  //   これでpanzoomライブラリによる拡大・縮小された座標をキャンバス内の座標にする。

  return {
    x: ((x - rect.x) * canvasWidthRatio) / zoomScale,
    y: ((y - rect.y) * canvasHeightRatio) / zoomScale,
  };
}

function setupPanZoom(canvas: HTMLCanvasElement) {
  const MIDDLE_BUTTON = 1;

  const instance = createPanZoom(canvas, {
    // マウスイベントの伝搬が阻害されないように設定。
    onClick: () => false,
    onTouch: () => {
      return false;
    },

    // ダブルクリックのズームを無効化。（Undoボタンの連打時に邪魔になる。）
    zoomDoubleClickSpeed: 1,

    // 描画中に移動しないように、中ボタンか右クリックを押していないと動かないよう設定。
    beforeMouseDown: (e) => {
      if (convertPosition(canvas, instance, e.clientX, e.clientY) !== null) {
        return e.button !== MIDDLE_BUTTON;
      }
    },
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
  panzoom: PanZoom,
  controller: CanvasController,
) {
  const LEFT_BUTTON = 0;
  function mouseFilter(event: MouseEvent) {
    return event.button !== LEFT_BUTTON;
  }

  let painting = false;

  // マウスでの線の描画操作
  const onDown = (event: MouseEvent) => {
    if (mouseFilter(event)) return;

    const pos = convertPosition(canvas, panzoom, event.clientX, event.clientY);
    if (pos) {
      painting = true;
      controller.paint(pos.x, pos.y);
    }
  };

  const onMove = (event: MouseEvent) => {
    if (mouseFilter(event) || !painting) return;

    const pos = convertPosition(canvas, panzoom, event.clientX, event.clientY);
    if (pos) {
      controller.paint(pos.x, pos.y);
    } else {
      // 線の描画中に場外にとびでた場合、まだマウスが押されていても線は終了とする。
      controller.presentPath();
      painting = false;
    }
  };

  const onUp = (event: MouseEvent) => {
    if (mouseFilter(event)) return;

    const pos = convertPosition(canvas, panzoom, event.clientX, event.clientY);
    if (pos) {
      controller.presentPath();
    }

    painting = false;
  };

  const touchFilter = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      e.stopPropagation();
      return true;
    }
    return false;
  };

  // スマホでの線の描画操作
  const onTouchStart = (event: TouchEvent) => {
    if (touchFilter(event)) return;

    const touch = event.touches[0];
    const pos = convertPosition(canvas, panzoom, touch.clientX, touch.clientY);
    if (pos) {
      panzoom.pause(); // 止めないと線を描こうとしてるのにキャンバスが動く。

      painting = true;
      controller.paint(pos.x, pos.y);
    }
  };

  const onTouchMove = (event: TouchEvent) => {
    if (touchFilter(event)) return;

    const touch = event.touches[0];
    const pos = convertPosition(canvas, panzoom, touch.clientX, touch.clientY);
    if (pos) {
      controller.paint(pos.x, pos.y);
    }
  };

  const onTouchEnd = () => {
    if (painting) {
      controller.presentPath();
      painting = false;

      panzoom.resume();
    }
  };

  addEventListener("mousedown", onDown);
  addEventListener("mousemove", onMove);
  addEventListener("mouseup", onUp);

  addEventListener("touchstart", onTouchStart);
  addEventListener("touchmove", onTouchMove);
  addEventListener("touchend", onTouchEnd);

  return () => {
    removeEventListener("mousedown", onDown);
    removeEventListener("mousemove", onMove);
    removeEventListener("mouseup", onUp);

    removeEventListener("touchstart", onTouchStart);
    removeEventListener("touchmove", onTouchMove);
    removeEventListener("touchend", onTouchEnd);
  };
}
