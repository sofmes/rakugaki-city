import { useContext } from "hono/jsx";
import { SessionContext } from "./context";

/**
 * PCにおいて、右に表示されるボタン群を格納するボックス。
 */
export function UtilityBox() {
  const session = useContext(SessionContext);

  const reset = () => {
    if (!session) return;

    session.reset();
  };

  const undo = () => {
    if (!session) return;

    session.undo();
  };

  return (
    <div id="utilitybox">
      <button type="button" className="basebtn" onClick={reset}>
        <img
          src="/icons/trash-2.svg"
          alt="リセットアイコン"
          className="svg-icon"
        />
        <div style="margin-inline: auto;">リセット</div>
      </button>

      <button type="button" className="basebtn" onClick={undo} id="undo-button">
        <img
          src="/icons/undo-2.svg"
          alt="元に戻すアイコン"
          className="svg-icon"
          id="undo-icon"
        />
        <div style="margin-inline: auto;">元に戻す</div>
      </button>
    </div>
  );
}
