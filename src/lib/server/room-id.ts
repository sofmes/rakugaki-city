const ROOM_ID_PREFIX = "r1_";
const ROOM_ID_RANDOM_BYTES = 16;
const ROOM_ID_SIGNATURE_BYTES = 32;
const ROOM_ID_PAYLOAD_BYTES = ROOM_ID_RANDOM_BYTES + ROOM_ID_SIGNATURE_BYTES;

const DEVELOPMENT_ROOM_ID_SECRET = "rakugaki-city-development-room-id-secret";

/**
 * 部屋IDの署名に使う秘密値を取得する。
 */
export function getRoomIdSecret(
  env: { ROOM_ID_SECRET?: string },
  isDevelopment: boolean,
): string | null {
  if (env.ROOM_ID_SECRET !== undefined && env.ROOM_ID_SECRET !== "") {
    return env.ROOM_ID_SECRET;
  }

  if (isDevelopment) {
    return DEVELOPMENT_ROOM_ID_SECRET;
  }

  return null;
}

/**
 * サーバーが発行したことを検証できる不透明な部屋IDを作る。
 */
export async function createRoomId(secret: string): Promise<string> {
  const randomId = crypto.getRandomValues(new Uint8Array(ROOM_ID_RANDOM_BYTES));
  const signature = await signRoomId(randomId, secret);
  const payload = new Uint8Array(ROOM_ID_PAYLOAD_BYTES);

  payload.set(randomId, 0);
  payload.set(signature, ROOM_ID_RANDOM_BYTES);

  return `${ROOM_ID_PREFIX}${bytesToBase64Url(payload)}`;
}

/**
 * 部屋IDが現在の秘密値で発行されたものかを確認する。
 */
export async function verifyRoomId(
  roomId: string,
  secret: string,
): Promise<boolean> {
  if (!roomId.startsWith(ROOM_ID_PREFIX)) {
    return false;
  }

  const encodedPayload = roomId.slice(ROOM_ID_PREFIX.length);
  const payload = base64UrlToBytes(encodedPayload);
  if (payload === null || payload.length !== ROOM_ID_PAYLOAD_BYTES) {
    return false;
  }

  const randomId = payload.slice(0, ROOM_ID_RANDOM_BYTES);
  const signature = payload.slice(ROOM_ID_RANDOM_BYTES);
  const expectedSignature = await signRoomId(randomId, secret);

  return constantTimeEqual(signature, expectedSignature);
}

async function signRoomId(
  randomId: Uint8Array,
  secret: string,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    toArrayBuffer(randomId),
  );

  return new Uint8Array(signature);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);

  return buffer;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlToBytes(value: string): Uint8Array | null {
  const base64 = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  } catch {
    return null;
  }
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }

  return diff === 0;
}
