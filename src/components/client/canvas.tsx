import Panzoom, { type PanzoomObject } from "@panzoom/panzoom";
import { useEffect, useRef } from "hono/jsx";
import {
  getCenter,
  isInside,
  translateToCanvasPos,
} from "../../lib/client/math";
import { ViewportScale } from "../../lib/client/scale-tracker";

interface CanvasController {
  paint(x: number, y: number): void;
  presentPath(): void;
}

export default function Canvas(props: {
  defaultColor: string;
  createController: (e: HTMLCanvasElement) => CanvasController | undefined;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 諸々のイベントハンドラやズーム昨日などのセットアップをする。
    let cleanup = () => {};

    const setup = async () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("キャンバスのContextの取得に失敗しました。");

      const controller = props.createController(canvas);

      // キャンバス関連の処理の準備
      let panzoom: PanzoomObject | null = null;
      let cleanUpPanzoom = () => {};

      const scale = new ViewportScale(canvas, {
        onResize: (rect) => {
          if (panzoom) {
            // 画面サイズが変わったら、キャンバスの位置を変える。
            const pos = getCenter(canvas, rect);
            panzoom.pan(pos.x, pos.y);
          }
        },
      });

      // Panzoomの準備。
      [panzoom, cleanUpPanzoom] = setupPanzoom(canvas);

      // マウスなどの操作イベントを受け取って描画をする処理の準備。
      const cleanUpDraw = setupDrawEvent(
        canvas,
        scale,
        panzoom,
        () => controller,
      );

      cleanup = () => {
        cleanUpPanzoom();
        cleanUpDraw();
        scale.unBind();
      };
    };

    setup();
    return cleanup;
  });

  return <canvas ref={canvasRef} id="canvas" width="1200" height="900" />;
}

/**
 * キャンバスの移動やズームの処理をセットアップする。
 */
function setupPanzoom(canvas: HTMLCanvasElement) {
  const MIDDLE_BUTTONS = 4;

  const centerPos = getCenter(canvas);
  const panzoom = Panzoom(canvas, {
    // キャンバスモードにする。
    canvas: true,

    // 最初は中心に配置
    startX: centerPos.x,
    startY: centerPos.y,

    // キャンバス内での挙動をカスタムするため（後述）
    noBind: true,

    // カーソル
    cursor: "unset",

    handleStartEvent: (e: Event) => {
      e.preventDefault();
    },
  });

  // ズーム機能の提供
  addEventListener("wheel", panzoom.zoomWithWheel);

  // パン機能の提供
  let isPinch = false;
  const onMayBePinch = (e: TouchEvent) => {
    // 後々必要になる情報なので、ピンチかどうかを追跡する。
    isPinch = e.touches.length > 1;
  };

  addEventListener("touchstart", onMayBePinch);
  addEventListener("touchmove", onMayBePinch);

  // キャンバス内で指をなぞった時は、キャンバスを移動させるのではなく線を描きたい。
  // また、キャンバスの外でなくとも、二本指操作によるピンチは描画ではなくズームとしたい。
  // この、パン／ズームを行うかどうかを取得する関数。
  const shouldHandle = (e: PointerEvent) =>
    !isInside(canvas, e.clientX, e.clientY) ||
    e.buttons === MIDDLE_BUTTONS ||
    isPinch;

  const onPointerDown = (e: PointerEvent) => {
    if (shouldHandle(e) || e.pointerType !== "mouse") {
      panzoom.handleDown(e);
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (shouldHandle(e)) {
      panzoom.handleMove(e);
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    panzoom.handleUp(e);
  };

  addEventListener("pointerdown", onPointerDown);
  addEventListener("pointermove", onPointerMove);
  addEventListener("pointerup", onPointerUp);

  return [
    panzoom,
    () => {
      removeEventListener("touchstart", onMayBePinch);
      removeEventListener("touchmove", onMayBePinch);

      removeEventListener("pointerdown", onPointerDown);
      removeEventListener("pointermove", onPointerMove);
      removeEventListener("pointerup", onPointerUp);

      panzoom.destroy();
    },
  ] as const;
}

/**
 * キャンバスの描画をするのに使うマウスなどのイベントをセットアップする。
 */
function setupDrawEvent(
  canvas: HTMLCanvasElement,
  scale: ViewportScale,
  panzoom: PanzoomObject,
  controller: () => CanvasController | undefined,
) {
  // ボタンを押す時は、描画はせずそのボタンを押す動作のみにしたい。
  // それを識別するための関数。
  const isButton = (element: unknown) => {
    return (
      element instanceof HTMLElement &&
      (element instanceof HTMLButtonElement ||
        element.parentElement instanceof HTMLButtonElement)
    );
  };

  // マウスの押し方が、描画すべき押し方に該当するかどうかを取得する。
  const LEFT_BUTTON = 0;
  const mouseFilter = (event: MouseEvent, isMouseDown: boolean) =>
    (isMouseDown && isButton(event.target)) || event.button !== LEFT_BUTTON;

  // マウスでの線の描画操作のイベントハンドラたち。
  let painting = false;

  const onDown = (event: MouseEvent) => {
    if (mouseFilter(event, true)) return;

    const pos = translateToCanvasPos(
      canvas,
      scale,
      panzoom.getScale(),
      event.clientX,
      event.clientY,
    );

    if (pos) {
      painting = true;
      controller()?.paint(pos.x, pos.y);
    }
  };

  const onMove = (event: MouseEvent) => {
    if (mouseFilter(event, false) || !painting) return;

    const pos = translateToCanvasPos(
      canvas,
      scale,
      panzoom.getScale(),
      event.clientX,
      event.clientY,
    );

    if (pos) {
      controller()?.paint(pos.x, pos.y);
    } else {
      // 線の描画中に場外にとびでた場合、まだマウスが押されていても線は終了とする。
      // こうしないと、場外に飛び出たあとにキャンバスにマウスが行くと、
      // 途切れた場所からそこまで線が伸びてしまい、意図せぬ描画となってしまう。

      controller()?.presentPath();
      painting = false;
    }
  };

  const onUp = (event: MouseEvent) => {
    if (mouseFilter(event, false)) return;

    const pos = translateToCanvasPos(
      canvas,
      scale,
      panzoom.getScale(),
      event.clientX,
      event.clientY,
    );

    if (pos) {
      controller()?.presentPath();
    }

    painting = false;
  };

  // 描画すべきタッチ操作かどうかを判断する関数。
  const touchFilter = (e: TouchEvent, isStart: boolean) => {
    // ズーム時は、キャンバスを描画したくないので、一つの指だけのタッチか確認する。
    if (e.touches.length !== 1) {
      return true;
    }

    // ツール切り替えといったボタンを押した際は、キャンバスに描画しない。
    if (isButton(e.target) && isStart) return true;

    return false;
  };

  const onTouchStart = (event: TouchEvent) => {
    if (touchFilter(event, true)) return;

    const touch = event.touches[0];
    const pos = translateToCanvasPos(
      canvas,
      scale,
      panzoom.getScale(),
      touch.clientX,
      touch.clientY,
    );

    if (pos) {
      painting = true;
    }
  };

  const onTouchMove = (event: TouchEvent) => {
    if (touchFilter(event, false)) return;

    const touch = event.touches[0];
    const pos = translateToCanvasPos(
      canvas,
      scale,
      panzoom.getScale(),
      touch.clientX,
      touch.clientY,
    );

    if (pos) {
      controller()?.paint(pos.x, pos.y);
    }
  };

  const onTouchEnd = () => {
    if (painting) {
      controller()?.presentPath();
      painting = false;
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
