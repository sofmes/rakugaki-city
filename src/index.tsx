import { type Env, Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { JSX } from "hono/jsx/jsx-runtime";
import { Link, Script } from "vite-ssr-components/hono";
import Home from "./components/server/home";
import Manual from "./components/server/manual";
import { CanvasRoom } from "./lib/server/canvas-room";
import { RateLimit } from "./lib/server/rate-limit";
import {
  createRoomId,
  getRoomIdSecret,
  verifyRoomId,
} from "./lib/server/room-id";
import { renderer } from "./renderer";

interface HonoBindings extends CloudflareBindings {
  PRODUCTION_MODE?: boolean;
  ROOM_ID_SECRET?: string;
}

interface HonoEnv extends Env {
  Bindings: HonoBindings;
  Variables: {
    roomId: string;
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

const ROOM_ID_COOKIE_NAME = "room_id";

function getRoomCookieOptions() {
  return {
    path: "/",
    sameSite: "Lax" as const,
    secure: !import.meta.env.DEV,
    httpOnly: true,
  };
}

function getSecretOrError(env: HonoEnv["Bindings"]): string | Response {
  const secret = getRoomIdSecret(env, import.meta.env.DEV);

  if (secret === null) {
    return new Response("部屋IDの署名鍵が設定されていません。", {
      status: 500,
    });
  }

  return secret;
}

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

// 部屋IDを持っていない場合に、署名付きの部屋IDを発行するミドルウェア。
app.use(async (c, next) => {
  const secret = getSecretOrError(c.env);
  if (secret instanceof Response) return secret;

  let roomId = getCookie(c, ROOM_ID_COOKIE_NAME);

  if (roomId === undefined || !(await verifyRoomId(roomId, secret))) {
    roomId = await createRoomId(secret);
    setCookie(c, ROOM_ID_COOKIE_NAME, roomId, getRoomCookieOptions());
  }

  deleteCookie(c, "uid", { path: "/" });
  c.set("roomId", roomId);

  await next();
});

app.get("/manual", (c) => {
  return c.render(<Manual />, {
    head: <Link href="/src/components/server/style.css" rel="stylesheet" />,
  });
});

app.get("/", (c) => {
  const roomPath = `/${c.var.roomId}`;

  return c.render(<Home ownRoomPath={roomPath} />, {
    head: <Link href="/src/components/server/style.css" rel="stylesheet" />,
  });
});

// 絵チャの部屋
app.get("/:roomId", async (c) => {
  if (c.get("rateLimit") !== undefined) {
    c.status(429);

    return c.render(
      <h1 style="font-size: 42px;">
        アクセスが多く混雑しますので、現在あなたは使用できません。
      </h1>,
      { title: "エラー" },
    );
  }

  const roomId = c.req.param("roomId");
  const secret = getSecretOrError(c.env);
  if (secret instanceof Response) return secret;

  if (!(await verifyRoomId(roomId, secret))) {
    return c.redirect("/");
  }

  return c.render(
    <>
      <Script src="/src/components/client/room-app.tsx" />
      <div
        id="client-components"
        data-own-room-id={c.var.roomId}
        data-room-id={roomId}
      />
    </>,
    {
      head: <Link href="/src/components/client/style.css" rel="stylesheet" />,
      viewport:
        "width=device-width, height=device-height, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0",
    },
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
  const secret = getSecretOrError(c.env);
  if (secret instanceof Response) return secret;

  if (!(await verifyRoomId(roomId, secret))) {
    return new Response("無効な部屋IDです。", { status: 403 });
  }

  const objId = c.env.CANVAS_ROOM.idFromName(roomId);
  const room = c.env.CANVAS_ROOM.get(objId);

  return await room.fetch(c.req.raw);
});

export default app;
export { CanvasRoom, RateLimit };
