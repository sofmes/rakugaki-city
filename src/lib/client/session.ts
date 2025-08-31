import type {
  Payload,
  PushPayload,
  RefreshPayload,
  ResetPayload,
  UndoPayload,
} from "../data";
import type { CanvasObjectModel } from "./canvas";
import { sleep } from "./utils";

export type ConnectionState = "closed" | "connecting" | "opened";

export class Session {
  conn: Connection;

  constructor(
    public com: CanvasObjectModel,
    public readonly userId: string,
    public readonly setState: (state: ConnectionState) => void,
  ) {
    this.conn = new Connection({
      onOpen: () => {
        setState("opened");
        this.conn.sendPayload({ type: "refresh_request" });
      },
      onClose: () => setState("closed"),
      onPayload: (p) => this.onPayload(p),
    });
    this.conn.connect();
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

  private onUndo(payload: UndoPayload) {
    this.com.undo({ userId: payload.userId });
  }

  private onReset(_payload: ResetPayload) {
    this.com.reset();
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

    this.conn.sendPayload({
      type: "push",
      userId: this.userId,
      path: path?.toData(),
    });
  }

  undo() {
    this.conn.sendPayload({
      type: "undo",
      userId: this.userId,
    });

    this.com.undo();
  }

  reset() {
    this.conn.sendPayload({
      type: "reset",
      userId: this.userId,
    });

    this.com.reset();
  }
}

export class Connection {
  private readonly backoff: ExponentialBackoff;
  private url: string;
  private ws: WebSocket | null = null;

  constructor(
    private readonly callbacks: {
      onOpen: () => void;
      onClose: () => void;
      onPayload: (payload: Payload) => void;
    },
  ) {
    this.backoff = new ExponentialBackoff(100);

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    this.url = `${protocol}//${location.host}${location.pathname}/ws`;
  }

  async connect() {
    if (this.ws !== null) throw new Error("既に接続しています。");
    console.log("接続中...");

    // バグやサーバーダウンで再接続を連続して行った際、サーバーに負荷をかけぬようバックオフする。
    await this.backoff.try();

    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      // 失敗したなら、もう一度。
      this.connect();
      throw e;
    }

    this.ws.addEventListener("message", (e) => {
      this.callbacks.onPayload(JSON.parse(e.data));
    });

    this.ws.addEventListener("error", () => {
      console.warn("WebSocketの通信中にエラーが発生しました。再接続をします。");
      this.close();
    });

    this.ws.addEventListener("close", (e) => {
      console.log("切断されました。際接続します。", e.code, e.reason);
      this.ws = null;
      this.callbacks.onClose();

      this.connect();
    });

    this.ws.addEventListener("open", () => {
      console.log("接続しました。");
      this.callbacks.onOpen();
    });
  }

  async reconnect() {
    if (this.ws !== null) {
      this.close();
    }

    await this.connect();
  }

  close() {
    if (this.ws === null) throw new Error("既に接続は終了しています。");

    this.ws.close(1000, "reconnect");
    this.ws = null;
  }

  sendPayload(payload: Payload) {
    if (this.ws !== null) {
      console.debug("ペイロード送信", payload);
      this.ws.send(JSON.stringify(payload));
    }
  }
}

/**
 * 再接続処理を行う際に、バグで連続して再接続してサーバーに負荷をかけぬよう、
 * 指数関数的バックオフで少し待機してから接続するのに使うクラス。
 */
class ExponentialBackoff {
  public attempt: number;

  constructor(public baseDelay: number) {
    this.attempt = 0;
  }

  async try() {
    const delay = Math.random() * this.baseDelay * 2 ** this.attempt;
    console.debug(`指数関数的バックオフ: ${delay}`);
    await sleep(delay);

    this.attempt += 1;
  }
}

// 再接続処理をViteを落としてテストしようとすると、Viteの再起動後に勝手に全体のリロードが行われる。
// それでは再接続処理のテストができないので、それを防ぐコード。テスト時のみコメントアウトを外す。
// 参考: https://github.com/vitejs/vite/issues/5675#issuecomment-3190893535
// import.meta.hot.on("vite:ws:disconnect", () => {
//   throw new Error();
// });
