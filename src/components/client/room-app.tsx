import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import type { ConnectionState, Session } from "../../lib/client/session";
import { RemoteCanvas } from "./remote-canvas";
import { ConnectionStateContext, SessionContext } from "./context";
import { ToolBox } from "./tool-box";
import { UtilityBox } from "./utility-box";

const DEFAULT_COLOR = "blue" as const;

export default function RoomApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [connState, setConnState] = useState<ConnectionState>("closed");

  return (
    <>
      <header id="header">落書きシティ</header>
      <img id="logo" src="/sofume_logo.png" alt="落書きシティのロゴ" />

      <RemoteCanvas
        defaultColor={DEFAULT_COLOR}
        setSession={setSession}
        setConnState={setConnState}
      />

      <ConnectionStateContext.Provider value={connState}>
        <SessionContext.Provider value={session}>
          <div id="mainbox">
            <ToolBox />
            <UtilityBox />
          </div>
        </SessionContext.Provider>
      </ConnectionStateContext.Provider>
    </>
  );
}

const element = document.getElementById("client-components");
render(<RoomApp />, element as HTMLElement);
