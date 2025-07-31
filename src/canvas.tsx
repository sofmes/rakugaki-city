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

    // マウスイベントを設定。
    const cleanUpZoom = setupZoomEvent(canvasRef.current);

    const getSize = () => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) throw new Error("キャンバスのサイズの取得に失敗しました。")
      return rect;
    }

    new CanvasManager(ctx, {getSize});

    return () => {
      cleanUpZoom();
    };
  });

  return <canvas ref={canvasRef} id="canvas" />;
}

function setupZoomEvent(canvas: HTMLCanvasElement) {
  const instance = createPanZoom(canvas);

  const rect = canvas.getBoundingClientRect();
  instance.moveTo(
    innerWidth / 2 - rect.width / 2,
    innerHeight / 2 - rect.height / 2,
  );

  return () => {
    instance.dispose();
  };
}
