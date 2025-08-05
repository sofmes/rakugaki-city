import { Hono } from "hono";
import { renderer } from "./renderer";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(renderer);

app.get("/", (c) => {
  const roomId = 0;

  return c.redirect(`/${roomId}`);
});

app.get("/ui-test", (c) => {
  return c.render(
    <>
      <script type="module" src="/src/ui-test.tsx"></script>
      <div id="client-components" />
    </>,
  );
});

app.get("/:roomId", (c) => {
  const roomId = c.req.param("roomId");

  return c.render(
    <div>
      <h1>Room: {roomId}</h1>
    </div>,
  );
});

export default app;
