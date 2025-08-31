import { createContext } from "hono/jsx";
import type { Session } from "../../lib/client/session";

export const SessionContext = createContext<Session | null>(null);
