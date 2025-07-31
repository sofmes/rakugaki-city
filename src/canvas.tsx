import { useEffect, useRef } from "hono/jsx";
import createPanZoom from "panzoom";
import { CanvasManager } from "./lib/canvas";

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current)
      throw new Error("キャンバスの取得ができませんでした。");

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) throw new Error("キャンバスのContextの取得に失敗しました。");

    // キャンバスマネージャを用意。
    const getSize = () => {
      const rect = canvasRef.current?.getBoundingClientRect();
      return rect as DOMRect;
    };

    const canvasManager = new CanvasManager(ctx, { getSize });

    // マウスイベントを設定。
    const [panzoom, cleanUpPanZoom] = setupPanZoom(canvasRef.current);

    const getScale = () => panzoom.getTransform().scale;
    const cleanUpDraw = setupDrawEvent(canvasRef.current, canvasManager, {
      getScale,
    });

    return () => {
      cleanUpPanZoom();
      cleanUpDraw();
    };
  });

  return <canvas ref={canvasRef} id="canvas" width="1200" height="900" />;
}

function setupPanZoom(canvas: HTMLCanvasElement) {
  const MIDDLE_BUTTON = 1;

  const instance = createPanZoom(canvas, {
    // マウスイベントの伝搬が阻害されないように設定。
    onClick: () => false,
    onTouch: () => false,

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

function setupDrawEvent(
  canvas: HTMLCanvasElement,
  canvasManager: CanvasManager,
  state: { getScale: () => number },
) {
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

    return {
      x: ((x - rect.x) * canvasWidthRatio) / zoomScale,
      y: ((y - rect.y) * canvasHeightRatio) / zoomScale,
    };
  }

  const LEFT_BUTTON = 0;
  function mouseFilter(event: MouseEvent) {
    return event.button !== LEFT_BUTTON;
  }

  const onDown = (event: MouseEvent) => {
    if (mouseFilter(event)) return;

    const pos = convertPosition(event.clientX, event.clientY);
    if (pos) {
      canvasManager.currentTool.down();
    }
  };

  const onMove = (event: MouseEvent) => {
    if (mouseFilter(event)) return;

    const pos = convertPosition(event.clientX, event.clientY);
    if (pos) {
      canvasManager.currentTool.move(pos.x, pos.y);
    }
  };

  const onUp = (event: MouseEvent) => {
    if (mouseFilter(event)) return;

    const pos = convertPosition(event.clientX, event.clientY);
    if (pos) {
      canvasManager.currentTool.up();
    }
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
