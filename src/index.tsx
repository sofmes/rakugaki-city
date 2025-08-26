import { Hono } from "hono";
import { CanvasRoom } from "./lib/server/canvas-room";
import { renderer } from "./renderer";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(renderer);

app.get("/", (c) => {
  console.log(c.env.CANVAS_ROOM);
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

app.get("/:roomId/ws", async (c) => {
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
export { CanvasRoom };
