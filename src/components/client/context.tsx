import { createContext } from "hono/jsx";
import type { RemoteCanvas } from "../../lib/client/session";

export const SessionContext = createContext<RemoteCanvas | null>(null);
