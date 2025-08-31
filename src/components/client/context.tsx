import { createContext } from "hono/jsx";
import type { CanvasState, RemoteCanvas } from "../../lib/client/session";

export const SessionContext = createContext<RemoteCanvas | null>(null);

export const ConnectionStateContext = createContext<CanvasState>("closed");
