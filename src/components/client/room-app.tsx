import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import type { RemoteCanvas } from "../../lib/client/session";
import { SessionContext } from "./context";
import { RemoteCanvasUI } from "./remote-canvas";
import { ToolBox } from "./tool-box";
import { UtilityBox } from "./utility-box";

const DEFAULT_COLOR = "blue" as const;

interface RoomAppProps {
  ownRoomId: string;
  roomId: string;
}

export default function RoomApp({ ownRoomId, roomId }: RoomAppProps) {
  const [canvas, setCanvas] = useState<RemoteCanvas | null>(null);
  const ownRoomPath = `/${ownRoomId}`;
  const shouldShowOwnRoomLink = ownRoomId !== "" && ownRoomId !== roomId;

  return (
    <>
      <header id="header">
        <a id="header-title" href="/">
          落書きシティ
        </a>

        {shouldShowOwnRoomLink && (
          <a id="own-room-link" href={ownRoomPath}>
            自分の部屋を開く
          </a>
        )}
      </header>
      <img id="logo" src="/sofume_logo.png" alt="落書きシティのロゴ" />

      <RemoteCanvasUI
        defaultColor={DEFAULT_COLOR}
        ownRoomId={ownRoomId}
        setRemoteCanvas={setCanvas}
      />

      <SessionContext.Provider value={canvas}>
        <div id="mainbox">
          <ToolBox />
          <UtilityBox />
        </div>
      </SessionContext.Provider>
    </>
  );
}

const element = document.getElementById("client-components");
const ownRoomId = element?.dataset.ownRoomId ?? "";
const roomId = element?.dataset.roomId ?? "";

render(
  <RoomApp ownRoomId={ownRoomId} roomId={roomId} />,
  element as HTMLElement,
);
