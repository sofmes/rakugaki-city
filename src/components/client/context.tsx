import { createContext } from "hono/jsx";
import type { ConnectionState, Session } from "../../lib/client/session";

export const SessionContext = createContext<Session | null>(null);

export const ConnectionStateContext = createContext<ConnectionState>("closed");
