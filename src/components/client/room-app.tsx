import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import type { ConnectionState, RemoteCanvas } from "../../lib/client/session";
import { ConnectionStateContext, SessionContext } from "./context";
import { RemoteCanvasUI } from "./remote-canvas";
import { ToolBox } from "./tool-box";
import { UtilityBox } from "./utility-box";

const DEFAULT_COLOR = "blue" as const;

export default function RoomApp() {
  const [canvas, setCanvas] = useState<RemoteCanvas | null>(null);
  const [connState, setConnState] = useState<ConnectionState>("closed");

  return (
    <>
      <header id="header">落書きシティ</header>
      <img id="logo" src="/sofume_logo.png" alt="落書きシティのロゴ" />

      <RemoteCanvasUI
        defaultColor={DEFAULT_COLOR}
        setRemoteCanvas={setCanvas}
        setConnState={setConnState}
      />

      <ConnectionStateContext.Provider value={connState}>
        <SessionContext.Provider value={canvas}>
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
