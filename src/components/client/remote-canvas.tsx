import { memo, useMemo, useState } from "hono/jsx";
import { CanvasObjectModel } from "../../lib/client/canvas";
import {
  type CanvasState,
  RemoteCanvas as RemoteCanvasConn,
} from "../../lib/client/session";
import Canvas from "./canvas";

const CanvasMemoized = memo(Canvas);

/**
 * キャンバスに共有する機能を付け加えたコンポーネント
 */
export function RemoteCanvasUI(props: {
  defaultColor: string;
  ownRoomId: string;
  setRemoteCanvas: (canvas: RemoteCanvasConn) => void;
}) {
  const [state, setState] = useState<CanvasState>("closed");
  const [canvas, setCanvas] = useState<HTMLCanvasElement>();

  const createController = useMemo(
    () => (e: HTMLCanvasElement) => {
      const ctx = e.getContext("2d");
      if (!ctx) {
        alert("キャンバスの準備に失敗しました。");
        throw new Error("キャンバスのコンテクストの取得に失敗。");
      }

      const com = new CanvasObjectModel(
        props.ownRoomId,
        ctx,
        props.defaultColor,
      );
      const session = new RemoteCanvasConn(com, props.ownRoomId, setState);
      props.setRemoteCanvas(session);

      setCanvas(e);
      return session;
    },
    [],
  );

  return (
    <>
      {state === "opened" || !canvas ? null : <Connecting />}

      <CanvasMemoized
        defaultColor={props.defaultColor}
        createController={createController}
      />
    </>
  );
}

/**
 * キャンバスの位置に接続中の表示を行うコンポーネント。
 */
function Connecting() {
  return (
    <>
      {/* biome-ignore lint: 接続中操作できないようにするために、静的要素にonMouseDownを付けている。 */}
      <div id="connecting" onMouseDown={(e) => e.stopPropagation()}>
        読み込み中...
      </div>
    </>
  );
}
