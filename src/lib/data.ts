/**
 * 座標のデータ（xとy）
 */
export type Coord = [number, number];

/**
 * パスのデータ
 */
export interface PathData {
  points: Coord[];
  userId: string;
  color: string;
  size: number;
}

/**
 * 新しいパスの追加
 */
export interface PushPayload {
  type: "push";
  userId: string;
  path: PathData;
}

/**
 * 元に戻す
 */
export interface UndoPayload {
  type: "undo";
  userId: string;
}

/**
 * キャンバスリセット
 */
export interface ResetPayload {
  type: "reset";
  userId: string;
}

export interface RefreshRequestPayload {
  type: "refresh_request";
}

/**
 * 初回アクセス時に、現時点のキャンバスの状態をクライアントに渡すためのペイロード。
 */
export interface RefreshPayload {
  type: "refresh";
  stack: PathData[];
}

export type Payload =
  | PushPayload
  | UndoPayload
  | ResetPayload
  | RefreshRequestPayload
  | RefreshPayload;
