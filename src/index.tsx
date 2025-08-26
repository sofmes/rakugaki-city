import { type Env, Hono } from "hono";
import { CanvasRoom } from "./lib/server/canvas-room";
import { RateLimit } from "./lib/server/rate-limit";
import { renderer } from "./renderer";

interface HonoBindings extends CloudflareBindings {
  PRODUCTION_MODE?: boolean;
}

interface HonoEnv extends Env {
  Bindings: HonoBindings;
  Variables: {
    ip: string;
    rateLimit?: {
      millisToNextRequest: number;
    };
  };
}

const app = new Hono<HonoEnv>();

app.use(renderer);

app.get("/", (c) => {
  const userId = crypto.randomUUID();

  return c.redirect(`/0`); // TODO: 部屋を0以外も割り当てる。
});

// レート制限のチェックをするミドルウェア。
// 悪戯で使われまくるのは色々と困る。
app.use("/*", async (c, next) => {
  let maybeip = c.req.header("CF-Connecting-IP");
  if (import.meta.env.DEV) {
    maybeip = "127.0.0.1";
  }

  if (maybeip === undefined)
    return new Response(
      "あなたのIPアドレスが不明のため、接続を開始できません。",
      { status: 400 },
    );

  const ip = maybeip;
  c.set("ip", ip);

  try {
    const rateLimitId = c.env.RATE_LIMIT.idFromName(ip);
    const stub = c.env.RATE_LIMIT.get(rateLimitId);
    const millisToNextRequest = await stub.getMillisToNextRequest();

    if (millisToNextRequest > 0) {
      c.set("rateLimit", { millisToNextRequest });
    }
  } catch {
    return new Response("レート制限の処理に失敗しました。", { status: 502 });
  }

  await next();
});

// 絵チャの部屋
app.get("/:roomId", (c) => {
  if (c.get("rateLimit") !== undefined) {
    c.status(429);
    return c.render(
      <h1 style="font-size: 42px;">
        アクセスが多く混雑しますので、現在あなたは使用できません。
      </h1>,
    );
  }

  return c.render(
    <>
      <script type="module" src="/src/components/room.tsx" />
      <div id="client-components" />
    </>,
  );
});

// キャンバスの絵の情報のやりとりをするためのWebSocketエンドポイント
app.get("/:roomId/ws", async (c) => {
  if (c.get("rateLimit") !== undefined) {
    return new Response("レート制限を受けたので、接続できません。", {
      status: 429,
    });
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
