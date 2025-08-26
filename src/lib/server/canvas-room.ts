import { DurableObject } from "cloudflare:workers";
import type {
  PathData,
  Payload,
  PushPayload,
  RefreshPayload,
  ResetPayload,
  UndoPayload,
} from "../data";

/**
 * キャンバスがあるルームを表現する。
 */
export class CanvasRoom extends DurableObject {
  stack: PathData[] = [];

  async fetch(_request: Request): Promise<Response> {
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);

    // キャンバスの永続化を行うため、前回のデータの読み込みか初期化しておく。
    this.ctx.blockConcurrencyWhile(async () => {
      this.stack = (await this.ctx.storage.get("stack")) || [];
    });

    // 誰も部屋にいなくなってからしばらくしたら部屋は消える。
    // このため、新しい接続が来た時はアラームを削除しておく。
    if ((await this.ctx.storage.getAlarm()) !== null) {
      await this.ctx.storage.deleteAlarm();
    }

    // 101: Switching Protocols
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer,
  ): Promise<void> {
    if (message instanceof ArrayBuffer) {
      throw new Error("`ArrayBuffer`には対応していません。");
    }

    const payload: Payload = JSON.parse(message);

    switch (payload.type) {
      case "refresh_request":
        this.onRefreshRequest(ws);
        break;
      case "push":
        await this.push(ws, payload);
        break;
      case "undo": {
        await this.undo(ws, payload);
        break;
      }
      case "reset":
        await this.reset(ws, payload);
        break;
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    _reason: string,
    _wasClean: boolean,
  ): Promise<void> {
    ws.close(code);

    // 誰もいなくなってから10分したら部屋を消滅させたい。なので、アラームを設定する。
    if (this.ctx.getWebSockets().length === 0) {
      await this.ctx.storage.setAlarm(Date.now() + 1000 * 60 * 10);
    }
  }

  async alarm(_alarmInfo?: AlarmInvocationInfo): Promise<void> {
    // 10分間誰も接続しなかったため、消滅する。
    await this.ctx.storage.deleteAll();
  }

  onRefreshRequest(ws: WebSocket) {
    const payload: RefreshPayload = {
      type: "refresh",
      stack: this.stack,
    };

    ws.send(JSON.stringify(payload));
  }

  async push(ws: WebSocket, payload: PushPayload) {
    this.stack.push(payload.path);
    await this.ctx.storage.put("stack", this.stack);
    this.broadcast(payload, ws);
  }

  async undo(ws: WebSocket, payload: UndoPayload) {
    let requireReRender = false;

    for (const path of this.stack.toReversed()) {
      if (path.userId === payload.userId) {
        requireReRender = true;
        this.stack.pop();
        break;
      }
    }

    if (requireReRender) {
      await this.ctx.storage.put("stack", this.stack);
      this.broadcast(payload, ws);
    }
  }

  async reset(ws: WebSocket, payload: ResetPayload) {
    this.stack = [];
    await this.ctx.storage.put("stack", []);
    this.broadcast(payload, ws);
  }

  async broadcast(payload: Payload, exclude: WebSocket) {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== exclude) {
        ws.send(JSON.stringify(payload));
      }
    }
  }
}
