import { useEffect, useRef } from "hono/jsx";

export default function Canvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvasRef.current)
			throw new Error("キャンバスの取得ができませんでした。");

		const ctx = canvasRef.current.getContext("2d");
		if (!ctx) throw new Error("キャンバスのContextの取得に失敗しました。");

		new CanvasController(ctx);
	});

	return <canvas ref={canvasRef} style="width: 40vw; height: 40vw;" />;
}

class CanvasController {
	constructor(private readonly ctx: CanvasRenderingContext2D) {}
}
