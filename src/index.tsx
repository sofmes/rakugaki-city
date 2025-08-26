import { Hono } from "hono";
import { CanvasRoom } from "./lib/server/canvas-room";
import { RateLimit } from "./lib/server/rate-limit";
import { renderer } from "./renderer";

interface Env extends CloudflareBindings {
  PRODUCTION_MODE?: boolean;
}

const app = new Hono<{ Bindings: Env }>();

app.use(renderer);

app.get("/", (c) => {
  const roomId = 0;

  return c.redirect(`/${roomId}`);
});

app.get("/:roomId", (c) => {
  // キャンバスの部屋
  return c.render(
    <>
      <script type="module" src="/src/room.tsx" />
      <div id="client-components" />
    </>,
  );
});

// キャンバスの絵の情報のやりとりをするためのWebSocketエンドポイント
app.get("/:roomId/ws", async (c) => {
  // レート制限のチェックを行う。
  let ip = "127.0.0.1";
  if (c.env.PRODUCTION_MODE) {
    const maybeip = c.req.header("CF-Connecting-IP");
    if (maybeip === undefined)
      return new Response(
        "あなたのIPアドレスが不明のため、接続を開始できません。",
        { status: 400 },
      );

    ip = maybeip;
  }

  try {
    const rateLimitId = c.env.RATE_LIMIT.idFromName(ip);
    const stub = c.env.RATE_LIMIT.get(rateLimitId);
    const millisToNextRequest = await stub.getMillisToNextRequest();

    if (millisToNextRequest > 0) {
      return new Response(
        "あなたはレート制限を受けました。しばらく時間を置いてから試してください。",
        { status: 429 },
      );
    }
  } catch {
    return new Response("レート制限の処理に失敗しました。", { status: 502 });
  }

  // WebSocketの準備。
  const upgradeHeader = c.req.header("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return new Response(
      "WebSocketへのアップグレードを設定してください。",
      { status: 426 }, // Upgrade Required
    );
  }

  const roomId = c.req.param("roomId");
  const objId = c.env.CANVAS_ROOM.idFromName(roomId);
  const room = c.env.CANVAS_ROOM.get(objId);

  return await room.fetch(c.req.raw);
});

export default app;
export { CanvasRoom, RateLimit };
