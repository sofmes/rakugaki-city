import { Hono } from "hono";
import { renderer } from "./renderer";
import UITest from "./ui-test";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(renderer);

app.get("/", (c) => {
	const roomId = 0;

	return c.redirect(`/${roomId}`);
});

app.get("/ui-test", (c) => {
	return c.render(<UITest />);
});

app.get("/:roomId", (c) => {
	const roomId = c.req.param("roomId");

	return c.render(<h1>Room: {roomId}</h1>);
});

export default app;
