import { type Env, Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { JSX } from "hono/jsx/jsx-runtime";
import { Link, Script } from "vite-ssr-components/hono";
import Manual from "./components/server/manual";
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

declare module "hono" {
  interface ContextRenderer {
    // biome-ignore lint/style/useShorthandFunctionType: typeによる定義にすると重複エラーになる。
    (
      content: string | Promise<string>,
      props: { title?: string; head?: JSX.Element; viewport?: string },
    ): Response;
  }
}

const app = new Hono<HonoEnv>();

app.use(renderer);

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

app.use("/*", async (c, next) => {
  // ユーザーIDを持っていない場合、ユーザーIDを登録する。
  // 基本的に一人のユーザーにつき一つの部屋を持つことができる。
  const uid = getCookie(c, "uid");
  if (uid === undefined) {
    setCookie(c, "uid", crypto.randomUUID());
  }

  await next();
});

app.get("/manual", (c) => {
  return c.render(<Manual />, {
    head: <Link href="/src/components/server/style.css" rel="stylesheet" />,
  });
});

app.get("/", (c) => {
  const uid = getCookie(c, "uid");
  const roomPath = `/${uid}`;

  return c.redirect(roomPath);
});

// 絵チャの部屋
app.get("/:userId", (c) => {
  if (c.get("rateLimit") !== undefined) {
    c.status(429);

    return c.render(
      <h1 style="font-size: 42px;">
        アクセスが多く混雑しますので、現在あなたは使用できません。
      </h1>,
      { title: "エラー" },
    );
  }

  return c.render(
    <>
      <Script src="/src/components/client/room-app.tsx" />
      <div id="client-components" />
    </>,
    {
      head: <Link href="/src/components/client/style.css" rel="stylesheet" />,
      viewport:
        "width=device-width, height=device-height, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0",
    },
  );
});

// キャンバスの絵の情報のやりとりをするためのWebSocketエンドポイント
app.get("/:userId/ws", async (c) => {
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

  const userId = c.req.param("userId");
  const objId = c.env.CANVAS_ROOM.idFromName(userId);
  const room = c.env.CANVAS_ROOM.get(objId);

  return await room.fetch(c.req.raw);
});

export default app;
export { CanvasRoom, RateLimit };
