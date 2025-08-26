import { DurableObject } from "cloudflare:workers";

const MILLISECONDS_PER_REQUEST = 1;
const MILLISECONDS_FOR_UPDATES = 5000;
const CAPACITY = 300;

/**
 * 同じIPからのアクセス制限を行うためのレート制限オブジェクト。
 * 参考: https://developers.cloudflare.com/durable-objects/examples/build-a-rate-limiter/
 */
export class RateLimit extends DurableObject {
  // トークンバケット
  millisPerRequest: number = MILLISECONDS_PER_REQUEST;
  millisForUpdates: number = MILLISECONDS_FOR_UPDATES;
  capacity: number = CAPACITY;
  tokens: number = CAPACITY;

  async getMillisToNextRequest() {
    // 一定時間経過後にトークンを増加させるため、アラームを設定する。
    const currentAlarm = await this.ctx.storage.getAlarm();
    if (currentAlarm === null) {
      this.setAlarm();
    }

    // トークンがあれば、トークンを消費する。その時、レート制限はかからない。
    let millisToNextRequest = this.millisPerRequest;
    if (this.tokens > 0) {
      this.tokens -= 1;
      millisToNextRequest = 0; // トークンがあったなら、レート制限なしなので0。
    }

    return millisToNextRequest;
  }

  private async setAlarm() {
    this.ctx.storage.setAlarm(
      Date.now() + this.millisForUpdates * this.millisPerRequest,
    );
  }

  alarm(_alarmInfo?: AlarmInvocationInfo) {
    if (this.tokens < this.capacity) {
      // トークンを増加させる。
      this.tokens = Math.min(
        this.capacity,
        this.tokens + this.millisForUpdates,
      );

      this.setAlarm();
    }
  }
}
