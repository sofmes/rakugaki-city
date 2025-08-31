import { memo, useMemo } from "hono/jsx";
import { CanvasObjectModel } from "../../lib/client/canvas";
import {
  type ConnectionState,
  RemoteCanvas as RemoteCanvasConn,
} from "../../lib/client/session";
import { getCookieValue } from "../../lib/client/utils";
import Canvas from "./canvas";

const CanvasMemoized = memo(Canvas);

export function RemoteCanvasUI(props: {
  defaultColor: string;
  setRemoteCanvas: (canvas: RemoteCanvasConn) => void;
  setConnState: (state: ConnectionState) => void;
}) {
  const userId = getUserId();

  const createController = useMemo(
    () => (e: HTMLCanvasElement) => {
      const ctx = e.getContext("2d");
      if (!ctx) {
        alert("キャンバスの準備に失敗しました。");
        throw new Error("キャンバスのコンテクストの取得に失敗。");
      }

      const com = new CanvasObjectModel(userId, ctx, props.defaultColor);
      const session = new RemoteCanvasConn(com, userId, props.setConnState);
      props.setRemoteCanvas(session);

      return session;
    },
    [],
  );

  return (
    <CanvasMemoized
      defaultColor={props.defaultColor}
      createController={createController}
    />
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
