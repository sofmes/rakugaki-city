import type {
  Payload,
  PushPayload,
  RefreshPayload,
  ResetPayload,
  UndoPayload,
} from "../data";
import type { CanvasObjectModel } from "./canvas";

export class Session {
  constructor(
    public com: CanvasObjectModel,
    public readonly authorId: string,
    private readonly ws: WebSocket,
  ) {
    this.ws.addEventListener("message", (e) => {
      this.onPayload(JSON.parse(e.data));
    });

    this.ws.addEventListener("open", () => {
      console.log(1);
      this.sendPayload({ type: "refresh_request" });
    });
  }

  private onPayload(payload: Payload) {
    switch (payload.type) {
      case "refresh":
        this.onRefresh(payload);
        break;
      case "push":
        this.onPush(payload);
        break;
      case "undo":
        this.onUndo(payload);
        break;
      case "reset":
        this.onReset(payload);
        break;
    }
  }

  private onRefresh(payload: RefreshPayload) {
    this.com.refresh(payload.stack);
  }

  private onPush(payload: PushPayload) {
    this.com.push(payload.path);
  }

  private onUndo(_payload: UndoPayload) {
    this.com.undo();
  }

  private onReset(_payload: ResetPayload) {
    this.com.reset();
  }

  private sendPayload(payload: Payload) {
    console.log(payload);
    this.ws.send(JSON.stringify(payload));
  }

  setEraserMode(isEraserMode: boolean) {
    this.com.isEraserMode = isEraserMode;
  }

  setColor(color: string) {
    this.com.color = color;
  }

  paint(x: number, y: number) {
    this.com.paint(x, y);
  }

  presentPath() {
    const path = this.com.presentPath();
    if (!path) return;

    this.sendPayload({
      type: "push",
      authorId: this.authorId,
      path: path?.toData(),
    });
  }

  undo() {
    this.com.undo();

    this.sendPayload({
      type: "undo",
      authorId: this.authorId,
    });
  }

  reset() {
    this.com.reset();

    this.sendPayload({
      type: "reset",
      authorId: this.authorId,
    });
  }
}
