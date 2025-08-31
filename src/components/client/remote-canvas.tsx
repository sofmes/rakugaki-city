import { memo, useMemo, useState } from "hono/jsx";
import { CanvasObjectModel } from "../../lib/client/canvas";
import {
  type CanvasState,
  RemoteCanvas as RemoteCanvasConn,
} from "../../lib/client/session";
import { getCookieValue } from "../../lib/client/utils";
import Canvas from "./canvas";

const CanvasMemoized = memo(Canvas);

export function RemoteCanvasUI(props: {
  defaultColor: string;
  setRemoteCanvas: (canvas: RemoteCanvasConn) => void;
}) {
  const [state, setState] = useState<CanvasState>("closed");
  const userId = getUserId();

  const createController = useMemo(
    () => (e: HTMLCanvasElement) => {
      const ctx = e.getContext("2d");
      if (!ctx) {
        alert("キャンバスの準備に失敗しました。");
        throw new Error("キャンバスのコンテクストの取得に失敗。");
      }

      const com = new CanvasObjectModel(userId, ctx, props.defaultColor);
      const session = new RemoteCanvasConn(com, userId, setState);
      props.setRemoteCanvas(session);

      return session;
    },
    [],
  );

  return (
    <div>
      {state === "opened" ? null : <Connecting />}

      <CanvasMemoized
        defaultColor={props.defaultColor}
        createController={createController}
      />
    </div>
  );
}

function Connecting() {
  return (
    <>
      {/* biome-ignore lint: 接続中操作できないようにするために、静的要素にonMouseDownを付けている。 */}
      <div id="connecting" onMouseDown={(e) => e.stopPropagation()}>
        接続中...
      </div>
    </>
  );
}

function getUserId() {
  // TODO: いつかcookieStore.getを使う。
  const userId = getCookieValue("uid"); // ユーザーのID

  if (userId === null) {
    alert("何らかのエラーが発生しました。再読み込みしてください。");
    throw new Error(
      "ユーザーIDがありませんでした。このため、処理を続行できません。",
    );
  }

  return userId;
}
