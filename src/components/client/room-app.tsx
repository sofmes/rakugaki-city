import { memo, useMemo, useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import { CanvasObjectModel } from "../../lib/client/canvas";
import { Session } from "../../lib/client/session";
import { getCookieValue } from "../../lib/client/utils";
import Canvas from "./canvas";
import { SessionContext } from "./session";
import { ToolBox } from "./tool-box";
import { UtilityBox } from "./utility-box";

const CanvasWithMemo = memo(Canvas);
const DEFAULT_COLOR = "blue" as const;

export default function RoomApp() {
  const [session, setSession] = useState<Session | null>(null);

  const createCanvasController = useMemo(
    () => async (e: HTMLCanvasElement) => {
      const ctx = e.getContext("2d");
      if (!ctx) {
        alert("キャンバスの準備に失敗しました。");
        throw new Error("キャンバスのコンテクストの取得に失敗。");
      }

      // バックエンドに接続する。
      const [userId, ws] = await connectWebSocket();

      const com = new CanvasObjectModel(userId, ctx, DEFAULT_COLOR);
      const session = new Session(com, userId, ws);

      setSession(session);
      return session;
    },
    [],
  );

  return (
    <>
      <header id="header">落書きシティ</header>
      <img id="logo" src="/sofume_logo.png" alt="落書きシティのロゴ" />

      <CanvasWithMemo
        createCanvasController={createCanvasController}
        defaultColor={DEFAULT_COLOR}
      />

      <SessionContext.Provider value={session}>
        <div id="mainbox">
          <ToolBox />
          <UtilityBox />
        </div>
      </SessionContext.Provider>
    </>
  );
}

async function connectWebSocket() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${location.host}${location.pathname}/ws`;

  let ws: WebSocket;
  try {
    ws = new WebSocket(url);
  } catch (e) {
    alert(
      "何らかのエラーが発生して、接続に失敗しました。" +
        "共有機能は使えない状態になります。",
    );
    throw e;
  }

  const userId = await getCookieValue("uid"); // ユーザーのID
  // TODO: いつかcookieStore.getを使う。
  if (userId === null) {
    alert("何らかのエラーが発生しました。再読み込みしてください。");
    throw new Error(
      "ユーザーIDがありませんでした。このため、処理を続行できません。",
    );
  }

  return [userId, ws] as const;
}

const element = document.getElementById("client-components");
render(<RoomApp />, element as HTMLElement);
