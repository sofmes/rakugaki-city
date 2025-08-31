import { createContext } from "hono/jsx";
import type { ConnectionState, RemoteCanvas } from "../../lib/client/session";

export const SessionContext = createContext<RemoteCanvas | null>(null);

export const ConnectionStateContext = createContext<ConnectionState>("closed");
